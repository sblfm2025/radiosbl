import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, MapPin, Clock3, CheckCircle2, UploadCloud, Cloud, BadgeCheck, X } from "lucide-react";
import { getCurrentPosition, distanceInMeters, type GeoPoint } from "../utils/geolocation";
import { validateFile, moduleFileRules } from "../utils/fileValidation";
import type { AuthSession } from "../services/auth.service";
import {
  buildAttendanceRecordDraft,
  checkInWithSelfie,
  getTodayAttendance,
  checkOut
} from "../services/attendance.service";
import type { AttendanceRecord } from "../types/domain";
import { findAnnouncerProfile } from "../utils/announcerResolver";
import { analyzeAttendancePhoto } from "../services/gemini.service";
import { useCurrentBroadcastSlot } from "../hooks/useCurrentBroadcastSlot";

const officeCenter: GeoPoint = { latitude: -3.8112091495447213, longitude: 119.65144231962896 };
const officeRadiusMeters = 100;

export function AttendancePage({
  session,
  onAttendanceRecorded
}: {
  data: any; // Menambahkan akses ke dashboard data (termasuk weeklySchedule)
  session: AuthSession | null;
  onAttendanceRecorded?: () => void;
}) {
  const [fileError, setFileError] = useState("");
  const [checking, setChecking] = useState(false);
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [recordStatus, setRecordStatus] = useState("");
  const [selfieDriveFileId, setSelfieDriveFileId] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<{ isValid: boolean; description: string; greeting?: string } | null>(null);
  
  const [attendanceType, setAttendanceType] = useState<"present" | "sick" | "leave" | "out_of_office">("present");
  const [outOfOfficeReason, setOutOfOfficeReason] = useState("");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  
  useEffect(() => {
    if (session) {
      getTodayAttendance(session.user.id).then(setTodayRecord);
    }
  }, [session]);
  
  // Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const currentSlot = useCurrentBroadcastSlot(); // Mengambil info siaran saat ini

  const distance = position ? distanceInMeters(position, officeCenter) : null;

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  async function handleStartCamera() {
    setFileError("");
    setRecordStatus("");

    if (["sick", "leave", "out_of_office"].includes(attendanceType) && !outOfOfficeReason.trim()) {
      setFileError("Mohon isi catatan tambahan terlebih dahulu.");
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'granted') {
          openCamera();
        } else if (result.state === 'denied') {
          setFileError("Akses lokasi diblokir. Mohon izinkan akses lokasi dari pengaturan browser Anda.");
        } else {
          setShowLocationPrompt(true);
        }
      } catch (err) {
        setShowLocationPrompt(true);
      }
    } else {
      setShowLocationPrompt(true);
    }
  }

  function handleAllowLocation() {
    setShowLocationPrompt(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => { openCamera(); },
        () => { setFileError("Gagal mendapatkan lokasi. Pastikan GPS aktif dan diizinkan pada browser."); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      openCamera();
    }
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      setIsCameraOpen(true);
      // Wait for React to render video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      setFileError("Gagal mengakses kamera. Pastikan izin kamera diberikan pada browser Anda.");
    }
  }

  async function captureAndSubmit() {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to Blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setFileError("Gagal mengambil gambar dari kamera.");
        return;
      }
      
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
      stopCamera();
      setIsCameraOpen(false);
      
      // Proceed with submit
      await processCheckIn(file);
    }, "image/jpeg", 0.85);
  }

  async function processCheckIn(selfieFile: File) {
    setRecordStatus("");

    const validation = validateFile(selfieFile, moduleFileRules.attendance);
    if (!validation.valid) {
      setFileError(validation.reason);
      return;
    }

    try {
      setChecking(true);
      setFileError("");
      
      // Step 1: Geolocation & Info Inisialisasi
      const currentPosition = await getCurrentPosition();
      setPosition(currentPosition);

      // Step 2: AI Vision Validation
      const userId = session?.user.id ?? "demo-user";
      const displayName = session?.user.displayName ?? "Staf";
      const airName = findAnnouncerProfile(displayName)?.airName;
      
      const aiResult = await analyzeAttendancePhoto(selfieFile, airName || displayName);
      setAiAnalysis(aiResult);

      if (!aiResult.isValid && attendanceType === "present") {
        setFileError(`AI Menolak Foto: ${aiResult.reason || "Tidak valid"}`);
        // Kami tidak melakukan return di sini.
        // Absen akan tetap dicatat ke Firestore (dengan status "rejected")
        // agar admin dapat membaca log-nya di halaman Laporan Absensi.
      }

      // Step 3: Schedule Sync & Delay Logic
      const dist = distanceInMeters(currentPosition, officeCenter);
      if (dist <= officeRadiusMeters) {
        const isCurrentProgramActive = currentSlot.title !== "Playlist" && currentSlot.title !== "Offline";
        if (isCurrentProgramActive) {
          const isMyTurn = currentSlot.announcer.toLowerCase().includes(displayName.toLowerCase()) || 
                           (airName && currentSlot.announcer.includes(airName));
          if (isMyTurn) {
            console.log(`Penyiar ${displayName} absen untuk program ${currentSlot.title}`);
          }
        }
      }

      const payloadParams = {
        userId,
        displayName,
        airName,
        position: currentPosition,
        officeCenter,
        radiusMeters: officeRadiusMeters,
        aiVerificationText: aiResult.description,
        isAiValid: aiResult.isValid,
        clientTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
        outOfOfficeReason: outOfOfficeReason.trim() || undefined,
        attendanceType
      };

      const result = await checkInWithSelfie({
        ...payloadParams,
        selfieFile
      });
      const draft = buildAttendanceRecordDraft({
        ...payloadParams,
        selfieDriveFileId: result.selfieDriveFileId
      });

      setSelfieDriveFileId(result.selfieDriveFileId);
      const isRejected = draft.status === "rejected";
      const isOutside = draft.status === "outside_radius" || draft.status === "needs_review";
      
      setRecordStatus(
        draft.status === "present"
          ? "Absensi valid berhasil dikonfirmasi ke pusat."
          : isRejected 
            ? "Foto Anda tidak valid, namun data telah diteruskan ke Admin."
            : isOutside
              ? "Absen di luar radius studio, mohon tunggu validasi Admin."
              : `Absensi terkirim dengan status khusus.`
      );
      setTodayRecord({ ...draft, id: result.attendanceRecordId } as AttendanceRecord);
      onAttendanceRecorded?.();
    } catch (currentError) {
      setRecordStatus("");
      const errorMsg = currentError instanceof Error ? currentError.message : String(currentError);
      const lowerError = errorMsg.toLowerCase();
      
      let userFriendlyError = "Sistem mengalami kendala. Silakan muat ulang dan coba lagi.";
      
      if (lowerError.includes("failed to fetch") || lowerError.includes("network") || lowerError.includes("offline")) {
        userFriendlyError = "Koneksi internet terputus. Mohon periksa jaringan seluler atau WiFi Anda.";
      } else if (lowerError.includes("permission denied") || lowerError.includes("insufficient")) {
        userFriendlyError = "Akses ditolak. Akun Anda mungkin belum memiliki hak akses absensi.";
      } else if (lowerError.includes("invalid data") || lowerError.includes("unsupported field") || lowerError.includes("adddoc")) {
        userFriendlyError = "Terdapat masalah pada kelengkapan format data profil Anda.";
      } else if (lowerError.includes("quota")) {
        userFriendlyError = "Batas penggunaan database harian telah habis. Lapor ke Administrator.";
      } else if (lowerError.includes("api key") || lowerError.includes("auth")) {
        userFriendlyError = "Kredensial keamanan tidak valid. Silakan login ulang.";
      } else if (errorMsg) {
        // Jika error mengandung tanda kurung fungsi atau nama teknis, sembunyikan.
        if (errorMsg.includes("()") || errorMsg.includes("firebase") || errorMsg.includes("Firestore")) {
           userFriendlyError = "Terjadi kegagalan sinkronisasi dengan server database.";
        } else {
           // Jika error sudah dari validasi kita sendiri (seperti "File upload harus berupa Blob")
           userFriendlyError = errorMsg;
        }
      }

      setFileError(userFriendlyError);
    } finally {
      setChecking(false);
    }
  }

  async function handleCheckOut() {
    if (!todayRecord) return;
    try {
      setCheckingOut(true);
      await checkOut(todayRecord.id);
      setTodayRecord({ ...todayRecord, checkOutAt: new Date().toISOString() });
      setRecordStatus("Terima kasih! Absen pulang berhasil dikonfirmasi.");
    } catch (err) {
      alert("Gagal melakukan check-out. Coba lagi.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="schedule-page" style={{ paddingBottom: "100px" }}>
      {/* LOCATION PROMPT MODAL */}
      {showLocationPrompt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "24px", width: "100%", maxWidth: "340px", padding: "32px 24px", textAlign: "center", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", animation: "fadeSlideUp 0.3s ease-out" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(22, 119, 237, 0.1)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={40} color="var(--blue)" />
            </div>
            <h3 style={{ margin: "0 0 12px", color: "var(--ink)", fontSize: "1.2rem", fontWeight: 800 }}>
              Sistem Membutuhkan Akses Lokasi Anda
            </h3>
            <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Demi keamanan dan validitas kehadiran Staf Radio SBL, apakah Anda mengizinkan pemberian akses lokasi ke sistem absensi cerdas ini?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setShowLocationPrompt(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "99px", background: "white", border: "2px solid var(--blue)", color: "var(--blue)", fontWeight: 800, cursor: "pointer" }}
              >
                Tolak
              </button>
              <button 
                onClick={handleAllowLocation}
                style={{ flex: 1, padding: "14px", borderRadius: "99px", background: "var(--blue)", border: "2px solid var(--blue)", color: "white", fontWeight: 800, cursor: "pointer" }}
              >
                Izinkan
              </button>
            </div>
            <p style={{ margin: "20px 0 0", color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.4 }}>
              *Setelah menekan 'Izinkan', mohon berikan izin ('Allow') pada popup notifikasi bawaan browser Anda.
            </p>
          </div>
        </div>
      )}

      {/* CAMERA MODAL */}
      {isCameraOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "absolute", top: 0, zIndex: 10 }}>
            <span style={{ color: "white", fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>Ambil Foto Kehadiran</span>
            <button onClick={() => { stopCamera(); setIsCameraOpen(false); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={24} />
            </button>
          </div>
          
          <div style={{ flex: 1, width: "100%", position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} // Mirror effect
            />
          </div>
          
          <canvas ref={canvasRef} style={{ display: "none" }} />
          
          <div style={{ position: "absolute", bottom: "40px", width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", padding: "20px 30px", borderRadius: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "white", fontSize: "0.9rem", fontWeight: 700 }}>Arahkan wajah Anda ke kamera</span>
              <button 
                onClick={captureAndSubmit}
                style={{ width: "72px", height: "72px", borderRadius: "50%", background: "white", border: "6px solid rgba(22, 119, 237, 0.5)", cursor: "pointer", boxShadow: "0 8px 32px rgba(22, 119, 237, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              >
                <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "var(--blue)" }}></div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="schedule-page-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "16px" }}>
        <div className="schedule-title-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Radio SBL Attendance</p>
            <h1>Absensi Cerdas</h1>
          </div>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
          Pilih status kehadiran Anda. Sistem AI akan menganalisa foto dan lokasi secara otomatis.
        </p>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div style={{ background: "white", borderRadius: "32px", padding: "24px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)", marginBottom: "24px" }}>
          
          {todayRecord ? (
            todayRecord.checkOutAt ? (
              <div style={{ background: "#ecfdf5", padding: "32px 24px", borderRadius: "20px", textAlign: "center", color: "#059669", border: "1px solid #a7f3d0" }}>
                <CheckCircle2 size={48} style={{ margin: "0 auto 16px" }} />
                <h3 style={{ margin: "0 0 8px", fontSize: "1.4rem", fontWeight: 900 }}>Absen Lengkap</h3>
                <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Terima kasih! Anda sudah Check-in dan Check-out hari ini.</p>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ background: "#eef5ff", color: "var(--blue)", padding: "16px", borderRadius: "16px", marginBottom: "24px", fontWeight: 800 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.9rem", color: "var(--muted)" }}>Status Hari Ini</p>
                  <p style={{ margin: 0, fontSize: "1.1rem" }}>✅ Sudah Check-in</p>
                </div>
                <button 
                  onClick={handleCheckOut} 
                  disabled={checkingOut} 
                  style={{ width: "100%", padding: "18px", borderRadius: "99px", background: checkingOut ? "var(--muted)" : "#f59e0b", color: "white", border: "none", fontWeight: 800, fontSize: "1.05rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: checkingOut ? "not-allowed" : "pointer", boxShadow: checkingOut ? "none" : "0 8px 24px rgba(245, 158, 11, 0.25)", transition: "all 0.3s" }}
                >
                  {checkingOut ? <div className="spinner-small" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }}></div> : <Clock3 size={22} />}
                  {checkingOut ? "Menyimpan Data..." : "Absen Pulang (Check-out)"}
                </button>
              </div>
            )
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
                {[
                  { id: "present", label: "Hadir / Di Kantor", color: "#11a36a", bg: "rgba(17, 163, 106, 0.1)" },
                  { id: "sick", label: "Sakit", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
                  { id: "leave", label: "Izin", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
                  { id: "out_of_office", label: "Tugas Luar", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" }
                ].map((type) => {
                  const isActive = attendanceType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => { setAttendanceType(type.id as any); setOutOfOfficeReason(""); }}
                      style={{
                        flex: "1 1 calc(50% - 12px)",
                        padding: "16px 14px",
                        borderRadius: "18px",
                        border: isActive ? `2px solid ${type.color}` : "2px solid transparent",
                        background: isActive ? type.bg : "#f1f3f5",
                        color: isActive ? type.color : "var(--muted)",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: isActive ? `0 4px 12px ${type.bg}` : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>

              {["sick", "leave", "out_of_office"].includes(attendanceType) && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--ink)", fontWeight: 800, fontSize: "0.9rem" }}>
                    Catatan Tambahan (Wajib)
                  </label>
                  <textarea
                    value={outOfOfficeReason}
                    onChange={(e) => setOutOfOfficeReason(e.target.value)}
                    placeholder={
                      attendanceType === "sick" ? "Contoh: Sakit demam, surat keterangan dokter menyusul..." :
                      attendanceType === "leave" ? "Contoh: Izin ada keperluan keluarga darurat..." :
                      "Deskripsikan lokasi liputan Anda..."
                    }
                    style={{ width: "100%", padding: "14px", borderRadius: "16px", border: "2px solid rgba(22, 119, 237, 0.15)", outline: "none", fontSize: "0.95rem", minHeight: "100px", resize: "vertical", background: "rgba(22, 119, 237, 0.02)", color: "var(--ink)" }}
                  />
                </div>
              )}

              {fileError && (
                <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", padding: "12px 16px", borderRadius: "12px", marginBottom: "16px", color: "#b91c1c", fontSize: "0.9rem", fontWeight: 700, lineHeight: 1.4, display: "flex", alignItems: "center", gap: "10px" }}>
                  <X size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>{fileError}</span>
                </div>
              )}
              
              <button 
                onClick={handleStartCamera} 
                disabled={checking} 
                style={{ width: "100%", padding: "18px", borderRadius: "99px", background: checking ? "var(--muted)" : "#1677ED", color: "white", border: "none", fontWeight: 800, fontSize: "1.05rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: checking ? "not-allowed" : "pointer", boxShadow: checking ? "none" : "0 8px 24px rgba(22, 119, 237, 0.25)", transition: "all 0.3s" }}
              >
                {checking ? <div className="spinner-small" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }}></div> : <Camera size={22} />}
                {checking ? "Memeriksa & Menganalisa..." : "Mulai Kamera Smart"}
              </button>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Lokasi Card */}
          <div style={{ background: "white", borderRadius: "24px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(12, 36, 70, 0.03)" }}>
            <MapPin size={24} color="var(--blue)" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "var(--ink)", fontSize: "1.05rem", marginBottom: "4px", fontWeight: 800 }}>
                {distance === null
                  ? "Satelit belum dilacak"
                  : distance <= officeRadiusMeters
                    ? "Radius studio valid"
                    : "Di luar radius studio"}
              </strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span>
                  {distance === null
                    ? `Batas kantor ${officeRadiusMeters}m`
                    : `${Math.round(distance)} meter dari titik kantor`}
                </span>
                {position?.accuracy && (
                  <span style={{ color: position.accuracy <= 30 ? "#11a36a" : position.accuracy <= 100 ? "#f59e0b" : "#ef4444", fontWeight: 700, fontSize: "0.8rem" }}>
                    Akurasi Satelit (GPS): ±{Math.round(position.accuracy)}m
                  </span>
                )}
              </span>
            </div>
            {distance !== null && distance <= officeRadiusMeters && <BadgeCheck size={20} color="#11a36a" />}
          </div>

          {/* AI Vision Card (Hidden Header & Log) */}
          <div style={{ background: "white", borderRadius: "24px", padding: aiAnalysis?.greeting ? "24px 20px" : "16px 20px", display: "flex", alignItems: "flex-start", gap: "16px", boxShadow: "0 4px 20px rgba(12, 36, 70, 0.03)" }}>
            <BadgeCheck size={24} color={aiAnalysis?.isValid ? "#11a36a" : "var(--muted)"} style={{ marginTop: aiAnalysis?.greeting ? "4px" : "0" }} />
            <div style={{ flex: 1 }}>
              {aiAnalysis?.greeting ? (
                <div style={{ background: "linear-gradient(135deg, #f4f9ff 0%, #e6f0fa 100%)", padding: "18px 20px", borderRadius: "24px", borderTopLeftRadius: "4px", color: "#1e293b", fontWeight: 500, fontSize: "0.95rem", lineHeight: 1.6 }}>
                  {aiAnalysis.greeting.replace(/^["']|["']$/g, '')}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", height: "24px" }}>
                  <span style={{ color: "var(--muted)", fontSize: "0.95rem", fontWeight: 500 }}>
                    Identifikasi visual aktif dan siap digunakan.
                  </span>
                </div>
              )}
            </div>
            {aiAnalysis?.isValid && <CheckCircle2 size={20} color="#11a36a" style={{ marginTop: aiAnalysis?.greeting ? "4px" : "0" }} />}
          </div>

          {/* Check-in Status Card */}
          <div style={{ background: "white", borderRadius: "24px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(12, 36, 70, 0.03)" }}>
            <Clock3 size={24} color="var(--blue)" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "var(--ink)", fontSize: "1.05rem", marginBottom: "4px", fontWeight: 800 }}>Status Transmisi</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{recordStatus || "Siap menerima data."}</span>
            </div>
            {recordStatus && <CheckCircle2 size={20} color="#11a36a" />}
          </div>

          {/* Drive Metadata Card */}
          <div style={{ background: "white", borderRadius: "24px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(12, 36, 70, 0.03)" }}>
            <UploadCloud size={24} color="var(--blue)" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "var(--ink)", fontSize: "1.05rem", marginBottom: "4px", fontWeight: 800 }}>Penyimpanan Eksternal</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem", wordBreak: "break-all" }}>
                {selfieDriveFileId || "Menunggu foto tersimpan di sistem."}
              </span>
            </div>
            <Cloud size={20} color="var(--muted)" />
          </div>
        </div>

      </div>
    </div>
  );
}

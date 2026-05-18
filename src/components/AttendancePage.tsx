import { useState, useRef, useCallback, useEffect } from "react";
import { AlertCircle, Camera, MapPin, Clock3, CheckCircle2, UploadCloud, Cloud, BadgeCheck, X } from "lucide-react";
import { getCurrentPosition, distanceInMeters, type GeoPoint } from "../utils/geolocation";
import { validateFile, moduleFileRules } from "../utils/fileValidation";
import type { AuthSession } from "../services/auth.service";
import {
  ATTENDANCE_SELFIE_UPLOAD_EVENT,
  type AttendanceSelfieUploadEventDetail,
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
type AttendanceType = "present" | "sick" | "leave" | "out_of_office";

function getAttendanceTypeLabel(type: AttendanceType | AttendanceRecord["status"]): string {
  switch (type) {
    case "sick":
      return "Sakit";
    case "leave":
      return "Izin";
    case "out_of_office":
      return "Tugas luar";
    case "outside_radius":
      return "Di luar radius";
    case "needs_review":
      return "Perlu ditinjau";
    case "rejected":
      return "Perlu validasi admin";
    default:
      return "Hadir";
  }
}

function getSelfieStatusLabel(status: "idle" | "pending" | "uploaded" | "failed"): string {
  switch (status) {
    case "uploaded":
      return "Selfie tersimpan";
    case "pending":
      return "Selfie diunggah";
    case "failed":
      return "Upload selfie gagal";
    default:
      return "Menunggu selfie";
  }
}

export function AttendancePage({
  session,
  onAttendanceRecorded
}: {
  data: unknown;
  session: AuthSession | null;
  onAttendanceRecorded?: () => void;
}) {
  const [fileError, setFileError] = useState("");
  const [checking, setChecking] = useState(false);
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [recordStatus, setRecordStatus] = useState("");
  const [selfieDriveFileId, setSelfieDriveFileId] = useState("");
  const [selfieUploadStatus, setSelfieUploadStatus] = useState<"idle" | "pending" | "uploaded" | "failed">("idle");
  const [uploadNotice, setUploadNotice] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<{ isValid: boolean; description: string; greeting?: string } | null>(null);
  
  const [attendanceType, setAttendanceType] = useState<AttendanceType>("present");
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
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAttendanceRecordIdRef = useRef<string | null>(null);
  
  const currentSlot = useCurrentBroadcastSlot(); // Mengambil info siaran saat ini

  const distance = position ? distanceInMeters(position, officeCenter) : null;
  const hasCheckedIn = Boolean(todayRecord);
  const hasCheckedOut = Boolean(todayRecord?.checkOutAt);
  const attendanceStatusTitle = hasCheckedOut
    ? "Tugas hari ini selesai"
    : hasCheckedIn
      ? "Sudah absen masuk"
      : "Belum absen hari ini";
  const attendanceStatusDescription = hasCheckedOut
    ? "Check-in dan check-out sudah tercatat."
    : hasCheckedIn
      ? "Silakan check-out setelah tugas selesai."
      : "Pilih status, ambil selfie, lalu izinkan lokasi.";
  const locationStatusTitle = distance === null
    ? "Lokasi belum dicek"
    : distance <= officeRadiusMeters
      ? "Radius studio valid"
      : "Di luar radius studio";
  const locationStatusDescription = distance === null
    ? `Batas kantor ${officeRadiusMeters} meter.`
    : `${Math.round(distance)} meter dari titik kantor${position?.accuracy ? `, akurasi +/-${Math.round(position.accuracy)}m` : ""}.`;
  const selfieStatusTitle = getSelfieStatusLabel(selfieUploadStatus);
  const selfieStatusDescription = selfieUploadStatus === "failed"
    ? "Absensi tetap tercatat, bukti selfie perlu ditinjau."
    : selfieUploadStatus === "uploaded"
      ? "Bukti selfie sudah aman tersimpan."
      : selfieUploadStatus === "pending"
        ? "Upload berlangsung di latar belakang."
        : "Selfie akan diminta saat absen masuk.";

  useEffect(() => {
    notificationAudioRef.current = new Audio("/notifikasi.mp3");
    notificationAudioRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    function handleSelfieUpload(event: Event) {
      const detail = (event as CustomEvent<AttendanceSelfieUploadEventDetail>).detail;
      if (!detail || detail.attendanceRecordId !== activeAttendanceRecordIdRef.current) {
        return;
      }

      setSelfieUploadStatus(detail.selfieUploadStatus);
      setSelfieDriveFileId(detail.selfieDriveFileId);
      setTodayRecord((current) =>
        current
          ? {
              ...current,
              selfieDriveFileId: detail.selfieDriveFileId,
              selfieUploadStatus: detail.selfieUploadStatus,
              selfieUploadError: detail.selfieUploadError || ""
            }
          : current
      );

      if (detail.selfieUploadStatus === "uploaded") {
        setUploadNotice("Bukti selfie berhasil tersimpan. Sisa menunggu absen pulang.");
        void notificationAudioRef.current?.play().catch(() => {});
      } else if (detail.selfieUploadStatus === "failed") {
        setUploadNotice("Absensi sudah tercatat, tetapi bukti selfie belum berhasil tersimpan.");
      }
    }

    window.addEventListener(ATTENDANCE_SELFIE_UPLOAD_EVENT, handleSelfieUpload);
    return () => window.removeEventListener(ATTENDANCE_SELFIE_UPLOAD_EVENT, handleSelfieUpload);
  }, []);

  useEffect(() => {
    activeAttendanceRecordIdRef.current = todayRecord?.id ?? null;
    if (todayRecord?.selfieUploadStatus) {
      setSelfieUploadStatus(todayRecord.selfieUploadStatus);
    }
    if (todayRecord?.selfieDriveFileId) {
      setSelfieDriveFileId(todayRecord.selfieDriveFileId);
    }
  }, [todayRecord]);

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
      } catch {
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
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 720 },
          height: { ideal: 960 },
          aspectRatio: { ideal: 0.75 }
        },
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
      const airName =
        session?.user.airName ||
        session?.user.announcerNames?.[0] ||
        findAnnouncerProfile(displayName)?.airName;
      
      const aiResult = await analyzeAttendancePhoto(selfieFile, airName || displayName, attendanceType);
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
                           (airName && currentSlot.announcer.toLowerCase().includes(airName.toLowerCase()));
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
        selfieDriveFileId: result.selfieDriveFileId,
        selfieUploadStatus: result.selfieUploadStatus
      });

      activeAttendanceRecordIdRef.current = result.attendanceRecordId;
      setSelfieDriveFileId(result.selfieDriveFileId);
      setSelfieUploadStatus(result.selfieUploadStatus);
      setUploadNotice("Absensi tercatat. Bukti selfie sedang diunggah di latar belakang.");
      const isRejected = draft.status === "rejected";
      const isOutside = draft.status === "outside_radius" || draft.status === "needs_review";
      
      setRecordStatus(
        draft.status === "present"
          ? "Absensi valid berhasil dikonfirmasi. Bukti selfie sedang diunggah."
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
    } catch {
      setFileError("Gagal melakukan check-out. Periksa koneksi internet, lalu coba lagi.");
    } finally {
      setCheckingOut(false);
    }
  }

  const attendanceTypeOptions: Array<{ id: AttendanceType; label: string }> = [
    { id: "present", label: "Hadir / Di Kantor" },
    { id: "sick", label: "Sakit" },
    { id: "leave", label: "Izin" },
    { id: "out_of_office", label: "Tugas Luar" }
  ];
  const gpsAccuracyTone = position?.accuracy
    ? position.accuracy <= 30
      ? "success"
      : position.accuracy <= 100
        ? "warning"
        : "danger"
    : "";

  return (
    <div className="schedule-page attendance-page">
      {showLocationPrompt && (
        <div className="attendance-location-modal">
          <div className="attendance-location-dialog">
            <div className="attendance-location-icon">
              <MapPin size={30} />
            </div>
            <h3>Sistem Membutuhkan Akses Lokasi Anda</h3>
            <p>
              Demi keamanan dan validitas kehadiran Staf Radio SBL, izinkan akses lokasi ke sistem absensi cerdas ini.
            </p>
            <div className="attendance-location-actions">
              <button type="button" onClick={() => setShowLocationPrompt(false)}>
                Tolak
              </button>
              <button type="button" className="primary" onClick={handleAllowLocation}>
                Izinkan
              </button>
            </div>
            <small>
              *Setelah menekan 'Izinkan', mohon berikan izin ('Allow') pada popup bawaan browser.
            </small>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <div className="attendance-camera-modal">
          <div className="attendance-camera-topbar">
            <span>Ambil Foto Kehadiran</span>
            <button type="button" onClick={() => { stopCamera(); setIsCameraOpen(false); }} aria-label="Tutup kamera">
              <X size={24} />
            </button>
          </div>
          
          <div className="attendance-camera-preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />
          </div>
          
          <canvas ref={canvasRef} className="attendance-hidden-canvas" />
          
          <div className="attendance-camera-controls">
            <div>
              <span>Arahkan wajah Anda ke kamera</span>
              <button type="button" onClick={captureAndSubmit} aria-label="Ambil foto kehadiran">
                <span />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="schedule-page-header attendance-page-header">
        <div className="schedule-title-lockup">
          <img src="/LogoSBL.svg" alt="Radio SBL" />
          <div>
            <p className="eyebrow">Radio SBL Attendance</p>
            <h1>Absensi Cerdas</h1>
          </div>
        </div>
        <p>
          Status hari ini, lokasi, selfie, dan check-out ditampilkan jelas agar proses absen tidak membingungkan.
        </p>
      </div>

      <div className="attendance-content">
        <section className="attendance-status-panel" aria-label="Ringkasan absensi hari ini">
          <article className={`attendance-status-card ${hasCheckedIn ? "success" : "warning"}`}>
            <span>
              {hasCheckedIn ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </span>
            <div>
              <small>Status hari ini</small>
              <strong>{attendanceStatusTitle}</strong>
              <p>{attendanceStatusDescription}</p>
            </div>
          </article>

          <article className={`attendance-status-card ${distance !== null && distance > officeRadiusMeters ? "warning" : ""}`}>
            <span>
              <MapPin size={20} />
            </span>
            <div>
              <small>Lokasi dan GPS</small>
              <strong>{locationStatusTitle}</strong>
              <p>{locationStatusDescription}</p>
            </div>
          </article>

          <article className={`attendance-status-card ${selfieUploadStatus === "failed" ? "warning" : selfieUploadStatus === "uploaded" ? "success" : ""}`}>
            <span>
              <Camera size={20} />
            </span>
            <div>
              <small>Bukti selfie</small>
              <strong>{selfieStatusTitle}</strong>
              <p>{selfieStatusDescription}</p>
            </div>
          </article>
        </section>

        <section className="attendance-main-panel">
          {todayRecord ? (
            todayRecord.checkOutAt ? (
              <div className="attendance-complete-state">
                <BadgeCheck size={56} />
                <h3>Tugas Selesai</h3>
                <p>Terima kasih! Anda telah menyelesaikan Check-in dan Check-out hari ini.</p>
              </div>
            ) : (
              <div className="attendance-checked-state">
                <div className="attendance-success-card">
                  <CheckCircle2 size={48} />
                  <h3>Absensi Berhasil!</h3>
                  <p>
                    Data kehadiran Anda telah tercatat dengan aman di server Radio SBL. Anda tidak perlu mengambil foto lagi.
                  </p>
                  {uploadNotice && (
                    <div className={`attendance-upload-notice ${selfieUploadStatus === "failed" ? "warning" : ""}`}>
                      {uploadNotice}
                    </div>
                  )}
                  <div className="attendance-receipt">
                    <div>
                      <span>Status</span>
                      <strong className="success">DITERIMA</strong>
                    </div>
                    <div>
                      <span>Jam Masuk</span>
                      <strong>{new Date(todayRecord.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WITA</strong>
                    </div>
                    <div>
                      <span>Tipe</span>
                      <strong>{getAttendanceTypeLabel(todayRecord.status)}</strong>
                    </div>
                    <div>
                      <span>Bukti Selfie</span>
                      <strong className={selfieUploadStatus === "failed" ? "danger" : selfieUploadStatus === "uploaded" ? "success" : "warning"}>
                        {selfieUploadStatus === "uploaded" ? "TERSIMPAN" : selfieUploadStatus === "failed" ? "GAGAL UPLOAD" : "MENGUNGGAH"}
                      </strong>
                    </div>
                  </div>
                </div>
                
                <h4>Tugas Selesai?</h4>
                <button 
                  type="button"
                  onClick={handleCheckOut} 
                  disabled={checkingOut} 
                  className="attendance-submit-button checkout"
                >
                  {checkingOut ? <div className="spinner-small light"></div> : <Clock3 size={22} />}
                  {checkingOut ? "Menyimpan Data..." : "Absen Pulang (Check-out)"}
                </button>
              </div>
            )
          ) : (
            <>
              <div className="attendance-type-grid">
                {attendanceTypeOptions.map((type) => {
                  const isActive = attendanceType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => { setAttendanceType(type.id as AttendanceType); setOutOfOfficeReason(""); }}
                      className={`attendance-type-option ${type.id} ${isActive ? "active" : ""}`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>

              {["sick", "leave", "out_of_office"].includes(attendanceType) && (
                <div className="attendance-note-field">
                  <label>
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
                  />
                </div>
              )}

              {fileError && (
                <div className="attendance-error">
                  <X size={18} />
                  <span>{fileError}</span>
                </div>
              )}
              
              <button 
                type="button"
                onClick={handleStartCamera} 
                disabled={checking} 
                className="attendance-submit-button"
              >
                {checking ? <div className="spinner-small light"></div> : <Camera size={22} />}
                {checking ? "Memeriksa & Menganalisa..." : "Mulai Kamera Smart"}
              </button>
            </>
          )}
        </section>

        <div className="attendance-info-list">
          <article className="attendance-info-card">
            <MapPin size={24} color="var(--blue)" />
            <div>
              <strong>
                {distance === null
                  ? "Satelit belum dilacak"
                  : distance <= officeRadiusMeters
                    ? "Radius studio valid"
                    : "Di luar radius studio"}
              </strong>
              <span>
                <span>
                  {distance === null
                    ? `Batas kantor ${officeRadiusMeters}m`
                    : `${Math.round(distance)} meter dari titik kantor`}
                </span>
                {position?.accuracy && (
                  <span className={gpsAccuracyTone}>
                    Akurasi Satelit (GPS): +/-{Math.round(position.accuracy)}m
                  </span>
                )}
              </span>
            </div>
            {distance !== null && distance <= officeRadiusMeters && <BadgeCheck size={20} color="#11a36a" />}
          </article>

          <article className={`attendance-info-card ai ${aiAnalysis?.greeting ? "with-greeting" : ""}`}>
            <BadgeCheck size={24} color={aiAnalysis?.isValid ? "#11a36a" : "var(--muted)"} />
            <div>
              {aiAnalysis?.greeting ? (
                <div className="attendance-ai-bubble">
                  {aiAnalysis.greeting.replace(/^["']|["']$/g, '')}
                </div>
              ) : (
                <div>
                  <span>
                    Identifikasi visual aktif dan siap digunakan.
                  </span>
                </div>
              )}
            </div>
            {aiAnalysis?.isValid && <CheckCircle2 size={20} color="#11a36a" />}
          </article>

          <article className="attendance-info-card">
            <Clock3 size={24} color="var(--blue)" />
            <div>
              <strong>Status Transmisi</strong>
              <span>{recordStatus || "Siap menerima data."}</span>
            </div>
            {recordStatus && <CheckCircle2 size={20} color="#11a36a" />}
          </article>

          <article className="attendance-info-card">
            <UploadCloud size={24} color="var(--blue)" />
            <div>
              <strong>Penyimpanan Eksternal</strong>
              <span className="breakable">
                {selfieUploadStatus === "pending"
                  ? "Foto sedang diunggah. Absensi Anda sudah tercatat."
                  : selfieUploadStatus === "failed"
                    ? "Upload bukti belum berhasil. Admin tetap dapat melihat absensi Anda."
                    : selfieDriveFileId || "Menunggu foto tersimpan di sistem."}
              </span>
            </div>
            <Cloud size={20} color="var(--muted)" />
          </article>
        </div>
      </div>
    </div>
  );
}

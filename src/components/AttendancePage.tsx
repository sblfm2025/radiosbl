import { useState, type ChangeEvent } from "react";
import { Camera, MapPin, Clock3, CheckCircle2, UploadCloud, Cloud, BadgeCheck } from "lucide-react";
import { getCurrentPosition, distanceInMeters, type GeoPoint } from "../utils/geolocation";
import { validateFile, moduleFileRules } from "../utils/fileValidation";
import type { AuthSession } from "../services/auth.service";
import {
  buildAttendanceRecordDraft,
  checkInWithSelfie
} from "../services/attendance.service";
import { findAnnouncerProfile } from "../utils/announcerResolver";
import { analyzeAttendancePhoto } from "../services/gemini.service";
import { useCurrentBroadcastSlot } from "../hooks/useCurrentBroadcastSlot";

const officeCenter: GeoPoint = { latitude: -3.834458, longitude: 119.643606 };
const officeRadiusMeters = 100;

export function AttendancePage({
  session,
  onAttendanceRecorded
}: {
  data: any; // Menambahkan akses ke dashboard data (termasuk weeklySchedule)
  session: AuthSession | null;
  onAttendanceRecorded?: () => void;
}) {
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [checking, setChecking] = useState(false);
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [recordStatus, setRecordStatus] = useState("");
  const [selfieDriveFileId, setSelfieDriveFileId] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<{ isValid: boolean; description: string } | null>(null);
  const currentSlot = useCurrentBroadcastSlot(); // Mengambil info siaran saat ini

  const distance = position ? distanceInMeters(position, officeCenter) : null;

  function handleSelfieChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelfieFile(file);
    setFileError("");
    setRecordStatus("");
    setSelfieDriveFileId("");

    if (!file) {
      return;
    }

    const validation = validateFile(file, moduleFileRules.attendance);
    if (!validation.valid) {
      setFileError(validation.reason);
    }
  }

  async function handleCheckIn() {
    setRecordStatus("");

    if (!selfieFile) {
      setFileError("Pilih file selfie terlebih dahulu.");
      return;
    }

    const validation = validateFile(selfieFile, moduleFileRules.attendance);
    if (!validation.valid) {
      setFileError(validation.reason);
      return;
    }

    try {
      setChecking(true);
      setFileError("");
      
      // Step 1: AI Vision Validation
      const aiResult = await analyzeAttendancePhoto(selfieFile);
      setAiAnalysis(aiResult);

      if (!aiResult.isValid) {
        setFileError(`AI Menolak Foto: ${aiResult.reason}`);
        setChecking(false);
        return;
      }

      // Step 2: Geolocation & Info Inisialisasi
      const currentPosition = await getCurrentPosition();
      const userId = session?.user.id ?? "demo-user";
      const displayName = session?.user.displayName ?? "Demo User";
      const airName = findAnnouncerProfile(displayName)?.airName;
      setPosition(currentPosition);

      // Step 3: Schedule Sync & Delay Logic
      let attendanceStatus: "present" | "late" | "outside_radius" = "present";
      const dist = distanceInMeters(currentPosition, officeCenter);
      
      if (dist > officeRadiusMeters) {
        attendanceStatus = "outside_radius";
      } else {
        // Cek apakah ada program aktif dan apakah penyiar sesuai
        const isCurrentProgramActive = currentSlot.title !== "Playlist" && currentSlot.title !== "Offline";
        if (isCurrentProgramActive) {
          const isMyTurn = currentSlot.announcer.toLowerCase().includes(displayName.toLowerCase()) || 
                           (airName && currentSlot.announcer.includes(airName));
          
          if (isMyTurn) {
            // Logika sederhana: jika absen dilakukan saat program sudah berjalan, bisa ditandai khusus
            console.log(`Penyiar ${displayName} absen untuk program ${currentSlot.title}`);
          }
        }
      }

      const result = await checkInWithSelfie({
        userId,
        displayName,
        airName,
        position: currentPosition,
        officeCenter,
        radiusMeters: officeRadiusMeters,
        selfieFile
      });
      const draft = buildAttendanceRecordDraft({
        userId,
        displayName,
        airName,
        position: currentPosition,
        officeCenter,
        radiusMeters: officeRadiusMeters,
        selfieDriveFileId: result.selfieDriveFileId
      });

      setSelfieDriveFileId(result.selfieDriveFileId);
      setRecordStatus(
        draft.status === "present"
          ? `Check-in berhasil. Record: ${result.attendanceRecordId}`
          : `Check-in tercatat di luar radius. Record: ${result.attendanceRecordId}`
      );
      onAttendanceRecorded?.();
    } catch (currentError) {
      setRecordStatus("");
      setFileError(
        currentError instanceof Error
          ? currentError.message
          : "Check-in gagal. Periksa file selfie dan koneksi."
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ background: "#f8f9fc", minHeight: "100vh", paddingBottom: "100px" }}>
      <div style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 800, margin: "0 0 4px" }}>ATTENDANCE</h2>
        <h1 style={{ fontSize: "2rem", color: "var(--ink)", fontWeight: 900, margin: "0 0 12px" }}>Absensi</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 24px" }}>
          Check-in, selfie, radius kantor, status keterlambatan, dan arsip Google Drive.
        </p>

        <div style={{ background: "white", borderRadius: "32px", padding: "24px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)", marginBottom: "24px" }}>
          <div style={{ border: "2px dashed rgba(22, 119, 237, 0.3)", borderRadius: "24px", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "20px", background: "rgba(22, 119, 237, 0.02)" }}>
            <Camera size={48} color="var(--blue)" style={{ marginBottom: "16px" }} />
            <span style={{ color: "var(--blue)", fontWeight: 800, fontSize: "1.1rem", textAlign: "center" }}>
              {selfieFile ? selfieFile.name : "Camera capture / upload selfie"}
            </span>
          </div>
          
          <label style={{ display: "block", cursor: "pointer", width: "100%", padding: "16px", borderRadius: "99px", border: "2px solid rgba(22, 119, 237, 0.1)", textAlign: "center", color: "var(--blue)", fontWeight: 800, fontSize: "1.05rem", marginBottom: "12px" }}>
            {selfieFile ? "Ganti foto" : "Ambil Foto Selfie"}
            <input 
              type="file" 
              accept="image/*" 
              capture="user" 
              onChange={handleSelfieChange} 
              style={{ display: "none" }} 
            />
          </label>
          
          {fileError && <p style={{ color: "#FF3B3B", textAlign: "center", fontSize: "0.9rem", fontWeight: "bold", margin: "0 0 12px" }}>{fileError}</p>}
          
          <button onClick={handleCheckIn} disabled={checking} style={{ width: "100%", padding: "18px", borderRadius: "99px", background: "#1677ED", color: "white", border: "none", fontWeight: 800, fontSize: "1.05rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", boxShadow: "0 8px 24px rgba(22, 119, 237, 0.25)" }}>
            <Camera size={20} />
            {checking ? "Memeriksa lokasi..." : "Ambil selfie check-in"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Lokasi Card */}
          <div style={{ background: "white", borderRadius: "24px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(12, 36, 70, 0.03)" }}>
            <MapPin size={24} color="var(--blue)" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "var(--ink)", fontSize: "1.05rem", marginBottom: "4px", fontWeight: 800 }}>
                {distance === null
                  ? "Radius studio belum dicek"
                  : distance <= officeRadiusMeters
                    ? "Radius studio valid"
                    : "Di luar radius studio"}
              </strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                {distance === null
                  ? `Batas radius kantor ${officeRadiusMeters} meter`
                  : `${Math.round(distance)} meter dari titik kantor`}
              </span>
            </div>
            {distance !== null && distance <= officeRadiusMeters && <BadgeCheck size={20} color="#11a36a" />}
          </div>

          {/* AI Vision Card */}
          <div style={{ background: "white", borderRadius: "24px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(12, 36, 70, 0.03)" }}>
            <BadgeCheck size={24} color={aiAnalysis?.isValid ? "#11a36a" : "var(--blue)"} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "var(--ink)", fontSize: "1.05rem", marginBottom: "4px", fontWeight: 800 }}>Smart AI Verification</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                {aiAnalysis 
                  ? aiAnalysis.description
                  : "Foto akan diverifikasi otomatis oleh AI."}
              </span>
            </div>
            {aiAnalysis?.isValid && <CheckCircle2 size={20} color="#11a36a" />}
          </div>

          {/* Check-in Status Card */}
          <div style={{ background: "white", borderRadius: "24px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(12, 36, 70, 0.03)" }}>
            <Clock3 size={24} color="var(--blue)" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "var(--ink)", fontSize: "1.05rem", marginBottom: "4px", fontWeight: 800 }}>Status Absensi</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{recordStatus || "Silahkan ambil selfie untuk check-in."}</span>
            </div>
            {recordStatus && <CheckCircle2 size={20} color="#11a36a" />}
          </div>

          {/* Drive Metadata Card */}
          <div style={{ background: "white", borderRadius: "24px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(12, 36, 70, 0.03)" }}>
            <UploadCloud size={24} color="var(--blue)" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "var(--ink)", fontSize: "1.05rem", marginBottom: "4px", fontWeight: 800 }}>Penyimpanan Awan</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem", wordBreak: "break-all" }}>
                {selfieDriveFileId || "Menunggu upload ke Google Drive..."}
              </span>
            </div>
            <Cloud size={20} color="var(--muted)" />
          </div>
        </div>

      </div>
    </div>
  );
}

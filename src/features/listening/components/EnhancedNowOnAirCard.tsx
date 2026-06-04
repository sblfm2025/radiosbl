import type { BroadcastProgramSlot } from "../../../types/domain";
import type { PlayerStatusType } from "../../../contexts/audioContextState";
import { getProgramInfo } from "../../../data/radioData";
import { PlayerStatusBadge } from "./PlayerStatusBadge";
import { FavoriteProgramButton } from "./FavoriteProgramButton";
import { Radio } from "lucide-react";
import "../styles/listening.css";

type EnhancedNowOnAirCardProps = {
  programSlot?: Partial<BroadcastProgramSlot> & {
    title?: string;
    type?: string;
  };
  userId?: string;
  playerStatus?: PlayerStatusType;
  onRequestSong?: () => void;
};

export function EnhancedNowOnAirCard({ programSlot, userId, playerStatus, onRequestSong }: EnhancedNowOnAirCardProps) {
  const programName = programSlot?.title || programSlot?.program || "";
  const isOffAir = !programSlot ||
    programSlot?.type === "offair" ||
    !programName ||
    programName.toLowerCase().includes("offair") || 
    programName.toLowerCase().includes("istirahat") ||
    programName.toLowerCase().includes("off air") ||
    programName.toLowerCase().includes("playlist otomatis");

  const programInfo = isOffAir
    ? {
        title: "Radio SBL Live",
        description: "Suara Pinrang, Suara Kita",
        imageUrl: "/LogoSBL.svg"
      }
    : getProgramInfo(programName || "Radio SBL Live");

  const displayTitle = isOffAir ? "Radio SBL Live" : (programName || "Radio SBL Live");
  const displayDesc = isOffAir 
    ? "Suara Pinrang, Suara Kita" 
    : (programInfo.description || "Program Radio SBL yang menghadirkan informasi, hiburan, edukasi, dan interaksi hangat.");

  const announcer = programSlot?.announcer || "Radio SBL";
  const time = programSlot?.time || "--.-- - --.--";
  const programId = displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").trim() || "radio-sbl-live";

  return (
    <div className="enhanced-now-card" data-testid="enhanced-now-card">
      <div className="enhanced-now-header">
        <span>Sedang Mengudara</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <PlayerStatusBadge status={playerStatus} />
          {!isOffAir && (
            <FavoriteProgramButton
              userId={userId}
              programId={programId}
              programTitle={displayTitle}
              programPoster={programInfo.imageUrl}
            />
          )}
        </div>
      </div>

      <div className="enhanced-now-body">
        <div className="enhanced-now-poster">
          <img src={programInfo.imageUrl || "/LogoSBL.svg"} alt={displayTitle} />
        </div>
        <div className="enhanced-now-info">
          <div className="enhanced-now-title-row">
            <h3 className="enhanced-now-title">{displayTitle}</h3>
          </div>
          <p className="enhanced-now-desc">{displayDesc}</p>
          
          <div className="enhanced-now-meta-row">
            <div className="enhanced-now-meta-item">
              <span>Penyiar:</span><strong>{announcer}</strong>
            </div>
            <div className="enhanced-now-meta-item">
              <span>Waktu:</span><strong>{time} WITA</strong>
            </div>
          </div>
        </div>
      </div>

      {onRequestSong && !isOffAir && (
        <button
          type="button"
          onClick={onRequestSong}
          className="streaming-request-toggle"
          style={{ width: "100%", marginTop: "8px", justifyContent: "center", display: "flex", alignItems: "center" }}
        >
          <Radio size={18} style={{ marginRight: "8px" }} />
          REQUEST LAGU
        </button>
      )}
    </div>
  );
}

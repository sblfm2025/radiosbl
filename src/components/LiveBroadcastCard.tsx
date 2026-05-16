import { MapPin, RadioTower, Video } from "lucide-react";

export function LiveBroadcastCard() {
  return (
    <section className="live-card">
      <div className="live-visual">
        <img src="/coverSBL.jpg" alt="Studio Radio Suara Bumi Lasinrang" />
        <span className="live-badge">
          <span />
          LIVE
        </span>
      </div>
      <div className="live-content">
        <p className="eyebrow">Live Broadcast / OB</p>
        <h3>Dialog Publik Pinrang Bersatu</h3>
        <p>
          Kru studio, reporter lapangan, operator OBS, YouTube Live, dan room
          Discord tersinkron dalam satu rundown.
        </p>
        <div className="meta-grid">
          <span>
            <MapPin size={16} /> Studio Utama
          </span>
          <span>
            <Video size={16} /> YouTube standby
          </span>
          <span>
            <RadioTower size={16} /> 92.4 FM
          </span>
        </div>
      </div>
    </section>
  );
}

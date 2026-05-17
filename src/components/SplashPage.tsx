import { useEffect } from "react";
import type { PageKey } from "../data/radioData";
export function SplashPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigate("login");
    }, 1200);

    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <main className="splash-page-container">
      <div className="splash-ambient" aria-hidden="true" />
      <div className="splash-page-content">
        <div className="splash-station-panel" aria-hidden="true">
          <span className="splash-frequency">92.4 FM</span>
          <div className="splash-wave-lines">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.05}s` }} />
            ))}
          </div>
        </div>
        <div className="splash-card">
          <span className="splash-live-chip">On Air</span>
          <img
            src="/LogoSBL.svg"
            alt="SBL Radio"
            className="splash-logo"
          />
          <h1>RADIO SBL</h1>
          <p>Suara Pinrang, Suara Kita!</p>
          <div className="splash-eq">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="splash-eq-bar"
                style={{
                  background: i === 3 ? "#D1FF00" : "white",
                  animationDelay: `${i * 0.15}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 20px rgba(255,255,255,0.4)); }
          50% { opacity: 0.8; transform: scale(0.95); filter: drop-shadow(0 0 10px rgba(255,255,255,0.1)); }
        }
        @keyframes eq {
          0% { height: 8px; }
          100% { height: 28px; }
        }
      `}</style>
    </main>
  );
}

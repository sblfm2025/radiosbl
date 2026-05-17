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
              <span key={index} />
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
                className={`splash-eq-bar${i === 3 ? " accent" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

import { useEffect } from "react";
import type { PageKey } from "../data/radioData";
export function SplashPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigate("onboarding");
    }, 1200);

    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <main className="splash-page-container">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, zIndex: 1 }}>
        <img 
          src="/LogoSBL.svg" 
          alt="SBL Radio" 
          className="splash-logo"
          style={{ animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
        />
        <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, margin: "0 0 4px", letterSpacing: "1px" }}>RADIO SBL</h1>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.1rem", fontWeight: 600, margin: "0 0 32px", letterSpacing: "1px", textTransform: "uppercase", textAlign: "center" }}>Suara Pinrang, Suara Kita!</p>
        
        {/* Radio Equalizer Loading Animation */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center", height: "30px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              style={{ 
                width: "4px", 
                background: i === 3 ? "#D1FF00" : "white", 
                borderRadius: "2px", 
                animation: `eq 1s infinite ease-in-out alternate`,
                animationDelay: `${i * 0.15}s`,
                boxShadow: i === 3 ? "0 0 8px rgba(209, 255, 0, 0.6)" : "none"
              }} 
            />
          ))}
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

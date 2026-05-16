import { Play, Pause } from "lucide-react";
import { useGlobalAudio } from "../contexts/useGlobalAudio";
import type { PageKey } from "../data/radioData";

export function OnboardingPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const { playing, togglePlayback } = useGlobalAudio();

  return (
    <main className="onboarding-page-container">
      
      <div className="onboarding-visual-panel">
        {/* Equalizer Player Pill */}
      <div style={{ width: "100%", maxWidth: "340px", background: "#212121", borderRadius: "99px", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px", boxShadow: "0 24px 48px rgba(0,0,0,0.15)" }}>
        
        {/* Equalizer Left */}
        <div style={{ display: "flex", gap: "3px", height: "32px", alignItems: "center" }}>
          {[12, 24, 16, 28, 14, 20, 10, 24, 18, 14].map((h, i) => (
            <div key={`l-${i}`} style={{ width: "3px", height: `${playing ? h : 4}px`, background: i < 3 ? "#D1FF00" : "white", borderRadius: "2px", transition: "height 0.2s ease" }}></div>
          ))}
        </div>

        {/* Play Button */}
        <button 
          onClick={togglePlayback} 
          style={{ 
            width: "56px", 
            height: "56px", 
            borderRadius: "50%", 
            background: "#7B3CFF", 
            border: "none", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            cursor: "pointer", 
            boxShadow: "0 8px 16px rgba(123, 60, 255, 0.4)",
            animation: playing ? "none" : "pulseGlow 2s infinite"
          }}
        >
          {playing ? <Pause fill="white" color="white" size={24} /> : <Play fill="white" color="white" size={24} style={{ marginLeft: "4px" }} />}
        </button>

        <style>{`
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(123, 60, 255, 0.7); transform: scale(1); }
            50% { box-shadow: 0 0 0 16px rgba(123, 60, 255, 0); transform: scale(1.05); }
            100% { box-shadow: 0 0 0 0 rgba(123, 60, 255, 0); transform: scale(1); }
          }
        `}</style>

        {/* Equalizer Right */}
        <div style={{ display: "flex", gap: "3px", height: "32px", alignItems: "center" }}>
          {[14, 18, 24, 10, 20, 14, 28, 16, 24, 12].map((h, i) => (
            <div key={`r-${i}`} style={{ width: "3px", height: `${playing ? h : 4}px`, background: i > 6 ? "#D1FF00" : "white", borderRadius: "2px", transition: "height 0.2s ease" }}></div>
          ))}
        </div>

      </div>

      {/* Grid Images */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", maxWidth: "340px", width: "100%", marginBottom: "48px" }}>
        <div style={{ aspectRatio: "1", borderRadius: "50%", background: "#7B3CFF", overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative" }}>
           <img src="https://images.unsplash.com/photo-1516280440502-3c5b967a5b3a?w=400&q=80" alt="Person" style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "luminosity", opacity: 0.9 }} />
        </div>
        <div style={{ aspectRatio: "1", borderRadius: "50% 50% 50% 0", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
           <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-11.5v7l6-3.5-6-3.5z"/></svg>
        </div>
        <div style={{ aspectRatio: "1", borderRadius: "50% 0 50% 50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
           <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-11.5v7l6-3.5-6-3.5z"/></svg>
        </div>
        <div style={{ aspectRatio: "1", borderRadius: "50%", background: "#D1FF00", overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative" }}>
           <img src="https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&q=80" alt="Person" style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "luminosity", opacity: 0.9 }} />
        </div>
      </div>

      </div>

      <div className="onboarding-content-panel">
        {/* Typography */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "1.8rem", color: "var(--ink)", fontWeight: 900, lineHeight: 1.2, margin: "0 0 16px" }}>
          <span style={{ color: "#7B3CFF" }}>Radio SBL 91.5 FM</span><br />Suara Pinrang, Suara Kita!
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5, margin: 0, padding: "0 16px" }}>
          Dengarkan siaran langsung, kirim salam, dan pantau program favoritmu dimana saja.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "24px", marginTop: "auto" }}>
        <button 
          onClick={() => onNavigate("login")}
          style={{ width: "100%", height: "56px", borderRadius: "28px", background: "#7B3CFF", color: "white", border: "none", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(123, 60, 255, 0.3)" }}
        >
          Mulai Sekarang
        </button>
        
        <div style={{ textAlign: "center", fontSize: "0.95rem", color: "var(--ink)", fontWeight: 600 }}>
          Sudah punya akun? <span onClick={() => onNavigate("login")} style={{ color: "#7B3CFF", textDecoration: "underline", cursor: "pointer" }}>Masuk</span>
        </div>
        </div>
      </div>

    </main>
  );
}

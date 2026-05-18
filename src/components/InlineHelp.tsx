import { HelpCircle, X } from "lucide-react";
import { useState } from "react";

export function InlineHelp({ title, content }: { title: string; content: string | React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="inline-help-container" style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: "6px" }}>
      <button 
        type="button" 
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{ 
          background: "none", border: "none", cursor: "pointer", 
          padding: "2px", opacity: 0.5, display: "flex", alignItems: "center",
          transition: "opacity 0.2s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = open ? "1" : "0.5")}
        aria-label={`Bantuan tentang ${title}`}
      >
        <HelpCircle size={16} />
      </button>

      {open && (
        <div 
          className="dashboard-panel"
          style={{ 
            position: "absolute", top: "100%", right: "auto", left: 0, marginTop: "8px", 
            width: "max-content", maxWidth: "280px", zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "12px",
            border: "1px solid var(--color-border)",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "12px" }}>
            <strong style={{ fontSize: "13px", color: "var(--color-text-primary, #111827)" }}>{title}</strong>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4, padding: "2px" }}
              aria-label="Tutup bantuan"
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--color-text-secondary, #4b5563)", whiteSpace: "normal" }}>
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

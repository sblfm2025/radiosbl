import { type FormEvent, useState } from "react";
import { Fingerprint, ShieldCheck, User, Phone, Eye, EyeOff } from "lucide-react";
import { signIn, signUp, signInWithGoogle, type AuthSession } from "../services/auth.service";

export function LoginPage({ onEnter }: { onEnter: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("admin@radiosbl.go.id");
  const [password, setPassword] = useState("demo12345");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | "reset" | "">("");

  function translateFirebaseError(errMessage: string): string {
    if (errMessage.includes("auth/invalid-credential")) return "Email atau kata sandi yang Anda masukkan salah.";
    if (errMessage.includes("auth/user-not-found")) return "Akun tidak ditemukan. Silakan daftar terlebih dahulu.";
    if (errMessage.includes("auth/wrong-password")) return "Kata sandi salah. Silakan coba lagi.";
    if (errMessage.includes("auth/email-already-in-use")) return "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
    if (errMessage.includes("auth/weak-password")) return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    if (errMessage.includes("auth/invalid-email")) return "Format email tidak valid. Periksa kembali ketikan Anda.";
    if (errMessage.includes("auth/too-many-requests")) return "Terlalu banyak percobaan gagal. Coba lagi nanti atau reset sandi.";
    return "Terjadi kesalahan sistem. Periksa koneksi Anda dan coba lagi.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMsg("");

    if (mode === "register" && password !== passwordConfirm) {
      setError("Kata sandi dan Konfirmasi Kata sandi tidak cocok!");
      return;
    }

    setLoading("email");

    try {
      let finalEmail = email.trim();
      
      // Logika Smart Login: Jika input adalah nomor WA (hanya angka)
      if (/^\d+$/.test(finalEmail)) {
        finalEmail = `${finalEmail}@radiosbl.com`;
      }

      const session = mode === "login" 
        ? await signIn(finalEmail, password)
        : await signUp(finalEmail, password, name, whatsapp);
      onEnter(session);
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? translateFirebaseError(currentError.message)
          : `${mode === "login" ? "Login" : "Pendaftaran"} gagal. Periksa akun dan koneksi.`
      );
    } finally {
      setLoading("");
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading("google");

    try {
      const session = await signInWithGoogle();
      onEnter(session);
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? translateFirebaseError(currentError.message)
          : "Login Google gagal. Periksa pop-up browser dan konfigurasi Firebase."
      );
    } finally {
      setLoading("");
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError("Silakan isi alamat email Anda terlebih dahulu untuk mereset kata sandi.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading("reset");

    try {
      const { getFirebaseAuth } = await import("../lib/firebase");
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setSuccessMsg("Tautan reset kata sandi telah dikirim ke email Anda.");
    } catch (err) {
      setError(err instanceof Error ? translateFirebaseError(err.message) : "Gagal mengirim email reset kata sandi.");
    } finally {
      setLoading("");
    }
  }

  return (
    <main className="login-page-container">
      
      {/* Brand Panel (Only visible on Desktop/Tablet) */}
      <div className="login-brand-panel">
        <img src="/LogoSBL.svg" alt="SBL Radio" style={{ width: "160px", height: "auto", marginBottom: "32px", filter: "drop-shadow(0 0 24px rgba(255,255,255,0.2))" }} />
        <h2 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0 0 16px", letterSpacing: "1px", textAlign: "center" }}>RADIO SBL<br/>91.5 FM</h2>
        <p style={{ fontSize: "1.1rem", opacity: 0.8, maxWidth: "400px", textAlign: "center", lineHeight: 1.6 }}>Dengarkan siaran langsung, kirim salam, dan pantau program favoritmu dari layar mana pun.</p>
      </div>

      {/* Form Panel (Mobile View & Right Panel on Desktop) */}
      <div className="login-form-panel">
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "32px", marginTop: "auto", flexShrink: 0 }}>
          <img src="/iconSBL.svg" alt="SBL" style={{ width: "100px", height: "auto", marginBottom: "16px", filter: "brightness(0) invert(1) sepia(1) saturate(10000%) hue-rotate(180deg) brightness(1.2)" }} />
          <h1 style={{ fontSize: "1.8rem", color: "white", margin: "0 0 12px 0", fontWeight: 800 }}>
            {mode === "login" ? "Selamat Datang!" : "Buat Akun Baru"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", margin: 0, fontSize: "0.95rem" }}>
            {mode === "login" ? "Masuk untuk menikmati semua fitur Radio SBL" : "Daftar untuk ikut request lagu dan obrolan komunitas"}
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
          
          {mode === "register" && (
            <>
              <div style={{ display: "flex", alignItems: "center", background: "white", borderRadius: "16px", padding: "0 16px", height: "56px" }}>
                <User size={20} color="var(--blue)" style={{ opacity: 0.8 }} />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  style={{ flex: 1, padding: "0 12px", border: "none", background: "transparent", outline: "none", fontSize: "1rem", color: "var(--ink)", fontWeight: 600 }}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", background: "white", borderRadius: "16px", padding: "0 16px", height: "56px" }}>
                <Phone size={20} color="var(--blue)" style={{ opacity: 0.8 }} />
                <input
                  type="tel"
                  placeholder="Nomor WhatsApp aktif"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  style={{ flex: 1, padding: "0 12px", border: "none", background: "transparent", outline: "none", fontSize: "1rem", color: "var(--ink)", fontWeight: 600 }}
                  required
                />
              </div>
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", background: "white", borderRadius: "16px", padding: "0 16px", height: "56px" }}>
            <User size={20} color="var(--blue)" style={{ opacity: 0.8 }} />
            <input
              type="text"
              placeholder="Nomor WA atau Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ flex: 1, padding: "0 12px", border: "none", background: "transparent", outline: "none", fontSize: "1rem", color: "var(--ink)", fontWeight: 600 }}
              required
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", background: "white", borderRadius: "16px", padding: "0 16px", height: "56px" }}>
            <Fingerprint size={20} color="var(--blue)" style={{ opacity: 0.8 }} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Kata Sandi"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ flex: 1, padding: "0 12px", border: "none", background: "transparent", outline: "none", fontSize: "1rem", color: "var(--ink)", fontWeight: 600, letterSpacing: showPassword ? "normal" : "2px" }}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "transparent", border: "none", padding: 0, display: "flex", opacity: 0.5 }}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {mode === "register" && (
            <div style={{ display: "flex", alignItems: "center", background: "white", borderRadius: "16px", padding: "0 16px", height: "56px" }}>
              <Fingerprint size={20} color="var(--blue)" style={{ opacity: 0.8 }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Konfirmasi Kata Sandi"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                style={{ flex: 1, padding: "0 12px", border: "none", background: "transparent", outline: "none", fontSize: "1rem", color: "var(--ink)", fontWeight: 600, letterSpacing: showPassword ? "normal" : "2px" }}
                required
              />
            </div>
          )}

          {mode === "login" && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", margin: "4px 0 16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" style={{ width: "16px", height: "16px", margin: 0, accentColor: "white" }} /> Ingat saya
              </label>
              <button type="button" onClick={handleResetPassword} disabled={loading === "reset"} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {loading === "reset" ? "Mengirim..." : "Lupa kata sandi?"}
              </button>
            </div>
          )}

          {error && <p style={{ background: "rgba(255,255,255,0.9)", color: "#FF3B3B", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", margin: "0 0 16px" }}>{error}</p>}
          {successMsg && <p style={{ background: "rgba(17, 163, 106, 0.9)", color: "white", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", margin: "0 0 16px" }}>{successMsg}</p>}
          
          <button type="submit" disabled={Boolean(loading)} style={{ width: "100%", height: "56px", borderRadius: "16px", fontSize: "1.1rem", fontWeight: 800, background: "#2582FF", color: "white", border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", marginBottom: "auto" }}>
            {loading === "email" ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar Sekarang"}
          </button>

          <div style={{ textAlign: "center", margin: "24px 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
            atau masuk dengan
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={Boolean(loading)}
              style={{ flex: 1, height: "52px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderRadius: "12px", border: "none", background: "white", cursor: "pointer", fontWeight: 700, color: "var(--ink)", fontSize: "1rem" }}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" style={{ width: "20px", height: "20px" }} /> Lanjutkan dengan Google
            </button>
          </div>

          <div style={{ textAlign: "center", fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginTop: "32px" }}>
            {mode === "login" ? (
              <>Belum punya akun? <span onClick={() => { setMode("register"); setError(""); }} style={{ color: "white", textDecoration: "underline", fontWeight: 800, cursor: "pointer" }}>Daftar sekarang</span></>
            ) : (
              <>Sudah punya akun? <span onClick={() => { setMode("login"); setError(""); }} style={{ color: "white", textDecoration: "underline", fontWeight: 800, cursor: "pointer" }}>Masuk sekarang</span></>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

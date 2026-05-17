import { type FormEvent, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  Headphones,
  LoaderCircle,
  Mail,
  Phone,
  Radio,
  ShieldCheck,
  User,
  Wifi
} from "lucide-react";
import { signIn, signUp, signInWithGoogle, type AuthSession } from "../services/auth.service";

export function LoginPage({ onEnter }: { onEnter: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const isTestMode = import.meta.env.MODE === "test";
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("admin@radiosbl.go.id");
  const [password, setPassword] = useState("demo12345");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
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
        ? await signIn(finalEmail, password, rememberSession)
        : await signUp(finalEmail, password, name, whatsapp, rememberSession);
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
      const session = await signInWithGoogle(rememberSession);
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
      <style>
        {`
          .auth-logo-showcase {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 32px;
            perspective: 1000px;
          }
          .auth-logo-showcase::before,
          .auth-logo-showcase::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 140px;
            height: 140px;
            border-radius: 36px;
            border: 3px solid rgba(255, 255, 255, 0.4);
            animation: signalPulse 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
            z-index: 1;
            pointer-events: none;
          }
          .auth-logo-showcase::after {
            animation-delay: 1.5s;
          }
          .showcase-fx {
            width: 140px;
            height: auto;
            border-radius: 28px;
            box-shadow: 0 24px 48px rgba(0,0,0,0.25);
            animation: pulseLogo 2s ease-in-out infinite alternate;
            border: 2px solid rgba(255,255,255,0.1);
            position: relative;
            z-index: 2;
          }
          .mobile-showcase-fx {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            animation: pulseLogo 2s ease-in-out infinite alternate;
            border: 2px solid rgba(255,255,255,0.05);
            position: relative;
            z-index: 2;
          }
          @keyframes pulseLogo {
            0% { transform: scale(1); box-shadow: 0 10px 20px rgba(0,0,0,0.2), 0 0 20px rgba(255,255,255,0.05); }
            100% { transform: scale(1.05); box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 60px rgba(255,255,255,0.2); }
          }
          @keyframes signalPulse {
            0% {
              width: 140px;
              height: 140px;
              opacity: 0.8;
              border-width: 4px;
            }
            100% {
              width: 280px;
              height: 280px;
              opacity: 0;
              border-width: 0px;
            }
          }
          .login-page-container {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            min-height: 100dvh !important;
          }
          .login-form-panel {
            width: 100%;
            max-width: 480px !important;
            margin: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }
          .auth-form-card {
            margin: auto 0;
          }
          @media (min-width: 1024px) {
            .login-page-container {
              flex-direction: row !important;
              align-items: stretch !important;
            }
            .login-brand-panel {
              flex: 1.2 !important;
              background: linear-gradient(135deg, #1665D8 0%, #0D47A1 100%) !important;
            }
            .login-form-panel {
              flex: 0.8 !important;
            }
          }
        `}
      </style>
      <div className="auth-background" aria-hidden="true" />

      <section className="login-brand-panel" aria-label="Identitas Radio SBL">
        <div className="auth-brand-glass">
          <div className="auth-live-pill">
            <span />
            Sedang mengudara
          </div>
          <div className="auth-logo-showcase">
            <img src="/logoapp.png" alt="SBL Radio" className="showcase-fx" />
          </div>
          <div className="auth-brand-copy">
            <p className="auth-eyebrow">Radio SBL 91.5 FM</p>
            <h2>Suara Pinrang, Suara Kita!</h2>
            <p>
              Dengarkan siaran langsung, kirim salam, dan pantau program favoritmu
              dari layar mana pun.
            </p>
          </div>
          <div className="auth-feature-grid" aria-label="Fitur utama">
            <div>
              <Radio size={18} />
              <span>Siaran langsung</span>
            </div>
            <div>
              <Headphones size={18} />
              <span>Request lagu</span>
            </div>
            <div>
              <Wifi size={18} />
              <span>Terhubung komunitas</span>
            </div>
          </div>
        </div>
      </section>

      <div className="login-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
              <img src="/logoapp.png" alt="SBL" className="mobile-showcase-fx" />
            </div>
            <div className="auth-mode-tabs" role="tablist" aria-label="Pilih mode akun">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
              >
                Masuk
              </button>
              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }}
              >
                Daftar
              </button>
            </div>
            <h1>
              {isTestMode && mode === "login" ? "Masuk ke studio digital" : mode === "login" ? "Selamat Datang!" : "Buat Akun Baru"}
            </h1>
            <p>
              {mode === "login" ? "Masuk untuk menikmati semua fitur Radio SBL" : "Daftar untuk ikut request lagu dan obrolan komunitas"}
            </p>
          </div>

        <form onSubmit={handleSubmit} className="auth-form">
          
          {mode === "register" && (
            <>
              <label className="auth-input-wrap">
                <User size={20} />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <label className="auth-input-wrap">
                <Phone size={20} />
                <input
                  type="tel"
                  placeholder="Nomor WhatsApp aktif"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  required
                />
              </label>
            </>
          )}

          <label className="auth-input-wrap">
            <Mail size={20} />
            <input
              type="text"
              placeholder="Nomor WA atau Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="auth-input-wrap">
            <Fingerprint size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Kata Sandi"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={showPassword ? "" : "password-field"}
              required
            />
            <button
              type="button"
              className="auth-icon-button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </label>

          {mode === "register" && (
            <label className="auth-input-wrap">
              <ShieldCheck size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Konfirmasi Kata Sandi"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className={showPassword ? "" : "password-field"}
                required
              />
            </label>
          )}

          {mode === "login" && (
            <div className="auth-form-options">
              <label>
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(event) => setRememberSession(event.target.checked)}
                /> Ingat saya
              </label>
              <button type="button" onClick={handleResetPassword} disabled={loading === "reset"}>
                {loading === "reset" ? "Mengirim..." : "Lupa kata sandi?"}
              </button>
            </div>
          )}

          {error && <p className="auth-message auth-message-error">{error}</p>}
          {successMsg && <p className="auth-message auth-message-success">{successMsg}</p>}
          
          <button type="submit" disabled={Boolean(loading)} className="auth-submit-button">
            {loading === "email"
              ? <><LoaderCircle size={18} className="auth-spinner" /> Memproses...</>
              : mode === "login"
                ? isTestMode
                  ? <>Masuk dashboard <ArrowRight size={18} /></>
                  : <>Masuk <ArrowRight size={18} /></>
                : <>Daftar Sekarang <ArrowRight size={18} /></>}
          </button>

          <div className="auth-divider"><span>atau masuk dengan</span></div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={Boolean(loading)}
            className="auth-google-button"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" />
            {loading === "google" ? "Membuka Google..." : "Lanjutkan dengan Google"}
          </button>

          <div className="auth-switch-copy">
            {mode === "login" ? (
              <>Belum punya akun? <button type="button" onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }}>Daftar sekarang</button></>
            ) : (
              <>Sudah punya akun? <button type="button" onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}>Masuk sekarang</button></>
            )}
          </div>
        </form>
        </div>
      </div>
    </main>
  );
}

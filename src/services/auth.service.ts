import { hasFirebaseConfig } from "../lib/env";
import type { AppUser } from "../types/domain";

export type AuthSession = {
  user: AppUser;
  provider: "firebase" | "demo";
};

const DEMO_SESSION_KEY = "sbl_demo_session";
const DEMO_LOCAL_SESSION_KEY = "sbl_demo_local_session";

const demoUser: AppUser = {
  id: "demo-admin",
  email: "admin@radiosbl.go.id",
  displayName: "Admin Radio SBL",
  role: "admin",
  employeeId: "SBL-001",
  active: true
};

function getDemoSessionStorage(rememberSession: boolean): Storage {
  return rememberSession ? localStorage : sessionStorage;
}

function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
  localStorage.removeItem(DEMO_LOCAL_SESSION_KEY);
}

function saveDemoSession(session: AuthSession, rememberSession: boolean): void {
  clearDemoSession();
  getDemoSessionStorage(rememberSession).setItem(
    rememberSession ? DEMO_LOCAL_SESSION_KEY : DEMO_SESSION_KEY,
    JSON.stringify(session)
  );
}

function readDemoSession(): AuthSession | null {
  const cached =
    sessionStorage.getItem(DEMO_SESSION_KEY) ??
    localStorage.getItem(DEMO_LOCAL_SESSION_KEY);

  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as AuthSession;
  } catch {
    clearDemoSession();
    return null;
  }
}

export async function signIn(
  email: string,
  password: string,
  rememberSession = true
): Promise<AuthSession> {
  if (!email || !password) {
    throw new Error("Email dan password wajib diisi.");
  }

  if (!hasFirebaseConfig()) {
    const session: AuthSession = {
      user: { ...demoUser, email },
      provider: "demo"
    };
    saveDemoSession(session, rememberSession);
    return session;
  }

  const [{ loginWithEmail }, { getUserProfile }] = await Promise.all([
    import("./firebaseAuth.service"),
    import("./userProfile.service")
  ]);
  const firebaseUser = await loginWithEmail(email, password, rememberSession);
  
  // Ekstrak WhatsApp jika email berformat nomor@radiosbl.com
  let whatsappFallback = undefined;
  if (email.endsWith("@radiosbl.com")) {
    const part = email.split("@")[0];
    if (/^\d+$/.test(part)) {
      whatsappFallback = part;
    }
  }

  const user = await getUserProfile(firebaseUser.uid, {
    email: firebaseUser.email ?? email,
    displayName: firebaseUser.displayName ?? "Pengguna Radio SBL",
    photoUrl: firebaseUser.photoURL ?? undefined,
    whatsapp: whatsappFallback
  });

  return {
    user,
    provider: "firebase"
  };
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  whatsapp: string,
  rememberSession = true
): Promise<AuthSession> {
  if (!email || !password || !name || !whatsapp) {
    throw new Error("Semua kolom (Nama, WhatsApp, Email, dan Password) wajib diisi.");
  }

  if (!hasFirebaseConfig()) {
    const session: AuthSession = {
      user: { ...demoUser, email, displayName: name, role: "public", whatsapp },
      provider: "demo"
    };
    saveDemoSession(session, rememberSession);
    return session;
  }

  const [{ registerWithEmail }, { getUserProfile, upsertUserProfile }] = await Promise.all([
    import("./firebaseAuth.service"),
    import("./userProfile.service")
  ]);
  
  const firebaseUser = await registerWithEmail(email, password, name, rememberSession);
  
  // Create initial profile in Firestore database for access control
  await upsertUserProfile(firebaseUser.uid, {
    email: firebaseUser.email ?? email,
    displayName: name,
    photoUrl: firebaseUser.photoURL ?? undefined,
    whatsapp,
    role: "public",
    active: true
  });

  const user = await getUserProfile(firebaseUser.uid, {
    email: firebaseUser.email ?? email,
    displayName: name,
    photoUrl: firebaseUser.photoURL ?? undefined
  });

  return {
    user,
    provider: "firebase"
  };
}

export async function signInWithGoogle(rememberSession = true): Promise<AuthSession> {
  if (!hasFirebaseConfig()) {
    const session: AuthSession = {
      user: { ...demoUser, displayName: "Admin Radio SBL" },
      provider: "demo"
    };
    saveDemoSession(session, rememberSession);
    return session;
  }

  const [{ loginWithGoogle }, { getUserProfile }] = await Promise.all([
    import("./firebaseAuth.service"),
    import("./userProfile.service")
  ]);
  const firebaseUser = await loginWithGoogle(rememberSession);
  const user = await getUserProfile(firebaseUser.uid, {
    email: firebaseUser.email ?? "google-user@radiosbl.go.id",
    displayName: firebaseUser.displayName ?? "Pengguna Google Radio SBL",
    photoUrl: firebaseUser.photoURL ?? undefined
  });

  return {
    user,
    provider: "firebase"
  };
}

export async function signOut(provider: AuthSession["provider"]): Promise<void> {
  if (provider === "demo") {
    clearDemoSession();
    return;
  }
  if (provider === "firebase") {
    const { logout: firebaseLogout } = await import("./firebaseAuth.service");
    await firebaseLogout();
  }
}

export function subscribeToSession(
  onSession: (session: AuthSession | null) => void
): () => void {
  if (!hasFirebaseConfig()) {
    onSession(readDemoSession());
    return () => {};
  }

  let unsubscribe = () => {};

  Promise.all([
    import("./firebaseAuth.service"),
    import("./userProfile.service")
  ]).then(([{ subscribeAuthState }, { getUserProfile }]) => {
    unsubscribe = subscribeAuthState(async (firebaseUser) => {
      if (!firebaseUser) {
        onSession(null);
        return;
      }
      try {
        const user = await getUserProfile(firebaseUser.uid, {
          email: firebaseUser.email ?? "user@radiosbl.go.id",
          displayName: firebaseUser.displayName ?? "Pengguna Radio SBL",
          photoUrl: firebaseUser.photoURL ?? undefined,
          whatsapp: firebaseUser.phoneNumber ?? undefined
        });
        onSession({ user, provider: "firebase" });
      } catch (err) {
        console.error("Gagal membaca profil sesi", err);
        onSession(null);
      }
    });
  });

  return () => unsubscribe();
}

export async function updateUserProfile(uid: string, payload: Partial<AppUser>): Promise<void> {
  if (!hasFirebaseConfig()) {
    const cached = readDemoSession();
    if (cached) {
      const newSession: AuthSession = {
        ...cached,
        user: { ...cached.user, ...payload }
      };
      const rememberSession = localStorage.getItem(DEMO_LOCAL_SESSION_KEY) !== null;
      saveDemoSession(newSession, rememberSession);
    }
    return;
  }
  const { upsertUserProfile } = await import("./userProfile.service");
  await upsertUserProfile(uid, payload);
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!hasFirebaseConfig()) return; // Not supported in demo
  const { changeUserPassword } = await import("./firebaseAuth.service");
  await changeUserPassword(newPassword);
}

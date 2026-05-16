import { hasFirebaseConfig } from "../lib/env";
import type { AppUser } from "../types/domain";

export type AuthSession = {
  user: AppUser;
  provider: "firebase" | "demo";
};

const DEMO_SESSION_KEY = "sbl_demo_session";

const demoUser: AppUser = {
  id: "demo-admin",
  email: "admin@radiosbl.go.id",
  displayName: "Admin Radio SBL",
  role: "admin",
  employeeId: "SBL-001",
  active: true
};

export async function signIn(email: string, password: string): Promise<AuthSession> {
  if (!email || !password) {
    throw new Error("Email dan password wajib diisi.");
  }

  if (!hasFirebaseConfig()) {
    const session: AuthSession = {
      user: { ...demoUser, email },
      provider: "demo"
    };
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    return session;
  }

  const [{ loginWithEmail }, { getUserProfile }] = await Promise.all([
    import("./firebaseAuth.service"),
    import("./userProfile.service")
  ]);
  const firebaseUser = await loginWithEmail(email, password);
  
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

export async function signUp(email: string, password: string, name: string, whatsapp: string): Promise<AuthSession> {
  if (!email || !password || !name || !whatsapp) {
    throw new Error("Semua kolom (Nama, WhatsApp, Email, dan Password) wajib diisi.");
  }

  if (!hasFirebaseConfig()) {
    const session: AuthSession = {
      user: { ...demoUser, email, displayName: name, role: "public", whatsapp },
      provider: "demo"
    };
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    return session;
  }

  const [{ registerWithEmail }, { getUserProfile, upsertUserProfile }] = await Promise.all([
    import("./firebaseAuth.service"),
    import("./userProfile.service")
  ]);
  
  const firebaseUser = await registerWithEmail(email, password, name);
  
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

export async function signInWithGoogle(): Promise<AuthSession> {
  if (!hasFirebaseConfig()) {
    const session: AuthSession = {
      user: { ...demoUser, displayName: "Admin Radio SBL" },
      provider: "demo"
    };
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    return session;
  }

  const [{ loginWithGoogle }, { getUserProfile }] = await Promise.all([
    import("./firebaseAuth.service"),
    import("./userProfile.service")
  ]);
  const firebaseUser = await loginWithGoogle();
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
    sessionStorage.removeItem(DEMO_SESSION_KEY);
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
    const cached = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (cached) {
      try {
        onSession(JSON.parse(cached));
      } catch {
        onSession(null);
      }
    } else {
      onSession(null);
    }
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
    const cached = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (cached) {
      const session = JSON.parse(cached) as AuthSession;
      const newSession: AuthSession = {
        ...session,
        user: { ...session.user, ...payload }
      };
      sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(newSession));
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

import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword as fbUpdatePassword,
  createUserWithEmailAndPassword,
  updateProfile,
  type User
} from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const cleanEmail = email.trim().toLowerCase();

  try {
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return credential.user;
  } catch (error: any) {
    const errorCode = error.code || "";
    
    // Logika Auto-Onboarding untuk staf SBL
    if (
      (errorCode.includes("user-not-found") || errorCode.includes("invalid-credential")) &&
      cleanEmail.endsWith("@radiosbl.com")
    ) {
      try {
        console.log("Pendaftaran otomatis staf SBL...");
        const name = cleanEmail.split("@")[0].toUpperCase();
        return await registerWithEmail(cleanEmail, password, name);
      } catch (regError) {
        throw error;
      }
    }
    throw error;
  }
}

export async function registerWithEmail(email: string, password: string, displayName: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account"
  });
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export async function logout(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export function subscribeAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function changeUserPassword(newPassword: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) throw new Error("Pengguna belum login atau sesi telah berakhir.");
  await fbUpdatePassword(auth.currentUser, newPassword);
}

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getEnv, hasFirebaseConfig } from "./env";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase env belum lengkap. Isi .env.local berdasarkan .env.example.");
  }

  if (!app) {
    app = initializeApp({
      apiKey: getEnv("VITE_FIREBASE_API_KEY"),
      authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
      projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
      storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
      appId: getEnv("VITE_FIREBASE_APP_ID"),
      messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
      measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID")
    });
  }

  return app;
}

export function getFirebaseAuth(): Auth {
  auth ??= getAuth(getFirebaseApp());
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  firestore ??= getFirestore(getFirebaseApp());
  return firestore;
}

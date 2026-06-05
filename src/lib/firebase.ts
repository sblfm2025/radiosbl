import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getEnv,
  hasFirebaseConfig,
  hasGatewayFirebaseConfig,
  hasRecordingFirebaseConfig
} from "./env";

let app: FirebaseApp | null = null;
let gatewayApp: FirebaseApp | null = null;
let recordingApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let gatewayFirestore: Firestore | null = null;
let recordingFirestore: Firestore | null = null;

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

export function getGatewayFirebaseApp(): FirebaseApp {
  if (!hasGatewayFirebaseConfig()) {
    throw new Error("Firebase gateway env belum lengkap. Isi VITE_GATEWAY_FIREBASE_* di .env.local.");
  }

  if (!gatewayApp) {
    gatewayApp = initializeApp(
      {
        apiKey: getEnv("VITE_GATEWAY_FIREBASE_API_KEY"),
        authDomain: getEnv("VITE_GATEWAY_FIREBASE_AUTH_DOMAIN"),
        projectId: getEnv("VITE_GATEWAY_FIREBASE_PROJECT_ID"),
        storageBucket: getEnv("VITE_GATEWAY_FIREBASE_STORAGE_BUCKET"),
        appId: getEnv("VITE_GATEWAY_FIREBASE_APP_ID"),
        messagingSenderId: getEnv("VITE_GATEWAY_FIREBASE_MESSAGING_SENDER_ID")
      },
      "gateway"
    );
  }

  return gatewayApp;
}

export function getGatewayFirestore(): Firestore {
  gatewayFirestore ??= getFirestore(getGatewayFirebaseApp());
  return gatewayFirestore;
}

export function getRecordingFirebaseApp(): FirebaseApp {
  if (!hasRecordingFirebaseConfig()) {
    throw new Error("Firebase recording env belum lengkap. Isi VITE_RECORDING_FIREBASE_* di .env.local.");
  }

  if (!recordingApp) {
    recordingApp = initializeApp(
      {
        apiKey: getEnv("VITE_RECORDING_FIREBASE_API_KEY"),
        authDomain: getEnv("VITE_RECORDING_FIREBASE_AUTH_DOMAIN"),
        projectId: getEnv("VITE_RECORDING_FIREBASE_PROJECT_ID"),
        storageBucket: getEnv("VITE_RECORDING_FIREBASE_STORAGE_BUCKET"),
        appId: getEnv("VITE_RECORDING_FIREBASE_APP_ID"),
        messagingSenderId: getEnv("VITE_RECORDING_FIREBASE_MESSAGING_SENDER_ID")
      },
      "recording"
    );
  }

  return recordingApp;
}

export function getRecordingFirestore(): Firestore {
  recordingFirestore ??= getFirestore(getRecordingFirebaseApp());
  return recordingFirestore;
}

import { getStorage, type FirebaseStorage } from "firebase/storage";
let storage: FirebaseStorage | null = null;
export function getFirebaseStorage(): FirebaseStorage {
  storage ??= getStorage(getFirebaseApp());
  return storage;
}

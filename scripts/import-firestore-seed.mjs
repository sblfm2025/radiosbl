import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import { doc, getFirestore, writeBatch } from "firebase/firestore";

const seedFile = resolve("tmp/firestore-seed.json");
const writeMode = process.argv.includes("--write");

const collectionNames = [
  "announcers",
  "broadcastPrograms",
  "broadcastSchedules",
  "streamingSettings",
  "appSettings"
];

async function loadLocalEnv() {
  const envFile = resolve(".env.local");

  try {
    const content = await readFile(envFile, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=");
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getFirebaseConfig() {
  return {
    apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: requiredEnv("VITE_FIREBASE_APP_ID"),
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
  };
}

function buildWritePlan(seed) {
  const operations = [];

  for (const collectionName of collectionNames) {
    const documents = seed[collectionName];

    if (!Array.isArray(documents)) {
      throw new Error(`Seed collection "${collectionName}" must be an array.`);
    }

    for (const document of documents) {
      if (!document?.id || typeof document.id !== "string") {
        throw new Error(`Seed document in "${collectionName}" is missing a string id.`);
      }

      operations.push({
        collectionName,
        id: document.id,
        data: document
      });
    }
  }

  return operations;
}

async function loadSeed() {
  try {
    const seedJson = await readFile(seedFile, "utf8");
    return JSON.parse(seedJson);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Seed file not found at ${seedFile}. Run "npm run seed:export" first.`);
    }

    throw error;
  }
}

function logPlan(operations) {
  const counts = Object.fromEntries(
    collectionNames.map((collectionName) => [
      collectionName,
      operations.filter((operation) => operation.collectionName === collectionName).length
    ])
  );

  console.log(writeMode ? "Firestore seed import: WRITE MODE" : "Firestore seed import: dry-run");
  console.log(`Seed file: ${seedFile}`);
  console.log(JSON.stringify(counts, null, 2));
}

const seed = await loadSeed();
const operations = buildWritePlan(seed);

logPlan(operations);

if (!writeMode) {
  console.log('No data written. Run "npm run seed:import:write" to import to Firestore.');
  process.exit(0);
}

await loadLocalEnv();

const app = initializeApp(getFirebaseConfig());
const db = getFirestore(app);
const batch = writeBatch(db);

for (const operation of operations) {
  batch.set(doc(db, operation.collectionName, operation.id), operation.data, { merge: true });
}

await batch.commit();

console.log(`Imported ${operations.length} Firestore seed documents.`);

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const seedFile = resolve("tmp/firestore-seed.json");
const firebaseToolsConfig = join(homedir(), ".config", "configstore", "firebase-tools.json");

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

async function loadFirebaseCliAccessToken() {
  const configJson = await readFile(firebaseToolsConfig, "utf8");
  const config = JSON.parse(configJson);
  const token = config.tokens?.access_token;
  const expiresAt = config.tokens?.expires_at;

  if (!token) {
    throw new Error("Firebase CLI access token not found. Run `firebase login` first.");
  }

  if (typeof expiresAt === "number" && expiresAt <= Date.now() + 60_000) {
    throw new Error(
      "Firebase CLI access token is expired. Run a Firebase CLI command, then retry."
    );
  }

  return token;
}

function toFirestoreValue(value) {
  if (value === null) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }

    return { doubleValue: value };
  }

  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [key, toFirestoreValue(nestedValue)])
        )
      }
    };
  }

  throw new Error(`Unsupported Firestore value type: ${typeof value}`);
}

function toFirestoreFields(data) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)])
  );
}

function documentName(projectId, collectionName, id) {
  return [
    `projects/${projectId}/databases/(default)/documents`,
    encodeURIComponent(collectionName),
    encodeURIComponent(id)
  ].join("/");
}

async function commitBatch(projectId, accessToken, operations) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  const writes = operations.map((operation) => ({
    update: {
      name: documentName(projectId, operation.collectionName, operation.id),
      fields: toFirestoreFields(operation.data)
    },
    updateMask: {
      fieldPaths: Object.keys(operation.data).filter((key) => operation.data[key] !== undefined)
    }
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ writes })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firestore REST commit failed (${response.status}): ${body}`);
  }

  return response.json();
}

await loadLocalEnv();

const projectId = requiredEnv("VITE_FIREBASE_PROJECT_ID");
const seed = await loadSeed();
const operations = buildWritePlan(seed);
const accessToken = await loadFirebaseCliAccessToken();
const counts = Object.fromEntries(
  collectionNames.map((collectionName) => [
    collectionName,
    operations.filter((operation) => operation.collectionName === collectionName).length
  ])
);

console.log("Firestore seed import: CLI REST WRITE MODE");
console.log(`Project: ${projectId}`);
console.log(`Seed file: ${seedFile}`);
console.log(JSON.stringify(counts, null, 2));

await commitBatch(projectId, accessToken, operations);

console.log(`Imported ${operations.length} Firestore seed documents via Firebase CLI credentials.`);

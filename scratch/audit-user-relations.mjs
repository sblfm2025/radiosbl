import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const firebaseToolsConfig = join(homedir(), ".config", "configstore", "firebase-tools.json");

const relationFields = {
  attendanceRecords: ["userId"],
  driveFiles: ["ownerId"],
  schedule_swaps: ["requesterId", "targetAnnouncerId"],
  programScriptDrafts: ["createdBy"],
  liveEvents: ["crewIds"],
  aiLogs: ["userId"],
  activityLogs: ["userId", "actorId"],
  notifications: ["userId"],
  coverageAssignments: ["assignedToId"],
  coverageReports: ["reporterId"]
};

async function loadLocalEnv() {
  const envFile = resolve(".env.local");
  const content = await readFile(envFile, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=");
  }
}

async function loadFirebaseCliAccessToken() {
  const configJson = await readFile(firebaseToolsConfig, "utf8");
  const config = JSON.parse(configJson);
  return config.tokens?.access_token;
}

function fromFirestoreValue(value) {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number.parseInt(value.integerValue, 10);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nested]) => [
        key,
        fromFirestoreValue(nested)
      ])
    );
  }
  if ("nullValue" in value) return null;
  return undefined;
}

function fromFirestoreDocument(document) {
  const id = document.name.split("/").pop();
  return {
    id,
    ...Object.fromEntries(
      Object.entries(document.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)])
    )
  };
}

async function listCollection(projectId, collectionName, accessToken) {
  const docs = [];
  let pageToken = "";

  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`
    );
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (response.status === 404) return [];
    if (!response.ok) {
      throw new Error(`${collectionName}: HTTP ${response.status} ${await response.text()}`);
    }

    const payload = await response.json();
    docs.push(...(payload.documents || []).map(fromFirestoreDocument));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);

  return docs;
}

function addRelation(summary, userId, collectionName, fieldName, docId) {
  if (!summary[userId]) return;
  const key = `${collectionName}.${fieldName}`;
  summary[userId].relations[key] ??= [];
  summary[userId].relations[key].push(docId);
}

async function run() {
  await loadLocalEnv();
  const accessToken = await loadFirebaseCliAccessToken();
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

  if (!accessToken) throw new Error("Token Firebase CLI tidak ditemukan.");
  if (!projectId) throw new Error("VITE_FIREBASE_PROJECT_ID tidak ditemukan.");

  const users = await listCollection(projectId, "users", accessToken);
  const summary = Object.fromEntries(
    users.map((user) => [
      user.id,
      {
        id: user.id,
        name: user.displayName || "-",
        role: user.role || "-",
        active: user.active ?? "-",
        whatsapp: user.whatsapp || "-",
        email: user.email || "-",
        relations: {}
      }
    ])
  );

  const collectionCounts = { users: users.length };

  for (const [collectionName, fields] of Object.entries(relationFields)) {
    const docs = await listCollection(projectId, collectionName, accessToken);
    collectionCounts[collectionName] = docs.length;

    for (const item of docs) {
      for (const field of fields) {
        const value = item[field];
        if (Array.isArray(value)) {
          for (const id of value) addRelation(summary, id, collectionName, field, item.id);
        } else {
          addRelation(summary, value, collectionName, field, item.id);
        }
      }
    }
  }

  console.log("Collection counts");
  console.table(
    Object.entries(collectionCounts).map(([collection, count]) => ({ collection, count }))
  );

  console.log("\nUser relation summary");
  console.table(
    Object.values(summary).map((user) => {
      const relationTotal = Object.values(user.relations).reduce(
        (total, docs) => total + docs.length,
        0
      );
      return {
        ID: user.id,
        Nama: user.name,
        Role: user.role,
        Aktif: user.active,
        Relasi: relationTotal,
        Terhubung: Object.keys(user.relations).join(", ") || "-"
      };
    })
  );
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

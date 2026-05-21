/**
 * Radio SBL Google Drive upload endpoint for Google Apps Script.
 *
 * Deploy:
 * 1. Open https://script.google.com and create a new project.
 * 2. Paste this file into Code.gs.
 * 3. Deploy > New deployment > Web app.
 * 4. Execute as: Me.
 * 5. Who has access: Anyone.
 * 6. Copy the Web app URL into VITE_GOOGLE_DRIVE_APPS_SCRIPT_ENDPOINT.
 *
 * Update existing deployment:
 * 1. Paste the latest version of this file into Code.gs.
 * 2. Deploy > Manage deployments.
 * 3. Edit the existing Web app deployment.
 * 4. Version: New version.
 * 5. Deploy. Keep using the same Web app URL.
 */

const SCRIPT_VERSION = "2026-05-21-drive-validation-v1";
const ROOT_FOLDER_NAME = "LPPL-RADIO";
const SHARE_WITH_LINK = false;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MODULES = ["attendance", "liputan", "uploads", "attendance-healthcheck"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function sanitizeName(value) {
  return String(value || "")
    .split("")
    .map(function (character) {
      return /[<>:"/\\|?*\x00-\x1f]/.test(character) ? "-" : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function getOrCreateFolder(name, parentFolder) {
  const iterator = parentFolder
    ? parentFolder.getFoldersByName(name)
    : DriveApp.getFoldersByName(name);

  if (iterator.hasNext()) {
    return iterator.next();
  }

  return parentFolder
    ? parentFolder.createFolder(name)
    : DriveApp.createFolder(name);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function isAllowedValue(value, allowedValues) {
  return allowedValues.indexOf(value) !== -1;
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: "Radio SBL Google Drive upload",
    version: SCRIPT_VERSION,
    rootFolder: ROOT_FOLDER_NAME
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : "{}");
    const fileBase64 = String(payload.fileBase64 || "");
    const fileName = sanitizeName(payload.fileName || "upload");
    const mimeType = String(payload.mimeType || "application/octet-stream");
    const moduleName = sanitizeName(payload.module || "uploads");
    const ownerId = sanitizeName(payload.ownerId || "unknown");

    if (!fileBase64 || !fileName) {
      return jsonResponse({ error: "File upload tidak lengkap." });
    }

    if (!isAllowedValue(moduleName, ALLOWED_MODULES)) {
      return jsonResponse({ error: "Kategori upload tidak diizinkan." });
    }

    if (!isAllowedValue(mimeType, ALLOWED_MIME_TYPES)) {
      return jsonResponse({ error: "Tipe file tidak diizinkan." });
    }

    const bytes = Utilities.base64Decode(fileBase64);

    if (bytes.length > MAX_FILE_SIZE_BYTES) {
      return jsonResponse({ error: "Ukuran file melebihi batas 10 MB." });
    }

    const rootFolder = getOrCreateFolder(ROOT_FOLDER_NAME);
    const moduleFolder = getOrCreateFolder(moduleName, rootFolder);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const driveFileName = sanitizeName(`${timestamp}-${ownerId}-${fileName}`);
    const blob = Utilities.newBlob(bytes, mimeType, driveFileName);
    const file = moduleFolder.createFile(blob);
    file.setDescription(`Radio SBL upload module=${moduleName} owner=${ownerId}`);

    if (SHARE_WITH_LINK) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    return jsonResponse({
      id: file.getId(),
      driveFileId: file.getId(),
      name: file.getName(),
      mimeType: mimeType,
      size: bytes.length,
      webViewLink: file.getUrl(),
      module: moduleName,
      ownerId: ownerId,
      scriptVersion: SCRIPT_VERSION,
      createdAt: file.getDateCreated().toISOString()
    });
  } catch (error) {
    return jsonResponse({
      error: error && error.message ? error.message : "Upload Google Drive gagal."
    });
  }
}

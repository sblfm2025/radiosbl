export type DeviceInfo = {
  type: "mobile" | "tablet" | "desktop" | "unknown";
  os: string;
  browser: string;
};

export function getDeviceInfo(userAgentString?: string): DeviceInfo {
  const ua = userAgentString || (typeof navigator !== "undefined" ? navigator.userAgent : "") || "";
  
  // OS Detection
  let os = "Unknown OS";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua) && !/ipad|iphone|ipod/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  // Browser Detection
  let browser = "Unknown Browser";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/opr/i.test(ua) || /opera/i.test(ua)) browser = "Opera";

  // Device Type Detection
  let type: DeviceInfo["type"] = "desktop";
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    type = "tablet";
  } else if (/mobile|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    type = "mobile";
  } else if (/android/i.test(ua)) {
    // Android without mobile token is tablet usually, but we check if mobile is absent
    type = /mobile/i.test(ua) ? "mobile" : "tablet";
  }

  return { type, os, browser };
}

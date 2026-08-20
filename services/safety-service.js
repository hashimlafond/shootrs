import { settings } from "../config/settings.js";

const adminKeyStorageKey = "shootr-admin-api-key";
const currentUserId = "local-review-user";
const safetyCollections = [
  "reports",
  "incidents",
  "supportCases",
  "blocks",
  "moderationEvents",
  "moderationActions",
  "removedContent",
  "suspensions",
  "termsAcceptances",
];

function apiBase() {
  const configured = settings.safetyApiBaseUrl || "";
  if (configured) return configured.replace(/\/$/, "");
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("shootr-api-base-url") || "";
    if (stored) return stored.replace(/\/$/, "");
  }
  return "";
}

function apiUrl(path) {
  return `${apiBase()}${path}`;
}

export function getCurrentUserId() {
  return currentUserId;
}

export function getAdminApiKey({ promptIfMissing = false } = {}) {
  if (typeof localStorage === "undefined") return "";
  const existing = localStorage.getItem(adminKeyStorageKey) || "";
  if (existing || !promptIfMissing || typeof window === "undefined") return existing;
  const entered = window.prompt("Enter Shootr admin key to load shared moderation records.");
  if (entered) localStorage.setItem(adminKeyStorageKey, entered);
  return entered || "";
}

export async function fetchSafetyState({ admin = false } = {}) {
  const headers = {};
  if (admin) {
    const key = getAdminApiKey({ promptIfMissing: true });
    if (!key) return null;
    headers["x-shootr-admin-key"] = key;
  }
  const response = await fetch(apiUrl(`/api/safety/state?userId=${encodeURIComponent(currentUserId)}`), {
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Safety state request failed: ${response.status}`);
  return response.json();
}

export async function submitSafetyRecord(type, record, { admin = false } = {}) {
  const headers = { "content-type": "application/json" };
  if (admin) {
    const key = getAdminApiKey({ promptIfMissing: true });
    if (!key) throw new Error("Admin key required.");
    headers["x-shootr-admin-key"] = key;
  }
  const response = await fetch(apiUrl("/api/safety/records"), {
    method: "POST",
    headers,
    body: JSON.stringify({ type, record }),
  });
  if (!response.ok) throw new Error(`Safety record request failed: ${response.status}`);
  return response.json();
}

export async function submitModerationAction(record) {
  const key = getAdminApiKey({ promptIfMissing: true });
  if (!key) throw new Error("Admin key required.");
  const response = await fetch(apiUrl("/api/safety/moderation-actions"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shootr-admin-key": key,
    },
    body: JSON.stringify({ record }),
  });
  if (!response.ok) throw new Error(`Moderation action request failed: ${response.status}`);
  return response.json();
}

export function mergeSafetyState(store, state) {
  if (!state) return false;
  let changed = false;
  for (const key of safetyCollections) {
    if (!Array.isArray(state[key])) continue;
    const local = Array.isArray(store[key]) ? store[key] : [];
    const byId = new Map(local.map((item) => [item.id, item]));
    for (const item of state[key]) {
      if (!item?.id) continue;
      const before = JSON.stringify(byId.get(item.id) || null);
      const after = JSON.stringify(item);
      if (before !== after) changed = true;
      byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
    }
    store[key] = Array.from(byId.values());
  }
  return changed;
}

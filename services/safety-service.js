const currentUserId = "local-review-user";
const cloudKitPluginName = "ShootrsCloudKitSafety";
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

function cloudKitPlugin() {
  return globalThis.Capacitor?.Plugins?.[cloudKitPluginName] || null;
}

function unavailable() {
  return new Error("CloudKit safety backend is not available until the iCloud container and native CloudKit bridge are configured.");
}

export function getCurrentUserId() {
  return currentUserId;
}

export async function fetchSafetyState({ admin = false } = {}) {
  const plugin = cloudKitPlugin();
  if (!plugin?.fetchSafetyState) throw unavailable();
  return plugin.fetchSafetyState({ userId: currentUserId, admin });
}

export async function submitSafetyRecord(type, record) {
  const plugin = cloudKitPlugin();
  if (!plugin?.saveSafetyRecord) throw unavailable();
  return plugin.saveSafetyRecord({ type, record: { ...record, userId: record?.userId || currentUserId } });
}

export async function submitModerationAction(record) {
  const plugin = cloudKitPlugin();
  if (!plugin?.saveModerationAction) throw unavailable();
  return plugin.saveModerationAction({ record });
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

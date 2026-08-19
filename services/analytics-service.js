export function track(store, eventName, properties = {}) {
  store.analytics.push({
    eventName,
    properties,
    createdAt: new Date().toISOString(),
  });
}

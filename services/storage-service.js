const STORAGE_KEY = "shootr-platform-store-v1";

export function createInitialStore(fixtures = {}) {
  return {
    users: [],
    shootrs: fixtures.shootrs || [],
    bookings: fixtures.bookings || [],
    waitlist: [],
    serviceZones: fixtures.serviceZones || [],
    incidents: [],
    notifications: [],
    messages: [],
    galleries: [],
    reviews: [],
    referrals: [],
    analytics: [],
    reports: [],
    moderationEvents: [],
    moderationActions: [],
    removedContent: [],
    suspensions: [],
    termsAcceptances: [],
    featureSettings: {},
    pricingConfig: {},
    rightsGrants: [],
    editingRequests: [],
    blocks: [],
    supportCases: [],
  };
}

export function loadStore(fixtures) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialStore(fixtures);

  try {
    return { ...createInitialStore(fixtures), ...JSON.parse(raw) };
  } catch {
    return createInitialStore(fixtures);
  }
}

export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function resetStore(fixtures) {
  const store = createInitialStore(fixtures);
  saveStore(store);
  return store;
}

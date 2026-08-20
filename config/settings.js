export const MARKETPLACE_MODES = {
  WAITLIST: "availability_alerts",
  PILOT: "pilot",
  LIVE: "live",
};

const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const appEnvironment = env.VITE_SHOOTR_ENV || "local";
const releaseLikeEnvironment = ["testflight", "production"].includes(appEnvironment);
const demoModeOverride = env.VITE_SHOOTR_DEMO_MODE;
const demoMode = demoModeOverride === "true" ? true : demoModeOverride === "false" ? false : !releaseLikeEnvironment;
const safetyApiBaseUrl = env.VITE_SHOOTR_API_BASE_URL || "";

export const settings = {
  appEnvironment,
  safetyApiBaseUrl,
  marketplaceMode: MARKETPLACE_MODES.WAITLIST,
  demoMode,
  privateHomeImmediateRequestsEnabled: false,
  urgentRequestExpiryMinutes: 20,
  matchingExpansionMinutes: [3, 7, 12],
  offerIncrements: [10, 25, 50],
  galleryStorageDays: 90,
  storageLimitMb: 500,
  deliveryTargets: {
    quick_capture: "Same day target",
    standard_moment: "Within 24 hours target",
    extended_moment: "Within 48 hours target",
  },
  reputationLevels: {
    proven: {
      label: "Proven",
      minimumCompletedJobs: 10,
      requiresProfileReview: true,
      requiresIdentityVerification: true,
      requiresPhoneVerification: true,
      requiresEmailVerification: true,
      maximumIncidentCount: 0,
    },
    reliable: {
      label: "Reliable",
      minimumCompletedJobs: 15,
      minimumRating: 4.7,
      requiresIdentityVerification: true,
      requiresPhoneVerification: true,
      requiresEmailVerification: true,
      maximumCancellationRate: 0.08,
      maximumIncidentCount: 0,
    },
    elite: {
      label: "Elite",
      minimumCompletedJobs: 50,
      minimumRating: 4.85,
      requiresIdentityVerification: true,
      requiresPhoneVerification: true,
      requiresEmailVerification: true,
      maximumCancellationRate: 0.04,
      maximumIncidentCount: 0,
    },
    topShootr: {
      label: "Top Shootr",
      minimumCompletedJobs: 100,
      minimumRating: 4.9,
      requiresIdentityVerification: true,
      requiresPhoneVerification: true,
      requiresEmailVerification: true,
      maximumCancellationRate: 0.03,
      maximumIncidentCount: 0,
    },
  },
  pricing: {
    serviceFeeRate: 0.1,
    platformCommissionRate: 0.2,
    paymentProcessingRate: 0,
    paymentProcessingFixed: 0,
    urgencyFee: 15,
    includedTravelMiles: 8,
    travelFeePerMile: 2,
    defaultTaxRate: 0,
  },
  featureFlags: {
    DEMO_MODE: demoMode,
    public_booking: true,
    urgent_booking: true,
    later_booking: true,
    background_checks: false,
    editing_requests: false,
    tips: false,
    apple_pay: false,
    stripe_payments: false,
    stripe_connect: false,
    business_accounts: false,
    subscriptions: false,
    referrals: true,
    households: false,
    private_home_bookings: false,
    push_notifications: false,
    dynamic_pricing: false,
    increased_offer_flow: true,
    payments: false,
    maps: false,
    sms: false,
    push: false,
    applePay: false,
    publicBooking: true,
    urgentBooking: true,
    privateHomeBooking: false,
    permanentVaultStorage: false,
    businessAccounts: false,
    agencyAccounts: false,
    dynamicPricing: false,
    increasedOffers: true,
    nativeCamera: false,
    backgroundChecks: false,
    publicShootrScore: false,
    galleryWatermarking: false,
  },
  adapters: {
    auth: "mock",
    database: "localStorage",
    objectStorage: "mock-signed-url",
    imageProcessing: "mock-thumbnailer",
    maps: "mock",
    geolocation: "browser",
    eta: "mock",
    payments: "mock",
    sms: "mock",
    email: "mock",
    push: "mock",
    analytics: "local",
    identityVerification: "manual-review",
  },
};

export function isFeatureEnabled(flag) {
  if (flag === "DEMO_MODE") return Boolean(settings.demoMode && settings.featureFlags.DEMO_MODE);
  return Boolean(settings.featureFlags[flag]);
}

export const statusLabels = {
  waitlist: "Availability alerts",
  availability_alerts: "Availability alerts",
  recruiting: "Recruiting",
  pilot: "Pilot",
  active: "Active",
  paused: "Paused",
};

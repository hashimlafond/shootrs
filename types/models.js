export const bookingStatuses = [
  "draft",
  "submitted",
  "searching",
  "offered",
  "temporarily_locked",
  "accepted",
  "payment_authorized",
  "confirmed",
  "shootr_en_route",
  "shootr_arrived",
  "in_progress",
  "awaiting_upload",
  "awaiting_delivery",
  "uploading",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
  "issue_reported",
  "refunded",
  "expired",
];

export const onboardingStatuses = [
  "started",
  "identity_pending",
  "portfolio_pending",
  "review_pending",
  "approved",
  "rejected",
  "suspended",
];

export const roles = {
  SUBJECT: "subject",
  SHOOTR: "shootr",
  BUSINESS: "business",
  AGENCY: "agency",
  ADMIN: "admin",
};

export const availabilityStatuses = ["Available Now", "Available Later", "Scheduled Availability", "Offline"];

export const locationPermissionStates = ["not requested", "granted", "denied", "unavailable", "timed out"];

export const modelSchemas = [
  "User",
  "UserRole",
  "SubjectProfile",
  "ShootrProfile",
  "Business",
  "Agency",
  "AgencyMembership",
  "ServiceArea",
  "Availability",
  "Request",
  "Booking",
  "BookingStatus",
  "Location",
  "Package",
  "PriceBreakdown",
  "Payment",
  "Payout",
  "Gallery",
  "Photo",
  "Upload",
  "Favorite",
  "Review",
  "Tip",
  "Message",
  "Notification",
  "ShareLink",
  "Consent",
  "RightsGrant",
  "EditingRequest",
  "TrustStatus",
  "ShootrMetrics",
  "Incident",
  "SupportCase",
  "Referral",
  "FeatureFlag",
];

export function createTrustStatus(overrides = {}) {
  return {
    identityVerificationStatus: "not_started",
    phoneVerificationStatus: "not_started",
    emailVerificationStatus: "not_started",
    ageVerificationStatus: "not_started",
    portfolioReviewStatus: "not_started",
    equipmentVerificationStatus: "not_required",
    backgroundCheckStatus: "not_started",
    safetyIncidentStatus: "clear",
    accountStanding: "pending",
    ...overrides,
  };
}

export function createShootrMetrics(overrides = {}) {
  return {
    completedBookings: 0,
    onTimeRate: null,
    responseTimeMinutes: null,
    cancellationRate: null,
    deliveryRate: null,
    averageRating: null,
    wouldBookAgainRate: null,
    ...overrides,
  };
}

export function createRightsGrant(overrides = {}) {
  return {
    copyrightOwner: "shootr",
    customerLicenseType: "personal_private_use",
    commercialUsePermission: false,
    shootrPortfolioPermission: false,
    shootrSocialPostingPermission: false,
    shootrPlatformMarketingPermission: false,
    expiresAt: null,
    consentTimestamp: null,
    consentActor: null,
    revoked: false,
    ...overrides,
  };
}

export function createEditingRequest(overrides = {}) {
  return {
    editingRequested: false,
    editingType: null,
    editingNotes: "",
    editingStatus: "not_requested",
    editingFee: 0,
    revisionCount: 0,
    beforeAssetRefs: [],
    afterAssetRefs: [],
    ...overrides,
  };
}

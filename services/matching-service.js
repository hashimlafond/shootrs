export function scoreShootrForRequest(shootr, request) {
  const trust = shootr.trustStatus || {};
  const metrics = shootr.metrics || {};
  const completedBookings = metrics.completedBookings ?? shootr.completedBookings ?? 0;
  const averageRating = metrics.averageRating ?? shootr.rating;
  const cancellationRate = metrics.cancellationRate ?? shootr.cancellationRate;
  const identityReady = trust.identityVerificationStatus === "verified";
  const phoneReady = trust.phoneVerificationStatus === "verified";
  const emailReady = trust.emailVerificationStatus === "verified";
  const portfolioReady = trust.portfolioReviewStatus === "approved" || shootr.profileReviewStatus === "portfolio_approved";
  const incidentClear = trust.safetyIncidentStatus !== "restricted";
  const scores = {
    availability: shootr.availabilityStatus === "Available Now" ? 30 : shootr.availabilityStatus === "Available Today" ? 18 : 4,
    distance: request.timing === "As soon as possible" ? 20 : 8,
    packageEligibility: shootr.type === "shootr_pro" || request.packageId !== "extended_moment" ? 12 : 4,
    equipment: request.preferences?.includes("Professional camera preferred") && shootr.type === "shootr_pro" ? 10 : 7,
    specialty: shootr.specialties?.includes(request.momentType || request.moment) ? 10 : 3,
    response: metrics.responseTimeMinutes ? Math.max(2, 10 - Math.ceil(metrics.responseTimeMinutes / 5)) : shootr.scoreInputs?.responseSpeed ? 8 : 2,
    completion: metrics.deliveryRate ? Math.round(metrics.deliveryRate * 8) : shootr.scoreInputs?.completionRate ? 8 : 2,
    cancellation: cancellationRate == null ? 2 : cancellationRate <= 0.05 ? 6 : cancellationRate <= 0.12 ? 3 : 0,
    rating: averageRating ? Math.max(0, Math.round((averageRating - 4) * 5)) : 0,
    repeat: metrics.wouldBookAgainRate ? Math.round(metrics.wouldBookAgainRate * 5) : 0,
    trust: [identityReady, phoneReady, emailReady, portfolioReady, incidentClear].filter(Boolean).length * 2,
    safety: shootr.onboardingStatus === "approved" && incidentClear ? 10 : 0,
  };

  return {
    shootrId: shootr.id,
    total: Object.values(scores).reduce((sum, value) => sum + value, 0),
    scores,
  };
}

export function findEligibleShootrs(shootrs, request) {
  return shootrs
    .filter((shootr) => shootr.onboardingStatus === "approved")
    .filter((shootr) => (shootr.trustStatus?.accountStanding || "active") !== "suspended")
    .map((shootr) => ({ shootr, match: scoreShootrForRequest(shootr, request) }))
    .sort((a, b) => b.match.total - a.match.total);
}

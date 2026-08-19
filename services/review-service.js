export function canReviewBooking(booking, existingReviews = []) {
  if (!booking || booking.status !== "completed") return false;
  return !existingReviews.some((review) => review.bookingId === booking.id);
}

export function createCustomerReview({ bookingId, customerId, shootrId, ratings, bookAgain }) {
  return {
    id: `review-${bookingId}-${customerId}`,
    bookingId,
    customerId,
    shootrId,
    type: "customer_to_shootr",
    ratings,
    bookAgain,
    createdAt: new Date().toISOString(),
  };
}

export function createShootrReview({ bookingId, shootrId, customerId, ratings }) {
  return {
    id: `review-${bookingId}-${shootrId}`,
    bookingId,
    shootrId,
    customerId,
    type: "shootr_to_customer",
    ratings,
    createdAt: new Date().toISOString(),
  };
}

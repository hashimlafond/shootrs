export function approximateLocationLabel(location) {
  if (!location) return "Approximate area unavailable";
  return location.approximateArea || location.city || "Approximate area unavailable";
}

export function shouldRevealExactAddress(booking) {
  return ["confirmed", "shootr_en_route", "shootr_arrived", "in_progress", "awaiting_delivery", "delivered", "completed"].includes(booking.status);
}

export function publicLocationForBooking(booking) {
  if (shouldRevealExactAddress(booking)) {
    return booking.meetingLocation.exactAddress || booking.meetingLocation.approximateArea;
  }

  return approximateLocationLabel(booking.meetingLocation);
}

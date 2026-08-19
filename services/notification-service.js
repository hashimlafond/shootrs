export function createNotification(event, recipientRole, body) {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    event,
    recipientRole,
    body,
    channels: ["in_app"],
    status: "mock_queued",
    createdAt: new Date().toISOString(),
  };
}

export const notificationEvents = [
  "verification_code",
  "request_received",
  "request_accepted",
  "payment_required",
  "payment_authorized",
  "booking_confirmed",
  "shootr_en_route",
  "shootr_arrived",
  "arrival_update",
  "booking_cancelled",
  "replacement_found",
  "photos_ready",
  "gallery_expiring",
  "review_reminder",
  "tip_received",
  "incident_update",
  "payout_update",
];

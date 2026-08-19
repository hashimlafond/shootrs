import { bookingStatuses, createEditingRequest, createRightsGrant } from "../types/models.js";
import { calculatePrice } from "./pricing-service.js";

export function createBookingRequest(input) {
  const now = new Date().toISOString();
  return {
    id: `booking-${Date.now()}`,
    customerId: input.customerId || null,
    shootrId: null,
    momentType: input.moment,
    timing: input.timing,
    scheduledTime: input.scheduledTime || input.timing,
    durationMinutes: input.durationMinutes,
    meetingLocation: {
      approximateArea: input.approximateArea || input.city || "Area not set",
      exactAddress: null,
      privateHome: Boolean(input.privateHome),
      meetingPreference: input.meetingPreference,
    },
    status: "submitted",
    customerInstructions: input.instructions || "",
    shootrNotes: "",
    packageId: input.packageId,
    preferences: input.preferences || [],
    priceBreakdown: calculatePrice({
      packageId: input.packageId,
      urgency: input.timing === "As soon as possible" || input.timing === "Right Now" || input.timing === "Now",
      travelMiles: input.travelMiles || 0,
      tip: 0,
    }),
    paymentStatus: "not_authorized",
    cancellationPolicy: "No charge before a Shootr accepts. No charge if no Shootr accepts.",
    timestamps: [{ status: "submitted", at: now }],
    messageThread: [{ type: "system", body: "Request submitted", at: now }],
    deliveryStatus: "not_started",
    rights: createRightsGrant(input.rights || {}),
    editingRequest: createEditingRequest(input.editingRequest || {}),
    consent: {
      minorsPresent: false,
      portfolioUseAllowed: false,
      publicPostAllowed: false,
      platformMarketingUseAllowed: false,
      consentTimestamp: null,
      consentActor: null,
      revoked: false,
      acknowledged: false,
      ...(input.consent || {}),
    },
    lock: null,
    incidentReportLink: "/app/support",
  };
}

export function transitionBooking(booking, nextStatus, meta = {}) {
  if (!bookingStatuses.includes(nextStatus)) {
    throw new Error(`Unsupported booking status: ${nextStatus}`);
  }

  const updated = {
    ...booking,
    status: nextStatus,
    timestamps: [...booking.timestamps, { status: nextStatus, at: new Date().toISOString(), meta }],
  };

  updated.messageThread = [
    ...booking.messageThread,
    { type: "system", body: statusMessage(nextStatus), at: new Date().toISOString() },
  ];

  return updated;
}

export function acceptBooking(booking, shootrId) {
  if (booking.lock && booking.lock.shootrId !== shootrId) {
    throw new Error("This request is temporarily locked for another Shootr.");
  }

  if (booking.shootrId && booking.shootrId !== shootrId) {
    throw new Error("This booking already has a confirmed Shootr.");
  }

  return transitionBooking(
    {
      ...booking,
      shootrId,
      lock: { shootrId, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() },
    },
    "temporarily_locked",
    { shootrId },
  );
}

export function authorizeSelectedBooking(booking) {
  if (!["accepted", "temporarily_locked"].includes(booking.status)) {
    throw new Error("A Shootr must accept before payment authorization.");
  }

  return transitionBooking(
    {
      ...booking,
      paymentStatus: "authorized",
    },
    "payment_authorized",
  );
}

export function confirmAcceptedBooking(booking) {
  if (booking.paymentStatus !== "authorized") {
    throw new Error("Payment must be authorized before confirmation.");
  }

  if (!booking.shootrId || !booking.lock) {
    throw new Error("Booking lock required before confirmation.");
  }

  return transitionBooking(booking, "confirmed");
}

export function cancelBooking(booking, cancelledBy, reason = "") {
  return transitionBooking(
    {
      ...booking,
      cancellation: {
        cancelledBy,
        reason,
        at: new Date().toISOString(),
      },
    },
    "cancelled",
    { cancelledBy, reason },
  );
}

export function expireBooking(booking, reason = "No eligible Shootr accepted before the request window closed.") {
  return transitionBooking(
    {
      ...booking,
      lock: null,
      paymentStatus: "not_captured",
      expirationReason: reason,
    },
    "expired",
    { reason },
  );
}

export function requestRematch(booking, reason = "Customer requested a new Shootr.") {
  return transitionBooking(
    {
      ...booking,
      shootrId: null,
      lock: null,
      rematchReason: reason,
    },
    "searching",
    { reason },
  );
}

function statusMessage(status) {
  const messages = {
    submitted: "Request submitted",
    searching: "Searching for eligible Shootrs",
    offered: "Request offered",
    temporarily_locked: "Request locked",
    accepted: "Shootr accepted",
    payment_authorized: "Payment authorized",
    confirmed: "Booking confirmed",
    shootr_en_route: "Shootr en route",
    shootr_arrived: "Shootr arrived",
    in_progress: "Session started",
    awaiting_upload: "Awaiting upload",
    awaiting_delivery: "Awaiting delivery",
    uploading: "Uploading",
    delivered: "Photos delivered",
    completed: "Booking completed",
    cancelled: "Booking cancelled",
    disputed: "Issue opened",
    issue_reported: "Issue reported",
    refunded: "Refund recorded",
    expired: "Request expired",
  };

  return messages[status] || "Booking updated";
}

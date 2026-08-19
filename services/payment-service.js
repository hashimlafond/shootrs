export function createPaymentIntent({ bookingId, amount, currency = "usd" }) {
  return {
    id: `mock-payment-${bookingId}`,
    bookingId,
    amount,
    currency,
    status: "requires_authorization",
    provider: "mock",
  };
}

export function authorizePayment(intent) {
  return {
    ...intent,
    status: "authorized",
    authorizedAt: new Date().toISOString(),
  };
}

export function capturePayment(intent) {
  if (intent.status !== "authorized") {
    throw new Error("Payment must be authorized before capture.");
  }

  return {
    ...intent,
    status: "captured",
    capturedAt: new Date().toISOString(),
  };
}

export function refundPayment(intent, reason = "") {
  return {
    ...intent,
    status: "refunded",
    refundedAt: new Date().toISOString(),
    refundReason: reason,
  };
}

import assert from "node:assert/strict";
import { createBookingRequest, acceptBooking, authorizeSelectedBooking, cancelBooking, confirmAcceptedBooking, expireBooking, requestRematch } from "../services/booking-service.js";
import { calculatePrice } from "../services/pricing-service.js";
import { createPaymentIntent, authorizePayment, capturePayment, refundPayment } from "../services/payment-service.js";
import { publicLocationForBooking } from "../services/map-service.js";
import { canAccessGallery, createGallery, createShareLink, isShareLinkExpired } from "../services/gallery-service.js";
import { createUploadBatch, retryUpload } from "../services/upload-service.js";
import { canReviewBooking } from "../services/review-service.js";
import { requiredRoleForPath, canAccess, setSessionRole } from "../utils/route-guards.js";

globalThis.localStorage = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
  clear() {
    this.data.clear();
  },
};

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

test("subject can create an immediate request without exposing exact address", () => {
  const booking = createBookingRequest({
    moment: "Girls’ Night",
    timing: "As soon as possible",
    city: "West Hollywood",
    meetingPreference: "Enter an address",
    packageId: "standard_moment",
    durationMinutes: 30,
  });

  assert.equal(booking.status, "submitted");
  assert.equal(booking.meetingLocation.exactAddress, null);
  assert.equal(publicLocationForBooking(booking), "West Hollywood");
  assert.equal(booking.consent.portfolioUseAllowed, false);
  assert.equal(booking.rights.shootrPortfolioPermission, false);
  assert.equal(booking.rights.shootrSocialPostingPermission, false);
  assert.equal(booking.rights.shootrPlatformMarketingPermission, false);
  assert.equal(booking.editingRequest.editingRequested, false);
});

test("only one Shootr can accept a request lock", () => {
  const booking = createBookingRequest({
    moment: "Proposal",
    timing: "Today",
    city: "Santa Monica",
    packageId: "quick_capture",
    durationMinutes: 15,
  });
  const accepted = acceptBooking(booking, "shootr-1");

  assert.equal(accepted.status, "temporarily_locked");
  assert.equal(accepted.shootrId, "shootr-1");
  assert.throws(() => acceptBooking(accepted, "shootr-2"), /temporarily locked|confirmed/);
});

test("booking confirms only after lock and payment authorization", () => {
  const booking = createBookingRequest({
    moment: "Birthday",
    timing: "Right Now",
    city: "Nearby",
    packageId: "quick_capture",
    durationMinutes: 15,
  });
  const locked = acceptBooking(booking, "shootr-1");
  const authorized = authorizeSelectedBooking(locked);
  const confirmed = confirmAcceptedBooking(authorized);

  assert.equal(authorized.status, "payment_authorized");
  assert.equal(authorized.paymentStatus, "authorized");
  assert.equal(confirmed.status, "confirmed");
});

test("booking can expire, cancel, and rematch through supported states", () => {
  const booking = createBookingRequest({
    moment: "Graduation",
    timing: "Tomorrow",
    city: "Nearby",
    packageId: "extended_moment",
    durationMinutes: 60,
  });

  assert.equal(expireBooking(booking).status, "expired");
  assert.equal(cancelBooking(booking, "subject", "plans changed").status, "cancelled");
  assert.equal(requestRematch(acceptBooking(booking, "shootr-1")).status, "searching");
});

test("pricing uses visible starter package plus transparent modifiers", () => {
  const price = calculatePrice({ packageId: "standard_moment", urgency: true, travelMiles: 10, tip: 5 });
  assert.equal(price.package, 79);
  assert.equal(price.urgencyFee, 15);
  assert.equal(price.travelFee, 4);
  assert.equal(price.platformFee, 8);
  assert.equal(price.serviceFee, 8);
  assert.equal(price.paymentProcessingFee, 0);
  assert.equal(price.platformCommission, 16);
  assert.equal(price.shootrPayoutAmount, 87);
  assert.equal(price.total, 111);
});

test("payment service keeps authorization separate from capture and refunds", () => {
  const intent = createPaymentIntent({ bookingId: "booking-1", amount: 111 });
  const authorized = authorizePayment(intent);
  const captured = capturePayment(authorized);
  const refunded = refundPayment(captured, "subject cancelled");

  assert.equal(intent.status, "requires_authorization");
  assert.equal(authorized.status, "authorized");
  assert.equal(captured.status, "captured");
  assert.equal(refunded.status, "refunded");
});

test("role guards separate subject, shootr, and internal routes", () => {
  localStorage.clear();
  assert.equal(requiredRoleForPath("/app/request"), "subject");
  assert.equal(requiredRoleForPath("/shootr/requests"), "shootr");
  assert.equal(requiredRoleForPath("/business"), "business");
  assert.equal(requiredRoleForPath("/agency"), "agency");
  assert.equal(requiredRoleForPath("/admin/bookings"), "admin");
  assert.equal(canAccess("/admin/bookings"), false);

  setSessionRole("admin");
  assert.equal(canAccess("/admin/bookings"), true);
  assert.equal(canAccess("/app/request"), false);
});

test("gallery access is private and share links expire", () => {
  const gallery = createGallery({
    bookingId: "booking-1",
    customerId: "subject-1",
    shootrId: "shootr-1",
    files: [{ name: "photo.jpg", thumbnailUrl: "thumb.jpg", previewUrl: "preview.jpg", originalUrl: "original.jpg" }],
    storageDays: 90,
  });
  const link = createShareLink(gallery, { ttlHours: 1 });
  const later = new Date(Date.now() + 2 * 60 * 60 * 1000);

  assert.equal(gallery.portfolioUseAllowed, false);
  assert.equal(gallery.socialUseAllowed, false);
  assert.equal(gallery.platformMarketingUseAllowed, false);
  assert.equal(canAccessGallery(gallery, { id: "subject-1", role: "subject" }), true);
  assert.equal(canAccessGallery(gallery, { id: "stranger", role: "subject" }), false);
  assert.equal(isShareLinkExpired(link, later), true);
});

test("upload batches support direct resumable retry", () => {
  const batch = createUploadBatch({ bookingId: "booking-1", files: ["a.heic"] });
  const retried = retryUpload(batch, "upload-item-1");

  assert.equal(batch.directToStorage, true);
  assert.equal(batch.resumable, true);
  assert.equal(retried.items[0].retries, 1);
  assert.equal(retried.items[0].status, "retrying");
});

test("reviews are only allowed after completion and never duplicated", () => {
  const booking = createBookingRequest({
    moment: "Family",
    timing: "Tomorrow",
    city: "Nearby",
    packageId: "standard_moment",
    durationMinutes: 30,
  });
  const completed = { ...booking, status: "completed" };

  assert.equal(canReviewBooking(booking), false);
  assert.equal(canReviewBooking(completed), true);
  assert.equal(canReviewBooking(completed, [{ bookingId: completed.id }]), false);
});

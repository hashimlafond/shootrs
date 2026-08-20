import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import { isFeatureEnabled, settings, statusLabels } from "./config/settings.js";
import { packages, serviceZones, demoShootrs, demoBooking } from "./data/fixtures.js";
import {
  acceptBooking,
  authorizeSelectedBooking,
  confirmAcceptedBooking,
  createBookingRequest,
  expireBooking,
  requestRematch,
  transitionBooking,
} from "./services/booking-service.js";
import { calculatePrice } from "./services/pricing-service.js";
import { findEligibleShootrs } from "./services/matching-service.js";
import { createNotification } from "./services/notification-service.js";
import { publicLocationForBooking } from "./services/map-service.js";
import { createGallery, createShareLink, isShareLinkExpired } from "./services/gallery-service.js";
import { createUploadBatch, retryUpload } from "./services/upload-service.js";
import { canReviewBooking } from "./services/review-service.js";
import { track } from "./services/analytics-service.js";
import { loadStore, saveStore } from "./services/storage-service.js";
import { fetchSafetyState, getCurrentUserId, mergeSafetyState, submitModerationAction, submitSafetyRecord } from "./services/safety-service.js";
import { canAccess, getSessionRole, requiredRoleForPath, setSessionRole } from "./utils/route-guards.js";
import { roles } from "./types/models.js";

const fixtures = {
  shootrs: isFeatureEnabled("DEMO_MODE") ? demoShootrs : [],
  bookings: isFeatureEnabled("DEMO_MODE") ? [demoBooking] : [],
  serviceZones,
};
let store = loadStore(fixtures);
const root = document.querySelector("#platformRoot");
const draftKey = "shootr-customer-flow-v1";
const timingOptions = ["Now", "Later"];
const shootrApplicationDraftKey = "shootr-application-draft-v1";
const shootrSpecialtyOptions = ["Photos"];
const applicationSteps = ["intro", "identity", "contact", "area", "setup", "portfolio", "availability", "safety", "payouts", "review"];
const radiusOptions = ["5 miles", "10 miles", "20 miles", "30 miles", "Custom"];
const setupOptions = ["Phone", "Pro Camera", "Both"];
const transportationOptions = ["Car", "Rideshare", "Public transit", "Bike or scooter", "Other"];
const availabilityOptions = ["Available on demand", "Weekdays", "Weekends", "Evenings", "Custom schedule"];
const serviceOptions = [
  ["No Preference", "Show me everyone nearby."],
  ["Phone", "Someone with a capable phone and a good eye."],
  ["Pro Camera", "An experienced photographer with professional equipment."],
];
const noMatchOfferIncrements = settings.offerIncrements || [10, 25, 50];
const applicationStateKey = "shootr-application-state";
const availabilityStateKey = "shootr-availability-state";
const dismissedStatusPillKey = "shootr-dismissed-status-pill";
const householdsKey = "shootr-households-v1";
const termsVersion = "shootrs-eula-v1.2-build8";
const termsAcceptanceKey = "shootrs-eula-acceptance-v1.2-build8";
const currentBuildNumber = "8";
const reportReasons = [
  "Harassment or abusive behavior",
  "Hate or discrimination",
  "Sexual or inappropriate content",
  "Violence or threats",
  "Spam or scam",
  "Impersonation",
  "Illegal activity",
  "Privacy violation",
  "Other",
];
const prohibitedTextPattern = /\b(kill yourself|violent threat|racial slur|sexual exploitation|child sexual|terrorist threat|doxx|stalking threat)\b/i;

hydrateSharedSafetyState();

const routeMeta = {
  "/how-it-works": ["How Shootrs Works", publicHowItWorks],
  "/pricing": ["Simple Pricing", publicPricing],
  "/safety": ["Safety", publicSafety],
  "/help": ["Help", supportScreen],
  "/become-a-shootr": ["Become a Shootr", shootrOnboarding],
  "/shootrs": ["Shootrs", publicShootrs],
  "/shootrs/hashimlafond": ["Demo Profile", publicProfile],
  "/waitlist": ["Availability Alerts", waitlistScreen],
  "/terms": ["Terms of Service", legalPage],
  "/privacy": ["Privacy Policy", legalPage],
  "/community-standards": ["Community Standards", legalPage],
  "/account-deletion": ["Account Deletion", legalPage],
  "/sign-in": ["Sign In", authScreen],
  "/sign-up": ["Sign Up", authScreen],
  "/forgot-password": ["Forgot Password", authScreen],
  "/verify": ["Verify", authScreen],
  "/app": ["Shootrs", customerHome],
  "/app/book": ["Book", requestWizard],
  "/app/search": ["Finding Someone", searchRoute],
  "/app/request": ["Book a Shootr", requestWizard],
  "/app/matches": ["Matches", matchesScreen],
  "/app/bookings": ["Bookings", bookingsList],
  "/app/bookings/demo-booking": ["Booking Details", bookingDetails],
  "/app/bookings/demo-booking/track": ["Track Booking", trackerScreen],
  "/app/moments": ["Moments", galleryScreen],
  "/app/moments/demo-booking": ["Moments", galleryDetailScreen],
  "/app/vault": ["Moments", legacyMomentsRedirect],
  "/app/vault/demo-booking": ["Moments", legacyMomentsDetailRedirect],
  "/app/gallery/demo-booking": ["Moments", legacyMomentsDetailRedirect],
  "/app/profile": ["Profile", profileScreen],
  "/app/profile/delete-account": ["Delete Account", deleteAccountScreen],
  "/app/profile/become-a-shootr": ["Become a Shootr", shootrOnboarding],
  "/app/profile/shootr-status": ["Shootr Status", shootrStatusScreen],
  "/app/profile/shootr-settings": ["Shootr Settings", settingsScreen],
  "/app/profile/portfolio": ["Portfolio", portfolioScreen],
  "/app/profile/availability": ["Availability", availabilityScreen],
  "/app/profile/earnings": ["Earnings", earningsScreen],
  "/app/profile/payouts": ["Payouts", payoutsScreen],
  "/app/jobs": ["Jobs", shootrJobs],
  "/app/jobs/demo-booking": ["Job Details", shootrJobDetails],
  "/app/jobs/demo-booking/deliver": ["Deliver Moments", shootrDeliver],
  "/app/support": ["Support", supportScreen],
  "/shootr": ["Shootr Home", redirectRoute("/app")],
  "/shootr/onboarding": ["Shootr Onboarding", redirectRoute("/app/profile/become-a-shootr")],
  "/shootr/requests": ["Jobs", redirectRoute("/app/jobs")],
  "/shootr/jobs": ["Jobs", redirectRoute("/app/jobs")],
  "/shootr/jobs/demo-booking": ["Job Details", redirectRoute("/app/jobs/demo-booking")],
  "/shootr/jobs/demo-booking/deliver": ["Deliver Moments", redirectRoute("/app/jobs/demo-booking/deliver")],
  "/shootr/bookings": ["Jobs", redirectRoute("/app/jobs")],
  "/shootr/bookings/demo-booking": ["Job Details", redirectRoute("/app/jobs/demo-booking")],
  "/shootr/availability": ["Availability", redirectRoute("/app/profile/shootr-settings")],
  "/shootr/moments": ["Moments", redirectRoute("/app/moments")],
  "/shootr/vault": ["Moments", redirectRoute("/app/moments")],
  "/shootr/earnings": ["Earnings", redirectRoute("/app/profile/earnings")],
  "/shootr/profile": ["Profile", redirectRoute("/app/profile")],
  "/shootr/portfolio": ["Portfolio", redirectRoute("/app/profile/shootr-settings")],
  "/shootr/settings": ["Settings", redirectRoute("/app/profile/shootr-settings")],
  "/shootr/support": ["Support", redirectRoute("/app/support")],
  "/admin": ["Internal", adminHome],
  "/admin/users": ["Users", adminUsers],
  "/admin/shootrs": ["Shootrs", adminShootrs],
  "/admin/businesses": ["Businesses", adminBusinesses],
  "/admin/agencies": ["Agencies", adminAgencies],
  "/admin/bookings": ["Bookings", adminBookings],
  "/admin/galleries": ["Galleries", adminGalleries],
  "/admin/incidents": ["Incidents", adminIncidents],
  "/admin/payments": ["Payments", adminPayments],
  "/admin/service-areas": ["Service Areas", adminServiceAreas],
  "/admin/cities": ["Service Areas", adminServiceAreas],
  "/admin/settings": ["Settings", adminSettings],
  "/admin/waitlist": ["Availability Alerts", adminDemand],
};

function redirectRoute(target) {
  return () => {
    window.history.replaceState({}, "", target);
    const next = routeMeta[target]?.[1] || customerHome;
    return next(target);
  };
}

function currentPath() {
  return window.location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
}

async function hydrateSharedSafetyState() {
  try {
    const state = await fetchSafetyState({ admin: currentPath().startsWith("/admin") });
    if (mergeSafetyState(store, state)) {
      saveStore(store);
      if (root) render();
    }
  } catch (error) {
    console.warn("Shared safety state unavailable; using local safety cache.", error);
  }
}

function render() {
  const path = currentPath();
  if (path === "/") {
    window.location.href = "/";
    return;
  }

  const [title, view] = resolveRoute(path);
  document.title = `${title} | Shootrs`;
  const requiredRole = requiredRoleForPath(path);

  if (requiredRole && requiredRole !== roles.ADMIN && getSessionRole() !== requiredRole) {
    setSessionRole(requiredRole);
  }

  if (requiredRole && !canAccess(path)) {
    root.innerHTML = shell(internalAccessScreen(path), requiredRole === roles.ADMIN ? "restricted" : "public");
    bindGlobalActions();
    return;
  }

  const legalRoutes = ["/terms", "/privacy", "/community-standards", "/account-deletion", "/safety", "/help"];
  const shellRole = requiredRole || (legalRoutes.includes(path) ? roles.SUBJECT : "public");
  root.innerHTML = shell(view(path), shellRole);
  bindGlobalActions();
  bindViewActions(path);
}

function resolveRoute(path) {
  if (routeMeta[path]) return routeMeta[path];
  if (/^\/app\/bookings\/[^/]+\/track$/.test(path)) return ["Track Booking", trackerScreen];
  if (/^\/app\/bookings\/[^/]+$/.test(path)) return ["Booking Details", bookingDetails];
  if (/^\/app\/moments\/[^/]+$/.test(path)) return ["Moments", galleryDetailScreen];
  if (/^\/app\/jobs\/[^/]+\/deliver$/.test(path)) return ["Deliver Moments", shootrDeliver];
  if (/^\/app\/jobs\/[^/]+$/.test(path)) return ["Job Details", shootrJobDetails];
  return ["Shootrs", publicHowItWorks];
}

function shell(body, role) {
  const isApp = role !== "public";
  return `
    <header class="site-header app-header">
      <a class="brand" href="/" aria-label="Shootrs home">
        <svg class="brand-symbol" viewBox="0 0 64 76" aria-hidden="true">
          <path d="M32 2C15.4 2 2 15.4 2 32c0 22 30 42 30 42s30-20 30-42C62 15.4 48.6 2 32 2Z" fill="currentColor"/>
          <circle cx="32" cy="31" r="19" fill="#FAFAFA"/>
          <path d="M32 10v10M32 42v10M11 31h10M43 31h10" stroke="#0D1B3D" stroke-width="4" stroke-linecap="round"/>
          <circle cx="32" cy="31" r="7" fill="currentColor"/>
        </svg>
        <span class="brand-wordmark">Shootrs</span>
      </a>
      <nav aria-label="Primary navigation">${navForRole(role)}</nav>
      ${role === "public" ? `<a class="button small primary" href="/app">Open Shootrs</a>` : ""}
    </header>
    <main class="app-main ${isApp ? "mobile-surface" : ""}">${body}</main>
  `;
}

function navForRole(role) {
  if (role === "restricted") {
    return "";
  }
  if (role === roles.SUBJECT || role === roles.SHOOTR) {
    return "";
  }
  if (role === roles.ADMIN) {
    return "";
  }
  return `<a href="/how-it-works">How It Works</a><a href="/pricing">Pricing</a><a href="/safety">Safety</a><a href="/become-a-shootr">Become a Shootr</a>`;
}

function internalAccessScreen(path) {
  const isInternal = path.startsWith("/admin") || path.startsWith("/internal");
  return `
    <section class="app-hero compact-app-hero">
      <p class="eyebrow">Shootrs</p>
      <h1>${isInternal ? "Internal access required." : "Sign in to continue."}</h1>
      <p>${isInternal ? "This area is restricted." : "Use your phone number to continue."}</p>
    </section>
    <section class="app-panel compact-panel">
      <div class="button-column">
        <a class="button primary" href="/app">Return to Shootrs</a>
      </div>
    </section>
  `;
}

function publicHowItWorks() {
  return pageHero("How Shootr works", "Find, book, and receive your moments privately.") + `
    <section class="app-grid three">
      ${stepCard("1", "Find", "See who is nearby and available.")}
      ${stepCard("2", "Book", "Choose your Shootr and confirm the price.")}
      ${stepCard("3", "Receive", "Get your moments privately.")}
    </section>`;
}

function publicPricing() {
  return pageHero("Simple pricing", "Your final price is shown before booking.") + `
    <section class="app-grid three">
      ${packages.map((item) => card(displayPackageName(item), `${item.durationMinutes} minutes`, `From $${item.startingPrice}`)).join("")}
    </section>
    <section class="app-panel"><p>Your final price is shown before booking. Distance, urgency and venue costs may affect it.</p></section>`;
}

function publicSafety() {
  return pageHero("Safety", "Built for location privacy, clear reports, and private galleries.") + `
    <section class="app-grid three">
      ${card("Account details", "Required before booking", "Clients provide contact details before a booking can be confirmed.")}
      ${card("Location privacy", "Approximate first", "Exact private-home addresses stay hidden until confirmation.")}
      ${card("Moments", "Private by default", "Portfolio and marketing permissions default to off.")}
      ${card("Reports", "Always available", "Report and block controls are available from Help, profiles, bookings, and galleries.")}
      ${card("Moderation", "Reviewed", "Reports are sent to Shootrs moderation for review and action.")}
      ${card("Privacy controls", "In Profile", "Delete account, privacy policy, support, and data-use notices stay reachable from the app.")}
      ${card("Minors", "Adult required", "Bookings involving minors require an authorized adult to be present.")}
      ${card("Legal and privacy", "Available", "Terms, privacy, consent, cancellation, payout, and safety information stay reachable from the app.")}
    </section>`;
}

function waitlistScreen() {
  return pageHero("Availability alerts", "If no Shootrs are nearby right now, save your request and get notified.") + noMatchPanel();
}

function publicShootrs() {
  const shootrs = visibleShootrs();
  return pageHero("Shootrs", isFeatureEnabled("DEMO_MODE") ? "Demo profiles are labeled until real approvals exist." : "Approved Shootrs appear here.") + `<section class="app-grid three">${shootrs.length ? shootrs.map(publicShootrCard).join("") : emptyStateMarkup("No public Shootrs yet", "Approved profiles will appear after review.")}</section>`;
}

function publicProfile() {
  const shootr = visibleShootrs()[0];
  if (!shootr) return pageHero("Shootr profile", "This profile is not available.") + emptyState("Profile unavailable", "Approved public profiles appear after review.");
  return pageHero(shootr.displayName, `${labelShootrType(shootr.type)}${isFeatureEnabled("DEMO_MODE") ? " · Demo profile" : ""}`) + `
    <section class="app-panel">
      <p class="eyebrow">${isFeatureEnabled("DEMO_MODE") ? "Demo profile" : "Public profile"}</p>
      <div class="portfolio-large">${shootr.portfolio.map((src) => `<img src="/${src}" alt="${shootr.displayName} sample" />`).join("")}</div>
      <div class="badge-row">${shootr.badges.map((badge) => `<span>${badge}</span>`).join("")}</div>
      <a class="button primary" href="/app/request">Open Shootrs</a>
      <div class="safety-actions">
        <a href="/app/support?topic=report&reportedUserId=${encodeURIComponent(shootr.id)}&contentId=${encodeURIComponent(contentIdFor("profile", shootr.id))}&contentType=Profile">Report Profile</a>
        <button type="button" data-block-user="${shootr.id}" data-block-content="${contentIdFor("profile", shootr.id)}" data-block-context="public-profile">Block User</button>
      </div>
    </section>`;
}

function customerHome() {
  const realBookings = store.bookings.filter((booking) => booking.label !== "Sample booking");
  const active = realBookings.find((booking) => ["confirmed", "shootr_en_route", "shootr_arrived", "in_progress"].includes(booking.status));
  const approved = hasShootrApproval();
  const availability = getShootrAvailability();
  const nearbyJobs = approved && availability === "Ready" ? realBookings.filter((booking) => ["submitted", "searching", "offered"].includes(booking.status)) : [];
  return `
    <section class="app-screen home-action">
      <div class="home-focus">${FocusMark("Shootr focus mark")}</div>
      <p class="trust-line">Private moments • Clear pricing • Reviewed applications</p>
      <h1>Ready.</h1>
      <div class="hero-actions app-actions">
        <a class="button primary" href="/app/book?timing=now" data-start-booking="now">Now</a>
        <a class="button secondary" href="/app/book?timing=later" data-start-booking="later">Later</a>
      </div>
      ${approved ? availabilityControl(availability) : ""}
      ${nearbyJobs.length ? `<div class="app-strip compact-jobs"><h2>Nearby jobs</h2>${nearbyJobs.map((booking) => requestCard(booking, true)).join("")}</div>` : ""}
      ${activeStatusPill(active)}
    </section>
    ${bottomNav("customer")}
  `;
}

function activeStatusPill(booking) {
  if (!booking || localStorage.getItem(dismissedStatusPillKey) === booking.id) return "";
  const shootr = findShootr(booking.shootrId);
  const firstName = (shootr?.displayName || "Shootr").split(" ")[0];
  return `<aside class="status-pill" aria-label="Active booking"><a href="/app/bookings/${booking.id}/track">${firstName} • ${booking.estimatedTravelTime || "8 min"}</a><button type="button" aria-label="Dismiss tracker" data-dismiss-status-pill="${booking.id}">×</button></aside>`;
}

function availabilityControl(availability) {
  const ready = availability === "Ready";
  return `
    <article class="availability-control">
      <div>
        <strong>Accept nearby jobs</strong>
        <span>${ready ? "You can receive nearby jobs." : "You won’t receive nearby jobs."}</span>
      </div>
      <div class="segmented-control" role="group" aria-label="Shootr availability">
        <button class="${ready ? "selected" : ""}" data-shootr-availability="Ready">Ready</button>
        <button class="${!ready ? "selected" : ""}" data-shootr-availability="Away">Away</button>
      </div>
    </article>`;
}

function requestWizard() {
  const params = new URLSearchParams(window.location.search);
  const timing = normalizeTiming(params.get("timing"));
  const explicitStep = params.get("step");
  const initialStep = timing === "Later" && !explicitStep ? 2 : 1;
  const draft = timing ? saveDraft({ timing, step: Number(explicitStep || initialStep) }) : loadDraft();
  const step = Number(explicitStep || draft.step || initialStep);
  const clamped = Math.max(1, Math.min(step, 9));
  const views = {
    1: locationScreen,
    2: timingScreen,
    3: serviceScreen,
    4: lengthScreen,
    5: searchScreen,
    6: searchScreen,
    7: noteScreen,
    8: identityScreen,
    9: confirmScreen,
  };
  return `<section class="app-screen request-screen">${bookingBackBar(clamped, draft)}${views[clamped](draft)}</section>${bottomNav("customer")}`;
}

function bookingBackBar(step, draft) {
  if (step <= 1) return appBackBar("/app", "Home");
  const previous = step === 3 && draft.timing === "Now" ? 1 : step - 1;
  const timing = draft.timing ? `&timing=${String(draft.timing).toLowerCase()}` : "";
  return appBackBar(`/app/book?step=${previous}${timing}`, "Back");
}

function locationScreen(draft) {
  const state = draft.locationPermission || "not requested";
  const denied = state === "denied";
  const timedOut = state === "timed out";
  return `
    ${progressHeader("Location", 1)}
    <h1>Location</h1>
    <p>Shootr uses your location to find someone nearby.</p>
    ${denied ? `<p class="status-error">Location access is off. Search an address or choose a meeting point instead.</p>` : ""}
    ${timedOut ? `<p class="status-error">Location timed out. Search an address or choose a meeting point instead.</p>` : ""}
    <button class="button primary" data-use-location>Use Current Location</button>
    <div class="fallback-grid">
      <label>Search Address<input data-address-input autocomplete="street-address" value="${draft.formattedAddress || ""}" placeholder="Street, venue, or neighborhood" /></label>
      <button class="button secondary" data-save-address>Continue with Address</button>
      <button class="button secondary" data-save-location="Choose on Map">Choose on Map</button>
      <button class="button secondary" data-save-location="Recent Places">Recent Places</button>
    </div>
    <p class="form-note">Shootrs see only an approximate area before booking is confirmed.</p>`;
}

function timingScreen(draft) {
  const isLater = draft.timing === "Later";
  return `
    ${progressHeader("Now or Later", 2)}
    <h1>Now or Later</h1>
    <div class="choice-grid timing-choice-grid">
      ${timingOptions.map((item) => `<button class="choice-card ${draft.timing === item ? "selected" : ""}" data-save-step="timing" data-value="${item}"><strong>${item}</strong></button>`).join("")}
    </div>
    <div class="form-row" ${isLater ? "" : "hidden"}>
      <label>Date<input data-schedule-date type="date" value="${draft.scheduleDate || ""}" /></label>
      <label>Time<input data-schedule-time type="time" value="${draft.scheduleTime || ""}" /></label>
    </div>
    ${isLater ? `<button class="button primary" data-next-step="3">Continue</button>` : ""}`;
}

function serviceScreen(draft) {
  return `
    ${progressHeader("Choose your Shootr.", 3)}
    <h1>Choose your Shootr.</h1>
    <div class="choice-grid shootr-option-grid">
      ${serviceOptions.map(([label, copy]) => `<button class="choice-card shootr-option-card ${draft.preference === label ? "selected" : ""}" data-save-step="preference" data-value="${label}"><strong>${label}</strong><span>${copy}</span><i aria-hidden="true">${draft.preference === label ? FocusMark("Selected") : ""}</i></button>`).join("")}
    </div>`;
}

function lengthScreen(draft) {
  return `
    ${progressHeader("How long?", 4)}
    <h1>How long?</h1>
    <div class="package-list">
      ${packages.map((item) => `<button class="package-card ${draft.packageId === item.id ? "selected" : ""}" data-package="${item.id}"><strong>${displayPackageName(item)}</strong><span>${item.durationMinutes} min</span><em>From $${item.startingPrice}</em></button>`).join("")}
    </div>
    <p class="form-note">Your final price is shown before booking.</p>`;
}

function noteScreen(draft) {
  return `
    <p class="eyebrow">Optional</p>
    <h1>Anything your Shootr should know?</h1>
    <label>Notes<textarea data-booking-note>${draft.instructions || ""}</textarea></label>
    <button class="button primary" data-next-step="8">Continue</button>
    <button class="button ghost" data-next-step="8">Skip</button>`;
}

function searchScreen() {
  const draft = loadDraft();
  return `
    ${progressHeader("Nearby Shootrs", 5)}
    <div class="searching-state">
      <div class="real-search-indicator" aria-hidden="true"></div>
      <h1>Check nearby Shootrs.</h1>
      <p data-search-status>Search your area when you’re ready.</p>
      <div class="summary-card">
        <strong>${draft.approximateArea || "Nearby area"}</strong>
        <span>Search radius: ${draft.travelMiles || 4} miles</span>
      </div>
      <div class="button-column">
        <button class="button primary" data-run-search>See nearby Shootrs</button>
        <button class="button secondary" data-expand-radius>Expand radius</button>
        <a class="button secondary" href="/app/book?timing=later" data-start-booking="later">Later</a>
        <a class="button ghost" href="/app">Cancel search</a>
      </div>
    </div>`;
}

function searchRoute() {
  return `<section class="app-screen request-screen">${searchScreen()}</section>${bottomNav("customer")}`;
}

function matchesScreen() {
  const draft = loadDraft();
  const request = createBookingRequest({
    moment: draft.moment || "Photos",
    timing: draft.timing || "Now",
    approximateArea: draft.approximateArea || "Nearby area",
    packageId: draft.packageId || "quick_capture",
    durationMinutes: 15,
    preferences: draft.preference ? [draft.preference] : [],
  });
  const matches = findEligibleShootrs(visibleShootrs(), request);
  const filter = draft.preference || "No Preference";
  return `
    <section class="app-screen">
      ${progressHeader("Nearby Shootrs", 6)}
      <h1>Nearby Shootrs</h1>
      <div class="filter-row">
        ${["No Preference", "Phone", "Pro Camera"].map((item) => `<button class="filter-chip preference-chip ${filter === item ? "selected" : ""}" data-preference="${item}">${item}</button>`).join("")}
      </div>
      ${matches.length ? `<div class="nearby-list">${matches.map(({ shootr }) => matchCard(shootr)).join("")}</div>` : noMatchPanel()}
    </section>
    ${bottomNav("customer")}
  `;
}

function packageScreen(draft) {
  const selectedShootr = findShootr(draft.shootrId);
  return `
    <p class="eyebrow">Plan</p>
    <h1>Confirm the plan.</h1>
    ${selectedShootr ? `<p>${selectedShootr.displayName} · ${labelShootrType(selectedShootr.type)}</p>` : ""}
    <div class="package-list">
      ${packages.map((item) => `<button class="package-card ${draft.packageId === item.id ? "selected" : ""}" data-package="${item.id}"><strong>${displayPackageName(item)}</strong><span>${item.durationMinutes} minutes</span><em>From $${item.startingPrice}</em></button>`).join("")}
    </div>
    ${priceSummary(draft.packageId || "quick_capture", draft.timing === "Now")}
    <p class="form-note">No charge happens unless payment authorization succeeds, the Shootr accepts, and the booking lock succeeds.</p>`;
}

function identityScreen(draft) {
  return `
    <p class="eyebrow">Contact</p>
    <h1>Verify your phone.</h1>
    <p>We'll use this for booking updates, receipt, and gallery delivery.</p>
    <div class="contact-grid">
      <label>Mobile number<input data-contact="mobile" type="tel" inputmode="tel" autocomplete="tel" value="${draft.mobile || ""}" /></label>
      <label>First name<input data-contact="firstName" autocomplete="given-name" value="${draft.firstName || ""}" /></label>
      <label>Last name<input data-contact="lastName" autocomplete="family-name" value="${draft.lastName || ""}" /></label>
      <label>Email<input data-contact="email" type="email" autocomplete="email" value="${draft.email || ""}" /></label>
    </div>
    <button class="button primary" data-next-step="9">Continue</button>`;
}

function paymentScreen(draft) {
  const price = calculatePrice({ packageId: draft.packageId || "quick_capture", urgency: draft.timing === "Now", travelMiles: draft.travelMiles || 0, tip: draft.tip || 0 });
  return `
    <p class="eyebrow">Review</p>
    <h1>Review</h1>
    ${priceTable(price)}
    <p class="form-note">This payment is for an in-person shoot performed outside the app. Your payment is authorized before confirmation and captured only under the booking terms shown before you book.</p>
    <div class="app-grid two">
      ${card("Card", settings.featureFlags.payments ? "Ready" : "Available at checkout", "Authorize payment before the booking is confirmed.")}
      ${card("Apple Pay", settings.featureFlags.applePay ? "Enabled" : "Available later", "Use it when supported on this device.")}
    </div>
    <button class="button primary" data-authorize-payment>Authorize payment</button>`;
}

function confirmScreen(draft) {
  const price = calculatePrice({ packageId: draft.packageId || "quick_capture", urgency: draft.timing === "Now", travelMiles: draft.travelMiles || 0, tip: draft.tip || 0 });
  const selectedShootr = findShootr(draft.shootrId);
  return `
    <p class="eyebrow">Review</p>
    <h1>Review</h1>
    <div class="summary-card">
      <strong>${selectedShootr?.displayName || "Choose a Shootr"}</strong>
      <span>${draft.timing || "Now"} · ${draft.approximateArea || "Approximate area"}</span>
      <span>${displayPackageName(packages.find((item) => item.id === draft.packageId) || packages[0])} · ${draft.preference || "No Preference"}</span>
    </div>
    ${!selectedShootr ? `<section class="app-panel no-match"><h2>No Shootr selected yet.</h2><p>Choose an available Shootr before confirming.</p><a class="button primary" href="/app/matches">See nearby Shootrs</a></section>` : ""}
    <section class="app-panel compact-policy-card">
      <h2>Before you book</h2>
      <label class="check-row"><input type="checkbox" data-adult-consent ${draft.adultConsent ? "checked" : ""} /> <span>I am at least 18. If minors are present, an authorized adult will be there for the shoot.</span></label>
      <label class="check-row"><input type="checkbox" data-rights-ack ${draft.rightsAcknowledged ? "checked" : ""} /> <span>I understand galleries are private by default and portfolio or marketing use requires separate consent.</span></label>
      <p class="form-note">Cancellation terms: no charge if no Shootr accepts. Refund and dispute handling follow the posted terms.</p>
      <p class="form-note" id="confirmNote" role="status"></p>
    </section>
    <div class="review-cta-card">
      <strong>Total today</strong>
      <span>$${price.total}</span>
      <button class="button primary" data-confirm-booking ${selectedShootr ? "" : "disabled"}>Review and confirm</button>
    </div>
    ${priceTable(price)}
    <p class="form-note">We will confirm once payment is authorized and your Shootr accepts. This charge is for an in-person service performed outside the app.</p>`;
}

function noMatchPanel() {
  const miles = loadDraft().travelMiles || 4;
  return `
    <section class="app-panel no-match">
      <h2>No Shootrs are available nearby right now.</h2>
      <p data-search-status>Search radius: ${miles} miles</p>
      <div class="real-search-indicator" aria-hidden="true"></div>
      <div class="button-column">
        ${miles >= 20 ? `<button class="button primary" disabled>Maximum search area reached</button>` : `<button class="button primary" data-expand-radius>Expand search area</button>`}
        <a class="button secondary" href="/app/book?timing=later" data-start-booking="later">Later</a>
        <button class="button secondary" data-availability-alert>Notify me when someone is nearby</button>
        <a class="button ghost" href="/app">Cancel request</a>
      </div>
      <p class="form-note">If no booking is confirmed, you are not charged.</p>
    </section>`;
}

function bookingsList() {
  const bookings = store.bookings.filter((booking) => booking.label !== "Sample booking");
  const approved = hasShootrApproval();
  const view = new URLSearchParams(window.location.search).get("view") === "jobs" ? "jobs" : "mine";
  const groups = [
    ["Active", bookings.filter((booking) => ["confirmed", "shootr_en_route", "shootr_arrived", "in_progress", "awaiting_upload", "uploading"].includes(booking.status))],
    ["Upcoming", bookings.filter((booking) => ["submitted", "searching", "offered", "temporarily_locked", "accepted", "payment_authorized"].includes(booking.status))],
    ["Past", bookings.filter((booking) => ["delivered", "completed", "cancelled", "expired", "refunded"].includes(booking.status))],
  ];
  return pageHero("Bookings", "Active, upcoming, and past.") + `
    <section class="app-screen">
      ${approved ? segmentedLinks([["Mine", "/app/bookings"], ["Jobs", "/app/bookings?view=jobs"]], view === "jobs" ? "Jobs" : "Mine") : ""}
      ${approved && view === "jobs" ? jobFeed() : groups.map(([title, items]) => `<div class="app-strip"><h2>${title}</h2>${items.length ? items.map(bookingCard).join("") : `<p>Confirmed bookings will appear here.</p>`}</div>`).join("")}
      <a class="button primary" href="/app/book">Book a shoot</a>
    </section>
    ${bottomNav("customer")}`;
}

function bookingDetails() {
  const booking = bookingForCurrentPath();
  if (!booking) return pageHero("Booking details", "This booking is not available.") + emptyState("Booking unavailable", "No live booking was found for this route.") + bottomNav("customer");
  return pageHero("Booking details", "Everything you need for this shoot.") + bookingDetailPanel(booking) + liveBookingPanel(booking) + bottomNav("customer");
}

function liveBookingPanel(booking) {
  return `<section class="app-panel tracker-card"><h2>${customerStatus(booking.status)}</h2><p>Next: ${nextStatusLabel(booking.status)}</p><a class="button primary" href="/app/bookings/${booking.id}/track">View Tracker</a><div class="button-row"><a class="button secondary" href="/app/support?topic=booking">Message</a><a class="button secondary" href="/app/support?topic=booking">Share booking</a><a class="button secondary" href="/app/support?topic=safety">Safety</a><a class="button secondary" href="/app/support">Help</a></div></section>`;
}

function trackerScreen() {
  const booking = bookingForCurrentPath();
  if (!booking) return pageHero("Track booking", "This booking is not available.") + emptyState("Tracker unavailable", "No live booking was found for this route.") + bottomNav("customer");
  const shootrName = findShootr(booking.shootrId)?.displayName || "Jasmine";
  const isSearching = ["submitted", "searching", "offered"].includes(booking.status);
  return `
    <section class="app-screen tracker-screen">
      <p class="eyebrow">Tracker</p>
      <div class="tracker-map" aria-label="Map showing meeting point and route">
        ${FocusMapPin("Meeting point")}
        ${isSearching ? "" : `<span class="map-dot shootr">J</span>`}
        <button class="recenter-button">Recenter</button>
      </div>
      <article class="glass-panel tracker-status">
        <h1>${trackerHeadline(booking.status, shootrName)}</h1>
        <p>${nextStatusLabel(booking.status)}</p>
        <strong>${isSearching ? "Searching" : "8 min"}</strong>
        <span>${settings.demoMode ? "Demo booking shown for testing." : "Last updated 2 minutes ago."}</span>
      </article>
      ${isSearching ? `<article class="mobile-shootr-card"><h3>No Shootr assigned yet.</h3><p>We’ll show the live route after someone accepts.</p><a class="button primary" href="/app/matches">See nearby Shootrs</a></article>` : `<article class="mobile-shootr-card">
        <div class="mobile-shootr-head">
          <img src="/assets/profile-maya.png" alt="Jasmine profile photo" />
          <div><h3>Jasmine</h3><strong>On the move</strong><span>Protected contact</span></div>
        </div>
        <div class="button-row"><a class="button secondary" href="/app/support?topic=booking">Message</a><a class="button secondary" href="/app/support?topic=booking">Call</a><a class="button secondary" href="/app/support?topic=booking">Share booking</a><a class="button secondary" href="/app/support?topic=safety">Safety</a><button class="button ghost" data-cancel-booking="${booking.id}">Cancel</button></div>
      </article>`}
    </section>
    ${bottomNav("customer")}`;
}

function legacyMomentsRedirect() {
  window.history.replaceState({}, "", "/app/moments");
  return galleryScreen();
}

function legacyMomentsDetailRedirect() {
  window.history.replaceState({}, "", "/app/moments/demo-booking");
  return galleryDetailScreen();
}

function legacyShootrMomentsRedirect() {
  window.history.replaceState({}, "", "/app/moments");
  return galleryScreen();
}

function galleryScreen() {
  const gallery = ensureGallery();
  const approved = hasShootrApproval();
  if (!gallery) {
    return pageHero("Moments", "Your Moments") + `
      <section class="app-screen">
        ${emptyStateMarkup("No Moments yet", "Completed shoots will appear here after delivery.")}
      </section>
      ${bottomNav("customer")}`;
  }
  const items = visibleGalleryItems(gallery);
  if (!items.length) {
    return pageHero("Moments", "Your Moments") + `
      <section class="app-screen">${emptyStateMarkup("No visible Moments", "Blocked or removed content is hidden from your gallery.")}</section>
      ${bottomNav("customer")}`;
  }
  return pageHero("Moments", "Your Moments") + `
    <section class="app-screen">
      ${approved ? segmentedLinks([["My Moments", "/app/moments"], ["Delivered", "/app/moments?view=delivered"]], new URLSearchParams(window.location.search).get("view") === "delivered" ? "Delivered" : "My Moments") : ""}
      <article class="gallery-card">
        <img src="/${items[0].thumbnailUrl}" alt="Gallery cover" />
        <div><p class="eyebrow">${settings.demoMode ? "Demo gallery" : "Private gallery"}</p><h2>${new Date(gallery.createdAt).toLocaleDateString()}</h2><p>${settings.demoMode ? "Sample gallery" : "Jasmine"} · ${items.length} photos · Expires ${gallery.expiresAt}</p><a class="button primary" href="/app/moments/demo-booking">Open</a></div>
      </article>
      ${approved && new URLSearchParams(window.location.search).get("view") === "delivered" ? `<div class="app-strip"><h2>Delivered</h2><p>Galleries you complete for jobs will appear here.</p></div>` : ""}
    </section>
    ${bottomNav("customer")}`;
}

function galleryDetailScreen() {
  const gallery = ensureGallery();
  if (!gallery) {
    return pageHero("Your Moments", "No gallery is ready yet.") + `
      <section class="app-screen">${emptyStateMarkup("No Moments yet", "Delivered photos will appear here after a completed shoot.")}</section>
      ${bottomNav("customer")}`;
  }
  const items = visibleGalleryItems(gallery);
  if (!items.length) {
    return pageHero("Your Moments", "Hidden after block or moderation.") + `
      <section class="app-screen">${emptyStateMarkup("No visible Moments", "Blocked or removed content no longer appears for you.")}</section>
      ${bottomNav("customer")}`;
  }
  const link = createShareLink(gallery, { ttlHours: 24 });
  return pageHero("Your Moments", "Your moments are ready.") + `
    <section class="app-panel">
      <div class="portfolio-large">${items.map((item) => `<figure><img src="/${item.thumbnailUrl}" alt="Gallery thumbnail" /><figcaption><a href="/app/support?topic=gallery&contentId=${encodeURIComponent(item.id)}&reportedUserId=${encodeURIComponent(gallery.shootrId)}&contentType=Delivered%20image">Report photo</a></figcaption></figure>`).join("")}</div>
      <div class="button-row">
        <a class="button secondary" href="/app/book">Book Again</a>
        <a class="button secondary" href="/app/support?topic=gallery&reportedUserId=${encodeURIComponent(gallery.shootrId)}&contentType=Delivered%20image">Report an Issue</a>
        <button class="button secondary" data-block-user="${gallery.shootrId}" data-block-content="${items[0].id}" data-block-context="gallery">Block User</button>
      </div>
      <p class="form-note" id="galleryNote" role="status">Private link active: ${isShareLinkExpired(link) ? "no" : "yes"}.</p>
    </section>
    ${bottomNav("customer")}`;
}

function profileScreen() {
  const state = getShootrApplicationState();
  const approved = hasShootrApproval();
  ensureHouseholdModel();
  const shootrBlock = shootrProfileBlock(state, approved);
  return `
    <section class="app-screen profile-screen">
      <div class="profile-title"><h1>Profile</h1></div>
      <article class="profile-header-card">
        <div class="profile-avatar" aria-label="Profile photo">HL</div>
        <div>
          <h2>${getProfileName()}</h2>
          <p>Member since 2026</p>
        </div>
      </article>
      <div class="profile-card"><h2>Account</h2><div class="detail-grid"><span><strong>Name</strong>${getProfileName()}</span><span><strong>Contact</strong>Added during booking</span><span><strong>Profile photo</strong>Initials</span></div></div>
      ${shootrBlock}
      <div class="profile-card"><h2>Invite</h2><div class="invite-option"><div><strong>Invite Friends</strong><p>Share Shootrs with someone who should be in the picture.</p></div><button class="button secondary" data-referral="friend">Share</button></div><div class="invite-option"><div><strong>Refer a Shootr</strong><p>Know a great Shootr?</p></div><button class="button secondary" data-referral="shootr">Invite</button></div><p class="form-note" id="referralNote"></p></div>
      <div class="profile-card"><h2>Preferences</h2><div class="settings-list profile-row-list"><a href="/privacy">Privacy</a><a href="/app/support?topic=notifications">Notifications</a><a href="/app/support?topic=location">Location</a><a href="/app/support?topic=appearance">Appearance</a></div></div>
      <div class="profile-card"><h2>Support</h2><div class="settings-list profile-row-list"><a href="/app/support">Help</a><a href="/safety">Safety</a><a href="/app/support?topic=block">Blocked Accounts</a><a href="/app/support?topic=contact">Contact Support</a><a href="/app/support?topic=report">Report Content or User</a></div></div>
      <div class="profile-card legal-card"><h2>Legal</h2><div class="settings-list profile-row-list"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/community-standards">Community Standards</a><a href="/account-deletion">Account Deletion Policy</a><a class="destructive-row" href="/app/profile/delete-account">Delete Account</a></div><p class="form-note">Account deletion is available in-app. Some payment, tax, safety, or dispute records may be retained where required.</p></div>
    </section>${bottomNav("customer")}`;
}

function deleteAccountScreen() {
  return pageHero("Delete Account", "This permanently removes your Shootrs account where allowed.") + `
    <section class="app-screen">
      <form class="app-panel deletion-flow" data-delete-account-form>
        <h2>What happens</h2>
        <ul class="plain-list">
          <li>Profile, contact details, local drafts, saved preferences, and availability settings are removed from this device.</li>
          <li>Private gallery share links are revoked where possible.</li>
          <li>Active bookings, payment disputes, safety reports, tax, payout, fraud, and legal records may need limited retention where required.</li>
          <li>If you signed in with Apple, associated account tokens are revoked where required.</li>
        </ul>
        <label>Type DELETE to continue<input name="confirmation" autocomplete="off" required /></label>
        <div class="button-column">
          <button class="button danger" type="submit">Delete Account</button>
          <a class="button secondary" href="/app/profile">Cancel</a>
        </div>
        <p class="form-note" id="deleteAccountNote" role="status"></p>
      </form>
    </section>${bottomNav("customer")}`;
}

function shootrProfileBlock(state, approved) {
  if (approved) {
    return `<div class="profile-card shootr-profile-card"><h2>Shootr</h2><p>Shootr Settings</p><span class="form-note">Manage your availability, portfolio, equipment and earnings.</span><div class="approved-glance"><span>${getShootrAvailability()}</span><span>Today’s earnings $0</span></div><div class="settings-list profile-row-list">${[
      ["Ready or Away", "/app/profile/shootr-settings"],
      ["Jobs", "/app/jobs"],
      ["Portfolio", "/app/profile/portfolio"],
      ["Availability", "/app/profile/availability"],
      ["Equipment", "/app/profile/shootr-settings"],
      ["Travel Radius", "/app/profile/availability"],
      ["Reputation", "/app/profile/shootr-settings"],
      ["Earnings", "/app/profile/earnings"],
      ["Payouts", "/app/profile/payouts"],
    ].map(([item, href]) => `<a href="${href}">${item}</a>`).join("")}</div></div>`;
  }

  if (state === "started") {
    const draft = loadShootrApplicationDraft();
    const hasProgress = Object.keys(draft.data || {}).length > 0 || Number(draft.step || 0) > 0;
    return hasProgress
      ? `<div class="profile-card shootr-profile-card"><h2>Shootr</h2><h3>Finish Your Application</h3><p>Complete your profile to submit it for review.</p><a class="button primary" href="/app/profile/become-a-shootr?step=${draft.step || 1}">Continue</a></div>`
      : `<div class="profile-card shootr-profile-card"><h2>Shootr</h2><h3>Become a Shootr</h3><p>Capture moments.</p><p>Work when you want.</p><p>Get paid.</p><a class="button primary" href="/app/profile/become-a-shootr">Learn More</a></div>`;
  }

  if (["submitted", "identity_pending", "portfolio_pending", "review_pending"].includes(state)) {
    return `<div class="profile-card shootr-profile-card"><h2>Shootr</h2><h3>Application in Review</h3><p>We’ll notify you when your profile has been reviewed.</p><a class="button secondary" href="/app/profile/shootr-status">View Status</a></div>`;
  }

  if (state === "rejected") {
    return `<div class="profile-card shootr-profile-card"><h2>Shootr</h2><h3>Application Update Needed</h3><p>Some details need correction before we can review again.</p><a class="button secondary" href="/app/profile/become-a-shootr">Update Application</a></div>`;
  }

  if (state === "suspended") {
    return `<div class="profile-card shootr-profile-card"><h2>Shootr</h2><h3>Shootr Access Paused</h3><p>Contact support if you think this needs another look.</p><a class="button secondary" href="/app/support">Contact Support</a></div>`;
  }

  return `<div class="profile-card shootr-profile-card"><h2>Shootr</h2><h3>Become a Shootr</h3><p>Capture moments.</p><p>Work when you want.</p><p>Get paid.</p><a class="button primary" href="/app/profile/become-a-shootr">Learn More</a></div>`;
}

function supportScreen() {
  const params = new URLSearchParams(window.location.search);
  const topic = params.get("topic") || "";
  const reportedUserId = params.get("reportedUserId") || "";
  const contentId = params.get("contentId") || "";
  const contentType = params.get("contentType") || "User";
  const contact = params.get("contact") || "";
  const isBlockFlow = topic.toLowerCase().includes("block");
  const supportHero = pageHero("Help", "Report, block, or get help with a booking.");
  if (isBlockFlow) {
    return supportHero + `
      <section class="app-screen">
        ${appBackBar("/app/support", "Help")}
        <form id="blockForm" class="app-panel support-form" data-block-form>
          <h2>Block contact</h2>
          <p>Blocking hides this person's visible content from your app and sends a moderation signal to Shootrs.</p>
          <label>User or Shootr ID<input name="reportedUserId" value="${reportedUserId}" placeholder="User or Shootr ID" required /></label>
          <label>Content ID<input name="contentId" value="${contentId}" placeholder="Optional content ID" /></label>
          <input type="hidden" name="contentType" value="${contentType}" />
          <label>Reason
            <select name="category">
              ${["Harassment or abusive behavior", "Spam or scam", "Privacy violation", "Impersonation", "Other"].map((item) => `<option>${item}</option>`).join("")}
            </select>
          </label>
          <label class="check-row"><input type="checkbox" name="confirmBlock" required /> <span>I want to block this person.</span></label>
          <button class="button danger" type="submit">Block User</button>
          <p class="form-note" id="blockNote" role="status"></p>
        </form>
      </section>${bottomNav("customer")}`;
  }

  if (topic.toLowerCase().includes("report") || topic.toLowerCase().includes("gallery")) {
    return supportHero + `
      <section class="app-screen">
        ${appBackBar("/app/support", "Help")}
        <form id="reportForm" class="app-panel support-form" data-report-form>
          <h2>Report a problem</h2>
          <p>Reports go to Shootrs moderation for review. Objectionable-content reports are reviewed within 24 hours.</p>
          <label>What are you reporting?
            <select name="contentType">
              ${["User", "Profile", "Portfolio image", "Delivered image", "Booking", "Message", "Review", "Payment", "Other"].map((item) => `<option ${contentType === item ? "selected" : ""}>${item}</option>`).join("")}
            </select>
          </label>
          <label>Reason
            <select name="category">
              ${reportReasons.map((item) => `<option>${item}</option>`).join("")}
            </select>
          </label>
          <label>Reported user ID<input name="reportedUserId" value="${reportedUserId}" placeholder="User or Shootr ID if known" /></label>
          <label>Content ID<input name="contentId" value="${contentId}" placeholder="Content ID if shown" /></label>
          <label>Details<textarea name="details"></textarea></label>
          <label>Email or phone for follow-up<input name="contact" autocomplete="email" value="${contact}" required /></label>
          <label class="check-row"><input type="checkbox" name="urgentSafety" /> <span>This is a safety issue.</span></label>
          <label class="check-row"><input type="checkbox" name="confirmReport" required /> <span>I confirm this report should be sent to Shootrs moderation.</span></label>
          <button class="button primary" type="submit">Submit Report</button>
          <p class="form-note">For immediate danger, contact local emergency services first.</p>
          <p class="form-note" id="reportNote" role="status"></p>
        </form>
      </section>${bottomNav("customer")}`;
  }

  if (topic && ["contact", "notifications", "location", "appearance", "payment", "refund", "support"].some((item) => topic.toLowerCase().includes(item))) {
    return supportHero + `
      <section class="app-screen">
        ${appBackBar("/app/support", "Help")}
        <form class="app-panel support-form" data-contact-support-form>
          <h2>Contact support</h2>
          <label>Topic<input name="topic" value="${humanize(topic)}" placeholder="What do you need help with?" required /></label>
          <label>Details<textarea name="details" required></textarea></label>
          <label>Email or phone for follow-up<input name="contact" autocomplete="email" required /></label>
          <button class="button primary" type="submit">Send Message</button>
          <p class="form-note" id="contactSupportNote" role="status"></p>
        </form>
      </section>${bottomNav("customer")}`;
  }

  return supportHero + `
    <section class="app-screen">
      <div class="app-grid three support-action-grid">
        <a class="app-card support-action-card report-action-card" href="/app/support?topic=report" aria-label="Report a problem">
          <h3>Report a problem</h3>
          <strong>Report</strong>
          <p>Open the report form and send it to Shootrs moderation.</p>
          <span class="button primary">Start Report</span>
        </a>
        <a class="app-card support-action-card block-action-card" href="/app/support?topic=block" aria-label="Block contact">
          <h3>Block contact</h3>
          <strong>Block</strong>
          <p>Block someone from contacting you and notify moderation.</p>
          <span class="button primary">Start Block</span>
        </a>
        ${card("Private galleries", "Control", "Report unauthorized, unsafe, or unwanted media.")}
      </div>
      <section class="app-panel support-form">
        <h2>Need something else?</h2>
        <p>Send a message to Shootrs support.</p>
        <a class="button primary" href="/app/support?topic=contact">Contact Support</a>
      </section>
    </section>${bottomNav("customer")}`;
}

function shootrHome() {
  return customerHome();
}

function shootrOnboarding() {
  const draft = loadShootrApplicationDraft();
  const requested = Number(new URLSearchParams(window.location.search).get("step") || draft.step || 0);
  const step = Math.max(0, Math.min(requested, applicationSteps.length - 1));
  return `<section class="app-screen onboarding-stepper">${shootrApplicationStep(step, draft)}</section>${bottomNav("customer")}`;
}

function shootrApplicationStep(step, draft) {
  const data = draft.data || {};
  const progress = step === 0 ? "" : onboardingProgress(applicationSteps[step], step);
  const continueButton = (next = step + 1, label = "Continue") => `<button class="button primary sticky-action" data-save-shootr-step="${step}" data-next-shootr-step="${next}">${label}</button>`;
  const backButton = step > 0 ? `<a class="button ghost" href="/app/profile/become-a-shootr?step=${step - 1}">Back</a>` : "";

  if (step === 0) {
    const hasAccepted = acceptedCurrentTerms();
    return `
      <div class="intro-panel">
        ${FocusMark("Shootr focus mark")}
        <p class="eyebrow">Become a Shootr</p>
        <h1>Become a Shootr</h1>
        <p>Capture moments.</p>
        <p>Work when you want.</p>
        <p>Get paid.</p>
        <section class="eula-gate">
          <h2>Before you apply</h2>
          <p>Agree to the Terms/EULA and Community Standards before creating or continuing a Shootr profile. Shootrs has zero tolerance for objectionable content and abusive users.</p>
          <div class="button-row"><a class="button secondary" href="/terms">Open Terms</a><a class="button secondary" href="/community-standards">Community Standards</a></div>
          <label class="check-row"><input type="checkbox" data-accept-terms ${hasAccepted ? "checked" : ""} /> <span>I agree to the Shootrs Terms/EULA and Community Standards. Version ${termsVersion}.</span></label>
          <p class="form-note" id="shootrStartNote" role="status"></p>
        </section>
        <div class="button-column">
          <a class="button primary" href="/app/profile/become-a-shootr?step=1" data-start-shootr-application>Continue</a>
          <a class="button ghost" href="/app/profile">Not Now</a>
        </div>
      </div>`;
  }

  if (step === 1) {
    return `${progress}<h1>About You</h1><p>Your legal name stays private. Your public display name is what people see.</p>
      <form class="wizard-form single-step-form" data-shootr-step-form>
        <label>Legal name<input name="legalName" autocomplete="name" value="${data.legalName || ""}" required /></label>
        <label>Public display name<input name="displayName" value="${data.displayName || ""}" required /></label>
        <label>Date of birth<input name="dob" type="date" value="${data.dob || ""}" required /></label>
        <label class="check-row"><input type="checkbox" name="ageConfirm" ${data.ageConfirm ? "checked" : ""} required /> <span>I confirm I am at least 18 years old.</span></label>
        <p id="shootrStepNote" class="form-note" role="status"></p>
        ${continueButton()}${backButton}
      </form>`;
  }

  if (step === 2) {
    return `${progress}<h1>Contact</h1><p>Email is used for receipts, application updates, payouts and account recovery.</p>
      <form class="wizard-form single-step-form" data-shootr-step-form>
        <label>Mobile number<input name="phone" type="tel" inputmode="tel" autocomplete="tel" value="${data.phone || ""}" required /></label>
        <button class="button secondary" type="button" data-verify-phone>Verify Mobile Number</button>
        <label>Email<input name="email" type="email" autocomplete="email" value="${data.email || ""}" required /></label>
        <p id="phoneVerifyNote" class="form-note">${data.phoneVerified ? "Mobile number verified." : ""}</p>
        ${continueButton()}${backButton}
      </form>`;
  }

  if (step === 3) {
    return `${progress}<h1>Your Area</h1><p>This determines which nearby jobs you may receive.</p>
      <form class="wizard-form single-step-form" data-shootr-step-form>
        <button class="button secondary" type="button" data-use-shootr-location>Use Current Location</button>
        <label>Search City<input name="serviceArea" autocomplete="address-level2" value="${data.serviceArea || ""}" placeholder="City or general area" required /></label>
        <div class="choice-grid">${radiusOptions.map((item) => `<label class="choice-card ${data.radius === item ? "selected" : ""}"><input type="radio" name="radius" value="${item}" ${data.radius === item ? "checked" : ""} required /><span>${item}</span></label>`).join("")}</div>
        ${data.radius === "Custom" ? `<label>Custom radius<input name="customRadius" value="${data.customRadius || ""}" placeholder="Example: 12 miles" /></label>` : ""}
        ${continueButton()}${backButton}
      </form>`;
  }

  if (step === 4) {
    const setup = data.setup || "Phone";
    return `${progress}<h1>Your Setup</h1><p>Current applications are for photography only.</p>
      <form class="wizard-form single-step-form" data-shootr-step-form>
        <input type="hidden" name="service" value="Photos" />
        <div class="choice-grid">${setupOptions.map((item) => `<label class="choice-card ${setup === item ? "selected" : ""}"><input type="radio" name="setup" value="${item}" ${setup === item ? "checked" : ""} required /><strong>${item}</strong></label>`).join("")}</div>
        ${setup === "Phone" || setup === "Both" ? `<label>Phone model<input name="phoneModel" value="${data.phoneModel || ""}" required /></label>` : ""}
        ${setup === "Pro Camera" || setup === "Both" ? `<label>Camera body<input name="cameraBody" value="${data.cameraBody || ""}" required /></label><label>Main lens or lenses<input name="lenses" value="${data.lenses || ""}" required /></label><label>Optional lighting equipment<input name="lighting" value="${data.lighting || ""}" /></label>` : ""}
        <p class="form-note">Photos</p>
        <h2>How will you get to jobs?</h2>
        <div class="choice-grid">${transportationOptions.map((item) => `<label class="choice-card ${data.transportation === item ? "selected" : ""}"><input type="radio" name="transportation" value="${item}" ${data.transportation === item ? "checked" : ""} required /><span>${item}</span></label>`).join("")}</div>
        <label>Optional notes<textarea name="setupNotes">${data.setupNotes || ""}</textarea></label>
        ${continueButton()}${backButton}
      </form>`;
  }

  if (step === 5) {
    return `${progress}<h1>Show Your Eye</h1><p>Photos must show people, be your own work, and represent what you can reliably deliver.</p>
      <form class="wizard-form single-step-form" data-shootr-step-form>
        <button class="button secondary" type="button" data-photo-intent="profile">Add Profile Photo</button>
        <label class="file-label">Profile photo<input name="profilePhoto" type="file" accept="image/heic,image/jpeg,image/png,image/*" /></label>
        <button class="button secondary" type="button" data-photo-intent="portfolio">Add Portfolio Photos</button>
        <label class="file-label">Three required portfolio images<input name="portfolio" type="file" accept="image/heic,image/jpeg,image/png,image/*" multiple /></label>
        <label>Portfolio or Instagram link<input name="portfolioLink" value="${data.portfolioLink || ""}" /></label>
        <div class="button-row"><button class="button secondary" type="button">Crop</button><button class="button secondary" type="button">Rotate</button><button class="button secondary" type="button">Reorder</button><button class="button secondary" type="button">Replace</button><button class="button secondary" type="button">Remove</button></div>
        <p class="form-note">Get permission before submitting identifiable private individuals.</p>
        ${continueButton()}${backButton}
      </form>`;
  }

  if (step === 6) {
    const selected = Array.isArray(data.availability) ? data.availability : [];
    return `${progress}<h1>When Are You Available?</h1>
      <form class="wizard-form single-step-form" data-shootr-step-form>
        <div class="choice-grid">${availabilityOptions.map((item) => `<label class="choice-card ${selected.includes(item) ? "selected" : ""}"><input type="checkbox" name="availability" value="${item}" ${selected.includes(item) ? "checked" : ""} /><span>${item}</span></label>`).join("")}</div>
        <label>Minimum notice<select name="minimumNotice"><option ${data.minimumNotice === "15 minutes" ? "selected" : ""}>15 minutes</option><option ${data.minimumNotice === "30 minutes" ? "selected" : ""}>30 minutes</option><option ${data.minimumNotice === "1 hour" ? "selected" : ""}>1 hour</option><option ${data.minimumNotice === "Same day" ? "selected" : ""}>Same day</option></select></label>
        <label>Preferred travel radius<select name="preferredRadius">${radiusOptions.map((item) => `<option ${data.preferredRadius === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        <label>Maximum jobs per day<input name="maxJobs" type="number" min="1" value="${data.maxJobs || ""}" /></label>
        ${continueButton()}${backButton}
      </form>`;
  }

  if (step === 7) {
    return `${progress}<h1>Safety</h1><p>This contact is used only when necessary for account or booking safety.</p>
      <form class="wizard-form single-step-form" data-shootr-step-form>
        <label>Emergency contact name<input name="emergencyName" value="${data.emergencyName || ""}" required /></label>
        <label>Emergency contact mobile number<input name="emergencyPhone" type="tel" inputmode="tel" value="${data.emergencyPhone || ""}" required /></label>
        ${["Community standards", "Safety policy", "Photo consent requirements", "No private communication with minors", "No unauthorized posting of customer photos", "Accurate location and identity information"].map((item) => `<label class="check-row"><input type="checkbox" name="policies" value="${item}" ${data.policies?.includes(item) ? "checked" : ""} required /> <span>${item}</span></label>`).join("")}
        ${continueButton()}${backButton}
      </form>`;
  }

  if (step === 8) {
    return `${progress}<h1>Get Paid</h1><p>Payout setup happens through a secure payout provider. Shootr does not store raw bank details in this form.</p>
      <form class="wizard-form single-step-form" data-shootr-step-form>
        <div class="summary-card"><strong>Payout provider</strong><span>${settings.demoMode ? "Development setup" : "Connect payout account"}</span></div>
        <label class="check-row"><input type="checkbox" name="payoutReady" ${data.payoutReady ? "checked" : ""} required /> <span>I understand payout setup is required before paid jobs.</span></label>
        ${continueButton()}${backButton}
      </form>`;
  }

  return `${progress}<h1>Review Your Application</h1>
    <section class="summary-card review-summary">
      ${[
        ["Public name", data.displayName || "Not added"],
        ["City", data.serviceArea || "Not added"],
        ["Travel radius", data.radius || "Not added"],
        ["Setup", data.setup || "Phone"],
        ["Portfolio images", data.portfolioAdded || "Ready to add"],
        ["Availability", Array.isArray(data.availability) ? data.availability.join(", ") : "Not added"],
        ["Contact verification", data.phoneVerified ? "Verified" : "Needs verification"],
        ["Policy agreements", data.policies?.length ? "Accepted" : "Needs review"],
        ["Payout setup", data.payoutReady ? "Prepared" : "Needed"],
      ].map(([label, value], index) => `<div><span>${label}</span><strong>${value}</strong><a href="/app/profile/become-a-shootr?step=${Math.min(index + 1, 8)}">Edit</a></div>`).join("")}
    </section>
    <button class="button primary sticky-action" data-submit-shootr-application>Submit for Review</button>
    ${backButton}
    <p id="shootrOnboardingNote" class="form-note" role="status"></p>`;
}

function onboardingProgress(label, step) {
  const value = Math.max(1, Math.min(step, applicationSteps.length - 1));
  return `<div class="flow-progress" aria-label="${label}"><span>${humanize(label)}</span><em><i style="width:${(value / (applicationSteps.length - 1)) * 100}%"></i></em></div>`;
}

function shootrStatusScreen() {
  const state = getShootrApplicationState();
  const status = applicationStatusLabel(state);
  const rows = [
    ["Application received", state === "started" ? "Action needed" : "In review"],
    ["Identity review", state === "approved" ? "Approved" : status],
    ["Portfolio review", state === "approved" ? "Approved" : status],
    ["Payout setup", state === "approved" ? "Approved" : status],
    ["Decision", status],
  ];
  return pageHero("Application Status", "We’ll notify you when a decision is ready.") + `<section class="app-screen"><div class="status-timeline clean-timeline">${rows.map(([label, value]) => `<div><strong>${label}</strong><span>${value}</span></div>`).join("")}</div><a class="button secondary" href="/app/profile">Back to Profile</a></section>${bottomNav("customer")}`;
}

function shootrRequests() {
  return pageHero("Jobs", "New jobs nearby.") + `
    <section class="app-panel">
      ${requestCard(demoBooking, true)}
      <div class="button-row"><button class="button primary" data-accept-booking="demo-booking">Lock it in</button><button class="button secondary" data-unavailable="Passing on jobs is not available in this release.">Pass</button></div>
      <p id="acceptNote" class="form-note"></p>
    </section>
    ${bottomNav("customer")}`;
}

function shootrJobs() {
  return pageHero("Jobs", "Nearby requests you can lock in.") + `
    <section class="app-screen">
      ${hasShootrApproval() ? jobFeed() : emptyStateMarkup("Shootr approval required", "Apply from Profile to start accepting jobs.")}
    </section>${bottomNav("customer")}`;
}

function shootrJobDetails() {
  const booking = bookingForCurrentPath();
  if (!booking) return pageHero("Job", "This job is not available.") + emptyState("Job unavailable", "No live job was found for this route.") + bottomNav("customer");
  return pageHero("Job", "Follow each step in order.") + `<section class="app-panel"><h2>Next action</h2><div class="button-column"><button class="button secondary" data-unavailable="Turn-by-turn navigation is not available in this release.">Navigate</button><button class="button secondary" data-transition="shootr_en_route" data-transition-booking="${booking.id}">On the move</button><button class="button secondary" data-transition="shootr_arrived" data-transition-booking="${booking.id}">Nearby</button><button class="button secondary" data-transition="in_progress" data-transition-booking="${booking.id}">Start</button><button class="button secondary" data-transition="awaiting_upload" data-transition-booking="${booking.id}">Finish</button><a class="button primary" href="/app/jobs/${booking.id}/deliver">Deliver moments</a></div><div class="button-row"><a class="button secondary" href="/app/support?topic=booking">Report a problem</a><a class="button secondary" href="/app/support?topic=safety">Safety</a><a class="button secondary" href="/app/support">Help</a></div><p id="transitionNote" class="form-note"></p></section>${bottomNav("customer")}`;
}

function shootrDeliver() {
  const booking = bookingForCurrentPath();
  if (!booking) return pageHero("Deliver moments", "This job is not available.") + emptyState("Delivery unavailable", "No live job was found for this route.") + bottomNav("customer");
  const batch = createUploadBatch({ bookingId: booking.id, files: settings.demoMode ? ["demo-1.jpg", "demo-2.heic"] : [] });
  const retried = batch.items.length ? retryUpload(batch, batch.items[0].id) : batch;
  return pageHero("Deliver moments", "Upload from camera roll or your normal workflow.") + `
    <section class="app-panel">
      <label>Choose photos<input type="file" accept="image/heic,image/jpeg,image/png,image/*" multiple /></label>
      <div class="choice-grid">
        <button class="choice-card selected" data-unavailable="Instant Drop is the only delivery option available in this release."><strong>Instant Drop</strong><span>Selected photos delivered quickly with little or no editing.</span></button>
        <button class="choice-card" data-unavailable="Finished Gallery delivery is not available in this release."><strong>Finished Gallery</strong><span>Curated and edited photos delivered by the booking deadline.</span></button>
      </div>
      <div class="button-row"><button class="button primary" data-unavailable="Private storage upload is not available in this release.">Upload directly to private storage</button><button class="button secondary" data-unavailable="Upload pause is not available in this release.">Pause</button><button class="button secondary" data-unavailable="Upload retry is not available in this release.">Retry</button></div>
      <p class="form-note" id="deliveryNote" role="status">${retried.items.length ? `Upload prepared. Retry count: ${retried.items[0].retries}.` : "Choose photos to prepare an upload."} Do not delete originals before delivery is complete.</p>
    </section>
    ${bottomNav("customer")}`;
}

function availabilityScreen() {
  return pageHero("Availability", "Choose when nearby jobs can reach you.") + `
    <section class="app-panel">
      <form id="availabilityForm" class="booking-grid">
        <label>Status<select name="availability"><option>Ready</option><option>Away</option></select></label>
        <label>Travel radius<select name="radius">${radiusOptions.map((item) => `<option>${item}</option>`).join("")}</select></label>
        <label>Minimum earnings<input name="minimumPrice" type="number" value="39" /></label>
        <label>Setup<select name="mode"><option>Phone</option><option>Pro Camera</option><option>Both</option></select></label>
        <label>Work<select name="moments"><option>Photos</option></select></label>
        <label>Quiet hours<input name="quietHours" value="10 PM to 8 AM" /></label>
        <label><input type="checkbox" name="paused" /> Pause requests</label>
        <button class="button primary" type="submit">Save availability</button>
        <p id="availabilityNote" class="form-note"></p>
      </form>
    </section>${bottomNav("customer")}`;
}

function shootrMoments() {
  return pageHero("Moments", "Uploads and delivered moments.") + `<section class="app-screen"><div class="app-strip"><h2>Uploads due</h2><p>Deliver moments after finishing a job.</p></div><div class="app-strip"><h2>Uploading</h2><p>No uploads in progress.</p></div><div class="app-strip"><h2>Delivered</h2><p>Finished moments appear here.</p></div></section>${bottomNav("customer")}`;
}

function shootrProfileScreen() {
  return profileScreen();
}

function portfolioScreen() {
  return pageHero("Portfolio", "Add a profile photo and top three samples.") + `<section class="app-panel"><label>Portfolio upload<input type="file" accept="image/*" multiple /></label></section>${bottomNav("customer")}`;
}

function earningsScreen() {
  return pageHero("Earnings", "Your booking earnings.") + `
    <section class="app-panel">
      <div class="price-table"><div><span>Booking price</span><strong>$79</strong></div><div><span>Platform fee</span><strong>-$8</strong></div><div><span>Adjustment</span><strong>$0</strong></div><div><span>Tip</span><strong>$0</strong></div><div><span>Net earnings</span><strong>$71</strong></div><div><span>Payout status</span><strong>Pending</strong></div></div>
    </section>${bottomNav("customer")}`;
}

function payoutsScreen() {
  return pageHero("Payouts", "Manage how you get paid.") + `
    <section class="app-panel">
      <p>Payout setup happens through a secure payout provider. Shootr does not store raw bank details in this form.</p>
      <div class="settings-list">${["Legal identity", "Tax information", "Bank or debit account", "Payout preference"].map((item) => `<button type="button" data-unavailable="${item} setup is not available in this release.">${item}</button>`).join("")}</div>
      <p class="form-note" id="payoutNote" role="status"></p>
    </section>${bottomNav("customer")}`;
}

function settingsScreen() {
  const earned = reputationLevel(store.shootrs.find((shootr) => shootr.onboardingStatus === "approved") || {}) || "New Shootr";
  return pageHero("Shootr Settings", "Manage your availability, portfolio, equipment and earnings.") + `
    <section class="app-screen">
      ${availabilityControl(getShootrAvailability())}
      <div class="app-strip"><h2>Status</h2><div class="settings-list">${["Ready", "Away"].map((item) => `<a href="#" data-shootr-availability="${item}">${item}</a>`).join("")}</div></div>
      <div class="app-strip"><h2>Work</h2><div class="settings-list">${[["Jobs", "/app/jobs"], ["Availability", "/app/profile/availability"], ["Travel radius", "/app/profile/availability"], ["Minimum earnings", "/app/profile/availability"], ["Phone or Pro Camera", "/app/profile/shootr-settings"]].map(([item, href]) => `<a href="${href}">${item}</a>`).join("")}</div></div>
      <div class="app-strip"><h2>Profile</h2><div class="settings-list">${[["Public display name", "/app/profile"], ["Profile photo", "/app/profile/portfolio"], ["Portfolio", "/app/profile/portfolio"], ["About", "/app/profile"], ["Service area", "/app/profile/availability"]].map(([item, href]) => `<a href="${href}">${item}</a>`).join("")}</div></div>
      <div class="app-strip"><h2>Reputation</h2><p>${earned}</p></div>
      <div class="app-strip"><h2>Money</h2><div class="settings-list">${[["Earnings", "/app/profile/earnings"], ["Tips", "/app/profile/earnings"], ["Payouts", "/app/profile/payouts"], ["Tax information", "/app/profile/payouts"]].map(([item, href]) => `<a href="${href}">${item}</a>`).join("")}</div></div>
      <div class="app-strip"><h2>Safety</h2><div class="settings-list">${[["Emergency contact", "/app/profile/shootr-status"], ["Safety policies", "/safety"], ["Report history", "/app/support"], ["Blocked accounts", "/app/support"]].map(([item, href]) => `<a href="${href}">${item}</a>`).join("")}</div></div>
    </section>${bottomNav("customer")}`;
}

function adminHome() {
  return pageHero("Admin", "Operate an early pilot manually without editing source code.") + `
    <section class="app-grid three">
      ${card("Marketplace mode", settings.marketplaceMode, "Availability, pilot, or live.")}
      ${card("Feature flags", Object.keys(settings.featureFlags).length, "Manage product switches without component rewrites.")}
      ${card("Storage period", `${settings.galleryStorageDays} days`, "Moments retention is configurable.")}
    </section>`;
}

function adminUsers() {
  return pageHero("Users", "Customer, Shootr, business, agency, and admin role records.") + cardSection(["Customers", "Shootrs", "Businesses", "Agencies", "Admins", "Suspensions"]);
}

function adminShootrs() {
  return pageHero("Review Shootrs", "Approve, reject, suspend, and review portfolio samples.") + `<section class="app-grid">${store.shootrs.map((shootr) => card(shootr.displayName, shootr.onboardingStatus, `${shootr.label}. Verification is real only after approval.`)).join("")}</section>`;
}

function adminBusinesses() {
  return pageHero("Businesses", "Prepared for hotels, restaurants, venues, tourism operators, event planners, recurring bookings, and referrals.") + cardSection(["Business records", "Recurring bookings", "Multi-location notes"]);
}

function adminAgencies() {
  return pageHero("Agencies", "Organizations that manage multiple Shootrs.") + cardSection(["Organization record", "Team members", "Managed Shootrs", "Roles and permissions", "Centralized payouts later"]);
}

function adminBookings() {
  return pageHero("Bookings", "Manual matching, cancellation, rematching, refunds, and status review.") + `<section class="app-grid">${store.bookings.map(bookingCard).join("")}</section>`;
}

function adminGalleries() {
  return pageHero("Galleries", "Review upload failures, storage periods, and private gallery access.") + cardSection(["Signed URLs", "Upload failures", "Storage expiration", "Deletion requests"]);
}

function adminIncidents() {
  const reports = store.reports || [];
  const incidents = store.incidents || [];
  const blocks = store.blocks || [];
  const openReports = reports.filter((report) => ["new", "reviewed"].includes(report.status));
  const overdue = openReports.filter((report) => Date.now() - new Date(report.createdAt).getTime() > 24 * 60 * 60 * 1000);
  const reportCards = reports.length
    ? reports.map((report) => {
        const incident = incidents.find((item) => item.reportId === report.id);
        return `<article class="app-card moderation-card">
          <p class="eyebrow">${report.status}${overdue.includes(report) ? " · overdue" : ""}</p>
          <h3>${report.category}</h3>
          <p>${report.contentType} ${report.contentId ? `· ${report.contentId}` : ""}</p>
          <p>Reported user: ${report.reportedUserId || "Unknown"}</p>
          <p>Age: ${moderationAge(report.createdAt)} · Due: ${incident?.reviewDueAt ? new Date(incident.reviewDueAt).toLocaleString() : "24 hours"}</p>
          ${report.comment ? `<p>${report.comment}</p>` : ""}
          <div class="button-row">
            <button class="button secondary" data-moderation-action="remove_content" data-report-id="${report.id}" data-content-id="${report.contentId}" data-user-id="${report.reportedUserId}">Remove Content</button>
            <button class="button secondary" data-moderation-action="suspend_user" data-report-id="${report.id}" data-content-id="${report.contentId}" data-user-id="${report.reportedUserId}">Suspend User</button>
            <button class="button secondary" data-moderation-action="dismiss_report" data-report-id="${report.id}" data-content-id="${report.contentId}" data-user-id="${report.reportedUserId}">Dismiss</button>
            <button class="button secondary" data-moderation-action="restore_content" data-report-id="${report.id}" data-content-id="${report.contentId}" data-user-id="${report.reportedUserId}">Restore</button>
          </div>
        </article>`;
      }).join("")
    : emptyStateMarkup("No reports", "Report and block records will appear here.");
  return pageHero("Moderation", "Reports, blocks, and 24-hour objectionable-content review.") + `
    <section class="app-grid three">
      ${card("New reports", String(openReports.length), "Review within 24 hours.")}
      ${card("Overdue", String(overdue.length), "Requires immediate action.")}
      ${card("Active blocks", String(blocks.filter((block) => block.status === "active").length), "Blocks also notify moderation.")}
    </section>
    <section class="app-grid">${reportCards}</section>`;
}

function adminPayments() {
  return pageHero("Payments", "Processor integration point.") + cardSection(["Authorization", "Capture", "Service fee", "Commission", "Urgency fee", "Travel fee", "Venue fee", "Taxes", "Tips", "Refunds", "Disputes", "Credits", "Payouts"]);
}

function adminServiceAreas() {
  return pageHero("Service areas", "Internal availability controls stay separate from public global positioning.") + `<section class="app-grid">${store.serviceZones.map((zone) => card(`${zone.city}, ${zone.country || zone.state}`, statusLabels[zone.status] || zone.status, `${zone.serviceRadiusMiles} mile radius. ${zone.activeShootrCount || zone.approvedShootrCount || 0} active Shootrs. Demand: ${zone.demandCount || zone.customerWaitlistCount || 0}.`)).join("")}</section>`;
}

function adminSettings() {
  return pageHero("Settings", "Manage prices, service areas, feature flags, storage periods, and integrations.") + `
    <section class="app-grid three">
      ${Object.entries(settings.featureFlags).map(([key, value]) => card(key, value ? "On" : "Off", "Configurable feature flag.")).join("")}
    </section>`;
}

function adminDemand() {
  return pageHero("Availability demand", "Saved requests and regional supply needs.") + `<section class="app-grid three">${card("Saved alerts", String(store.waitlist.length), "Customers asking for availability.")}${card("Shootrs", String(store.shootrs.length), "Applications and approved profiles.")}${card("Service areas", String(store.serviceZones.length), "Coverage controls.")}</section>`;
}

function authScreen(path) {
  const title = path.split("/").filter(Boolean).join(" ").replaceAll("-", " ");
  const hasAccepted = acceptedCurrentTerms();
  return pageHero(title, "Continue without losing your booking or application progress.") + `
    <section class="app-panel">
      <div class="eula-gate">
        <h2>Terms/EULA</h2>
        <p>Before you continue, agree to the Shootrs Terms/EULA and Community Standards. Shootrs has zero tolerance for objectionable content, abusive users, harassment, hate, threats, sexually exploitative content, illegal activity, impersonation, privacy violations, spam, or scams.</p>
        <p>Users may report content or users, block abusive users, and Shootrs may remove content, suspend accounts, terminate accounts, and investigate reports. Objectionable-content reports are reviewed within 24 hours.</p>
        <div class="button-row"><a class="button secondary" href="/terms">Open Terms</a><a class="button secondary" href="/community-standards">Community Standards</a><a class="button secondary" href="/privacy">Privacy</a></div>
        <label class="check-row"><input type="checkbox" data-accept-terms ${hasAccepted ? "checked" : ""} /> <span>I agree to the Shootrs Terms/EULA, Community Standards, and Privacy Policy. Version ${termsVersion}.</span></label>
      </div>
      <div class="button-column">
        <button class="button primary" data-auth-provider="local">Continue</button>
      </div>
      <p class="form-note" id="authNote" role="status"></p>
      <p class="form-note">You can delete your account from Profile at any time.</p>
    </section>`;
}

function legalPage(path) {
  if (path.includes("privacy")) {
    return appBackBar("/app/profile", "Profile") + pageHero("Privacy Policy", "How Shootrs uses data to run the app.") + `
      <section class="app-screen legal-copy">
        ${card("Data used to run Shootrs", "App functionality", "Name, email, phone, approximate location, booking details, messages, support reports, reviews, and private gallery media may be needed to provide the service.")}
        ${card("Location", "Contextual", "Shootrs requests location only when you try to find nearby Shootrs. Manual address search remains available if permission is denied.")}
        ${card("Photos", "User controlled", "Photo-library access should be requested only when uploading, saving, or delivering moments. Galleries are private by default.")}
        ${card("Payments", "Real-world services", "Card and payout details should be handled by payment providers. Shootrs should not store raw card or bank information.")}
        ${card("Tracking", "Off by default", "Do not track users across apps or websites unless App Tracking Transparency consent and App Store privacy disclosures are complete.")}
        ${card("Deletion", "In app", "Users can request deletion from Profile. Shootrs deletes or anonymizes personal data unless retention is required for payment, tax, fraud, safety, or legal reasons.")}
      </section>`;
  }
  if (path.includes("community-standards")) {
    return appBackBar("/app/profile", "Profile") + pageHero("Community Standards", "Safety rules for everyone using Shootrs.") + `
      <section class="app-screen legal-copy">
        ${card("Respect and consent", "Required", "Do not upload or share unauthorized private photos. Minors require guardian involvement.")}
        ${card("Zero tolerance", "Required", "Objectionable content, abusive users, harassment, hate, threats, sexually exploitative content, illegal activity, impersonation, privacy violations, spam, and scams are not allowed.")}
        ${card("Report and block", "Available", "Users can report content or users, block abusive users, and contact Shootrs from inside the app. Blocking immediately hides that user's visible content from the blocker.")}
        ${card("24-hour review", "Moderation", "Shootrs reviews objectionable-content reports within 24 hours and may remove content, limit sharing, suspend accounts, terminate accounts, cancel bookings, or escalate safety issues.")}
      </section>`;
  }
  if (path.includes("account-deletion")) {
    return appBackBar("/app/profile", "Profile") + pageHero("Account Deletion Policy", "How account deletion works.") + `
      <section class="app-screen legal-copy">
        ${card("In-app deletion", "Profile", "Delete Account is available from Profile > Legal.")}
        ${card("What gets deleted", "Personal data", "Profile, contact details, device-local drafts, preferences, and non-retained media should be deleted or anonymized.")}
        ${card("What may be retained", "Limited records", "Payment, payout, tax, dispute, fraud, safety, and legal records may be retained only as necessary and disclosed in policy.")}
        ${card("Sign in with Apple", "Token revocation", "If Apple login is used, Shootrs revokes associated tokens during account deletion when required.")}
      </section>`;
  }
  return appBackBar("/app/profile", "Profile") + pageHero("Terms of Service / EULA", `Version ${termsVersion}.`) + `
    <section class="app-screen legal-copy">
      ${card("Real-world services", "Shootrs bookings", "Shootrs connects customers with people who capture photos or video in person.")}
      ${card("Payments and refunds", "Disclosed before booking", "Final price, cancellation rules, refunds, tips, and platform fees must be clear before payment.")}
      ${card("User content", "Private by default", "Customers and Shootrs are responsible for rights, consent, and lawful use of profile photos, portfolios, delivered Moments, captions, bios, reviews, messages, booking notes, and any uploaded media.")}
      ${card("Zero tolerance", "Required", "Shootrs does not allow objectionable content or abusive users. Harassing, threatening, hateful, sexually exploitative, illegal, impersonating, privacy-violating, spam, or scam behavior is prohibited.")}
      ${card("Reports and blocks", "In app", "Users may report content or users and block abusive users. Blocking hides that user's visible content from the blocker and creates a moderation signal for developer review.")}
      ${card("Enforcement", "24-hour review", "Shootrs may investigate reports, remove content, restore content when appropriate, suspend accounts, terminate accounts, cancel bookings, and act on objectionable-content reports within 24 hours.")}
    </section>`;
}

function pageHero(title, subtitle) {
  return `<section class="app-hero compact-app-hero"><p class="eyebrow">Shootrs</p><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</section>`;
}

function appBackBar(href = "/app", label = "Back") {
  const copy = label === "Back" ? "Back" : `Back to ${label}`;
  return `<nav class="app-back-bar" aria-label="Back navigation"><a class="button ghost" href="${href}">${copy}</a></nav>`;
}

function progressHeader(label, step) {
  const total = 6;
  const value = Math.max(1, Math.min(step, total));
  return `<div class="flow-progress" aria-label="${label}"><span>${label}</span><em><i style="width:${(value / total) * 100}%"></i></em></div>`;
}

function stepCard(number, title, copy) {
  return `<article class="app-card"><strong class="step-number">${number}</strong><h3>${title}</h3><p>${copy}</p></article>`;
}

function card(title, kicker, copy) {
  return `<article class="app-card"><h3>${title}</h3><strong>${kicker}</strong><p>${copy}</p></article>`;
}

function cardSection(items) {
  return `<section class="app-grid three">${items.map((item) => card(item, "Ready", "Available when you need it.")).join("")}</section>`;
}

function segmentedLinks(items, activeLabel) {
  return `<div class="segmented-links" role="tablist">${items.map(([label, href]) => `<a href="${href}" role="tab" ${label === activeLabel ? `aria-selected="true"` : ""}>${label}</a>`).join("")}</div>`;
}

function jobFeed() {
  const realRequests = store.bookings.filter((booking) => booking.label !== "Sample booking" && ["submitted", "searching", "offered"].includes(booking.status));
  const accepted = store.bookings.filter((booking) => booking.label !== "Sample booking" && ["confirmed", "shootr_en_route", "shootr_arrived", "in_progress", "awaiting_upload"].includes(booking.status));
  const available = settings.demoMode ? [demoBooking, ...realRequests] : realRequests;
  const sections = [
    ["New", getShootrAvailability() === "Ready" ? available : []],
    ["Upcoming", accepted.filter((booking) => ["confirmed", "shootr_en_route"].includes(booking.status))],
    ["Active", accepted.filter((booking) => ["shootr_arrived", "in_progress", "awaiting_upload"].includes(booking.status))],
    ["Completed", store.bookings.filter((booking) => booking.label !== "Sample booking" && ["delivered", "completed"].includes(booking.status))],
  ];
  return `${availabilityControl(getShootrAvailability())}${sections.map(([title, items]) => `<div class="app-strip"><h2>${title}</h2>${items.length ? items.map((booking) => title === "New" ? requestCard(booking, true) : bookingCard(booking)).join("") : `<p>${title === "New" ? "Turn Ready on to receive nearby jobs." : "Jobs will appear here."}</p>`}</div>`).join("")}`;
}

function getShootrApplicationState() {
  const state = localStorage.getItem(applicationStateKey);
  if (state) return state;
  const application = store.shootrs.find((shootr) => shootr.onboardingStatus && shootr.onboardingStatus !== "approved");
  if (application) return application.onboardingStatus;
  return hasShootrApproval() ? "approved" : "started";
}

function hasShootrApproval() {
  return getSessionRole() === roles.SHOOTR || localStorage.getItem(applicationStateKey) === "approved" || store.shootrs.some((shootr) => shootr.onboardingStatus === "approved" && shootr.label !== "Development data");
}

function getShootrAvailability() {
  if (!hasShootrApproval()) return "Away";
  return localStorage.getItem(availabilityStateKey) || "Away";
}

function loadShootrApplicationDraft() {
  try {
    return JSON.parse(localStorage.getItem(shootrApplicationDraftKey)) || { step: 0, data: {} };
  } catch {
    return { step: 0, data: {} };
  }
}

function saveShootrApplicationDraft(patch) {
  const current = loadShootrApplicationDraft();
  const next = { ...current, ...patch, data: { ...(current.data || {}), ...(patch.data || {}) } };
  localStorage.setItem(shootrApplicationDraftKey, JSON.stringify(next));
  localStorage.setItem(applicationStateKey, "started");
  return next;
}

function collectShootrStepData(form) {
  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (value.name) data[key === "portfolio" ? "portfolioAdded" : key] = key === "portfolio" ? "Ready to review" : value.name;
      continue;
    }
    if (data[key]) {
      data[key] = Array.isArray(data[key]) ? [...data[key], filterTextInput(value)] : [data[key], filterTextInput(value)];
    } else {
      data[key] = filterTextInput(value);
    }
  }
  ["ageConfirm", "payoutReady"].forEach((key) => {
    if (form.querySelector(`[name="${key}"]`)) data[key] = Boolean(form.querySelector(`[name="${key}"]`)?.checked);
  });
  data.phoneVerified = loadShootrApplicationDraft().data?.phoneVerified || data.phoneVerified;
  return data;
}

function isAdult(dob) {
  if (!dob) return false;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age >= 18;
}

function applicationStatusLabel(state) {
  const labels = {
    started: "Action needed",
    submitted: "In review",
    identity_pending: "In review",
    portfolio_pending: "In review",
    review_pending: "In review",
    approved: "Approved",
    rejected: "Update requested",
    suspended: "Paused",
  };
  return labels[state] || "Action needed";
}

function getReferralCode(type) {
  const key = `shootr-referral-${type}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const prefix = type === "shootr" ? "JOIN" : "PHOTO";
  const code = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  localStorage.setItem(key, code);
  return code;
}

function getReferralUrl(type) {
  const code = getReferralCode(type).toLowerCase().replace(/[^a-z0-9]/g, "");
  return `https://shootr.com/invite/${code}`;
}

function getProfileName() {
  const draft = loadShootrApplicationDraft();
  return draft.data?.displayName || "Hashim Lafond" || "Your Profile";
}

function ensureHouseholdModel() {
  if (localStorage.getItem(householdsKey)) return;
  localStorage.setItem(householdsKey, JSON.stringify({
    households: [],
    members: [],
    sharedMoments: [],
    favoriteShootrs: [],
    sharedPaymentMethods: [],
    invitations: [],
    permissions: [],
  }));
}

function publicShootrCard(shootr) {
  const reputation = reputationLevel(shootr);
  return `<article class="app-card"><p class="eyebrow">Demo profile</p><h3>${shootr.displayName}</h3><p>${labelShootrType(shootr.type)} · ${shootr.city}</p><div class="badge-row">${reputation ? `<span>${reputation}</span>` : ""}${shootr.profileReviewStatus === "portfolio_approved" ? `<span>Profile Reviewed</span>` : ""}</div><a class="button secondary" href="/shootrs/hashimlafond">View profile</a></article>`;
}

function requestCard(booking, withActions = false) {
  const demoLabel = settings.demoMode && booking.label === "Sample booking" ? `<span>Demo</span>` : "";
  return `<article class="app-card job-card"><p class="eyebrow">${booking.meetingLocation.privateHome ? "Private residence" : "Nearby job"}</p><h3>${booking.estimatedTravelTime || "12 min"} away</h3><p>${booking.meetingLocation.approximateArea} · ${booking.scheduledTime || "Now"}</p><strong>Estimated earnings: $${Math.max(0, booking.priceBreakdown.total - booking.priceBreakdown.platformFee)}</strong><p>${booking.durationMinutes} min · ${booking.preferences?.[0] || "No Preference"}</p>${booking.customerInstructions ? `<p>${booking.customerInstructions}</p>` : ""}<div class="badge-row">${demoLabel}<span>Approximate area</span></div>${withActions ? `<div class="button-row"><button class="button primary" data-accept-booking="${booking.id}">Lock It In</button><button class="button secondary">Pass</button></div><p id="acceptNote" class="form-note"></p>` : ""}</article>`;
}

function bookingCard(booking) {
  const person = findShootr(booking.shootrId)?.displayName || "Shootr";
  const isPast = ["delivered", "completed"].includes(booking.status);
  const isActive = ["confirmed", "shootr_en_route", "shootr_arrived", "in_progress", "awaiting_upload", "uploading"].includes(booking.status);
  return `<article class="app-card booking-card"><p class="eyebrow">${customerStatus(booking.status)}</p><h3>${person.split(" ")[0]}</h3><p>${booking.estimatedTravelTime || "8 min"} · ${booking.meetingLocation.approximateArea}</p><div class="button-row"><a class="button secondary" href="/app/bookings/${booking.id}">View</a>${isActive ? `<a class="button primary" href="/app/bookings/${booking.id}/track">View Tracker</a>` : ""}${isPast ? `<a class="button secondary" href="/app/moments/${booking.id}">Open Moments</a><a class="button ghost" href="/app/book">Book Again</a>` : ""}</div></article>`;
}

function bookingDetailPanel(booking) {
  return `<section class="app-panel"><h2>${customerStatus(booking.status)}</h2><div class="detail-grid"><span><strong>Shootr</strong>${findShootr(booking.shootrId)?.displayName || "Jasmine"}</span><span><strong>Where</strong>${publicLocationForBooking(booking)}</span><span><strong>When</strong>${booking.scheduledTime || "Now"}</span><span><strong>Length</strong>${booking.durationMinutes} min</span><span><strong>Service</strong>${booking.preferences?.[0] || "No Preference"}</span><span><strong>Moments</strong>${deliveryLabel(booking.deliveryStatus)}</span></div>${priceTable(booking.priceBreakdown)}<p>${booking.cancellationPolicy}</p><a href="${booking.incidentReportLink}">Report a problem</a></section>`;
}

function matchCard(shootr) {
  const reputation = reputationLevel(shootr);
  const ratingLabel = shootr.rating ? `${shootr.rating} rating` : "No live rating yet";
  return `
    <article class="mobile-shootr-card">
      <div class="mobile-shootr-head">
        <img src="/${shootr.profilePhoto || "assets/profile-maya.png"}" alt="${shootr.displayName} profile photo" />
        <div>
          <h3>${shootr.displayName}</h3>
          <strong>Arrives in ${shootr.etaMinutes || "12"} min</strong>
          <span>${ratingLabel}</span>
        </div>
      </div>
      <div class="mobile-shootr-meta">${reputation ? `<span>${reputation}</span>` : ""}<span>${settings.demoMode ? "Demo profile" : "Reviewed"}</span><span>From $${shootr.startingPrice || 39}</span></div>
      <div class="portfolio-strip">${shootr.portfolio.slice(0, 3).map((src) => `<img src="/${src}" alt="${shootr.displayName} portfolio thumbnail" />`).join("")}</div>
      <button class="button primary" data-choose-shootr="${shootr.id}">Choose</button>
      <div class="safety-actions">
        <a href="/app/support?topic=report&reportedUserId=${encodeURIComponent(shootr.id)}&contentId=${encodeURIComponent(contentIdFor("profile", shootr.id))}&contentType=Profile">Report</a>
        <button type="button" data-block-user="${shootr.id}" data-block-content="${contentIdFor("profile", shootr.id)}" data-block-context="match-card">Block</button>
      </div>
    </article>`;
}

function priceTable(price) {
  const visibleKeys = ["package", "urgencyFee", "travelFee", "serviceFee", "paymentProcessingFee", "tax", "tip", "discount", "refundAmount", "total"];
  return `<div class="price-table">${visibleKeys
    .filter((key) => Number(price[key] || 0) !== 0 || key === "package" || key === "total")
    .map((key) => `<div><span>${humanize(key)}</span><strong>${key === "discount" || key === "refundAmount" ? "-" : ""}$${Math.abs(Number(price[key] || 0))}</strong></div>`)
    .join("")}</div>`;
}

function priceSummary(packageId, urgency) {
  return `<div class="summary-card"><h3>Itemized price</h3>${priceTable(calculatePrice({ packageId, urgency }))}<p>Cancellation terms: no charge if no Shootr accepts.</p></div>`;
}

function checkboxes(name, options) {
  return `<div class="choice-grid">${options.map((option) => `<label class="choice-card"><input type="checkbox" name="${name}" value="${option}" /><span>${option}</span></label>`).join("")}</div>`;
}

function emptyState(title, copy) {
  return `<section class="app-panel">${emptyStateMarkup(title, copy)}</section>`;
}

function emptyStateMarkup(title, copy) {
  return `<div class="empty-state"><h3>${title}</h3><p>${copy}</p></div>`;
}

function FocusMark(label = "Focus point", animated = false) {
  return `<span class="focus-mark ${animated ? "is-animated" : ""}" aria-label="${label}" role="img"><span></span></span>`;
}

function FocusMarkAnimated(label = "Finding") {
  return FocusMark(label, true);
}

function FocusMapPin(label = "Meeting point") {
  return `<span class="focus-map-pin">${FocusMark(label)}<small>${label}</small></span>`;
}

function FocusSelectedState() {
  return `${FocusMark("Selected")}<span>Locked.</span>`;
}

function FocusLoadingIndicator() {
  return `<div class="focus-loader">${FocusMarkAnimated("Finding your Shootr")}</div>`;
}

function FocusAppIconDetail() {
  return FocusMark("Shootr focus mark");
}

function navIcon(icon) {
  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 4l8 7.2V20h-5.3v-5.2H9.3V20H4z"/></svg>`,
    bookings: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h2v3H7zM15 3h2v3h-2z"/><path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 6v8h14v-8z"/></svg>`,
    moments: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm1 11h8l-2.6-3.4-2 2.4-1.3-1.6z"/><path d="M8 3h11a2 2 0 0 1 2 2v11h-2V5H8z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z"/><path d="M4 21a8 8 0 0 1 16 0z"/></svg>`,
    jobs: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l1 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3zm1.5 3h5L14 6h-4z"/><path d="M9 13h6v2H9z"/></svg>`,
  };
  return icons[icon] || icons.home;
}

function bottomNav(kind) {
  const items = [["Home", "/app", "home"], ["Bookings", "/app/bookings", "bookings"], ["Moments", "/app/moments", "moments"], ["Profile", "/app/profile", "profile"]];
  const path = currentPath();
  return `<nav class="bottom-nav ${kind}-nav" aria-label="App navigation">${items.map(([label, href, icon]) => {
    const active = path === href || (href !== "/app" && path.startsWith(href)) || (label === "Bookings" && path.startsWith("/app/jobs")) || (label === "Moments" && path.includes("/vault"));
    return `<a href="${href}" ${active ? `aria-current="page"` : ""}><span class="nav-icon">${navIcon(icon)}</span>${label}</a>`;
  }).join("")}</nav>`;
}

function ensureGallery() {
  if (!isFeatureEnabled("DEMO_MODE") && !store.galleries.length) return null;
  if (!store.galleries.length) {
    store.galleries.push(createGallery({
      bookingId: "demo-booking",
      customerId: "demo-subject",
      shootrId: "demo-go-1",
      files: [
        { name: "moment-1.jpg", thumbnailUrl: "assets/moment-girls-night.jpg", previewUrl: "assets/moment-girls-night.jpg", originalUrl: "private/demo/moment-1.jpg" },
        { name: "moment-2.jpg", thumbnailUrl: "assets/moment-birthday.jpg", previewUrl: "assets/moment-birthday.jpg", originalUrl: "private/demo/moment-2.jpg" },
        { name: "moment-3.jpg", thumbnailUrl: "assets/moment-family.jpg", previewUrl: "assets/moment-family.jpg", originalUrl: "private/demo/moment-3.jpg" },
      ],
      storageDays: settings.galleryStorageDays,
    }));
    saveStore(store);
  }
  return store.galleries[0];
}

function findShootr(id) {
  return visibleShootrs().find((shootr) => shootr.id === id) || store.shootrs.find((shootr) => shootr.id === id);
}

function bookingForCurrentPath() {
  const segments = currentPath().split("/").filter(Boolean);
  const bookingIndex = segments.findIndex((segment) => segment === "bookings" || segment === "jobs");
  const id = bookingIndex >= 0 ? segments[bookingIndex + 1] : null;
  if (!id) return null;
  const booking = store.bookings.find((item) => item.id === id);
  if (booking) return booking;
  if (isFeatureEnabled("DEMO_MODE") && id === "demo-booking") return demoBooking;
  return null;
}

function visibleShootrs() {
  const base = isFeatureEnabled("DEMO_MODE") ? store.shootrs : store.shootrs.filter((shootr) => shootr.label !== "Development data" && !shootr.id?.startsWith("demo-"));
  return base.filter((shootr) => !isUserBlocked(shootr.id) && !isUserSuspended(shootr.id) && !isContentRemoved(contentIdFor("profile", shootr.id)));
}

function acceptedCurrentTerms() {
  try {
    const acceptance = JSON.parse(localStorage.getItem(termsAcceptanceKey));
    if (acceptance?.version === termsVersion && acceptance?.acceptedAt) return true;
  } catch {
    // Continue to shared cache check below.
  }
  return (store.termsAcceptances || []).some((acceptance) => acceptance.userId === getCurrentUserId() && acceptance.version === termsVersion && acceptance.acceptedAt);
}

function acceptCurrentTerms(source = "auth") {
  const acceptance = {
    id: `terms-${Date.now()}`,
    userId: getCurrentUserId(),
    version: termsVersion,
    acceptedAt: new Date().toISOString(),
    source,
    buildNumber: currentBuildNumber,
  };
  localStorage.setItem(termsAcceptanceKey, JSON.stringify(acceptance));
  store.termsAcceptances = store.termsAcceptances || [];
  store.termsAcceptances.push(acceptance);
  saveStore(store);
  submitSafetyRecord("termsAcceptances", acceptance).catch((error) => console.warn("Shared terms acceptance failed.", error));
  return acceptance;
}

function contentIdFor(type, id) {
  return `${type}:${id || "unknown"}`;
}

function isUserBlocked(userId) {
  return Boolean(userId && (store.blocks || []).some((block) => block.blockedUserId === userId && block.status === "active"));
}

function isUserSuspended(userId) {
  return Boolean(userId && (store.suspensions || []).some((suspension) => suspension.userId === userId && suspension.status === "active"));
}

function isContentRemoved(contentId) {
  return Boolean(contentId && (store.removedContent || []).some((item) => item.contentId === contentId && item.status === "removed"));
}

function visibleGalleryItems(gallery) {
  if (!gallery) return [];
  if (isUserBlocked(gallery.shootrId) || isUserSuspended(gallery.shootrId)) return [];
  return (gallery.items || []).filter((item) => !isContentRemoved(item.id));
}

function textContainsProhibitedContent(value) {
  return prohibitedTextPattern.test(String(value || ""));
}

function describeSharedSafetyError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.errorMessage) return error.errorMessage;
  if (error.localizedDescription) return error.localizedDescription;
  try {
    return JSON.stringify(error, Object.getOwnPropertyNames(error));
  } catch {
    return String(error);
  }
}

function filterTextInput(value) {
  const text = String(value || "");
  return textContainsProhibitedContent(text) ? "[removed by content filter]" : text;
}

function createModerationSignal(type, payload = {}) {
  const event = {
    id: `moderation-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    status: "new",
    createdAt: new Date().toISOString(),
    buildNumber: currentBuildNumber,
    ...payload,
  };
  store.moderationEvents = store.moderationEvents || [];
  store.moderationEvents.push(event);
  return event;
}

function createReportRecord(data = {}, { sync = true } = {}) {
  const now = Date.now();
  const duplicate = (store.reports || []).find((report) =>
    report.reportedUserId === (data.reportedUserId || "") &&
    report.contentId === (data.contentId || "") &&
    report.category === (data.category || "Other") &&
    now - new Date(report.createdAt).getTime() < 10000
  );
  if (duplicate) return duplicate;
  const report = {
    id: `report-${now}-${Math.random().toString(36).slice(2, 7)}`,
    reporterUserId: getCurrentUserId(),
    reportedUserId: data.reportedUserId || "",
    contentId: data.contentId || "",
    contentType: data.contentType || "User",
    category: data.category || "Other",
    comment: data.comment || "",
    context: data.context || currentPath(),
    appVersion: "1.0",
    buildNumber: currentBuildNumber,
    status: "new",
    createdAt: new Date(now).toISOString(),
  };
  store.reports = store.reports || [];
  store.reports.push(report);
  const signal = createModerationSignal("report_created", {
    reportId: report.id,
    reportedUserId: report.reportedUserId,
    contentId: report.contentId,
    category: report.category,
  });
  if (sync) {
    submitSafetyRecord("reports", report).catch((error) => console.warn("Shared report failed.", error));
  }
  return report;
}

function createBlockRecord({ blockedUserId, contentId = "", reason = "Blocked from user action", context = currentPath(), sync = true }) {
  if (!blockedUserId) return null;
  store.blocks = store.blocks || [];
  const existing = store.blocks.find((block) => block.blockedUserId === blockedUserId && block.status === "active");
  if (existing) return existing;
  const block = {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    blockerUserId: getCurrentUserId(),
    blockedUserId,
    contentId,
    reason,
    context,
    status: "active",
    createdAt: new Date().toISOString(),
    buildNumber: currentBuildNumber,
  };
  store.blocks.push(block);
  const signal = createModerationSignal("user_blocked", {
    blockId: block.id,
    blockedUserId,
    contentId,
    reason,
    requiresDeveloperReviewWithinHours: 24,
  });
  if (sync) {
    submitSafetyRecord("blocks", block).catch((error) => console.warn("Shared block failed.", error));
    const blockSignalReport = createReportRecord({
      reportedUserId: blockedUserId,
      contentId,
      contentType: "User",
      category: "Block",
      comment: reason,
      context,
    }, { sync: false });
    submitSafetyRecord("reports", blockSignalReport).catch((error) => console.warn("Shared block moderation signal failed.", error));
  }
  return block;
}

function moderationAge(createdAt) {
  const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 36e5);
  if (!Number.isFinite(hours) || hours < 1) return "Less than 1 hour";
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

function labelShootrType(type) {
  return "Shootr";
}

function reputationLevel(shootr) {
  const levels = settings.reputationLevels || {};
  const trust = shootr.trustStatus || {};
  const metrics = shootr.metrics || {};
  const completed = metrics.completedBookings ?? shootr.completedBookings ?? 0;
  const rating = metrics.averageRating ?? shootr.rating ?? 0;
  const cancellationRate = metrics.cancellationRate ?? shootr.cancellationRate ?? 1;
  const incidents = shootr.scoreInputs?.reportedIncidents || 0;
  const profileReviewed = trust.portfolioReviewStatus === "approved" || shootr.profileReviewStatus === "portfolio_approved";
  const identityVerified = trust.identityVerificationStatus === "verified";
  const phoneVerified = trust.phoneVerificationStatus === "verified";
  const emailVerified = trust.emailVerificationStatus === "verified";

  const qualifies = (level) => {
    if (!level) return false;
    if (completed < (level.minimumCompletedJobs || 0)) return false;
    if ((level.minimumRating || 0) && rating < level.minimumRating) return false;
    if (level.maximumCancellationRate != null && cancellationRate > level.maximumCancellationRate) return false;
    if (level.maximumIncidentCount != null && incidents > level.maximumIncidentCount) return false;
    if (level.requiresProfileReview && !profileReviewed) return false;
    if (level.requiresIdentityVerification && !identityVerified) return false;
    if (level.requiresPhoneVerification && !phoneVerified) return false;
    if (level.requiresEmailVerification && !emailVerified) return false;
    return true;
  };

  if (qualifies(levels.topShootr)) return levels.topShootr.label;
  if (qualifies(levels.elite)) return levels.elite.label;
  if (qualifies(levels.reliable)) return levels.reliable.label;
  if (qualifies(levels.proven)) return levels.proven.label;
  return null;
}

function displayPackageName(item) {
  return item.name.replace(" Capture", "").replace(" Moment", "");
}

function humanize(key) {
  return key.replaceAll("_", " ").replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function customerStatus(status) {
  const labels = {
    draft: "Not booked yet",
    submitted: "Finding someone",
    searching: "Finding your Shootr...",
    offered: "Finding your Shootr...",
    temporarily_locked: "Locked.",
    accepted: "Locked.",
    payment_authorized: "You’re in.",
    confirmed: "You’re in.",
    shootr_en_route: "On the move",
    shootr_arrived: "Nearby",
    in_progress: "Capturing",
    awaiting_upload: "Selecting your moments...",
    awaiting_delivery: "Selecting your moments...",
    uploading: "Uploading",
    delivered: "Your moments are ready.",
    completed: "Mission complete.",
    resolved: "Case closed.",
    cancelled: "Cancelled",
    expired: "Expired",
    disputed: "Issue open",
    issue_reported: "Issue reported",
    refunded: "Refunded",
  };
  return labels[status] || "In progress";
}

function nextStatusLabel(status) {
  const labels = {
    confirmed: "Your Shootr will start heading over.",
    shootr_en_route: "They are heading to the meeting point.",
    shootr_arrived: "They are nearby.",
    in_progress: "They are capturing your moments.",
    awaiting_upload: "Selecting your moments...",
    awaiting_delivery: "Selecting your moments...",
    uploading: "Uploading...",
    delivered: "Open Moments.",
    disputed: "Support is reviewing this.",
    issue_reported: "Support is reviewing this.",
  };
  return labels[status] || "We'll keep this updated.";
}

function trackerHeadline(status, shootrName) {
  const labels = {
    searching: "Finding your Shootr...",
    temporarily_locked: "Locked.",
    confirmed: "You’re in.",
    shootr_en_route: `${shootrName} is on the move.`,
    shootr_arrived: `${shootrName} is nearby.`,
    in_progress: "Capturing.",
    awaiting_upload: "Selecting your moments...",
    uploading: "Uploading...",
    delivered: "Your moments are ready.",
    completed: "Mission complete.",
    resolved: "Case closed.",
    disputed: "Issue reported",
    issue_reported: "Issue reported",
  };
  return labels[status] || customerStatus(status);
}

function deliveryLabel(status) {
  const labels = {
    not_started: "Not started",
    uploading: "Uploading",
    delivered: "Ready",
  };
  return labels[status] || "Preparing";
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(draftKey)) || {};
  } catch {
    return {};
  }
}

function normalizeTiming(value) {
  if (!value) return "";
  return value.toLowerCase() === "later" ? "Later" : "Now";
}

function saveDraft(patch) {
  const filteredPatch = { ...patch };
  ["instructions", "formattedAddress", "approximateArea", "firstName", "lastName", "email", "mobile"].forEach((key) => {
    if (key in filteredPatch) filteredPatch[key] = filterTextInput(filteredPatch[key]);
  });
  const next = { ...loadDraft(), ...filteredPatch };
  localStorage.setItem(draftKey, JSON.stringify(next));
  return next;
}

function goToStep(step) {
  const next = saveDraft({ step });
  const timing = next.timing ? `&timing=${String(next.timing).toLowerCase()}` : "";
  window.location.href = `/app/book?step=${next.step}${timing}`;
}

function bindGlobalActions() {
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      setSessionRole(button.dataset.role);
      render();
    });
  });
}

function bindViewActions(path) {
  document.querySelectorAll("[data-unavailable]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const message = button.dataset.unavailable || "This is not available in this release.";
      const scope = button.closest(".app-panel, .profile-card, .app-strip, .gallery-card, .app-card") || document;
      const note = scope.querySelector(".form-note[role='status'], .form-note") || document.querySelector(".form-note[role='status']");
      if (note) {
        note.textContent = message;
      } else {
        button.setAttribute("aria-label", message);
      }
    });
  });

  document.querySelectorAll("[data-start-booking]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      saveDraft({ timing: normalizeTiming(link.dataset.startBooking), step: 1 });
      window.location.assign(link.href);
    });
  });

  document.querySelectorAll(".bottom-nav a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.assign(link.href);
    });
  });

  document.querySelectorAll("[data-moment-start]").forEach((link) => {
    link.addEventListener("click", () => saveDraft({ moment: link.dataset.momentStart, step: 2 }));
  });

  document.querySelectorAll("[data-save-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.saveStep;
      const value = button.dataset.value;
      const currentDraft = loadDraft();
      const hasLocation = currentDraft.formattedAddress || currentDraft.locationType || currentDraft.locationPermission === "granted";
      const nextStep = field === "timing" ? (hasLocation ? 3 : 1) : field === "preference" ? 4 : 1;
      saveDraft({ [field]: value, step: nextStep });
      goToStep(nextStep);
    });
  });

  document.querySelector("[data-use-location]")?.addEventListener("click", () => {
    const locationNextStep = loadDraft().timing ? 3 : 2;
    if (!navigator.geolocation) {
      saveDraft({ locationPermission: "unavailable", approximateArea: "Manual location", locationType: "manual", step: locationNextStep });
      render();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveDraft({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          formattedAddress: "Current approximate location",
          approximateArea: "Nearby area",
          locationType: "current_location",
          locationPermission: "granted",
          step: locationNextStep,
        });
        goToStep(locationNextStep);
      },
      (error) => {
        saveDraft({ locationPermission: error.code === error.TIMEOUT ? "timed out" : "denied", step: locationNextStep });
        render();
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 },
    );
  });

  document.querySelector("[data-address-input]")?.addEventListener("change", (event) => {
    const locationNextStep = loadDraft().timing ? 3 : 2;
    saveDraft({ formattedAddress: event.target.value, approximateArea: event.target.value || "Selected area", locationType: "address_search", locationPermission: "not requested", step: locationNextStep });
  });

  document.querySelector("[data-address-input]")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    document.querySelector("[data-save-address]")?.click();
  });

  document.querySelector("[data-save-address]")?.addEventListener("click", () => {
    const input = document.querySelector("[data-address-input]");
    const value = input && typeof input.value === "string" ? input.value.trim() : "";
    const note = document.querySelector(".form-note");
    if (!value) {
      if (note) note.textContent = "Enter an address, venue, or neighborhood to continue.";
      return;
    }
    const locationNextStep = loadDraft().timing ? 3 : 2;
    saveDraft({ formattedAddress: value, approximateArea: value, locationType: "address_search", locationPermission: "not requested", step: locationNextStep });
    goToStep(locationNextStep);
  });

  document.querySelectorAll("[data-save-location]").forEach((button) => {
    button.addEventListener("click", () => {
      const locationNextStep = loadDraft().timing ? 3 : 2;
      saveDraft({ formattedAddress: button.dataset.saveLocation, approximateArea: button.dataset.saveLocation, locationType: button.dataset.saveLocation, locationPermission: "not requested", step: locationNextStep });
      goToStep(locationNextStep);
    });
  });

  document.querySelector("[data-schedule-date]")?.addEventListener("change", (event) => saveDraft({ scheduleDate: event.target.value }));
  document.querySelector("[data-schedule-time]")?.addEventListener("change", (event) => saveDraft({ scheduleTime: event.target.value }));
  document.querySelector("[data-booking-note]")?.addEventListener("change", (event) => saveDraft({ instructions: event.target.value }));

  document.querySelectorAll("[data-preference]").forEach((button) => {
    button.addEventListener("click", () => {
      saveDraft({ preference: button.dataset.preference });
      render();
    });
  });

  document.querySelectorAll("[data-choose-shootr]").forEach((button) => {
    button.addEventListener("click", () => {
      saveDraft({ shootrId: button.dataset.chooseShootr, step: 7 });
      window.location.href = "/app/book?step=7";
    });
  });

  document.querySelectorAll("[data-package]").forEach((button) => {
    button.addEventListener("click", () => {
      saveDraft({ packageId: button.dataset.package, step: 5 });
      goToStep(5);
    });
  });

  document.querySelectorAll("[data-contact]").forEach((input) => {
    input.addEventListener("change", () => saveDraft({ [input.dataset.contact]: input.value }));
  });

  document.querySelector("[data-adult-consent]")?.addEventListener("change", (event) => {
    saveDraft({ adultConsent: event.currentTarget.checked });
  });

  document.querySelector("[data-rights-ack]")?.addEventListener("change", (event) => {
    saveDraft({ rightsAcknowledged: event.currentTarget.checked });
  });

  document.querySelector("[data-next-step]")?.addEventListener("click", (event) => goToStep(Number(event.currentTarget.dataset.nextStep)));

  document.querySelector("[data-run-search]")?.addEventListener("click", () => {
    const status = document.querySelector("[data-search-status]");
    const indicator = document.querySelector(".real-search-indicator");
    if (status) status.textContent = "Checking nearby Shootrs...";
    if (indicator) indicator.classList.add("active");
    setTimeout(() => {
      window.location.href = "/app/matches";
    }, 650);
  });

  document.querySelector("[data-authorize-payment]")?.addEventListener("click", () => {
    const draft = saveDraft({ paymentStatus: "payment_authorized", step: 9 });
    track(store, "payment_authorized", { packageId: draft.packageId });
    saveStore(store);
    goToStep(9);
  });

  document.querySelector("[data-confirm-booking]")?.addEventListener("click", () => {
    const draft = loadDraft();
    const selectedPackage = packages.find((item) => item.id === draft.packageId) || packages[0];
    if (!draft.shootrId) {
      saveDraft({ step: 5 });
      window.location.href = "/app/matches";
      return;
    }
    const adultConsent = document.querySelector("[data-adult-consent]")?.checked || draft.adultConsent;
    const rightsAcknowledged = document.querySelector("[data-rights-ack]")?.checked || draft.rightsAcknowledged;
    if (!adultConsent || !rightsAcknowledged) {
      const note = document.querySelector("#confirmNote");
      if (note) note.textContent = "Confirm the age and rights acknowledgements before booking.";
      return;
    }
    const request = createBookingRequest({
      ...draft,
      packageId: selectedPackage.id,
      durationMinutes: selectedPackage.durationMinutes,
      customerId: "demo-subject",
      consent: {
        acknowledged: true,
        consentTimestamp: new Date().toISOString(),
        consentActor: "customer",
      },
    });
    const accepted = draft.shootrId ? acceptBooking(request, draft.shootrId) : request;
    const authorized = authorizeSelectedBooking(accepted);
    const confirmed = confirmAcceptedBooking(authorized);
    store.bookings.push(confirmed);
    store.notifications.push(createNotification("booking_confirmed", "subject", "Booking confirmed."));
    track(store, "booking_confirmed", { bookingId: confirmed.id });
    saveStore(store);
    localStorage.removeItem(draftKey);
    window.location.href = "/app/bookings";
  });

  document.querySelector("[data-expand-radius]")?.addEventListener("click", () => {
    const current = loadDraft().travelMiles || 4;
    const nextMiles = Math.min(current + 4, 20);
    const draft = saveDraft({ travelMiles: nextMiles });
    track(store, "search_radius_expanded", { travelMiles: draft.travelMiles });
    const status = document.querySelector("[data-search-status]");
    const indicator = document.querySelector(".real-search-indicator");
    const expandButton = document.querySelector("[data-expand-radius]");
    if (status) status.textContent = `Expanding search to ${draft.travelMiles} miles...`;
    if (indicator) indicator.classList.add("active");
    if (expandButton) {
      expandButton.textContent = "Searching wider area...";
      expandButton.disabled = true;
    }
    if (current >= 20) {
      if (status) status.textContent = "Maximum search radius reached.";
      render();
      return;
    }
    setTimeout(() => {
      window.location.href = "/app/matches";
    }, 650);
  });

  document.querySelectorAll("[data-increase-offer]").forEach((button) => {
    button.addEventListener("click", () => {
      const draft = loadDraft();
      saveDraft({ increasedOffer: (draft.increasedOffer || 0) + Number(button.dataset.increaseOffer) });
      render();
    });
  });

  document.querySelector("[data-availability-alert]")?.addEventListener("click", () => {
    store.waitlist.push({ ...loadDraft(), createdAt: new Date().toISOString() });
    track(store, "availability_alert_saved");
    saveStore(store);
    render();
  });

  document.querySelector("[data-contact-support-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const note = document.querySelector("#contactSupportNote");
    if (textContainsProhibitedContent(data.details)) {
      if (note) note.textContent = "Remove abusive language or summarize the issue without repeating it.";
      return;
    }
    store.supportCases = store.supportCases || [];
    store.supportCases.push({
      id: `support-${Date.now()}`,
      topic: data.topic,
      details: data.details,
      contact: data.contact,
      createdAt: new Date().toISOString(),
      status: "new",
    });
    track(store, "support_message_sent", { topic: data.topic });
    saveStore(store);
    form.innerHTML = `<div class="success-state" role="status"><h2>Message sent</h2><p>Shootrs support received your message.</p><a class="button primary" href="/app/support">Done</a></div>`;
  });

  document.querySelector("[data-report-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const note = document.querySelector("#reportNote");
    const submitButton = form.querySelector("button[type='submit']");
    if (!data.confirmReport) {
      if (note) note.textContent = "Confirm that this report should be sent to Shootrs moderation.";
      return;
    }
    if (textContainsProhibitedContent(data.details)) {
      if (note) note.textContent = "This text contains prohibited language. Remove it or summarize the issue without repeating abusive content.";
      return;
    }
    const report = createReportRecord({
      reportedUserId: data.reportedUserId,
      contentId: data.contentId,
      contentType: data.contentType,
      category: data.category,
      comment: data.details,
      context: "report-flow",
    }, { sync: false });
    store.incidents = store.incidents || [];
    store.incidents.push({
      id: `incident-${Date.now()}`,
      reportId: report.id,
      topic: "Report",
      contentType: data.contentType,
      category: data.category,
      reportedUserId: data.reportedUserId,
      contentId: data.contentId,
      details: data.details,
      contact: data.contact,
      urgentSafety: Boolean(data.urgentSafety),
      status: "new",
      moderationStatus: "needs_review",
      createdAt: report.createdAt,
      reviewDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    track(store, "report_submitted", { category: data.category });
    saveStore(store);
    if (submitButton) submitButton.disabled = true;
    if (note) note.textContent = "Submitting report to Shootrs moderation...";
    try {
      const savedReport = await submitSafetyRecord("reports", report);
      form.innerHTML = `
        <div class="success-state" role="status">
          <h2>Report submitted</h2>
          <p>Your report was sent to Shootrs moderation for review.</p>
          <p class="form-note">Report ID: ${savedReport?.id || report.id}</p>
          <div class="button-column">
            <a class="button primary" href="/app/support">Done</a>
            <a class="button secondary" href="/app/support">Back to Help</a>
          </div>
        </div>`;
    } catch (error) {
      const reason = describeSharedSafetyError(error);
      console.warn("Shared report submission failed.", reason, error);
      if (note) note.textContent = "Report could not reach moderation. Check your connection and try again.";
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  document.querySelector("[data-block-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const note = document.querySelector("#blockNote");
    const submitButton = form.querySelector("button[type='submit']");
    if (!data.confirmBlock) {
      if (note) note.textContent = "Confirm that you want to block this person.";
      return;
    }
    if (!data.reportedUserId) {
      if (note) note.textContent = "Add the user or Shootr ID before blocking.";
      return;
    }
    const block = createBlockRecord({
      blockedUserId: data.reportedUserId,
      contentId: data.contentId,
      reason: data.category,
      context: "block-flow",
      sync: false,
    });
    const blockSignalReport = createReportRecord({
      reportedUserId: data.reportedUserId,
      contentId: data.contentId,
      contentType: data.contentType || "User",
      category: "Block",
      comment: data.category,
      context: "block-flow",
    }, { sync: false });
    track(store, "user_blocked_from_form", { blockedUserId: data.reportedUserId });
    saveStore(store);
    if (submitButton) submitButton.disabled = true;
    if (note) note.textContent = "Blocking user and notifying Shootrs moderation...";
    try {
      await Promise.all([
        submitSafetyRecord("blocks", block),
        submitSafetyRecord("reports", blockSignalReport),
      ]);
      if (note) note.textContent = "User blocked. Their visible content is hidden from your app.";
      form.reset();
    } catch (error) {
      const reason = describeSharedSafetyError(error);
      console.warn("Shared block submission failed.", reason, error);
      if (note) note.textContent = "User blocked on this device, but moderation could not be notified. Check your connection and try again.";
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  document.querySelector("[data-support-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const note = document.querySelector("#supportNote");
    if (!data.confirmReport) {
      if (note) note.textContent = "Confirm that this message should be sent to Shootrs.";
      return;
    }
    if (data.blockUser && !data.reportedUserId) {
      if (note) note.textContent = "Add the reported user ID before blocking.";
      return;
    }
    if (textContainsProhibitedContent(data.details)) {
      if (note) note.textContent = "This text contains prohibited language. Remove it or summarize the issue without repeating abusive content.";
      return;
    }
    store.incidents = store.incidents || [];
    const report = createReportRecord({
      reportedUserId: data.reportedUserId,
      contentId: data.contentId,
      contentType: data.contentType,
      category: data.category,
      comment: data.details,
      context: data.topic,
    }, { sync: false });
    const supportCase = {
      id: `incident-${Date.now()}`,
      reportId: report.id,
      topic: data.topic,
      contentType: data.contentType,
      category: data.category,
      reportedUserId: data.reportedUserId,
      contentId: data.contentId,
      details: data.details,
      contact: data.contact,
      blockRequested: Boolean(data.blockUser),
      urgentSafety: Boolean(data.urgentSafety),
      status: "new",
      moderationStatus: "needs_review",
      createdAt: new Date().toISOString(),
      reviewDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    store.incidents.push(supportCase);
    store.supportCases = store.supportCases || [];
    const sharedSupportCase = { ...supportCase, id: supportCase.id.replace("incident", "support") };
    store.supportCases.push(sharedSupportCase);
    let block = null;
    if (data.blockUser) {
      block = createBlockRecord({
        blockedUserId: data.reportedUserId,
        contentId: data.contentId,
        reason: data.category || data.topic,
        context: data.topic,
        sync: false,
      });
    }
    track(store, "support_report_submitted", { topic: data.topic });
    saveStore(store);
    if (note) note.textContent = "Sending message to Shootrs support...";
    const sharedWrites = [
      submitSafetyRecord("reports", report),
      ...(block ? [submitSafetyRecord("blocks", block)] : []),
    ];
    const results = await Promise.allSettled(sharedWrites);
    const failed = results.some((result) => result.status === "rejected");
    if (note) {
      note.textContent = failed
        ? "Report saved on this device. Shared moderation sync will retry when the safety service is available."
        : data.blockUser
          ? "Message sent and user blocked. Their visible content is hidden from your app."
          : "Message sent to Shootrs support.";
    }
    form.reset();
  });

  document.querySelectorAll("[data-block-user]").forEach((button) => {
    button.addEventListener("click", () => {
      const blockedUserId = button.dataset.blockUser;
      const contentId = button.dataset.blockContent || contentIdFor("profile", blockedUserId);
      const context = button.dataset.blockContext || currentPath();
      const confirmed = window.confirm("Block this user? Their visible content will be hidden from your app and Shootrs moderation will be notified.");
      if (!confirmed) return;
      createBlockRecord({
        blockedUserId,
        contentId,
        reason: "User blocked from safety control",
        context,
      });
      saveStore(store);
      render();
    });
  });

  document.querySelectorAll("[data-moderation-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.moderationAction;
      const reportId = button.dataset.reportId || "";
      const contentId = button.dataset.contentId || "";
      const userId = button.dataset.userId || "";
      const actionRecord = {
        id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action,
        reportId,
        contentId,
        userId,
        actor: "developer-admin",
        createdAt: new Date().toISOString(),
        notes: `${humanize(action)} from admin moderation queue.`,
      };
      store.moderationActions = store.moderationActions || [];
      store.moderationActions.push(actionRecord);
      if (reportId) {
        store.reports = (store.reports || []).map((report) => (report.id === reportId ? { ...report, status: action === "dismiss_report" ? "dismissed" : "actioned", actionTaken: action, reviewedAt: actionRecord.createdAt } : report));
        store.incidents = (store.incidents || []).map((incident) => (incident.reportId === reportId ? { ...incident, status: action === "dismiss_report" ? "dismissed" : "actioned", actionTaken: action, reviewedAt: actionRecord.createdAt } : incident));
      }
      if (action === "remove_content" && contentId) {
        store.removedContent = store.removedContent || [];
        if (!isContentRemoved(contentId)) {
          store.removedContent.push({ contentId, status: "removed", reportId, removedAt: actionRecord.createdAt, reason: "Admin moderation action" });
        }
      }
      if (action === "suspend_user" && userId) {
        store.suspensions = store.suspensions || [];
        if (!isUserSuspended(userId)) {
          store.suspensions.push({ userId, status: "active", reportId, suspendedAt: actionRecord.createdAt, reason: "Admin moderation action" });
        }
      }
      if (action === "restore_content" && contentId) {
        store.removedContent = (store.removedContent || []).map((item) => (item.contentId === contentId ? { ...item, status: "restored", restoredAt: actionRecord.createdAt } : item));
      }
      saveStore(store);
      try {
        await submitModerationAction(actionRecord);
        await hydrateSharedSafetyState();
      } catch (error) {
        window.alert("This action was saved locally, but shared moderation sync failed. Check the admin key and safety backend before App Review.");
        console.warn("Shared moderation action failed.", error);
      }
      render();
    });
  });

  document.querySelectorAll("[data-auth-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      const accepted = document.querySelector("[data-accept-terms]")?.checked;
      const note = document.querySelector("#authNote");
      if (!accepted) {
        if (note) note.textContent = "You must agree to the Terms/EULA before continuing.";
        return;
      }
      acceptCurrentTerms(`auth:${button.dataset.authProvider}`);
      setSessionRole(roles.SUBJECT);
      localStorage.setItem("shootr-auth-provider", button.dataset.authProvider);
      localStorage.setItem("shootr-session-created-at", new Date().toISOString());
      if (note) note.textContent = "Signed in.";
      window.setTimeout(() => {
        window.location.href = "/app";
      }, 300);
    });
  });

  document.querySelector("[data-dismiss-status-pill]")?.addEventListener("click", (event) => {
    localStorage.setItem(dismissedStatusPillKey, event.currentTarget.dataset.dismissStatusPill);
    render();
  });

  document.querySelectorAll("[data-shootr-availability]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.setItem(availabilityStateKey, button.dataset.shootrAvailability);
      localStorage.setItem("shootr-availability-updated-at", new Date().toISOString());
      render();
    });
  });

  document.querySelector("[data-start-shootr-application]")?.addEventListener("click", (event) => {
    const accepted = document.querySelector("[data-accept-terms]")?.checked;
    if (!accepted) {
      const note = document.querySelector("#shootrStartNote");
      if (note) note.textContent = "You must agree to the Terms/EULA before applying.";
      event.preventDefault();
      return;
    }
    acceptCurrentTerms("shootr-onboarding");
    saveShootrApplicationDraft({ step: 1 });
  });

  document.querySelector("[data-verify-phone]")?.addEventListener("click", () => {
    saveShootrApplicationDraft({ data: { phoneVerified: true } });
    const note = document.querySelector("#phoneVerifyNote");
    if (note) note.textContent = "Mobile number verified.";
  });

  document.querySelector("[data-use-shootr-location]")?.addEventListener("click", () => {
    const areaInput = document.querySelector('[name="serviceArea"]');
    if (areaInput) areaInput.value = "Current area";
    saveShootrApplicationDraft({ data: { serviceArea: "Current area" } });
  });

  document.querySelector("[data-save-shootr-step]")?.addEventListener("click", (event) => {
    event.preventDefault();
    const form = document.querySelector("[data-shootr-step-form]");
    const step = Number(event.currentTarget.dataset.saveShootrStep);
    const nextStep = Number(event.currentTarget.dataset.nextShootrStep);
    const data = form ? collectShootrStepData(form) : {};
    if (step === 1 && (!data.ageConfirm || !isAdult(data.dob))) {
      const note = document.querySelector("#shootrStepNote");
      if (note) note.textContent = "You must be at least 18 to submit independently.";
      return;
    }
    if (form && !form.reportValidity()) return;
    saveShootrApplicationDraft({ step: nextStep, data });
    window.location.href = `/app/profile/become-a-shootr?step=${nextStep}`;
  });

  document.querySelector("[data-submit-shootr-application]")?.addEventListener("click", () => {
    const draft = loadShootrApplicationDraft();
    const data = draft.data || {};
    const requiredReady = data.displayName && data.legalName && data.dob && isAdult(data.dob) && data.phone && data.email && data.serviceArea && data.radius && data.setup && data.transportation && data.emergencyName && data.emergencyPhone && data.payoutReady;
    if (!requiredReady) {
      const note = document.querySelector("#shootrOnboardingNote");
      if (note) note.textContent = "Finish the required sections before submitting.";
      return;
    }
    store.shootrs.push({
      id: `shootr-${Date.now()}`,
      displayName: data.displayName,
      legalName: data.legalName,
      city: data.serviceArea,
      type: "shootr_go",
      onboardingStatus: "review_pending",
      identityReviewStatus: "identity_pending",
      profileReviewStatus: "portfolio_pending",
      availabilityStatus: "Away",
      serviceRadius: data.radius,
      transportation: data.transportation,
      phoneModel: data.phoneModel,
      optionalCameraEquipment: [data.cameraBody, data.lenses, data.lighting].filter(Boolean).join(", "),
      specialties: ["Photos"],
      badges: ["Application pending"],
      label: "Application pending",
      portfolio: [],
      scoreInputs: {},
    });
    localStorage.setItem(applicationStateKey, "review_pending");
    saveStore(store);
    track(store, "shootr_onboarding_completed", { city: data.serviceArea });
    localStorage.removeItem(shootrApplicationDraftKey);
    window.location.href = "/app/profile/shootr-status";
  });

  document.querySelectorAll("[data-referral]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.referral;
      const code = getReferralCode(type);
      const url = getReferralUrl(type);
      store.referrals = store.referrals || [];
      store.referrals.push({ type, code, createdAt: new Date().toISOString() });
      saveStore(store);
      const note = document.querySelector("#referralNote");
      if (navigator.share) {
      navigator.share({ title: "Shootrs", text: type === "shootr" ? "Become a Shootr." : "Be in the picture.", url });
        if (note) note.textContent = "Share sheet opened.";
        return;
      }
      navigator.clipboard?.writeText(url);
      if (note) note.textContent = "Invite link copied.";
    });
  });

  document.querySelector("[data-delete-account-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = document.querySelector("#deleteAccountNote");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.confirmation !== "DELETE") {
      if (note) note.textContent = "Type DELETE exactly to confirm account deletion.";
      return;
    }
    store.galleries = (store.galleries || []).map((gallery) => ({
      ...gallery,
      shareLinks: (gallery.shareLinks || []).map((link) => ({ ...link, revoked: true })),
    }));
    store.users = [];
    store.messages = [];
    store.notifications = [];
    store.referrals = [];
    store.analytics = [];
    store.supportCases = store.supportCases || [];
    store.supportCases.push({ id: `support-${Date.now()}`, topic: "Privacy or deletion", status: "received", deletionRequested: true, createdAt: new Date().toISOString() });
    saveStore(store);
    localStorage.removeItem(draftKey);
    localStorage.removeItem(shootrApplicationDraftKey);
    localStorage.removeItem(applicationStateKey);
    localStorage.removeItem(availabilityStateKey);
    localStorage.removeItem(householdsKey);
    localStorage.removeItem(dismissedStatusPillKey);
    localStorage.setItem("shootr-account-deletion-requested-at", new Date().toISOString());
    if (note) note.textContent = "Deletion request submitted. Personal data will be deleted or anonymized unless retention is required for payment, tax, fraud, safety, or legal reasons.";
    form.reset();
  });

  document.querySelector("[data-cancel-booking]")?.addEventListener("click", (event) => {
    const id = event.currentTarget.dataset.cancelBooking;
    const booking = store.bookings.find((item) => item.id === id);
    if (!booking) return;
    const updated = expireBooking(booking, "Customer cancelled from tracker before completion.");
    store.bookings = store.bookings.map((item) => (item.id === id ? updated : item));
    track(store, "booking_cancelled", { bookingId: id });
    saveStore(store);
    render();
  });
  const searchStatus = document.querySelector("[data-search-status]");
  if (searchStatus) {
    const messages = ["Ready to check availability", "Nearby results depend on your location", "Expand the search if nobody is close", "Tap to see nearby Shootrs"];
    let index = 0;
    window.setInterval(() => {
      index = (index + 1) % messages.length;
      searchStatus.textContent = messages[index];
    }, 1800);
  }

  document.querySelectorAll("[data-accept-booking]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const booking = store.bookings.find((item) => item.id === event.currentTarget.dataset.acceptBooking) || demoBooking;
      const updated = acceptBooking(booking, "demo-go-1");
      const exists = store.bookings.some((item) => item.id === updated.id);
      store.bookings = exists ? store.bookings.map((item) => (item.id === updated.id ? updated : item)) : [...store.bookings, updated];
      track(store, "request_accepted", { bookingId: updated.id });
      saveStore(store);
      document.querySelectorAll("#acceptNote").forEach((note) => {
        note.textContent = "It’s yours.";
      });
    });
  });

  document.querySelectorAll("[data-transition]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.transitionBooking || "demo-booking";
      const booking = store.bookings.find((item) => item.id === id) || (settings.demoMode && id === "demo-booking" ? demoBooking : null);
      if (!booking) return;
      const updated = transitionBooking(booking, button.dataset.transition);
      store.bookings = store.bookings.map((item) => (item.id === updated.id ? updated : item));
      saveStore(store);
      document.querySelector("#transitionNote").textContent = customerStatus(updated.status);
    });
  });

  document.querySelector("#availabilityForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    document.querySelector("#availabilityNote").textContent = "Availability saved.";
  });

  if (path.includes("/app/vault") || path.includes("/app/moments")) {
    canReviewBooking(demoBooking);
  }
}

function setupKeyboardNavHandling() {
  const setKeyboardVisible = (visible) => {
    document.documentElement.classList.toggle("keyboard-visible", visible);
    if (visible) {
      setTimeout(() => {
        const active = document.activeElement;
        if (active?.matches?.("input, textarea, select")) {
          active.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }, 80);
    }
  };

  const listen = (eventName, handler) => {
    try {
      const keyboard = globalThis.Capacitor?.Plugins?.Keyboard;
      if (!keyboard || typeof keyboard.addListener !== "function") return;
      const listener = keyboard.addListener(eventName, handler);
      if (listener && typeof listener.catch === "function") listener.catch(() => {});
    } catch {
      // Browser previews do not always expose the native keyboard plugin.
    }
  };

  listen("keyboardWillShow", () => setKeyboardVisible(true));
  listen("keyboardDidShow", () => setKeyboardVisible(true));
  listen("keyboardWillHide", () => setKeyboardVisible(false));
  listen("keyboardDidHide", () => setKeyboardVisible(false));

  document.addEventListener("focusin", (event) => {
    if (event.target?.matches?.("input, textarea, select")) setKeyboardVisible(true);
  });
  document.addEventListener("focusout", () => {
    setTimeout(() => {
      if (!document.activeElement?.matches?.("input, textarea, select")) setKeyboardVisible(false);
    }, 80);
  });
}

setupKeyboardNavHandling();
render();

const CACHE_NAME = "shootr-shell-v8";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./app/",
  "./app/book/",
  "./app/search/",
  "./app/matches/",
  "./app/bookings/",
  "./app/bookings/demo-booking/",
  "./app/bookings/demo-booking/track/",
  "./app/jobs/",
  "./app/jobs/demo-booking/",
  "./app/jobs/demo-booking/deliver/",
  "./app/moments/",
  "./app/moments/demo-booking/",
  "./app/profile/",
  "./app/profile/become-a-shootr/",
  "./app/profile/shootr-status/",
  "./app/profile/shootr-settings/",
  "./app/profile/portfolio/",
  "./app/profile/availability/",
  "./app/profile/earnings/",
  "./app/profile/payouts/",
  "./app/vault/",
  "./shootr/moments/",
  "./platform.html",
  "./styles.css?v=20",
  "./app.js?v=10",
  "./platform.js?v=8",
  "./manifest.webmanifest",
  "./assets/shootr-icon.svg",
  "./assets/hero-girls-night-iphone.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html"))),
  );
});

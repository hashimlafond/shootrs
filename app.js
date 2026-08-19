const menuButton = document.querySelector(".menu-button");
const pricingGrid = document.querySelector("[data-pricing]");
const installGuide = document.querySelector("#installGuide");
const installButton = document.querySelector("[data-install-guide]");
const appStoreButton = document.querySelector("[data-app-store]");

const packages = [
  { name: "Quick", duration: "15 minutes", price: "From $39" },
  { name: "Standard", duration: "30 minutes", price: "From $79" },
  { name: "Extended", duration: "60 minutes", price: "From $149" },
];

const config = window.SHOOTR_CONFIG || {};
const appStoreUrl = config.NEXT_PUBLIC_APP_STORE_URL || config.APP_STORE_URL || "";

if (pricingGrid) {
  pricingGrid.innerHTML = packages
    .map((item) => `<article><h3>${item.name}</h3><p>${item.duration}</p><strong>${item.price}</strong></article>`)
    .join("");
}

if (appStoreUrl && appStoreButton) {
  appStoreButton.href = appStoreUrl;
  appStoreButton.hidden = false;
  installButton?.setAttribute("hidden", "");
}

menuButton?.addEventListener("click", () => {
  document.querySelector(".site-header nav")?.classList.toggle("open");
});

installButton?.addEventListener("click", () => {
  const ua = navigator.userAgent || "";
  const isiOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;

  if (standalone) {
    installGuide.textContent = "Shootr is already installed on this device.";
    return;
  }

  if (isiOS) {
    installGuide.textContent = "On iPhone, tap Share, then Add to Home Screen.";
    return;
  }

  if (isAndroid) {
    installGuide.textContent = "On Android, open your browser menu and tap Install app or Add to Home screen.";
    return;
  }

  installGuide.textContent = "Open this page on your phone, then use your browser menu to add Shootr to your home screen.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

import { settings } from "../config/settings.js";
import { createRightsGrant } from "../types/models.js";

export function createGallery({ bookingId, customerId, shootrId, files = [], storageDays = settings.galleryStorageDays }) {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + storageDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return {
    id: `gallery-${bookingId}`,
    bookingId,
    customerId,
    shootrId,
    privacy: "private",
    rights: createRightsGrant(),
    portfolioUseAllowed: false,
    socialUseAllowed: false,
    platformMarketingUseAllowed: false,
    createdAt: createdAt.toISOString(),
    expiresAt,
    items: files.map((file, index) => ({
      id: `photo-${bookingId}-${index + 1}`,
      name: file.name,
      thumbnailUrl: file.thumbnailUrl,
      previewUrl: file.previewUrl,
      originalUrl: file.originalUrl,
      gpsStripped: true,
      favorite: false,
    })),
    shareLinks: [],
  };
}

export function createShareLink(gallery, { ttlHours = 24 } = {}) {
  return {
    id: `share-${Date.now()}`,
    galleryId: gallery.id,
    token: `mock-${Math.random().toString(16).slice(2)}`,
    revoked: false,
    expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
  };
}

export function isShareLinkExpired(link, now = new Date()) {
  return link.revoked || new Date(link.expiresAt) <= now;
}

export function canAccessGallery(gallery, actor) {
  if (!gallery || !actor) return false;
  return actor.role === "admin" || actor.id === gallery.customerId || actor.id === gallery.shootrId || Boolean(actor.validShareLink);
}

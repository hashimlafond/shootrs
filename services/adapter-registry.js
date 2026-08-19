import { settings } from "../config/settings.js";

export const adapters = {
  auth: settings.adapters.auth,
  database: settings.adapters.database,
  objectStorage: settings.adapters.objectStorage,
  imageProcessing: settings.adapters.imageProcessing,
  maps: settings.adapters.maps,
  geolocation: settings.adapters.geolocation,
  eta: settings.adapters.eta,
  payments: settings.adapters.payments,
  sms: settings.adapters.sms,
  email: settings.adapters.email,
  push: settings.adapters.push,
  analytics: settings.adapters.analytics,
  identityVerification: settings.adapters.identityVerification,
};

export function getAdapter(name) {
  return adapters[name] || "mock";
}

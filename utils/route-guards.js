import { roles } from "../types/models.js";

export const privateRoutePrefixes = {
  "/app": roles.SUBJECT,
  "/shootr": roles.SHOOTR,
  "/business": roles.BUSINESS,
  "/agency": roles.AGENCY,
  "/admin": roles.ADMIN,
  "/internal": roles.ADMIN,
};

export const publicRoutes = ["/shootr/onboarding"];

export function requiredRoleForPath(pathname) {
  if (publicRoutes.includes(pathname)) return null;
  const match = Object.entries(privateRoutePrefixes).find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? match[1] : null;
}

export function getSessionRole() {
  return localStorage.getItem("shootr-active-role") || null;
}

export function setSessionRole(role) {
  localStorage.setItem("shootr-active-role", role);
}

export function canAccess(pathname) {
  const requiredRole = requiredRoleForPath(pathname);
  return !requiredRole || getSessionRole() === requiredRole;
}

export function userHasRole(user, role) {
  return Boolean(user?.roles?.includes(role));
}

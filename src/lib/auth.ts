// Simple session store using cookies (client-side persisted via API)
// We avoid NextAuth complexity for this single-tenant admin app.

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "bendahara" | "pengelola";
}

const SESSION_KEY = "an_nahl_session";
const SESSION_COOKIE = "an_nahl_session_token";

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + SESSION_COOKIE + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSessionCookie(token: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
    token
  )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
}

export function saveSessionLocal(user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getLocalSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearLocalSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

// Token encoding helper (base64 of JSON payload — sufficient for single-tenant admin tool)
export function encodeToken(payload: SessionUser): string {
  if (typeof window === "undefined") {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeToken(token: string): SessionUser | null {
  try {
    if (typeof window === "undefined") {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      return JSON.parse(decoded) as SessionUser;
    }
    const decoded = decodeURIComponent(escape(atob(token)));
    return JSON.parse(decoded) as SessionUser;
  } catch {
    return null;
  }
}

export const ROLE_LABELS: Record<SessionUser["role"], string> = {
  admin: "Administrator",
  bendahara: "Bendahara",
  pengelola: "Pengelola",
};

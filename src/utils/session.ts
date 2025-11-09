import { createCookie } from "react-router";
import type { TokenResponse } from "./auth.js";

// Cookie and Session Configuration
const COOKIE_CONFIG = {
  // Maximum lifetime of the session cookie (24 hours)
  // This is an upper limit - the actual session expiration is based on the token expiration
  SESSION_MAX_AGE: 24 * 60 * 60, // in seconds

  // Time before token expiration when we should attempt to refresh (5 minutes)
  REFRESH_WINDOW: 5 * 60 * 1000, // in milliseconds

  // Time allowed for completing the login flow (1 hour)
  // Used for the state cookie in the OAuth flow
  AUTH_STATE_MAX_AGE: 60 * 60, // in seconds
} as const;

// Session cookie configuration
const SESSION_SECRET = process.env.SESSION_SECRET || "default-secret-key-for-dev";

export const sessionCookie = createCookie("__session", {
  secrets: [SESSION_SECRET],
  sameSite: "lax",
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: COOKIE_CONFIG.SESSION_MAX_AGE,
});

export interface SessionData {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp in milliseconds when the access token expires
}

// Create session data from token response
export function createSessionData(tokens: TokenResponse, refreshTokenDefault?: string): SessionData {
  // Calculate when the access token will expire
  const expiresAt = Date.now() + (tokens.expires_in * 1000);
  const expiresInMinutes = Math.round(tokens.expires_in / 60);

  // Ensure we have a refresh token
  const refreshToken = tokens.refresh_token || refreshTokenDefault;
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const sessionData = {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    refreshToken,
    expiresAt,
  };

  console.log('Created session data:', {
    accessToken: '(present)',
    idToken: '(present)',
    refreshToken: '(present)',
    expiresAt,
    expiresIn: `${expiresInMinutes} minutes`,
  });

  return sessionData;
}

// Validate session data structure (not expiration)
function hasValidSessionFields(session: SessionData | null): session is SessionData {
  if (!session) {
    console.log('Session validation failed: session is null');
    return false;
  }

  const hasRequiredFields =
    typeof session.accessToken === "string" &&
    typeof session.idToken === "string" &&
    typeof session.refreshToken === "string" &&
    typeof session.expiresAt === "number";

  if (!hasRequiredFields) {
    console.log('Session validation failed: missing required fields', {
      hasAccessToken: typeof session.accessToken === "string",
      hasIdToken: typeof session.idToken === "string",
      hasRefreshToken: typeof session.refreshToken === "string",
      hasExpiresAt: typeof session.expiresAt === "number",
    });
  }

  return hasRequiredFields;
}

// Check if session is expired but still within the cookie max age
function isRefreshable(session: SessionData): boolean {
  const now = Date.now();
  const maxAge = now - (COOKIE_CONFIG.SESSION_MAX_AGE * 1000);
  return session.expiresAt > maxAge;
}

// Validate session data
export function isValidSession(session: SessionData | null): session is SessionData {
  if (!hasValidSessionFields(session)) {
    return false;
  }

  const now = Date.now();
  const isNotExpired = session.expiresAt > now;

  if (!isNotExpired) {
    const expiredMinutesAgo = Math.round((now - session.expiresAt) / 1000 / 60);
    console.log('Session access token is expired', {
      expiresAt: session.expiresAt,
      now,
      expiredAgo: `${expiredMinutesAgo} minutes ago`,
    });
  }

  return isNotExpired;
}

// Check if session needs refresh
export function sessionNeedsRefresh(session: SessionData | null): boolean {
  if (!session) return false;

  const now = Date.now();
  const timeUntilExpiry = session.expiresAt - now;
  return (timeUntilExpiry <= COOKIE_CONFIG.REFRESH_WINDOW);
}

// Parse session from cookie, including expired but refreshable sessions
export async function getSession(request: Request): Promise<SessionData | null> {
  const cookie = request.headers.get("Cookie");
  const data = await sessionCookie.parse(cookie);

  if (!data) {
    console.log('No session data found in cookie');
    return null;
  }

  // First check if we have valid session fields
  if (!hasValidSessionFields(data)) {
    return null;
  }

  // If session is expired but still refreshable, return it
  if (!isValidSession(data) && isRefreshable(data)) {
    console.log('Session expired but still refreshable');
    return data;
  }

  // Return valid session or null
  return isValidSession(data) ? data : null;
}

// Create session cookie header
export async function createSessionHeader(session: SessionData | null): Promise<string> {
  if (!session) {
    console.log('Creating cookie header for session deletion');
    return await sessionCookie.serialize("", {
      maxAge: 0, // Expire immediately
    });
  }
  return await sessionCookie.serialize(session);
}

// Export configuration for use in other files
export { COOKIE_CONFIG };

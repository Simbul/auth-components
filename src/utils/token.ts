import type { TokenResponse } from "./auth.js";

// Constants
const REFRESH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Represents the user information contained in a JWT token payload.
 * Based on Auth0's standard JWT claims.
 */
export interface JwtUser {
  /** User identifier (subject) */
  sub: string;
  /** User's full name */
  name?: string;
  /** User's nickname or username */
  nickname?: string;
  /** URL to user's profile picture */
  picture?: string;
  /** User's email address */
  email?: string;
  /** Whether the email has been verified */
  email_verified?: boolean;
  /** Issued at timestamp (seconds since epoch) */
  iat?: number;
  /** Expiration timestamp (seconds since epoch) */
  exp?: number;
  /** Any additional claims */
  [key: string]: any;
}

/**
 * Utility function to parse a JWT token and return its payload.
 * Used primarily for extracting user information from the id_token.
 */
export function parseJwt(token: string): { [key: string]: any } | null {
  try {
    // Check if token is encrypted (has 'enc' in header)
    const header = JSON.parse(atob(token.split('.')[0]));
    if (header.enc) {
      console.log('Token is encrypted, cannot parse directly');
      return null;
    }

    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.log('Invalid token format - no second part:', token);
      return null;
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
}

// Check if a token needs refresh (within 5 minutes of expiry)
export function needsRefresh(token: string): boolean {
  // For encrypted tokens, we'll use the session expiration time instead
  console.log('Checking if token needs refresh');
  const payload = parseJwt(token);
  if (!payload?.exp) {
    // For encrypted tokens, we'll use the session expiration time
    console.log('Token is encrypted or has no expiration, using session expiration');
    return false; // Let the session expiration handle this case
  }

  const expirationMs = payload.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const needsRefresh = now + REFRESH_WINDOW_MS >= expirationMs;
  console.log('Token refresh check:', { now, expirationMs, needsRefresh });

  return needsRefresh;
}

// Validate token format and expiration
export function isValidToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  // For encrypted tokens, just check if it's a non-empty string
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const header = JSON.parse(atob(parts[0]));
    if (header.enc) {
      console.log('Token is encrypted, considering valid');
      return true;
    }
  } catch (e) {
    return false;
  }

  const payload = parseJwt(token);
  if (!payload?.exp) return false;

  return Date.now() < payload.exp * 1000;
}

// Get token expiration time in milliseconds
export function getTokenExpirationTime(token: string): number | null {
  const payload = parseJwt(token);
  return payload?.exp ? payload.exp * 1000 : null;
}

/**
 * Extracts user information from a JWT token (typically the id_token).
 * Returns a properly typed JwtUser object containing the user's claims.
 *
 * @param token - The JWT token string to decode
 * @returns JwtUser object with user information, or null if decoding fails
 *
 * @example
 * ```typescript
 * const user = getUserFromJwt(session.idToken);
 * if (user) {
 *   console.log(user.name, user.email, user.picture);
 * }
 * ```
 */
export function getUserFromJwt(token: string): JwtUser | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error('Invalid JWT format - no payload section');
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtUser;
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

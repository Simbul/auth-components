import type { SessionData } from "./session.js";

// Helper to get environment variables that works in both Node.js and browser/Vite
function getEnv(name: string): string | undefined {
  // Check import.meta.env first (Vite/browser)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name];
  }
  // Fall back to process.env (Node.js/server)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  return undefined;
}

// Helper to get the current mode/environment
function getMode(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.MODE || 'development';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || 'development';
  }
  return 'development';
}

// Check if we should skip auth (development mode by default, unless explicitly disabled)
export function shouldSkipAuth(): boolean {
  const nodeEnv = getMode();
  const skipAuth = getEnv("SKIP_AUTH");

  // In development, skip auth by default unless explicitly disabled
  if (nodeEnv === "development") {
    return skipAuth !== "false";
  }

  // In other environments, only skip if explicitly enabled
  return skipAuth === "true";
}

// Create a mock JWT with fake user data (not cryptographically signed)
function createMockJwt(): string {
  const payload = {
    sub: "dev|123456789",
    name: "Dev User",
    nickname: "devuser",
    picture: "/mock-avatar.svg",
    email: "dev@example.com",
    email_verified: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
  };

  const header = { alg: "none", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  return `${encodedHeader}.${encodedPayload}.mock-signature`;
}

// Create a permanent dev session (never expires in practice)
export function createDevSession(): SessionData {
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  return {
    accessToken: "dev-access-token",
    idToken: createMockJwt(),
    refreshToken: "dev-refresh-token",
    expiresAt: Date.now() + oneYear,
  };
}

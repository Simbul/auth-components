import type { SessionData } from "./session";

// Check if we should skip auth (development mode by default, unless explicitly disabled)
export function shouldSkipAuth(): boolean {
  const nodeEnv = process.env.NODE_ENV;
  const skipAuth = process.env.SKIP_AUTH;

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
    email: "dev@example.com",
    picture: "/mock-avatar.svg",
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

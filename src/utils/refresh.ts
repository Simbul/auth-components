import { getAuth0Config, refreshTokens } from "./auth.js";
import { createSessionData, createSessionHeader, sessionNeedsRefresh } from "./session.js";
import type { SessionData } from "./session.js";

// Refresh tokens if needed and return updated session data
export async function refreshSessionIfNeeded(
  request: Request,
  session: SessionData | null
): Promise<{
  session: SessionData | null;
  headers?: { "Set-Cookie": string };
}> {
  const now = Date.now();
  console.log('Checking if session needs refresh:', {
    hasSession: !!session,
    expiresAt: session?.expiresAt,
    now,
    timeUntilExpiry: session?.expiresAt ? session.expiresAt - now : null
  });

  // If no session or doesn't need refresh, return as is
  if (!session || !sessionNeedsRefresh(session)) {
    console.log('No refresh needed');
    return { session };
  }

  console.log('Session needs refresh, attempting refresh...');

  try {
    // Get Auth0 configuration
    const config = getAuth0Config(request);

    // Refresh tokens
    const tokens = await refreshTokens(config, session.refreshToken);
    console.log('Tokens refreshed successfully');

    // Create new session data with the existing refresh token as fallback
    const newSession = createSessionData(tokens, session.refreshToken);
    console.log('Created new session with refreshed tokens');

    // Create session cookie header
    const sessionHeader = await createSessionHeader(newSession);

    return {
      session: newSession,
      headers: {
        "Set-Cookie": sessionHeader,
      },
    };
  } catch (error) {
    console.error("Token refresh failed:", error);
    // On refresh failure, clear the session
    return {
      session: null,
      headers: {
        "Set-Cookie": await createSessionHeader(null),
      },
    };
  }
}

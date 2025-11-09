import { getSession } from "./session.js";
import { refreshSessionIfNeeded } from "./refresh.js";
import { shouldSkipAuth, createDevSession } from "./dev-auth.js";
import type { SessionData } from "./session.js";

export interface AuthLoaderData {
  session: SessionData | null;
  headers?: { "Set-Cookie": string };
}

/**
 * Helper function to get auth loader data.
 * Handles the complete Auth0 authentication flow including:
 * - Dev mode bypass
 * - Session retrieval
 * - Automatic token refresh
 *
 * Use this in your root loader to eliminate Auth0 boilerplate.
 *
 * @example
 * ```typescript
 * export async function loader({ request }: Route.LoaderFunctionArgs) {
 *   const authData = await getAuthLoaderData(request);
 *   return {
 *     ...authData,
 *     isPreview: url.hostname.includes('deploy-preview-'), // Your custom data
 *   };
 * }
 * ```
 */
export async function getAuthLoaderData(request: Request): Promise<AuthLoaderData> {
  // Development mode: skip Auth0 and use mock session
  if (shouldSkipAuth()) {
    return {
      session: createDevSession(),
    };
  }

  // Production mode: handle real Auth0 authentication
  const currentSession = await getSession(request);
  return await refreshSessionIfNeeded(request, currentSession);
}

import { getSession, createSessionHeader } from "./session.js";
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
 * IMPORTANT: You must use React Router's `data` utility to properly pass headers.
 * Simply spreading `authData` or returning `{ ...authData }` will NOT work correctly.
 *
 * @example
 * ```typescript
 * import { data } from "react-router";
 *
 * export async function loader({ request }: Route.LoaderFunctionArgs) {
 *   const { session, headers } = await getAuthLoaderData(request);
 *   const url = new URL(request.url);
 *   return data(
 *     {
 *       session,
 *       isPreview: url.hostname.includes('deploy-preview-'), // Your custom data
 *     },
 *     { headers }
 *   );
 * }
 * ```
 */
export async function getAuthLoaderData(request: Request): Promise<AuthLoaderData> {
  // Development mode: skip Auth0 and use mock session
  if (shouldSkipAuth()) {
    const devSession = createDevSession();
    return {
      session: devSession,
      headers: {
        "Set-Cookie": await createSessionHeader(devSession),
      },
    };
  }

  // Production mode: handle real Auth0 authentication
  const currentSession = await getSession(request);
  return await refreshSessionIfNeeded(request, currentSession);
}

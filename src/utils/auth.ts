import { createCookie } from "react-router";
import { COOKIE_CONFIG } from "./session.js";

// Auth0 configuration and types
interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  audience?: string;
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// State cookie for CSRF protection
const stateCookie = createCookie("__auth_state", {
  maxAge: COOKIE_CONFIG.AUTH_STATE_MAX_AGE,
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax",
  path: "/",
});

// Environment variable validation
function getRequiredEnvVar(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Get the base URL for the application from the request
// This works at runtime in Netlify Functions where build-time env vars aren't available
function getBaseUrl(request: Request): string {
  // In Netlify Functions (runtime), we can't rely on build-time env vars like DEPLOY_PRIME_URL
  // Instead, derive the base URL from the request origin
  const url = new URL(request.url);
  const origin = url.origin; // e.g., https://deploy-preview-1--site.netlify.app

  return origin;
}

// Auth0 configuration using environment variables
// Requires request parameter to derive the correct callback URL for the current deploy
export function getAuth0Config(request: Request): Auth0Config {
  return {
    domain: getRequiredEnvVar("AUTH0_DOMAIN"),
    clientId: getRequiredEnvVar("AUTH0_CLIENT_ID"),
    clientSecret: getRequiredEnvVar("AUTH0_CLIENT_SECRET"),
    callbackUrl: new URL("/auth/callback", getBaseUrl(request)).toString(),
    audience: import.meta.env.AUTH0_AUDIENCE,
  };
}

// Helper function to build the authorization URL and store state
export async function createAuthorizationRequest(config: Auth0Config): Promise<{
  url: string;
  cookieHeader: string;
}> {
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    scope: "openid profile email offline_access",
    state,
  });

  if (config.audience) {
    params.append("audience", config.audience);
  }

  const url = `https://${config.domain}/authorize?${params.toString()}`;
  const cookieHeader = await stateCookie.serialize(state);

  return { url, cookieHeader };
}

// Helper function to verify state parameter
export async function verifyState(request: Request, state: string): Promise<boolean> {
  const cookie = request.headers.get("Cookie");
  const savedState = await stateCookie.parse(cookie);
  return savedState === state;
}

// Helper function to exchange code for tokens
export async function exchangeCodeForTokens(
  config: Auth0Config,
  code: string
): Promise<TokenResponse> {
  const response = await fetch(`https://${config.domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens = await response.json();
  console.log('Auth0 token exchange response:', {
    access_token: tokens.access_token ? '(present)' : '(missing)',
    id_token: tokens.id_token ? '(present)' : '(missing)',
    refresh_token: tokens.refresh_token ? '(present)' : '(missing)',
    expires_in: tokens.expires_in,
    token_type: tokens.token_type,
    scope: tokens.scope,
  });
  return tokens;
}

// Helper function to build the logout URL
export function getLogoutUrl(config: Auth0Config, returnTo: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    returnTo,
  });

  return `https://${config.domain}/v2/logout?${params.toString()}`;
}

// Helper function to refresh tokens
export async function refreshTokens(
  config: Auth0Config,
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch(`https://${config.domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new Error(`Token refresh failed: ${error}`);
  }

  const tokens = await response.json();
  console.log('Auth0 token refresh response:', {
    access_token: tokens.access_token ? '(present)' : '(missing)',
    id_token: tokens.id_token ? '(present)' : '(missing)',
    refresh_token: tokens.refresh_token ? '(present)' : '(missing)',
    expires_in: tokens.expires_in,
    token_type: tokens.token_type,
    scope: tokens.scope,
  });
  return tokens;
}

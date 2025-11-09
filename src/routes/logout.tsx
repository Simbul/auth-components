import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getAuth0Config, getLogoutUrl } from "../utils/auth.js";
import { sessionCookie } from "../utils/session.js";
import { shouldSkipAuth } from "../utils/dev-auth.js";

export async function loader({ request }: LoaderFunctionArgs) {
  return handleLogout(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return handleLogout(request);
}

async function handleLogout(request: Request) {
  // Get the return URL from the request or default to home
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";

  // In dev mode with skip auth, logout does nothing (just redirects back)
  if (shouldSkipAuth()) {
    return redirect(returnTo);
  }

  // Production: clear session and redirect to Auth0 logout
  const config = getAuth0Config(request);
  const logoutUrl = getLogoutUrl(config, new URL(returnTo, config.callbackUrl).toString());

  const sessionHeader = await sessionCookie.serialize("", {
    maxAge: 0, // Expire immediately
  });

  return redirect(logoutUrl, {
    headers: {
      "Set-Cookie": sessionHeader,
    },
  });
}

// This component will never be rendered as the loader/action always redirects
export default function Logout() {
  return null;
}

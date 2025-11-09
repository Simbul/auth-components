import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getAuth0Config, exchangeCodeForTokens, verifyState } from "../utils/auth.js";
import { createSessionData, createSessionHeader } from "../utils/session.js";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Validate the callback parameters
  if (!code || !state) {
    throw new Error("Invalid callback parameters");
  }

  // Verify the state parameter to prevent CSRF
  const isValidState = await verifyState(request, state);
  if (!isValidState) {
    console.error("Invalid state parameter");
    return redirect("/login?error=invalid_state");
  }

  try {
    // Exchange the code for tokens
    const config = getAuth0Config(request);
    const tokens = await exchangeCodeForTokens(config, code);

    // Create and store the session
    const session = createSessionData(tokens);
    const sessionHeader = await createSessionHeader(session);

    // Redirect to home with the session cookie
    return redirect("/", {
      headers: {
        "Set-Cookie": sessionHeader,
      },
    });
  } catch (error) {
    console.error("Auth callback error:", error);
    return redirect("/login?error=auth_callback_failed");
  }
}

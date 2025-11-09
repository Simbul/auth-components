import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getAuth0Config, createAuthorizationRequest } from "../utils/auth";
import { getSession } from "../utils/session";

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is already authenticated
  const session = await getSession(request);
  if (session) {
    return redirect("/");
  }

  // Get Auth0 configuration and build the authorization URL with state
  const config = getAuth0Config(request);
  const { url, cookieHeader } = await createAuthorizationRequest(config);

  // Redirect to Auth0 login with state cookie
  return redirect(url, {
    headers: {
      "Set-Cookie": cookieHeader,
    },
  });
}

// This component will never be rendered as the loader always redirects
export default function Login() {
  return null;
}

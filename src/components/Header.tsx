import { Link, useRouteLoaderData } from "react-router";
import type { SessionData } from "../utils/session.js";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

export interface HeaderProps {
  appName?: string;
  showPreviewBadge?: boolean;
  className?: string;
  buttonClassName?: string;
  avatarClassName?: string;
}

export interface RootLoaderData {
  session: SessionData | null;
  isPreview?: boolean;
}

export default function Header({
  appName = "App",
  showPreviewBadge = false,
  className = "navbar bg-base-100 shadow-md",
  buttonClassName = "btn btn-ghost",
}: HeaderProps) {
  const data = useRouteLoaderData("root") as RootLoaderData | null;
  const session = data?.session ?? null;
  const isPreview = showPreviewBadge && (data?.isPreview ?? false);
  const user = session?.idToken ? decodeJwt(session.idToken) : null;

  return (
    <header className={className}>
      <div className="flex-1 flex items-center gap-3">
        <Link to="/" className="btn btn-ghost text-xl">{appName}</Link>
        {isPreview && (
          <span className="badge badge-warning badge-lg font-semibold">Preview</span>
        )}
      </div>
      <div className="flex-none gap-2 items-center">
        {session ? (
          <div className="flex items-center gap-2">
            {user?.picture && (
              <div className="avatar">
                <div className="w-8 rounded-full">
                  <img src={user.picture} alt="User avatar" />
                </div>
              </div>
            )}
            <form action="/logout" method="post">
              <button type="submit" className={buttonClassName}>
                Logout
              </button>
            </form>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

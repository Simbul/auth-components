# @simbul/auth-components

Shared Auth0 authentication components and utilities for React Router applications.

## Features

- 🔐 Complete Auth0 OAuth2 Authorization Code Flow implementation
- 🔄 Automatic token refresh
- 🛡️ CSRF protection
- 🍪 Secure HTTP-only cookie session management
- 🎨 Customizable Header component
- 🧪 Development mode bypass for local testing

## Requirements

**This package requires (peer dependencies):**
- **React Router v7+** - Uses React Router's server-side rendering and cookie utilities
- **React 19+** - Built for modern React
- **@react-router/node v7+** - For server-side cookie management
- **DaisyUI v5+** - Header component uses DaisyUI classes for styling
- **Tailwind CSS v4+** - Required by DaisyUI and for utility classes
- **Auth0 account** - For OAuth2 authentication

> **What are peer dependencies?** Peer dependencies are packages that this package expects your app to already have installed. Instead of bundling its own copies of React, React Router, DaisyUI, and Tailwind (which would cause conflicts), this package uses the versions you've already installed in your app. When you install this package, npm will warn you if any peer dependencies are missing, and you'll need to install them separately.

**Architecture:**
- Designed for React Router v7 SSR applications (not Remix, Next.js, or client-only apps)
- Requires server-side rendering capabilities for secure session management
- Uses HTTP-only cookies (not localStorage) for token storage

## Installation

### 1. Install the package

**For local package (within monorepo):**
```bash
npm install
```

**For GitHub repository:**
```bash
npm install github:simbul/auth-components#v1.0.3
```

**Ensure peer dependencies are installed:**

If your app doesn't already have the peer dependencies, install them:

```bash
npm install react@^19.0.0 react-router@^7.0.0 @react-router/node@^7.0.0 daisyui@^5.0.0 tailwindcss@^4.0.0
```

Most React Router v7 apps already have these installed. npm will warn you if any are missing.

### 2. Run the setup script

This will automatically create the required route files in your `app/routes/` directory:

**For local package:**
```bash
node packages/auth-components/bin/setup.js
```

**For installed package:**
```bash
npx auth-components-setup
```

**What it creates:**
- `app/routes/login.tsx` - Login route
- `app/routes/logout.tsx` - Logout route
- `app/routes/auth.callback.tsx` - OAuth callback route

### 3. Add routes to your config

Add these routes to your `app/routes.ts`:

```typescript
export default [
  {
    path: "login",
    file: "routes/login.tsx",
  },
  {
    path: "logout",
    file: "routes/logout.tsx",
  },
  {
    path: "auth/callback",
    file: "routes/auth.callback.tsx",
  },
  // ... your other routes
] satisfies RouteConfig;
```

## Usage

### 1. Set up your root loader

```typescript
import { getAuthLoaderData } from "@simbul/auth-components";

export async function loader({ request }: Route.LoaderFunctionArgs) {
  const authData = await getAuthLoaderData(request);

  return {
    ...authData,
    // Add any additional app-specific data here
  };
}
```

This single helper handles:
- ✅ Development mode bypass (uses mock session when `SKIP_AUTH=true`)
- ✅ Session retrieval from cookies
- ✅ Automatic token refresh (when tokens expire within 5 minutes)
- ✅ Returns `{ session, headers }` for you

### 2. Add the Header component

```typescript
import { Header } from "@simbul/auth-components";

export default function Root() {
  return (
    <div>
      <Header appName="My App" showPreviewBadge={true} />
      {/* Your app content */}
    </div>
  );
}
```

### 3. Configure environment variables

```bash
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=optional_api_identifier
SESSION_SECRET=your_secret_key_for_cookies
NODE_ENV=production
SKIP_AUTH=false  # Set to true to skip Auth0 in development
```

## API

### Components

- **`Header`** - Customizable header with login/logout functionality
  - **Default styling:** Uses DaisyUI classes (`navbar`, `btn`, `badge`, etc.) for out-of-the-box styling
  - **Customizable:** Override styles via props or use your own CSS framework
  - **Props:**
    - `appName` (string) - Application name shown in header
    - `showPreviewBadge` (boolean) - Show preview badge for deploy previews
    - `className` (string) - Override header container classes
    - `buttonClassName` (string) - Override button classes
    - `avatarClassName` (string) - Override avatar classes

### Loader Helper

- **`getAuthLoaderData(request)`** - ⭐ **Primary API** - Use this in your root loader
  - Handles complete Auth0 flow (dev mode, session, token refresh)
  - Returns `{ session: SessionData | null, headers?: { "Set-Cookie": string } }`

### Advanced Utils (Lower-level)

You typically won't need these if using `getAuthLoaderData`, but they're available for custom implementations:

- `getAuth0Config(request)` - Get Auth0 configuration
- `getSession(request)` - Get current session from cookie
- `refreshSessionIfNeeded(request, session)` - Auto-refresh tokens
- `shouldSkipAuth()` - Check if auth should be skipped (dev mode)
- `createDevSession()` - Create mock session for development

### Routes

- `login` - Initiates OAuth flow
- `logout` - Clears session and logs out
- `callback` - Handles OAuth callback

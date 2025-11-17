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

```bash
npm install github:simbul/auth-components#v1.1.0
```

**Ensure peer dependencies are installed:**

If your app doesn't already have the peer dependencies, install them:

```bash
npm install react@^19.0.0 react-router@^7.0.0 @react-router/node@^7.0.0 daisyui@^5.0.0 tailwindcss@^4.0.0
```

Most React Router v7 apps already have these installed. npm will warn you if any are missing.

### 2. Run the setup script

This will automatically create the required route files in your `app/routes/` directory:

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

### 4. Configure Tailwind CSS

**Important:** Tailwind scans files at build time to determine which classes to include in the final stylesheet. If classes are only used in external libraries (like `@simbul/auth-components`), Tailwind won't include them unless you tell it to scan those files.

Add this to your `app.css` (or main CSS file) to ensure the Header component is properly styled:

```css
@source '../node_modules/@simbul/auth-components/src';
```

Alternatively, if using a `tailwind.config.js` file, you can add the library path to the `content` array:

```javascript
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './node_modules/@simbul/auth-components/src/**/*.{js,jsx,ts,tsx}',
  ],
  // ... rest of your config
}
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

#### ⚠️ Important for Netlify deployments

When deploying to Netlify, neither `MODE` nor `NODE_ENV` are available at runtime (only at build time). This means the package cannot automatically detect the production environment.

**You MUST explicitly set `SKIP_AUTH=false` in your Netlify production environment variables** to ensure authentication is enabled in production. Without this, authentication will be bypassed and your app will use mock sessions.

Set this in your Netlify dashboard under Site settings → Environment variables, or add to your `netlify.toml`:

```toml
[context.production.environment]
SKIP_AUTH = "false"
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
- **`getUserFromJwt(token)`** - Extract typed user information from a JWT token
  - **Parameters:**
    - `token` (string) - The JWT token (typically `session.idToken`)
  - **Returns:** `JwtUser | null` - User information object or null if decoding fails
  - **Example:**
    ```typescript
    import { getUserFromJwt, type JwtUser } from "@simbul/auth-components";

    const user = getUserFromJwt(session.idToken);
    if (user) {
      console.log(user.name, user.email, user.picture);
    }
    ```
  - **JwtUser interface:**
    ```typescript
    interface JwtUser {
      sub: string;           // User ID
      name?: string;         // Full name
      nickname?: string;     // Username/nickname
      picture?: string;      // Profile picture URL
      email?: string;        // Email address
      email_verified?: boolean;
      iat?: number;          // Issued at (seconds)
      exp?: number;          // Expiration (seconds)
      [key: string]: any;    // Additional claims
    }
    ```

### Routes

- `login` - Initiates OAuth flow
- `logout` - Clears session and logs out
- `callback` - Handles OAuth callback

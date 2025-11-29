# CLAUDE.md - AI Assistant Guide for @simbul/auth-components

## Project Overview

**Package Name:** `@simbul/auth-components`
**Purpose:** Auth0 authentication components and utilities for React Router v7 applications with server-side rendering
**License:** MIT
**Repository:** https://github.com/simbul/auth-components

This is a standalone npm package that provides:
- Complete Auth0 OAuth2 Authorization Code Flow implementation
- Automatic token refresh mechanism
- CSRF protection via state parameter
- Secure HTTP-only cookie session management
- Customizable UI components (Header)
- Development mode bypass for local testing

### Target Audience
React Router v7+ applications requiring SSR-based authentication (not Remix, Next.js, or client-only apps).

### Key Dependencies
- **React 19+** - Modern React features
- **React Router v7+** - SSR and routing
- **@react-router/node v7+** - Server-side cookie management
- **DaisyUI v5+** - UI component styling
- **Tailwind CSS v4+** - Utility classes
- **TypeScript 5+** - Type safety

---

## Architecture & Design Principles

### 1. Server-Side Session Management
- **HTTP-only cookies** for token storage (not localStorage)
- Session cookie name: `__session`
- State cookie name: `__auth_state` (CSRF protection)
- Cookie configuration in `src/utils/session.ts`

### 2. Token Lifecycle
- **Session Max Age:** 7 days (default, configurable via `SESSION_MAX_AGE_DAYS` env var)
- **Refresh Window:** 5 minutes before expiration
- **Auth State Max Age:** 1 hour (OAuth flow timeout)
- Automatic refresh handled in loader via `getAuthLoaderData()`

### 3. Development Mode
- Environment variable `SKIP_AUTH` controls auth bypass
- In development: auth skipped by default unless `SKIP_AUTH=false`
- In production: auth required unless `SKIP_AUTH=true`
- Mock session created with fake JWT for local testing

### 4. Type Safety
- Full TypeScript implementation
- Strict mode enabled in `tsconfig.json`
- Compiled output: ES2022 modules with Node16 resolution
- Declaration files generated for consumers

### 5. Module Structure
The package uses ESM with explicit `.js` extensions in imports (per Node16 module resolution):
```typescript
// Example from src/index.ts
export * from "./utils/index.js";
export * from "./components/index.js";
export * from "./routes/index.js";
```

---

## Directory Structure

```
auth-components/
├── src/                        # Source code
│   ├── components/             # React components
│   │   ├── Header.tsx         # Main header component with auth UI
│   │   └── index.ts           # Component exports
│   ├── routes/                # OAuth flow route handlers
│   │   ├── login.tsx          # Initiates OAuth flow
│   │   ├── logout.tsx         # Clears session and logs out
│   │   ├── callback.tsx       # Handles OAuth callback
│   │   └── index.ts           # Route exports
│   ├── utils/                 # Core utilities
│   │   ├── auth.ts            # Auth0 API interactions
│   │   ├── session.ts         # Session/cookie management
│   │   ├── refresh.ts         # Token refresh logic
│   │   ├── token.ts           # JWT parsing utilities
│   │   ├── dev-auth.ts        # Development mode helpers
│   │   ├── loader.ts          # Primary API: getAuthLoaderData()
│   │   └── index.ts           # Utility exports
│   └── index.ts               # Package entry point
├── bin/                       # CLI scripts
│   └── setup.js              # npx auth-components-setup
├── dist/                      # Compiled output (generated)
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # User documentation
└── CLAUDE.md                 # This file
```

---

## Key Components & Modules

### Primary API (`src/utils/loader.ts`)

**`getAuthLoaderData(request): Promise<AuthLoaderData>`**

This is the main entry point for authentication. Use in your root loader.

**What it does:**
1. Checks if auth should be skipped (dev mode)
2. Returns mock session if in dev mode
3. Gets current session from cookie
4. Automatically refreshes tokens if needed
5. Returns `{ session, headers }` for the response

**Usage:**
```typescript
export async function loader({ request }: Route.LoaderFunctionArgs) {
  const authData = await getAuthLoaderData(request);
  return {
    ...authData,
    // Add app-specific data
  };
}
```

### Authentication Flow (`src/utils/auth.ts`)

**Key Functions:**
- `getAuth0Config(request)` - Builds Auth0 config from env vars
- `createAuthorizationRequest(config)` - Generates OAuth URL + state cookie
- `verifyState(request, state)` - CSRF protection via state parameter
- `exchangeCodeForTokens(config, code)` - Exchanges auth code for tokens
- `refreshTokens(config, refreshToken)` - Refreshes expired tokens
- `getLogoutUrl(config, returnTo)` - Builds Auth0 logout URL

**Environment Variables:**
```bash
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=optional_api_identifier  # Optional
SESSION_SECRET=your_secret_key_for_cookies
NODE_ENV=production
SKIP_AUTH=false                         # Set to true to bypass auth
SESSION_MAX_AGE_DAYS=7                  # Optional, default is 7 days
```

### Session Management (`src/utils/session.ts`)

**Key Types:**
```typescript
interface SessionData {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp in ms when access token expires
}
```

**Key Functions:**
- `getSession(request)` - Parse session from cookie (includes expired but refreshable)
- `createSessionData(tokens, refreshTokenDefault?)` - Convert TokenResponse to SessionData
- `isValidSession(session)` - Check if session is valid (not expired)
- `sessionNeedsRefresh(session)` - Check if within refresh window (5 min)
- `createSessionHeader(session)` - Serialize session to Set-Cookie header

**Important:**
- `getSession()` returns expired sessions if they're still refreshable
- Cookie max age is 24 hours, but actual expiration is based on token expiry
- Failed refresh clears the session

### Token Refresh (`src/utils/refresh.ts`)

**`refreshSessionIfNeeded(request, session)`**

Handles automatic token refresh logic:
1. Checks if session needs refresh (within 5-minute window)
2. Calls Auth0 to refresh tokens
3. Creates new session with updated tokens
4. Preserves refresh token if Auth0 doesn't return a new one
5. On failure, clears session and returns null

**Note:** Always preserves the existing refresh token as fallback since Auth0 may not return a new one.

### Token Utilities (`src/utils/token.ts`)

**`getUserFromJwt(token: string): JwtUser | null`**

Extracts typed user information from a JWT token (typically the `idToken`).

**What it does:**
1. Decodes the JWT token payload
2. Returns properly typed user information
3. Returns `null` if decoding fails

**JwtUser interface:**
```typescript
interface JwtUser {
  sub: string;              // User ID (required)
  name?: string;            // Full name
  nickname?: string;        // Username/nickname
  picture?: string;         // Profile picture URL
  email?: string;           // Email address
  email_verified?: boolean; // Email verification status
  iat?: number;             // Issued at (seconds since epoch)
  exp?: number;             // Expiration (seconds since epoch)
  [key: string]: any;       // Additional custom claims
}
```

**Usage:**
```typescript
import { getUserFromJwt } from "@simbul/auth-components";

const user = getUserFromJwt(session.idToken);
if (user) {
  console.log(user.name, user.email, user.picture);
}
```

**Other token utilities:**
- `parseJwt(token)` - Low-level JWT parsing (returns untyped payload)
- `needsRefresh(token)` - Check if token needs refresh
- `isValidToken(token)` - Validate token format and expiration
- `getTokenExpirationTime(token)` - Get expiration timestamp in milliseconds

### Development Mode (`src/utils/dev-auth.ts`)

**`shouldSkipAuth(): boolean`**
- In development: returns `true` unless `SKIP_AUTH=false`
- In production: returns `false` unless `SKIP_AUTH=true`

**`createDevSession(): SessionData`**
- Creates mock session with fake JWT
- Mock JWT includes user data (name, email, avatar)
- Avatar is embedded SVG data URI (no external dependencies)
- Session expires in 1 year (effectively never in dev)

**Mock JWT Payload:**
```json
{
  "sub": "dev|123456789",
  "name": "Dev User",
  "nickname": "devuser",
  "picture": "data:image/svg+xml,%3Csvg...",
  "email": "dev@example.com",
  "email_verified": true
}
```

### Header Component (`src/components/Header.tsx`)

**Props:**
```typescript
interface HeaderProps {
  appName?: string;              // Default: "App"
  showPreviewBadge?: boolean;    // Default: false
  className?: string;            // Override navbar classes
  buttonClassName?: string;      // Override button classes
  avatarClassName?: string;      // Override avatar classes
}
```

**Features:**
- Uses `useRouteLoaderData("root")` to access session
- Decodes JWT to display user info (name, picture)
- Shows login button if not authenticated
- Shows avatar + logout button if authenticated
- Optional preview badge for deploy previews
- DaisyUI classes by default (customizable)

**Tailwind Configuration:**
Must configure Tailwind to scan this package's source:
```css
/* In app.css */
@source '../node_modules/@simbul/auth-components/src';
```

### Route Handlers (`src/routes/`)

**Login (`login.tsx`):**
- Loader checks if already authenticated → redirect to "/"
- Generates Auth0 authorization URL with CSRF state
- Sets state cookie and redirects to Auth0

**Callback (`callback.tsx`):**
- Validates code and state parameters
- Verifies CSRF state token
- Exchanges code for tokens
- Creates session and sets cookie
- Redirects to "/" on success

**Logout (`logout.tsx`):**
- Both loader and action supported
- Clears session cookie
- Redirects to Auth0 logout endpoint
- Returns to app after logout

### CLI Setup Tool (`bin/setup.js`)

**Command:** `npx auth-components-setup`

**What it does:**
1. Creates `app/routes/` directory if missing
2. Creates three route files:
   - `login.tsx` - Re-exports from package
   - `logout.tsx` - Re-exports from package
   - `auth.callback.tsx` - Re-exports from package
3. Skips files that already exist
4. Provides instructions for adding to `app/routes.ts`

---

## Authentication Flow

### 1. Login Flow
```
User clicks "Login"
  ↓
GET /login
  ↓
Login loader executes:
  - Check if already authenticated → redirect "/"
  - Generate random state (CSRF token)
  - Create Auth0 authorization URL
  - Set state cookie
  - Redirect to Auth0
  ↓
User authenticates on Auth0
  ↓
Auth0 redirects to /auth/callback?code=XXX&state=YYY
  ↓
Callback loader executes:
  - Validate code and state params
  - Verify state matches cookie (CSRF protection)
  - Exchange code for tokens
  - Create session with tokens
  - Set session cookie
  - Redirect to "/"
  ↓
User is authenticated
```

### 2. Token Refresh Flow
```
Root loader executes on each request
  ↓
getAuthLoaderData(request) called
  ↓
getSession(request) retrieves current session
  ↓
refreshSessionIfNeeded() checks expiration:
  - Token expires in > 5 min → return session as-is
  - Token expires in ≤ 5 min → refresh tokens
  ↓
If refresh needed:
  - Call Auth0 /oauth/token with refresh_token
  - Create new session with fresh tokens
  - Return session + Set-Cookie header
  ↓
If refresh fails:
  - Clear session (return null + clear cookie)
  - User will need to re-login
  ↓
Session returned to app
```

### 3. Logout Flow
```
User submits logout form (POST /logout)
  ↓
Logout action/loader executes:
  - Get Auth0 config
  - Build logout URL with returnTo
  - Clear session cookie
  - Redirect to Auth0 logout
  ↓
Auth0 logs out user
  ↓
Auth0 redirects back to returnTo URL
  ↓
User is logged out
```

---

## Code Conventions & Best Practices

### 1. File Naming
- **Components:** PascalCase (e.g., `Header.tsx`)
- **Utilities:** kebab-case (e.g., `dev-auth.ts`)
- **Routes:** kebab-case (e.g., `callback.tsx`)
- **Index files:** `index.ts` for exports

### 2. Import/Export Patterns
- Always use `.js` extensions in imports (Node16 module resolution)
- Barrel exports via `index.ts` files
- Re-export types alongside implementations

```typescript
// Good
export * from "./utils/index.js";
export { default as Header } from "./Header.js";

// Bad
export * from "./utils/index"; // Missing .js
```

### 3. TypeScript Conventions
- Use `interface` for public APIs
- Use `type` for unions and complex types
- Export all public types
- Prefix internal types with underscore if needed
- Use strict mode (enabled in tsconfig)

### 4. Error Handling
- Log errors to console for debugging
- Sensitive data logged as "(present)" or "(missing)"
- On auth failures: redirect to login with error query param
- On refresh failures: clear session and force re-login

### 5. Environment Variables
- Use helper functions `getEnv()` and `isProd()`
- Support both `import.meta.env` (Vite) and `process.env` (Node)
- Throw descriptive errors for missing required vars
- Document all env vars in README

### 6. Cookie Security
- Always use `httpOnly: true`
- Use `secure: true` in production
- Use `sameSite: "lax"` for CSRF protection
- Use secrets for signed cookies (`SESSION_SECRET`)

### 7. Logging Strategy
- Log key authentication events (token exchange, refresh, failures)
- Redact sensitive data (tokens shown as "(present)")
- Include timestamps and context in logs
- Use descriptive log messages

### 8. Function Naming
- Use descriptive, action-oriented names
- Prefix boolean checks with `is`, `has`, `should`
- Prefix async operations with `get`, `create`, `fetch`
- Examples: `shouldSkipAuth()`, `getSession()`, `createSessionData()`

---

## Development Workflows

### Making Changes

1. **Modify source files** in `src/`
2. **Build the package:** `npm run build`
   - Compiles TypeScript to `dist/`
   - Generates `.d.ts` declaration files
   - Creates source maps
3. **Test locally** via npm link or file reference
4. **Version bump** in `package.json` and all other relevant files
5. **Commit changes** with descriptive message
6. **Push to GitHub** and create PR if needed

### Build System

**TypeScript Compiler:**
- Target: ES2022
- Module: Node16 (ESM with `.js` extensions)
- Output: `dist/` directory
- Includes: `src/**/*`
- Excludes: `node_modules`, `dist`

**NPM Scripts:**
- `npm run build` - Compile TypeScript
- `npm run clean` - Remove `dist/` directory
- `npm run prepare` - Auto-runs build before publish

**Published Files:** (from `package.json.files`)
```json
["dist", "src", "bin", "README.md", "LICENSE"]
```

### Local Testing

**Option 1: npm link**
```bash
# In auth-components repo
npm link

# In consuming app
npm link @simbul/auth-components
```

**Option 2: File reference**
```json
// In consuming app's package.json
{
  "dependencies": {
    "@simbul/auth-components": "file:../path/to/auth-components"
  }
}
```

**Option 3: Development mode**
```bash
# In consuming app
SKIP_AUTH=true npm run dev
```

### Version Management

Current version: **1.2.1**

**Version History (recent):**
- v1.2.1 - Dev session now expires in 3 hours (instead of 1 year) and always returns headers for realistic local testing; added isDev flag to SessionData
- v1.2.0 - Changed default SESSION_MAX_AGE to 7 days and made it configurable via SESSION_MAX_AGE_DAYS env var
- v1.1.0 - Added getUserFromJwt() function with JwtUser interface for typed user data extraction
- v1.0.6 - Updated mock JWT with embedded SVG avatar
- v1.0.5 - Added nickname to mock JWT payload
- v1.0.4 - Tailwind CSS configuration documentation
- v1.0.3 - Converted to standalone package (from monorepo)

**Versioning Strategy:**
- Patch (1.0.x) - Bug fixes, documentation
- Minor (1.x.0) - New features, backward compatible
- Major (x.0.0) - Breaking changes

---

## Testing & Debugging

### Development Mode Testing

**Enable dev mode:**
```bash
SKIP_AUTH=true npm run dev
```

**What happens:**
- `shouldSkipAuth()` returns `true`
- `getAuthLoaderData()` returns mock session
- No Auth0 calls made
- Mock user appears in Header component

**Mock user data:**
```typescript
{
  name: "Dev User",
  email: "dev@example.com",
  picture: "data:image/svg+xml,..." // Blue avatar SVG
}
```

### Production Testing

**Disable dev mode:**
```bash
SKIP_AUTH=false npm run dev
# or
NODE_ENV=production npm run dev
```

**Required env vars:**
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `SESSION_SECRET`
- `AUTH0_AUDIENCE` (optional)

### Debugging Tips

**Check session:**
```typescript
// In loader
const session = await getSession(request);
console.log('Session:', {
  hasSession: !!session,
  expiresAt: session?.expiresAt,
  timeUntilExpiry: session ? session.expiresAt - Date.now() : null
});
```

**Check cookies:**
```typescript
const cookie = request.headers.get("Cookie");
console.log('Cookies:', cookie);
```

**Check Auth0 response:**
- Token exchange logs: Look for "Auth0 token exchange response"
- Token refresh logs: Look for "Auth0 token refresh response"
- Session creation logs: Look for "Created session data"

**Common issues:**
- Missing env vars → Check error messages
- Invalid state → CSRF protection triggered, check cookie settings
- Token refresh fails → Refresh token may be invalid/expired
- No session → Cookie not set, check secure/sameSite settings
- Tailwind styles missing → Check `@source` directive

---

## Deployment & Environment Variables

### Required Environment Variables

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Session Security
SESSION_SECRET=random_secret_key_min_32_chars

# Environment
NODE_ENV=production

# Optional
AUTH0_AUDIENCE=your_api_identifier  # For API access
SKIP_AUTH=false                      # Set true to bypass auth
```

### Platform-Specific Notes

**Netlify:**
- Callback URL derived from request origin (works with deploy previews)
- Set env vars in Netlify UI or `netlify.toml`
- No build-time URL needed (runtime detection)

**Vercel:**
- Similar runtime detection via request origin
- Set env vars in Vercel dashboard
- Works with preview deployments

**Other Platforms:**
- Ensure `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` are set
- `SESSION_SECRET` must be consistent across instances
- Callback URL: `{origin}/auth/callback`

### Security Checklist

- [ ] `SESSION_SECRET` is strong random string (32+ chars)
- [ ] `NODE_ENV=production` in production
- [ ] All Auth0 credentials stored as secrets
- [ ] Callback URL registered in Auth0 dashboard
- [ ] Logout URL registered in Auth0 dashboard
- [ ] HTTPS enabled (required for secure cookies)
- [ ] CORS configured if using separate API

---

## Common Tasks for AI Assistants

### Task 1: Add New Authentication Feature

**Example: Add "Remember Me" functionality**

1. **Update session configuration** (`src/utils/session.ts`):
   - Add `REMEMBER_ME_MAX_AGE` constant
   - Modify `createSessionHeader()` to accept optional maxAge

2. **Update SessionData interface** if needed:
   ```typescript
   interface SessionData {
     accessToken: string;
     idToken: string;
     refreshToken: string;
     expiresAt: number;
     rememberMe?: boolean; // NEW
   }
   ```

3. **Update callback route** (`src/routes/callback.tsx`):
   - Check for `remember_me` query param
   - Pass to `createSessionData()`

4. **Update TypeScript types** in exports

5. **Build and test:**
   ```bash
   npm run build
   npm link  # Test in consuming app
   ```

### Task 2: Fix Authentication Bug

**Example: Token refresh failing**

1. **Add debugging logs** (`src/utils/refresh.ts`):
   ```typescript
   console.log('Attempting refresh with token:', {
     hasRefreshToken: !!session.refreshToken,
     expiresAt: session.expiresAt,
   });
   ```

2. **Check Auth0 response** in logs

3. **Verify refresh token** is preserved:
   ```typescript
   const newSession = createSessionData(tokens, session.refreshToken);
   ```

4. **Test in dev mode** then production mode

5. **Update documentation** if config change needed

### Task 3: Update Dependencies

**Example: Upgrade TypeScript**

1. **Update package.json:**
   ```json
   {
     "devDependencies": {
       "typescript": "^5.x.x"
     }
   }
   ```

2. **Install:**
   ```bash
   npm install
   ```

3. **Check for type errors:**
   ```bash
   npm run build
   ```

4. **Fix any breaking changes** in `tsconfig.json` or source

5. **Test thoroughly** before publishing

### Task 4: Add New Component

**Example: Add LoginButton component**

1. **Create component** (`src/components/LoginButton.tsx`):
   ```typescript
   import { Link } from "react-router";

   export interface LoginButtonProps {
     className?: string;
   }

   export default function LoginButton({ className }: LoginButtonProps) {
     return <Link to="/login" className={className}>Login</Link>;
   }
   ```

2. **Export from index** (`src/components/index.ts`):
   ```typescript
   export { default as LoginButton } from "./LoginButton.js";
   export type { LoginButtonProps } from "./LoginButton.js";
   ```

3. **Update main export** (`src/index.ts`) if needed

4. **Build and test:**
   ```bash
   npm run build
   ```

5. **Update README** with usage example

### Task 5: Handle Environment-Specific Logic

**Example: Different Auth0 tenants per environment**

1. **Update `getAuth0Config()`** (`src/utils/auth.ts`):
   ```typescript
   export function getAuth0Config(request: Request): Auth0Config {
     const url = new URL(request.url);
     const isStaging = url.hostname.includes('staging');

     return {
       domain: getRequiredEnvVar(
         isStaging ? "AUTH0_STAGING_DOMAIN" : "AUTH0_DOMAIN"
       ),
       // ... rest of config
     };
   }
   ```

2. **Document new env vars** in README

3. **Test on each environment**

### Task 6: Debug Session Issues

**Steps:**

1. **Check if session exists:**
   ```typescript
   const session = await getSession(request);
   console.log('Session exists:', !!session);
   ```

2. **Check expiration:**
   ```typescript
   if (session) {
     const now = Date.now();
     const expired = session.expiresAt < now;
     console.log('Session expired:', expired);
   }
   ```

3. **Check refresh window:**
   ```typescript
   const needsRefresh = sessionNeedsRefresh(session);
   console.log('Needs refresh:', needsRefresh);
   ```

4. **Check cookies:**
   ```typescript
   const cookieHeader = request.headers.get("Cookie");
   console.log('Has session cookie:', cookieHeader?.includes('__session'));
   ```

5. **Verify env vars:**
   ```typescript
   console.log('Auth0 config:', {
     hasDomain: !!getEnv('AUTH0_DOMAIN'),
     hasClientId: !!getEnv('AUTH0_CLIENT_ID'),
     hasSecret: !!getEnv('AUTH0_CLIENT_SECRET'),
   });
   ```

### Task 7: Customize for Different Framework

**Note:** This package is designed for React Router v7. Porting to other frameworks requires:

1. **Replace cookie utilities:**
   - `createCookie` from `react-router` → framework equivalent
   - Update imports in `session.ts` and `auth.ts`

2. **Replace routing:**
   - `redirect`, `LoaderFunctionArgs` → framework types
   - Update route handlers in `src/routes/`

3. **Replace components:**
   - `useRouteLoaderData`, `Link` → framework equivalents
   - Update `Header.tsx`

4. **Update build config:**
   - May need different module resolution
   - Update `tsconfig.json` accordingly

5. **Test thoroughly** - authentication is security-critical

---

## Package Exports

The package provides multiple entry points (from `package.json`):

```typescript
// Main export - everything
import { getAuthLoaderData, Header, getUserFromJwt, type JwtUser } from "@simbul/auth-components";

// Components only
import { Header } from "@simbul/auth-components/components";

// Utils only
import { getSession, refreshTokens, getUserFromJwt, type JwtUser } from "@simbul/auth-components/utils";

// Routes only (for re-export in consuming app)
export { loader, default } from "@simbul/auth-components/routes/login";
export { loader, action, default } from "@simbul/auth-components/routes/logout";
export { loader } from "@simbul/auth-components/routes/callback";
```

---

## Key Design Decisions

### Why HTTP-only Cookies?
- More secure than localStorage (protected from XSS)
- Automatically sent with requests
- Can be set server-side only

### Why Refresh Tokens?
- Access tokens are short-lived (security)
- Refresh tokens allow seamless re-authentication
- Reduces user interruption

### Why State Parameter?
- CSRF protection for OAuth flow
- Prevents authorization code injection
- Standard OAuth 2.0 security practice

### Why Mock Sessions in Dev?
- Speeds up development (no Auth0 roundtrip)
- Works offline
- Consistent test data
- Still allows testing real auth when needed

### Why Server-Side Rendering?
- Session verification happens on server
- Tokens never exposed to client
- Better security posture
- Works with/without JavaScript

### Why React Router v7?
- Modern SSR framework
- Built-in cookie utilities
- Type-safe routing
- Loader/action pattern fits auth well

---

## Anti-Patterns to Avoid

### DON'T: Store tokens in localStorage
```typescript
// BAD
localStorage.setItem('token', accessToken);

// GOOD - handled by package
const session = await getSession(request); // From cookie
```

### DON'T: Skip state verification
```typescript
// BAD
const code = url.searchParams.get("code");
const tokens = await exchangeCodeForTokens(config, code);

// GOOD
const state = url.searchParams.get("state");
if (!await verifyState(request, state)) {
  throw new Error("Invalid state");
}
```

### DON'T: Ignore token expiration
```typescript
// BAD
return { session }; // May be expired

// GOOD
return await refreshSessionIfNeeded(request, session);
```

### DON'T: Log sensitive data
```typescript
// BAD
console.log('Token:', session.accessToken);

// GOOD
console.log('Token:', session.accessToken ? '(present)' : '(missing)');
```

### DON'T: Hardcode configuration
```typescript
// BAD
const domain = "myapp.auth0.com";

// GOOD
const domain = getRequiredEnvVar("AUTH0_DOMAIN");
```

---

## Troubleshooting Guide

### Issue: "Missing required environment variable"
**Cause:** Auth0 env vars not set
**Solution:** Set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`

### Issue: "Invalid state parameter"
**Cause:** State cookie not set or doesn't match
**Solution:**
- Check cookie settings (secure, sameSite)
- Verify cookies enabled in browser
- Check for cookie domain issues

### Issue: Token refresh keeps failing
**Cause:** Refresh token invalid or Auth0 config wrong
**Solution:**
- Check Auth0 dashboard for refresh token settings
- Verify offline_access scope requested
- Check client credentials

### Issue: Session not persisting
**Cause:** Cookie not being set
**Solution:**
- Verify `SESSION_SECRET` is set
- Check `secure` flag matches (HTTPS in prod)
- Verify `maxAge` is reasonable

### Issue: Tailwind styles not applying
**Cause:** Tailwind not scanning package source
**Solution:**
- Add `@source '../node_modules/@simbul/auth-components/src';` to CSS
- Or add to `tailwind.config.js` content array

### Issue: TypeScript errors in consuming app
**Cause:** Type definitions not found
**Solution:**
- Ensure `dist/` is published
- Check `package.json` types field
- Try `npm install` again

---

## Additional Resources

### Official Documentation
- **Auth0 OAuth2 Flow:** https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow
- **React Router v7:** https://reactrouter.com/
- **DaisyUI:** https://daisyui.com/
- **Tailwind CSS:** https://tailwindcss.com/

### Package README
See `README.md` for user-facing documentation and setup instructions.

### Git History
Recent changes focus on:
- Mock JWT improvements (embedded avatar SVG)
- Tailwind configuration documentation
- Standalone package conversion (from monorepo)

---

## Questions for AI Assistants

When working on this codebase, consider:

1. **Does this change affect the authentication flow?**
   - If yes, test thoroughly with real Auth0 credentials
   - Consider CSRF, token expiration, refresh logic

2. **Does this change affect TypeScript types?**
   - Update type exports in `index.ts` files
   - Regenerate declaration files with `npm run build`

3. **Does this change affect cookies?**
   - Consider security implications (httpOnly, secure, sameSite)
   - Test in both dev and prod environments
   - Check cookie size limits (4KB max)

4. **Does this change affect the public API?**
   - Update README.md with examples
   - Consider semver implications (patch/minor/major)
   - Document breaking changes clearly

5. **Does this require environment variables?**
   - Document in README
   - Add validation in code
   - Provide good error messages

6. **Does this affect consumers of the package?**
   - Consider backward compatibility
   - Provide migration guide if breaking
   - Test with example consuming app

---

**Last Updated:** 2025-11-29
**Package Version:** 1.2.1
**Maintained By:** Alessandro Morandi

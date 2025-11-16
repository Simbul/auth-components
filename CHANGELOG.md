# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-16

### Added
- `getUserFromJwt()` function with `JwtUser` interface for typed user data extraction from JWT tokens
- Proper TypeScript interface for JWT user claims (sub, name, email, picture, etc.)

### Changed
- Improved type safety for user data extraction from ID tokens

## [1.0.6] - 2024-XX-XX

### Changed
- Updated mock JWT with embedded SVG avatar for development mode

## [1.0.5] - 2024-XX-XX

### Added
- Nickname field to mock JWT payload

## [1.0.4] - 2024-XX-XX

### Changed
- Updated documentation for Tailwind CSS configuration

## [1.0.3] - 2024-XX-XX

### Changed
- Converted to standalone package (from monorepo)

---

## Changelog Guidelines

### Categories
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

### Example Entry
```markdown
## [1.2.0] - 2025-11-20

### Added
- New `RefreshButton` component for manual token refresh
- Support for custom callback URLs via `CALLBACK_URL` env var

### Changed
- Improved error messages in authentication flow
- Updated `Header` component to support custom avatars

### Fixed
- Session refresh timing issue causing unnecessary re-authentication
- TypeScript type error in `getAuthLoaderData` return type

### Security
- Updated `@auth0/auth0-react` to fix CVE-XXXX-XXXX
```

# Release Workflow Documentation

## Overview

This repository uses automated GitHub Actions to create git tags and publish releases when the version in `package.json` is updated on the `main` branch.

## Available Workflows

### 1. `auto-tag.yml` - Simple Tagging
**Purpose:** Creates git tags and GitHub releases automatically
**Triggers:** When `package.json` changes on `main` branch
**What it does:**
- Reads version from `package.json`
- Creates a git tag (e.g., `v1.1.0`)
- Creates a GitHub release with basic information

### 2. `release.yml` - Full Release Pipeline
**Purpose:** Complete release automation including npm publishing
**Triggers:** When `package.json` changes on `main` branch
**What it does:**
- Reads version from `package.json`
- Checks if tag already exists (skips if it does)
- Installs dependencies and builds the package
- Creates git tag
- Extracts changelog from `CHANGELOG.md` (if available)
- Creates GitHub release with changelog
- Publishes to npm with provenance

## Usage

### Standard Release Process

1. **Make your changes** on a feature branch
2. **Update version** in `package.json`:
   ```bash
   npm version patch  # 1.1.0 -> 1.1.1
   npm version minor  # 1.1.0 -> 1.2.0
   npm version major  # 1.1.0 -> 2.0.0
   ```
3. **Update CHANGELOG.md** with your changes (see format below)
4. **Commit and push** to your branch
5. **Create and merge PR** to main
6. **GitHub Action runs automatically** and:
   - Creates git tag
   - Creates GitHub release
   - Publishes to npm (if using `release.yml`)

### Changelog Format

Keep a `CHANGELOG.md` file following this structure:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-11-16

### Added
- New feature X
- New component Y

### Changed
- Updated dependency Z

### Fixed
- Bug in component A

## [1.1.0] - 2025-11-10

### Added
- Initial feature set
```

## Setup Requirements

### For Basic Tagging (`auto-tag.yml`)
No additional setup required - just merge to main!

### For Full Release with npm (`release.yml`)
1. **Create npm token:**
   - Log in to https://www.npmjs.com
   - Go to Access Tokens → Generate New Token
   - Choose "Automation" type
   - Copy the token

2. **Add to GitHub secrets:**
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm token
   - Click "Add secret"

3. **Verify permissions:**
   - The workflow already has `contents: write` for tags
   - The workflow has `id-token: write` for npm provenance

## Best Practices

### Version Bumping Strategy

**Patch (1.1.0 → 1.1.1):**
- Bug fixes
- Documentation updates
- Internal refactoring (no API changes)

**Minor (1.1.0 → 1.2.0):**
- New features (backward compatible)
- New components or utilities
- Deprecations (not removals)

**Major (1.1.0 → 2.0.0):**
- Breaking changes
- Removed deprecated features
- Major architecture changes

### Workflow Selection

**Use `auto-tag.yml` if:**
- You manually publish to npm
- You want separation between tagging and publishing
- You're testing the workflow

**Use `release.yml` if:**
- You want full automation
- You trust your CI/CD pipeline
- You want npm provenance (supply chain security)

**Use both if:**
- You want redundancy
- You might disable publishing temporarily
- (Note: Both will create the same tag, one will skip if it exists)

### Pre-release Versions

For pre-releases, use version suffixes:
```bash
npm version 1.2.0-alpha.1
npm version 1.2.0-beta.1
npm version 1.2.0-rc.1
```

The workflow automatically marks these as pre-releases on GitHub.

## Alternative Approaches

### 1. Semantic Release
**Tool:** https://github.com/semantic-release/semantic-release

**Pros:**
- Fully automated versioning based on commit messages
- Automatic changelog generation
- Follows conventional commits

**Cons:**
- Requires team to follow conventional commits
- More complex setup
- Less manual control

**Example setup:**
```json
// package.json
{
  "scripts": {
    "semantic-release": "semantic-release"
  },
  "devDependencies": {
    "semantic-release": "^22.0.0"
  }
}
```

### 2. Release Please
**Tool:** https://github.com/googleapis/release-please

**Pros:**
- Creates release PRs with changelog
- Review before release
- Google-backed, well maintained

**Cons:**
- Requires conventional commits
- Extra PR to manage

### 3. Changesets
**Tool:** https://github.com/changesets/changesets

**Pros:**
- Great for monorepos
- Manual changelog control
- Team-friendly workflow

**Cons:**
- More files to manage
- Requires discipline to create changesets

### 4. Manual with GitHub CLI
```bash
# In package.json scripts
"release": "npm version $VERSION && git push --follow-tags && gh release create v$(node -p require('./package.json').version)"
```

**Pros:**
- Simple
- Full control
- No CI/CD needed

**Cons:**
- Manual process
- Easy to forget steps

## Comparison Table

| Approach | Automation | Changelog | Learning Curve | Best For |
|----------|------------|-----------|----------------|----------|
| **Current (auto-tag.yml)** | Medium | Manual | Low | Small teams, simple workflow |
| **Current (release.yml)** | High | Manual | Low | Full automation, simple workflow |
| **Semantic Release** | Very High | Auto | Medium | Teams using conventional commits |
| **Release Please** | High | Auto | Medium | Teams wanting PR review |
| **Changesets** | Medium | Semi-Auto | Medium | Monorepos, detailed changelogs |
| **Manual** | Low | Manual | Very Low | Solo developers, maximum control |

## Recommended: Current Approach

For this package, the current approach is recommended because:

1. ✅ **Simple:** Just update `package.json` and `CHANGELOG.md`
2. ✅ **Reliable:** Version is source of truth
3. ✅ **Flexible:** Can use either workflow or both
4. ✅ **Transparent:** Easy to see what version will be released
5. ✅ **No commit restrictions:** Team doesn't need to follow conventional commits
6. ✅ **Manual control:** You decide when versions change

## Troubleshooting

### Tag already exists
The workflow checks for existing tags and skips if found. To re-release:
```bash
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0
# Then re-run workflow or push package.json change
```

### npm publish fails
- Check `NPM_TOKEN` secret is set
- Verify token has publish permissions
- Ensure version doesn't exist on npm already
- Check package name is available

### Workflow doesn't trigger
- Ensure `package.json` was modified in the commit
- Check workflow file is on `main` branch
- Verify push was to `main` branch

### Build fails
- Ensure all dependencies are in `package.json`
- Test build locally: `npm ci && npm run build`
- Check TypeScript errors

## Security Considerations

1. **npm Provenance:** Enabled in `release.yml` for supply chain security
2. **Token Security:** npm token stored as GitHub secret (encrypted)
3. **Limited Permissions:** Workflow only has `contents: write` and `id-token: write`
4. **No External Scripts:** Workflows use official GitHub Actions only

## Migration from Manual Process

If you were releasing manually before:

1. **Keep your process** - workflows won't interfere
2. **Try `auto-tag.yml` first** - doesn't publish to npm
3. **Test with a patch version** - low risk
4. **Verify tags created correctly**
5. **Add npm token and switch to `release.yml`** when confident

## Questions?

See:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)

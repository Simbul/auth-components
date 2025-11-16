# Release Workflow Documentation

## Overview

This repository uses automated GitHub Actions to create git tags and GitHub releases when the version in `package.json` is updated on the `main` branch.

## Workflow: `auto-tag.yml`

**Purpose:** Automatically creates git tags and GitHub releases
**Triggers:** When `package.json` changes on `main` branch

**What it does:**
1. Reads version from `package.json`
2. Checks if tag already exists (skips if it does)
3. Creates a git tag (e.g., `v1.1.0`)
4. Creates a GitHub release with changelog from `CHANGELOG.md`

**No setup required** - just merge changes to main!

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
   - Creates GitHub release with your changelog

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

The workflow will automatically extract the section for your version and include it in the GitHub release.

## Version Bumping Strategy

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

### Pre-release Versions

For pre-releases, use version suffixes:
```bash
npm version 1.2.0-alpha.1
npm version 1.2.0-beta.1
npm version 1.2.0-rc.1
```

The workflow automatically marks these as pre-releases on GitHub (indicated by `-`, `alpha`, `beta`, or `rc` in the version).

## Alternative Approaches

### 1. Semantic Release
**Tool:** https://github.com/semantic-release/semantic-release

**Pros:**
- Fully automated versioning based on commit messages
- Automatic changelog generation
- Follows conventional commits

**Cons:**
- Requires team to follow conventional commits strictly
- More complex setup
- Less manual control

### 2. Release Please
**Tool:** https://github.com/googleapis/release-please

**Pros:**
- Creates release PRs with changelog for review
- Google-backed, well maintained
- Good for teams

**Cons:**
- Requires conventional commits
- Extra PR to manage before release

### 3. Manual with GitHub CLI
```bash
# One-line manual release
npm version patch && git push --follow-tags && gh release create v$(node -p "require('./package.json').version")
```

**Pros:**
- Simple, full control
- No CI/CD needed

**Cons:**
- Manual process
- Easy to forget steps

## Comparison Table

| Approach | Automation | Changelog | Learning Curve | Best For |
|----------|------------|-----------|----------------|----------|
| **Current (auto-tag.yml)** | Medium | Manual | Low | Simple tagging workflow |
| **Semantic Release** | Very High | Auto | Medium | Teams using conventional commits |
| **Release Please** | High | Auto | Medium | Teams wanting PR review |
| **Manual** | Low | Manual | Very Low | Solo developers, maximum control |

## Why This Approach?

For this package, the current approach is recommended because:

1. ✅ **Simple:** Just update `package.json` and `CHANGELOG.md`
2. ✅ **Reliable:** Version in package.json is the single source of truth
3. ✅ **Transparent:** Easy to see what version will be released
4. ✅ **No commit restrictions:** Team doesn't need to follow conventional commits
5. ✅ **Manual control:** You decide when versions change
6. ✅ **Idempotent:** Won't create duplicate tags

## Troubleshooting

### Tag already exists
The workflow checks for existing tags and skips if found. To re-release:
```bash
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0
# Then re-run workflow or push package.json change
```

### Workflow doesn't trigger
- Ensure `package.json` was modified in the commit
- Check workflow file is on `main` branch
- Verify push was to `main` branch
- Check Actions are enabled in repository settings

### Release doesn't include changelog
- Ensure `CHANGELOG.md` exists
- Verify version section exists (e.g., `## [1.1.0]`)
- Check section formatting matches the example above

## Security Considerations

1. **Limited Permissions:** Workflow only has `contents: write` permission
2. **No External Scripts:** Workflow uses official GitHub Actions only
3. **Idempotent:** Safe to re-run, won't create duplicates

## Example Workflow

Here's a typical development cycle:

```bash
# 1. Create feature branch
git checkout -b feature/new-button

# 2. Make changes...
# ... edit files ...

# 3. Bump version
npm version minor  # 1.1.0 -> 1.2.0

# 4. Update changelog
echo "## [1.2.0] - $(date +%Y-%m-%d)

### Added
- New Button component with customizable styles
" >> CHANGELOG.md

# 5. Commit and push
git add .
git commit -m "Add new Button component"
git push origin feature/new-button

# 6. Create and merge PR to main
# (via GitHub UI or gh CLI)

# 7. GitHub Action runs automatically
# - Creates tag v1.2.0
# - Creates GitHub release with changelog
```

## Questions?

See:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)

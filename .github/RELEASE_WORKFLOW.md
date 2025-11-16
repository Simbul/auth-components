# Auto-Tagging Workflow

## Overview

This repository automatically creates git tags when the version in `package.json` is updated on the `main` branch.

## How It Works

**Workflow:** `.github/workflows/auto-tag.yml`

**Triggers:** When `package.json` changes on `main` branch

**What it does:**
1. Reads version from `package.json`
2. Checks if tag already exists (skips if it does)
3. Creates an annotated git tag (e.g., `v1.1.0`)
4. Pushes the tag to GitHub

**No setup required** - just merge to main!

## Usage

1. **Make your changes** on a feature branch

2. **Update version** in `package.json`:
   ```bash
   npm version patch  # 1.1.0 -> 1.1.1
   npm version minor  # 1.1.0 -> 1.2.0
   npm version major  # 1.1.0 -> 2.0.0
   ```

3. **Commit and push** to your branch

4. **Create and merge PR** to main

5. **GitHub Action runs automatically** and creates the git tag

That's it!

## Version Bumping Strategy

**Patch (1.1.0 → 1.1.1):**
- Bug fixes
- Documentation updates
- Internal refactoring

**Minor (1.1.0 → 1.2.0):**
- New features (backward compatible)
- New components or utilities

**Major (1.1.0 → 2.0.0):**
- Breaking changes
- Removed features
- Major architecture changes

## Troubleshooting

### Tag already exists
The workflow checks for existing tags and skips if found. To recreate a tag:
```bash
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0
# Then push package.json change again
```

### Workflow doesn't trigger
- Ensure `package.json` was modified in the commit
- Check workflow file is on `main` branch
- Verify push was to `main` branch
- Check Actions are enabled in repository settings

## Example

```bash
# Update version
npm version minor  # 1.1.0 -> 1.2.0

# Commit
git add package.json
git commit -m "Bump version to 1.2.0"

# Push and merge to main
git push

# After merge to main, GitHub Action creates tag v1.2.0 automatically
```

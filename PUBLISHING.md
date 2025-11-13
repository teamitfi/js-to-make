# Publishing Guide for js-to-make

This document explains the automated and manual publishing processes for the `js-to-make` package to JSR (JavaScript Registry).

## 🤖 Automated Publishing (Recommended)

**This project uses automated semantic versioning!** The release process is fully automated based on your commit messages.

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub at `https://github.com/teamitfi/js-to-make`
2. **JSR Account**: Sign in to [JSR](https://jsr.io) with your GitHub account
3. **Clean Git State**: Commit all changes before publishing

## Configuration Files

The following files have been set up for JSR publishing:

### `deno.json`
- Contains package metadata (name, version, license)
- Defines exports and publish exclusions
- Current version: `1.0.0`

### `.github/workflows/publish.yml`
- GitHub Actions workflow for automated publishing
- Triggers on:
  - **Git tags** matching pattern `v*.*.*` (e.g., `v1.0.0`)
  - **Manual workflow dispatch** (with dry-run option)

### `jsr.json`
- Additional JSR-specific configuration
- Mirrors the publish settings in `deno.json`

## Publishing Process

### Automated Semantic Release (Primary Method)

**Simply commit to main with conventional commit messages, and releases happen automatically!**

#### How It Works

1. **Make your changes** and commit using [conventional commits](https://www.conventionalcommits.org/):
   ```bash
   # For a new feature (bumps minor version 1.X.0)
   git commit -m "feat: add support for deno workspaces"
   
   # For a bug fix (bumps patch version 1.0.X)
   git commit -m "fix: handle edge case in package detection"
   
   # For a breaking change (bumps major version X.0.0)
   git commit -m "feat!: redesign CLI interface"
   ```

2. **Push to main** (or merge a PR):
   ```bash
   git push origin main
   ```

3. **Automated release pipeline** runs:
   - ✅ Analyzes all commits since last release
   - ✅ Determines new version based on commit types
   - ✅ Updates `deno.json` with new version
   - ✅ Generates/updates CHANGELOG.md
   - ✅ Creates GitHub Release with release notes
   - ✅ Publishes to JSR automatically
   - ✅ Comments on related issues/PRs

4. **Done!** No manual version bumping needed.

#### Commit Types & Version Bumps

| Commit Type | Example | Version Impact |
|-------------|---------|----------------|
| `feat:` | `feat: add new feature` | Minor (1.X.0) |
| `fix:` | `fix: resolve bug` | Patch (1.0.X) |
| `feat!:` | `feat!: breaking change` | Major (X.0.0) |
| `docs:` | `docs: update README` | Patch (1.0.X) |
| `refactor:` | `refactor: improve code` | Patch (1.0.X) |
| `perf:` | `perf: optimize parsing` | Patch (1.0.X) |
| `test:` | `test: add tests` | No release |
| `chore:` | `chore: update deps` | No release |
| `ci:` | `ci: update workflow` | No release |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed commit message guidelines.

#### Example Workflow

```bash
# Current version: 1.2.3

# You commit a new feature
git add .
git commit -m "feat: add support for custom templates"
git push origin main

# GitHub Actions automatically:
# 1. Runs tests, linter, formatter ✅
# 2. Analyzes commit messages 🔍
# 3. Bumps version to 1.3.0 📈
# 4. Updates deno.json and CHANGELOG.md 📝
# 5. Creates GitHub Release v1.3.0 🎉
# 6. Publishes to JSR 🚀
# 7. Comments on related PRs/issues 💬

# New version 1.3.0 is now live on JSR!
```

### Manual Publishing via Git Tags (Alternative)

If you prefer to manually control releases:

1. **Update the version** in `deno.json`:
   ```json
   {
     "name": "@teamitfi/js-to-make",
     "version": "1.0.1",  // Increment this
     ...
   }
   ```

2. **Commit and tag**:
   ```bash
   git add .
   git commit -m "chore: release v1.0.1"
   git tag v1.0.1
   git push origin main
   git push origin v1.0.1
   ```

3. **GitHub Actions will automatically**:
   - Run tests, linter, formatter
   - Publish to JSR

Note: This method bypasses semantic-release and requires manual version management.

### Option 2: Manual Publish from Local Machine

1. **Ensure all changes are committed**:
   ```bash
   git status  # Should be clean
   ```

2. **Run a dry-run first** (recommended):
   ```bash
   deno publish --dry-run
   ```

3. **Publish to JSR**:
   ```bash
   deno publish
   ```

   On first publish, you'll be prompted to authenticate with JSR.

### Option 3: Manual Trigger via GitHub Actions

1. Go to: https://github.com/teamitfi/js-to-make/actions
2. Click on "Publish to JSR" workflow
3. Click "Run workflow"
4. Choose options:
   - **Branch**: `main` (or your branch)
   - **Dry run**: `true` (to test) or `false` (to publish)
5. Click "Run workflow"

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0): Breaking changes
- **MINOR** version (0.X.0): New features (backward compatible)
- **PATCH** version (0.0.X): Bug fixes (backward compatible)

## After Publishing

Once published, users can install the package:

```bash
# Install globally
deno install -g --allow-read --allow-write --name js-to-make jsr:@teamitfi/js-to-make

# Or run directly
deno run --allow-read --allow-write jsr:@teamitfi/js-to-make
```

Check your package on JSR:
- https://jsr.io/@teamitfi/js-to-make

## Troubleshooting

### "Uncommitted changes" Error

If you get this error during `deno publish`:
```
error: Aborting due to uncommitted changes
```

Either:
- Commit your changes: `git add . && git commit -m "message"`
- Or use: `deno publish --allow-dirty` (not recommended for releases)

### "Invalid external import" Error

Make sure all imports use JSR-compatible specifiers:
- ✅ `jsr:@std/cli@1/parse-args`
- ✅ `jsr:@std/path@1/join`
- ✅ `npm:some-package`
- ❌ `https://deno.land/std/...`

### GitHub Actions Permission Error

Ensure the workflow has the correct permissions in `.github/workflows/publish.yml`:
```yaml
permissions:
  contents: read
  id-token: write  # Required for JSR publishing
```

## Testing Before Release

1. **Run tests**:
   ```bash
   deno task test
   ```

2. **Check formatting**:
   ```bash
   deno fmt --check
   ```

3. **Run linter**:
   ```bash
   deno lint
   ```

4. **Test dry-run publish**:
   ```bash
   deno publish --dry-run --allow-dirty
   ```

5. **Test the package locally**:
   ```bash
   deno task js-to-make
   ```

## First-Time JSR Setup

If this is your first time publishing to JSR:

1. Visit https://jsr.io and sign in with GitHub
2. Run `deno publish` - you'll be prompted to authenticate
3. Follow the authentication flow
4. Your credentials will be saved for future publishes

## Scope Management

The package is published under the `@teamitfi` scope. Make sure:
- You have access to this scope on JSR
- The scope name matches your organization/username on JSR
- If needed, you can create the scope on your first publish

## Checklist Before Publishing

- [ ] All tests pass (`deno task test`)
- [ ] Code is formatted (`deno fmt`)
- [ ] Code is linted (`deno lint`)
- [ ] Version number is updated in `deno.json`
- [ ] README is up to date
- [ ] CHANGELOG is updated (if you maintain one)
- [ ] All changes are committed
- [ ] Dry-run publish succeeds
- [ ] Git tag is created and pushed (for automated publishing)

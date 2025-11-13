# Initial Setup for JSR Publishing

This document covers the one-time setup required to enable automated publishing to JSR from GitHub Actions.

## ⚠️ Required: Link Package to GitHub Repository

**Before automated publishing will work**, you must link your JSR package to your GitHub repository. This is a **one-time setup** that enables GitHub Actions to publish without manual authentication.

### Steps to Link Package:

1. **Create your package on JSR** (if not already created):
   - Visit https://jsr.io/new
   - Create a scope (e.g., `@teamitfi`)
   - Create a package (e.g., `js-to-make`)

2. **Link to GitHub**:
   - Go to your package settings: https://jsr.io/@teamitfi/js-to-make/settings
   - Under "GitHub repository", enter: `teamitfi/js-to-make`
   - Click "Link"

3. **Verify the link**:
   - You should see a GitHub icon next to your package name
   - The settings page should show "Linked to GitHub"

## ✅ Checklist

Before your first automated publish:

- [ ] JSR account created and signed in via GitHub
- [ ] Scope created on JSR (e.g., `@teamitfi`)
- [ ] Package created on JSR (e.g., `js-to-make`)
- [ ] Package linked to GitHub repository in JSR settings
- [ ] Repository has the workflow files in `.github/workflows/`
- [ ] `deno.json` has correct package name and version

## 🔐 Authentication

GitHub Actions uses **OIDC (OpenID Connect)** to authenticate with JSR. This means:

- ✅ **No secrets required** - Authentication is automatic
- ✅ **No API tokens to manage** - GitHub and JSR handle it
- ✅ **Secure** - Uses short-lived tokens
- ⚠️ **Requires package to be linked** to GitHub repository

The workflow permissions in `.github/workflows/release.yml` and `.github/workflows/publish.yml` include:

```yaml
permissions:
  contents: read
  id-token: write # The OIDC ID token is used for authentication with JSR
```

This `id-token: write` permission allows GitHub Actions to generate an OIDC token that JSR uses to verify the publish request is coming from the correct repository.

## 🚀 First Publish

### Option 1: Automated (Recommended)

Once linked, simply commit with a conventional commit message:

```bash
git add .
git commit -m "feat: initial release"
git push origin main
```

The workflow will automatically publish to JSR.

### Option 2: Manual Test

You can manually trigger the publish workflow to test:

1. Go to: https://github.com/teamitfi/js-to-make/actions
2. Click "Publish to JSR"
3. Click "Run workflow"
4. Select branch: `main`
5. Dry run: `false`
6. Click "Run workflow"

### Option 3: Local Publish

You can publish from your local machine to test:

```bash
deno publish --dry-run  # Test first
deno publish            # Actual publish
```

This will open a browser for authentication.

## 🔍 Verification

After your first successful publish:

1. Check JSR: https://jsr.io/@teamitfi/js-to-make
2. Verify version is published
3. Test installation:
   ```bash
   deno install -g jsr:@teamitfi/js-to-make
   ```

## 📋 Package Configuration

Our `deno.json` includes all required JSR fields:

```json
{
  "name": "@teamitfi/js-to-make", // ✅ Scoped package name
  "version": "1.0.0", // ✅ Semantic version
  "license": "MIT", // ✅ License identifier
  "exports": "./main.ts", // ✅ Main entry point
  "publish": { // ✅ Publish configuration
    "exclude": [ // ✅ Files to exclude
      ".git",
      ".github",
      ".gitignore",
      "tests/",
      "package.json",
      "index.ts",
      "Makefile"
    ]
  }
}
```

## 🔧 Troubleshooting

### "Package not linked to repository" Error

If you see this error in GitHub Actions:

```
Error: This package is not linked to this repository
```

**Solution**: Go to JSR package settings and link to GitHub (see steps above).

### Permission Denied

If you see permission errors:

**Solution**: Verify the workflow file has the correct permissions:

```yaml
permissions:
  contents: read
  id-token: write
```

### Version Already Published

If the version in `deno.json` is already published, the workflow will skip publishing. This is expected behavior.

**Solution**: The semantic-release workflow handles this automatically by bumping the version. For manual publishing, update the version number in `deno.json`.

## 📚 Additional Resources

- [JSR Publishing Documentation](https://jsr.io/docs/publishing-packages)
- [JSR GitHub Actions Guide](https://jsr.io/docs/publishing-packages#publishing-from-github-actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)

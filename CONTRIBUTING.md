# Contributing to js-to-make

Thank you for your interest in contributing! This project uses automated semantic versioning based on conventional commits.

## 🔄 Automated Release Process

This project uses **semantic-release** to automatically:

- ✅ Determine the next version number based on commit messages
- ✅ Generate release notes and CHANGELOG
- ✅ Update version in `deno.json`
- ✅ Create a GitHub release
- ✅ Publish to JSR (JavaScript Registry)

All of this happens automatically when you push to `main`!

## 📝 Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Each commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type       | Description              | Version Bump      | Example                                     |
| ---------- | ------------------------ | ----------------- | ------------------------------------------- |
| `feat`     | New feature              | **Minor** (0.X.0) | `feat: add support for bun package manager` |
| `fix`      | Bug fix                  | **Patch** (0.0.X) | `fix: correct makefile generation for yarn` |
| `perf`     | Performance improvement  | **Patch** (0.0.X) | `perf: optimize package.json parsing`       |
| `docs`     | Documentation only       | **Patch** (0.0.X) | `docs: update installation instructions`    |
| `refactor` | Code refactoring         | **Patch** (0.0.X) | `refactor: simplify PM detection logic`     |
| `style`    | Code style changes       | No release        | `style: format with deno fmt`               |
| `test`     | Adding/updating tests    | No release        | `test: add tests for CI target`             |
| `chore`    | Maintenance tasks        | No release        | `chore: update dependencies`                |
| `ci`       | CI/CD changes            | No release        | `ci: update GitHub Actions workflow`        |
| `build`    | Build system changes     | No release        | `build: update deno configuration`          |
| `revert`   | Revert a previous commit | **Patch** (0.0.X) | `revert: undo previous feature`             |

### Breaking Changes

For **MAJOR** version bumps (X.0.0), add `BREAKING CHANGE:` in the footer or use `!` after the type:

```bash
# Option 1: Using footer
git commit -m "feat: change CLI argument structure

BREAKING CHANGE: --force flag is now -f only"

# Option 2: Using ! notation
git commit -m "feat!: change CLI argument structure"
```

## 🎯 Commit Message Examples

### ✅ Good Examples

```bash
# Minor version bump (new feature)
git commit -m "feat: add --dry-run flag for testing"
git commit -m "feat(cli): support custom output path"

# Patch version bump (bug fix)
git commit -m "fix: handle missing package.json gracefully"
git commit -m "fix(makefile): escape special characters in script names"

# Patch version bump (docs)
git commit -m "docs: add JSR installation instructions"

# No release
git commit -m "test: add unit tests for package manager detection"
git commit -m "chore: update README formatting"
git commit -m "ci: add semantic-release workflow"

# Major version bump (breaking change)
git commit -m "feat!: redesign CLI interface"
git commit -m "feat: change default behavior

BREAKING CHANGE: Makefile now uses POSIX shell instead of bash"
```

### ❌ Bad Examples

```bash
# Too vague
git commit -m "update stuff"
git commit -m "fix bug"

# Not following conventional commits format
git commit -m "Added new feature"
git commit -m "Fixed the thing"
git commit -m "WIP"
```

## 🚀 Contribution Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/js-to-make.git
cd js-to-make
```

### 2. Create a Branch

```bash
git checkout -b feat/my-new-feature
# or
git checkout -b fix/bug-description
```

### 3. Make Changes

- Write your code
- Add tests if applicable
- Update documentation

### 4. Test Your Changes

```bash
# Run tests
deno test

# Check formatting
deno fmt --check

# Run linter
deno lint

# Test locally
deno task js-to-make
```

### 5. Commit Using Conventional Commits

```bash
# Example for a new feature
git add .
git commit -m "feat: add support for pnpm workspaces"

# Example for a bug fix
git add .
git commit -m "fix: handle edge case in version detection"

# Example for documentation
git add .
git commit -m "docs: improve README examples"
```

### 6. Push & Create Pull Request

```bash
git push origin feat/my-new-feature
```

Then create a Pull Request on GitHub.

## 🔍 Pull Request Guidelines

1. **Title**: Should follow conventional commit format
   - ✅ `feat: add new feature`
   - ❌ `My new feature`

2. **Description**: Clearly describe:
   - What changes were made
   - Why these changes were needed
   - Any breaking changes

3. **Tests**: Include tests for new features or bug fixes

4. **Documentation**: Update README or other docs if needed

## 🤖 Automated Checks

When you create a PR or push to main, GitHub Actions will automatically:

1. ✅ Run linter (`deno lint`)
2. ✅ Check code formatting (`deno fmt --check`)
3. ✅ Run all tests (`deno test`)
4. ✅ On merge to main: Analyze commits and create release if needed

## 📦 Release Process (Automatic)

When commits are pushed/merged to `main`:

1. **Semantic-release analyzes** commit messages since last release
2. **Determines version bump**:
   - `feat:` → Minor version (0.X.0)
   - `fix:` → Patch version (0.0.X)
   - `feat!:` or `BREAKING CHANGE:` → Major version (X.0.0)
3. **Updates** `deno.json` with new version
4. **Generates** CHANGELOG.md
5. **Creates** GitHub Release with release notes
6. **Publishes** to JSR automatically
7. **Comments** on related issues/PRs with release info

### Example Flow

```bash
# Current version: 1.2.3

# Developer commits:
git commit -m "feat: add new feature"
git push origin main

# Semantic-release automatically:
# - Bumps version to 1.3.0
# - Updates deno.json
# - Creates CHANGELOG entry
# - Creates GitHub Release v1.3.0
# - Publishes to JSR
# - Comments on related PRs/issues
```

## 💡 Tips

### Commit Often with Good Messages

Instead of one large commit:

```bash
# ❌ Bad
git commit -m "lots of changes"
```

Use multiple smaller commits:

```bash
# ✅ Good
git commit -m "feat: add CLI argument parsing"
git commit -m "test: add tests for argument parsing"
git commit -m "docs: document new CLI arguments"
```

### Use Scopes for Clarity

Scopes help organize commits by area:

```bash
git commit -m "feat(cli): add new flag"
git commit -m "fix(makefile): escape special chars"
git commit -m "docs(readme): update examples"
git commit -m "test(integration): add e2e tests"
```

### Amend Commits if Needed

Before pushing, you can amend your last commit:

```bash
git commit --amend -m "feat: corrected commit message"
```

## 🆘 Getting Help

- 📖 Read the [Conventional Commits](https://www.conventionalcommits.org/) specification
- 🐛 Report issues on [GitHub Issues](https://github.com/teamitfi/js-to-make/issues)
- 💬 Ask questions in pull requests
- 📚 Check existing commits for examples

## 📋 Checklist Before Submitting PR

- [ ] Code follows Deno conventions
- [ ] Tests pass (`deno test`)
- [ ] Code is formatted (`deno fmt`)
- [ ] Code is linted (`deno lint`)
- [ ] Commit messages follow conventional commits format
- [ ] Documentation is updated (if needed)
- [ ] PR title follows conventional commits format
- [ ] Breaking changes are clearly documented (if any)

## 🎉 Thank You!

Your contributions make this project better for everyone. Thank you for taking the time to contribute!

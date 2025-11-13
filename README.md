# js-to-make

A Deno CLI tool that automatically generates a Makefile from your `package.json` scripts.

## Features

- 🚀 **Auto-detect package manager** (npm, pnpm, yarn, or bun)
- 📝 **Generate Make targets** for all your package.json scripts
- 🎯 **Convenience aliases** (s→start, d→dev, b→build, t→test, l→lint, i→install)
- 🔄 **CI target**: Automatically runs install, lint, build, and test (if available)
- ⚡ **Fast and simple**: No dependencies, pure Deno

## Installation

### Option 1: Install from JSR (Recommended)

```bash
deno install -g -A --name js-to-make jsr:@teamitfi/js-to-make
```

Or with specific permissions:

```bash
deno install -g --allow-read --allow-write --name js-to-make jsr:@teamitfi/js-to-make
```

### Option 2: Run Directly from JSR

```bash
deno run -A jsr:@teamitfi/js-to-make
```

Or with specific permissions:

```bash
deno run --allow-read --allow-write jsr:@teamitfi/js-to-make
```

### Option 3: Clone and Install Locally

```bash
git clone https://github.com/teamitfi/js-to-make.git
cd js-to-make
deno task install
```

## Usage

Navigate to your project directory (where package.json is located) and run:

```bash
js-to-make
```

Or if running directly:

```bash
deno run --allow-read --allow-write main.ts
```

This will create a `Makefile` with targets for all your npm scripts.

### Options

- `--force` or `-f`: Overwrite existing Makefile
- `--help` or `-h`: Show help message

### Example

```bash
# Generate Makefile
js-to-make

# View available targets
make help

# Run your scripts with make
make dev       # runs npm run dev
make d         # alias for dev
make build     # runs npm run build
make b         # alias for build
make test      # runs npm run test
make t         # alias for test
```

## What Gets Generated

The Makefile includes:

1. **help** - Shows all available targets
2. **install** - Runs package manager install command
3. **ci** - Runs install, then lint/build/test if available
4. **Script targets** - One target per package.json script
5. **Aliases** - Short versions (s, d, b, t, l, i)

### Example Generated Makefile

```makefile
# Auto-generated Makefile — DO NOT EDIT
SHELL := /bin/bash
PKG_MANAGER := npm
RUN := npm run
INSTALL := npm i

.PHONY: help install ci i s d b t l dev build test

help:
	@echo "Project Makefile (package manager: npm)"
	@echo ""
	@echo "Usage: make <target>"
	...

install:
	npm i

ci:
	@echo "Running CI steps..."
	npm i
	npm run lint
	npm run build
	npm run test

# dev — npm run dev
dev:
	npm run dev

# alias: d -> dev
d: dev
```

## Permissions

This tool requires:
- `--allow-read`: To read package.json and check for lock files
- `--allow-write`: To create/overwrite the Makefile

## Development

```bash
# Format code
deno fmt

# Lint code
deno lint

# Run locally
deno task js-to-make

# Run tests
deno test
```

## Testing

The project includes comprehensive tests using Deno's built-in test framework. Tests are located in `main_test.ts` and verify:

- ✅ Basic Makefile generation from package.json
- ✅ Handling of colons in script names (e.g., `docker:build` → `docker-build`)
- ✅ Convenience aliases (s, d, b, t, l, i)
- ✅ CI target includes available steps (install, lint, build, test)
- ✅ All scripts from package.json are included
- ✅ `--force` flag overwrites existing Makefile
- ✅ Version scripts (version:patch, version:minor, version:major)
- ✅ Special targets (changelog, release)

Run tests:
```bash
deno test
```

## Issues Fixed from Original

The original Node.js version had several issues:

1. ❌ Used Node.js specific imports (`node:fs`, `node:path`)
2. ❌ Used `require.main === module` for entry point detection
3. ❌ Used `process.cwd()` and `process.argv`
4. ❌ Had string concatenation issues in Makefile generation
5. ❌ Missing proper error handling

All of these have been fixed in the Deno version:

1. ✅ Uses Deno standard library
2. ✅ Uses `import.meta.main` for entry point
3. ✅ Uses `Deno.cwd()` and `Deno.args`
4. ✅ Fixed string template issues
5. ✅ Proper async/await error handling

## Contributing

We welcome contributions! This project uses automated semantic versioning based on conventional commits.

- 📖 Read our [Contributing Guide](./CONTRIBUTING.md) for detailed instructions
- 🔄 Releases happen automatically when you push to `main`
- 📝 Use [conventional commits](https://www.conventionalcommits.org/) for your commit messages
- ✅ All PRs are automatically tested (lint, format, tests)

### Quick Start for Contributors

```bash
# Clone the repository
git clone https://github.com/teamitfi/js-to-make.git
cd js-to-make

# Make your changes
# ...

# Commit using conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"

# Push to your branch and create a PR
git push origin your-branch
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for commit message format and workflow details.

## Publishing

This project uses automated publishing to JSR via GitHub Actions:

- 🤖 **Automatic releases** on push to `main` (using semantic-release)
- 📦 Published to [JSR](https://jsr.io/@teamitfi/js-to-make)
- ⚙️ **First-time setup required**: See [SETUP.md](./SETUP.md) to link package to GitHub
- 📋 See [PUBLISHING.md](./PUBLISHING.md) for publishing details

## License

MIT

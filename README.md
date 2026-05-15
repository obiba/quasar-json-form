<img src="https://img.shields.io/npm/v/@obiba/quasar-ui-json-form.svg?label=@obiba/quasar-ui-json-form">
<img src="https://img.shields.io/npm/v/@obiba/quasar-app-extension-json-form.svg?label=@obiba/quasar-app-extension-json-form">

Compatible with Quasar UI v2 and Vue 3.

A Quasar app extension that renders dynamic, schema-driven forms based on a JSON Schema and an optional UI schema, using [JSON Forms](https://jsonforms.io/) renderers styled with Quasar components.

# Structure
* [/ui](ui) - standalone npm package

* [/app-extension](app-extension) - Quasar app extension

# Development

## Prerequisites
- Node.js >= 8.9.0
- npm >= 5.6.0 or yarn >= 1.6.0

## Setup

```bash
# Install all dependencies (uses npm link for local development)
make install

# Start development server
make dev

# Build packages
make build
```

**Note:** The `make install` command uses `npm link` to connect the UI package locally to the app-extension. This allows you to develop both packages together without needing to publish to npm first.

## Available Commands

```bash
make help                  # Show all available commands
make install               # Install all dependencies
make dev                   # Start development server
make build                 # Build all packages
make clean                 # Clean build artifacts and node_modules
```

## Release Process

This project uses **separate releases** for the UI package and app-extension since the app-extension depends on the UI package being published to npm.

### Release Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Release UI Package                                     │
├─────────────────────────────────────────────────────────────────┤
│ $ make release-ui-patch                                         │
│   → Bumps UI version: 0.0.1 → 0.0.2                           │
│   → Creates commit & tag: ui-v0.0.2                            │
│                                                                 │
│ $ git push origin master && git push origin ui-v0.0.2          │
│   → GitHub Action builds & publishes to npm                    │
│   → @obiba/quasar-ui-json-form@0.0.2 is now on npm ✓          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (Wait for npm ~1-2 min)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Release App Extension                                  │
├─────────────────────────────────────────────────────────────────┤
│ $ npm view @obiba/quasar-ui-json-form version                  │
│   → Verify: 0.0.2 ✓                                            │
│                                                                 │
│ $ make release-app-ext-patch                                   │
│   → Updates dependency: @obiba/quasar-ui-json-form: ^0.0.2    │
│   → Bumps app-ext version: 0.0.1 → 0.0.2                      │
│   → Creates commit & tag: app-ext-v0.0.2                       │
│                                                                 │
│ $ git push origin master && git push origin app-ext-v0.0.2     │
│   → GitHub Action publishes to npm                             │
│   → @obiba/quasar-app-extension-json-form@0.0.2 is on npm ✓   │
└─────────────────────────────────────────────────────────────────┘
```

### Tag Format

- UI package tags: `ui-v0.0.X`
- App Extension tags: `app-ext-v0.0.X`

### Creating a Release

**Step 1: Release the UI Package**

```bash
# For a patch release (0.0.X) - bug fixes
make release-ui-patch

# For a minor release (0.X.0) - new features
make release-ui-minor

# For a major release (X.0.0) - breaking changes
make release-ui-major
```

After running the command, push the tag:

```bash
git push origin master
git push origin ui-vX.X.X
```

**Step 2: Wait for npm Publication**

The GitHub Action will automatically build and publish the UI package to npm. Wait a few minutes and verify it's available:

```bash
npm view @obiba/quasar-ui-json-form version
```

**Step 3: Release the App Extension**

```bash
# Match the version type you used for UI
make release-app-ext-patch   # or release-app-ext-minor, release-app-ext-major
```

The command will:
- Ask you to confirm the UI version is published
- Update the dependency reference to the new UI version
- Bump the app-extension version
- Create the tag

Then push:

```bash
git push origin master
git push origin app-ext-vX.X.X
```

### What Happens Automatically

When you push a tag, the GitHub Action will:

- **UI tag (`ui-v*`)**: Builds the UI package and publishes `@obiba/quasar-ui-json-form` to npm
- **App Extension tag (`app-ext-v*`)**: Publishes `@obiba/quasar-app-extension-json-form` to npm (using the UI package from npm)

### Prerequisites for Publishing

Before your first release, you need to:

1. **Set up npm authentication**:
   - Create an npm account and get publish access to the `@obiba` scope
   - Generate an npm access token (Automation type) from [npmjs.com](https://www.npmjs.com/settings/~/tokens)
   - Add it as a repository secret in GitHub:
     - Go to: Settings → Secrets and variables → Actions → New repository secret
     - Name: `NPM_TOKEN`
     - Value: your npm token

2. **Verify you're on a clean working directory**:
   ```bash
   git status  # Should show no uncommitted changes
   ```

### Manual Release (Alternative)

If you prefer to do it manually:

**For UI Package:**
```bash
# 1. Update UI version
cd ui && npm version patch && cd ..

# 2. Commit and tag
git add ui/package.json
git commit -m "chore: bump UI version to X.X.X"
git tag ui-vX.X.X
git push origin master
git push origin ui-vX.X.X
```

**For App Extension (after UI is published):**
```bash
# 1. Update dependency and version
# Edit app-extension/package.json:
#   - "dependencies": { "@obiba/quasar-ui-json-form": "^X.X.X" }
#   - "version": "X.X.X"

# 2. Commit and tag
git add app-extension/package.json
git commit -m "chore: bump app-extension version to X.X.X"
git tag app-ext-vX.X.X
git push origin master
git push origin app-ext-vX.X.X
```

## Project Structure

```
.
├── ui/                          # UI Components Package
│   ├── src/                     # Source components
│   ├── dist/                    # Built artifacts
│   └── package.json            # @obiba/quasar-ui-json-form
│
├── app-extension/              # Quasar App Extension
│   └── package.json           # @obiba/quasar-app-extension-json-form
│
├── .github/
│   └── workflows/
│       ├── ci.yaml            # CI builds on push/PR
│       └── release.yaml       # Publish to npm on tags
│
└── Makefile                   # Development commands
```

## Quick Reference

### Development
```bash
make install    # First time setup (uses npm link for local dev)
make dev        # Start dev server
make build      # Build packages
```

### Release Checklist
```bash
# 1. Release UI
make release-ui-patch
git push origin master && git push origin ui-vX.X.X

# 2. Wait & verify
npm view @obiba/quasar-ui-json-form version

# 3. Release App Extension
make release-app-ext-patch
git push origin master && git push origin app-ext-vX.X.X
```

# Donate
If you appreciate the work that went into this project, please consider [donating to Quasar](https://donate.quasar.dev).

# License
MIT (c) Yannick Marcon <yannick.marcon@obiba.org>

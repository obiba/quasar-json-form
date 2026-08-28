<img src="https://img.shields.io/npm/v/@obiba/quasar-ui-json-form.svg?label=@obiba/quasar-ui-json-form">
<img src="https://img.shields.io/npm/v/@obiba/quasar-app-extension-json-form.svg?label=@obiba/quasar-app-extension-json-form">

Compatible with Quasar UI v2 and Vue 3.

A Quasar app extension that renders dynamic, schema-driven forms based on a JSON Schema and an optional UI schema, using [JSON Forms](https://jsonforms.io/) renderers styled with Quasar components.

# Structure
* [/ui](ui) - standalone npm package

* [/app-extension](app-extension) - Quasar app extension

# Development

## Prerequisites
- Node.js >= 22.12 (required by `@quasar/app-vite` v3)
- npm >= 10

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

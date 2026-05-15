.PHONY: help install build dev clean release-ui-patch release-ui-minor release-ui-major release-app-ext-patch release-app-ext-minor release-app-ext-major

# Default target
help:
	@echo "Quasar JSON Form - Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install              - Install all dependencies"
	@echo "  make dev                  - Start development server"
	@echo "  make build                - Build all packages"
	@echo "  make clean                - Clean build artifacts and node_modules"
	@echo ""
	@echo "Release UI Package (publish first):"
	@echo "  make release-ui-patch     - Bump UI patch version (0.0.X) and create release"
	@echo "  make release-ui-minor     - Bump UI minor version (0.X.0) and create release"
	@echo "  make release-ui-major     - Bump UI major version (X.0.0) and create release"
	@echo ""
	@echo "Release App Extension (publish after UI is on npm):"
	@echo "  make release-app-ext-patch - Bump App Extension patch version (0.0.X) and create release"
	@echo "  make release-app-ext-minor - Bump App Extension minor version (0.X.0) and create release"
	@echo "  make release-app-ext-major - Bump App Extension major version (X.0.0) and create release"
	@echo ""

# Install dependencies
install:
	@echo "Installing UI package dependencies..."
	cd ui && npm install
	@echo "Installing UI dev app dependencies..."
	cd ui/dev && npm install
	@echo "✓ All dependencies installed"
	
# Development server
dev:
	@echo "Starting development server..."
	cd ui && npm run dev

# Build all packages
build:
	@echo "Building UI package..."
	cd ui && npm run build
	@echo "✓ Build complete"

# Clean artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf ui/dist
	rm -rf ui/node_modules
	rm -rf ui/dev/node_modules
	rm -rf app-extension/node_modules
	@echo "✓ Clean complete"

# Release UI package commands
release-ui-patch:
	@$(MAKE) _release-ui VERSION_TYPE=patch

release-ui-minor:
	@$(MAKE) _release-ui VERSION_TYPE=minor

release-ui-major:
	@$(MAKE) _release-ui VERSION_TYPE=major

# Release App Extension commands
release-app-ext-patch:
	@$(MAKE) _release-app-ext VERSION_TYPE=patch

release-app-ext-minor:
	@$(MAKE) _release-app-ext VERSION_TYPE=minor

release-app-ext-major:
	@$(MAKE) _release-app-ext VERSION_TYPE=major

# Internal release target for UI package
_release-ui:
	@echo "=== Starting UI $(VERSION_TYPE) release ==="
	@echo ""
	@# Check if working directory is clean
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "❌ Error: Working directory is not clean. Commit or stash your changes first."; \
		exit 1; \
	fi
	@# Check if on master branch
	@CURRENT_BRANCH=$$(git branch --show-current); \
	if [ "$$CURRENT_BRANCH" != "master" ]; then \
		echo "⚠️  Warning: You are on branch '$$CURRENT_BRANCH', not 'master'"; \
		printf "Continue? (y/N) "; \
		read -r REPLY; \
		case "$$REPLY" in \
			[Yy]|[Yy][Ee][Ss]) ;; \
			*) echo "Release cancelled."; exit 1 ;; \
		esac; \
	fi
	@# Bump version in UI package
	@echo "Bumping UI package version ($(VERSION_TYPE))..."
	@cd ui && npm version $(VERSION_TYPE) --no-git-tag-version
	@NEW_VERSION=$$(node -p "require('./ui/package.json').version"); \
	echo "New UI version: $$NEW_VERSION"; \
	echo ""; \
	echo "Committing UI version change..."; \
	git add ui/package.json ui/package-lock.json; \
	git commit -m "chore: bump UI version to $$NEW_VERSION"; \
	echo ""; \
	echo "Creating tag ui-v$$NEW_VERSION..."; \
	git tag "ui-v$$NEW_VERSION"; \
	echo ""; \
	echo "=== UI Release prepared ==="; \
	echo ""; \
	echo "To complete the UI release, run:"; \
	echo "  git push origin master"; \
	echo "  git push origin ui-v$$NEW_VERSION"; \
	echo ""; \
	echo "This will trigger the GitHub Action to build and publish the UI package to npm."; \
	echo ""; \
	echo "⚠️  IMPORTANT: After the UI package is published to npm, update the"; \
	echo "app-extension dependency and release it separately with:"; \
	echo "  make release-app-ext-$(VERSION_TYPE)"; \
	echo ""; \
	echo "To cancel this release, run:"; \
	echo "  git reset --hard HEAD~1"; \
	echo "  git tag -d ui-v$$NEW_VERSION"

# Internal release target for App Extension
_release-app-ext:
	@echo "=== Starting App Extension $(VERSION_TYPE) release ==="
	@echo ""
	@# Check if working directory is clean
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "❌ Error: Working directory is not clean. Commit or stash your changes first."; \
		exit 1; \
	fi
	@# Check if on master branch
	@CURRENT_BRANCH=$$(git branch --show-current); \
	if [ "$$CURRENT_BRANCH" != "master" ]; then \
		echo "⚠️  Warning: You are on branch '$$CURRENT_BRANCH', not 'master'"; \
		printf "Continue? (y/N) "; \
		read -r REPLY; \
		case "$$REPLY" in \
			[Yy]|[Yy][Ee][Ss]) ;; \
			*) echo "Release cancelled."; exit 1 ;; \
		esac; \
	fi
	@# Get current UI version
	@UI_VERSION=$$(node -p "require('./ui/package.json').version"); \
	echo "Current UI package version: $$UI_VERSION"; \
	echo ""; \
	printf "Is this UI version published to npm? (y/N) "; \
	read -r REPLY; \
	case "$$REPLY" in \
		[Yy]|[Yy][Ee][Ss]) ;; \
		*) \
			echo "❌ Error: Please publish the UI package first."; \
			echo "Run: make release-ui-$(VERSION_TYPE)"; \
			exit 1 ;; \
	esac; \
	echo "Updating app-extension dependency to ^$$UI_VERSION..."; \
	(cd app-extension && npm pkg set dependencies.@obiba/quasar-ui-json-form="^$$UI_VERSION"); \
	echo "Bumping app-extension version ($(VERSION_TYPE))..."; \
	(cd app-extension && npm version $(VERSION_TYPE) --no-git-tag-version); \
	echo "Updating app-extension lock file..."; \
	(cd app-extension && npm install --package-lock-only); \
	NEW_VERSION=$$(node -p "require('./app-extension/package.json').version"); \
	echo "New app-extension version: $$NEW_VERSION"; \
	echo ""; \
	echo "Committing app-extension changes..."; \
	git add app-extension/package.json app-extension/package-lock.json; \
	git commit -m "chore: bump app-extension version to $$NEW_VERSION"; \
	echo ""; \
	echo "Creating tag app-ext-v$$NEW_VERSION..."; \
	git tag "app-ext-v$$NEW_VERSION"; \
	echo ""; \
	echo "=== App Extension Release prepared ==="; \
	echo ""; \
	echo "To complete the app-extension release, run:"; \
	echo "  git push origin master"; \
	echo "  git push origin app-ext-v$$NEW_VERSION"; \
	echo ""; \
	echo "This will trigger the GitHub Action to publish the app-extension to npm."; \
	echo ""; \
	echo "To cancel this release, run:"; \
	echo "  git reset --hard HEAD~1"; \
	echo "  git tag -d app-ext-v$$NEW_VERSION"

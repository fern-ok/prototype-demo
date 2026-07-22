# Vendor Packages

This directory stores package artifacts that are copied into `axhub-make` so the app can run and be published without relying on monorepo `workspace:*` dependencies.

Source packages remain in the monorepo `packages/` directory for development. Run `pnpm vendor:sync` in `apps/axhub-make` to rebuild configured source packages and refresh the vendored artifacts here.

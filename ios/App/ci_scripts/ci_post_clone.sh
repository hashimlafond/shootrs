#!/bin/sh
set -eu

echo "Installing Shootr web dependencies for Xcode Cloud..."

if [ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ]; then
  cd "$CI_PRIMARY_REPOSITORY_PATH"
else
  cd "$(dirname "$0")/../../.."
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable
fi

if ! command -v pnpm >/dev/null 2>&1; then
  npm install --global pnpm
fi

pnpm install --frozen-lockfile
pnpm run ios:sync:testflight

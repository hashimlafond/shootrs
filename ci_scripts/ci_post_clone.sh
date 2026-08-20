#!/bin/sh
set -eu

echo "Installing Shootr web dependencies for Xcode Cloud..."

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if [ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ]; then
  cd "$CI_PRIMARY_REPOSITORY_PATH"
else
  cd "$(dirname "$0")/.."
fi

if ! command -v npm >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    brew install node
  else
    echo "Neither npm nor Homebrew is available in this Xcode Cloud environment."
    exit 127
  fi
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable
fi

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    brew install pnpm
  else
    npm install --global pnpm
  fi
fi

pnpm install --frozen-lockfile
pnpm run ios:sync:testflight

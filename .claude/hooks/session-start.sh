#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs the headless app's dependencies and builds it so the app can be
# run, type-checked, and tested as soon as the session starts.
set -euo pipefail

# Only needed in the remote (web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR/app"

# Idempotent: safe to re-run. Prefer install (cache-friendly) over ci.
npm install --no-audit --no-fund

# Compile TypeScript — this is the project's type-check / build gate.
npm run build

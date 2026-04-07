#!/usr/bin/env bash
# =============================================================================
# sync-env.sh — Populate each service's .env based on the current git branch.
#
# Branch        Source file per service
# ──────────    ──────────────────────────────────────────────────────────────
# test          .env.staging
# master        .env.production
# anything else .env.develop
#
# Each file is gitignored and maintained locally. Set them up once:
#   cp <service>/.env.example <service>/.env.develop    # fill in local values
#   cp <service>/.env.example <service>/.env.staging    # fill in staging values
#   cp <service>/.env.example <service>/.env.production # fill in prod values
#
# Usage:
#   bash scripts/sync-env.sh   # run manually
#   pnpm sync-env              # npm script alias
#   (runs automatically on git checkout via .githooks/post-checkout)
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

success() { echo -e "${GREEN}[sync-env] ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}[sync-env] ⚠${RESET} $*"; }

# ── Branch → env file suffix ──────────────────────────────────────────────────
BRANCH=$(git -C "$ROOT_DIR" branch --show-current 2>/dev/null || echo "unknown")

if [[ "$BRANCH" == "test" ]]; then
  ENV_SUFFIX="staging"
elif [[ "$BRANCH" == "master" ]]; then
  ENV_SUFFIX="production"
else
  ENV_SUFFIX="develop"
fi

echo ""
echo -e "${BOLD}[sync-env] Branch: ${CYAN}${BRANCH}${RESET}  →  ${CYAN}.env.${ENV_SUFFIX}${RESET}"
echo ""

# ── Copy per service ──────────────────────────────────────────────────────────
copy_env() {
  local service="$1"
  local src="$ROOT_DIR/$service/.env.${ENV_SUFFIX}"
  local dst="$ROOT_DIR/$service/.env"

  if [[ -f "$src" ]]; then
    cp "$src" "$dst"
    success "$service → .env.${ENV_SUFFIX}"
  else
    warn "$service → .env.${ENV_SUFFIX} not found."
    warn "  Create it: cp $service/.env.example $service/.env.${ENV_SUFFIX}"
  fi
}

copy_env "nudgenest"
copy_env "review-ui"
copy_env "nudge-nest-landing"
copy_env "nudgenest-shpfy-app"

echo ""
success "Done."
echo ""

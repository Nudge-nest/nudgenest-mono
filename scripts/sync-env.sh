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
# If .env.staging or .env.production doesn't exist it is auto-generated from
# .env.develop with the known service URLs substituted. Secret values (API keys,
# DB URLs) are carried over from .env.develop and flagged for manual update.
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

# ── Apply URL substitutions for a given environment ───────────────────────────
substitute_urls() {
  local file="$1"
  local suffix="$2"

  if [[ "$suffix" == "staging" ]]; then
    sed -i.bak \
      -e 's|^REVIEW_UI_BASE_URL=.*|REVIEW_UI_BASE_URL=https://review-staging.nudgenest.io|' \
      -e 's|^VITE_APP_REVIEW_UI_URL=.*|VITE_APP_REVIEW_UI_URL=https://review-staging.nudgenest.io|' \
      -e 's|^VITE_APP_BACKEND_HOST=.*|VITE_APP_BACKEND_HOST=https://api-staging.nudgenest.io/api/v1/|' \
      -e 's|^NUDGENEST_BACKEND_URL=.*|NUDGENEST_BACKEND_URL=https://api-staging.nudgenest.io|' \
      -e 's|^SHOPIFY_APP_URL=.*|SHOPIFY_APP_URL=https://nudgenest-shopify-1094805904049.europe-west1.run.app|' \
      "$file"
  elif [[ "$suffix" == "production" ]]; then
    sed -i.bak \
      -e 's|^REVIEW_UI_BASE_URL=.*|REVIEW_UI_BASE_URL=https://reviews.nudgenest.io|' \
      -e 's|^VITE_APP_REVIEW_UI_URL=.*|VITE_APP_REVIEW_UI_URL=https://reviews.nudgenest.io|' \
      -e 's|^VITE_APP_BACKEND_HOST=.*|VITE_APP_BACKEND_HOST=https://api.nudgenest.io/api/v1/|' \
      -e 's|^NUDGENEST_BACKEND_URL=.*|NUDGENEST_BACKEND_URL=https://api.nudgenest.io|' \
      -e 's|^SHOPIFY_APP_URL=.*|SHOPIFY_APP_URL=https://merchant.nudgenest.io|' \
      "$file"
  fi
  rm -f "$file.bak"
}

# ── Bootstrap missing env file from .env.develop ──────────────────────────────
bootstrap() {
  local service="$1"
  local suffix="$2"
  local dir="$ROOT_DIR/$service"
  local target="$dir/.env.${suffix}"
  local develop="$dir/.env.develop"

  [[ -f "$target" ]] && return 0   # already exists

  if [[ ! -f "$develop" ]]; then
    warn "$service → .env.develop missing, cannot bootstrap .env.${suffix}"
    warn "  Create it: cp $service/.env.example $service/.env.develop"
    return 0
  fi

  cp "$develop" "$target"
  substitute_urls "$target" "$suffix"

  # Prepend a header warning
  local tmp
  tmp=$(mktemp)
  {
    echo "# Auto-bootstrapped from .env.develop by sync-env.sh (${suffix})"
    echo "# URLs updated automatically. Update secret values before using on ${suffix}:"
    echo "#   DATABASE_URL, SHOPIFY_API_SECRET, SHOPIFY_API_KEY, RESEND_API_KEY,"
    echo "#   RESEND_FROM_EMAIL, ANTHROPIC_API_KEY, SENTRY_BACKEND_DSN,"
    echo "#   VITE_APP_SENTRY_FE_DSN, VITE_APP_DEMO_MERCHANT_ID"
    echo ""
    cat "$target"
  } > "$tmp" && mv "$tmp" "$target"

  warn "$service → .env.${suffix} auto-created (URLs set, secrets need updating)"
}

# ── Copy env file to .env ─────────────────────────────────────────────────────
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

# ── Main ──────────────────────────────────────────────────────────────────────
SERVICES=("nudgenest" "review-ui" "nudge-nest-landing" "nudgenest-shpfy-app")

# Bootstrap missing staging/production files if needed
if [[ "$ENV_SUFFIX" != "develop" ]]; then
  for service in "${SERVICES[@]}"; do
    bootstrap "$service" "$ENV_SUFFIX"
  done
  echo ""
fi

# Copy the right file to .env for each service
for service in "${SERVICES[@]}"; do
  copy_env "$service"
done

echo ""
success "Done."
echo ""

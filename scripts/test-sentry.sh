#!/usr/bin/env bash
# Nudgenest Sentry smoke test — verifies all three apps deliver events to Sentry.
# Run with all three dev servers already started:
#   pnpm backend:dev   (terminal 1)
#   pnpm shopify:dev   (terminal 2)
#   pnpm frontend:dev  (terminal 3)
#
# Override ports with env vars:
#   BACKEND_URL=http://localhost:50001 SHOPIFY_URL=http://localhost:53317 ./scripts/test-sentry.sh

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:50001}"
SHOPIFY_URL="${SHOPIFY_URL:-http://localhost:53317}"
REVIEW_UI_URL="${REVIEW_UI_URL:-http://localhost:3001}"

echo ""
echo "🔍  Nudgenest Sentry smoke tests"
echo "=================================="

# ── 1. Backend ────────────────────────────────────────────────────────────────
echo ""
echo "1/3  Backend  ($BACKEND_URL)"
BACKEND_OK=true
BACKEND_RESP=$(curl -sf --max-time 5 "$BACKEND_URL/api/v1/sentry-test" 2>&1) || BACKEND_OK=false
if [[ "$BACKEND_OK" == "true" ]]; then
    echo "     ✅  $BACKEND_RESP"
else
    echo "     ❌  Could not reach backend — is 'pnpm backend:dev' running?"
    echo "         Also confirm SENTRY_BACKEND_DSN is set in nudgenest/.env"
fi

# ── 2. Shopify App ────────────────────────────────────────────────────────────
echo ""
echo "2/3  Shopify App  ($SHOPIFY_URL)"
SHOPIFY_OK=true
SHOPIFY_RESP=$(curl -sf --max-time 5 "$SHOPIFY_URL/sentry-test" 2>&1) || SHOPIFY_OK=false
if [[ "$SHOPIFY_OK" == "true" ]]; then
    echo "     ✅  $SHOPIFY_RESP"
else
    echo "     ❌  Could not reach Shopify app — is 'pnpm shopify:dev' running?"
    echo "         Also confirm SENTRY_SHOPIFY_DSN is set in nudgenest-shpfy-app/.env"
fi

# ── 3. Review UI ──────────────────────────────────────────────────────────────
echo ""
echo "3/3  Review UI  ($REVIEW_UI_URL)"
TEST_URL="$REVIEW_UI_URL/?sentry-test"
if command -v open &>/dev/null; then        # macOS
    open "$TEST_URL"
elif command -v xdg-open &>/dev/null; then  # Linux
    xdg-open "$TEST_URL"
else
    echo "     ℹ️   Open manually: $TEST_URL"
fi
echo "     ✅  Opened $TEST_URL in browser — check Sentry for the event"
echo "         (Confirm VITE_APP_SENTRY_FE_DSN is set in review-ui/.env)"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "=================================="
echo "Done. Check each Sentry project for the [sentry-test] events:"
echo "  https://byteminds.sentry.io/issues/"
echo ""

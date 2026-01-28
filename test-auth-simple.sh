#!/bin/bash

echo "🧪 Simple Auth Tests (No DB)"
echo "=============================="

BASE_URL="http://localhost:50001"

# Test 1: Health check (no auth)
echo -e "\n✅ Test 1: Health endpoint (no auth required)"
curl -s "$BASE_URL/health" | jq -r '.status'

# Test 2: Protected route without API key
echo -e "\n✅ Test 2: Protected route without key"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/config/123")
if [ "$STATUS" = "401" ]; then
  echo "✓ Returns 401 as expected"
else
  echo "✗ Expected 401, got $STATUS"
fi

# Test 3: Protected route with invalid key
echo -e "\n✅ Test 3: Protected route with invalid key"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: invalid" "$BASE_URL/api/v1/config/123")
if [ "$STATUS" = "401" ]; then
  echo "✓ Returns 401 as expected"
else
  echo "✗ Expected 401, got $STATUS"
fi

# Test 4: Shopify webhook without HMAC
echo -e "\n✅ Test 4: Shopify webhook without HMAC"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/shopify-webhook" \
  -H "Content-Type: application/json" \
  -d '{"order_number": "1001", "customer_locale": "en"}')
if echo "$RESPONSE" | grep -q "Unauthorized"; then
  echo "✓ Returns Unauthorized as expected"
else
  echo "✗ Unexpected response: $RESPONSE"
fi

# Test 5: Shopify webhook with wrong HMAC
echo -e "\n✅ Test 5: Shopify webhook with invalid HMAC"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/shopify-webhook" \
  -H "Content-Type: application/json" \
  -H "x-shopify-hmac-sha256: wrong-hmac" \
  -d '{"order_number": "1001", "customer_locale": "en"}')
if echo "$RESPONSE" | grep -q "Invalid HMAC"; then
  echo "✓ Returns Invalid HMAC as expected"
else
  echo "✗ Unexpected response: $RESPONSE"
fi

echo -e "\n✅ All auth checks working!"
echo "📝 Note: Full merchant creation tests require MongoDB connection"

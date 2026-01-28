#!/bin/bash

# Quick auth testing script with cleanup
echo "🧪 Testing Authentication Implementation"
echo "========================================="

BASE_URL="http://localhost:50001"
CLEANUP_IDS=()

cleanup() {
  if [ ${#CLEANUP_IDS[@]} -gt 0 ]; then
    echo -e "\n🧹 Cleaning up test merchants..."
    for id in "${CLEANUP_IDS[@]}"; do
      # Note: Would need a delete endpoint - for now just log
      echo "  - Test merchant: $id (manual cleanup needed)"
    done
  fi
}

trap cleanup EXIT

# Test 1: Health check (no auth required)
echo -e "\n1️⃣ Health check (no auth):"
curl -s "$BASE_URL/health" | jq '.'

# Test 2: Create merchant (no auth required, returns API key)
echo -e "\n2️⃣ Create merchant:"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/merchants" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "test-shop-'$(date +%s)'",
    "domains": "test.myshopify.com",
    "currencyCode": "USD",
    "email": "test'$(date +%s)'@test.com",
    "name": "Test Shop '$(date +%s)'",
    "businessInfo": "test-business-'$(date +%s)'",
    "address": {
      "address1": "123 Test St",
      "address2": "",
      "city": "Test City",
      "country": "US",
      "formatted": {},
      "zip": "12345"
    }
  }')

echo "$RESPONSE" | jq '.'
API_KEY=$(echo "$RESPONSE" | jq -r '.data.merchant.apiKey')
MERCHANT_ID=$(echo "$RESPONSE" | jq -r '.data.merchant.id')
CLEANUP_IDS+=("$MERCHANT_ID")

echo -e "\n📝 Generated API Key: $API_KEY"
echo "📝 Merchant ID: $MERCHANT_ID"

# Test 3: Access protected route without API key (should fail)
echo -e "\n3️⃣ Get configs without API key (should fail 401):"
curl -s "$BASE_URL/api/v1/config/$MERCHANT_ID" | jq '.'

# Test 4: Access protected route with invalid API key (should fail)
echo -e "\n4️⃣ Get configs with invalid API key (should fail 401):"
curl -s "$BASE_URL/api/v1/config/$MERCHANT_ID" \
  -H "x-api-key: invalid-key" | jq '.'

# Test 5: Access protected route with valid API key (should work)
echo -e "\n5️⃣ Get configs with valid API key (should work):"
curl -s "$BASE_URL/api/v1/config/$MERCHANT_ID" \
  -H "x-api-key: $API_KEY" | jq '.'

# Test 6: Shopify webhook without HMAC (should fail)
echo -e "\n6️⃣ Shopify webhook without HMAC (should fail 401):"
curl -s -X POST "$BASE_URL/api/v1/shopify-webhook" \
  -H "Content-Type: application/json" \
  -d '{"order_number": "1001", "customer_locale": "en"}' | jq '.'

echo -e "\n✅ Testing complete!"
echo "📝 Note: Delete test merchants manually from MongoDB if needed"

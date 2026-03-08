# Billing Integration Test Plan

## Prerequisites
- ✅ Backend code updated with API key in verification response
- ✅ ENTERPRISE plan removed from database
- ✅ Plan pricing updated ("Loox Killer" pricing)
- ✅ Email limits set to 5x review requests
- ⏳ Backend server running on port 3000
- ⏳ Shopify app running with `shopify app dev`

## Test Environment
- Backend URL: `https://3675-81-197-250-129.ngrok-free.app/api/v1`
- Shopify App: Development store
- Test Mode: Enabled (no real charges)

---

## Test 1: Initial Dashboard Load (FREE Plan)

### Steps:
1. Start backend: `cd nudgenest && pnpm dev`
2. Start Shopify app: `cd nudgenest-shpfy-app && shopify app dev`
3. Open app in Shopify admin
4. Complete registration if needed

### Expected Results:
- ✅ Console shows: `Using API key: Present`
- ✅ Console shows: `Subscription details fetched: {object with subscription data}`
- ✅ Dashboard loads without errors
- ✅ FREE plan displays with "Current" badge
- ✅ Other plans (STARTER, GROWTH, PRO) show "Select Plan" buttons
- ✅ Usage stats show 0/25 review requests

### Logs to Check:
```
Fetching data for merchant ID: <merchantId>
Using API key: Present
Plans response status: 200
Filtered plans (no ENTERPRISE): 4
Subscription details fetched: {subscription object}
Dashboard - subscriptionDetails: {object}
Dashboard - allPlans: [array of 4 plans]
```

---

## Test 2: Upgrade from FREE to STARTER

### Steps:
1. On dashboard, scroll to "Billing & Usage" card
2. Click "Select Plan" button on STARTER plan
3. Should redirect to Shopify approval page
4. Click "Approve" on Shopify billing page

### Expected Results:
- ✅ Processing message appears: "Processing your billing request..."
- ✅ Redirects to Shopify approval page
- ✅ Shopify shows: "Starter Plan - $4.99/month"
- ✅ After approval, redirects back to dashboard
- ✅ Toast message: "✅ Successfully upgraded to STARTER plan!"
- ✅ STARTER plan now shows "Current" badge
- ✅ Usage stats show 0/300 review requests

### API Calls to Verify:
1. `POST /api/billing/request` with `planTier: "STARTER"`
   - Response: `{success: true, confirmationUrl: "...", planTier: "STARTER"}`

2. Shopify charge approval (happens in Shopify admin)

3. `GET /api/billing/callback?plan=STARTER&charge_id=...`
   - Redirects to: `/app/dashboard?billing_status=success&plan=STARTER`

4. `POST https://.../api/v1/billing/sync-shopify`
   - Body: `{merchantId, shopId, planTier: "STARTER", status: "ACTIVE", ...}`
   - Response: `200 OK`

### Backend Logs to Check:
```
Syncing Shopify subscription
merchantId: <id>
planTier: STARTER
status: ACTIVE
```

### Database to Verify:
```sql
-- Check subscription was created/updated
SELECT * FROM subscriptions WHERE merchantId = '<merchantId>';
-- Should show planId for STARTER, status ACTIVE
```

---

## Test 3: Plan Change (STARTER → GROWTH)

### Steps:
1. From STARTER plan, click "Select Plan" on GROWTH plan
2. Approve charge in Shopify

### Expected Results:
- ✅ Previous STARTER subscription is cancelled
- ✅ New GROWTH charge is created ($12.99/month)
- ✅ After approval, GROWTH shows as "Current"
- ✅ Usage stats show 0/1000 review requests
- ✅ Toast: "✅ Successfully upgraded to GROWTH plan!"

### Notes:
- Proration should be enabled (line 67 in api.billing.request.ts)
- Old subscription cancelled before new one created

---

## Test 4: Downgrade (GROWTH → FREE)

### Steps:
1. From GROWTH plan, click "Select Plan" on FREE plan
2. No Shopify approval needed (FREE is free)

### Expected Results:
- ✅ No redirect to Shopify (FREE doesn't require approval)
- ✅ Page reloads automatically
- ✅ FREE plan shows "Current" badge
- ✅ Usage stats show 0/25 review requests
- ✅ Previous GROWTH subscription cancelled in backend

### API Call:
```
POST /api/billing/request
Body: {planTier: "FREE"}
Response: {success: true, message: "Downgrading to FREE plan - no charge required", planTier: "FREE"}
```

---

## Test 5: Payment Failure/Decline

### Steps:
1. Click upgrade to STARTER
2. On Shopify approval page, click "Decline"

### Expected Results:
- ✅ Redirects back to dashboard
- ✅ Toast message: "❌ Billing charge was declined. Please try again."
- ✅ Current plan unchanged (still FREE)
- ✅ No subscription created in backend

### URL After Decline:
```
/app/dashboard?billing_status=declined
```

---

## Test 6: Already Subscribed to Same Plan

### Steps:
1. Currently on STARTER plan
2. Click "Select Plan" on STARTER again

### Expected Results:
- ✅ Alert: "Already subscribed to this plan"
- ✅ No redirect to Shopify
- ✅ No new charge created

---

## Test 7: Invalid Plan Tier

### Manual Test (use browser console):
```javascript
fetch('/api/billing/request', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({planTier: 'INVALID'})
}).then(r => r.json()).then(console.log)
```

### Expected Results:
- ✅ Response: `{error: "Invalid plan tier"}`, status 400

---

## Test 8: Backend Sync Failure

### Simulate:
- Stop backend server
- Upgrade from FREE to STARTER
- Approve charge

### Expected Results:
- ✅ Shopify charge still created
- ✅ Dashboard shows success (doesn't fail entire flow)
- ✅ Console error: "Error syncing with backend"
- ⚠️ Backend subscription not created (will need manual sync later)

---

## Test 9: Webhook Handling (APP_SUBSCRIPTIONS_UPDATE)

### Trigger:
- Subscribe to STARTER plan
- Wait for Shopify to send `APP_SUBSCRIPTIONS_UPDATE` webhook

### Expected Results:
- ✅ Webhook received at `/webhooks/app/subscriptions/update`
- ✅ Backend `/billing/sync-shopify` called with webhook data
- ✅ Subscription status updated if changed

### Check Webhook Logs:
```
Received APP_SUBSCRIPTIONS_UPDATE webhook
Syncing with Nudgenest backend
Status: ACTIVE
```

---

## Test 10: Usage Limits Display

### Steps:
1. On STARTER plan (300 review requests/month)
2. Simulate usage in backend database:
   ```sql
   -- Add usage stats for current month
   INSERT INTO usage_stats (merchantId, metricType, value, periodStart, periodEnd)
   VALUES ('<merchantId>', 'REVIEW_REQUEST', 150, '2024-02-01', '2024-02-28');
   ```
3. Reload dashboard

### Expected Results:
- ✅ Review Requests: 150 / 300
- ✅ Progress bar at 50%
- ✅ Progress bar color: green (success tone)

### Test High Usage (>90%):
```sql
UPDATE usage_stats SET value = 280 WHERE metricType = 'REVIEW_REQUEST';
```
- ✅ Progress bar at 93%
- ✅ Progress bar color: red (critical tone)

---

## Test 11: Plan Limits Enforcement

### Steps:
1. On FREE plan (25 requests/month)
2. Make 25 review requests via API
3. Try to make 26th request

### Expected Results:
- ✅ 26th request blocked by backend
- ✅ Error: "Monthly review request limit reached"
- ✅ Dashboard shows 25/25 usage

---

## Error Scenarios to Test

### 1. Missing API Key
- Already fixed, but verify logs show "Using API key: Present"

### 2. Malformed Backend URL
- Check .env has correct NUDGENEST_BACKEND_URL
- No double slashes in URLs

### 3. Backend Down
- Graceful error handling
- Dashboard shows cached/stale data or empty state

### 4. Shopify API Failure
- Mock Shopify billing.request() failure
- User sees error message, can retry

---

## Performance Tests

### Dashboard Load Time:
- ✅ Initial load: < 2 seconds
- ✅ Subscription fetch: < 500ms
- ✅ Plans fetch: < 300ms

### Billing Request:
- ✅ Create charge: < 1 second
- ✅ Redirect to Shopify: immediate

### Callback Processing:
- ✅ Verify charge: < 500ms
- ✅ Backend sync: < 1 second
- ✅ Total callback time: < 2 seconds

---

## Security Tests

### 1. Unauthorized Access
```bash
# Try to access billing without auth
curl -X POST http://localhost:3000/api/v1/billing/sync-shopify \
  -H "Content-Type: application/json" \
  -d '{"merchantId":"test","shopId":"test.myshopify.com","planTier":"PRO","status":"ACTIVE"}'
```
- ✅ Expected: 401 Unauthorized (if x-api-key not provided)

### 2. Invalid API Key
```bash
curl -X POST http://localhost:3000/api/v1/billing/sync-shopify \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d '{"merchantId":"test","shopId":"test.myshopify.com","planTier":"PRO","status":"ACTIVE"}'
```
- ✅ Expected: 401 Unauthorized

---

## Rollback Plan

If billing breaks in production:

1. **Quick Fix**: Revert to previous deployment
2. **Disable Billing**: Add feature flag to disable billing UI
3. **Manual Subscription**: Create subscriptions directly in database
4. **Support Process**: Document manual subscription creation for support team

---

## Known Issues / Technical Debt

1. ❌ FREE plan downgrade uses `window.location.reload()` - should use revalidator
2. ⚠️ Backend sync failures are silent (only logged, not alerted)
3. ⚠️ No retry mechanism for failed backend syncs
4. ⚠️ Usage stats caching not implemented (5min TTL planned)
5. ⚠️ No webhook signature verification yet

---

## Success Criteria

- ✅ All plan changes work (FREE ↔ STARTER ↔ GROWTH ↔ PRO)
- ✅ Shopify charges created correctly with right prices
- ✅ Backend subscriptions synced on every change
- ✅ Usage limits displayed accurately
- ✅ Error handling graceful (no white screens)
- ✅ No API key errors in logs
- ✅ Dashboard loads in < 2 seconds
- ✅ Zero customer-facing errors during testing

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test subscriptions
DELETE FROM subscriptions WHERE merchantId = '<test-merchant-id>';

-- Delete test billing charges
DELETE FROM billing_charges WHERE shop = '<test-shop>.myshopify.com';

-- Reset usage stats
DELETE FROM usage_stats WHERE merchantId = '<test-merchant-id>';
```

In Shopify:
- Cancel all test subscriptions via admin UI
- Clear test data from Shopify Partners dashboard

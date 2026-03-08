# Quick Start: Testing Billing Integration

## 🚀 Start Servers

### Terminal 1 - Backend
```bash
cd /Users/olaolu/Documents/GitHub/Nudgenest/nudgenest
pnpm dev
```
Expected output:
```
Server running at: http://localhost:3000
```

### Terminal 2 - Shopify App
```bash
cd /Users/olaolu/Documents/GitHub/Nudgenest/nudgenest-shpfy-app
shopify app dev
```
Expected output:
```
Preview URL: https://<your-store>.myshopify.com/admin/apps/<app-id>
```

---

## ✅ Pre-Flight Checks

### 1. Verify Backend API Key Fix
```bash
# Check that apiKey is in select clause
grep -A 10 "select: {" nudgenest/src/plugins/merchant.ts | grep apiKey
```
Should see: `apiKey: true,`

### 2. Check Environment Variables
```bash
# Shopify app
cat nudgenest-shpfy-app/.env | grep NUDGENEST_BACKEND_URL
# Should show: NUDGENEST_BACKEND_URL=https://3675-81-197-250-129.ngrok-free.app/api/v1

# Backend
cat nudgenest/.env | grep DATABASE_URL
```

### 3. Verify Plans in Database
```bash
cd nudgenest
pnpm prisma studio
# Open http://localhost:5555
# Check Plans table - should have exactly 4 plans: FREE, STARTER, GROWTH, PRO
# No ENTERPRISE plan
```

---

## 🧪 Quick Test Sequence

### Test 1: Dashboard Load (2 minutes)
1. Open Shopify app in browser
2. Open browser DevTools → Console
3. Look for these log messages:
   - ✅ `Using API key: Present` (NOT "Missing")
   - ✅ `Plans response status: 200`
   - ✅ `Filtered plans (no ENTERPRISE): 4`
   - ✅ `Subscription details fetched: {object}`
4. Verify UI:
   - ✅ FREE plan has "Current" badge
   - ✅ STARTER, GROWTH, PRO show "Select Plan" buttons
   - ✅ Usage shows "0 / 25" review requests

**If this fails:**
- Backend not running → Start backend
- "Using API key: Missing" → Restart backend (apiKey fix needs restart)
- 401 Unauthorized → Check API key in merchant table

---

### Test 2: Upgrade to STARTER (3 minutes)
1. Click "Select Plan" on STARTER ($4.99/month)
2. Should redirect to Shopify billing approval page
3. Click "Approve" button
4. Should redirect back to dashboard
5. Verify:
   - ✅ Toast: "✅ Successfully upgraded to STARTER plan!"
   - ✅ STARTER now shows "Current" badge
   - ✅ Usage shows "0 / 300" review requests

**Watch Console Logs:**
```
Selected plan: <planId> STARTER
POST /api/billing/request → 200
{success: true, confirmationUrl: "...", planTier: "STARTER"}
[Shopify redirect happens]
GET /api/billing/callback?plan=STARTER&charge_id=...
Redirects to: /app/dashboard?billing_status=success&plan=STARTER
```

**Backend Logs:**
```
Syncing Shopify subscription
merchantId: <id>
planTier: STARTER
status: ACTIVE
```

---

### Test 3: Payment Decline (1 minute)
1. Click upgrade to GROWTH
2. On Shopify page, click "Decline" button
3. Verify:
   - ✅ Redirects back to dashboard
   - ✅ Toast: "❌ Billing charge was declined. Please try again."
   - ✅ Still on STARTER plan (not changed)

---

### Test 4: Downgrade to FREE (1 minute)
1. Click "Select Plan" on FREE
2. No Shopify redirect (FREE is $0)
3. Page reloads
4. Verify:
   - ✅ FREE shows "Current" badge
   - ✅ Usage shows "0 / 25" review requests

---

## 🐛 Common Issues & Fixes

### Issue: "Using API key: Missing"
**Cause:** Backend not returning apiKey in verification response
**Fix:**
```bash
# 1. Verify fix is in code
grep "apiKey: true" nudgenest/src/plugins/merchant.ts
# Should see line 197: apiKey: true,

# 2. Restart backend
cd nudgenest
# Kill server (Ctrl+C) and restart
pnpm dev
```

### Issue: "Failed to fetch plans, status: 404"
**Cause:** Missing leading slash in URL or wrong backend URL
**Fix:**
```bash
# Check utilities/index.ts has leading slashes
grep "BASE_URL}/plans" nudgenest-shpfy-app/app/utilities/index.ts
# Should see: `${BASE_URL}/plans` (with leading slash)

# Check .env has correct URL
cat nudgenest-shpfy-app/.env | grep NUDGENEST_BACKEND_URL
```

### Issue: "ENTERPRISE plan still showing"
**Cause:** Database not updated
**Fix:**
```bash
cd nudgenest
pnpm tsx prisma/delete-enterprise-plan.ts
# Should see: ✅ ENTERPRISE plan deleted successfully!
```

### Issue: "No plan showing as Current"
**Cause:** No subscription in backend database
**Fix:**
```bash
# Check database
cd nudgenest
pnpm prisma studio
# Look in subscriptions table for your merchantId
# If missing, re-run registration or upgrade flow
```

### Issue: Billing redirect fails
**Cause:** SHOPIFY_APP_URL not set correctly
**Fix:**
```bash
# Check .env
cat nudgenest-shpfy-app/.env | grep SHOPIFY_APP_URL
# Should match your ngrok URL or Shopify app URL
```

---

## 📊 Monitoring During Tests

### Browser Console
Keep DevTools open and watch for:
- ✅ Green logs = success
- ❌ Red errors = problems
- Network tab: Check API calls return 200

### Backend Logs
Watch terminal for:
```
✅ GET /api/v1/merchants/verify/<id> → 200
✅ GET /api/v1/billing/subscription/<id> → 200
✅ POST /api/v1/billing/sync-shopify → 200
❌ Auth failed: Missing API key (bad!)
❌ Auth failed: Invalid API key (bad!)
```

### Database Checks (Real-time)
```bash
# Open Prisma Studio
cd nudgenest && pnpm prisma studio

# Watch tables:
# - subscriptions: Should update when plan changes
# - merchants: Has apiKey field populated
# - plans: Exactly 4 plans
```

---

## 🎯 Success Checklist

After running all tests, verify:

- [ ] Dashboard loads without errors
- [ ] API key is "Present" (not "Missing")
- [ ] All 4 plans display correctly (no ENTERPRISE)
- [ ] FREE plan shows "Current" badge on first load
- [ ] Can upgrade from FREE → STARTER
- [ ] Shopify billing approval works
- [ ] After approval, redirects back with success message
- [ ] Backend subscription syncs correctly
- [ ] Can decline billing charge (no errors)
- [ ] Can downgrade back to FREE
- [ ] Usage stats display correctly
- [ ] No 401 Unauthorized errors
- [ ] No "Missing API key" errors
- [ ] No double slashes in API URLs

---

## 📝 Test Results Template

Copy this to document your test results:

```markdown
## Test Session: [Date]

### Environment
- Backend: Running ✅ / Not Running ❌
- Shopify App: Running ✅ / Not Running ❌
- Backend URL: https://...
- Test Store: <store-name>.myshopify.com

### Test 1: Dashboard Load
- [ ] Passed / [ ] Failed
- API Key Status: Present / Missing
- Plans Loaded: 4 / Other: ___
- Current Plan: FREE / Other: ___
- Notes: ___

### Test 2: Upgrade to STARTER
- [ ] Passed / [ ] Failed
- Redirect to Shopify: Yes / No
- Approval Worked: Yes / No
- Callback Success: Yes / No
- Backend Synced: Yes / No
- Notes: ___

### Test 3: Payment Decline
- [ ] Passed / [ ] Failed
- Decline Handled: Yes / No
- Error Message: Shown / Not Shown
- Plan Unchanged: Yes / No
- Notes: ___

### Test 4: Downgrade to FREE
- [ ] Passed / [ ] Failed
- No Shopify Redirect: Correct / Incorrect
- FREE Showing: Yes / No
- Notes: ___

### Issues Found
1. ___
2. ___

### Issues Fixed
1. ___
2. ___
```

---

## 🚨 Stop Testing If...

**STOP and debug if you see:**
- ❌ "Using API key: Missing" - Backend needs restart
- ❌ 401 Unauthorized errors - API key not configured
- ❌ 404 on /merchants/verify - Wrong backend URL
- ❌ ENTERPRISE plan showing - Database not updated
- ❌ No plans showing - Backend /plans endpoint failing
- ❌ White screen errors - Check browser console

**Fix the issue before continuing tests!**

---

## 📞 Need Help?

### Debug Commands
```bash
# Check if backend is running
lsof -i :3000

# Check backend logs
cd nudgenest && pnpm dev
# Watch for errors

# Check Shopify app logs
cd nudgenest-shpfy-app && shopify app dev
# Watch for errors

# Check database
cd nudgenest && pnpm prisma studio
```

### Where to Look
- Frontend errors: Browser DevTools Console
- Backend errors: Terminal running `pnpm dev`
- Database issues: Prisma Studio (http://localhost:5555)
- Shopify errors: Shopify Partners dashboard → App logs

---

## Next Steps

After basic tests pass:
1. See detailed test plan: `BILLING_TEST_PLAN.md`
2. Test edge cases (webhooks, failures, etc.)
3. Test performance (load times)
4. Test security (unauthorized access)
5. Deploy to staging environment

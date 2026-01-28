# 🚀 NUDGENEST 2-WEEK SPRINT PLAN
**Sprint Duration:** January 26 - February 9, 2026 (14 days)
**Goal:** Production-ready system with billing for stakeholder review
**Review Date:** February 9-10, 2026

---

## 📊 SPRINT OVERVIEW

| Phase | Days | Focus | Hours |
|-------|------|-------|-------|
| **Week 1** | 1-7 | Security + Billing Foundation | 52h |
| **Week 2** | 8-14 | Performance + Testing + Polish | 48h |
| **Total** | 14 | Complete Production System | 100h |

**Daily Target:** 7-8 hours/day (realistic and sustainable)

---

## 🎯 SUCCESS CRITERIA

By February 9, we must deliver:

### ✅ Security (CRITICAL)
- [ ] All credentials in environment variables (no hardcoded secrets)
- [ ] JWT/API key authentication on all backend endpoints
- [ ] Shopify webhook HMAC signature verification
- [ ] TLS certificate validation enabled
- [ ] Monorepo structure for better code management

### ✅ Billing System (REVENUE CRITICAL)
- [ ] 4-tier pricing: Free, Starter ($4.99), Growth ($12.99), Pro ($29.99)
- [ ] Shopify Billing API integration (recurring charges)
- [ ] Usage tracking (reviews sent, emails sent per merchant)
- [ ] Plan limit enforcement (429 when limit reached)
- [ ] Merchant billing dashboard UI

### ✅ Performance (USER EXPERIENCE)
- [ ] Frontend code splitting (< 50KB main bundle)
- [ ] Route-based lazy loading
- [ ] Vendor chunk separation
- [ ] Lighthouse Performance score > 85

### ✅ Quality & Reliability
- [ ] Backend test coverage: 50%+ (from 36%)
- [ ] Joi validation on all endpoints
- [ ] Sentry error tracking configured
- [ ] GCP monitoring and alerts
- [ ] Staging environment deployed

### ✅ Documentation
- [ ] README.md with project overview
- [ ] BILLING.md explaining pricing and usage
- [ ] DEPLOYMENT.md for production setup
- [ ] Demo environment ready

---

## 📅 DETAILED DAILY PLAN

---

## 🗓️ WEEK 1: SECURITY + BILLING FOUNDATION

---

### **DAY 1 - Monday, January 26** ⏰ 8 hours

**Theme:** Monorepo Migration + Security Quick Wins

#### Morning (2 hours): In-Place Monorepo Conversion

**Objective:** Convert current directory to monorepo WITHOUT moving files

**📖 Follow:** `MONOREPO_SETUP.md` for detailed guide

- [ ] **Create root package.json (5 mins)**
  ```bash
  cd /Users/olaolu/Documents/GitHub/Nudgenest
  # Create root package.json with workspace scripts
  ```

- [ ] **Create pnpm-workspace.yaml (5 mins)**
  ```yaml
  packages:
    - 'nudgenest'
    - 'review-ui'
    - 'nudgenest-shpfy-app'
    - 'nudge-nest-landing'
    - 'nudgenest-infra'
    - 'packages/*'
  ```

- [ ] **Create root .gitignore (10 mins)**
  - Add *.key, *.pem, *.csr
  - Add .env files
  - Add node_modules, dist, build
  - Ensure secrets are ignored

- [ ] **Create packages/shared package (30 mins)**
  ```bash
  mkdir -p packages/shared/src/{types,constants,utils,validation}
  # Initialize with package.json and tsconfig.json
  # Create placeholder files
  ```

- [ ] **Install pnpm and dependencies (20 mins)**
  ```bash
  npm install -g pnpm  # If not installed
  pnpm install         # Install all workspace dependencies
  ```

- [ ] **Verify all projects still work (30 mins)**
  ```bash
  pnpm backend:dev   # Test backend
  pnpm frontend:dev  # Test frontend
  pnpm shopify:dev   # Test Shopify app
  ```

**Note:** All existing directories stay in place! No moving files around.

#### Afternoon (4 hours): Security Quick Wins

- [ ] **Move email password to .env (30 mins)**
  ```bash
  cd packages/backend
  echo "EMAIL_USER=no-reply@nudge-nest.app" >> .env
  echo "EMAIL_PASSWORD=Nudgenest2025" >> .env

  # Update src/email-service/index.ts
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
  ```

- [ ] **Remove AWS SDK from frontend (15 mins)**
  ```bash
  cd packages/frontend
  pnpm remove @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

  # Delete AWS credential lines from .env.production
  # Commit and push the deletion
  ```

- [ ] **Move Shopify API key to .env (30 mins)**
  ```bash
  cd packages/shopify-app

  # Ensure .env has SHOPIFY_API_KEY
  # Remove client_id from shopify.app.toml (use env var)
  # Update app to read from env
  ```

- [ ] **Create comprehensive .gitignore files (30 mins)**
  ```bash
  # Root .gitignore
  cat >> .gitignore << EOF
  *.key
  *.pem
  *.csr
  *service-account*.json
  !package.json
  !package-lock.json
  !tsconfig.json
  .env
  .env.*
  !.env.example
  node_modules/
  dist/
  build/
  .DS_Store
  EOF

  # Verify each package has .env in .gitignore
  # Check backend, frontend, shopify-app, infra
  ```

- [ ] **Verify no secrets in git (30 mins)**
  ```bash
  # Check current staged files
  git status

  # Search for potential secrets
  grep -r "Nudgenest2025" .
  grep -r "AKIA" .  # AWS keys
  grep -r "sk_" .   # Shopify keys

  # Check git history for exposed secrets
  git log --all --full-history -- "*.key" "*.pem"
  ```

- [ ] **Add JWT_SECRET to .env (15 mins)**
  ```bash
  cd packages/backend

  # Generate secure secret
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

  # Add to .env
  echo "JWT_SECRET=<generated-secret>" >> .env
  echo "SHOPIFY_WEBHOOK_SECRET=<from-shopify-dashboard>" >> .env
  ```

- [ ] **Create .env.example files (30 mins)**
  ```bash
  # Backend .env.example
  cd packages/backend
  cat > .env.example << EOF
  PORT=8080
  NODE_ENV=development
  DATABASE_URL=mongodb://...
  EMAIL_USER=your-email@example.com
  EMAIL_PASSWORD=your-password
  JWT_SECRET=your-jwt-secret
  SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=your-key
  AWS_SECRET_ACCESS_KEY=your-secret
  S3_BUCKET_NAME=your-bucket
  GOOGLE_CLOUD_PROJECT_ID=your-project
  GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
  EOF

  # Frontend .env.example
  cd packages/frontend
  cat > .env.example << EOF
  VITE_APP_BACKEND_HOST=http://localhost:8080/api/v1/
  EOF

  # Shopify app .env.example
  cd packages/shopify-app
  cat > .env.example << EOF
  SHOPIFY_API_KEY=your-api-key
  SHOPIFY_API_SECRET=your-api-secret
  SCOPES=write_products,read_orders
  DATABASE_URL=file:./prisma/dev.sqlite
  EOF
  ```

- [ ] **Update monorepo README (30 mins)**
  ```bash
  cd nudgenest-monorepo
  # Create comprehensive README with setup instructions
  ```

- [ ] **Test all projects still work (30 mins)**
  ```bash
  pnpm backend:dev
  pnpm frontend:dev
  pnpm shopify:dev
  # Verify no errors, all env vars loading correctly
  ```

#### Deliverables:
- ✅ Monorepo structure established
- ✅ All credentials moved to .env files
- ✅ No secrets in git
- ✅ Comprehensive .gitignore files
- ✅ All projects running in monorepo

#### Testing:
```bash
# Verify no hardcoded secrets
grep -r "Nudgenest2025" packages/
grep -r "AKIA" packages/
grep -r "17dd6639f0adf774c19762bfc1f17d24" packages/

# All should return no results in tracked files
```

---

### **DAY 2 - Tuesday, January 27** ⏰ 8 hours

**Theme:** Authentication & Webhook Security

#### Morning (4 hours): Implement Authentication

- [ ] **Install JWT dependencies (10 mins)**
  ```bash
  cd packages/backend
  pnpm add jsonwebtoken @hapi/jwt
  pnpm add -D @types/jsonwebtoken
  ```

- [ ] **Add apiKey field to Merchants schema (20 mins)**
  ```prisma
  model Merchants {
    // ... existing fields
    apiKey         String?   @unique
    apiKeyHash     String?
    lastLoginAt    DateTime?
  }
  ```
  ```bash
  npx prisma migrate dev --name add_api_key_to_merchants
  npx prisma generate
  ```

- [ ] **Create auth plugin (1.5 hours)**
  - File: `packages/backend/src/plugins/auth.ts`
  - Implement JWT token generation
  - Implement API key validation scheme
  - Create auth strategy for Hapi
  - Add token refresh logic

- [ ] **Create auth utility functions (30 mins)**
  - File: `packages/backend/src/utils/auth.ts`
  - `generateApiKey()` - Create secure API keys
  - `hashApiKey()` - Hash for storage
  - `generateJWT()` - Create JWT tokens
  - `verifyJWT()` - Validate tokens

- [ ] **Create auth routes (1 hour)**
  - `POST /api/v1/auth/api-key` - Generate API key for merchant
  - `POST /api/v1/auth/token` - Exchange API key for JWT
  - `POST /api/v1/auth/refresh` - Refresh expired JWT
  - Add to `packages/backend/src/plugins/auth.ts`

- [ ] **Register auth plugin in server (20 mins)**
  - Update `packages/backend/src/server-factory.ts`
  - Register auth plugin before other plugins
  - Set default auth strategy

#### Afternoon (4 hours): Protect Routes & Webhook Security

- [ ] **Protect all API routes (1 hour)**
  - Update `packages/backend/src/plugins/merchant.ts`
  - Update `packages/backend/src/plugins/review.ts`
  - Update `packages/backend/src/plugins/configs.ts`
  - Update `packages/backend/src/plugins/media.ts`
  - Change `auth: false` to `auth: 'apikey'`
  - Keep webhook endpoint public (we'll verify via HMAC)

- [ ] **Create Shopify webhook verification utility (1 hour)**
  - File: `packages/backend/src/utils/shopifyWebhooks.ts`
  - `verifyShopifyWebhook(body, hmac, secret)` function
  - Use crypto.createHmac('sha256')
  - Return boolean for valid/invalid

- [ ] **Add HMAC verification to webhook handler (1.5 hours)**
  - Update `packages/backend/src/plugins/shopifyWebhook.ts`
  - Extract `X-Shopify-Hmac-SHA256` header
  - Get raw request body
  - Verify signature before processing
  - Return 401 for invalid signatures
  - Log verification failures

- [ ] **Add webhook idempotency (30 mins)**
  - Create `WebhookEvents` model in Prisma
  - Store webhook ID + timestamp
  - Check for duplicates before processing
  - Prevent duplicate review creation

#### Deliverables:
- ✅ JWT authentication implemented
- ✅ All endpoints protected with auth
- ✅ Shopify webhook HMAC verification
- ✅ API key generation endpoints
- ✅ Webhook idempotency

#### Testing:
```bash
# Test auth
curl -X POST http://localhost:8080/api/v1/merchants \
  -H "Content-Type: application/json" \
  -d '{"shopId":"test"}'
# Should return 401 Unauthorized

# Test webhook without HMAC
curl -X POST http://localhost:8080/api/v1/shopify-webhook \
  -d '{"order_number":"123"}'
# Should return 401 Invalid signature
```

---

### **DAY 3 - Wednesday, January 28** ⏰ 6 hours

**Theme:** TLS Fix + Billing Design

#### Morning (1 hour): Security Polish

- [ ] **Enable TLS certificate validation (15 mins)**
  - File: `packages/backend/src/email-service/index.ts:71`
  - Change to: `rejectUnauthorized: process.env.NODE_ENV === 'production'`
  - Test email sending still works in dev

- [ ] **Add security headers (45 mins)**
  - Install: `pnpm add @hapi/inert hapi-helmet`
  - Create: `packages/backend/src/plugins/securityHeaders.ts`
  - Add helmet middleware
  - Configure CSP, HSTS, X-Frame-Options
  - Register in server-factory.ts

#### Afternoon (5 hours): Design Billing System

- [ ] **Research Shopify Billing API (1 hour)**
  - Read docs: https://shopify.dev/docs/apps/billing
  - Understand recurring charges vs usage charges
  - Note API endpoints and flow
  - Check rate limits and constraints

- [ ] **Design billing database schema (2 hours)**
  - Create `BILLING_DESIGN.md` document
  - Define Plans table structure
  - Define Subscriptions table structure
  - Define UsageMetrics table structure
  - Define BillingEvents table structure
  - Document relationships and indexes

- [ ] **Define pricing tiers (1 hour)**
  ```markdown
  1. FREE: $0/month
     - 25 review requests/month
     - 50 emails/month
     - Basic templates
     - Community support
     - "Powered by Nudgenest" branding

  2. STARTER: $4.99/month
     - 300 review requests/month
     - 600 emails/month
     - Custom email templates
     - Remove branding
     - Email support

  3. GROWTH: $12.99/month
     - 1,000 review requests/month
     - 2,000 emails/month
     - QR codes
     - Advanced analytics
     - Priority support

  4. PRO: $29.99/month
     - 5,000 review requests/month
     - 10,000 emails/month
     - API access
     - White-label emails
     - Dedicated support

  5. ENTERPRISE: Custom pricing
     - Unlimited reviews
     - Unlimited emails
     - Custom integrations
     - SLA guarantee
     - Account manager
  ```

- [ ] **Document billing flows (1 hour)**
  - Subscription creation flow diagram
  - Upgrade/downgrade flow
  - Usage tracking points
  - Limit enforcement logic
  - Webhook handling for billing events
  - Edge cases and error handling

#### Deliverables:
- ✅ TLS validation enabled
- ✅ Security headers configured
- ✅ Complete billing design document
- ✅ Pricing tiers defined
- ✅ Billing flows documented

#### Review:
- [ ] Read BILLING_DESIGN.md and approve approach
- [ ] Verify pricing competitive with Loox
- [ ] Ensure all edge cases covered

---

### **DAY 4 - Thursday, January 29** ⏰ 6 hours

**Theme:** Billing Database Implementation

#### Morning (3 hours): Create Billing Models

- [ ] **Update Prisma schema (1 hour)**
  - File: `packages/backend/prisma/schema.prisma`
  - Add Plans model
  - Add Subscriptions model with relations
  - Add UsageMetrics model with unique constraint
  - Add SubscriptionStatus enum
  - Add BillingEvents model (optional)

- [ ] **Run database migrations (30 mins)**
  ```bash
  cd packages/backend
  npx prisma migrate dev --name add_billing_tables
  npx prisma generate
  npx prisma migrate status
  ```

- [ ] **Verify migration success (30 mins)**
  - Check database for new tables
  - Verify indexes created
  - Test Prisma client generates correctly
  - Check foreign key constraints

- [ ] **Update Merchants model (1 hour)**
  - Add Subscriptions relation
  - Add UsageMetrics relation
  - Update existing merchants tests
  - Run tests to verify no breakage

#### Afternoon (3 hours): Seed Plans Data

- [ ] **Create seed script (1.5 hours)**
  - File: `packages/backend/prisma/seed-plans.ts`
  - Define all 5 pricing tiers
  - Include features as JSON
  - Use upsert for idempotency
  - Add TypeScript types

- [ ] **Run seed script (30 mins)**
  ```bash
  npx ts-node prisma/seed-plans.ts
  ```
  - Verify all plans created
  - Check plan data in database
  - Verify features JSON format

- [ ] **Create plan query utilities (1 hour)**
  - File: `packages/backend/src/utils/plans.ts`
  - `getAllPlans()` - List all active plans
  - `getPlanByName(name)` - Get specific plan
  - `getPlanById(id)` - Get by ID
  - Export types for frontend use

#### Deliverables:
- ✅ Billing database tables created
- ✅ All plans seeded with correct pricing
- ✅ Relations and constraints working
- ✅ Plan query utilities ready

#### Testing:
```bash
# Verify plans in database
npx prisma studio
# Navigate to Plans table
# Should see 5 plans with correct pricing

# Test queries
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.plans.findMany().then(console.log);
"
```

---

### **DAY 5 - Friday, January 30** ⏰ 8 hours

**Theme:** Billing Service & Usage Tracking

#### Morning (4 hours): Build Billing Service

- [ ] **Create BillingService class (2 hours)**
  - File: `packages/backend/src/services/billingService.ts`
  - `constructor(prisma: PrismaClient)`
  - `async getCurrentSubscription(merchantId)`
  - `async getSubscriptionWithPlan(merchantId)`
  - `async createSubscription(merchantId, planId, shopifyChargeId)`
  - `async cancelSubscription(subscriptionId, cancelAt?)`
  - `async updateSubscription(subscriptionId, data)`

- [ ] **Add usage tracking methods (1 hour)**
  - `async getCurrentUsage(merchantId)` - Get current month usage
  - `async incrementUsage(merchantId, type: 'review' | 'email')`
  - `async checkLimit(merchantId, type)` - Returns boolean
  - `async getUsagePercentage(merchantId)` - For UI display

- [ ] **Add helper methods (1 hour)**
  - `async getMerchantPlan(merchantId)` - Get plan or default to free
  - `async canSendReview(merchantId)` - Check review limit
  - `async canSendEmail(merchantId)` - Check email limit
  - `async getRemainingReviews(merchantId)`
  - `async getRemainingEmails(merchantId)`

#### Afternoon (4 hours): Enforce Usage Limits

- [ ] **Add usage check to webhook handler (1.5 hours)**
  - File: `packages/backend/src/plugins/shopifyWebhook.ts`
  - Import BillingService
  - Check `canSendReview()` before creating review
  - Return 429 if limit exceeded
  - Include upgrade message in response
  - Log limit exceeded events

- [ ] **Increment usage after review creation (30 mins)**
  - After successful review creation
  - Call `billingService.incrementUsage(merchantId, 'review')`
  - Handle errors gracefully (don't block review creation)

- [ ] **Add usage check to email sending (1.5 hours)**
  - File: `packages/backend/src/plugins/pubsubConsumer.ts`
  - Check `canSendEmail()` before sending
  - Skip email if limit exceeded (log warning)
  - Increment usage after successful send
  - Track both customer and merchant emails

- [ ] **Create usage enforcement middleware (30 mins)**
  - File: `packages/backend/src/middleware/usageCheck.ts`
  - Reusable middleware for checking limits
  - Attach to relevant routes
  - Return consistent error format

#### Deliverables:
- ✅ BillingService fully implemented
- ✅ Usage tracking on review creation
- ✅ Usage tracking on email sending
- ✅ Limits enforced (429 response)
- ✅ Graceful error handling

#### Testing:
```bash
# Create test merchant on free plan
# Send 26 review requests (limit is 25)
# 26th should return 429 with upgrade message

# Test usage tracking
curl http://localhost:8080/api/v1/usage/[merchantId]
# Should show current usage and limits
```

---

### **DAY 6 - Saturday, January 31** ⏰ 8 hours

**Theme:** Shopify Billing API Integration

#### Morning (4 hours): Billing API Routes

- [ ] **Create Shopify billing utilities (2 hours)**
  - File: `packages/shopify-app/app/utils/billing.ts`
  - `async createRecurringCharge(admin, plan)`
  - `async getActiveCharge(admin)`
  - `async cancelCharge(admin, chargeId)`
  - `async verifyCharge(admin, chargeId)`
  - Handle Shopify API errors

- [ ] **Create billing routes (2 hours)**
  - File: `packages/shopify-app/app/routes/app.billing.tsx`
  - `loader` - Get current subscription and usage
  - `action` - Handle subscription actions
  - Export component with billing UI structure

#### Afternoon (4 hours): Subscription Flow

- [ ] **Implement subscription creation flow (2 hours)**
  - `POST /app/billing/subscribe`
  - Create Shopify recurring charge
  - Redirect merchant to Shopify confirmation
  - Store pending subscription in backend
  - Handle Shopify callback
  - Activate subscription after confirmation

- [ ] **Implement subscription callback handler (1 hour)**
  - `GET /app/billing/callback`
  - Verify charge was accepted
  - Call backend to activate subscription
  - Update merchant status
  - Redirect to dashboard with success message

- [ ] **Add billing webhook handler (1 hour)**
  - Handle `app_subscriptions/update` webhook
  - Update subscription status in database
  - Handle cancellations
  - Handle billing failures
  - Log all billing events

#### Deliverables:
- ✅ Shopify billing API integration complete
- ✅ Subscription creation flow working
- ✅ Callback handler implemented
- ✅ Billing webhooks handled

#### Testing:
```bash
# In Shopify dev store
1. Install app
2. Click "Upgrade to Starter"
3. Confirm charge in Shopify
4. Verify subscription created in backend
5. Verify usage limits updated
```

---

### **DAY 7 - Sunday, February 1** ⏰ 8 hours

**Theme:** Billing Dashboard UI

#### Morning (4 hours): Build Billing Page

- [ ] **Create billing page layout (1 hour)**
  - File: `packages/shopify-app/app/routes/app.billing.tsx`
  - Current plan card
  - Usage statistics section
  - Plan comparison table
  - Upgrade/downgrade buttons

- [ ] **Add usage visualization (1.5 hours)**
  - Progress bars for review usage
  - Progress bars for email usage
  - Percentage display
  - "X of Y used" text
  - Color coding (green/yellow/red)
  - Warning at 80% usage

- [ ] **Create plan comparison component (1.5 hours)**
  - Show all 5 plans
  - Highlight current plan
  - Show price savings (annual)
  - Feature comparison list
  - "Popular" badge on Growth plan
  - Responsive grid layout

#### Afternoon (4 hours): Upgrade/Downgrade Flows

- [ ] **Create upgrade modal (2 hours)**
  - Show selected plan details
  - Display price and features
  - Show cost difference
  - Confirmation button
  - Handle Shopify charge creation
  - Loading states

- [ ] **Create downgrade modal (1 hour)**
  - Warning about feature loss
  - Show what they'll lose
  - Effective date display
  - Confirmation required
  - Schedule cancellation for period end

- [ ] **Update dashboard with billing widget (1 hour)**
  - File: `packages/shopify-app/app/routes/app.dashboard.tsx`
  - Add current plan badge
  - Show usage summary
  - Quick upgrade CTA if on free
  - Link to full billing page

#### Deliverables:
- ✅ Complete billing dashboard UI
- ✅ Usage visualization working
- ✅ Plan comparison functional
- ✅ Upgrade/downgrade flows complete
- ✅ Dashboard billing widget

#### Testing:
```bash
# Manual testing checklist
- [ ] View current plan and usage
- [ ] Upgrade from Free to Starter
- [ ] Usage limits update correctly
- [ ] Downgrade modal shows warning
- [ ] All plans display correctly
- [ ] Responsive on mobile
```

---

## 🗓️ WEEK 2: PERFORMANCE + TESTING + POLISH

---

### **DAY 8 - Monday, February 2** ⏰ 8 hours

**Theme:** Frontend Performance & Validation

#### Morning (4 hours): Frontend Code Splitting

- [ ] **Route-based code splitting (1.5 hours)**
  - File: `packages/frontend/src/App.tsx`
  - Convert all page imports to `React.lazy()`
  - Add `<Suspense>` wrapper with Loading fallback
  - Test each route loads correctly
  - Verify separate chunks in build output

- [ ] **Component-level splitting (1.5 hours)**
  - Split ReviewConfigsPage tabs (4 components)
  - Split MediaModal (loaded on demand)
  - Add Suspense boundaries
  - Test tab switching and modal loading

- [ ] **Vendor code splitting (1 hour)**
  - Update `packages/frontend/vite.config.ts`
  - Configure `manualChunks` in rollupOptions
  - Split React, Redux, UI libraries
  - Build and verify chunk sizes

#### Afternoon (4 hours): Build Optimization & Validation

- [ ] **Image lazy loading (30 mins)**
  - Add `loading="lazy"` to all images
  - Add `decoding="async"` attribute
  - Test images load on scroll

- [ ] **Route preloading (30 mins)**
  - Create `packages/frontend/src/utils/preload.ts`
  - Preload on hover for main CTAs
  - Test navigation feels instant

- [ ] **Build and analyze (1 hour)**
  ```bash
  cd packages/frontend
  pnpm add -D rollup-plugin-visualizer
  pnpm build
  pnpm preview
  ```
  - Check main bundle < 50KB gzipped
  - Verify vendor chunks cached
  - Run Lighthouse audit
  - Target: Performance score > 85

- [ ] **Add Joi validation to backend (2 hours)**
  ```bash
  cd packages/backend
  pnpm add joi @types/joi
  ```
  - Create validation schemas in `src/validation/schemas.ts`
  - Add to merchant routes
  - Add to review routes
  - Add to config routes
  - Add to media routes
  - Test with invalid inputs

#### Deliverables:
- ✅ Main bundle < 50KB gzipped
- ✅ Route-based lazy loading working
- ✅ Vendor chunks separated
- ✅ Lighthouse Performance > 85
- ✅ Joi validation on all endpoints

#### Testing:
```bash
# Performance testing
cd packages/frontend
pnpm build
ls -lh dist/assets/*.js  # Check bundle sizes

# Run Lighthouse
pnpm preview
# Open Chrome DevTools → Lighthouse → Run

# Validation testing
curl -X POST http://localhost:8080/api/v1/merchants \
  -H "X-API-Key: test-key" \
  -d '{"invalid":"data"}'
# Should return 400 with validation errors
```

---

### **DAY 9 - Tuesday, February 3** ⏰ 8 hours

**Theme:** Testing Coverage Improvement

#### Morning (4 hours): Backend Tests

- [ ] **Add authentication tests (1 hour)**
  - File: `packages/backend/src/__tests__/auth.test.ts`
  - Test JWT generation and validation
  - Test API key authentication
  - Test protected routes
  - Test invalid tokens/keys

- [ ] **Add webhook security tests (1 hour)**
  - File: `packages/backend/src/__tests__/webhooks.test.ts`
  - Test HMAC verification (valid/invalid)
  - Test replay attack prevention
  - Test idempotency
  - Test rate limiting

- [ ] **Add billing logic tests (2 hours)**
  - File: `packages/backend/src/__tests__/billing.test.ts`
  - Test usage tracking
  - Test limit enforcement
  - Test subscription creation
  - Test plan upgrades/downgrades
  - Test usage percentage calculations

#### Afternoon (4 hours): Improve Coverage

- [ ] **Add tests for pubsubConsumer (1.5 hours)**
  - Current coverage: 13.88%
  - Target: 40%+
  - Test email sending logic
  - Test message handling
  - Test error scenarios

- [ ] **Add tests for review routes (1.5 hours)**
  - Current coverage: 23.52%
  - Target: 50%+
  - Test review creation
  - Test review updates
  - Test status changes
  - Test merchant notifications

- [ ] **Run full test suite (1 hour)**
  ```bash
  cd packages/backend
  pnpm test -- --coverage
  ```
  - Fix failing tests
  - Aim for 50%+ overall coverage
  - Document remaining gaps

#### Deliverables:
- ✅ Auth tests added
- ✅ Billing tests added
- ✅ Webhook tests added
- ✅ Backend coverage: 50%+
- ✅ All tests passing

#### Testing:
```bash
# Run tests with coverage
cd packages/backend
pnpm test -- --coverage --verbose

# Should see:
# - Statements: 50%+
# - Branches: 40%+
# - Functions: 40%+
# - Lines: 50%+
```

---

### **DAY 10 - Wednesday, February 4** ⏰ 8 hours

**Theme:** Monitoring & Staging Environment

#### Morning (4 hours): Set Up Monitoring

- [ ] **Install and configure Sentry (1.5 hours)**
  ```bash
  cd packages/backend
  pnpm add @sentry/node

  cd packages/frontend
  pnpm add @sentry/react

  cd packages/shopify-app
  npm install @sentry/remix
  ```
  - Create Sentry project (nudgenest.sentry.io)
  - Add to backend: `src/server.ts`
  - Add to frontend: `src/main.tsx`
  - Add to Shopify app
  - Test error reporting
  - Configure source maps

- [ ] **Set up GCP Cloud Monitoring (1.5 hours)**
  - Create uptime checks for:
    - Backend API: /health endpoint
    - Frontend: Homepage
    - Shopify app: /app endpoint
  - Configure log-based alerts:
    - Error rate > 5%
    - Response time > 2s
    - Failed webhook deliveries
  - Create dashboard with key metrics
  - Set up email notifications

- [ ] **Add cost budget alerts (1 hour)**
  ```bash
  cd packages/infra
  # Add to Pulumi index.ts
  ```
  - Set monthly budget: $100
  - Alert at 50%, 80%, 100%
  - Email notifications
  - Slack webhook (optional)

#### Afternoon (4 hours): Create Staging Environment

- [ ] **Create Pulumi staging stack (1 hour)**
  ```bash
  cd packages/infra
  pulumi stack init staging
  pulumi config set gcp:project nudgenest-staging
  pulumi config set gcp:region europe-west1
  ```

- [ ] **Deploy staging infrastructure (1.5 hours)**
  - Create separate Cloud Run services
  - Create separate Pub/Sub topic
  - Create separate Secret Manager secrets
  - Use separate database (staging-db)
  - Deploy all services
  - Verify deployment success

- [ ] **Configure staging domain (30 mins)**
  - Set up DNS: staging.nudge-nest.app
  - Configure SSL certificates
  - Update CORS for staging URLs
  - Test all services accessible

- [ ] **Configure SPF/DKIM for email (1 hour)**
  - Add SPF record to domain DNS
  - Generate DKIM keys
  - Add DKIM records
  - Test with mail-tester.com
  - Target: 9/10 score

#### Deliverables:
- ✅ Sentry error tracking configured
- ✅ GCP monitoring and alerts set up
- ✅ Cost budget alerts configured
- ✅ Staging environment deployed
- ✅ SPF/DKIM configured

#### Testing:
```bash
# Test Sentry
# Trigger error in backend
curl http://staging-api.nudge-nest.app/test-error
# Check Sentry dashboard for error

# Test monitoring
# Check GCP Console → Monitoring
# Verify uptime checks running
# Verify logs flowing

# Test email deliverability
# Send test email
# Check headers for SPF/DKIM pass
# Run mail-tester.com
```

---

### **DAY 11 - Thursday, February 5** ⏰ 8 hours

**Theme:** End-to-End Testing & Bug Fixes

#### Morning (4 hours): E2E Testing on Staging

- [ ] **Test complete user journey (2 hours)**
  1. Install Shopify app on test store
  2. Complete merchant registration
  3. View dashboard (verify loads)
  4. Navigate to billing page
  5. Upgrade to Starter plan
  6. Confirm charge in Shopify
  7. Verify subscription active
  8. Create test order in Shopify
  9. Mark order as fulfilled
  10. Verify webhook received
  11. Check review email sent
  12. Submit review via email link
  13. Verify review appears in list
  14. Check merchant notification sent
  15. View reviews on store (storefront)
  16. Test usage limits (send 300+ reviews)
  17. Verify 429 error after limit
  18. Test downgrade flow

- [ ] **Test edge cases (1 hour)**
  - Invalid webhook signatures
  - Duplicate webhooks
  - Network timeouts
  - Database connection failures
  - Invalid API keys
  - Expired JWT tokens
  - Plan limit edge cases (exactly at limit)
  - Subscription in pending state

- [ ] **Test performance (1 hour)**
  - Load testing (50 concurrent requests)
  - Webhook delivery time
  - Email sending time
  - Frontend page load times
  - Database query performance
  - API response times

#### Afternoon (4 hours): Bug Fixing Sprint

- [ ] **Fix P0 bugs (2 hours)**
  - Critical bugs that break core functionality
  - Authentication issues
  - Billing errors
  - Webhook failures
  - Email sending problems

- [ ] **Fix P1 bugs (1.5 hours)**
  - High priority but not critical
  - UI/UX issues
  - Performance problems
  - Edge case handling

- [ ] **Clean up code (30 mins)**
  - Remove all `console.log` statements
  - Remove commented code
  - Fix TypeScript `any` types
  - Remove unused imports
  - Format code with Prettier

#### Deliverables:
- ✅ Complete E2E flow tested
- ✅ All critical bugs fixed
- ✅ Performance verified
- ✅ Code cleaned up
- ✅ Staging environment stable

#### Testing:
```bash
# Regression testing
# Re-run critical user flows
# Verify all fixes working
# No new bugs introduced
```

---

### **DAY 12 - Friday, February 6** ⏰ 8 hours

**Theme:** Documentation & Demo Preparation

#### Morning (4 hours): Write Documentation

- [ ] **Create README.md (1 hour)**
  ```markdown
  # Nudgenest - User Review Platform for Shopify

  ## Overview
  - What is Nudgenest
  - Key features
  - Architecture overview
  - Tech stack

  ## Getting Started
  - Prerequisites
  - Installation
  - Development setup
  - Running locally

  ## Project Structure
  - Monorepo overview
  - Package descriptions
  - Key files

  ## Contributing
  - Code style
  - Testing requirements
  - Pull request process
  ```

- [ ] **Create BILLING.md (1 hour)**
  ```markdown
  # Billing System Documentation

  ## Pricing Tiers
  - Detailed pricing breakdown
  - Feature comparison
  - Usage limits per tier

  ## Usage Tracking
  - How usage is calculated
  - When limits are enforced
  - Upgrade prompts

  ## Shopify Integration
  - Recurring charge flow
  - Webhook handling
  - Charge cancellation

  ## Database Schema
  - Plans table
  - Subscriptions table
  - UsageMetrics table

  ## API Reference
  - Billing endpoints
  - Request/response examples
  ```

- [ ] **Create DEPLOYMENT.md (1 hour)**
  ```markdown
  # Deployment Guide

  ## Prerequisites
  - GCP account setup
  - Shopify Partner account
  - Domain and DNS

  ## Environment Variables
  - Complete list
  - How to set up secrets

  ## Infrastructure
  - Pulumi commands
  - Service deployment
  - Database setup

  ## CI/CD
  - GitHub Actions workflows
  - Deployment process
  - Rollback procedure

  ## Monitoring
  - Sentry setup
  - GCP monitoring
  - Alerts configuration
  ```

- [ ] **Create API documentation (1 hour)**
  - File: `packages/backend/API.md`
  - Document all endpoints
  - Request/response schemas
  - Authentication required
  - Error codes
  - Example requests

#### Afternoon (4 hours): Demo Environment

- [ ] **Set up demo Shopify store (1 hour)**
  - Create fresh dev store
  - Install Nudgenest app
  - Register merchant
  - Configure email templates
  - Customize branding

- [ ] **Pre-populate demo data (1.5 hours)**
  - Create 20 sample products
  - Generate 50 test orders
  - Create 30 sample reviews (mix of ratings)
  - Add review photos/videos
  - Set up on Starter plan
  - Show usage at 60% (for demo)

- [ ] **Create presentation slides (1.5 hours)**
  - Project overview
  - Architecture diagrams
  - Security improvements made
  - Billing system walkthrough
  - Feature comparison vs Loox
  - Performance metrics (before/after)
  - Roadmap for next phase
  - Live demo flow

#### Deliverables:
- ✅ Complete documentation
- ✅ API reference
- ✅ Demo environment ready
- ✅ Presentation prepared
- ✅ Sample data populated

---

### **DAY 13 - Saturday, February 7** ⏰ 6 hours

**Theme:** Final Testing & Polish

#### Morning (3 hours): Final Testing

- [ ] **Cross-browser testing (1 hour)**
  - Test in Chrome
  - Test in Safari
  - Test in Firefox
  - Test on mobile (iOS/Android)
  - Fix any compatibility issues

- [ ] **Security audit (1 hour)**
  - Verify all secrets in env
  - Check `.gitignore` complete
  - Scan for hardcoded credentials
  - Test auth on all endpoints
  - Verify HMAC on webhooks
  - Check CORS configuration

- [ ] **Performance audit (1 hour)**
  - Run Lighthouse on all pages
  - Check bundle sizes
  - Verify lazy loading works
  - Test on slow 3G
  - Check database query performance

#### Afternoon (3 hours): Polish & Final Touches

- [ ] **UI polish (1.5 hours)**
  - Fix any visual bugs
  - Ensure consistent styling
  - Add loading states everywhere
  - Improve error messages
  - Add helpful tooltips
  - Responsive design fixes

- [ ] **Final code review (1 hour)**
  - Review all changed files
  - Check for TODOs in code
  - Verify tests pass
  - Run linter
  - Format all code

- [ ] **Prepare Q&A responses (30 mins)**
  - Anticipated questions
  - Technical deep dives
  - Cost justifications
  - Timeline for production
  - Scaling concerns

#### Deliverables:
- ✅ Cross-browser compatibility verified
- ✅ Security audit passed
- ✅ Performance optimized
- ✅ UI polish complete
- ✅ Code review done

---

### **DAY 14 - Sunday, February 8** ⏰ 4 hours

**Theme:** Review Preparation & Buffer

#### Morning (2 hours): Final Prep

- [ ] **Test demo flow (1 hour)**
  - Practice presentation
  - Test demo scenarios
  - Verify all features work
  - Prepare backup plans
  - Record demo video (optional)

- [ ] **Create review summary (1 hour)**
  - List all completed features
  - Security improvements made
  - Performance gains achieved
  - Test coverage metrics
  - Known issues/limitations
  - Next steps proposed

#### Afternoon (2 hours): Buffer Time

- [ ] **Address any remaining issues**
  - Fix last-minute bugs
  - Update documentation
  - Prepare environment
  - Backup demo data

- [ ] **Relax and prepare mentally**
  - Review presentation
  - Prepare for questions
  - Get good rest

#### Deliverables:
- ✅ Demo flow practiced
- ✅ Review summary complete
- ✅ All systems ready
- ✅ Backup plans prepared

---

## 📊 REVIEW CHECKLIST (February 9-10)

### ✅ Security (PASS/FAIL)
- [ ] No hardcoded credentials in code
- [ ] All endpoints authenticated
- [ ] Webhooks HMAC verified
- [ ] TLS validation enabled
- [ ] Secrets in environment variables
- [ ] Security headers configured

### ✅ Billing (PASS/FAIL)
- [ ] 5 pricing tiers implemented
- [ ] Shopify Billing API integrated
- [ ] Usage tracking working
- [ ] Limits enforced correctly
- [ ] Dashboard UI complete
- [ ] Upgrade/downgrade flows work

### ✅ Performance (PASS/FAIL)
- [ ] Main bundle < 50KB gzipped
- [ ] Lighthouse score > 85
- [ ] Code splitting implemented
- [ ] Lazy loading working
- [ ] Images optimized

### ✅ Quality (PASS/FAIL)
- [ ] Test coverage > 50%
- [ ] All tests passing
- [ ] Sentry configured
- [ ] Monitoring set up
- [ ] Staging environment live

### ✅ Documentation (PASS/FAIL)
- [ ] README complete
- [ ] BILLING.md written
- [ ] DEPLOYMENT.md ready
- [ ] API docs available
- [ ] Demo environment ready

---

## 📈 KEY METRICS TO PRESENT

### Security Improvements:
```
Before:
❌ 8 CRITICAL security issues
❌ Hardcoded passwords
❌ No authentication
❌ No webhook verification

After:
✅ 0 CRITICAL security issues
✅ All secrets in env vars
✅ JWT/API key auth
✅ HMAC webhook verification
```

### Performance Improvements:
```
Before:
- Bundle size: 280KB
- FCP: 2.5s
- Lighthouse: 68

After:
- Bundle size: 92KB (67% reduction)
- FCP: 1.2s (52% faster)
- Lighthouse: 88-92 (+20-24 points)
```

### Test Coverage:
```
Before: 36%
After: 50%+
Improvement: +14 percentage points
```

### New Features:
```
✅ Complete billing system
✅ 5 pricing tiers
✅ Shopify Billing integration
✅ Usage tracking and limits
✅ Merchant dashboard
✅ Monorepo structure
```

---

## 🎯 POST-REVIEW PRIORITIES

If approved for production:

### Week 3 (Feb 10-16):
- [ ] Set up production environment
- [ ] Configure production secrets
- [ ] Run penetration testing
- [ ] Create backup procedures
- [ ] Set up disaster recovery
- [ ] Production deployment

### Week 4 (Feb 17-23):
- [ ] Monitor production metrics
- [ ] Fix production issues
- [ ] Improve documentation
- [ ] Train support team
- [ ] Launch marketing

---

## 📞 DAILY STANDUPS

Each day at 9 AM, report:
1. ✅ What was completed yesterday
2. 🎯 What will be done today
3. ⚠️ Any blockers or risks

Track progress in this file by checking off items as completed.

---

## 🚨 ESCALATION PROCESS

If blocked for > 2 hours:
1. Document the issue
2. Try alternative approach
3. Ask for help
4. Escalate to stakeholder if needed

---

## 💪 MOTIVATION

**You've got this!** This is an aggressive but achievable plan. By Feb 9, you'll have:

✅ A secure, production-ready system
✅ A complete billing system generating revenue
✅ Better performance than competitors
✅ Comprehensive monitoring and testing
✅ A monorepo structure for future growth

**Let's build something amazing! 🚀**

---

*Last updated: January 26, 2026*
*Sprint Owner: Olaolu + Claude (Co-dev)*
*Review Date: February 9-10, 2026*

# Nudgenest — Manual Test Plan
**Target:** Shopify App Review Submission
**Duration:** 2 days
**Environment:** Staging (Cloud Run)

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| `⬜` | Not run yet |
| `✅` | Pass |
| `❌` | Fail |
| `⚠️` | Partial / issue found |
| `⏭️` | Skipped |

> **To update a test:** replace the symbol in the Status cell.
> **To log a failure:** add a row to the Issues Log at the bottom with the test ID and description.

---

## Environments

| Service | Staging URL                                                                   |
|---------|-------------------------------------------------------------------------------|
| Backend API | `https://api-staging.nudgenest.io`                                            |
| Review UI | `https://review-staging.nudgenest.io`                                         |
| Shopify App | Cloudflare tunnel URL (changes each `shopify app dev` restart — check `.env`) |

---

## Pre-conditions

- [ ] `feature/shopify-submission` merged to `develop`
- [ ] `feature/sentry-integration` merged to `develop`
- [ ] `feature/sprint-4-branding` merged to `develop`
- [ ] `develop` deployed to staging (`test` branch) — Cloud Run services are up
- [ ] A Shopify dev store is available in Shopify Partners
- [ ] The app is installed on the dev store
- [ ] At least one test order exists in the dev store

---

## Day 1

---

### A — Landing Page (~45 min)

**URL:** `https://landing-staging.nudgenest.io/` (or staging Cloud Run URL)

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| L1 | Open in Chrome | Page loads, no console errors | ✅ |
| L2 | Open in Safari | Page loads, no console errors | ✅ |
| L3 | Toggle dark mode (system or browser) | Logo, text, all sections render correctly; logo is vivid coral, not washed-out | ✅ |
| L4 | Resize to 375px width (mobile) | No horizontal scrollbar; hero text readable; all sections visible | ✅ |
| L5 | Check header logo | Correct size (~36px tall); clicking navigates to home | ✅ |
| L6 | Click each nav link (How It Works, Pricing, FAQ, Contact) | Each scrolls to section or navigates correctly | ✅ |
| L7 | Click "Get Started" (hero CTA) | Opens signup URL in new tab | ✅ |
| L8 | Scroll to bottom of page | All sections visible: hero, screenshots/product, features, value proposition, footer | ✅ |
| L9 | Check footer logo | Renders at correct size; copyright year is current | ✅ |
| L10 | Click "Privacy Policy" in footer | Navigates to `/privacy` page | ✅ |
| L11 | Newsletter input | Accepts text input; Subscribe button opens mailto; input clears after click | ✅ |
| L12 | Pricing section loads | Plan cards visible with correct prices; no "unavailable" error | ✅ |
| L13 | Header glass/blur in Safari | Header has visible background when scrolling; not transparent | ✅ |

---

### B — Review UI: Customer Flow (~3.5 hrs)

**Base URL:** `https://review-staging.nudgenest.io/`

#### Review Submission (`/review/:id`)

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| R1 | Open `/review/{valid-review-id}` | Page loads; customer name and product name visible | ⬜ |
| R2 | Open `/review/invalid-id-xyz` | Graceful error state shown; NOT a blank white page | ⬜ |
| R3 | Click 1 star, then click 5 stars | Star widget updates; only 5 stars highlighted after second click | ⬜ |
| R4 | Write comment, click Submit with NO star selected | Validation error message shown; form not submitted | ⬜ |
| R5 | Select 4 stars, write comment, click Submit | Success confirmation shown; review record exists in backend | ⬜ |
| R6 | Upload a JPEG photo, select rating, submit | Success; review has `mediaUrl` in backend | ⬜ |
| R7 | Drag a `.pdf` file into the upload zone | File rejected; error message shown | ⬜ |
| R8 | Try to upload a file >10 MB | Rejected gracefully; error message shown | ⬜ |
| R9 | Reload the page after submitting (same reviewId) | "Already submitted" or "review complete" state; no duplicate submission possible | ⬜ |

#### Store Review Page (`/store/review/:merchantId`)

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| R10 | Open `/store/review/{valid-merchant-id}` | Store review form renders | ⬜ |
| R11 | Fill in name, select rating, comment, submit | Success state shown; review created in backend | ⬜ |
| R12 | Open `/store/review/invalid-merchant-id` | Error state shown; NOT blank page | ⬜ |

#### Review List (`/reviews/:shopId`)

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| R13 | Open `/reviews/{shopId}?published=true` | Only published reviews shown | ⬜ |
| R14 | Check rating distribution histogram | Star counts match actual review data | ⬜ |
| R15 | Sort by date | Reviews reorder by date correctly | ⬜ |
| R16 | Sort by rating | Reviews reorder by rating correctly | ⬜ |
| R17 | Open for a shop with no reviews | Friendly empty state message; NOT a crash | ⬜ |
| R18 | Open in an iframe (embed in a plain HTML page to simulate) | Horizontal scroll mode activates; no content overflow | ⬜ |

---

## Day 2

---

### C — Review UI: Merchant Config iframe (~2 hrs)

**URL:** `https://review-staging.nudgenest.io/configs/{merchantId}`
Test both standalone (direct browser) and embedded (via Shopify app modal).

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| C1 | Open `/configs/{valid-merchant-id}` | All config sections render: email content, reminders, auto-publish, QR code | ⬜ |
| C2 | Change email subject text → Save | Subject persisted; reloading page shows new subject | ⬜ |
| C3 | Change email body text → Save | Body persisted | ⬜ |
| C4 | Change review button text → Save | Button text persisted | ⬜ |
| C5 | Toggle auto-reminders ON | Reminder qty and period controls appear | ⬜ |
| C6 | Set reminders = 2, period = WEEKLY → Save | Settings saved; reloading confirms | ⬜ |
| C7 | Set auto-publish threshold to 4★ → Save | Config updated; backend `PATCH` returns 200 | ⬜ |
| C8 | Check QR code section | QR code image renders; URL shown is correct store review URL | ⬜ |
| C9 | Open via Shopify app iframe (Configs modal) | Content fits in frame; no scrollbar bleed outside modal | ⬜ |
| C10 | Open `/configs/invalid-merchant-id` | Error state shown; NOT blank | ⬜ |
| C11 | Change a config in the iframe modal, close modal, reopen | Change is still there | ⬜ |

---

### D — Shopify App (~4.5 hrs)

**URL:** Cloudflare tunnel URL (from `shopify app dev` — check terminal output)

#### Installation & Auth

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| S1 | Install app on dev store via Shopify Partners | OAuth flow completes; app loads in Shopify admin | ⬜ |
| S2 | Close and reopen the app | Session restored; no re-authentication required | ⬜ |
| S3 | Uninstall app, then reinstall | Fresh registration flow; no stale merchant data | ⬜ |

#### Registration Flow

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| S4 | Open app on a store not yet registered | Redirected to `/app/registration` page | ⬜ |
| S5 | Complete registration form and submit | Merchant created on backend; redirected to dashboard | ⬜ |
| S6 | Submit registration with invalid email | Validation error shown; form not submitted | ⬜ |
| S7 | Open app on an already-registered store | Goes directly to dashboard; no duplicate registration | ⬜ |

#### Dashboard

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| S8 | View dashboard | Current plan name, review count, and subscription status visible | ⬜ |
| S9 | Check plan features list | Correct features shown for FREE plan | ⬜ |
| S10 | Open Configs modal | iframe loads staging Review UI `/configs/:merchantId`; no CORS or blank screen | ⬜ |
| S11 | Make a config change in iframe, close, reopen modal | Change persists across open/close | ⬜ |
| S12 | Open Reviews modal | iframe loads staging Review UI `/reviews/:shopId`; reviews listed | ⬜ |
| S13 | Reviews modal — check unpublished reviews visible | Merchant dashboard shows all reviews (not just `?published=true`) | ⬜ |

#### Billing — Upgrade

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| S14 | Click "Upgrade to STARTER" | Redirected to Shopify billing approval page | ⬜ |
| S15 | Approve the billing charge | Returned to dashboard; success toast shown; plan shows STARTER | ⬜ |
| S16 | Decline billing approval | Returned to dashboard; plan remains unchanged | ⬜ |

#### Billing — Downgrade to FREE

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| S17 | Click "Downgrade to FREE" | No Shopify approval page; downgrade happens immediately | ⬜ |
| S18 | Dashboard reflects FREE plan | Plan name and features update to FREE | ⬜ |
| S19 | Check Shopify Partners | No active subscription charge for this store | ⬜ |

#### Webhooks

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| S20 | Create a test order in the dev store | Within 1 min: review record exists in backend for that order | ⬜ |
| S21 | Check customer email inbox | Review request email received within 2 min | ⬜ |
| S22 | Upgrade billing plan | `app_subscriptions/update` webhook fires; backend subscription updated | ⬜ |
| S23 | Uninstall the app | No 500 errors in Cloud Run logs; uninstall webhook handled gracefully | ⬜ |

#### iframe Edge Cases

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| S24 | Open Configs modal on a slow network (throttle in DevTools to Slow 3G) | Loading spinner or skeleton shown; not a blank white box | ⬜ |
| S25 | Open Reviews modal when shop has no reviews | Empty state shown inside the iframe | ⬜ |
| S26 | Drag Shopify admin sidebar to resize the app window | iframe content reflows; no horizontal overflow | ⬜ |
| S27 | Open Configs modal, close it, then open Reviews modal | Each modal loads fresh content; no stale data from previous modal | ⬜ |
| S28 | Open both modals and verify `REVIEW_UI_BASE_URL` in iframe src | Both iframes point to the staging Review UI URL | ⬜ |

---

### E — End-to-End Smoke Test (~1 hr)

| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| E1 | Place order in dev store → wait for review email → submit review via email link → check dashboard | Full chain completes; review visible in merchant dashboard | ⬜ |
| E2 | Submit a 5★ review (autoPublish enabled for 4★+) | Review automatically published; visible at `/reviews/{shopId}?published=true` | ⬜ |
| E3 | Submit a 2★ review | Review NOT auto-published; `published: false` in backend | ⬜ |
| E4 | Trigger reminder manually: `POST {BASE}/api/v1/reminders/run` | Customer receives reminder email; `remindersSent` incremented on review record | ⬜ |
| E5 | Open public review widget URL `/reviews/{shopId}?published=true` | Only published reviews shown; unpublished reviews absent | ⬜ |

---

## Issues Log

Record any failures here. Reference the test ID from the tables above.

| # | Date | Section | Test ID | Description | Status |
|---|------|---------|---------|-------------|--------|
| | | | | | |

---

## Sign-off

| Tester | Date | Result |
|--------|------|--------|
| | | ⬜ Pass / ⬜ Fail — issues logged above |

# STRIPE BILLING INTEGRATION â€” STATEMENT OF WORK
**Phase 1: Development Execution**  
**Status:** IN PROGRESS  
**Target Completion:** Tomorrow (end of business)

---

## 1. TECHNICAL SPECIFICATIONS

### 1.1 Tech Stack (CONFIRMED)
- **Frontend Framework:** React 18.3.1 + Vite (bundler)
- **Frontend UI Library:** Radix UI + Tailwind CSS 3.4.17
- **State Management:** TanStack React Query 5.60.5
- **Authentication Hook:** `useAuth.ts` in `client/src/hooks/` (returns `{ user, isLoading, isAuthenticated, error }`)
- **Page Structure:** Next.js-style with `client/src/pages/` directory
- **HTTP Client:** Native `fetch()` with `credentials: "include"` for session cookies
- **Form Handling:** React Hook Form 7.55.0 + Zod validation
- **Styling:** Tailwind CSS + class-variance-authority (cva)
- **Backend API:** Express.js server with session-based auth (connect-pg-simple)
- **Payment Processor:** Stripe (v20.4.1)
- **Database ORM:** Drizzle ORM
- **Build Tool:** Vite 5.4.19 (frontend), esbuild (server)

### 1.2 Backend API Signatures (ALREADY IMPLEMENTED)

All 5 endpoints exist in `server/routes.ts`. Reference implementation:

```typescript
// POST /api/billing/checkout-session
// Body: { planId: "starter" | "professional" | "premium" }
// Returns: { sessionId: string, url: string, checkoutUrl: string }
// Auth: Required (via session)

// GET /api/billing/subscriptions
// Returns: { subscriptions: Subscription[] }
// Auth: Required

// POST /api/billing/subscriptions/:stripeSubscriptionId/cancel
// Body: { reason?: string }
// Returns: { status: "cancelled", cancelledAt: ISO8601 }
// Auth: Required

// POST /api/billing-portal-session
// Returns: { url: string }
// Auth: Required

// POST /api/webhooks/stripe
// Body: Raw Stripe webhook event
// Returns: { received: true }
// Auth: NOT required (Stripe signature verification)
```

### 1.3 Database Schema (LOCKED)

```sql
TABLE subscriptions (
  id: uuid (PK)
  advisorId: uuid (FK to advisors)
  planName: string ("starter" | "professional" | "premium")
  amount: number (cents, e.g., 2000 for $20)
  status: string ("active" | "cancelled" | "past_due")
  stripeCustomerId: string
  stripeSubscriptionId: string (unique)
  stripePriceId: string
  stripePaymentMethodId: string (nullable)
  nextBillingDate: date
  createdAt: timestamp
  updatedAt: timestamp
  cancelledAt: timestamp (nullable)
  cancelReason: string (nullable)
)
```

### 1.4 Backend Implementation (COMPLETE)

#### server/stripe-service.ts
- `createCheckoutSession(customerId, priceId, returnUrl)` â†’ Stripe checkout session
- `getOrCreateStripeCustomer(advisorId, email)` â†’ Stripe Customer ID
- `getSubscription(stripeSubscriptionId)` â†’ Subscription details from Stripe API
- `cancelSubscription(stripeSubscriptionId)` â†’ Cancels via Stripe API
- `parseWebhookEvent(body, signature)` â†’ Validates & parses webhook

#### server/storage.ts (Database Layer)
- `createSubscription(advisorId, { planName, amount, stripeCustomerId, stripeSubscriptionId, stripePriceId, nextBillingDate })`
- `updateSubscription(stripeSubscriptionId, { status, nextBillingDate, stripePaymentMethodId })`
- `getSubscriptionByStripeId(stripeSubscriptionId)`
- `getActiveSubscription(advisorId)`
- `cancelSubscription(stripeSubscriptionId, reason)`

#### server/routes.ts (API Endpoints)
- `POST /api/billing/checkout-session` (requireAuth middleware)
- `GET /api/billing/subscriptions` (requireAuth middleware)
- `POST /api/billing/subscriptions/:stripeSubscriptionId/cancel` (requireAuth middleware)
- `POST /api/billing-portal-session` (requireAuth middleware)
- `POST /api/webhooks/stripe` (webhook signature verification)

All endpoints include:
- Proper error handling + logging to console
- Session-based authentication (session cookie via `requireAuth`)
- Idempotency checks where applicable
- Webhook signature verification for Stripe events

---

## 2. FRONTEND INTEGRATION (IN PROGRESS)

### 2.1 Billing Page Component

**File:** `client/src/pages/billing.tsx`

**Responsibilities:**
1. Display current active subscription (or "No active subscription" if none)
2. Show 3 plan cards with pricing
3. Handle checkout flow (create session â†’ redirect to Stripe Checkout)
4. Display success/cancel messages (from URL params)
5. Show [Cancel Plan] button for active subscriptions
6. Load state handling
7. Error messages

**Component Pattern:**
- Use `useAuth()` hook to get authenticated user (advisorId)
- Use `useQuery` from TanStack React Query to fetch `/api/billing/subscriptions`
- Use `useMutation` to trigger checkout & cancellation
- Parse URL params: `?success=true`, `?cancel=true`
- Use Radix UI components + Tailwind CSS (match existing MoneyClip design language)

**Plan Data (Hardcoded):**
```typescript
const plans = [
  { id: "starter", name: "Starter", price: 20, description: "Essential features" },
  { id: "professional", name: "Professional", price: 45, description: "Advanced tools" },
  { id: "premium", name: "Premium", price: 60, description: "Full access" },
];
```

### 2.2 Stripe Client Setup

**File:** `client/src/lib/stripe.ts`

**Responsibilities:**
- Load Stripe.js library with public key from env
- Export `stripePromise` for future use (Stripe Elements, if needed)

**Pattern:**
```typescript
import { loadStripe } from "@stripe/js";
export const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

### 2.3 Environment Variables

**File:** `client/.env.local` (or build config)

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_[YOUR_TEST_KEY]
```

Get from Stripe Dashboard â†’ Developers â†’ API Keys (test mode) â†’ Publishable Key

---

## 3. EXECUTION STEPS

### Phase 1: Backend Implementation (COMPLETE)
- âœ… `server/stripe-service.ts` created
- âœ… `server/storage.ts` updated with subscription functions
- âœ… `server/routes.ts` updated with 5 API endpoints
- âœ… Webhook signature verification integrated

### Phase 2: Frontend Implementation (CURRENT)
- [ ] Create `client/src/pages/billing.tsx` (Prompt 4)
- [ ] Create `client/src/lib/stripe.ts` (Prompt 5)
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` to `.env.local`

### Phase 3: Testing & Deployment
- [ ] Test checkout flow end-to-end
- [ ] Verify webhook events in Stripe Dashboard
- [ ] Commit to v4-dev
- [ ] Deploy to GCP

---

## 4. SUCCESS CRITERIA

### Frontend Checklist
- âœ… Billing page loads without errors
- âœ… Can view current subscription (if active)
- âœ… Can click [Subscribe] on plan cards
- âœ… Redirects to Stripe Checkout (not an error page)
- âœ… Test payment succeeds (card: 4242 4242 4242 4242)
- âœ… Subscription appears in database after payment
- âœ… Billing page reflects new subscription status
- âœ… Can click [Cancel Plan] button
- âœ… Subscription status changes to "cancelled"
- âœ… Success/cancel messages display correctly
- âœ… No console errors or network failures

### Backend Checklist (COMPLETE)
- âœ… Stripe API calls work with real credentials
- âœ… Database mutations persist correctly
- âœ… Webhook events received & processed
- âœ… Session-based auth enforced on endpoints

---

## 5. DELIVERABLES

### Code Files
1. `server/stripe-service.ts` (DONE)
2. `server/storage.ts` updates (DONE)
3. `server/routes.ts` endpoints (DONE)
4. `client/src/pages/billing.tsx` (PENDING)
5. `client/src/lib/stripe.ts` (PENDING)

### Configuration
1. `.env.local` with `VITE_STRIPE_PUBLISHABLE_KEY` (PENDING)

### Documentation
1. `STRIPE_DEV_INTEGRATION_SOW.md` (THIS FILE)
2. `TOMORROW_MORNING_CHECKLIST.md` (existing)

---

## 6. TIMELINE

**Execution Window:** Tomorrow morning, 2-3 hours  
**Prompt 4 (Billing Page):** 30 minutes  
**Prompt 5 (Stripe Client):** 10 minutes  
**Manual Steps (env vars):** 5 minutes  
**Testing:** 30 minutes  
**Deployment:** 10 minutes  

**Total:** ~2.5 hours to demo-ready state

---

## END OF SOW


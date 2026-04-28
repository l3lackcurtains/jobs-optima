# Billing Setup & Testing — Polar.sh

> **Status: dormant by default.**
>
> Jobs Optima ships as a free, MIT-licensed, BYO-key tool. The billing system below is built and tested but **disabled** unless you set the Polar env vars. With no env, all `/api/billing/*` endpoints return 404 (except `GET /me`, which reports a static free-tier shape so the UI degrades cleanly), and upgrade CTAs are hidden in the UI.
>
> **To enable billing**, set the four env vars in [§ 2](#2-environment-variables) and restart the API. To stay free/OSS forever, do nothing — the dormant code carries no runtime cost.
>
> If you're an OSS user just trying to run Jobs Optima, **skip this doc.** You don't need it.

This guide walks you through configuring the Pro tier ($5/mo, 500 AI ops) on top of Polar.sh and testing it end-to-end. Use this if you operate the hosted version at a domain you control and want to charge users.

## Architecture recap

| Tier | Price | AI Access | Daily cap | Monthly cap |
|------|-------|-----------|-----------|-------------|
| Free | $0    | BYO key (Gemini/OpenAI/Anthropic) | 200 calls | unlimited at user's cost |
| Pro  | $5/mo | Managed Gemini Flash (no key needed) | 100 calls | 500 ops |

Resolution order in `ai.service.ts:resolveModel()`:
1. Pro + credits available → platform key, decrement 1 credit
2. BYO key configured → use it (no credit deducted)
3. Otherwise → throws `NO_AI_ACCESS`

Background tasks (job scanner relevance scoring) bypass credit accounting via `getPlatformModel()`.

## 1. Polar.sh account setup

### Sandbox first (always)

1. Sign up at <https://sandbox.polar.sh>
2. Create or pick an organization
3. Settings → **Developers** → **Personal Access Token** → create one with scopes:
   - `checkouts:write`
   - `customer_sessions:write`
   - `subscriptions:read`
   - `webhooks:read`
   - Save token → `POLAR_ACCESS_TOKEN`

### Create the Pro product

1. **Products** → **New Product**
2. Name: `Jobs Optima Pro`
3. Type: **Recurring**, monthly
4. Price: **$5.00 USD**
5. Copy the product ID (`prod_...`) → `POLAR_PRODUCT_ID`

### Set up webhook

1. **Settings → Webhooks → Add Endpoint**
2. URL: `https://jobsoptima.com/api/billing/webhooks/polar`
   - For local dev, use ngrok or similar (see [Local testing](#local-testing) below)
3. Format: **Raw**
4. Subscribe to events:
   - `subscription.created`
   - `subscription.active`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.revoked`
   - `order.paid`
5. Copy webhook secret (`whsec_...`) → `POLAR_WEBHOOK_SECRET`

## 2. Environment variables

Add to `apps/api/.env`:

```bash
PLATFORM_GEMINI_API_KEY=AIza...           # https://aistudio.google.com/apikey
POLAR_ACCESS_TOKEN=polar_pat_...
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_PRODUCT_ID=prod_...
POLAR_ENVIRONMENT=sandbox                  # flip to 'production' when going live
POLAR_SUCCESS_URL=https://jobsoptima.com/dashboard?upgraded=1
```

For local dev, override `POLAR_SUCCESS_URL=http://localhost:4000/dashboard?upgraded=1`.

Restart the API after changes.

## 3. Local testing

The webhook needs a public URL to reach your local API. Use ngrok:

```bash
# Install if needed
brew install ngrok            # or: https://ngrok.com/download

# Tunnel the API
ngrok http 8888
```

Copy the `https://xxxx.ngrok-free.app` URL and update the Polar webhook endpoint to:
```
https://xxxx.ngrok-free.app/api/billing/webhooks/polar
```

Then start the stack:
```bash
npm run dev
```

## 4. End-to-end test flow

Polar sandbox accepts these test cards:
- **Success:** `4242 4242 4242 4242`
- **Declined:** `4000 0000 0000 0002`
- **3DS auth:** `4000 0027 6000 3184`
Use any future expiration, any CVC, any zip.

### Happy path

1. Sign up at `http://localhost:4000/signup` with a fresh email
2. Visit `/dashboard` → confirm the amber "Enable AI features" nudge appears
3. Click **Upgrade to Pro** → redirects to Polar sandbox checkout
4. Pay with `4242 4242 4242 4242`
5. Polar redirects back to `/dashboard?upgraded=1`
6. Verify in MongoDB:
   ```js
   db.users.findOne({ email: 'test@example.com' }, {
     plan: 1, creditsRemaining: 1, creditsResetAt: 1,
     polarCustomerId: 1, polarSubscriptionId: 1
   })
   ```
   Should show `plan: 'pro'`, `creditsRemaining: 500`, both polar IDs set.
7. Visit `/settings` → SubscriptionCard shows **Pro** badge, credit bar at 0/500.
8. Run any AI op (optimize a resume) → confirm `creditsRemaining` decrements.

### Cancel & revoke flow

1. In `/settings` → click **Manage subscription** → opens Polar customer portal
2. Cancel the subscription
3. Polar fires `subscription.canceled` → user stays Pro until period end (sandbox: end of month)
4. To force the revocation event in sandbox, in Polar dashboard → Subscriptions → manually revoke
5. Verify user reverts: `plan: 'free'`, `creditsRemaining: 0`, `polarSubscriptionId: null`

### Out-of-credits flow

1. Manually drain credits in MongoDB:
   ```js
   db.users.updateOne({ email: '...' }, { $set: { creditsRemaining: 0 } })
   ```
2. Try an AI op → frontend toast: *"You've used all your monthly credits..."* with **Add API key** action button.
3. The dashboard nudge should now read **"You're out of credits"**.
4. Adding a BYO key in Settings should restore access without a Pro upgrade.

### Daily cap flow

1. In MongoDB, set `dailyCallsCount: 100` and `dailyCallsResetAt: <now>`.
2. Try an AI op → toast: *"Daily limit reached. Try again in 24 hours."*
3. Set `dailyCallsResetAt: <yesterday>` → call succeeds and counter resets to 1.

## 5. Webhook signature debugging

If webhooks return 400 with "Invalid webhook signature":

1. Confirm `POLAR_WEBHOOK_SECRET` matches the secret in Polar dashboard exactly.
2. The secret is base64-decoded. Polar prefixes with `whsec_` — the code strips it; raw or prefixed both work.
3. Standard Webhooks spec: `id.timestamp.body` is HMAC-SHA256-signed with the secret.
4. Tail the logs: `npm run dev:api` — `BillingService` logs the event type when verification passes.
5. Replay an event from Polar dashboard → **Webhooks → Recent Deliveries → Resend**.

## 6. Going to production

Before flipping to live:

- [ ] Polar org switched to **production** (not sandbox) and identity-verified
- [ ] New production access token created → update `POLAR_ACCESS_TOKEN`
- [ ] Production product created with $5/mo recurring → update `POLAR_PRODUCT_ID`
- [ ] Production webhook endpoint added with prod URL → update `POLAR_WEBHOOK_SECRET`
- [ ] `POLAR_ENVIRONMENT=production`
- [ ] `POLAR_SUCCESS_URL=https://jobsoptima.com/dashboard?upgraded=1` (no localhost)
- [ ] `PLATFORM_GEMINI_API_KEY` is a separate billing-attached Google key (not the dev one)
- [ ] Test once with a real card; refund yourself via Polar dashboard
- [ ] Set up Polar payout method (Stripe Connect / bank account)

## 7. Ops & monitoring

Quick MongoDB queries for support:

```js
// Find a user's billing state
db.users.findOne({ email: 'x@y.com' }, {
  plan: 1, creditsRemaining: 1, creditsResetAt: 1,
  dailyCallsCount: 1, dailyCallsResetAt: 1,
  polarCustomerId: 1, polarSubscriptionId: 1,
});

// Top credit users (potential abuse)
db.users.find({ plan: 'pro' })
  .sort({ creditsRemaining: 1 })
  .limit(10);

// All Pro subscribers
db.users.countDocuments({ plan: 'pro' });

// Manual credit grant (apology, support, beta tester)
db.users.updateOne({ email: '...' }, { $inc: { creditsRemaining: 100 } });
```

## 8. Pricing knobs

Centralized in `apps/api/src/modules/ai/ai.constants.ts`:

```typescript
export const PRO_MONTHLY_CREDITS = 500;
export const PRO_DAILY_CALL_CAP = 100;
export const FREE_DAILY_CALL_CAP = 200;
```

To change the price ($5 → $9, etc.), update the Polar product. The number isn't hardcoded server-side — only the credit caps are.

## 9. Disabling billing again

To turn billing back off (revert to OSS mode):
1. Unset `POLAR_PRODUCT_ID` and/or `POLAR_ACCESS_TOKEN` in env, restart API
2. Endpoints return 404; upgrade CTAs disappear from the UI
3. Existing Pro users keep `plan: 'pro'` in MongoDB but won't see the SubscriptionCard
4. Optional: bulk-revert with `db.users.updateMany({}, { $set: { plan: 'free', creditsRemaining: 0 } })`

## 10. Common gotchas

- **Webhook URL must be HTTPS** — ngrok, Vercel preview, or prod only. Localhost won't work.
- **First subscription event** is usually `subscription.created`, sometimes `subscription.active` arrives without it. The code handles both.
- **Renewal credits**: refilled by the `order.paid` event, not by `subscription.updated`. If credits aren't refilling, check that `order.paid` is subscribed in Polar.
- **Credit reset date** comes from `subscription.current_period_end`. If Polar omits this, the date stays null and the UI says "next billing date".
- **Job scanner doesn't deduct credits.** It uses `getPlatformModel()` directly — Gemini Flash is cheap enough to absorb. Don't try to wire credit accounting in there or active scanners will drain Pro users.

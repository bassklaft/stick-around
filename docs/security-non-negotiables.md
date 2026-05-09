# Security non-negotiables

Hard rules that any backend / auth / premium / admin work must comply with before merge. This doc is the gate, not a wish list — if a PR violates one of these, it does not ship.

## Today's state (v1.2.0)

FloofLife is **fully local-first**. There is no FloofLife-owned backend. All app state lives on-device in AsyncStorage + the documentDirectory. The only external services in play are:

- **RevenueCat** for purchase verification (their backend, their rate limits)
- **PostHog** for analytics (event ingestion, fire-and-forget)
- **openFDA** for FDA recall data (public read API, queried directly from the client)

So none of the rules below have an immediate code surface to enforce. They're load-bearing the moment any custom FloofLife endpoint ships — which is expected when premium-gated server-side features land (vet-share PDF rendering, multi-device sync, AI breed-suggestion, etc.).

---

## Rule 1 — service-role key never in client

The Supabase / Postgres service-role key (or any equivalent admin credential) bypasses RLS and gives full database write access. It must never appear in:

- The Expo / React Native bundle
- `app.json` / `eas.json` / any `EXPO_PUBLIC_*` variable
- Public repo files of any kind
- Logs that any third party (PostHog, Sentry, Crashlytics) ingests

The client gets only the **anon** key. All privileged work happens in server-side Edge Functions (or equivalent) where the service-role key lives in the function's secret store.

## Rule 2 — RLS on every table before data lands

Every Postgres table FloofLife creates ships with row-level security **enabled and policies written before any data is inserted**. The default-deny posture matters: `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` with zero policies means all access is denied — that is the desired starting state.

Per-table checklist that runs before merge:
- [ ] `ENABLE ROW LEVEL SECURITY` (no exceptions)
- [ ] At least one `SELECT` policy that scopes to `auth.uid()` (or admin)
- [ ] Explicit `INSERT` / `UPDATE` / `DELETE` policies (never wide-open)
- [ ] Policy unit tests in `supabase/tests/` covering row-level boundaries

## Rule 3 — entitlement always server-side

Premium features check entitlement on the server, not the client. The client may pre-emptively hide the UI for unentitled users (UX), but the server must independently verify on every request.

For functions that read RevenueCat:
- The Edge Function takes the user JWT, looks up the RevenueCat customer ID for `auth.uid()`, calls RevenueCat with the secret key, and only proceeds if `entitlements.active.premium` is present.
- The client-side flag (cached `isPremium` from `usePurchases()`) is a UX hint — never the gate.

## Rule 4 — IP-based rate limits on every backend endpoint

Any FloofLife-owned endpoint that costs money to run, processes user-supplied content, or could be abused to inflate database rows **must** enforce IP-based rate limits at the edge before doing any other work. This applies to: AI / LLM proxies, PDF rendering, notification sends, sync writes, search proxies — anything where unbounded request pressure costs us money or storage.

IP-based is the primary mechanism (not per-user) because:
- FloofLife has no account system today. There is no `auth.uid()` to key off.
- Edge-level enforcement runs before any database / function code, so it costs nothing when it rejects and never burns Edge Function CPU on attackers.
- Defends unauthenticated endpoints (which is currently 100% of them).

Per-user limits become an additive layer **if and when** account-based features ship — the IP layer stays in front of it as defense in depth. Schema sketch for that future state is at the end of this section.

### Implementation: where the limiter runs

Pick one (in order of preference for FloofLife's stack):

1. **Supabase Edge Functions + Upstash Redis** — Deno runtime, `@upstash/ratelimit` library does sliding-window or token-bucket against Redis. Free tier is enough for tens of thousands of req/day.
2. **Cloudflare Rate Limiting rules** — if FloofLife's domain is on Cloudflare, this is config-only (no code) and runs at the global edge before any origin call.
3. **Vercel Edge Middleware + Upstash** — same Upstash pattern, different host.

Same logical shape regardless of host:

```ts
// Supabase Edge Function example
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit";
import { Redis } from "https://esm.sh/@upstash/redis";

const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  // Sliding window. 60 req / minute is generous for app polling but
  // tight enough that bursting an LLM proxy 1000x is impossible.
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "fl:llm",        // namespace per endpoint family
});

Deno.serve(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { success, limit, remaining, reset } = await limiter.limit(ip);
  if (!success) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    });
  }
  // ...do the actual work
});
```

### Suggested ceilings

| Endpoint family            | Per-IP limit            | Notes |
|---|---|---|
| AI / LLM proxy             | 30 / hour, 200 / day    | Tight — most expensive endpoints |
| PDF render                 | 10 / hour, 60 / day     | CPU-heavy |
| Notification send          | 5 / minute, 100 / day   | Cheap but spammy if abused |
| Sync write                 | 60 / minute, 5000 / day | High limit; legitimate users sync often |
| Public read (recalls etc.) | 120 / minute            | Generous; cheap to serve |

### Caveats — why IP isn't enough on its own forever

- **NAT / mobile carriers**: dozens of legitimate users can share an IP. Set ceilings per-IP with that in mind — too tight and a single college dorm gets locked out.
- **IPv6 churn**: phones rotate IPv6 addresses; window-based limits (sliding 1 hour) handle this fine, but token-bucket with long-lived buckets does not.
- **Attacker cycling**: a determined attacker rotates IPs (residential proxies, Tor). IP limits raise the cost of abuse but don't eliminate it. Combine with edge-level WAF rules (Cloudflare / Supabase) for known-bad ASN blocking when needed.

### What's not OK

- ❌ Client-side enforcement only (e.g., disabling a button after N taps). Bypassed in 30 seconds with the network panel.
- ❌ A single global rate limit shared across all IPs. One bad actor saturates everyone.
- ❌ Limits inside the function body but after expensive work has already started. Reject *first*, work second.
- ❌ Trusting `x-forwarded-for` blindly when not behind a known proxy chain. Use the leftmost trusted hop, or the platform-provided IP header (`cf-connecting-ip` on Cloudflare, `Fly-Client-IP` on Fly, etc.).

### Future: per-user layer (when accounts ship)

When user accounts land (sync feature, premium-account features, etc.), per-user limits become the second line of defense — IP stays out front. Sketch:

### Schema shape

**Rate-limit data is kept off the `users` table.** Limits and usage live in their own tables, joined by `user_id`. Keeps the user table focused on identity, decouples limit-tier rollouts from user-row migrations, and makes it trivial to truncate / regenerate usage counters without touching identity data.

```sql
-- Per-(user, feature) configurable ceilings. One row per user per
-- feature; tier changes (free → premium) UPDATE this row.
CREATE TABLE user_limits (
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature        text NOT NULL,
  daily_limit    integer NOT NULL,
  weekly_limit   integer NOT NULL,
  monthly_limit  integer NOT NULL,
  tier           text NOT NULL,                 -- 'free' | 'premium' | future tiers
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, feature)
);
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
-- Users can read their own ceilings (so the client can show "X of Y
-- used today" UI). Writes are server-only via SECURITY DEFINER
-- functions — no client-side policies for INSERT/UPDATE/DELETE.
CREATE POLICY user_limits_select_own ON user_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Per-(user, feature, day) usage counter. UPSERT on the composite
-- PK so the row count stays bounded (one row per user per feature
-- per UTC day). Old rows can be pruned by a nightly job; the
-- check-and-increment function only reads the trailing 30 days.
CREATE TABLE user_feature_usage (
  user_id  uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature  text    NOT NULL,
  day      date    NOT NULL,
  count    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, feature, day)
);
ALTER TABLE user_feature_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_feature_usage_select_own ON user_feature_usage
  FOR SELECT USING (auth.uid() = user_id);
```

### Why a separate table (not user columns)

- **Schema stability**: a new feature with its own ceilings doesn't trigger a `users` migration that locks the identity table.
- **Tier rollouts**: bumping all premium users' limits is a single `UPDATE user_limits SET ... WHERE tier='premium'` that doesn't risk other user fields.
- **Auditability**: `updated_at` on `user_limits` records the last tier change without polluting the user row's history.
- **Pruning**: usage counters can be vacuumed independently (nightly job that drops `day < now() - 31`) without touching anything that matters for identity.
- **Defense in depth**: even if someone exfils the `users` table (e.g. through a misconfigured policy), they don't get the rate-limit ceilings as bonus reconnaissance.

### Check + increment as a single Postgres function

Atomic so a burst of concurrent requests can't all squeak in under the limit:

```sql
CREATE OR REPLACE FUNCTION fl_check_and_increment_usage(
  p_feature text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_daily_limit int;
  v_weekly_limit int;
  v_monthly_limit int;
  v_daily_used int;
  v_weekly_used int;
  v_monthly_used int;
BEGIN
  -- Pull this user's limits (premium-aware tier set by caller upstream).
  EXECUTE format(
    'SELECT %I, %I, %I FROM users WHERE id = $1',
    p_feature || '_daily_limit',
    p_feature || '_weekly_limit',
    p_feature || '_monthly_limit'
  )
  INTO v_daily_limit, v_weekly_limit, v_monthly_limit
  USING v_user;

  -- Tally usage windows.
  SELECT COALESCE(SUM(count), 0) INTO v_daily_used
    FROM feature_usage
    WHERE user_id = v_user AND feature = p_feature AND day = v_today;
  SELECT COALESCE(SUM(count), 0) INTO v_weekly_used
    FROM feature_usage
    WHERE user_id = v_user AND feature = p_feature
      AND day >= v_today - interval '6 days';
  SELECT COALESCE(SUM(count), 0) INTO v_monthly_used
    FROM feature_usage
    WHERE user_id = v_user AND feature = p_feature
      AND day >= v_today - interval '29 days';

  IF v_daily_used   >= v_daily_limit   THEN RETURN jsonb_build_object('ok', false, 'reason', 'daily_limit',   'limit', v_daily_limit,   'used', v_daily_used);   END IF;
  IF v_weekly_used  >= v_weekly_limit  THEN RETURN jsonb_build_object('ok', false, 'reason', 'weekly_limit',  'limit', v_weekly_limit,  'used', v_weekly_used);  END IF;
  IF v_monthly_used >= v_monthly_limit THEN RETURN jsonb_build_object('ok', false, 'reason', 'monthly_limit', 'limit', v_monthly_limit, 'used', v_monthly_used); END IF;

  -- Atomic increment.
  INSERT INTO feature_usage(user_id, feature, day, count)
    VALUES (v_user, p_feature, v_today, 1)
    ON CONFLICT (user_id, feature, day)
    DO UPDATE SET count = feature_usage.count + 1;

  RETURN jsonb_build_object(
    'ok', true,
    'daily_used',   v_daily_used + 1,   'daily_limit',   v_daily_limit,
    'weekly_used',  v_weekly_used + 1,  'weekly_limit',  v_weekly_limit,
    'monthly_used', v_monthly_used + 1, 'monthly_limit', v_monthly_limit
  );
END $$;
```

The Edge Function calls this as the first step, before doing any other work, and returns 429 with the limit metadata if `ok=false`.

### Premium tiers

Premium users get higher limits. Set defaults to the **free** tier; on RevenueCat webhook (premium activated), bump that user's limit columns to the premium tier values. On premium expiration, drop them back. Do this in a webhook handler — not on every request — so the limits column is the source of truth.

Suggested starting tiers (review before any feature ships, these are illustrative):

| Feature                | Free daily / weekly / monthly | Premium daily / weekly / monthly |
|---|---|---|
| AI breed-suggestion    | 10 / 30 / 100                 | 200 / 1000 / 3000                |
| Vet-share PDF render   | 3 / 10 / 30                   | 50 / 200 / 600                   |
| Notification send      | 50 / 200 / 600                | 200 / 1000 / 3000                |

---

## Rule 5 — sensitive API calls never made directly from the client

The moment FloofLife has a backend, **sensitive third-party API calls are proxied through it**. The client never holds the credential and never makes the upstream request directly. This is non-negotiable for **all** of the following categories:

### Category 1 — AI / LLM providers
OpenAI, Anthropic, Google, Cohere, any model-hosting provider. Keys are billable per-token; one leaked key drains a credit card in minutes. Examples that go through the backend:
- Breed-suggestion ("describe my floof and tell me what mix")
- Photo analysis (vision-LLM "what's in this photo")
- Free-text health-question responses
- Any chat / completion / embedding call

### Category 2 — Payment providers
Stripe, PayPal, Square, Adyen, RevenueCat **server-side secret key**, Apple's StoreKit server APIs, Google Play Billing server APIs. The on-device SDK key (e.g. RevenueCat's `appl_...` public key) is meant to ship in-app — that's fine. The **server-side secret** that authorizes refunds, webhooks, charge creation, and entitlement queries from a trusted source is backend-only.
- Charge / refund / dispute handling
- Webhook handlers (always server-side)
- Server-to-server entitlement re-verification
- Any flow that mutates payment state

### Category 3 — Email / SMS / push senders
Resend, SendGrid, SES, Postmark, Twilio, Pushover, etc. Direct client access lets anyone use FloofLife's sending domain to spam from. Even a "send a single welcome email" flow goes through a backend endpoint that the rate limiter from Rule 4 protects.

### Category 4 — Cloud storage providers
S3, Cloudflare R2, GCS, Azure Blob, Supabase Storage with the service-role key. Two anti-patterns to avoid:
- ❌ Shipping the provider's master credential in the client (full read/write of every bucket forever)
- ❌ Routing all file bytes through the Edge Function (kills throughput, blows up Edge Function CPU bills)

Correct pattern: client calls a FloofLife Edge Function which **mints a short-lived presigned URL** (S3 / R2 / GCS / Supabase Storage all support this), scoped to a single object key the user is authorized to read or write, with a small TTL (5–15 min). Client then uploads / downloads directly to the storage provider using that signed URL. This counts as "server-mediated" — the backend gates access — without proxying the bytes.

### Category 5 — Anything else that…
- Is **billed per-request** in a way the user can amplify (search APIs, geocoding, transcription, OCR, etc.)
- Returns content that could be **re-used for free** if the call were exposed (premium-gated AI output, paid datasets)
- Could be used to **impersonate FloofLife** (sending domain, support contact, internal Slack webhooks)

If a new third-party integration looks like any of those, it goes through the backend before it ships.

### The pattern, reduced

Client → FloofLife Edge Function (rate-limited per Rule 4, JWT-authed if accounts exist) → upstream provider with the credential held in Edge secret store → response back to client (filtered to only what the user is entitled to receive).

For storage specifically, swap "response back to client" for "presigned URL back to client" and let the bytes flow direct to/from the storage provider.

### Why client-direct is never acceptable

- **Credential exposure**: anything compiled into the app bundle (or fetched at runtime from a config endpoint) can be extracted. iOS app binaries are decompilable; man-in-the-middle on the network shows every request.
- **No rate limit enforcement possible**: an attacker who has the key bypasses the FloofLife rate limiter entirely and bills your provider account directly.
- **No audit trail**: server-side logs are the only place a leaked-key incident can be reconstructed. Client-side requests are invisible to ops.
- **No revocation**: rotating a client-shipped key requires a new app release. Server-side keys rotate in 30 seconds.

### What counts as "the second the backend is ready"

- ❌ Don't ship a client-direct call "temporarily" while the backend is being built. Either the endpoint is server-side or the feature isn't shipped.
- ❌ Don't gate the proxy with feature flags ("if proxy reachable, use it; else fall back to client-direct"). The fallback is the leak.
- ✅ If a feature can't ship without the backend ready, defer the feature until the backend is ready. The shape of the security model is more valuable than any single feature.

### Public read-only APIs are still fine client-direct

openFDA recall queries, public AKC breed pages, etc. — anything where (a) the API key is meant to be public OR (b) there's no key at all OR (c) usage is rate-limited by the provider on a per-IP basis with no FloofLife liability — can stay client-direct. The rule is about **FloofLife-billable** and **FloofLife-secret** calls. If the answer to "could an attacker drain my credit card or impersonate FloofLife?" is no, client-direct is fine.

---

## Rule 6 — secrets in env, never in code (and env-vars are SERVER-only)

Edge Function secrets (RevenueCat secret key, OpenAI API key if/when one lands, Resend / SES tokens for email, S3 / R2 access keys, etc.) live in the Edge Function secret store. They never appear in:
- `.env` files committed to the repo
- `app.json` / `eas.json`
- Source code (encoded or otherwise)
- Logs (including request/response logging middleware — strip auth headers before they hit the log pipeline)

### "Env var" is not a synonym for "safe"

A common dangerous mental shortcut: *"the secret is in an environment variable, so it's safe."* That sentence is only true on a **server** where the env var lives in the runtime's process memory and never touches a client.

- ✅ `OPENAI_API_KEY` set on a Supabase Edge Function — safe (runs server-side, never shipped).
- ❌ `EXPO_PUBLIC_OPENAI_API_KEY` in `.env` — **NOT SAFE**. The `EXPO_PUBLIC_` prefix means Expo bundles it into the JS bundle that ships to the client. Anyone who downloads the .ipa can extract it in seconds (`unzip`, then grep). Same goes for any framework's "public env var" convention: `NEXT_PUBLIC_*`, `VITE_*`, `REACT_APP_*`, etc. — public means **public**, not "convenient and obscured."
- ❌ Server-side env var copied verbatim into a client-fetched config endpoint — equally not safe; the config endpoint becomes the leak.

Rule of thumb: if the env var is consumed by code that runs on a user's phone or in a user's browser, it is a public string. Treat it that way.

### What `EXPO_PUBLIC_*` is fine for

Things that are designed to be public and have provider-side abuse protection on the key:
- RevenueCat's iOS SDK key (`appl_...`) — meant to be public; tied to your app's bundle ID.
- PostHog public project key — meant to be public; tied to your project, rate-limited per-event.
- Public Maps / Places SDK keys with bundle-ID + referrer restrictions configured in the provider dashboard.

Rotate immediately on any suspected leak. Rotation procedure documented in `docs/runbooks/credential-rotation.md` (write this when the first secret lands).

---

## Rule 7 — hard budget caps at every provider

Every paid provider FloofLife uses **must have a hard spend cap configured at the provider level** that automatically halts service when hit. Soft alerts (email me at $X) are an addition, not a substitute. The principle: **better for the app to go down for a few hours than for me to wake up to a $100,000 bill.**

This rule sits in the same family as Rule 4 (rate limits): defense in depth against runaway cost. The rate limiter rejects the burst at the edge; the budget cap is what catches the *one* request that escapes (configuration mistake, new feature without a limiter, novel attack pattern) before it compounds.

### Per-provider configuration (all of these need caps before any production traffic touches them)

| Provider                              | Hard cap mechanism                                                              | Notes |
|---|---|---|
| **OpenAI**                            | Dashboard → Limits → "Monthly budget" with **hard limit** (not soft)            | Hard limit halts API calls; soft limit only emails. Configure both. |
| **Anthropic**                         | Workspace → Cost limits → monthly cap                                            | Same shape — set the hard cutoff, not just an alert. |
| **AWS** (any service)                 | AWS Budgets + Budget Action that revokes IAM via SCP / role detach              | AWS Budgets alone are alerts only — pair with a Lambda or SCP action that disables the offending service. |
| **GCP** (any service)                 | Cloud Billing budgets + programmatic action via Pub/Sub → Cloud Function       | Same — vanilla budget is alert-only; the programmatic action is what cuts off. |
| **Cloudflare** (Workers, R2, AI)      | Per-Worker / per-account spending limits in dashboard                            | Workers Paid: $5 included + per-request thereafter. Cap the overage. |
| **Supabase**                          | Project settings → Spend cap (toggle "On"); pauses project at the cap            | Pause-on-limit is the safe default. |
| **Vercel / Netlify**                  | Team Spending Cap in dashboard                                                   | Pauses deploys / serverless functions at cap. |
| **Stripe**                            | No built-in spend cap (it's revenue, not cost) — use **Radar** for fraud rules   | Different shape: cap *hostile inflows* via Radar rules, not outflows. Set up Radar's velocity rules + 3DS triggering early. |
| **Twilio**                            | Account-level spending cap via support ticket + programmatic Spend Webhook       | Twilio's UI cap is soft; the support-ticket cap is the hard one. |
| **Resend / SendGrid / Postmark**      | Tier-based send limits (built-in) + dashboard alert thresholds                  | Most email providers have intrinsic per-day caps tied to plan; pick the smallest plan that meets needs. |
| **RevenueCat**                        | Per-MTR billing — costs scale with active payers, no runaway risk                | Lower priority for a budget-cap layer; revenue-aligned. |
| **Sentry / PostHog / Datadog (logs)** | Event quotas + drop-after-quota                                                  | Configure to **drop** events past quota, not buffer/bill them. |

### Tiered alerts before the cliff

For every provider above, set warning alerts at **50% / 75% / 90%** of the monthly cap. Hitting 50% mid-month is normal growth signal; hitting 75% by week 2 is "investigate now"; hitting 90% is "shut something off before the hard cap kicks in." The hard cap is the floor, not the operating point.

Email + push notification on each alert. No "we'll watch the dashboard" — that's how the $100k bills happen.

### Per-environment caps

Dev / staging / production have **separate billing accounts** (or separate API keys with separate caps) wherever the provider supports it. A dev-environment loop that hits a thousand LLM calls per minute should burn the dev cap, not the prod cap.

When a provider doesn't support per-key caps, use **separate accounts** for dev vs prod even if it costs a small amount more — the isolation is worth it.

### What's not OK

- ❌ "I set up an alert" without a hard cap. Alerts get missed (sleep, vacation, alert fatigue).
- ❌ Hard cap set at 10x the expected monthly spend "for safety." That's not a cap, that's a credit limit. Cap should be 1.5–2x the realistic worst-case month so a single bad day can't drain it.
- ❌ Cap configured *somewhere* without a regular re-review. Costs drift; legitimate growth eats headroom; review caps quarterly minimum.
- ❌ Single shared account for dev + prod. One dev mistake takes prod down (or, worse, drains prod's runway).

### When the cap fires

Document the runbook for "we hit the cap, services are off" before it can happen, not after. Includes:
- How to verify it's a legitimate cap (vs an outage in the provider)
- Who has permission to raise the cap (one person, off-hours-reachable, MFA-protected)
- The communication template for users ("a feature is temporarily unavailable")
- The post-mortem checklist for figuring out *why* spend was high

Stub: `docs/runbooks/budget-cap-fired.md` — write this when the first paid provider goes live.

---

## Rule 8 — privacy contract

Per the existing privacy posture: pet names, photos, free-text notes, and tummy / health log entries stay **device-local**. PostHog events get neutered fields (event-only, no payload of user content). RevenueCat sees only the anonymous user ID.

When a backend ships, the privacy contract gets a structured update — see `docs/privacy.md` (write this alongside the first sync feature).

---

## Pre-merge gate (use as a checklist on backend PRs)

- [ ] No service-role key anywhere reachable from the client
- [ ] Every new table has RLS enabled with explicit policies
- [ ] Every privileged operation re-checks entitlement server-side
- [ ] Every backend endpoint enforces IP-based rate limits at the edge before any other work
- [ ] Per-user limits added on top of IP limits when account-based features ship
- [ ] No sensitive third-party API call (LLM, mailer, billing-secret, cloud-storage credential, payment provider) is made directly from the client — all proxied through Edge Functions (or for storage, via short-lived presigned URLs minted server-side)
- [ ] Secrets live in the Edge Function secret store, not the repo — and no `EXPO_PUBLIC_*` / `NEXT_PUBLIC_*` / equivalent contains a real secret
- [ ] Every paid provider has a **hard** spend cap configured (not just alerts) before any production traffic touches it
- [ ] Tiered alerts at 50% / 75% / 90% of monthly cap on every paid provider
- [ ] Dev / staging / prod use separate provider accounts or per-key caps wherever supported
- [ ] Privacy contract updated if user-content leaves the device

# FloofLife — Security Non-Negotiables

**Status:** Source-of-truth reference for backend planning and implementation. Every Claude Code session that touches backend, auth, premium gating, admin paths, data storage, or cross-user data flow MUST read this first. These rules apply to the upcoming Supabase + Resend + APNS + Cloudflare R2 buildout (post-v1.2.0) and to every backend-adjacent change after that.

**Stack assumed:** Supabase (Postgres + Auth + Edge Functions + Storage) for primary backend, Resend for transactional email, Apple APNS for iOS push, Cloudflare R2 for object storage (photos, videos, log exports), RevenueCat for subscriptions, React Native + Expo SDK 54 for the iOS client.

**Philosophy:** every default leans toward "least exposed"; every exception requires explicit justification documented in this file or in `OVERNIGHT_NOTES.md`. We're a solo-founder consumer health-adjacent app. A single breach destroys trust permanently. Pet medical data, GPS pins, photos, and emotional content (seizure videos, end-of-life logs) live here. The blast radius of getting this wrong is total.

---

## SECTION 1 — RLS (Row Level Security) non-negotiables

Postgres Row Level Security is the primary tenant-isolation mechanism. The Supabase client SDK uses anonymous (anon) and authenticated JWT tokens; RLS is what stops a user with a valid auth token from reading another user's rows by guessing IDs or modifying queries. Without RLS, the entire client-server isolation model falls apart.

**Hard rules:**

1. **RLS enabled on every table BEFORE any data goes in.** Supabase tables ship with RLS OFF by default — must turn it on per table immediately on creation. The CI gate (rule 5 below) blocks merges that violate this.

2. **Every policy scoped to `auth.uid() = user_id`** at minimum. Default policy template:
   ```sql
   alter table <table_name> enable row level security;
   create policy "users own <table>" on <table_name>
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```
   For tables with shared resources (e.g., reference data, public recall feeds), a separate explicit `for select using (true)` policy is allowed but must be documented in this file's "Public-read tables" appendix below with justification.

3. **Service-role key NEVER appears in the React Native client.** Service role bypasses RLS — it's a backend-only credential. It belongs in:
   - Supabase Edge Functions (server-only environment variables)
   - Local dev `.env.local` files outside git
   - 1Password vault for the founder
   It must NEVER appear in: app bundle, Expo config plugin, `app.json`, environment variables prefixed `EXPO_PUBLIC_*`, or any client-shipped JS. Any commit that adds a service-role-shaped string (`eyJ...` JWT with `role: "service_role"`) to a client-shipped file is a security incident; rotate the key immediately, document in `OVERNIGHT_NOTES.md`, and review how it got there.

4. **Pre-launch penetration test:** before the first user-facing backend release, run a manual test suite that:
   - Creates two test users (User A and User B) with separate JWTs.
   - User A inserts a row with their `user_id`.
   - User B attempts to SELECT, UPDATE, and DELETE that row using their own JWT.
   - All three operations must return either zero rows or an RLS-policy-violation error. If any return User A's data, the policy is broken — fix and re-test.
   - Run the same test with the anon (unauthenticated) token. Anon must have zero access to user data tables.
   - Document results in `OVERNIGHT_NOTES.md` before shipping.

5. **Automated CI test that fails the build if any table is created without RLS enabled.** Implementation: a SQL migration linter that parses every `create table` migration and rejects the migration if a corresponding `alter table ... enable row level security` statement isn't present in the same migration file. Reject the PR/build, not just the migration. Recommended tool: `sqlfluff` with a custom rule, or a small Node script in `scripts/auditMigrations.js`.

6. **Audit log of every RLS policy change.** Every `create policy` / `alter policy` / `drop policy` statement must be in a versioned migration file under `supabase/migrations/`, never run ad-hoc against production. The migrations directory is the audit log. Rollbacks are themselves committed migrations, never `pg_dump`-then-restore. Founder reviews the full diff of any policy change PR before merge.

**Public-read tables (justification required if added):**

| Table | Reason for public read | Date added | Reviewer |
|---|---|---|---|
| _(none yet)_ | _(reserved for things like a shared FDA recall list cached in our DB)_ | | |

---

## SECTION 2 — App Store privacy disclosures (must update BEFORE backend version ships)

Mismatched privacy disclosures are an Apple Guideline 5.1.1 / 5.1.2 rejection in TestFlight or App Review, and a much worse problem if it ships and users notice (negative press, regulatory inquiries, rebuild cost). Disclosure work must precede the first backend-touching build.

**Hard rules:**

1. **Update App Store Connect privacy disclosures** before the first backend build is submitted to TestFlight. Specifically declare:
   - **Health & Fitness data** — Linked to Identity. Includes: vaccine records, weight, age, breed-specific health flags, GI logs (Tummy Tracker), seizure logs, tick logs, any future medical features.
   - **User ID** — Linked to Identity. The Supabase `auth.uid()` is a per-user UUID we control. Tell Apple this exists.
   - **User Content** — Linked to Identity. Pet photos, seizure videos, stool photos, vet-export PDFs, free-text notes.
   - **Diagnostics** — Linked to Identity. App version, OS version, crash logs (if we add Sentry or similar).
   - **Approximate Location** — Linked to Identity (current v1.0 disclosure already covers this for the Risk Map; reconfirm wording for tick-log + weather features).
   - **Purchases** — Linked to Identity, RevenueCat already handles this via App Store Connect.
   Each of the above must list the specific use cases (App Functionality, Analytics, Product Personalization). Avoid declaring data uses we don't actually do — over-declaration is also a 5.1 issue.

2. **Update Privacy Policy** at `https://bassklaft.github.io/floof-life/legal/privacy-policy.html` to match. The policy must precede the App Store disclosure update by at least 24 hours so a reviewer who clicks the policy link sees the updated version. Required sections:
   - What we collect (mirroring App Store categories above)
   - Where it's stored (Supabase region, R2 region, Resend region — name the regions)
   - Who has access (founder + named contractor named DPO if any; "no third-party data sales, ever")
   - How long we retain it (retention windows per data type)
   - How users delete their account + data (link to in-app delete flow + email contact)
   - GDPR / CCPA / VCDPA compliance specifics (if shipping in EU/CA/VA — and we are)
   - Children's data: app is not directed to children under 13; we don't knowingly collect children's data
   - Contact: Max's email + a designated privacy email alias (recommend `privacy@flooflife.app`)
   Re-host on GitHub Pages; commit the HTML to the repo. CDN cache invalidation: GitHub Pages takes 5-30 min; account for that in the disclosure update timing.

3. **Add an in-app onboarding privacy disclosure modal** for any auth-required feature (cloud sync, photo upload to R2, log export). Modal must:
   - State plainly what is being uploaded ("Pet name, breed, photos you choose to attach")
   - State where it goes ("Securely stored on FloofLife servers in [region]")
   - State who can see it ("Only you. Not other users. Not advertisers. Not sold.")
   - Provide a single "Continue" button + a "Stay local-only" button
   - Stay-local-only must be a real path — we never gate functionality behind cloud upload for safety-critical features per our Premium gating rules (see Section 4 + the Tummy Tracker spec).

4. **Generate Apple Privacy Manifest (`PrivacyInfo.xcprivacy`)** declaring exactly which APIs and data types are accessed. Required for any app submitted after May 1, 2024 (already past). Must declare:
   - `NSPrivacyAccessedAPITypes` for each restricted API (UserDefaults, FileTimestamp, SystemBootTime, DiskSpace) with a `NSPrivacyAccessedAPITypeReasons` justification code.
   - `NSPrivacyTracking` set to `false` (we don't do cross-app tracking).
   - `NSPrivacyCollectedDataTypes` mirroring the App Store Connect declaration.
   Generated via Expo config plugin or custom Xcode build phase; verify the file ships in the IPA via `unzip -p flooflife.ipa Payload/FloofLife.app/PrivacyInfo.xcprivacy`. Test before submission; rejection on this is silent and slow.

5. **Declare data NOT used for tracking.** "Tracking" under Apple's ATT framework has stricter rules — it specifically means linking user data with third-party data for advertising or sharing with data brokers. We do none of that. The Privacy Manifest's `NSPrivacyTracking = false` declaration must match reality: no cross-app identifiers (we already don't ship IDFA, only IDFV which is vendor-scoped), no third-party SDK that does fingerprinting (PostHog is configured to NOT use device IDs for cross-app linking), no data sharing with Meta/Google/etc. for ads.

6. **Mismatched disclosures = rejection.** Apple cross-checks the privacy manifest, App Store Connect disclosure, and the actual API usage in the app binary. If we declare we don't access `UserDefaults` but the binary does, that's a 5.1.2 rejection. Run a static analysis pass before each backend-touching submission: `grep` the bundled JS + native code for the relevant API surfaces and compare against the manifest.

---

## SECTION 3 — Bulk data exfiltration defenses

A logged-in user's auth token, by itself, lets them read their own data. The exfiltration risk: an attacker (insider, compromised account, leaked JWT, malicious extension) who can read AT-WILL across one user's full history, or worse — across many users' histories if RLS or service-role keys leak.

**Hard rules:**

1. **Rate limiting on every API route via Supabase Edge Functions.** Default policy: no more than `X` reads per minute per user, where `X` is defined by legitimate usage patterns. Initial values to encode:
   - Read-heavy routes (GET `/pets`, `/health-records`, `/stool-entries`): 60 req/min per `user_id`
   - Write routes (POST/PATCH): 30 req/min per `user_id`
   - Bulk export routes (`/export/*`): 5 req/min per `user_id`
   - Anonymous/unauthenticated routes (auth flow itself): 20 req/min per IP
   Implementation: Supabase Edge Function middleware reading from a Redis-compatible store (Upstash Redis is the recommended pairing). Headers: return `X-RateLimit-Remaining` and `Retry-After` so the client backs off gracefully.

2. **Pagination caps: never return more than 100 rows per query.** Every endpoint that returns a list must:
   - Accept `?limit` and `?cursor` parameters
   - Default `limit` to 50 if not provided
   - Cap `limit` at 100 even if the client asks for more (silently — no 400; just clamp)
   - Use cursor-based pagination (last_seen_id + last_seen_ts), not offset-based (offset is exploitable with high values to scrape full tables)

3. **Anomaly detection on read patterns.** Run a periodic job (every 15 min) that flags users whose read volume in the trailing 60 minutes exceeds 10× their 30-day median, or who hit any of:
   - 10,000+ rows read in an hour
   - 500+ requests in an hour
   - Reads from 5+ distinct IP addresses in 10 minutes
   - Reads from a country mismatched with the user's primary IP geolocation history
   Action on flag: send an alert to founder email (Resend transactional template) and queue the account for review. Don't auto-block — false positives on legitimate power users are user-hostile. Founder reviews and decides.

4. **Cloudflare R2 storage rules:**
   - Signed expiring URLs only — never public buckets.
   - Default expiration: 60 minutes for view URLs, 5 minutes for upload URLs.
   - Bucket-level setting: public access disabled at the bucket policy.
   - One bucket per data category: `floof-pet-photos`, `floof-stool-photos`, `floof-tick-photos`, `floof-seizure-videos`, `floof-vet-exports`. Don't co-mingle.
   - URLs are generated server-side via Edge Function; the client never holds R2 credentials.
   - Per-object metadata includes `user_id` so a future audit can verify ownership.

5. **API key rotation schedule with old-key revocation.** Every credential we ship rotates on a schedule:
   - Supabase service-role key: every 90 days
   - RevenueCat secret API key: every 90 days
   - Resend API key: every 90 days
   - APNS team-key/auth-key: per Apple's expiry (10 years for `.p8`, but we rotate manually every 12 months)
   - R2 access key + secret: every 90 days
   Rotation procedure: generate new key, deploy to Edge Function env vars, verify new key works in staging, revoke old key, document in `OVERNIGHT_NOTES.md` with timestamp. Calendar reminder set for 14 days before each expiry.

6. **No `SELECT *` queries from client — explicit column lists only.** Reason: when we add a sensitive column later (e.g., `user.medical_notes`, `pet.dna_sequence`, `entry.precise_lat`), `SELECT *` will auto-expose it via every existing read path. Explicit column lists force a code change to expose any new column, which makes a code review a security review. Enforce via lint rule (`eslint-plugin-supabase` if available, or a custom rule that parses `.select("...")` calls).

7. **Database backups encrypted at rest with separate keys from production access.** Supabase's Pro/Enterprise plan includes daily backups with separate encryption keys; verify this is on. Restore-test once per quarter on a staging clone — a backup nobody has restored is a backup that doesn't exist.

8. **Disable Supabase auto-generated REST API for sensitive tables — use explicit RPC functions only.** Supabase auto-generates REST endpoints for every table. For tables with sensitive data (seizure logs, stool photos, tick log threads), set `Studio → Auth & API → API Visibility = false` for that table and expose only the specific RPC functions the app needs (`get_my_stool_entries`, `create_stool_entry` etc.). The RPC functions live in `supabase/migrations/` and have RLS-aware bodies. This adds friction for the developer but makes a "how do I read all of [user]'s seizure logs" attack require finding a bug in one of our RPC functions instead of just querying the auto-API.

---

## SECTION 4 — Premium-bypass / privilege-escalation defenses

Premium gating is the revenue model. A successful bypass at scale destroys the business. The bypass paths to defend against: a user modifying client code to set `isPremium = true` locally, a user calling Premium APIs with a stolen Premium user's JWT, a user finding a flaw in the founder-override array, a user replaying a RevenueCat webhook, a user with a free tier reading premium content from the API directly.

**Hard rules:**

1. **NEVER trust client-side `isPremium` value.** The `isPremium` flag in `src/lib/purchasesContext.js` is for UI gating only (showing/hiding upgrade CTAs). It's NOT a security boundary. Every Premium-gated server-side resource must re-check entitlement against the database, regardless of what the client says.

2. **Server-side entitlement check on every Premium-gated API call.** Implementation pattern: every Edge Function that serves Premium content starts with:
   ```sql
   create function is_premium_user(user_id uuid) returns boolean
   language plpgsql security definer
   as $$
     select exists(
       select 1 from entitlements
       where user_id = $1 and entitlement_id = 'premium'
       and active_at <= now() and (expires_at is null or expires_at > now())
     );
   $$;
   ```
   Edge Function calls `is_premium_user(auth.uid())` and returns 403 if false. The `security definer` lets the function bypass RLS to read the entitlements table (which is otherwise locked down).

3. **Entitlements table writable ONLY by service-role webhook.** RLS policies:
   ```sql
   alter table entitlements enable row level security;
   create policy "users read own entitlements" on entitlements
     for select using (auth.uid() = user_id);
   -- NO insert/update/delete policy for authenticated users.
   -- Writes happen only via Edge Function with service role, called from the RevenueCat webhook handler.
   ```
   The client can READ its own entitlement (to mirror it for UI hint state), but cannot INSERT or UPDATE. A user attempting to upgrade themselves directly hits an RLS-policy-violation error.

4. **RevenueCat webhooks signed and verified before writing to entitlements table.** RevenueCat signs webhooks with HMAC-SHA256 using a shared secret. Edge Function must:
   - Read the `Authorization` header
   - Compute HMAC-SHA256 over the request body using the shared secret (stored in Supabase Edge Function secrets)
   - Compare to the header (constant-time comparison via `crypto.subtle.timingSafeEqual` or equivalent)
   - Return 401 if mismatch
   - Only write to entitlements table after signature verification passes
   Test: send a webhook with a wrong signature and verify it's rejected before any DB write happens. Add to the integration test suite.

5. **JWT contains user_id only, NO entitlement claims.** The Supabase Auth JWT includes `sub` (user_id) and standard claims. We do NOT add `is_premium` to the JWT — it would be cached in the JWT for the token lifetime (1 hour) and a user who's downgraded mid-session would still see Premium until their JWT refreshes. Always do a fresh DB lookup on `auth.uid()` for entitlement.

6. **Premium content served from backend, not just gated in UI.** This is the asymmetric defense: a fake-premium attacker who edits the client to bypass the `isPremium` check still can't get Premium content if that content isn't in the app bundle. Implementation:
   - Free-tier content: bundled in app (e.g., the basic checklist content)
   - Premium-tier content: fetched from the backend via Premium-gated API endpoints (e.g., the breed-personalized week 2+ checklist refresh, the Pawgress history, the Tummy pattern view)
   - The app bundle contains UI shells for Premium features, but not the data.
   - For features where this is impractical (e.g., on-device pattern detection in Seizure Layer 3), the gate is a fresh entitlement check on the relevant local-data-aggregation path.

7. **Promo codes / founder overrides validated server-side.** Currently `src/lib/founderOverride.js` ships a hardcoded `FOUNDER_DEVICE_IDS` array that the app reads at launch and sets `isPremium = true` for matching IDFV. **This is acceptable for v1.x because:**
   - The founder array contains only 1 entry (Max's iPhone IDFV)
   - IDFV is device-specific, not user-impersonatable
   - There's no backend yet, so server-side override is impossible
   - The override only sets a UI flag; it doesn't unlock premium server content (because there isn't any yet)
   - **When backend ships:** this migrates to a server-side `is_founder` column on the user record, set by service-role-only writes. The client-shipped `FOUNDER_DEVICE_IDS` array is removed entirely. The server reads `auth.uid()` → joins to the user record → checks `is_founder OR is_premium`. Future founder additions are done by Max running an SQL UPDATE in the Supabase Studio via a separate admin path (see Section 5). The hardcoded array is then dead code and gets deleted.

8. **Audit log of entitlement changes.** Every write to the entitlements table also writes to an `entitlements_audit` table (separate from the live entitlements table, append-only):
   ```sql
   create table entitlements_audit (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null,
     action text not null check (action in ('granted','revoked','renewed','transferred')),
     entitlement_id text not null,
     source text not null check (source in ('revenuecat_webhook','founder_override','admin_grant')),
     payload jsonb,
     ts timestamptz default now()
   );
   alter table entitlements_audit enable row level security;
   create policy "no client read of audit" on entitlements_audit for select using (false);
   create policy "no client write of audit" on entitlements_audit for all using (false);
   -- Audit table is service-role-only.
   ```
   Daily summary of audit log emailed to founder for review (Resend transactional template).

---

## SECTION 5 — Founder / admin access (when backend ships)

The admin path is the single highest-leverage attack surface. A compromised admin account = read access to every user's data, write access to every entitlement, ability to delete or modify anything. The defenses here are paranoid because the worst case is total.

**Hard rules:**

1. **Separate admin path from user app entirely.** Three options, in increasing isolation:
   - **Best:** different Supabase project entirely. Production project has zero admin tooling; admin operations happen against an admin-only project that mirrors data via foreign data wrappers or scheduled syncs.
   - **Acceptable:** same Supabase project, separate admin web tool (a Next.js or Remix app deployed under `admin.flooflife.app` with hardcoded IP restrictions, separate auth flow, separate session cookies).
   - **Minimum:** CLI-only admin operations via a local Node script that uses the service-role key from 1Password, never via a UI deployed anywhere.
   We start with the CLI-only path (lowest engineering cost) and migrate to a separate admin web tool when admin operations become frequent enough that a CLI is inefficient (probably v1.5+).

2. **The FloofLife app bundle contains ZERO admin code paths.** This means: no `if (user.isAdmin)` blocks, no admin-only screens behind a feature flag, no admin API endpoints reachable from the client. Decompiling the app bundle (which is straightforward for any user with Xcode + a copy of the IPA) must reveal nothing about the admin surface.

3. **Auth: Sign in with Apple + TOTP** (authenticator app or 1Password). NOT SMS — SIM-swap attacks are the documented #1 way founder accounts at small companies get compromised. Apple ID itself doesn't strictly require TOTP but the admin tool gates re-authentication on a TOTP code on top of the Apple ID session. TOTP secret stored in 1Password, NOT in env vars or git.

4. **IP allow-list as third factor where possible.** Maintain an allow-list of IPs in the Supabase Edge Function or the admin tool's middleware:
   - Home IP (Max's primary)
   - Backup IP (e.g., parents' house, partner's apartment)
   - Mobile hotspot fallback (only if explicitly enabled for travel)
   No public-internet wildcard. If Max needs to admin from a coffee shop, he turns on the mobile hotspot (which has a known-stable IP for his cellular plan) and lets that be the working IP. Short-lived "travel mode" tokens that allow a one-time IP-relaxed window can be added later if friction becomes real, but with founder-only review.

5. **Audit log every admin action to a separate immutable log table, daily email summary to founder for review.** The `admin_audit` table is append-only (revoke INSERT permission after table create, only the SECURITY DEFINER function can write). Every read of a user's data, every entitlement change, every deletion gets logged with:
   - Admin user ID
   - Action type (`read_user_data`, `grant_entitlement`, `delete_user`, etc.)
   - Target user ID
   - Justification (free-text — admin must enter a reason for any destructive action)
   - Source IP
   - User-agent
   - Timestamp
   Daily Resend email at 8 AM Eastern with the prior 24h's audit-log entries. Founder reviews; any unexpected entry = treat as compromise until proven otherwise.

6. **Time-bounded admin sessions (30-minute inactivity expiration).** No "stay signed in for 30 days" admin sessions. Re-auth (Apple + TOTP) every 30 minutes of inactivity. Friction is the point.

7. **Separate read-admin path from write-admin path; sudo-mode re-auth for destructive operations.** Read operations (viewing a user's data to debug a support ticket) are allowed in normal admin session. Write operations (especially destructive: deleting a user, revoking a paid entitlement, mass-deleting data) require an additional fresh TOTP code entered within the last 60 seconds (sudo mode). Failed sudo attempt = immediate session termination + alert email.

8. **Admin credentials live in 1Password — NEVER in env files, git, or the app bundle.** This applies to:
   - Supabase service-role key (for CLI admin scripts)
   - Apple Developer Portal credentials
   - App Store Connect credentials
   - RevenueCat dashboard credentials
   - Cloudflare account credentials
   - Resend API key
   - Domain registrar credentials
   - Any contractor / DPO credentials when they exist
   Backup: hardware security key in a fireproof safe + recovery codes printed and stored in a secondary physical location. The 1Password vault itself is protected by a long randomly-generated master password + a hardware security key.

9. **Never run admin operations on shared/public networks.** Coffee shop wifi, conference wifi, hotel wifi: don't admin from these. Use cellular hotspot or a known-trusted home network. If admin work is genuinely required while traveling, use an outbound VPN to a known-trusted exit point (e.g., a personal Tailscale node at home). Document the session in the admin audit log with `source: "travel_vpn"`.

---

## CROSS-CUTTING ENGINEERING RULES

These apply to all backend work going forward, not just the five sections above.

1. **Threat-model every new endpoint before implementing.** For each new API surface, write a 3-bullet threat note in the PR description:
   - Who can call it (anon / authenticated / premium / admin)
   - What data does it expose / accept
   - What's the worst case if abused (data leak / data destruction / impersonation / billing fraud)
   PRs without a threat note for new endpoints don't merge. Re-using an existing endpoint pattern can reference the prior threat note ("same as `/pets` GET").

2. **Default to most-restrictive permissions, expand only when needed.** When in doubt: deny. Loosening RLS later is a small change; tightening RLS after data has leaked is impossible.

3. **Every new table:** RLS on, scoped policy, CI test verifying RLS, manual penetration test (the 2-user test from Section 1) before any data goes in.

4. **Every new feature with Premium gating:** server-side entitlement check is mandatory (Section 4 rule 2). Client-side UI gating is a hint to the user, not a security boundary.

5. **Every new admin operation:** requires audit log entry + sudo-mode re-auth (Section 5 rule 5 + 7).

6. **No security-relevant changes ship without an entry in `OVERNIGHT_NOTES.md`** (or wherever the change log lives) documenting: what changed, what threat it addresses, how it was tested. This is not optional. Security changes are the highest-stakes commits in the repo and the most important to leave a paper trail for.

7. **PII / sensitive-data minimization.** Don't store data we don't need. Specifically:
   - Don't store free-text notes server-side unless there's a specific feature requirement (the local-only Tummy Tracker note field stays local-only).
   - Don't store precise GPS coordinates server-side — round to county-level FIPS for tick-aggregation, ZIP-level for region-aware features.
   - Don't store photo EXIF metadata; strip on upload.
   - Don't log request bodies in server logs for endpoints handling sensitive data; log only request metadata (path, status, user_id, ts).

8. **Incident response runbook.** When (not if) a security incident happens:
   - **First hour:** revoke all credentials, rotate keys, isolate affected systems. Don't tweet about it. Don't email users yet.
   - **First day:** determine scope of access — what data was potentially exposed, how many users affected, what was confirmed read/exfiltrated vs. theoretical access.
   - **Within 72 hours:** if any user data was accessed without authorization, notify affected users (GDPR/CCPA requirement). Use Resend transactional template `incident-notification`. Founder personally signs.
   - **Within 7 days:** post-mortem documented in `incident-reports/` (a directory in this repo, but with reports stored in 1Password if they contain sensitive specifics). Public-facing summary on a status page if the incident is user-relevant.
   - Save `incident-reports/` as a future-you-promise: write the incident-response runbook NOW so future-you under stress just follows it. Cold-state writing beats panicked decision-making.

---

## Versioning + change history

This document is the source of truth. Changes to the rules require:
1. A PR that updates this file
2. Founder review (cannot self-approve security changes)
3. An entry in this section noting what changed and why

| Date | Change | Author |
|---|---|---|
| 2026-05-08 | Initial document. Five sections + cross-cutting rules + change-history table. | Max + Claude (initial drafting) |

---

## How to use this file

- **Before any backend planning session:** read this file in full.
- **Before any backend implementation PR:** verify the PR doesn't violate any rule. Reference the rule numbers in the PR description.
- **When in doubt:** ask. Security questions don't have stupid answers.
- **When this file is wrong / outdated:** update it. Stale rules are worse than no rules because they create a false sense of safety.

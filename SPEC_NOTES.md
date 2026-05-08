# Feature Spec Batch 1 — Notes

**Date:** 2026-05-08
**Branch:** `feature-specs-batch-1` (off `main`, NOT off `v1.2-work`)
**Mode:** Auto / autonomous overnight.
**Scope:** 8 detailed feature specs at `docs/features/[feature-name].md`.

## Specs written

All 8 specs from the manifest are written and committed:

1. ✅ `docs/features/pawgress-indicator.md` (v1.3) — gamified daily care tracking, 5-segment paw, free-tier today / Premium history & multi-pet rings & share cards.
2. ✅ `docs/features/tummy-tracker.md` (v1.4) — Bristol-style stool log + diet log + FDA recall match. Recall match + vet suggestion are NEVER paywalled.
3. ✅ `docs/features/tick-map-and-disease-awareness.md` (v1.3-v1.4 + v2.0+) — 5-layer system: location risk → walk planner → tick log with day-14/day-30 follow-ups → treatment context → aggregate community heat map.
4. ✅ `docs/features/weather-aware-notifications.md` (v1.3) — WeatherKit-driven local notifications for good walk windows, storm prep, breed-specific heat/cold thresholds, AQI alerts.
5. ✅ `docs/features/seizure-awareness.md` (v1.4 L1, v2.0 L2+L3) — 3 layers: dual-perspective educational content (incl. verbatim isoxazoline framing) → tracker with live timer + video → cross-reference pattern detection.
6. ✅ `docs/features/checklist-weekly-refresh-paywall.md` (v1.3) — first recurring-Premium touchpoint with a generous free fallback (v1.0 baseline checklist) and a grandfather rule for v1.0/v1.1/v1.2 free users.
7. ✅ `docs/features/new-home-relocation-support.md` (v1.4 / v2.0) — 30-day transition plan + behavior tracker + "is this normal?" knowledge base.
8. ✅ `docs/features/emergency-procedures-library.md` (v2.0 conservative path) — vet-reviewed library; CPR + intervention content explicitly gated to v3+ behind DVM + insurance + attorney sign-off.

Each spec is 800-1500 words, follows the specified structure (Goal / Founder Anchor / User Flow / Data Model / UI / Gating / Sources / Guardrails / Edge Cases / Analytics / Apple Review / Estimate / Open Questions / Out of Scope), cites real authoritative sources (CDC, FDA, AVMA, AKC, Cornell, Merck, Tufts, IVETF, AVECCT, ASPCA, AAHA, etc.), and matches the existing project voice.

## Cross-cutting open questions surfaced during writing

These came up across multiple specs and need product-level answers, not per-spec answers:

1. **DVM advisor partnership.** Five of the eight specs (Tummy, Tick, Seizure, Relocation, Emergency Procedures) flag a need for a licensed DVM content reviewer signed onto FloofLife. This is the single biggest external gate for v1.4-v2.0 content. Recommend a retainer relationship covering all five features rather than one-off per-feature engagements. Same person who signs off on CPR (v3+) ideally handles content review through v2.0 too.

2. **Professional liability insurance.** The Emergency Procedures spec is the most explicit, but Tummy + Tick + Seizure all touch medical-flavored content. Recommend engaging a broker to scope a tech/healthtech-friendly E&O policy that covers FloofLife as a category, not per-feature. Floor: $1M/$3M E&O. Pre-v2.0 work.

3. **Attorney review for medical-flavored content.** The Seizure isoxazoline framing and the Emergency Procedures negative-instruction sections ("what NOT to do") are the most legally exposed copy in the app. Recommend one comprehensive attorney review pass covering all medical-flavored content (Tummy, Tick disease, Seizure, Emergency, Weather heat/cold) in v1.4-v2.0 cycle. Estimated $10-25K total legal spend across the cycle.

4. **State-by-state veterinary practice scope.** Some states define "practice of veterinary medicine" broadly enough to scope user-facing pet medical apps. The Emergency Procedures spec calls out a 50-state scan ($3-8K). Recommend doing this scan once and informing v1.4+ content decisions globally rather than per-feature.

5. **Premium gating consistency.** Across all 8 specs, the rule emerged: **safety content is never paywalled, depth/convenience is.** Recall-match (Tummy), vet-suggestion banners (Tummy), tick log + follow-ups (Tick), heat/cold/storm/AQI alerts (Weather), Layer 1 seizure content (Seizure), full free fallback (Checklist), full 30-day plan (Relocation), all emergency procedures (Emergency) — all free. Premium adds: history depth, share cards, pattern correlation, multi-pet convenience, video sync, extended plans. This consistency is worth preserving in product decisions.

6. **Local-only-first vs. backend-first.** All 8 specs are designed to work fully offline at parity with the online experience for safety-critical features. Backend (Supabase + R2 + APNS + Resend) adds sync, sharing, and Premium-tier value. This local-first stance should be communicated to anyone joining the team — it's a real architectural commitment, not a placeholder.

## Architectural concerns that need Max's input before implementation

1. **Pet schema evolution.** Multiple specs add per-pet data structures (Pawgress, stool entries, diet entries, tick entries, seizure entries, relocation plan). The existing `pawrent_pets_v2` schema doesn't accommodate these — they live in adjacent AsyncStorage keys keyed by `petId`. Backend-side, that means each feature gets its own table FK'd to `pets`. Decision needed: is `pets` table the source of truth for "this pet exists" and other tables FK to it, or is each feature self-contained with its own pet-id reference and the `pets` table is more of a roster? Recommend the FK model — cleaner for cascade deletes when a pet is removed.

2. **Photo + video storage cost.** Tummy stool photos, Seizure videos, Tick photos all suggest R2 storage. Premium-only sync controls cost, but at scale (1000+ Premium users × 5 photos/day) we're at non-trivial volumes. Decision: photos retained indefinitely (Premium) vs. capped at N days (which is the existing free-tier approach). Recommend capping at 2 years even on Premium, with clear disclosure. Saves cost and reduces stale-data risk.

3. **WeatherKit native module gap.** No Expo wrapper exists for WeatherKit. Options: (a) write a custom Expo native module, (b) use a third-party API wrapper, (c) use NOAA NWS or OpenWeather. Recommend (a) — it's a 4-6 hour subtask but gives us reliable Apple-licensed data. Flag for v1.3 implementation start.

4. **Background task quota.** Tick log day-14/day-30 follow-ups + Weather heat-of-day notifications + Pawgress evening nudges all want background task time. iOS strictly rate-limits BGTaskScheduler. Recommend consolidating background work into a single `floofDailyBackground` task that handles all features rather than registering one per feature. Otherwise we'll hit quotas.

5. **Notification strategy.** Local notifications (free-tier safe, no APNS server) handle most of v1.3. v1.4+ will likely need APNS (server-triggered for FDA recalls, pattern-detection alerts). Recommend backend buildout planning for APNS from day 1 even if we don't ship server-triggered until v1.4.

6. **Anonymous vs. authenticated user identity.** Free tier currently has no account requirement. Several specs (Tummy, Tick aggregate, Seizure pattern detection, Pawgress history) work better with persistent identity. Decision: do we introduce an Apple Sign In requirement at some tier (Premium? all v1.4+ users?), or do we keep an anonymous-by-default model and use device IDs (UUID + iCloud sync) for persistence? Recommend Apple Sign In as Premium-only for v1.3, v1.4 expanded as needed. Anonymous fallback always.

7. **Grandfather rules across features.** The Checklist Paywall spec has explicit grandfather logic. Other Premium gates (Pawgress history, Tummy patterns) don't currently have grandfather rules. Recommend a centralized `isGrandfatheredFreeUser()` helper that returns true if `installedBefore < v1.3RELEASE_DATE` and gates apply respectfully. Otherwise we'll fragment rules across features.

8. **DVM advisor's content veto power.** Multiple specs require DVM review. What happens if the DVM advisor disagrees with a framing we've drafted? Recommend a clear contract clause that DVM has veto on medical-flavored framing, but FloofLife retains editorial control over tone, voice, branding. Avoid a situation where a single DVM holds up shipping.

## Backend-design implications worth flagging early

The upcoming Supabase + Resend + APNS + R2 buildout has direct implications surfaced across these specs. Highlights for the backend planning:

### Tables (full set across the 8 specs)
- `pets` — already exists in app schema; backend mirror needed.
- `pawgress_days` — Pawgress per-pet per-day completion record. Indexed by (user_id, pet_id, day desc).
- `stool_entries` — Tummy stool logs. Indexed by (user_id, pet_id, ts desc). Consider partitioning by month for high-volume Premium users.
- `diet_entries` — Tummy diet logs. Same indexing.
- `tick_entries` + `tick_followups` — Tick log thread tables.
- `tick_county_aggregates` — materialized view for v2.0+ aggregate heat map. Refreshed nightly.
- `seizure_entries` — seizure tracker.
- `relocation_plans` — 30-day plan state.
- `paywall_events` + `emergency_procedure_views` — analytics tables.
- `notification_prefs` — per-user notification preferences.

### RLS pattern (consistent across all tables)
```sql
alter table <table> enable row level security;
create policy "users own <table>" on <table>
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

For aggregate views (Tick map), RLS is `for select using (true)` since data is already privacy-aggregated.

### R2 buckets
- `floof-pet-photos` — pet profile photos (existing/v1.0+).
- `floof-stool-photos` — Tummy stool photos. Private, signed URLs only.
- `floof-tick-photos` — Tick photos. Private, signed URLs.
- `floof-seizure-videos` — Seizure videos. Private, signed URLs. **Premium-only opt-in upload** with explicit consent UX.

### APNS notification types (v1.4+)
- FDA recall match (Tummy → recall)
- Pattern detected (Tummy / Seizure / Tick)
- Day-14 / day-30 tick follow-up (currently local; consider APNS for cross-device reliability)
- Subscription state changes (trial ending, renewal failed)

Most of v1.3's notifications are local (no APNS needed). v1.4+ needs APNS plumbing.

### Resend (transactional email)
- Account verification (if Apple Sign In is partially supplemented by email).
- Subscription receipts (RevenueCat covers most; Resend for edge cases).
- Vet-share log emails (user shares Tummy / Tick / Seizure log with their vet via email — needs Resend send-on-behalf-of-user).

### Cron / scheduled jobs (Supabase Edge Functions)
- `fda-recall-ingest` (daily) — pulls FDA Pet Food Recall RSS, upserts into `recalls` table.
- `tick-aggregate-refresh` (nightly) — refreshes `tick_county_aggregates` materialized view.
- `capc-data-refresh` (weekly) — pulls CAPC tick prevalence data into a `tick_risk_county` table.
- `weather-attribution-check` (per-app-launch) — verifies WeatherKit attribution is rendered (compliance).

### Background sync (client-side)
Each feature's local-only entries sync via upsert when the user is signed in and online. Conflict resolution: most-recent `updated_at` wins per-entry (not per-table). Photos / videos sync separately, opt-in for Premium.

## Notes on the workflow itself

- 8 specs × ~1000-1500 words = ~10,000 words of spec content. All cite real sources with URLs. All match the existing project voice (direct, useful, no marketing fluff).
- Each commit is its own well-described commit. Branch is clean off main, isolated from v1.2-work.
- Push pending — will push the full branch as the last step before this notes file commit.
- Time spent: ~3-4 hours focused autonomous-Claude-Code work.
- Files created: `docs/features/*.md` (8) + `SPEC_NOTES.md` (this file) = 9 new files. No production code touched. No `eas build` triggered.

## Recommended next steps (for Max, when reviewing)

1. **Scan each spec's Open Questions section first** — those are the things the spec couldn't decide autonomously and need product judgment.
2. **Review the cross-cutting concerns above** — they're not in any one spec but cut across the v1.3-v2.0 roadmap.
3. **DVM advisor selection is the highest-leverage external action.** Engaging one named DVM with a retainer to review v1.4-v2.0 content (Tummy heuristics, Tick disease, Seizure framing, Relocation behavior, Emergency Procedures) unlocks 5 of 8 features and is the critical path on the v2.0 timeline.
4. **Insurance + attorney engagement** — start the broker conversation in parallel with DVM. Both are 4-12 week timelines.
5. **Backend planning** — these specs give the upcoming Supabase + R2 + APNS + Resend buildout concrete schemas to build against. The cross-feature consistency (RLS pattern, photo/video bucket structure, APNS notification types) is worth codifying early so each feature isn't reinventing.

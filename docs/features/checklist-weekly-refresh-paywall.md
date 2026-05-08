# Checklist Weekly Refresh Paywall (v1.3)

## Goal

The checklist already exists and is the daily-engagement workhorse of FloofLife. v1.3 introduces FloofLife's first recurring-Premium touchpoint: free users see week 1's checklist freely, week 2+ surfaces a Premium upgrade gate. The economic logic: a one-time paywall on Premium features (Pawgress history, Tummy patterns) converts users at moments of value-realization, but it doesn't create the recurring "I should subscribe" pressure that drives sustainable subscription revenue. A weekly refresh paywall does — every Sunday night the user sees "next week's checklist is Premium" and either pays or accepts the free fallback. This is the single highest-leverage monetization decision of the v1.3 cycle.

## Founder Anchor

Max wants Premium to feel like a real product upgrade, not a "donate to the app" upsell. A week-1-free, week-2+-Premium gate makes the free tier genuinely useful (a new user sees the full first-week experience and can judge the product on its merits) while making Premium genuinely necessary for ongoing personalized value. Pet care is recurring; the monetization should mirror that. **Existing v1.0 / v1.1 free users must NOT be punished retroactively** — they came in under a different deal and grandfather rules apply.

## User Flow

### New user (post v1.3 install)
1. Onboarding completes → user lands on Home tab.
2. Week 1: full checklist available, breed-personalized, all features active. Includes the existing "Tip of the day" + reminders + checklist progression.
3. Sunday evening of week 1 (e.g., Sunday at 6 PM local time): in-app banner appears at top of Checklist tab — "Next week's checklist refreshes Sunday at midnight. Premium unlocks every week's checklist for [pet name]."
4. Sunday at midnight: checklist transitions. Free user sees a generic "free fallback" checklist (the same hardcoded baseline checklist v1.0 shipped with), with the personalized Premium checklist behind an upgrade gate.
5. The free fallback is NOT empty — it's the existing v1.0 generic-weekly-checklist content. Functional. Just not breed-personalized, not seasonal, not aged.
6. Tapping the upgrade gate → soft Premium screen with the standard pricing + "7-day free trial" CTA.

### Existing v1.0 / v1.1 / v1.2 free user (grandfather)
1. On v1.3 update install, the app checks an `installedBefore` field stored at install time (or first-launch time stored in AsyncStorage from any version). If the user installed before the v1.3 paywall date (e.g., 2026-06-01), they get the **legacy free tier** flag set — full breed-personalized checklist, no weekly gate.
2. Legacy free tier persists indefinitely. Even if the user uninstalls and reinstalls, the original Apple ID receipt should preserve the flag if we use a signed-in identity. For local-only legacy users without an account, the flag rides on AsyncStorage; reinstall = lose grandfather (acceptable trade-off).
3. Legacy free users still see Premium upsells for OTHER features (Pawgress history, Tummy patterns, etc.) — only the weekly checklist refresh is grandfathered.

### New user paying for Premium
1. Tap upgrade gate → Premium screen → start trial.
2. RevenueCat returns subscription active → entitlement flag set → checklist unlocks, all weeks visible.
3. Future weeks refresh automatically Sunday midnight.

### New user not paying
1. Free user sees the v1.0 baseline weekly checklist. They can use the app indefinitely on this fallback.
2. Each week the upgrade banner subtly nudges: "[Pet name]'s personalized week is ready in Premium."
3. After 4 weeks of dismissals, banner cooldown extends (we don't nag).

## Data Model

### AsyncStorage (local-only)
```
pawrent_checklist_paywall_v1: {
  installedBefore: timestamp,           // first-launch time across all versions
  legacyGrandfather: bool,              // computed: installedBefore < 2026-06-01
  weekOfYearShown: int,                 // last week the user saw the personalized vs fallback choice
  upgradeBannerDismissCount: int,
  upgradeBannerLastDismissAt: timestamp
}
```

### Backend (Supabase)
Subscription state lives in RevenueCat (already wired). We don't duplicate. Backend just records the upgrade-banner-dismissal analytics for funnel analysis:
```sql
create table paywall_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  event_type text check (event_type in ('banner_shown','banner_dismissed','upgrade_started','upgrade_completed','grandfather_recognized')),
  ts timestamptz default now(),
  context jsonb
);
create index paywall_events_user_ts_idx on paywall_events (user_id, ts desc);

alter table paywall_events enable row level security;
create policy "users own paywall events" on paywall_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Migration
On v1.3 first launch:
1. Read existing AsyncStorage for any v1.0+ key (e.g., `pawrent_pets_v2`) — if present, the user is pre-existing.
2. If `installedBefore` not set, infer it from the oldest pet's `createdAt`. Set `legacyGrandfather = true` if before the cut-off date.
3. If no pets exist (truly new install), set `installedBefore = Date.now()` and `legacyGrandfather = false`.

The cut-off date is set at v1.3 release time and committed to a constant in `src/lib/checklistPaywall.js` so future Claude Code sessions don't re-derive it.

### Schema versioning
`v1` suffix. Future changes (e.g., adding bi-weekly cycles, special-event refreshes) bump to `v2`.

### Local-only fallback
Full feature works offline. RevenueCat caches entitlement state on-device for 24-48 hours; if the user is offline and RevenueCat hasn't refreshed in days, we treat their last-known state as authoritative.

## UI Components

### New screens
None — feature lives inside the existing `ChecklistScreen.js`.

### Modified screens
- `ChecklistScreen.js` — adds the gating logic, the Sunday-evening banner, the Sunday-midnight transition, and the fallback-vs-personalized renderer.
- `App.js` — no changes (PremiumScreen already exists by v1.3).
- `OnboardingScreen.js` — sets `installedBefore` on first complete.

### New reusable components
- `<ChecklistUpgradeBanner pet onUpgrade onDismiss />` — Sunday-evening warning banner.
- `<ChecklistFallbackHeader pet onUpgrade />` — shown above the free-fallback checklist explaining why it's not personalized.
- `<ChecklistGrandfatherBadge />` — small badge for legacy free users acknowledging the grandfather (a nice touch — "thanks for being an early supporter").

## Free vs Premium Gating

### Free (post v1.3 install)
- Week 1 (first 7 days after install): full breed-personalized checklist.
- Week 2+: generic v1.0-style weekly checklist (the same content v1.0 shipped with, hardcoded).
- All other features: Pawgress (today only), Tummy logging, Tick logging, etc.

### Free (legacy grandfather)
- All weeks: full breed-personalized checklist.
- All other features: same free tier as new free users.

### Premium
- Full breed-personalized + age + season checklist, every week, indefinitely.
- All other Premium features (Pawgress history, Tummy patterns, etc.).

### Upgrade prompt placement
- Sunday evening banner (warning of upcoming refresh).
- Sunday midnight transition card (one-time per refresh).
- Persistent soft banner above the fallback checklist explaining what the user is missing.

### Grandfather rules (CRITICAL)
- Inferred from `installedBefore < 2026-06-01` (or whatever the v1.3 release date is).
- Persists in AsyncStorage indefinitely.
- Lost on full uninstall + reinstall (acceptable; we don't have account-level identity for free users yet).
- v1.4+ post-account-system: grandfather rides the user_id, not the install.

## Sources & Citations

Not a content-heavy feature. The fallback checklist content is the existing v1.0 generic checklist. The personalized checklist content already exists in `src/data/checklist.js`. No new external sources needed.

## Language Guardrails

**Good**:
- "Next week's checklist refreshes Sunday at midnight."
- "Premium unlocks every week's checklist for [pet name]."
- "[Pet name]'s personalized week is ready in Premium."
- For grandfather: "You're an early FloofLife user — your personalized checklist stays free as a thank-you."

**Bad**:
- "Subscribe now or lose access!" (urgency / scarcity tactics)
- "Free trial expires soon!" (when there's no actual expiration)
- "Your pet needs Premium." (manipulative)
- Hiding the free fallback exists. The user should clearly see what they get for free vs. what Premium adds.

## Edge Cases & Error States

- **Empty state**: N/A — checklist always renders something (free fallback or Premium personalized).
- **Offline**: full functionality. RevenueCat entitlement cached.
- **Permission denied**: N/A.
- **Multi-pet (Premium)**: each pet gets its personalized checklist. No additional gating per pet.
- **Multi-pet (Free)**: free fallback is generic and the same per pet. The personalized checklist gate applies per-pet.
- **iCloud transfer**: AsyncStorage data restores. `installedBefore` rides with the AsyncStorage backup. Grandfather flag preserved.
- **Auth state**: free / Premium gating uses RevenueCat user-or-anonymous-ID. Anonymous users can still subscribe and have entitlement preserved on the device. Sign-in transfers entitlement to the account.
- **RevenueCat down**: entitlement falls back to last cached state. If we can't verify in 7+ days, assume free tier (don't grant Premium on indeterminate state).
- **Grandfather false positive (user wipes device, reinstalls)**: they lose grandfather. Acceptable — there's no signed-in receipt to honor. Could add a manual "I was a v1.0 user" recovery flow as a v1.4 polish.
- **Time zone changes**: Sunday rollover uses local device time. If the user travels across time zones, the rollover may shift by a day. Acceptable.
- **DST transitions**: handled by the device's calendar logic; no special handling needed.

## Analytics Events to Fire

- `checklist_paywall_banner_shown` — `{ tier: 'free_new'|'free_grandfather'|'premium', week_index: int }`. Free-grandfather banner does NOT show; this is for funnel analysis when it would.
- `checklist_paywall_banner_dismissed` — `{ dismiss_count: int }`.
- `checklist_paywall_upgrade_tapped` — `{ surface: 'sunday_eve_banner'|'midnight_transition'|'persistent_banner' }`.
- `checklist_paywall_upgrade_completed` — `{ plan: 'monthly'|'annual', trial_used: bool }`. From RevenueCat callback.
- `checklist_grandfather_recognized` — `{ inferred_install_ts: ts, weeks_since_install: int }`. Fires once per user.
- `checklist_fallback_shown` — `{ tier: 'free_new'|'free_grandfather', week_index: int }`. Fires when a free user sees the fallback (or the personalized for grandfather).
- Privacy: NEVER track pet name or any pet-specific data in paywall events. The events are about user/subscription state, not pet state.

## Apple Review Risk Assessment

- **Guideline 3.1.1 (In-app Purchase)**: standard subscription gating. Already covered by RevenueCat infrastructure.
- **Guideline 3.1.2 (Subscriptions)**: subscription terms must be visible BEFORE charging. The Premium screen shows "$X/yr or $Y/mo" upfront with renewal language. Already in place.
- **Guideline 3.1.3 (Other Purchase Methods)**: Premium must be unlockable via in-app purchase. No external billing.
- **Guideline 4.0 (Design)**: paywall UX must be clear, not a "dark pattern." The free fallback exists and is functional — this is the safety valve. No "lock everything" approach.
- **Guideline 5.1 (Privacy)**: no new permissions or privacy disclosures needed.
- **Guideline 4.5.4 (Push notifications)**: Sunday-evening banner is in-app, not push. Cleaner from a review perspective.
- **Anti-dark-pattern note**: this design is intentionally NOT a dark pattern. Free fallback is genuinely useful (the v1.0 checklist), grandfather rules respect existing users, banner doesn't hide the free option.

## Implementation Estimate

- New files: 1-2 (`checklistPaywall.js` helper, possibly a `<ChecklistUpgradeBanner />` component).
- Modified files: 2-3 (`ChecklistScreen.js`, `OnboardingScreen.js`, `analytics.js`).
- Build budget: fits in v1.3 alongside Pawgress + Weather + Tick L1-3. 1 build for v1.3.
- Time estimate: 4-6 hours including grandfather logic, UX polish, RevenueCat hookup verification.
- Backend work: 1 events table for funnel analytics. RevenueCat already wired.

## Open Questions / Decisions Needed

1. **Cut-off date for grandfather** — recommend the v1.3 release date itself (e.g., 2026-06-15). Confirm.
2. **Free fallback content** — confirm using the v1.0 generic weekly checklist verbatim, or a slightly enhanced version. Recommend verbatim — gives the user a meaningful "this used to be the whole product" reference.
3. **Banner cadence** — Sunday 6 PM local + Sunday midnight transition + persistent soft banner. Confirm cadence isn't nagging.
4. **Grandfather acknowledgment** — show a small "early FloofLife user" badge or skip it? Recommend showing it once on first v1.3 launch with a thank-you, then removing.
5. **Multi-pet pricing** — the existing $39/yr Premium covers multi-pet. Confirm we don't add per-pet pricing.
6. **Trial length** — currently 7 days. Confirm with conversion data when available.
7. **Apple Family Sharing** — Premium subscriptions ship with Family Sharing for free with the right App Store Connect setting. Do we want it? Recommend yes — feels generous and matches the "household" pet-care use case.
8. **Re-subscription after lapse** — if a user cancels, their entitlement reverts to free. Re-subscribers should keep their pre-lapse personalized history (Pawgress, Tummy etc.). Verify this is preserved across subscription state changes.

## Out of Scope (for v1.3)

- A/B testing different paywall copy / banner cadence (v1.4+ when we have analytics depth).
- Promo codes / referral system — separate growth feature, v1.5+.
- Cohort-based pricing (e.g., "first 1000 users get $19/yr") — explicit non-goal for App Store policy reasons.
- Multi-tier subscriptions (Basic / Pro) — single-tier for v1.3; revisit at v2.0.
- Lifetime purchase option — explicit non-goal; recurring subscription is the model.
- Cross-platform Premium (Android, web) — Android isn't shipped yet.
- Server-side subscription validation — RevenueCat handles this; revisit if we ever need server-rendered Premium content.

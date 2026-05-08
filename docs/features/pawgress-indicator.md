# Pawgress Indicator (v1.3)

## Goal

A visual daily care tracker shaped like a paw print: five fillable segments (four toe pads + one main pad) that fill as the user completes the day's care tasks for a given pet. The paw is the at-a-glance signal a user sees on the Home screen telling them whether today is "done" or has gaps. Free tier sees a single-pet daily ring. Premium unlocks weekly / monthly / yearly history views, share-card export, and a multi-pet ring layout. The Pawgress is the gamified hook that pulls users back to the app daily — it's FloofLife's equivalent of the Apple Activity ring, but pet-shaped and care-task-driven, not exercise-driven.

## Founder Anchor

Max wanted a single visual that answered the question *"Is my dog OK today?"* without making the user read a checklist. The paw shape is the brand mark; turning it into a status indicator that fills up over the day collapses "did I walk her, feed her, check her ears, give her flea preventative, refresh water" into one glanceable signal. The five-segment design comes from the natural visual of a paw print and from a deliberate choice not to overwhelm: if one of the pads is empty at 9 PM, that's the prompt to fix something before bed.

## User Flow

1. User opens the app → Home tab. Pawgress sits at the top of the Home screen, above the existing Pet Photo / Insider Tips card.
2. Empty Pawgress at start of day = outline only. Each segment fills as the user marks a checklist item complete (the daily checklist already exists; this just visualizes it).
3. Tap the Pawgress → expand to full-screen Pawgress detail view showing the five segments with task labels:
   - Pad 1: Food & Water
   - Pad 2: Movement (walk / play)
   - Pad 3: Body Check (ears / eyes / coat / paws)
   - Pad 4: Mind / Bond (training / cuddle / enrichment)
   - Pad 5 (main): Daily Special — rotates by day (e.g., dental Mondays, brush Wednesdays, weigh Sundays)
4. Inside the detail view, each pad is a tap-to-toggle row. Tapping completes the segment and fills the pad with a haptic + paw-fill animation.
5. End of day rollover (00:00 local time): segments reset. Yesterday's completion is archived to history.
6. Premium teaser: tap the History affordance below the Pawgress → modal with "Premium · See Pawgress history" upgrade CTA. Free users can see today only.

Copy snippets:
- Empty state: "Tap a paw pad as you go through the day."
- All-five-filled: "Today is full. Sweet dreams, [pet name]."
- One missing at 8 PM: "One pad to go."

## Data Model

### Storage (AsyncStorage, local-only mode)
- Key: `pawrent_pawgress_v1`
- Shape: `{ [petId]: { [yyyy-mm-dd]: { food: bool, movement: bool, body: bool, mind: bool, special: { kind: string, done: bool } } } }`
- Sample:
```json
{
  "p_abc123": {
    "2026-05-08": { "food": true, "movement": true, "body": false, "mind": false, "special": { "kind": "dental", "done": false } }
  }
}
```
- Rollover: history retained for 7 days locally (free tier). Older days are pruned on read. Premium users keep unlimited history (still local — backend sync is the eventual upgrade path).

### Backend schema (Supabase, post-v1.2 backend buildout)
```sql
create table pawgress_days (
  user_id uuid references auth.users not null,
  pet_id uuid references pets not null,
  day date not null,
  food boolean default false,
  movement boolean default false,
  body boolean default false,
  mind boolean default false,
  special_kind text,
  special_done boolean default false,
  updated_at timestamptz default now(),
  primary key (user_id, pet_id, day)
);
create index pawgress_days_user_pet_idx on pawgress_days (user_id, pet_id, day desc);

alter table pawgress_days enable row level security;
create policy "users read own pawgress" on pawgress_days
  for select using (auth.uid() = user_id);
create policy "users write own pawgress" on pawgress_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Migration
Existing v1.0/v1.1/v1.2 users have no `pawgress` data. On first launch of v1.3, initialize an empty object and start from today. Yesterday's completed checklist items do not retroactively fill pads — clean slate.

### Schema versioning
Top-level key includes `_v1` suffix. Future schema bumps (e.g., adding new pad types) write to `pawrent_pawgress_v2` and migrate on read by passing v1 data through a transformer.

### Local-only fallback
Pawgress works fully offline. Backend sync is opportunistic: when the user is signed in and online, the day's record is pushed via upsert; if offline, the local store is the source of truth. Conflict resolution: most-recent `updated_at` wins (per-pad, not per-day — a mobile-first pet-care app shouldn't lose a checked-off pad just because another device synced first).

## UI Components

### New screens
- `PawgressDetailScreen` — full-screen detail view with the five tappable pads, day label, and "See history" CTA. Modal presentation from Home.
- `PawgressHistoryScreen` (Premium-gated) — week / month / year toggles. Renders a grid of past Pawgress paws with completion shading.

### Modified screens
- `HomeScreen.js` — adds the Pawgress card at top of the cards list (above Pet Photo). Existing card order shifts down.
- `App.js` — register two new routes: `Pawgress` and `PawgressHistory`.

### New reusable components
- `<PawgressPaw size pet completion onTap />` — pure-SVG paw with five segments. `completion` is a `{food, movement, body, mind, special}` boolean record; pads animate fill on prop change.
- `<PawgressPad kind done onPress />` — single-pad row inside the detail view.
- `<PawgressShareCard pet day />` — composable share view (Premium) used by the share-sheet export.

## Free vs Premium Gating

- **Free**: today's Pawgress on Home, today's detail view, animations, single-pet only.
- **Premium**: weekly / monthly / yearly history views, share-card export (Instagram-Story-shaped image with the day's paw + pet name + date watermark), multi-pet ring layout (multiple paws in a row on Home), per-pad streak counters.
- **Upgrade prompt**: appears as the "See history" CTA under the Pawgress paw on the detail view. One soft prompt, not a popover wall.
- **Grandfather**: existing v1.0/v1.1 free users don't get retroactive Premium. They get the new free Pawgress UX and the same upgrade prompt as new users.

## Sources & Citations

Not a content-heavy feature. The "rotating Daily Special" task list (dental Mondays, brush Wednesdays, weigh Sundays) draws from existing rulesOfThumb cadence guidance — no new external sources needed for v1.3. If we add a "discuss with vet" tooltip on a pad, cite [AVMA preventive care basics](https://www.avma.org/resources/pet-owners) and existing breed-specific checklist entries.

## Language Guardrails

- **Good**: "Today is full." "One pad to go." "Tap a paw pad as you go through the day."
- **Bad**: "You're a great pet parent!" (false praise / saccharine), "Your pet is healthier today" (causal claim we can't make), "Don't forget!" (nagging tone).
- The Pawgress is encouragement, not judgement. Empty pads at end of day shouldn't shame the user — the app shows the paw without comment after 8 PM.

## Edge Cases & Error States

- **Empty state (first time)**: outline-only paw with the "Tap a paw pad as you go through the day" hint.
- **Offline / no network**: full functionality. Backend sync queues for next online window.
- **Permission denied**: N/A (no permissions required).
- **Multi-pet (Premium)**: render up to 3 paws inline on Home; tap each to drill into that pet's detail view. 4+ pets get a horizontal scroll.
- **iCloud / device transfer**: Pawgress data is in AsyncStorage, which iCloud restores. Backend sync (when added) means the data follows the account.
- **Auth state transitions**: anonymous users have full local Pawgress. On sign-in, the local store uploads via upsert. On sign-out, local store remains; backend writes pause.
- **Day boundary (DST, time zone change)**: rollover uses `Date.now()` floored to local midnight. A traveler crossing time zones may see the Pawgress reset early or late by a day; acceptable.
- **Clock manipulation**: don't worry about it — this isn't a streak game with prizes. If the user time-travels they only fool themselves.

## Analytics Events to Fire

- `pawgress_pad_tapped` — `{ pad: 'food'|'movement'|'body'|'mind'|'special', completed: bool, day_count_filled: 1-5, pet_species: 'dog'|'cat' }`. Never include pet name or photo.
- `pawgress_day_completed` — `{ all_five: bool, pet_species: 'dog'|'cat', time_of_day: hour 0-23 }`. Fires when the fifth pad of the day is filled.
- `pawgress_history_viewed` — `{ tier: 'free'|'premium', view: 'week'|'month'|'year' }` (Premium-gated; only fires for Premium).
- `pawgress_share_card_exported` — `{ surface: 'instagram'|'imessage'|'other' }` (Premium).
- Privacy: NEVER track pet name, photo, breed-specific health entries, or which checklist items the user has on file.

## Apple Review Risk Assessment

Low risk. Pawgress is a UI shell over the existing daily checklist, which has already passed review. No new permissions, no medical claims, no health data — just visualization of "did the user do their checklist today."

- **Guideline 5.1.1 (Privacy)**: data stays local on free tier; backend sync only on signed-in opt-in. No new privacy-string changes needed.
- **Guideline 4.0 (Design)**: reuses existing patterns. The share-card feature uses the system share sheet, no custom social integration.
- **In-app purchase (3.1.1)**: Premium gating uses RevenueCat (already wired by v1.3 prerequisite). No external upgrade flows.

## Implementation Estimate

- New files: ~4-6 (`PawgressPaw.js`, `PawgressDetailScreen.js`, `PawgressHistoryScreen.js`, `PawgressShareCard.js`, `pawgress.js` storage helper, optionally a `pawgressDailySpecial.js` data file).
- Modified files: 3-4 (`HomeScreen.js`, `App.js`, `analytics.js`, possibly `ChecklistScreen.js` if we wire the existing checklist to auto-tick pads).
- Build budget: fits in the v1.3 build alongside Weather notifications + Tick map Layer 1. Estimated 1 build for the v1.3 release.
- Time estimate: 4-6 hours focused autonomous-Claude-Code work, including the SVG paw component and the share-card composer.
- Backend work: 1 table + 2 RLS policies + indexes (above). Sync logic in client is ~50 lines.

## Open Questions / Decisions Needed

1. **Should the Pawgress card on Home be the first card or below the pet photo?** Taste call. First card maximizes engagement; below pet photo keeps the photo as the warmest opening.
2. **Should completion of the existing daily checklist auto-fill pads?** Recommended yes — duplication of taps is friction. But this requires mapping checklist categories to pad kinds, which couples the two systems. Alternatively, Pawgress is purely manual.
3. **Daily Special rotation cadence** — fixed weekly schedule (dental Mondays etc.) vs. user-configurable? Fixed is simpler; configurable is right by year 1.
4. **Share-card design** — Instagram-Story-shaped with pet name + date watermark vs. just the paw. Marketing call.
5. **Streak counters in Premium** — how many consecutive days of "all five filled" before we show a flame icon? 3 is forgiving, 7 is meaningful.

## Out of Scope (for v1.3)

- Apple Watch complication (requires a separate Watch target — defer to v2.0).
- iOS Home Screen widget (also v2.0+).
- Push notifications nudging the user when one pad is empty after 6 PM (v1.4 weather-aware notifications spec covers nudge plumbing; defer Pawgress nudges to that).
- Social leaderboards / comparison with other users' Pawgress — explicit non-goal. We don't compete with other pet owners.
- Health data import (Apple Health step counts auto-filling the Movement pad) — v2.0+ HealthKit integration.
- Negative feedback for missed days. The Pawgress doesn't shame; it just shows.

# Tick Map + Tick Disease Awareness (v1.3 Layers 1-3 / v1.4 Layers 4-5)

## Goal

A five-layer tick safety system that helps owners (1) understand current tick risk in their location, (2) plan walks accordingly, (3) log a tick encounter and follow up at the medically meaningful day-14 and day-30 marks, (4) connect a tick log entry to relevant treatment context, and (5) eventually contribute to an aggregate community heat map (v2.0+). Tickborne disease in dogs (Lyme, anaplasmosis, ehrlichiosis, babesiosis, RMSF) is rising in incidence and geographic range; most owner-facing apps stop at "use a tick preventative." FloofLife's value-add is the encounter → follow-up loop, where most prevention apps drop the ball.

## Founder Anchor

Max's dog Falafel had a multi-month battle with anaplasmosis after a tick bite that Max didn't realize was clinically significant until weeks later. The follow-up at 14-30 days post-bite (when most tickborne disease symptoms first manifest) is the moment the app could have caught it earlier. The five-layer design is built around that gap.

## User Flow

### Layer 1 — Location risk (v1.3)
1. User grants location permission (already granted for the existing RiskScreen — no new prompt).
2. Risk tab shows a "Tick risk in your area" card with a 4-tier indicator: Low / Moderate / High / Very High.
3. Risk derived from CDC + USGS + CAPC public datasets cross-referenced against the user's lat/lng (county-level resolution).
4. Card expands → seasonal context, common species in the region (e.g., "Black-legged tick · peak Apr-Oct"), top 2-3 tickborne diseases reported in the county.

### Layer 2 — Walk planner (v1.3)
1. From Risk tab → "Plan a walk."
2. Map view (MapKit) with the user's location centered. Tap a destination pin or use current location.
3. App shades the route / area with a tick-risk overlay (high-grass / wooded zones flagged via OSM landuse tags + state park data).
4. Pre-walk checklist surfaces: "Apply preventative? Y/N · Bring tick remover · Plan a tick check after the walk."

### Layer 3 — Tick log (v1.3)
1. From any screen: "+" → "Log a tick."
2. Step 1: location of bite on pet (interactive paw + body diagram, tap to mark).
3. Step 2: tick photo (optional but encouraged — helps your vet identify species).
4. Step 3: tick details (size estimate: poppy-seed / sesame-seed / pea-sized; engorged Y/N; embedded duration if known).
5. Step 4: removal (was it removed cleanly? mouthparts left? saved for testing?).
6. Save → entry on the pet's tick history.
7. **Auto-schedule follow-ups**: the app schedules two local notifications:
   - **Day 14**: "Has [pet name] shown any of these signs since the [date] tick bite?" → checklist of early Lyme/anaplasmosis/ehrlichiosis signs (lethargy, lameness, fever, joint pain, appetite change, lymph node swelling). Any "yes" → "Discuss this log with your vet" CTA.
   - **Day 30**: same, expanded to late-onset signs (PU/PD, weight loss, neurological changes).
8. Follow-up entries are appended to the same tick log thread. The thread becomes a vet-friendly export when the user shares it.

### Layer 4 — Treatment context (v1.4)
1. When a tick log thread shows "yes" to any follow-up sign → "Discuss with vet" CTA expands.
2. CTA opens a vet-prep view: "Bring this log + ask about: [Lyme C6 / 4Dx / SNAP test panel discussion]." Frame as questions for the vet, never a self-administered protocol.
3. If the vet diagnoses a tickborne disease and prescribes treatment, the user can log "Treatment started" + class (tetracycline class / others). Tracks duration.
4. Surface relevant follow-up reminders for monitoring (week 4 of doxycycline → vet recheck reminder).

### Layer 5 — Aggregate community heat map (v2.0+)
1. Anonymized + opted-in user tick logs aggregate into a county-level heat map for all FloofLife users to see.
2. Strict privacy: never display a single user's pin. Minimum 5 reports per county per 30 days before a county is shaded. Aggregation server-side only.
3. Powered by the same Supabase + a privacy-preserving aggregation job.

## Data Model

### AsyncStorage (local-only)
```
pawrent_tick_log_v1: { [petId]: TickEntry[] }
```
TickEntry shape:
```json
{
  "id": "t_xyz",
  "ts": 1715200800000,
  "biteLocation": "left ear",
  "biteSiteCoords": { "x": 0.34, "y": 0.12 },
  "photoUri": "file:///.../tick_xyz.jpg",
  "size": "sesame_seed",
  "engorged": true,
  "embeddedDurationHours": 12,
  "removalClean": true,
  "saved": false,
  "followUps": [
    { "day": 14, "ts": 1716415000000, "signs": ["lethargy","lameness"], "vetDiscussed": false },
    { "day": 30, "ts": 1717800000000, "signs": [], "vetDiscussed": false }
  ],
  "treatment": null
}
```

### Backend (Supabase)
```sql
create table tick_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pet_id uuid references pets not null,
  ts timestamptz not null,
  bite_location text,
  bite_site_coords jsonb,
  photo_url text,
  size text,
  engorged boolean,
  embedded_duration_hours int,
  removal_clean boolean,
  saved_specimen boolean,
  treatment_class text,
  treatment_start timestamptz,
  treatment_end timestamptz,
  county_fips text,
  created_at timestamptz default now()
);
create index tick_entries_user_pet_ts_idx on tick_entries (user_id, pet_id, ts desc);
create index tick_entries_county_ts_idx on tick_entries (county_fips, ts desc);

create table tick_followups (
  id uuid primary key default gen_random_uuid(),
  tick_entry_id uuid references tick_entries on delete cascade,
  day_marker int not null,
  ts timestamptz not null,
  signs jsonb,
  vet_discussed boolean default false
);

alter table tick_entries enable row level security;
alter table tick_followups enable row level security;
create policy "users own tick entries" on tick_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own tick followups" on tick_followups
  for all using (
    exists (select 1 from tick_entries where tick_entries.id = tick_entry_id and tick_entries.user_id = auth.uid())
  );

-- Aggregate (Layer 5, v2.0+) — read-only view computed nightly
create materialized view tick_county_aggregates as
  select
    county_fips,
    count(*) as report_count,
    date_trunc('week', ts) as week
  from tick_entries
  where ts > now() - interval '30 days'
  group by county_fips, week
  having count(*) >= 5;
```

### Migration
First-launch v1.3: empty tick log per pet. Existing users not affected.

### Local-only fallback
Layers 1-4 work fully offline once the local risk dataset is cached. Layer 5 (aggregate map) requires a network call; gracefully fallback to "Heat map unavailable offline."

## UI Components

### New screens
- `TickRiskScreen` — Layer 1 location risk + species + disease info (replaces or augments the existing `RiskScreen`).
- `TickWalkPlannerScreen` — Layer 2 map view.
- `LogTickScreen` — Layer 3 multi-step form.
- `TickHistoryScreen` — list of all logged tick threads.
- `TickFollowUpScreen` — day-14 / day-30 questionnaire.
- `TickTreatmentScreen` — Layer 4 treatment context.
- `TickHeatMapScreen` (v2.0+) — Layer 5 aggregate map.

### Modified screens
- `RiskScreen.js` — augment with the Tick risk card + entry point.
- `App.js` — add new routes.
- `HomeScreen.js` — surface a Tick follow-up reminder card if any active thread is at day-14 or day-30.

### New reusable components
- `<TickRiskBadge tier='low'|'moderate'|'high'|'very_high' />`
- `<PetBodyDiagram species onTapSite />` — pet-shape SVG for marking bite location.
- `<TickFollowUpChecklist signs onChange />`
- `<TickThreadView entry followUps />` — full vet-shareable thread.

## Free vs Premium Gating

- **Free**: all 5 layers' core safety functions. Layer 1 risk (current location), Layer 2 walk planner, Layer 3 tick log + day-14 / day-30 follow-ups + auto-scheduled notifications, Layer 4 treatment context tracking, Layer 5 aggregate map view.
- **Premium**: extended history (5+ tick logs in archive — free tier keeps 30 days), tick-disease deep-dive content (per-disease pages with sources), early-warning push when local risk shifts from moderate to high (free is in-app only), per-walk auto-tick-check reminder push.
- **Rationale**: tick safety is a pet welfare lever. Gating the log + follow-ups would be ethically and competitively wrong. The premium add-ons are convenience and depth, not safety.
- **Upgrade prompt**: in the Tick Risk card if the user views it 3+ times in a 30-day window.
- **Grandfather**: existing v1.0/v1.1 free users get the same free tier.

## Sources & Citations

- [CDC Lyme Disease + Tickborne Diseases](https://www.cdc.gov/lyme/) — incidence maps, county-level data, species ranges.
- [USGS / National Ecological Observatory Network — tick distribution data](https://www.usgs.gov/) — geographic species distribution.
- [CAPC (Companion Animal Parasite Council) Parasite Prevalence Maps](https://capcvet.org/maps/) — county-level dog tickborne disease prevalence (the gold standard for this data).
- [AVMA on tickborne disease in pets](https://www.avma.org/resources-tools/pet-owners) — owner-facing framing.
- [AKC Canine Health Foundation tickborne disease research](https://www.akcchf.org/) — peer-reviewed dog-specific work.
- [IDEXX 4Dx Plus / SNAP test reference](https://www.idexx.com/) — describing what vets typically test (educational, not promotional).
- [Cornell Baker Institute for Animal Health](https://www2.vet.cornell.edu/baker-institute) — Lyme research.
- [FDA isoxazoline class safety communication (2018)](https://www.fda.gov/animal-veterinary/cvm-updates/fda-alerts-pet-owners-and-veterinarians-about-potential-neurologic-adverse-events-associated-certain) — for cross-reference with the seizure-awareness spec.

## Language Guardrails

**Good**:
- "Black-legged ticks are present in your area year-round, with peak activity Apr-Oct (CDC)."
- "Has [pet name] shown any of these signs since the bite? Discuss this log with your vet if yes."
- "Tickborne diseases in dogs include Lyme, anaplasmosis, ehrlichiosis, babesiosis, and Rocky Mountain Spotted Fever. Risk varies by region and species."

**Bad**:
- "Your dog has Lyme disease." (diagnosis)
- "Use Bravecto for tick prevention." (brand recommendation)
- "Tick removal: pull straight up with tweezers." (procedural medical instruction without vet)
- "Doxycycline 5mg/kg BID x 28 days." (drug dose) — explicit no-go.
- "If your tick was attached more than 24 hours, your dog has Lyme." (false certainty)

For tick removal: link to AVMA + CDC how-to pages. Don't render the procedure inline. Frame as "Many vets and the AVMA describe a removal procedure here. If you're unsure, call your vet first."

For tickborne disease education: per-disease cards must cite CDC + AVMA + a peer-reviewed source. Frame all symptoms as "may include" — never absolute.

## Edge Cases & Error States

- **Empty state (no ticks logged)**: tick history shows a friendly "No tick encounters logged. Hope it stays that way." with a "Log a tick if it happens" CTA.
- **Offline**: Layer 1 risk + Layer 3 logging + Layer 4 treatment work offline. Local risk dataset cached on app open. Layer 2 map degrades to a generic risk reminder. Layer 5 aggregate unavailable offline.
- **Permission denied (location)**: Layer 1 falls back to a manual region picker (state/zip). Layers 2 + 5 disabled.
- **Permission denied (notifications)**: day-14 / day-30 follow-ups don't fire. In-app banner appears on those days when the user opens the app, asking the questions inline. Banner copy: "Notifications are off — we wanted to remind you about [pet]'s day-[14/30] tick check."
- **Multi-pet**: each pet has its own tick log. Aggregate (Layer 5) attributes by anonymous user_id, not pet_id.
- **iCloud transfer**: AsyncStorage data restores. Backend sync re-pushes on first signed-in launch.
- **Auth state**: anonymous users use Layers 1-4 fully. Layer 5 (aggregate map) requires opted-in sharing — phrase the consent clearly: "Help build a community tick map by sharing your county-level reports anonymously? County-only — no exact location, no pet info, ever."
- **Stale CDC / CAPC data**: if our cached risk data is >30 days old, surface "Risk data last updated [date]. Verify locally with your county health department."

## Analytics Events to Fire

- `tick_risk_viewed` — `{ tier: 'low'|'moderate'|'high'|'very_high', pet_species: 'dog'|'cat' }`. Never the user's lat/lng.
- `tick_logged` — `{ engorged: bool, removal_clean: bool, has_photo: bool, pet_species: 'dog'|'cat' }`.
- `tick_followup_completed` — `{ day_marker: 14|30, signs_count: int, any_signs: bool }`. Never the specific signs (those are health PII).
- `tick_treatment_started` — `{ class: 'tetracycline'|'other'|'none', pet_species: 'dog'|'cat' }`.
- `tick_walk_planner_opened` — no PII.
- `tick_aggregate_consented` — `{ consented: bool }` — for the Layer 5 opt-in.
- Privacy: NEVER track lat/lng, exact bite location, photos, or signs verbatim.

## Apple Review Risk Assessment

- **Guideline 1.4.1 (Safety - Medical)**: substantial care needed. Mitigation: every line is vet-discussion framed. No removal procedures inline. No drug recommendations. Tickborne disease education uses "may include" not "will."
- **Guideline 5.1.1 (Privacy)**: location used substantively (already approved for v1.0 RiskScreen). Verify `NSLocationWhenInUseUsageDescription` reflects the new use.
- **Guideline 5.1.2 (Data minimization)**: Layer 5 aggregate must be county-level only, never user-level pin. Document this in privacy disclosures.
- **Guideline 4.0 (Design)**: tick-risk badges follow Apple HIG color semantics (green/yellow/orange/red).
- **DVM advisor sign-off** strongly recommended on tickborne disease per-disease cards before shipping. Same gating logic as CPR.
- New permission strings: maybe — verify location string reflects tick-risk use.

## Implementation Estimate

- New files: ~12-15 (7 screens, 4-5 components, 1 storage helper, 1 risk dataset cache, 1 follow-up scheduler).
- Modified files: 4-5 (`App.js`, `RiskScreen.js` rewrite, `HomeScreen.js`, `analytics.js`, `app.json`).
- Build budget: spans v1.3 (Layers 1-3) and v1.4 (Layer 4). Layer 5 is v2.0+. v1.3 build can ship Layers 1-3 in 1 build alongside Pawgress + Weather notifications.
- Time estimate: 18-25 hours for Layers 1-4. Layer 5 is its own scope, ~10-15 hours including the aggregation job.
- Backend work: 2 tables + RLS + materialized view + ingestion job for CDC/CAPC data + (optional) opt-in tracking table.

## Open Questions / Decisions Needed

1. **Tick risk dataset license** — CAPC data is public-facing but the JSON/API access may need attribution / a data-use agreement. Verify before scraping. Alternative: scrape weekly + cache + cite "Data: CAPC, last updated [date]."
2. **Map provider** — MapKit is free for iOS but the tick overlay needs custom rendering. Mapbox costs but supports overlays natively. Apple Maps + custom overlays via `MKOverlay` is doable; harder to maintain.
3. **Day-14 / day-30 follow-up notification timing** — early morning (8 AM local) vs. when the user typically opens the app? Recommend 8 AM.
4. **DVM advisor partnership for disease pages** — same gating as CPR. Sign one before shipping disease deep-dives.
5. **Tick photo retention** — photos help vet ID species. Retain locally indefinitely, backend only on Premium opt-in?
6. **Aggregate map county threshold** — minimum 5 reports / 30 days protects privacy. Confirm with privacy review.
7. **Cat tick logging** — cats also get ticks. Layer 3 supports both species; Layer 1 risk data is dog-centric (CAPC). Verify cat-specific tick risk sources.
8. **Embedded duration estimate** — most owners don't know. Make it optional with "unsure" as default.

## Out of Scope (for v1.3-v1.4)

- AI species identification from tick photo — defer to v2.0+, requires labeled dataset + ML pipeline.
- Real-time CAPC API integration (currently we cache weekly).
- Tick-borne disease test result import from vet APIs — v2.0+, requires vet-software partnerships.
- Push notification when a tick is reported within X miles of the user (creepy + privacy concern).
- Integration with smart tick repellent collars — v2.0+ partnership.
- Bottom-up reporting from veterinary clinics (a future "Vet Portal" idea).

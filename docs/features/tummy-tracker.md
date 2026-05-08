# Tummy Tracker (v1.4)

## Goal

Per-pet GI logging — stool entries (Bristol-derived scale, color, volume, mucus, blood, optional photo, walk context) plus a parallel diet log (food brand, treats, table scraps, supplements, water intake) that lets users spot diet → stool patterns over days and weeks. Tummy Tracker is FloofLife's most clinically valuable everyday feature: GI complaints are the #1 reason for non-emergency vet visits in companion animals, and what owners struggle most to articulate to a vet ("his poop has been weird for a few days") is exactly what a structured log fixes.

**CRITICAL NON-NEGOTIABLE GATING RULE:** Two outputs of the Tummy Tracker are NEVER paywalled and never gated by anything other than basic auth: (1) a recall-match alert when a logged food / treat brand matches an active FDA pet food recall, and (2) a "discuss with your vet" suggestion when the log shows a pattern that warrants veterinary attention (e.g., bloody stool, ≥3 consecutive days of diarrhea, sudden severe consistency change). These are safety-critical and Premium gating them would be unethical and a likely Apple-review issue.

## Founder Anchor

Max's dog had a bout of recurrent soft stool that took three vet visits and a food trial to resolve. The vet asked questions Max couldn't answer accurately from memory: "How many days exactly? What color? Was there mucus? What did you change in the diet around then?" A pet poop log would have collapsed three visits into one. Most pet GI mysteries are solvable with a good week of data; the data is the hard part for owners.

## User Flow

### Logging a stool entry
1. From any screen, hit the "+" tab → "Log poop" (or from the Pet detail view → "Log poop today").
2. **Step 1 — Consistency**: Bristol-style scale 1-7 with line-art icons (1 = pebbles, 4 = ideal log, 7 = liquid). Tap to select.
3. **Step 2 — Color**: chips (brown / dark brown / black / yellow / orange / green / red / gray / pale). Tooltip on each: "Black or red stool can indicate blood — discuss with your vet if persistent."
4. **Step 3 — Volume**: small / normal / large.
5. **Step 4 — Modifiers**: toggles for mucus, visible blood, foreign material, undigested food. Each modifier triggers a short tooltip with vet-discussion framing.
6. **Step 5 — Context (optional)**: walk location (current GPS pin or "no walk"), time of day (auto-filled), photo (camera or library), free-text note.
7. Save. Confirmation: "Logged. Check the Tummy timeline to see patterns."

### Logging a diet entry
1. "+" tab → "Log diet."
2. Quick-add chips for the pet's saved primary food + treats. Tap-to-log a chip with a default portion.
3. Custom-add: brand, type (kibble / wet / raw / treat / supplement / scraps / human food / water-only), amount, time. Brand search hits the FDA recall list in real time as a passive backround query — if a match, show a non-blocking but prominent **Recall Alert** card on save.

### Tummy Timeline
- Tab: "Tummy" alongside Home / My Pets / Checklist / Emergency.
- View 1 (default): timeline. Vertical scrolling list of entries (stool + diet, color-coded chips). Today at top, scrollable into the past.
- View 2: pattern view (Premium). Calendar heatmap of stool consistency over 30/90 days. Diet correlations highlighted (e.g., "soft stool on every day after table scraps in the last 14 days").
- Tap any entry → detail with edit / delete / "Discuss with vet" share button (exports the entry as a vet-friendly summary block to clipboard or share sheet).

### Vet visit suggestion (NOT paywalled)
- Surfaces as a banner card at the top of the Tummy tab when a heuristic trip-wire fires:
  - 3+ consecutive days of Bristol 6-7 (diarrhea)
  - 3+ consecutive days of Bristol 1-2 (constipation)
  - Any visible blood entry
  - Black tarry stool (melena indicator)
  - Sudden severe color change (yellow / gray / pale → possible biliary or pancreatic issue per AVMA guidance)
- Banner copy: "Pattern detected: [N] days of [pattern]. Consider discussing this log with your vet — share the timeline export."
- Always provides a "Share log with vet" button that exports last 14 days as a PDF or formatted text block.

## Data Model

### AsyncStorage (local-only mode)

Keys:
- `pawrent_tummy_stool_v1` — `{ [petId]: StoolEntry[] }`
- `pawrent_tummy_diet_v1` — `{ [petId]: DietEntry[] }`

Sample:
```json
{
  "p_abc123": [
    {
      "id": "s_xyz",
      "ts": 1715200800000,
      "bristol": 4,
      "color": "brown",
      "volume": "normal",
      "modifiers": [],
      "walkLocation": null,
      "photoUri": "file:///.../stool_xyz.jpg",
      "note": ""
    }
  ]
}
```

```json
{
  "p_abc123": [
    {
      "id": "d_xyz",
      "ts": 1715201200000,
      "kind": "kibble",
      "brand": "Purina Pro Plan Adult Chicken & Rice",
      "amount": "1 cup",
      "note": "",
      "recallMatched": false
    }
  ]
}
```

### Backend schema (Supabase)

```sql
create type stool_consistency as enum ('1','2','3','4','5','6','7');
create type stool_color as enum ('brown','dark_brown','black','yellow','orange','green','red','gray','pale');
create type stool_volume as enum ('small','normal','large');

create table stool_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pet_id uuid references pets not null,
  ts timestamptz not null,
  bristol stool_consistency not null,
  color stool_color not null,
  volume stool_volume not null,
  has_mucus boolean default false,
  has_blood boolean default false,
  has_foreign_material boolean default false,
  has_undigested_food boolean default false,
  walk_lat double precision,
  walk_lng double precision,
  photo_url text,
  note text,
  created_at timestamptz default now()
);
create index stool_entries_user_pet_ts_idx on stool_entries (user_id, pet_id, ts desc);

create table diet_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pet_id uuid references pets not null,
  ts timestamptz not null,
  kind text not null,
  brand text,
  amount text,
  note text,
  recall_matched boolean default false,
  recall_id text,
  created_at timestamptz default now()
);
create index diet_entries_user_pet_ts_idx on diet_entries (user_id, pet_id, ts desc);

alter table stool_entries enable row level security;
alter table diet_entries enable row level security;
create policy "users own stool entries" on stool_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own diet entries" on diet_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Photos: stored in Cloudflare R2 bucket `floof-stool-photos` (private, signed URLs only). Photos are user-scoped and never aggregated.

### Migration
First-launch v1.4: existing pets initialized with empty `stool_entries` and `diet_entries`. No retroactive data.

### Schema versioning
`bristol` field on entry includes a `schema_version` column on the table for future expansion (e.g., adding mucus types or volume in grams). Client reads tolerate missing fields.

### Local-only fallback
Full feature works offline. Photos remain on-device until backend sync. Recall match against locally-cached recalls list (synced daily on app open). Sync queue per entry; conflicts resolved by `created_at` (entries are immutable except for delete).

## UI Components

### New screens
- `TummyHomeScreen` — tab root. Timeline + banner.
- `LogStoolScreen` — multi-step form, modal presentation.
- `LogDietScreen` — single-step form with quick-add chips.
- `TummyDetailScreen` — single-entry detail view.
- `TummyPatternScreen` (Premium) — calendar heatmap + diet correlation cards.

### Modified screens
- `App.js` — add Tummy tab to bottom-tabs.
- `HomeScreen.js` — add a soft "Tummy" CTA card if the user has logged ≥3 stool entries in last 7 days (engagement loop).

### New reusable components
- `<BristolPicker value onChange />` — 1-7 line-art icons.
- `<ColorChip color selected onPress />` — color pill.
- `<RecallAlertCard match severity />` — passive but prominent banner.
- `<VetSuggestionBanner pattern entries />` — pattern-detected banner.
- `<TummyTimelineRow entry />` — single-entry row (stool or diet).

## Free vs Premium Gating

- **Free**: log unlimited stool + diet entries (history kept 30 days locally). Bristol picker, color, volume, modifiers, photo (1 photo per entry, kept 7 days). Recall match alert (NEVER paywalled). Vet visit suggestion (NEVER paywalled). Share-with-vet text export (NEVER paywalled).
- **Premium**: unlimited history (no 30-day pruning), unlimited photos retained, calendar pattern view + diet correlations, PDF export styled for vet visits, anomaly alerts (push notification when a trip-wire fires for the first time in a calendar day).
- **Upgrade prompt**: appears at the bottom of the timeline as a soft "See 90 days of patterns →" button after the 30-day cutoff. Never blocks a critical-care output.
- **Grandfather**: existing v1.0/v1.1 free users — no retroactive Premium. They get Tummy Tracker free tier same as new free users.

## Sources & Citations

- [AAFP / AAFCO and AVMA: Body Condition and GI guidance](https://www.avma.org/resources-tools/animal-health-and-welfare/companion-animal-care)
- [Purina Bristol-style Fecal Scoring Chart (consumer-friendly version)](https://www.purinaproclub.com/) — used as reference inspiration; FloofLife's scale icons must be original art, not Purina's.
- [WSAVA Global Nutrition Guidelines](https://wsava.org/global-guidelines/global-nutrition-guidelines/) — for diet-pattern framing.
- [FDA Pet Food Recall feed (CVM)](https://www.fda.gov/animal-veterinary/recalls-withdrawals) — JSON / RSS feed for recall match.
- [ACVIM Consensus on Chronic Enteropathies in Dogs](https://onlinelibrary.wiley.com/journal/19391676) — for vet-suggestion trip-wire thresholds.
- [Tufts Cummings VetNutrition Service Petfoodology](https://vetnutrition.tufts.edu/petfoodology/) — for diet education tone reference.
- [Cornell Feline Health Center — Cat GI](https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center) — feline-specific framing.

## Language Guardrails

**Good**:
- "Pattern detected: 3 days of soft stool. Consider discussing this log with your vet."
- "Black or tarry stool can indicate digested blood. Discuss with your vet promptly if you see this."
- "This brand appears in an active FDA recall. Discuss the recall details with your vet before continuing this food."

**Bad**:
- "Your dog has IBD." (diagnosis claim)
- "Switch to [brand X] for better stools." (brand recommendation)
- "Give 1 tbsp pumpkin to firm up stool." (treatment instruction without vet)
- "Black stool means internal bleeding." (false certainty)
- Any reference to specific veterinary medications (Metronidazole, Tylosin, Cerenia, etc.) — use generic class names if needed at all.

Use vet-discussion framing on every health-flavored line. Use neutral framing when describing patterns ("pattern detected" not "your pet is sick").

## Edge Cases & Error States

- **Empty state**: timeline is empty. Show a friendly "Log your first poop" CTA with a one-line explanation of why a log helps.
- **Offline**: full logging works. Recall match runs against the locally-cached FDA recall list (synced daily on app open). If the cache is older than 7 days, show a soft "Recall data may be outdated — last synced [date]" hint.
- **Photo permission denied**: log saves without photo. Show a one-line hint: "Photos help your vet — enable in iPhone Settings → FloofLife → Photos."
- **Location permission denied**: walk-location feature silently skipped.
- **Multi-pet**: each pet has independent stool + diet timelines. No cross-pet aggregation.
- **iCloud / device transfer**: AsyncStorage data restores via iCloud backup. Photos in the iCloud Photo Library + the app's documents directory are preserved. Backend sync re-pushes on first signed-in launch on the new device.
- **Auth state transitions**: anonymous users have full local logging. On sign-in, all local entries upsert to backend. On sign-out, backend writes pause; local cache remains.
- **Recall data fetch fails**: log saves without recall check. Background retry on next online window. Pet's safety isn't gated on the recall fetch succeeding.
- **Brand match false positives**: "Purina One" partial-matches "Purina Pro Plan" if naive substring search is used. Use brand-canonical IDs from the FDA feed, not substring matching.

## Analytics Events to Fire

- `tummy_stool_logged` — `{ bristol: 1-7, color: enum, has_blood: bool, has_mucus: bool, has_photo: bool, pet_species: 'dog'|'cat' }`. Never send the photo, walk location, or note text.
- `tummy_diet_logged` — `{ kind: enum, has_brand: bool, recall_matched: bool, pet_species: 'dog'|'cat' }`. Never send the brand string.
- `tummy_recall_match_shown` — `{ recall_id: string, pet_species: 'dog'|'cat' }`. Recall ID is FDA-public; not PII.
- `tummy_vet_suggestion_shown` — `{ trigger: 'diarrhea_3d'|'constipation_3d'|'blood'|'melena'|'color_change', pet_species: 'dog'|'cat' }`.
- `tummy_share_export` — `{ format: 'pdf'|'text', day_count: int }`.
- `tummy_pattern_view_opened` — `{ tier: 'free'|'premium', view: 'week'|'month'|'90d' }`.
- Privacy contract: NEVER track pet name, photo bytes or URL, walk lat/lng, brand text, or note text. Only enumerated values + counts.

## Apple Review Risk Assessment

- **Guideline 1.4.1 (Safety - Medical)**: HIGH attention area. Mitigation: every health flavored line is vet-discussion framed. The vet suggestion banner says "discuss with your vet" — never "your pet has X." Bristol scale is descriptive (consistency), not diagnostic.
- **Guideline 5.1 (Privacy)**: photo storage requires `NSPhotoLibraryUsageDescription` and `NSCameraUsageDescription`. Location requires `NSLocationWhenInUseUsageDescription`. All three already exist in `app.json`; verify wording specifies "to attach to your pet's GI log" not the generic existing string.
- **Guideline 3.1.1 (In-app Purchase)**: Premium gating uses RevenueCat. The recall-match and vet-suggestion outputs are explicitly NOT paywalled — Apple has historically been strict about safety content gating, and this design avoids any review concern.
- **Pet medical disclaimer** required at first use. Standard FloofLife disclaimer ("informational, not a substitute for veterinary care") plus a Tummy-specific line: "This log doesn't diagnose. It helps you and your vet see patterns."
- New permission strings: maybe — verify the existing camera/photo strings can stay generic or need a Tummy-specific addendum. Discuss with Max before submission.

## Implementation Estimate

- New files: ~10-12 (5 screens, 5 reusable components, 1 storage helper, 1 recall match service).
- Modified files: 3-4 (`App.js`, `HomeScreen.js`, `analytics.js`, `app.json` if permission strings change).
- Build budget: own build (this is a major feature; v1.4 is the right scope).
- Time estimate: 12-18 hours focused autonomous-Claude-Code work, not counting design polish on the Bristol icons (which need real visual work — flag this in Open Questions).
- Backend work: 2 tables + RLS + indexes + photo bucket + FDA-recall ingestion job (cron pulling FDA feed daily into a `recalls` table for fast matching).

## Open Questions / Decisions Needed

1. **Bristol icon art** — the 1-7 illustrations need to be tasteful, not cringe. Commission an illustrator? Use simplified line-art? This is the visual centerpiece of Tummy Tracker.
2. **Photo storage cost** — Cloudflare R2 is cheap, but heavy users could log multiple photos per day. Premium-only photo retention beyond 7 days mitigates cost. Confirm gating threshold.
3. **Recall-match scope** — match dog + cat food only, or also treats, supplements, dental chews? FDA-CVM covers all; product recommendation: include all.
4. **Vet-suggestion thresholds** — recommended starting points above (3 days). Right cadence to revisit with a real DVM advisor before v1.4 ships.
5. **Diet correlation algorithm (Premium)** — naive co-occurrence ("X% of days with [food] had Bristol ≥6") vs. statistical (Fisher's exact). Naive is honest at small N; statistical risks false confidence. Recommend naive with explicit "not a diagnosis" framing.
6. **PDF export styling** — branded vs. plain. Vet-friendly is plain (chronological, scannable, prints to one page). Marketing-friendly is branded. Vet-friendly wins for trust.
7. **Anomaly push notifications (Premium)** — on first trip-wire of the day, push a notification. Need a notification permission prompt timed thoughtfully (not on first open).
8. **DVM advisor signed off on the trip-wire heuristics** — the vet-suggestion banner is medical-flavored content. Should be reviewed by a licensed vet before shipping. Same gating as CPR content.

## Out of Scope (for v1.4)

- AI image analysis of stool photos (e.g., automatic Bristol scoring) — too much risk for v1, hard to validate, brand-damage if wrong.
- Real-time vet chat from the Tummy tab — v2.0+, requires partnership infrastructure.
- Cross-pet aggregation / household analytics — explicit non-goal; each pet's GI is its own thing.
- Diet recommendation engine — explicit non-goal. We don't tell users what to feed.
- Integration with smart litter boxes (Whisker, Tomofit, etc.) — v2.0+ partnership work.
- Stool-microbiome integration (Embark, AnimalBiome) — v2.0+ partnership work.
- Symptom triage / "should I go to the ER" flowcharts — separate from Tummy; Emergency screen owns that, with much heavier review gating.

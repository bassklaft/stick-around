# FloofLife — Handoff Brief

**Purpose**: this file is the cold-start context document for any new Claude Code conversation working on the FloofLife project. It's deliberately self-contained — paste it into a new conversation and the agent has everything it needs to pick up without re-reading the entire history.

**Maintained**: ad-hoc when conversations switch. Cross-conversation continuity lives here, in `OVERNIGHT_NOTES.md`, in `V1_REMOVED_FEATURES.md`, and in the per-feature specs under `docs/features/`.

---

## What FloofLife is

iOS pet-care app (React Native + Expo SDK 54). Production-shipped to App Store under Apple Developer account `bassklaft@gmail.com` (Maxwell Bernard Klafter, sole proprietor). Bundle ID: `com.bassklaft.pawrent`. Repo: `https://github.com/bassklaft/floof-life`.

Premium subscription via RevenueCat (`react-native-purchases`). PostHog analytics (`posthog-react-native`). Multi-pet support landed in v1.1 + active-pet switcher in v1.1.1.

**The product principle**: better pet parenting, on autopilot. Breed-specific health considerations, weekly checklist tailored by breed/age/season, recall feed, vets-near-me, emergency resources, multi-pet support. The breed catalog (`src/data/breeds.js`) is the editorial heart of the product.

---

## Current state — 2026-05-08

### Branches
- `main` — production. Has `docs/security-non-negotiables.md` (the cross-cutting reference doc; read before any backend work).
- `v1.2-work` — the active development branch for the upcoming v1.2.0 release. **HEAD: `5e1cc09`** as of this writing.
- `v1.1.2-work` — frozen (was the v1.1.x line; merged into v1.2-work in commit `0a7b215`).
- `feature-specs-batch-1` — branch holding 8 detailed feature specs at `docs/features/*.md` (Pawgress, Tummy, Tick, Weather, Seizure, Checklist Paywall, Relocation, Emergency Procedures). Off `main`. Not merged anywhere yet — these are reference docs.

### Build pipeline
- v1.0 — shipped to App Store late April 2026
- v1.0.1 / v1.1 — TestFlight through builds 12-16
- v1.1.2 — never built (merged into v1.2-work; renamed v1.2.0)
- **v1.2.0 (build 18)** — current target; NOT YET TRIGGERED. Ready for build trigger after manual smoke test.

### Build budget (CRITICAL)
- This cycle: **1 discretionary build left + 1 emergency reserved**. Cadence 1 build/week MAX.
- Next cycle (3 weeks out): 12/month, 3 emergency reserves.
- DEFAULT TO NO. List manifest of what's in a build before triggering. Emergencies bypass.
- Source: `~/.claude/projects/-Users-max/memory/feedback_build_budget.md`.

### v1.2.0 manifest — what's already landed

Across the v1.2-work branch (since the v1.1.2-work merge):

1. **Merge of v1.1.2-work into v1.2-work** (`0a7b215`) — 16 conflicts hand-resolved. Caught + fixed a duplicate-toggleAbout-function bug from auto-merge that would have broken mixed-breed sectionId state in YourPetsScreen.

2. **Brand-name compliance audit** — across H1-H3 (Bichon Frise) + 6 out-of-scope breeds (Lab, French Bulldog, Cavalier, Doberman, Shih Tzu, Brittany). breeds.js is now ZERO brand-name medications. All allergy bullets use the pattern: "Modern allergy medications have transformed quality of life — discuss with your vet whether oral medications, injectable options, or allergen-specific immunotherapy fit your [breed]." Pimobendan kept as generic class name (Vetmedin parenthetical dropped).

3. **Multi-pet UX refinement** — pet card name-as-button (with pencil icon) + EditPet flow (using OnboardingScreen with editMode); pet-name nav title on ChecklistScreen + HealthTrackerScreen ("Falafel's Checklist"); active-pet chip in nav-bar top-right (multi-pet only); PetSwitcherModal as the single switching mechanism. Single-pet households get plain title, no chip.

4. **Microchip Phase 1** — new onboarding step 4 capturing `microchipStatus` (`confirmed` / `pending` / `none` / `unsure`) + `microchipNumber` (15-digit ISO 11784/11785). Existing pets soft-migrate to `unsure` via fallback default.

5. **My Floofs welcoming empty state** — replaces the dev-speak "Reset all data" message with a friendly first-time-user UI: paw icon + headline + value prop + "Add your first floof" CTA + privacy reassurance line.

6. **Light gamification polish** — LayoutAnimation expand/collapse on every breed card section (About, Health, Tips, Sources, Origin Story); celebratory overlay + notifySuccess haptic when ALL daily checklist items complete (de-duped per pet/date); tapLight haptic on tab switches.

7. **Breed catalog expansion** — 31 net-new breeds across overnight + manifest batches. Total now: **111 entries** (78 dogs + 33 cats), all audit-quality format. Includes:
   - Standard adds (Bull Terrier, Cardigan Welsh Corgi, English Mastiff, Great Pyrenees, Jack Russell Terrier, Pekingese, Rhodesian Ridgeback, Scottish Terrier, Standard Schnauzer, Tibetan Mastiff, Westie, Xoloitzcuintli, American Curl, Savannah, Selkirk Rex, +others from earlier overnight batches)
   - **Pit-type breeds with neutral framing** (American Pit Bull Terrier, American Staffordshire Terrier, Staffordshire Bull Terrier) — no aggression/fighting/tough/guard-dog language; BSL framed as practical owner consideration only
   - **Munchkin cat with welfare-aware framing** modeled on Scottish Fold pattern (cite ICatCare + RSPCA + BVA + GCCF + FIFe positions; "if you have one... if you're considering buying one..." closing)

8. **Dependency installs** (`df57e90`) — added `expo-print` (~15.0.8) for Tummy Tracker PDF export + `react-native-svg` (15.12.1) for Pawgress paw graphics. Both via `expo install` for SDK-54 compatibility.

9. **Pawgress data layer** (`5e1cc09`) — `src/lib/pawgress.js` storage helper. AsyncStorage shape mirrors future Supabase `pawgress_days` table. API: `getDay`, `toggleSegment`, `setSegment`, `getRange`, `getStreak`, `countCompleted`, `isAllFive`. Daily-special rotation by day-of-week.

### v1.2.0 manifest — what's IN PROGRESS / PENDING

The user's most recent manifest (in conversation FloofLife 2 / current) added two big features to the v1.2.0 scope:

**Pawgress Indicator (cluster of commits)**:
- ✅ Data layer (committed `5e1cc09`)
- ⏳ Pawprint SVG component (multi-segment, color-mode prop) — PENDING
- ⏳ Checkmark SVG component (drawn-in animation) — PENDING
- ⏳ Confetti + hearts celebration component — PENDING
- ⏳ HomeScreen + ChecklistScreen integration — PENDING
- ⏳ Expanded modal + streak counter — PENDING
- ⏳ Theme tokens for day/week/month/year colors — PENDING

**Tummy Tracker (separate cluster)** — MAJOR feature, full spec at `docs/features/tummy-tracker.md`:
- ⏳ Data model + AsyncStorage hooks — PENDING
- ⏳ Stool log entry screen (Bristol scale 1-7, color enum, volume enum, modifiers, photo, walk context) — PENDING
- ⏳ Diet log entry screen — PENDING
- ⏳ Photo capture menu component — PENDING
- ⏳ Tummy Tracker main screen (timeline view) — PENDING
- ⏳ FDA recall match service + banner — PENDING (fetch from `https://api.fda.gov/animalandveterinary/event.json`)
- ⏳ Vet visit suggestion service + banner — PENDING (3+ Bristol 1-2 / 3+ Bristol 6-7 / blood / black or red-tinged / volume change)
- ⏳ Export PDF feature (Premium, via expo-print HTML→PDF) — PENDING
- ⏳ Premium gating for time-range views (30d free / 90d, 365d, all-time Premium) — PENDING
- ⏳ Pet profile + HomeScreen integration — PENDING

**Final**:
- ⏳ OVERNIGHT_NOTES.md update with full v1.2.0 final manifest, manual smoke test additions for both features, marketing brief — PENDING

---

## Hard rules

These are NON-NEGOTIABLE constraints from the user across multiple sessions. Follow them strictly:

1. **NO `eas build` commands.** Don't trigger builds autonomously. The user manages build scheduling per the build budget rule.
2. **NO destructive git ops** (`git reset --hard`, `git push --force`, `git checkout .` over uncommitted work, `git branch -D`). Investigate before deleting.
3. **NO major dep installs.** Minor utility libraries are OK if explicitly approved (e.g., `expo-print`, `react-native-svg` were OK; `react-native-confetti-cannon` was discussed and skipped in favor of programmatic Animated). Always grep package.json first.
4. **All medical content stays "discuss with your vet"** — never prescriptive, never brand-recommending, never absolute claims. Use "may be predisposed", per-bullet vet-discussion framing.
5. **NO brand-name medications** in breed entries. Use medication CLASS or treatment APPROACH. Pimobendan is OK (it's the generic class name); Vetmedin (the brand parenthetical) is not.
6. **Photos NEVER save to camera roll** — sandbox storage only. The existing `pickPetPhoto` uses `expo-image-picker` with `mediaTypes: 'Images'` and copies to `documentDirectory`.
7. **Recall match + vet suggestion ALWAYS free**, never paywalled — safety content can't be gated.
8. **NO HealthKit integration** in any current feature.
9. **Privacy contract for analytics**: NEVER track pet name, breed-specific health entries verbatim, photo bytes/URIs, location lat/lng, or notes/free-text. Only enumerated values + counts. PostHog is anonymous-by-default.
10. **Run autonomously when given a manifest.** Commit each piece separately. Surface only genuine architectural blockers (real ambiguity affecting many breeds, not minor judgment calls). Use OVERNIGHT_NOTES.md for autonomous decisions the user should know about.

---

## Style + conventions

### Breed entry format (v1.2 audit)

Every breed in `src/data/breeds.js` follows this shape:

```js
"breed key": {
  species: "dog" | "cat",
  lifespan: "X-Y years",
  energy: "low" | "low-moderate" | "moderate" | "moderate-high" | "high" | "very high",
  displayName: "Plural name",   // optional override
  shortName: "Singular short",  // optional override
  origin: "Country · era + parenthetical context",
  brachycephalic: true,         // optional
  about: "Warm narrative 5-10 sentences. Origin + personality + best environments. Closes with soft pointer to Health Considerations.",
  summary: "Short single-line summary (legacy field — backward compat).",
  healthSummary: "One paragraph opener for Health Considerations card. Lists 3-5 main concerns with 'may be predisposed' framing.",
  references: [
    { label: "Org name + topic", url: "https://..." },
    // 3-5 authoritative sources: AKC, breed parent club, VCA, OFA, Cornell, Merck, peer-reviewed
  ],
  health: [
    "Concern — explanation. Discuss screening cadence with your vet.",
    // 6-7 bullets, vet-discussion framed
  ],
  grooming: "Cadence + technique",
  exercise: "Time/day + intensity notes",
  checklist: [
    { title: "...", why: "...", cadence: "daily" | "weekly" | "yearly" | "always" | "once" | "3x/week", category: "vet" | "care" | "observe" | "safety" },
  ],
  tips: [
    "Practical owner tip with vet-discussion close.",
    // 3-5 tips
  ],
}
```

### About card vs Health Considerations card (content principle)

- **About card** — warm, screenshot-for-friends. Personality, origin, breed-specific quirks. NO medical content. Default expanded on display.
- **Health Considerations card** — serious, screenshot-for-vets. Audit-quality medical bullets with sources. Default collapsed.
- Tips card teases ("Insider Tips · 7 things only Cocker owners know"). Default collapsed.
- Origin Story + Sources are inner collapsibles within the About card. Default collapsed.
- Source: `~/.claude/projects/-Users-max/memory/feedback_content_principles.md`.

### File structure
- `src/screens/*.js` — screens
- `src/components/*.js` — reusable components (PetSwitcherModal, ActivePetTitle, ActivePetChip, Logo)
- `src/lib/*.js` — utilities (storage, analytics, haptics, purchasesContext, founderOverride, healthRecordTypes, etc.)
- `src/data/*.js` — content data (breeds, recalls, training, etc.)
- `App.js` — root navigator (RootStack + MainTabs)
- `docs/features/*.md` — feature specs (8 currently on feature-specs-batch-1)
- `docs/security-non-negotiables.md` — backend security rules (on main)
- `OVERNIGHT_NOTES.md` — running log of autonomous decisions + open items
- `V1_REMOVED_FEATURES.md` — historical roadmap + features stripped for v1.0 + future-version plans
- `V2_CHANGELOG.md` — user-facing changelog

### Storage keys

All AsyncStorage keys are prefixed `pawrent_` for the legacy reason that the project was originally called Pawrent. Do not rename — would break upgrade paths.

- `pawrent_pet` — legacy single-pet (mirror of pets[0])
- `pawrent_pets_v2` — multi-pet array
- `pawrent_active_pet_id` — active pet for the chip switcher
- `pawrent_checklist_state_v2` — per-pet checklist state `{ [petId]: { [itemId]: { status, ts } } }`
- `pawrent_haptics_pref` — On / Subtle / Off
- `pawrent_pawgress_v1` — daily-care tracker (just added in commit `5e1cc09`)

### Founder override

`src/lib/founderOverride.js` — hardcoded array of IDFV strings that get `isPremium = true` regardless of RevenueCat state. Currently contains Max's IDFV `981F7B5B-46DF-4B89-AF5D-49B812EB939D`. Per the security doc, this migrates to a server-side `is_founder` column when backend ships in v1.3+.

### Voice

Direct, useful, no marketing fluff. Conversational without being saccharine. Honest about uncertainty (e.g., contested breed origins). Vet-discussion framing on health-flavored content. Respects user agency (no nag-spam, no "your pet needs Premium" manipulation).

---

## Where to find references

- **Read before any backend / auth / premium-gating / admin work**: `docs/security-non-negotiables.md` on `main`. Five sections + cross-cutting rules. Already pointed-to from auto-memory `reference_security_non_negotiables.md`.

- **Read before implementing a v1.3+ feature**: relevant spec under `docs/features/*.md` on `feature-specs-batch-1`. Each spec has goal / founder anchor / user flow / data model / UI / gating / sources / guardrails / edge cases / analytics / Apple review / estimate / open questions / out-of-scope.

- **Read before contributing to the breed catalog**: `feedback_content_principles.md` (auto-memory) for About vs Health Considerations split + tease-title format + contested-topic dual-perspective rule.

- **Read for build budget + cadence rules**: `feedback_build_budget.md` (auto-memory).

- **Read for autonomous-mode expectations**: `feedback_autonomous_work.md` (auto-memory) — run multi-part work batches without asking item-by-item, commit each piece separately, stop only for genuine blockers.

- **Read for EAS Submit handling**: `feedback_transporter_fallback.md` (auto-memory) — Max uses Transporter for .ipa upload when EAS Submit queue is slow; don't poll EAS for submission status.

---

## Analytics events fired (PostHog)

Privacy contract: only enumerated values + counts. No PII, no notes, no photos, no breed-key strings (only `species: "dog"|"cat"`).

Existing events (v1.1.x + v1.2.0):
- `app_opened`, `screen_viewed` — bedrock telemetry
- `onboarding_completed`, `pet_added`, `pet_edited`, `pet_edit_opened`
- `pet_photo_picked` (with context)
- `active_pet_switched` (with `source: 'checklist_switcher' | 'health_tracker_switcher'`)
- `about_breed_expanded`, `health_considerations_expanded`, `origin_story_expanded`, `sources_expanded`, `insider_tips_expanded`
- `checklist_item_toggled`, `checklist_all_done` (NEW in v1.2.0)
- `premium_purchase_initiated`, `premium_purchase_completed`, `premium_purchase_cancelled`, `premium_purchase_failed`
- `send_feedback_tapped`

To add for v1.2.0 (mostly Tummy Tracker work-in-progress):
- `pawgress_pad_tapped`, `pawgress_day_completed`, `pawgress_history_viewed`
- `tummy_tracker_stool_log_created`, `tummy_tracker_diet_log_created`, `tummy_tracker_photo_captured`
- `tummy_tracker_recall_match_shown`, `tummy_tracker_vet_suggestion_shown`
- `tummy_tracker_export_initiated`
- `tummy_tracker_premium_upsell_shown`, `tummy_tracker_premium_upsell_converted`

PostHog credential note: only the public-write `phc_` key is in `.env`. To pull dashboard insights, the user needs to share results manually or generate a personal `phx_` API key — Claude can't query PostHog dashboards autonomously.

---

## Known open items

From `OVERNIGHT_NOTES.md` (read it for full context):

1. **Visual verification gap** — no iOS simulator runtime installed locally. Build 18 manual smoke test on physical device replaces the simulator pass. The PRE-BUILD-18 manual checklist in OVERNIGHT_NOTES has 15 sections covering everything.

2. **DVM advisor partnership** — flagged across Tummy Tracker, Tick, Seizure, Relocation, Emergency Procedures specs. CRITICAL PATH for v1.4+ medical content. Not blocking for v1.2.0.

3. **Insurance + attorney review** — flagged for v2.0 Emergency Procedures library. Multi-week external timelines.

4. **WeatherKit Expo wrapper gap** — `expo-weather-kit` doesn't exist; would need a custom Expo native module for v1.3 Weather notifications.

5. **Bristol Stool Scale icons** — flagged in tummy-tracker.md spec as "the visual centerpiece" needing real design work. v1.2.0 implementation will use simple programmatic SVG placeholders; commission proper illustrations for v1.3.

6. **Tummy Tracker DVM advisor sign-off** — vet-trip-wire heuristics (3+ days diarrhea, blood, melena, etc.) should be reviewed by a licensed vet before they go live in front of users. Same gating logic as CPR.

7. **Microchip Phase 1 'pending' soft-prompt** — the `microchipStatus: 'pending'` ("ask me later") option writes to schema but doesn't yet have the periodic-app-open soft-prompt UI. Schema is ready; UI is a v1.3 enhancement.

---

## Key file paths to know

- **App.js** — root navigator. Contains `MainTabs` (Checklist / Home / My Floofs) + `RootStack` (push routes: Toxic, Vets, Diet, Recalls, Trip, Training, Risk, Emergency, DogAge, HealthTracker, AddHealthRecord, About, AddPet, EditPet, Premium, Settings).
- **src/screens/HomeScreen.js** — multi-pet hero hub
- **src/screens/YourPetsScreen.js** — multi-pet list (with name-as-button + chip + active marker + EditPet route)
- **src/screens/ChecklistScreen.js** — daily checklist (with celebratory haptic + LayoutAnimation toggles)
- **src/screens/HealthTrackerScreen.js** — vaccine + preventative tracker
- **src/screens/OnboardingScreen.js** — used in 3 modes: first-launch (default), `addMode`, `editMode` (pre-fills from petId, calls Pets.update)
- **src/screens/EmergencyScreen.js** — poison hotlines + ER vet finder + Red Cross Pet First Aid course (CPR was stripped pre-v1.0; restoration gated on DVM partnership)
- **src/screens/PremiumScreen.js** — RevenueCat-driven Premium upsell with founder override
- **src/screens/SettingsScreen.js** — Privacy / TOS via GitHub Pages URLs + send-feedback mailto + haptic preference
- **src/components/PetSwitcherModal.js** — page-sheet pet picker
- **src/components/ActivePetTitle.js** — nav-bar headerTitle for pet-scoped screens
- **src/components/ActivePetChip.js** — nav-bar headerRight chip
- **src/lib/storage.js** — Pets storage layer (multi-pet via v2 array + legacy mirror)
- **src/lib/checklist.js** — generates breed/age/season-tailored checklist items
- **src/lib/petBreeds.js** — multi-breed helpers (getPetBreeds, getPrimaryBreed, mixedBreedLabel, isMixedBreed, shortBreedName, MAX_BREEDS=3)
- **src/lib/healthRecordTypes.js** — vaccine + preventative type catalog
- **src/lib/purchasesContext.js** — RevenueCat React Context (isPremium, offerings, refresh)
- **src/lib/founderOverride.js** — hardcoded IDFV allowlist
- **src/lib/analytics.js** — PostHog wrapper (init, screen, track) with privacy contract enforcement
- **src/lib/haptics.js** — six channels (tapLight, tapMedium, tapHeavy, notifySuccess, notifyWarning, notifyError) with On/Subtle/Off pref
- **src/lib/maps.js** — Apple Maps + Google Maps deep-link helpers for vet search
- **src/lib/photoPicker.js** — expo-image-picker wrapper that copies into documentDirectory (no camera roll write)
- **src/lib/pawgress.js** — Pawgress storage helper (just added in commit `5e1cc09`)
- **src/data/breeds.js** — 111 breed entries (78 dogs + 33 cats, alphabetized via runtime `sort(localeCompare)` with mixed/other pinned to bottom)
- **src/data/checklist.js** — checklist item templates
- **src/data/recalls.js** — bundled recall feed
- **src/data/emergencyProtocols.js** — poison hotlines + ER protocols
- **src/data/rulesOfThumb.js** — care reminders (per-pet)
- **src/data/healthRecordTypes.js** — Health Tracker schema

---

## How to start work in a new conversation

1. Read this file (you're doing it).
2. Read `OVERNIGHT_NOTES.md` for the latest autonomous-work context.
3. Read the relevant `docs/features/[feature].md` if working on a v1.3+ feature.
4. Read `docs/security-non-negotiables.md` if touching backend / auth / premium / admin paths.
5. `git checkout v1.2-work && git status` to confirm clean working tree.
6. Verify branch HEAD via `git log --oneline -1`.
7. Check `package.json` before running any `expo install` — most deps are present.
8. Apply the user's manifest. Commit each piece separately. Push after meaningful clusters.
9. Update OVERNIGHT_NOTES.md when you make autonomous decisions or hit blockers.

---

## Last known state (snapshot)

- v1.2-work HEAD: `5e1cc09` (Pawgress data layer)
- All commits pushed to `origin/v1.2-work`
- Working tree clean except `screenshots-app-store/` (intentionally untracked)
- Build 18 NOT YET TRIGGERED. Manifest still has Pawgress + Tummy Tracker pending.
- Conversation context: this is FloofLife 2 (the user is creating FloofLife 3 to continue beyond message limits). Paste this HANDOFF.md as initial context in the new conversation.

**Continuation prompt for FloofLife 3** (paste alongside the file):

> Picking up from FloofLife 2. v1.2-work HEAD is `5e1cc09`. We've shipped breeds catalog expansion (now 111 entries), brand-name compliance audit, multi-pet UX refinement, microchip Phase 1, empty-state polish, and gamification polish. Pawgress data layer landed (`src/lib/pawgress.js`); UI components, integration, modal, and streak counter still pending. Tummy Tracker entirely pending — full spec at `docs/features/tummy-tracker.md`. Hard rules in `HANDOFF.md`. Read `OVERNIGHT_NOTES.md` for state. Continue the v1.2.0 manifest autonomously per the user's most recent instructions. NO BUILD TRIGGER until manual smoke test approval.

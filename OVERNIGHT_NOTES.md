# Overnight Run — 2026-05-07 → 2026-05-08

Auto mode. Path B confirmed: all remaining manifest work goes on `v1.2-work`. Build 18 stays on `v1.1.2-work` with what was already committed (Parts 1.A–1.D + 1.F + memory updates).

---

# 🚀 v1.2.0 FINAL MANIFEST — locked 2026-05-08

Everything below this section is historical detail from the earlier overnight runs. This block is the authoritative wrap-up before build 18 trigger.

## What landed in v1.2.0

| Area | Summary |
|---|---|
| **Breed catalog** | 78 dog entries + 33 cat entries = **111 total breeds**, all with audit-quality content (about + healthSummary + 6-7 health bullets + references + grooming + exercise + checklist + tips). 31 breeds added net-new in v1.2 across overnight runs + manifest batches. |
| **Brand-name compliance** | Zero brand-name medications across entire breeds.js. All allergy-related bullets use "modern allergy medications — discuss with your vet whether oral medications, injectable options, or allergen-specific immunotherapy fit." Pimobendan kept as generic class name (Vetmedin parenthetical dropped). |
| **Pit-type breeds (3 entries)** | American Pit Bull Terrier, American Staffordshire Terrier, Staffordshire Bull Terrier — all with neutral framing per Apple-rejection-risk guardrails (no aggression/fighting/tough/guard-dog language; BSL implications mentioned only as practical owner considerations re housing + insurance + travel). |
| **Welfare-aware framing** | Munchkin cat added with the Scottish Fold pattern: honest about the chondrodysplasia welfare debate, citing ICatCare + RSPCA + BVA + GCCF + FIFe positions, balanced care guidance for current owners, "if you have one... if you're considering buying one..." closing. |
| **Multi-pet UX refinement** | Pet card name-as-button + EditPet flow (OnboardingScreen with editMode); pet-name nav title on ChecklistScreen + HealthTrackerScreen ("Falafel's Checklist"); active-pet chip in nav-bar top-right; PetSwitcherModal as the single switching mechanism (replaces whole-card tap). Single-pet households get plain title, no chip. |
| **My Floofs empty state** | Welcoming first-time-user UI with 140×140 paw icon, "Welcome to FloofLife" headline, value prop body, "Add your first floof" CTA → AddPet modal, privacy reassurance line. Replaces the prior dev-speak empty state. |
| **Microchip Phase 1** | New onboarding step + edit screen capturing microchipStatus (`confirmed` / `pending` / `none` / `unsure`) + microchipNumber (15-digit ISO 11784/11785). Existing pets soft-migrate to `microchipStatus: 'unsure'` via fallback default in editMode pre-fill. No alert integration in v1.x. |
| **Light gamification polish** | Smooth LayoutAnimation expand/collapse on About / Health / Tips / Sources / Origin Story cards; celebratory animation + notifySuccess haptic when ALL daily checklist items complete (de-duped per pet/date/itemcount); tapLight haptic on every tab switch. Zero new screens, zero new deps. |
| **v1.1.2-work merge** | 16 conflicts hand-resolved (RLS-style 3-way merges on YourPetsScreen, HomeScreen, OnboardingScreen, App.js, V1_REMOVED_FEATURES.md, package files). Caught and fixed a duplicate-toggleAbout-function bug from the auto-merge that would have silently broken mixed-breed sectionId state. |

## Commit log (v1.2-work since v1.1.2-work merge)

```
6120fa8 feat: light gamification polish — animations + celebration + tab haptics
8f56861 feat: microchip data capture in onboarding (Phase 1 — no alert integration)
41c7cc2 feat: My Floofs welcoming empty state with CTA
9a586c3 feat: Munchkin cat with welfare-aware framing (modeled on Scottish Fold)
14491bc feat: 3 pit-type breeds — APBT, AmStaff, Staffie (neutral framing)
fc1ff1f feat: 5 new breeds — Westie, Xoloitzcuintli, American Curl, Savannah, Selkirk Rex
d3e6c04 feat: 5 new dog breeds — Pekingese, Rhodesian Ridgeback, Scottish Terrier, Standard Schnauzer, Tibetan Mastiff
0d271fe feat: 5 new dog breeds — Bull Terrier, Cardigan Welsh Corgi, English Mastiff, Great Pyrenees, Jack Russell Terrier
ef09744 docs: update PRE-BUILD-18 checklist for multi-pet UX changes
6120fa8 ↑ + chip work above
39e483e feat: pet-name nav title + active-pet chip + switcher modal (multi-pet)
8ed4791 feat: pet card name-as-button affordance on My Floofs
27de1ee feat: add editMode to OnboardingScreen + EditPet route
9665f7d docs: pre-implementation note for multi-pet UX refinement
95f4a05 docs: add Microchip integration roadmap (v1.3 → v2.5+)
acc58c4 audit: brand-name guardrail compliance for 6 out-of-scope breeds
666f60a docs: add PRE-BUILD-18 manual checklist to OVERNIGHT_NOTES
145a2e0 audit: H1-H3 brand-name guardrail compliance + visual-verification static pass
d6a256f docs: update OVERNIGHT_NOTES with merge resolution log
0a7b215 Merge v1.1.2-work into v1.2-work
```

(Also on `main`: `b1b5668 docs: add security non-negotiables for backend work` — reference doc for the post-v1.2.0 backend buildout.)

## Pre-Build-18 manual verification

The full smoke-test list is below in the existing "PRE-BUILD-18 MANUAL CHECKLIST" section (already updated for the multi-pet UX changes). For v1.2.0 specifically also test:

**v1.2.0 NEW additions to verify (run AFTER the existing 10-section checklist)**:

11. **Microchip step in onboarding (NEW step 4)**
    - [ ] Onboarding step 4: "Does [name] have a microchip?" appears between photo and details
    - [ ] Tapping "Yes — chip number is…" reveals an inline numeric text input
    - [ ] All four options select cleanly; only one can be selected at a time
    - [ ] Footer hint about shelters/breeders chipping pets shows
    - [ ] "Next" advances to step 5 (age + weight)
    - [ ] "Back" returns to step 3 (photo)
    - [ ] Microchip data persists on the pet record after finish

12. **Edit pet via name-tap on My Floofs**
    - [ ] Tap pet's NAME (with pencil icon) on My Floofs → EditPet modal opens
    - [ ] All fields pre-filled with existing values, including microchip
    - [ ] Microchip status options reflect the saved status
    - [ ] "Save changes" updates the pet record (verify by reopening edit)
    - [ ] "Cancel" closes without saving

13. **My Floofs empty state**
    - [ ] (Best tested on a fresh install) When no pets exist: empty state shows paw icon, "Welcome to FloofLife", value prop, "Add your first floof" CTA, and privacy reassurance
    - [ ] Tap CTA → AddPet onboarding modal opens

14. **Light gamification polish**
    - [ ] About / Health Considerations / Tips / Sources / Origin Story cards expand and collapse SMOOTHLY (not snap)
    - [ ] Tab switches (Checklist / Home / My Floofs) fire a light haptic on physical device
    - [ ] Complete ALL items on the Checklist for one pet → celebration overlay appears with 🎉 emoji + "[Name] is set for today" + notifySuccess haptic
    - [ ] Re-toggling the last item doesn't re-fire the celebration
    - [ ] Switching to a different pet whose checklist isn't complete shows no celebration

15. **New breed entries**
    - [ ] In the breed picker, scroll to verify alphabetical order: Akita, Aussiedoodle, Australian Cattle Dog, Australian Shepherd, ... continues alphabetically through the new entries (Bull Terrier, Cardigan Welsh Corgi, English Mastiff, Great Pyrenees, Jack Russell Terrier, Pekingese, Rhodesian Ridgeback, Scottish Terrier, Standard Schnauzer, Tibetan Mastiff, West Highland White Terrier, Xoloitzcuintli) ... up to "Mixed" / "Other dog" pinned at the bottom
    - [ ] Pit-type breeds (American Pit Bull Terrier, American Staffordshire Terrier, Staffordshire Bull Terrier) appear in alphabetical order at the start
    - [ ] Munchkin cat appears in alphabetical position in the cat picker
    - [ ] Sample 3-4 new breed entries on the My Floofs card to confirm About + Health Considerations render correctly

## App Store Connect privacy disclosure check (BEFORE build 18 submission)

The microchip number is **User Content** under Apple's privacy taxonomy. Verify before submission:

- [ ] **App Store Connect → My Apps → FloofLife → App Privacy** → "User Content" category includes "App Functionality" use case. Microchip number falls under this — same as pet name, breed, photo, notes — already declared for v1.0.
- [ ] **No new privacy categories required** — microchip data does NOT cross any new category boundary (it's not health/fitness, location, contacts, search history, etc.).
- [ ] **Privacy Policy** at `bassklaft.github.io/floof-life/legal/privacy-policy.html` already covers User Content broadly. **Recommended addition** for clarity (low priority for v1.2.0, can wait for v1.3+ when microchip Phase 2 lost-pet workflow lands): a single line in the User Content section explicitly listing "microchip number" alongside "pet name", "photos", "notes". Doesn't change disclosure scope, just improves transparency.
- [ ] **PrivacyInfo.xcprivacy** manifest: doesn't need updating for v1.2.0 since no new APIs accessed.
- [ ] **Apple's stricter ATT-tracking rules** don't apply — microchip number is user-entered local data, never used for tracking.

## Apple review risk assessment (v1.2.0)

| Guideline | Assessment | Mitigation |
|---|---|---|
| **1.4.1 (Safety – Medical)** | LOW for v1.2.0. All health content is editorial summary with vet-discussion framing; no diagnosis claims, no drug doses, no brand-name medications. | Existing standard: "may be predisposed", per-bullet "discuss with your vet", ZERO brand-name meds in catalog. |
| **3.1.1 (In-app Purchase)** | LOW. Premium gating via RevenueCat unchanged from v1.1. | Existing flow. |
| **4.0 (Design)** | LOW. New UI is consistent with existing patterns; tab haptic + smooth animations are standard polish. | No new third-party SDK; no design-pattern departures. |
| **5.1.1 (Privacy)** | LOW. Microchip number is User Content (already declared). All data stays on device for v1.x. Permission strings (camera, photo library, location) unchanged. | Verify App Privacy categories cover microchip number per checklist above. |
| **5.1.2 (Privacy – Tracking)** | LOW. No new tracking. PostHog still anonymous-by-default with the privacy contract enforced. | No change. |
| **Pit-type breed framing rejection risk** | LOW. APBT / AmStaff / Staffie entries use AKC/UKC sourcing, neutral language, no aggression or fighting references, BSL framed as practical owner consideration only. | Reviewed against the user's framing rules at writing time. |
| **Munchkin welfare framing rejection risk** | LOW. Same Scottish Fold pattern that already shipped in v1.1; cites veterinary welfare orgs neutrally. | Reviewed against the existing Scottish Fold framing model. |

**Overall v1.2.0 review risk: LOW.** Largest content additions (31 new breeds, microchip step, multi-pet UX refinement) all build on existing patterns that have already passed review.

## Marketing content brief for v1.2.0 launch

3-5 highlights for App Store "What's New", press, social. Lead with what users feel; specifics in second tier.

1. **30+ new breeds, fully audit-format.** Including pit-type breeds with neutral framing, the welfare-aware Munchkin entry, ancient breeds (Xoloitzcuintli, Tibetan Mastiff), and a wave of mid-popularity dogs (Bull Terrier, Westie, Scottie, Jack Russell, etc.). Now 111 breed entries with peer-reviewed sourcing.

2. **Better multi-pet flow.** Pet name is now the obvious tap target — tap to edit. Active-pet switching lives in a small avatar chip in the nav bar of pet-scoped screens. Pet-name nav titles ("Falafel's Checklist") give scope context per iOS HIG.

3. **Microchip data capture.** New onboarding step asks for chip status with four options (Yes-with-number / Yes-ask-later / No / Unsure). Useful immediately for vet visits, boarding, lost-pet situations. (Lost-pet workflow + alert integration coming in future versions.)

4. **Polish that adds up.** Smooth expand/collapse animations on every breed card. Celebratory haptic when you complete the day's checklist. Light tap on every tab switch. Welcoming empty state for first-time users.

5. **Honest content edits.** Brand-name medications (Apoquel, Cytopoint, etc.) replaced across 9 breed entries with the medication CLASS — owners get the same medical understanding without inadvertently endorsing specific products.

**App Store "What's New" copy (~150 chars)**:
> v1.2: 30+ new breeds (including pit-type with neutral framing + Munchkin with welfare-aware copy), smoother multi-pet UX, microchip onboarding, polish.

**Tone**: confident but not boastful. Specific (numbers, named features). No emoji in the title bar. Saves emoji for the in-app celebration moments.

---



## Branch hygiene done

- `v1.1.2-work` had `b4f680c` (Part 1.G schema + UI) which Path B says shouldn't ship in build 18. Reverted via `d0eae9b` and pushed to origin.
- All Part 1.G / 1.E / 2.H / 2.I / 3.J work now lives on `v1.2-work`.

## Branches at start of run

- `v1.1.2-work` — `d0eae9b` (revert). Ready for build 18 on your approval.
- `v1.2-work` — `8dd3ab2` (breed-health audit batch 5). Starting point for Path B work.

## ⚠ Plan revision mid-run — Path C (combined v1.2.0 release)

You sent a new directive mid-run: ship everything as v1.2.0, no separate v1.1.2 patch. Merge v1.1.2-work into v1.2-work, all further work on v1.2-work, and apply language + rejection-risk guardrails across all content.

I started the merge. **It conflicts in 8 files** (breeds.js, checklist.js, founderOverride.js, purchasesContext.js, ChecklistScreen.js, EmergencyScreen.js, HomeScreen.js, OnboardingScreen.js, PremiumScreen.js, SettingsScreen.js, YourPetsScreen.js). The conflicts are real structural divergences — each branch has features the other doesn't, and the YourPetsScreen.js conflict in particular needs a careful 3-way reconciliation:

- v1.2-work has: mixed-breed `breedKeys.map` iteration, `HealthTrackerRow` component, sectionId-keyed health collapse, the new About + Health Considerations top-level split.
- v1.1.2-work has: active pet switcher (`activatePet`, `activeId` state), pet-id-keyed collapsibles for tips/sources/origin story, haptics integration, analytics events.

Both sets of changes need to land in the merged version. **I aborted the merge to avoid producing a half-broken result overnight.** Hand-resolving 8 conflicts at quality is 1-2 hours of careful focus that's better done with a clear head than under autonomous-overnight pressure.

**Recommended morning sequence:**
1. Merge v1.1.2-work → v1.2-work with the user (or me) doing manual resolution per file. Most files have a clear answer (take v1.1.2-work for SettingsScreen, EmergencyScreen, founderOverride, purchasesContext, checklist; take v1.2-work for breeds.js). YourPetsScreen needs the careful 3-way merge.
2. Then `npm install posthog-react-native expo-haptics` if needed (they're in v1.1.2-work's package.json, will land via the merge).
3. Then continue with remaining manifest work.

**What I continued with overnight (independent of the merge):**
- More breed expansion on v1.2-work (Part 2.H/2.I)
- Emoji research write-up (Part 3.J)
- Both can land cleanly without the merge being resolved.

## Schema migration concern (from new manifest)

You asked for a migration layer for existing user pets so old breed data structure continues working. Status: **already handled** by the backward-compat fallback I built into the v1.2-work UI — the breed card reads `breed.about ?? breed.summary`. Users with existing pet data don't have the new schema on individual pet records (the schema change is on the breed reference data in `src/data/breeds.js`, which is bundled with the app). Pets reference breeds by key string only; the `breed` key hasn't changed. So existing pet records continue working. Tested mentally: a v1.0/v1.1 user updating to v1.2 will see About cards rendered from the new `about` field if present, else the existing `summary` — no broken state.

## Live status

✅ **Part 1.G schema + UI** on v1.2-work (commit `383f1c9`).
   - YourPetsScreen restructured: each breed now renders TWO top-level cards (About defaults expanded, Health Considerations defaults collapsed).
   - Schema additions: `breed.about` (warm narrative), `breed.healthSummary` (one-line opener for Health Considerations card). Existing `summary` and `health` preserved as backward-compat fallbacks.
   - Mixed-breed pets get About + Health Considerations card pair per contributing breed via `breedKeys.map`.

✅ **Part 1.G + 1.E content split — ALL 57 ENTRIES** done (commits `d5a6ce4`, `4eec983`, `f1d1053`, `927191d`, `05a1dea`).
   - 31 named dog breeds split with about + healthSummary + tone pass
   - 14 named cat breeds + 2 domestic types split
   - 10 designer mixes split (with bundled Part 1.D biology fixes for Bernedoodle / Cavapoo / Puggle)

   Each `about` follows the codified content principle: warm narrative + breed-specific origin + personality + best environments + soft health-flavor close pointing to Health Considerations. Specific historical anchors per breed (Newfoundland fishermen, Lord Tweedmouth, Captain von Stephanitz, Ann Baker's Ragdolls, Wong Mau → American Burmese, Sherry Rupke → Bernedoodle, etc.). Tone is warm but not childish; breed name used often; medical detail kept for the Health Considerations card.

⏳ **In progress:** Part 2.H + 2.I — breed expansion in alphabetical batches.

## Remaining manifest

- **Part 2.H** — Dog breed expansion. Target 15-20 high-priority new breeds in this session at audit-quality format.
- **Part 2.I** — Cat breed expansion. Target 8-10 high-priority new breeds in this session.
- **Part 3.J** — Emoji research write-up only.

## Hard rules I'm respecting

1. NO `eas build` commands.
2. NO major dependency installs.
3. NO destructive git ops.
4. STOP and write a blocker note here if I hit a genuine ambiguity that affects 30+ breeds.

## Blockers / decisions made autonomously

**Schema decision**: Added `about` and `healthSummary` as new optional keys, kept existing `summary` field for backward compatibility. UI prefers `about` if present, falls back to `summary`. Future cleanup pass can remove `summary` from breeds that have `about`, but this is non-urgent and lets v1.2-work be merged into v1.1.x branches without breaking anything.

**Alphabetical sort deferred**: User asked for breed pickers to be sorted alphabetically. The picker arrays (`dogBreeds`, `catBreeds`) are exported from `src/data/breeds.js` separately from the `breedFacts` map. The sort can happen at any time without affecting the new breed entries; it's a small mechanical change that's better done after all entries are in place. Will tackle in a separate commit before end of run.

**Cat coat patterns (Tabby/Tortoiseshell/Calico)**: Already addressed via Part 1.F coat-pattern hint chip on `v1.1.2-work` — search aliases would only matter if the breed picker had a search input (it doesn't yet). The hint chip routes users to Domestic Shorthair / Mixed Cat. No further action needed for v1.2-work; the same chip will land here when v1.1.2 work is merged.

## Commits made this session

On `v1.1.2-work`:
- `d0eae9b` — Revert "feat: Part 1.G schema + UI..." (rollback per Path B)

On `v1.2-work`:
- `383f1c9` — feat: Part 1.G schema + UI on v1.2-work — split breed card into About + Health Considerations (multi-breed)
- `d5a6ce4` — content: Part 1.G + 1.E — about/healthSummary split for top 8 popularity dogs (batch 1)
- `4eec983` — content: Part 1.G + 1.E — about/healthSummary split for working/herding/large dogs (batch 2)
- `f1d1053` — content: Part 1.G + 1.E — about/healthSummary split for remaining 11 dogs (batch 3)
- `927191d` — content: Part 1.G + 1.E — about/healthSummary split for cats (batch 4)
- `05a1dea` — content: Part 1.G + 1.E + 1.D — about/healthSummary split for all 10 designer mixes (batch 5)
- (H1-H3 commits) — Part 2.H batches: 15 new dogs (Pug, Chihuahua, Bichon Frise, Maltese, Whippet, Vizsla, Weimaraner, Greyhound, Italian Greyhound, Bloodhound, Akita, Shiba Inu, Shar-Pei, Belgian Malinois, Bullmastiff)
- `346105f` — Part 2.I batch I1: 8 new cats (Birman, Himalayan, Cornish Rex, Siberian, Tonkinese, Exotic Shorthair, Manx, Oriental Shorthair) with v1.2.0 language guardrails
- `ca97626` — Part 3.J: breed imagery options write-up at `docs/research/breed-imagery-options.md` (Option D recommended, 4 decisions for user)
- `fcb00d2` — Part 2.H batch H4: 5 more new dogs (Basset Hound, Newfoundland, Saint Bernard, Samoyed, Australian Cattle Dog) + restored missing "mixed cat" entry key (was causing esbuild parse failure)
- `12df4e3` — Part 2.I batch I2: 3 more new cats (Turkish Angora, Snowshoe, Egyptian Mau)

## End-of-run state

Branch HEADs:
- `v1.1.2-work` — `d0eae9b` (revert). Untouched from start of run; ready for build 18 on user approval.
- `v1.2-work` — `12df4e3`. Pushed to origin. Working tree clean except `screenshots-app-store/` untracked.

New-breeds total: **31** (20 dogs + 11 cats) — cleared the 30-50 lower-bound target for v1.2.0.

All v1.2-work content additions in batches H4 / I1 / I2 follow Path C language guardrails: no brand-name medications, "may be predisposed" hedging, per-bullet "discuss with your vet" framing.

## Morning merge — DONE (2026-05-08)

Hand-resolved merge of v1.1.2-work into v1.2-work. Commit `0a7b215`, pushed to origin. v1.2-work HEAD is now `0a7b215`.

Final conflict count: **16** (14 content + 2 add/add) — actual count was higher than the 8 estimated overnight, because (a) App.js, V1_REMOVED_FEATURES.md, V2_CHANGELOG.md, package.json, package-lock.json all conflicted too, and (b) ChecklistScreen / HomeScreen / OnboardingScreen / PremiumScreen each had their own real conflicts not just YourPetsScreen.

Resolution map (all 16):

**Take v1.2-work (ours)** — 2 files:
- `src/data/breeds.js` (rich audit + 31 new breeds + About/Health schema lives here)
- `V2_CHANGELOG.md` (add/add — slightly more polished phrasing)

**Take v1.1.2-work (theirs)** — 7 files:
- `src/screens/SettingsScreen.js`, `EmergencyScreen.js`, `ChecklistScreen.js`, `PremiumScreen.js`
- `src/lib/founderOverride.js` (add/add), `purchasesContext.js`, `checklist.js`

**Real 3-way merges** — 7 files:
- `App.js` — kept HealthTracker/AddHealthRecord routes + DogAge title rename (ours); harmless to drop v1.1.2's "Age in Human Years" since route + title both modernized on v1.2-work.
- `V1_REMOVED_FEATURES.md` — merged 3 documentation blocks; both branches added different roadmap sections to the same file. Kept all of them (v1.2 polish, v1.3 health-logging-expansion, v1.1.1/v1.1.2 patch backlog, paywall placement).
- `package.json` — kept all three new deps (expo-document-picker, expo-file-system, expo-haptics) alphabetically.
- `package-lock.json` — regenerated via `npm install --package-lock-only --ignore-scripts`.
- `HomeScreen.js` — load() combines per-pet ChecklistState (theirs) + healthRecords load (ours); breed lookup uses ours' multi-breed-aware getPrimaryBreed/breedDisplay; hero wraps in theirs' multi-pet TouchableOpacity switcher but uses ours' breedDisplay for breed label.
- `OnboardingScreen.js` — kept theirs' cat-coat-pattern hint Alert but converted `setBreed("...")` → `setSelectedBreeds(["..."])` to fit ours' multi-breed model. Kept ours' showMixDetails. Both style sets preserved.
- `YourPetsScreen.js` — most complex. Kept ours' HealthTrackerRow + breedKeys.map per-breed iteration + About/Health Considerations split + sectionId keying (`${pet.id}:${breedKey}`). Layered in theirs' active pet switcher (CardWrapper/activeBadge/eldestBadge/tapHint/activatePet) + inner collapsibles (Origin Story / Sources / Tips) — all re-keyed from pet.id to sectionId so mixed-breed pets get independent state per breed. Kept theirs' "X things only Y owners know" tease title format. Kept theirs' analytics tracking + haptics. **Caught + fixed bug**: auto-merge produced two `toggleAbout` function declarations with the same name (`toggleAbout(sectionId)` from ours and `toggleAbout(petId)` from theirs); the second hoists and silently overrides the first. Consolidated into one sectionId-keyed `toggleAbout` that has both the default-expanded behavior (ours) AND analytics + haptics (theirs). Same treatment for `toggleHealth`. Added a generic `toggleSubSection(setter, sectionId, eventName)` helper for the inner collapsibles.

esbuild parse-clean across all 12 affected JS/JSX files. No leftover conflict markers anywhere in the tree.

## Pre-existing open items (still open)

1. **Audit existing Part 2.H batches H1-H3 for guardrail compliance**: The 15 dogs added in H1-H3 (Pug through Bullmastiff) were written before the Path C guardrails arrived mid-run. Some entries may reference brand-name medications (Apoquel, Cytopoint, Vetmedin, etc.) that should be replaced with generic class names per Path C. Quick grep + edit pass needed.

2. **Pit-bull-type breeds**: American Pit Bull Terrier and American Staffordshire Terrier still pending — explicitly flagged for neutral framing per Path C rejection-risk guardrails. Best done with a clear head and a careful review of the framing language before committing.

3. **Optional further breed expansion**: User mentioned potential candidates including American Curl, Munchkin, Savannah, Selkirk Rex (cats); and Basset Hound (done), Cardigan Welsh Corgi, Pekingese, Mastiff (English), Tibetan Mastiff, Great Pyrenees, Westie, Scottish Terrier, Jack Russell Terrier, Rhodesian Ridgeback, Standard Schnauzer, Bull Terrier (dogs). Not blocking; v1.2.0 already has substantial expansion.

4. **Munchkin**: Welfare-contested breed (achondroplasia-like dwarfism). Per Path C tone, deserve careful neutral framing similar to pit-bull-type breeds — let user keep it or skip. Did NOT add overnight to avoid a poorly-framed entry going in unreviewed.

5. **Visual verification of the merged UI**: the merge is parse-clean but no simulator pass has happened. Recommend running the app once before triggering a build to confirm:
   - Multi-pet card switcher behaves correctly on My Floofs
   - Mixed-breed pets show independent About/Health state per contributing breed
   - Origin Story + Sources collapsibles work inside each About card
   - Tips card collapsible header reads correctly
   - Active pet ✓ ACTIVE / 👑 ELDEST badges render

## Visual verification pass — 2026-05-08

**Constraint**: no iOS simulator runtime is installed on this dev machine (already noted in V1_REMOVED_FEATURES.md). Installing one (~6-7 GB Xcode runtime) requires user approval and a meaningful disk hit. `expo start --web` doesn't work either — adding `react-dom` + `react-native-web` would be a non-trivial dep install I shouldn't make autonomously.

What was verified — **static analysis only**:

✅ **esbuild parse-clean** across 12 affected JS/JSX files (App.js, all 5 merged screens, breeds.js, all 3 merged lib files).

✅ **No leftover conflict markers** anywhere in the tree.

✅ **No stale references** in OnboardingScreen.js — zero remaining `setBreed(...)` / `pet.breed` / `isMixed` references (the merge correctly purged all v1.1.2 single-breed code paths in favor of v1.2-work's `selectedBreeds[]` / `showMixDetails` model).

✅ **No stale references** in HomeScreen.js — zero remaining `titleCase(pet.breed)` references; all replaced with multi-breed-aware `breedDisplay`.

✅ **YourPetsScreen.js mental traces**:
   - Single-breed: `getPetBreeds(falafel)` returns `["chow chow"]`; `breedKeys.map` runs once; `sectionId = "p_falafel:chow chow"`; `aboutOpen[sectionId] ?? true` → expanded; `healthOpen[sectionId]` → undefined → collapsed. ✓
   - Mixed-breed: `getPetBreeds(labradoodle)` returns `["labrador retriever", "poodle"]`; `breedKeys.map` runs twice; sectionIds are `"p_dood:labrador retriever"` and `"p_dood:poodle"`; each card has independent state. ✓
   - Active pet switcher: tap card → `activatePet(pet.id)` → `Pets.setActive(petId)` AsyncStorage write + `setActiveId(petId)` + navigate to Home. State `aboutOpen[sectionId]` keyed by `${pet.id}:${breedKey}` so pet A and pet B never share state. ✓

✅ **founderOverride.js**: contains `981F7B5B-46DF-4B89-AF5D-49B812EB939D` at line 41 of `FOUNDER_DEVICE_IDS`. `isFounderDevice()` returns true for that IDFV.

✅ **SettingsScreen.js**: `PRIVACY_URL` → `https://bassklaft.github.io/floof-life/legal/privacy-policy.html`, `TERMS_URL` → `https://bassklaft.github.io/floof-life/legal/terms-of-service.html`. Both wired through `Linking.openURL` (lines 160-161). Send Feedback composes a `mailto:` with diagnostics (lines 40-69), wired through `Linking.canOpenURL` + `Linking.openURL`.

✅ **haptics.js**: comments explicitly state "All calls are silent no-ops on platforms / devices where haptics aren't supported." Won't error in simulator.

✅ **analytics.js**: `initAnalytics()` is a no-op when `EXPO_PUBLIC_POSTHOG_KEY` is missing; helpers guard against uninitialized client. Won't error in dev builds.

What was NOT verified — **explicit gaps requiring a real device or simulator runtime**:

❌ Pixel-level rendering of the merged YourPetsScreen.js card — no visual confirmation that `breedSectionHd` + mixed-breed section labels render where intended.

❌ Active pet switcher animation (TouchableOpacity activeOpacity=0.9 feel).

❌ Haptic feedback firing on toggles (won't fire in simulator anyway).

❌ Real RevenueCat offering fetch (PremiumScreen depends on live App Store Connect + RevenueCat dashboard state).

❌ Real WeatherKit / location-permission flows on RiskScreen.

❌ Real Apple Mail composer rendering for Send Feedback.

❌ Onboarding flow on a fresh install with empty AsyncStorage.

**Recommendation**: trust the static analysis enough to move forward with the H1-H3 audit (which I've now also done — see below). Do the visual pass on the next physical-device build (build 18 candidate) before TestFlight upload. The merge is mechanical and parse-clean — pixel regression risk is low — but irreplaceable until someone runs the app.

### PRE-BUILD-18 MANUAL CHECKLIST

Walk through this on the physical device after build 18 lands in TestFlight, before submitting to App Review. Each item is a 30-60 second smoke test. If anything fails, fix and re-build before submission.

**1. Onboarding (fresh install — clear app data first or install on a clean test device)**
- [ ] App launches without crash
- [ ] Onboarding step 1: Name + species selection works; "Next" enabled when name entered
- [ ] Onboarding step 2: breed picker — single-breed dog selection works; chip toggles selected/unselected; Maximum-of-3-breeds enforced when picking 4th
- [ ] **Cat-coat-pattern hint**: switch species to cat → tap "Tabby, Tortoiseshell, or Calico?" hint → confirm Alert appears with 3 options → "Use Domestic Shorthair" pre-selects domestic shorthair → "Use Mixed Cat" pre-selects mixed cat → both work
- [ ] Onboarding step 3: photo picker opens; "Skip for now" works
- [ ] Onboarding step 4: age + weight inputs accept decimals; finish creates pet successfully; redirects to Home

**2. Single-breed dog (Falafel = Chow Chow, your primary test pet)**
- [ ] My Floofs tab → Falafel's card renders with photo, name, breed, age
- [ ] **About card defaults expanded** — visible immediately when opening the card
- [ ] **Health Considerations card defaults collapsed** — only the header visible; tap to expand → all 6-7 health bullets render
- [ ] Tap About card header → collapses; tap again → re-expands. State persists when scrolling.
- [ ] Inside About card (when expanded): Origin Story + Sources are collapsible sub-sections; tap each → expands inline; tap again → collapses
- [ ] Tips card: collapsed by default; header reads "💡 Insider Tips · X things only Chow Chow owners know"; tap → expands

**3. Mixed-breed dog (test by adding a hypothetical Goldendoodle pet via "Add another pet")**
- [ ] Add another floof → onboarding → pick "Labrador Retriever" + "Poodle" (or any 2 breeds — "Goldendoodle" itself is a valid single breed in our catalog, so for true mixed-breed testing pick TWO different ones)
- [ ] My Floofs tab → 2 pets visible
- [ ] On the mixed-breed card: TWO separate About cards render (one per breed), TWO separate Health Considerations cards
- [ ] Each About card has its own breed-section header (small label with emoji + breed name)
- [ ] **Independent state**: expand About on breed 1, collapse About on breed 2 → confirm they're independent (toggling breed 1 doesn't toggle breed 2)
- [ ] Same independence on Health Considerations and Tips

**4. Multi-pet UX refinement (multi-pet only — UPDATED for v1.2.0)**

The whole-card tap on My Floofs was REMOVED. Active-pet switching now lives on the nav-bar of pet-scoped screens via a chip + tappable title. The pet card name is the dedicated tap target for editing.

- [ ] My Floofs tab with 2+ pets: cards do NOT show a "Tap card to make active" hint anymore (whole-card tap removed)
- [ ] Currently active pet still shows "✓ ACTIVE" badge + green border
- [ ] Eldest pet still shows "👑 ELDEST" badge
- [ ] Tap anywhere on the card body (NOT name, NOT photo) → nothing happens (informational only)
- [ ] **Tap pet NAME** (with pencil icon next to it) → EditPet modal opens pre-filled with the pet's data → change something → "Save changes" → modal closes → My Floofs reflects the change
- [ ] Tap pet PHOTO → photo picker opens (existing single-purpose behavior preserved)
- [ ] Edit modal "Cancel" button → closes without saving
- [ ] **Checklist tab title shows "Falafel's Checklist"** in the nav bar (replaces the Logo on this tab); for multi-pet, title has a chevron-down + is tappable to open the switcher modal
- [ ] **Checklist tab nav-bar top-right**: small avatar + first-name chip (multi-pet only); tap → switcher modal opens
- [ ] **Health Tracker title shows "Falafel's Health Tracker"** in the nav bar; same chevron + chip pattern as Checklist
- [ ] Switcher modal: page-sheet shows all pets with avatars; active pet has accent-colored border + "ACTIVE" pill; tap a non-active pet → modal closes → all pet-scoped screens reflect the new active pet
- [ ] Switching from pet A to pet B updates: ChecklistScreen content (checks, items), HealthTrackerScreen content (records), HomeScreen hero photo, and the chip itself
- [ ] **Single-pet households**: NO chip in nav bar, title is plain text (no chevron, not tappable)
- [ ] Per-pet checklist state: switch from pet A to pet B → confirm pet B's checklist reflects pet B's checks, not pet A's (Falafel's "brushed teeth" check should NOT appear on a different pet's checklist)

**5. Premium screen + founder override**
- [ ] Settings → Premium → Premium screen opens as modal
- [ ] On Max's iPhone (IDFV `981F7B5B-46DF-4B89-AF5D-49B812EB939D`): screen shows premium-active state — annual + monthly cards both render but the purchase CTA is replaced or grayed appropriately (founder override active)
- [ ] On a non-founder device: both annual and monthly cards are tappable; selected card highlighted; purchase button enabled

**6. Settings — Privacy / Terms / Feedback**
- [ ] Settings tab → tap "Privacy policy" → Safari opens to `bassklaft.github.io/floof-life/legal/privacy-policy.html` and the page loads
- [ ] Settings tab → tap "Terms of service" → Safari opens to `bassklaft.github.io/floof-life/legal/terms-of-service.html` and the page loads
- [ ] Settings tab → tap "Send feedback" → iOS Mail composer opens with prefilled subject "FloofLife Feedback" + body containing app version + iOS version + pet count
- [ ] Settings tab → tap "Haptic feedback" row → toggles On / Subtle / Off; subsequent taps in the app use the new haptic preference

**7. Haptics (physical device only)**
- [ ] Setting Haptic feedback to "On" → tapping any About/Health/Tips toggle fires a light tap haptic
- [ ] Setting Haptic feedback to "Subtle" → only light + success haptics fire; medium/heavy collapse to light
- [ ] Setting Haptic feedback to "Off" → no haptics anywhere

**8. Analytics (verify in PostHog dashboard, not just console)**
- [ ] Open PostHog dashboard → Live Events → confirm the test session shows: `app_opened`, `screen_viewed`, `about_breed_expanded`, `health_considerations_expanded`, `origin_story_expanded`, `sources_expanded`, `insider_tips_expanded`, `active_pet_switched`, `pet_photo_picked`, `pet_edit_opened`, `pet_edited` (NEW in v1.2.0)
- [ ] `active_pet_switched` events include a `source` property: `checklist_switcher` or `health_tracker_switcher` (NEW in v1.2.0)
- [ ] No PII leakage: confirm none of the events contain `pet.name`, breed-key strings (only `species: "dog"|"cat"`), or photo URIs

**9. Health Tracker (v1.2 feature — confirm it landed in the merge)**
- [ ] My Floofs → tap a pet → "Health Tracker" row visible
- [ ] Tap → opens Health Tracker screen for that pet
- [ ] "Add health record" works; record persists across app restart

**10. Critical regression checks (anything that was already working should still work)**
- [ ] Toxic Foods & Plants screen renders
- [ ] Recalls screen renders + items link to FDA pages
- [ ] Vets Near Me opens Maps
- [ ] Risk Map renders + location permission handles correctly
- [ ] Emergency Resources screen renders + poison-control hotline numbers tap-to-call
- [ ] Diet & Care screen renders
- [ ] Training Exercises screen renders
- [ ] Trip Planning screen renders
- [ ] Age Calculator (DogAge route) renders + gives a multi-factor result for Falafel

**Pass criteria**: all 10 sections green. If any item fails, do NOT submit build 18 — fix and rebuild first.

---

## H1-H3 brand-name audit — 2026-05-08

Per Path C language guardrails, brand-name medications must be replaced with medication CLASS or treatment APPROACH. Scope per task: H1-H3 batches (Pug → Bullmastiff). Revision pattern applied: drop the brand entirely, replace with class/approach, close with vet-discussion framing, never imply specific recommendation.

### Findings — IN SCOPE (H1-H3)

Only **Bichon Frise** had brand-name violations across all 15 H1-H3 dog entries. 3 occurrences total:

| Location | Section | Brand mentioned | Fix |
|---|---|---|---|
| Line 1303 | health bullet | Apoquel/Cytopoint | "Modern allergy medications have transformed quality of life for the breed — discuss with your vet whether oral medications, injectable options, or allergen-specific immunotherapy might fit your Bichon." |
| Line 1314 | checklist tip (`why` field) | Apoquel/Cytopoint | "early intervention with oral medications, injectable options, or allergen-specific immunotherapy keeps quality of life high. Discuss approach with your vet." |
| Line 1320 | tips section | Apoquel, Cytopoint | "Modern allergy medications have transformed quality of life for the breed — talk to your vet about whether oral medications, injectable options, or allergen-specific immunotherapy might fit your dog." |

**Status**: all 3 fixed and committed. Bichon Frise entry verified brand-name clean. breeds.js parses.

The other 14 H1-H3 dog entries (Pug, Chihuahua, Maltese, Whippet, Vizsla, Weimaraner, Greyhound, Italian Greyhound, Bloodhound, Akita, Shiba Inu, Shar-Pei, Belgian Malinois, Bullmastiff) had ZERO brand-name violations — all were written brand-name-clean during the H1-H3 batch even before Path C guardrails arrived mid-overnight. Good news.

### Findings — OUT OF SCOPE (other breeds with brand-name violations)

These 6 entries also have brand names but are out of the H1-H3 audit scope. Flagging for the next audit pass:

| Line | Breed | Section | Brand mentioned |
|---|---|---|---|
| 26 | Labrador Retriever | health bullet | Apoquel/Cytopoint |
| 65 | French Bulldog | health bullet | Apoquel/Cytopoint |
| 580 | Cavalier King Charles Spaniel | health bullet (long-form) | Pimobendan (Vetmedin) — note: Pimobendan is the generic name, Vetmedin the brand. Could be revised to drop the brand-name parenthetical and keep the generic. |
| 619 | Doberman Pinscher | health bullet | Pimobendan (Vetmedin) — same generic-vs-brand pattern. |
| 763 | Shih Tzu | health bullet | Apoquel |
| 1146 | Brittany | health bullet | Apoquel |

**Recommendation**: do these 6 in a separate audit pass before v1.2.0 ships. The Pimobendan/Vetmedin pattern is borderline — Pimobendan is the generic class, Vetmedin the brand — but per Path C the brand parenthetical should still drop. Estimate: 30-45 minutes of focused work.

### Future feature (NOT in scope, just documenting the idea)

**My Vet contact integration** — the vet-discussion framing across the app would be more actionable if Settings had a saved "My Vet" profile (name, phone, email) and every "discuss with your vet" prompt had a one-tap "Call your vet" / "Email your vet" button.

- **Settings → My Vet**: form with vet practice name, phone, email, address, after-hours emergency contact.
- **Per vet-discussion prompt**: a small "Call your vet" / "Email your vet" CTA when a saved vet exists; falls back to `Vets Near Me` when none saved.
- **Email pre-fill**: when emailing the vet from a Tummy Tracker / Tick log / Seizure log thread, auto-attach the relevant log export as a vet-friendly summary.
- **Multi-vet support**: a household with a primary vet + an emergency vet + a specialist (cardiologist, ophthalmologist, behaviorist) should be able to save all three.
- **Schedule**: v1.4 or later. Probably groups well with the Tummy Tracker spec since both feed the same vet-handoff workflow.
- **Schema**: `pawrent_vets_v1` AsyncStorage key, shape `{ primary: VetContact, emergency?: VetContact, specialists?: VetContact[] }` where `VetContact = { name, phone, email, address, notes }`. Backend table `vets` FK'd to `auth.users`, RLS user-owns-own.

Just documenting — not building. Could be its own spec doc under `docs/features/my-vet-contact.md` if the user wants it formally specced.

---

## Multi-pet UX refinement — pre-implementation note (2026-05-08)

User asked for the percentage of active users with multiple pets before locking in #3 (active pet chip) sizing.

**PostHog credential gap**: only the public-write project key (`phc_kF5d...`) is in `.env`. Querying PostHog for an aggregate stat requires a personal API key (`phx_...`) which isn't stored locally. Cannot pull the number autonomously.

**Best-estimate from project state** (defaulting to <10% absent the real number):
- Multi-pet was disabled in v1.0 — only "Coming soon" stub on YourPetsScreen (per `V1_REMOVED_FEATURES.md` item c).
- Multi-pet flow shipped in v1.1 (build 16, just submitted to App Review).
- v1.1.1 added the active pet switcher (per V1_REMOVED v1.1.1 patch backlog) — also fresh.
- Active user base is small (early-stage solo founder app, no paid acquisition yet).
- US national pet ownership stats: ~38% have a dog, ~25% have a cat, but only ~14% have both species; multi-of-one-species is far less common in the user base age range we're targeting.
- TestFlight + early App Store users skew toward single-pet (most early adopters install for THEIR pet, not their household).

**Defaulting to <10%**, per the user's rule: treat the active-pet chip (#3) as a smaller component since most users won't see it. Single-pet UI must remain clean and uncluttered; multi-pet UI gets the chip in the nav-bar top-right with a small avatar + name format.

**To pull the actual number after v1.2.0 ships and we have telemetry**: in PostHog dashboard run an Insight with breakdown by `pet_count` distinct property (we can fire `pet_count` on `app_opened` events going forward — note this in the analytics events to fire). Until that telemetry exists, the <10% default stands.

**Fire a new analytics event** as part of this v1.2.0 implementation so we can pull the real number for v1.3 planning: `app_opened` should include `pet_count: int` (1, 2, 3+) so a future Insight can split active users by household size.

---

## Multi-pet UX refinement — implementation log

Three changes shipping together in v1.2.0 (per user's "implement all three together" directive — they share state and routing logic):

1. **Pet card name-as-button**: card body becomes informational; pet NAME wraps in TouchableOpacity with a chevron affordance. Tap → navigates to a pet-edit flow (using `OnboardingScreen` in editMode — pre-fills fields, calls `Pets.update()` on finish instead of `Pets.add()`). Photo tap → still changes photo (single-purpose tap target). Whole-card tap removed.

2. **Pet-name context header**: `ChecklistScreen`, `HomeScreen`, `HealthTrackerScreen` get the active pet's name in the navigation title (`"Falafel's Checklist"`). Single-pet: plain text title. Multi-pet: tappable title that opens the pet-switcher modal.

3. **Active pet chip** (small component per <10% multi-pet rule): top-right nav-bar slot, only renders for multi-pet households. Small avatar (24x24) + first-name. Tap opens the same pet-switcher modal as the title-tap. The chip is the new active-pet-switching mechanism (replaces the whole-card tap on My Floofs).

**Deferred to v1.3** (per user's explicit deferral): long-press on My Floofs tab → radial pet-switcher menu with haptic + slide-to-select. Requires `react-native-ios-context-menu` + EAS build to validate + ~3-4 hours focused work. Not v1.2.0 scope.

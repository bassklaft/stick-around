# Overnight Run — 2026-05-07 → 2026-05-08 (and ongoing through manifest closeouts)

This file is the running log for the v1.2.0 cycle. The active section is the **v1.2.0 FINAL MANIFEST** below. Everything in the **Appendix** at the bottom is condensed historical context (merge resolution, audit findings, autonomous decisions) preserved for reference but not load-bearing for build 18.

---

# 🚀 v1.2.0 FINAL MANIFEST — locked 2026-05-08

This is the authoritative wrap-up before build 18 trigger.

## What landed in v1.2.0

| Area | Summary |
|---|---|
| **Breed catalog** | 78 dog entries + 33 cat entries + 12 new in the late manifest (Bull Terrier, Cardigan Welsh Corgi, English Mastiff, Great Pyrenees, Jack Russell Terrier, Pekingese, Rhodesian Ridgeback, Scottish Terrier, Standard Schnauzer, Tibetan Mastiff, Westie, Xoloitzcuintli) + 3 pit-type breeds (APBT, AmStaff, Staffie) + Munchkin cat + American Curl + Savannah + Selkirk Rex = **123 total breeds**, all audit-quality. ~43 breeds added net-new in v1.2. |
| **Brand-name compliance** | Zero brand-name medications across entire breeds.js. All allergy-related bullets use "modern allergy medications — discuss with your vet whether oral medications, injectable options, or allergen-specific immunotherapy fit." Pimobendan kept as generic class name (Vetmedin parenthetical dropped). |
| **Pit-type breeds (3 entries)** | American Pit Bull Terrier, American Staffordshire Terrier, Staffordshire Bull Terrier — all with neutral framing per Apple-rejection-risk guardrails (no aggression/fighting/tough/guard-dog language; BSL implications mentioned only as practical owner considerations re housing + insurance + travel). |
| **Welfare-aware framing** | Munchkin cat added with the Scottish Fold pattern: honest about the chondrodysplasia welfare debate, citing ICatCare + RSPCA + BVA + GCCF + FIFe positions, balanced care guidance for current owners, "if you have one... if you're considering buying one..." closing. |
| **Multi-pet UX refinement** | Pet card name-as-button + EditPet flow (OnboardingScreen with editMode); pet-name nav title on ChecklistScreen + HealthTrackerScreen ("Falafel's Checklist"); active-pet chip in nav-bar top-right; PetSwitcherModal as the single switching mechanism (replaces whole-card tap). Single-pet households get plain title, no chip. |
| **My Floofs empty state** | Welcoming first-time-user UI with 140×140 paw icon, "Welcome to FloofLife" headline, value prop body, "Add your first floof" CTA → AddPet modal, privacy reassurance line. Replaces the prior dev-speak empty state. |
| **Microchip Phase 1** | New onboarding step + edit screen capturing microchipStatus (`confirmed` / `pending` / `none` / `unsure`) + microchipNumber (15-digit ISO 11784/11785). Existing pets soft-migrate to `microchipStatus: 'unsure'` via fallback default in editMode pre-fill. No alert integration in v1.x. |
| **Light gamification polish** | Smooth LayoutAnimation expand/collapse on About / Health / Tips / Sources / Origin Story cards; celebratory animation + notifySuccess haptic when ALL daily checklist items complete (de-duped per pet/date/itemcount); tapLight haptic on every tab switch. Zero new screens, zero new deps. |
| **v1.1.2-work merge** | 16 conflicts hand-resolved (RLS-style 3-way merges on YourPetsScreen, HomeScreen, OnboardingScreen, App.js, V1_REMOVED_FEATURES.md, package files). Caught and fixed a duplicate-toggleAbout-function bug from the auto-merge that would have silently broken mixed-breed sectionId state. |
| **Pawgress Indicator (NEW)** | Daily-care gamification per docs/features/pawgress-indicator.md. Five-segment paw SVG (4 toe pads + main pad), tap-to-toggle in the modal detail screen, streak counter (consecutive all-5 days, today not required to be complete), Home card, animated celebration overlay (12 floating particles + headline pop) when all 5 fill, Premium history-view teaser. Storage shape mirrors future Supabase `pawgress_days` table per security doc + spec. |
| **Tummy Tracker (NEW)** | Per-pet stool + diet log per docs/features/tummy-tracker.md. Stool entry: Bristol Stool Scale 1-7 with abstract line-art icons (NOT photographic per Apple-review guideline; flagged as v1.3 design polish), color enum, volume, modifiers (mucus / blood / foreign material / undigested food), photo via camera or library, free-text note (LOCAL ONLY). Diet entry: meal type + brand + product + amount + note + SavedFoods autocomplete cache. **FDA recall match: ALWAYS FREE** — fetches openFDA food/enforcement + animalandveterinary endpoints, runs LOCAL fuzzy match against logged foods (third party never sees what user logged). **Vet visit suggestion: ALWAYS FREE** — anomaly detection on stool entries (3+ Bristol 1-2 / 3+ Bristol 6-7 in 48h, blood, black, red_tinged, sudden volume change). Premium gates: 90/365/all-time timeline ranges + PDF export with photos embedded + multi-pet comparison (TBD; not in v1.2 MVP). PDF via expo-print HTML→PDF + expo-sharing iOS share sheet. |

## Commit log (v1.2-work since v1.1.2-work merge)

```
ec9ecb9 docs: update OVERNIGHT_NOTES + HANDOFF for Pawgress + Tummy Tracker landing
3e39368 feat: Tummy Tracker — entry screens, timeline, recall + vet banners, PDF export
[Tummy data layer commit] feat: Tummy Tracker data layer + FDA recall match service
7347be6 feat: PawgressScreen + HomeScreen card integration
77dc710 feat: Pawgress visual components — Paw SVG + Checkmark + Celebration
5e1cc09 feat: Pawgress data layer (storage helper + segment defs + streak logic)
df57e90 deps: add expo-print + react-native-svg for Pawgress + Tummy Tracker
a4fd685 docs: HANDOFF.md — cold-start context for new Claude Code conversations
6120fa8 feat: light gamification polish — animations + celebration + tab haptics
8f56861 feat: microchip data capture in onboarding (Phase 1 — no alert integration)
41c7cc2 feat: My Floofs welcoming empty state with CTA
9a586c3 feat: Munchkin cat with welfare-aware framing (modeled on Scottish Fold)
14491bc feat: 3 pit-type breeds — APBT, AmStaff, Staffie (neutral framing)
fc1ff1f feat: 5 new breeds — Westie, Xoloitzcuintli, American Curl, Savannah, Selkirk Rex
d3e6c04 feat: 5 new dog breeds — Pekingese, Rhodesian Ridgeback, Scottish Terrier, Standard Schnauzer, Tibetan Mastiff
0d271fe feat: 5 new dog breeds — Bull Terrier, Cardigan Welsh Corgi, English Mastiff, Great Pyrenees, Jack Russell Terrier
ef09744 docs: update PRE-BUILD-18 checklist for multi-pet UX changes
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

---

## Build 18 — TRIGGERED 2026-05-08 — REJECTED BY APPLE (Transporter)

**Status**: ✅ Build artifact built successfully on EAS. ❌ Apple rejected the Transporter upload with `Validation failed (409): Invalid Pre-Release Train. The train version '1.1.0' is closed for new build submissions`.

**Root cause**: `app.json` was still on `"version": "1.1.0"` — same marketing version as builds 15/16/17 which already shipped to App Store. Apple closes the marketing-version "train" once that version is released; new builds with the same marketing version are rejected.

**Fix landed**: bumped `app.json` `"version"` from `"1.1.0"` to `"1.2.0"` in commit `[next]`. Re-trigger of EAS build will produce **`1.2.0 (19)`** (auto-increment continues — Apple doesn't require build numbers to reset per train, just monotonic within a train).

**Build budget impact**: the failed build 18 (with version 1.1.0) consumed 1 of 2 EAS credits this cycle. The corrected re-trigger consumes the **emergency credit** — leaving 0 EAS credits this cycle. Per the build budget memory, "emergencies bypass" the 1-build-per-week rule, and a build that's literally rejected by Apple is the canonical emergency case. The next regular cycle (~3 weeks out) restores 12/month + 3 emergency reserves.

**Lesson for future major-version releases**: bump `app.json` `"version"` BEFORE triggering the EAS build, not after. The EAS auto-increment only handles build number, not marketing version. Add a pre-build version check to the manual checklist.

---

## Build 19 — TRIGGERED 2026-05-08 (replaces failed build 18)

**Status**: ✅ Build finished successfully on EAS. Awaiting Transporter upload + ASC processing.

**Marketing version**: `1.2.0` (fresh train, no prior 1.2.0 builds).
**Build number**: `19` (auto-incremented from 18).
**Tag**: `1.2.0 (19)`.

**HEAD at trigger**: `e977d63` (fix: bump app.json version 1.1.0 → 1.2.0 + log Apple rejection)

**EAS build details page**: https://expo.dev/accounts/bassklaft/projects/pawrent/builds/443e44bd-461d-4211-9764-92caaebfe1c8

**iOS .ipa artifact**: https://expo.dev/artifacts/eas/9qLj9nk4Y8nxJ1RDBmMmsL.ipa

**Trigger message**: "v1.2.0 build 19 — fix Apple 1.1.0 train-closed rejection (app.json version 1.1.0 → 1.2.0); same Pawgress + Tummy Tracker + 43 new breeds + multi-pet UX + microchip Phase 1 payload as failed build 18"

**EAS-build confirmation rule applied** (per the new memory rule from this session): user explicitly confirmed the trigger ("i confirm") before the command ran. Pay-as-you-go billing was enabled at this point — ~$2/build.

**Same payload as build 18** (the version-bump was the only diff):
- Pawgress (data + visuals + screen + Home card integration)
- Tummy Tracker (entry screens + timeline + recall match service + vet visit suggestion + PDF export + Home card)
- 43 net-new breeds (12 dogs from late manifest + 3 pit-type with neutral framing + Munchkin with welfare-aware framing + 5 cats + earlier batches)
- Multi-pet UX refinement (name-as-button + chip + nav title)
- Microchip Phase 1
- Empty state polish + light gamification polish
- All brand-name medications removed from breeds.js
- v1.1.2-work merge resolution intact (toggleAbout dedup bug fix preserved)





**HEAD at trigger**: `b5ac42b` (chore: gitignore /ios/ and /android/ — generated by expo prebuild)

**EAS build details page**: https://expo.dev/accounts/bassklaft/projects/pawrent/builds/539bac92-89b1-4758-99f3-9e61cb060df4

**iOS .ipa artifact**: https://expo.dev/artifacts/eas/bjNTSuqX33p56MMQpxvXdG.ipa

**Build config**:
- Profile: `production`
- Apple Team: `93RYK7P234` (MAXWELL BERNARD KLAFTER, Individual)
- Distribution Certificate: serial `43D6AAAADAC86205FF383B681EF59E0B`, expires Wed 21 Apr 2027
- Provisioning Profile: Developer Portal ID `D43479MMVA`, expires Wed 21 Apr 2027
- Bundle ID: `com.bassklaft.pawrent`
- Project upload size: 9.2 MB
- Free-tier queue (paid-tier upgrade pending; not blocking)
- Trigger message: "v1.2.0 build 18 — Pawgress + Tummy Tracker + 43 new breeds + multi-pet UX refinement + microchip Phase 1"

**Pre-trigger cleanups landed in commit `b5ac42b`**:
- Reverted `package.json` script changes that local `expo run:ios` had introduced (managed-workflow scripts restored)
- Added `/ios/` and `/android/` to `.gitignore` so future local prebuilds don't pollute the working tree (the existing `ios/build/`, `ios/Pods/`, `android/build/` lines preserved as redundant-but-harmless)

**Build budget update** (per `feedback_build_budget.md` memory):
- **1 of 2 EAS credits consumed** this cycle
- **1 emergency credit remaining** until the next cycle (≈3 weeks out, then 12/month + 3 emergency)

## Path to TestFlight + Review (manual steps)

Per the established Transporter-fallback pattern (per `feedback_transporter_fallback.md` memory — EAS Submit free-tier queue is slow; Transporter is faster):

1. **Download the .ipa** from the artifact URL above.
2. **Open Transporter** (Apple's standalone app — Mac App Store).
3. **Drag the .ipa into Transporter**, sign in with the same Apple ID as App Store Connect, click **Deliver**.
4. **Wait ~5-15 min for ASC processing** — email arrives when build 18 appears in TestFlight.
5. **Add build 18 to TestFlight** on the test iPhone (MaxiTaxi).
6. **Run the PRE-BUILD-18 MANUAL CHECKLIST below** — sections 1-22.
7. **If all 22 pass**: in ASC → My Apps → FloofLife → 1.2.0 → "Add for Review". Submit.
8. **If anything fails**: do NOT submit. Fix, re-build (consumes the emergency credit), re-test.

**Do NOT submit to App Store Review until after the smoke test passes on the TestFlight build.**

## Pre-build context — dev-client detour (skipped)

Before triggering build 18 we briefly attempted a local dev-client smoke test via `npx expo run:ios` against the iPhone (MaxiTaxi, iPhone 16 Pro, iOS 26.3.1). Outcome:
- Prebuild ran cleanly (created `./ios`, ran `pod install` after Homebrew-installed CocoaPods 1.16.2 — system Ruby gem install was blocked by macOS read-only system Ruby, Expo CLI fell back to brew automatically)
- Build then failed at device-detection due to a known incompatibility between **`@expo/cli` 54.0.24** (the version bundled with Expo SDK 54.0.0) and **Xcode 26.3's `xcrun devicectl` JSON output format**. Error: `Unexpected devicectl JSON version output... CommandError: No iOS devices available in Simulator.app`
- Retry with explicit UDID (`00008140-000658A12253001C`) failed identically — the bug is in Expo's pre-xcodebuild device pick step, before any UDID is actually used
- Latest `@expo/cli` line is 55.x but bumping major-version would have introduced peer-dep risk with SDK 54
- Pivoted to opening Xcode workspace GUI directly (`open ios/FloofLife.xcworkspace`) for a manual build path, started Metro on `:8081` separately for dev-client mode
- During this period the Mac's LAN IP shifted from `192.168.12.64` → `192.168.12.65` (DHCP renewal); the Expo Go QR I had generated pointed at the old IP, hence the user's "request timed out" error on iPhone
- Even after correcting the IP, Expo Go would have failed at runtime because the project includes `react-native-purchases` (RevenueCat) which is a native module not in Expo Go
- User decision: skip the local smoke test entirely, trigger production build 18, smoke-test against TestFlight build instead

This experience is captured for future reference: **for any future local dev-client work on this project, the @expo/cli version needs to be at least the patch that ships the Xcode 26+ devicectl fix** (55.x line). Until then, Xcode workspace GUI is the working path. EAS production builds are unaffected — they don't use the local devicectl pipeline.

---

## PRE-BUILD-18 MANUAL CHECKLIST — sections 1-22

Walk through this on the physical device after build 18 lands in TestFlight (or via the Expo dev server for a quick pass), before submitting to App Review. Each item is a 30-60 second smoke test. **Pass criteria: all 22 sections green. If any item fails, do NOT submit build 18 — fix and rebuild first.**

### 1. Onboarding (fresh install — clear app data first or install on a clean test device)
- [ ] App launches without crash
- [ ] Onboarding step 1: Name + species selection works; "Next" enabled when name entered
- [ ] Onboarding step 2: breed picker — single-breed dog selection works; chip toggles selected/unselected; Maximum-of-3-breeds enforced when picking 4th
- [ ] **Cat-coat-pattern hint**: switch species to cat → tap "Tabby, Tortoiseshell, or Calico?" hint → confirm Alert appears with 3 options → "Use Domestic Shorthair" pre-selects domestic shorthair → "Use Mixed Cat" pre-selects mixed cat → both work
- [ ] Onboarding step 3: photo picker opens; "Skip for now" works
- [ ] Onboarding step 5 (final details): age + weight inputs accept decimals; finish creates pet successfully; redirects to Home

### 2. Single-breed dog (Falafel = Chow Chow, your primary test pet)
- [ ] My Floofs tab → Falafel's card renders with photo, name, breed, age
- [ ] **About card defaults expanded** — visible immediately when opening the card
- [ ] **Health Considerations card defaults collapsed** — only the header visible; tap to expand → all 6-7 health bullets render
- [ ] Tap About card header → collapses; tap again → re-expands. State persists when scrolling.
- [ ] Inside About card (when expanded): Origin Story + Sources are collapsible sub-sections; tap each → expands inline; tap again → collapses
- [ ] Tips card: collapsed by default; header reads "💡 Insider Tips · X things only Chow Chow owners know"; tap → expands

### 3. Mixed-breed dog (test by adding a hypothetical Goldendoodle pet via "Add another pet")
- [ ] Add another floof → onboarding → pick "Labrador Retriever" + "Poodle" (or any 2 breeds — "Goldendoodle" itself is a valid single breed in our catalog, so for true mixed-breed testing pick TWO different ones)
- [ ] My Floofs tab → 2 pets visible
- [ ] On the mixed-breed card: TWO separate About cards render (one per breed), TWO separate Health Considerations cards
- [ ] Each About card has its own breed-section header (small label with emoji + breed name)
- [ ] **Independent state**: expand About on breed 1, collapse About on breed 2 → confirm they're independent (toggling breed 1 doesn't toggle breed 2)
- [ ] Same independence on Health Considerations and Tips

### 4. Multi-pet UX refinement (multi-pet only)

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

### 5. Premium screen + founder override
- [ ] Settings → Premium → Premium screen opens as modal
- [ ] On Max's iPhone (IDFV `981F7B5B-46DF-4B89-AF5D-49B812EB939D`): screen shows premium-active state — annual + monthly cards both render but the purchase CTA is replaced or grayed appropriately (founder override active)
- [ ] On a non-founder device: both annual and monthly cards are tappable; selected card highlighted; purchase button enabled

### 6. Settings — Privacy / Terms / Feedback
- [ ] Settings tab → tap "Privacy policy" → Safari opens to `bassklaft.github.io/floof-life/legal/privacy-policy.html` and the page loads
- [ ] Settings tab → tap "Terms of service" → Safari opens to `bassklaft.github.io/floof-life/legal/terms-of-service.html` and the page loads
- [ ] Settings tab → tap "Send feedback" → iOS Mail composer opens with prefilled subject "FloofLife Feedback" + body containing app version + iOS version + pet count
- [ ] Settings tab → tap "Haptic feedback" row → toggles On / Subtle / Off; subsequent taps in the app use the new haptic preference

### 7. Haptics (physical device only)
- [ ] Setting Haptic feedback to "On" → tapping any About/Health/Tips toggle fires a light tap haptic
- [ ] Setting Haptic feedback to "Subtle" → only light + success haptics fire; medium/heavy collapse to light
- [ ] Setting Haptic feedback to "Off" → no haptics anywhere

### 8. Analytics (verify in PostHog dashboard, not just console)
- [ ] Open PostHog dashboard → Live Events → confirm the test session shows: `app_opened`, `screen_viewed`, `about_breed_expanded`, `health_considerations_expanded`, `origin_story_expanded`, `sources_expanded`, `insider_tips_expanded`, `active_pet_switched`, `pet_photo_picked`, `pet_edit_opened`, `pet_edited` (NEW in v1.2.0)
- [ ] `active_pet_switched` events include a `source` property: `checklist_switcher` or `health_tracker_switcher` (NEW in v1.2.0)
- [ ] No PII leakage: confirm none of the events contain `pet.name`, breed-key strings (only `species: "dog"|"cat"`), or photo URIs

### 9. Health Tracker (v1.2 feature — confirm it landed in the merge)
- [ ] My Floofs → tap a pet → "Health Tracker" row visible
- [ ] Tap → opens Health Tracker screen for that pet
- [ ] "Add health record" works; record persists across app restart

### 10. Critical regression checks (anything that was already working should still work)
- [ ] Toxic Foods & Plants screen renders
- [ ] Recalls screen renders + items link to FDA pages
- [ ] Vets Near Me opens Maps
- [ ] Risk Map renders + location permission handles correctly
- [ ] Emergency Resources screen renders + poison-control hotline numbers tap-to-call
- [ ] Diet & Care screen renders
- [ ] Training Exercises screen renders
- [ ] Trip Planning screen renders
- [ ] Age Calculator (DogAge route) renders + gives a multi-factor result for Falafel

### 11. Microchip step in onboarding (NEW step 4)
- [ ] Onboarding step 4: "Does [name] have a microchip?" appears between photo and details
- [ ] Tapping "Yes — chip number is…" reveals an inline numeric text input
- [ ] All four options select cleanly; only one can be selected at a time
- [ ] Footer hint about shelters/breeders chipping pets shows
- [ ] "Next" advances to step 5 (age + weight)
- [ ] "Back" returns to step 3 (photo)
- [ ] Microchip data persists on the pet record after finish

### 12. Edit pet via name-tap on My Floofs
- [ ] Tap pet's NAME (with pencil icon) on My Floofs → EditPet modal opens
- [ ] All fields pre-filled with existing values, including microchip
- [ ] Microchip status options reflect the saved status
- [ ] "Save changes" updates the pet record (verify by reopening edit)
- [ ] "Cancel" closes without saving

### 13. My Floofs empty state
- [ ] (Best tested on a fresh install) When no pets exist: empty state shows paw icon, "Welcome to FloofLife", value prop, "Add your first floof" CTA, and privacy reassurance
- [ ] Tap CTA → AddPet onboarding modal opens

### 14. Light gamification polish
- [ ] About / Health Considerations / Tips / Sources / Origin Story cards expand and collapse SMOOTHLY (not snap)
- [ ] Tab switches (Checklist / Home / My Floofs) fire a light haptic on physical device
- [ ] Complete ALL items on the Checklist for one pet → celebration overlay appears with 🎉 emoji + "[Name] is set for today" + notifySuccess haptic
- [ ] Re-toggling the last item doesn't re-fire the celebration
- [ ] Switching to a different pet whose checklist isn't complete shows no celebration

### 15. New breed entries
- [ ] In the breed picker, scroll to verify alphabetical order: Akita, Aussiedoodle, Australian Cattle Dog, Australian Shepherd, ... continues alphabetically through the new entries (Bull Terrier, Cardigan Welsh Corgi, English Mastiff, Great Pyrenees, Jack Russell Terrier, Pekingese, Rhodesian Ridgeback, Scottish Terrier, Standard Schnauzer, Tibetan Mastiff, West Highland White Terrier, Xoloitzcuintli) ... up to "Mixed" / "Other dog" pinned at the bottom
- [ ] Pit-type breeds (American Pit Bull Terrier, American Staffordshire Terrier, Staffordshire Bull Terrier) appear in alphabetical order at the start
- [ ] Munchkin cat appears in alphabetical position in the cat picker
- [ ] Sample 3-4 new breed entries on the My Floofs card to confirm About + Health Considerations render correctly

### 16. Pawgress Indicator (NEW in v1.2.0)
- [ ] Home tab: Pawgress card visible above QUICK ACCESS heading; renders a small 56px paw SVG with completion summary
- [ ] Tap card → Pawgress modal opens with 220px paw at top + "TODAY'S PADS" section (5 tappable rows)
- [ ] Daily Special pad shows day-of-week-rotating label (e.g., Monday = "Brush teeth or dental chew")
- [ ] Tap a pad row → segment toggles, AnimatedCheckmark draws in, paw segment animates fill
- [ ] Complete all 5 pads → celebration overlay fires once with floating 🐾 / 💛 / 🎉 / ✨ particles + "[Pet] is set for today" headline + notifySuccess haptic
- [ ] Re-toggling the last pad does NOT re-fire celebration (de-duped per pet+date)
- [ ] Streak counter (🔥 X-day streak) appears when streak > 0
- [ ] Free user: "See [pet]'s history" Premium teaser visible at bottom; tap → Premium screen

### 17. Tummy Tracker — first entry (NEW in v1.2.0)
- [ ] Home tab → tap "Tummy Tracker" card → Tummy Tracker screen opens
- [ ] Empty state: paw emoji + "Log [pet]'s first poop" + value-prop body + "always free" mention of recall + vet suggestions
- [ ] Tap "Log poop" → LogStool modal opens
- [ ] Bristol picker: tap each of 1-7 → BristolIcon highlights + numeric label updates + description text under the row updates
- [ ] Color chips: tap each color → highlights; black + red_tinged have a watch-color border
- [ ] Volume row: small / normal / large select cleanly
- [ ] Modifier toggles: mucus / blood / foreign material / undigested food — toggling blood shows inline "discuss with your vet" hint
- [ ] Photo button: tap → ActionSheet ("Take photo" / "Choose from library" / "Cancel"). On iPhone, both options reach the relevant native picker
- [ ] After photo: small thumbnail in dashed-border box; "Remove photo" removes it
- [ ] Optional note text input
- [ ] "Log this poop" button saves + dismisses modal + returns to Tummy Tracker
- [ ] Photo file persists across app restart (sandbox storage in documentDirectory/pets/[id]/tummy/)

### 18. Tummy Tracker — diet entry (NEW)
- [ ] Tap "Log meal" → LogDiet modal opens
- [ ] Meal-type chips select cleanly (kibble / wet / raw / treat / supplement / scraps / human_food / water_only)
- [ ] After at least one diet entry: QUICK ADD row appears with most-recent foods. Tap a quick-add chip → fills brand + product fields
- [ ] Brand + product + amount + note inputs work
- [ ] "Log this meal" saves + dismisses

### 19. Tummy Tracker — recall match banner (NEW, ALWAYS FREE)
- [ ] Log a diet entry with a brand likely to match an active FDA recall (e.g., search openFDA food/enforcement results manually first to find a current example)
- [ ] Recall banner appears at top of Tummy Tracker screen with red background + alert-octagon icon + recall date + reason + "Last logged" date + "Discuss with your vet"
- [ ] If cache is older than 7 days: stale-data warning appears below the banner
- [ ] Recall match runs OFFLINE if a previous fetch is cached (try airplane mode; banner still shows from cache)

### 20. Tummy Tracker — vet suggestion banner (NEW, ALWAYS FREE)
- [ ] Log 3 stool entries with Bristol 6 or 7 within 48 hours (or 1 entry with blood checked) — banner appears at top of Tummy Tracker
- [ ] Banner has accent background + stethoscope icon + "Pattern detected: ..." + "Discuss with your vet."
- [ ] Banner does NOT appear if criteria not met (1 normal stool entry, e.g., Bristol 4)

### 21. Tummy Tracker — Premium gating (NEW)
- [ ] As a non-Premium user: 30-day range pre-selected; 90 / Year / All-time ranges show lock icon
- [ ] Tap 90 / Year / All-time → Premium upsell Alert appears with "Maybe later" / "See Premium"
- [ ] Tap "Export" → Premium upsell Alert
- [ ] As Premium user (founder override): all four range buttons selectable; Export button generates a PDF + opens iOS share sheet
- [ ] PDF includes pet name header, recall + vet banners (if any), interleaved stool + diet timeline, photos embedded inline at reasonable size, footer disclaimer

### 22. Tummy Tracker — privacy contract (NEW)
- [ ] Verify in PostHog dashboard: stool log events fire `tummy_tracker_stool_log_created` with bristol_scale, color, has_photo, has_blood, pet_species — NEVER notes verbatim, NEVER photo URI, NEVER pet name
- [ ] Diet log events fire `tummy_tracker_diet_log_created` with meal_type, has_brand, pet_species — NEVER brand strings, NEVER product names, NEVER notes verbatim
- [ ] Recall match event fires `tummy_tracker_recall_match_shown` with brand_match (bool) + recall_age_days
- [ ] Vet suggestion event fires `tummy_tracker_vet_suggestion_shown` with trigger_type only (not pet_id, not entry details)
- [ ] Photo capture event fires `tummy_tracker_photo_captured` with source (camera/library) only

---

## App Store Connect privacy disclosure check (BEFORE build 18 submission)

The microchip number is **User Content** under Apple's privacy taxonomy. Verify before submission:

- [ ] **App Store Connect → My Apps → FloofLife → App Privacy** → "User Content" category includes "App Functionality" use case. Microchip number falls under this — same as pet name, breed, photo, notes — already declared for v1.0.
- [ ] **No new privacy categories required** — microchip data does NOT cross any new category boundary (it's not health/fitness, location, contacts, search history, etc.). Tummy Tracker stool/diet entries also User Content under existing categories.
- [ ] **Privacy Policy** at `bassklaft.github.io/floof-life/legal/privacy-policy.html` already covers User Content broadly. **Recommended addition** for clarity (low priority for v1.2.0, can wait for v1.3+ when microchip Phase 2 lost-pet workflow lands): a single line in the User Content section explicitly listing "microchip number" alongside "pet name", "photos", "notes". Doesn't change disclosure scope, just improves transparency.
- [ ] **PrivacyInfo.xcprivacy** manifest: doesn't need updating for v1.2.0 since no new APIs accessed.
- [ ] **Apple's stricter ATT-tracking rules** don't apply — microchip number + tummy logs are user-entered local data, never used for tracking. FDA recall match runs locally; no third party sees what user has logged.

## Apple review risk assessment (v1.2.0)

| Guideline | Assessment | Mitigation |
|---|---|---|
| **1.4.1 (Safety – Medical)** | LOW for v1.2.0. All health content is editorial summary with vet-discussion framing; no diagnosis claims, no drug doses, no brand-name medications. Bristol Stool Scale icons are abstract line-art (NOT photographic). | Existing standard: "may be predisposed", per-bullet "discuss with your vet", ZERO brand-name meds in catalog. Vet visit suggestion banner says "discuss with your vet" — never "your pet has X". |
| **3.1.1 (In-app Purchase)** | LOW. Premium gating via RevenueCat unchanged from v1.1. Tummy Tracker recall match + vet suggestion explicitly NOT paywalled per safety contract. | Existing flow. |
| **4.0 (Design)** | LOW. New UI is consistent with existing patterns; tab haptic + smooth animations + Pawgress paw + Tummy timeline are standard polish. | No new third-party SDK; only added expo-print + react-native-svg (both Expo-native, SDK-54-compatible). |
| **5.1.1 (Privacy)** | LOW. Microchip number is User Content (already declared). All data stays on device for v1.x. Permission strings (camera, photo library, location) unchanged. Photos sandbox-only — never written to camera roll. | Verify App Privacy categories cover microchip number per checklist above. |
| **5.1.2 (Privacy – Tracking)** | LOW. No new tracking. PostHog still anonymous-by-default with the privacy contract enforced. FDA recall match runs LOCALLY (no logged brands sent to FDA). | No change. |
| **Pit-type breed framing rejection risk** | LOW. APBT / AmStaff / Staffie entries use AKC/UKC sourcing, neutral language, no aggression or fighting references, BSL framed as practical owner consideration only. | Reviewed against the user's framing rules at writing time. |
| **Munchkin welfare framing rejection risk** | LOW. Same Scottish Fold pattern that already shipped in v1.1; cites veterinary welfare orgs neutrally. | Reviewed against the existing Scottish Fold framing model. |

**Overall v1.2.0 review risk: LOW.** Largest content additions (43 net-new breeds, microchip step, multi-pet UX refinement, Pawgress, Tummy Tracker) all build on existing patterns that have already passed review. Tummy Tracker is the largest new feature surface; vet-discussion framing + abstract Bristol icons + sandbox-only photos + always-free safety outputs all reduce review risk.

## Marketing content brief for v1.2.0 launch

Pawgress + Tummy Tracker are the headline features; breeds catalog + multi-pet UX + microchip are supporting:

1. **Pawgress** — daily-care gamification. Tap a paw segment as you go through the day; complete all five for the celebration. Streak counter for the consistent humans. Premium unlocks weekly / monthly / yearly history.
2. **Tummy Tracker** — per-pet stool + diet log with Bristol Stool Scale + color + volume + modifiers + photo. **FDA recall match (always free)**: when a brand you've logged appears in an active FDA recall, you see a banner. **Vet visit suggestion (always free)**: anomaly detection flags patterns worth discussing — 3+ days of soft stool, blood, melena, sudden volume change. Premium unlocks 90-day / yearly / lifetime views + a vet-friendly PDF export with photos embedded.
3. 40+ new breeds including the pit-type breeds with neutral framing, Munchkin with welfare-aware copy modeled on Scottish Fold, ancient breeds like Xoloitzcuintli + Tibetan Mastiff, and the long-tail mid-popularity dogs (Bull Terrier, Westie, Scottie, Jack Russell, Pekingese, Cardigan Welsh Corgi, etc.). 123 total breed entries.
4. **Cleaner multi-pet UX** — pet name is the obvious tap target → edit profile. Active-pet chip in nav bar of pet-scoped screens. Pet-name nav titles ("Falafel's Checklist") for context.
5. **Microchip onboarding** — new step in onboarding capturing chip status with four options. Useful for vet visits + future lost-pet recovery.
6. **Polish that adds up** — smooth expand/collapse on every breed card, celebratory haptic when you complete the day's checklist, light tap on every tab switch, welcoming first-time-user empty state.

**App Store "What's New" copy (~150 chars)**:
> v1.2: Pawgress daily tracker, Tummy Tracker (stool + diet log with FDA recall match — always free), 40+ new breeds, smoother multi-pet UX.

**Tone**: confident but not boastful. Specific (numbers, named features). No emoji in the title bar. Saves emoji for the in-app celebration moments.

---

# Appendix: working notes

## v1.1.2-work → v1.2-work merge resolution (commit `0a7b215`)

16 conflicts hand-resolved (14 content + 2 add/add). Higher than the 8 estimated overnight, because App.js, V1_REMOVED_FEATURES.md, V2_CHANGELOG.md, package.json, package-lock.json all conflicted too, plus ChecklistScreen / HomeScreen / OnboardingScreen / PremiumScreen each had their own real conflicts not just YourPetsScreen.

**Take v1.2-work (ours)** — 2 files: `src/data/breeds.js`, `V2_CHANGELOG.md`.

**Take v1.1.2-work (theirs)** — 7 files: `src/screens/SettingsScreen.js`, `EmergencyScreen.js`, `ChecklistScreen.js`, `PremiumScreen.js`, `src/lib/founderOverride.js`, `purchasesContext.js`, `checklist.js`.

**Real 3-way merges** — 7 files. Highlights:
- `App.js` — kept HealthTracker/AddHealthRecord routes + DogAge title rename (ours).
- `package.json` — kept all three new deps (expo-document-picker, expo-file-system, expo-haptics) alphabetically.
- `HomeScreen.js` — load() combines per-pet ChecklistState (theirs) + healthRecords load (ours); breed lookup uses ours' multi-breed-aware helpers; hero wraps in theirs' multi-pet TouchableOpacity switcher but uses ours' breedDisplay.
- `OnboardingScreen.js` — kept theirs' cat-coat-pattern hint Alert but converted `setBreed("...")` → `setSelectedBreeds(["..."])` to fit ours' multi-breed model.
- `YourPetsScreen.js` — most complex. Kept ours' HealthTrackerRow + breedKeys.map per-breed iteration + About/Health Considerations split + sectionId keying. Layered in theirs' active pet switcher + inner collapsibles (Origin Story / Sources / Tips) — all re-keyed from pet.id to sectionId so mixed-breed pets get independent state per breed. **Caught + fixed bug**: auto-merge produced two `toggleAbout` function declarations with the same name (sectionId-keyed from ours, petId-keyed from theirs); the second hoists and silently overrides the first. Consolidated into one sectionId-keyed `toggleAbout` that has both default-expanded behavior (ours) AND analytics + haptics (theirs). Same treatment for `toggleHealth`. Added a generic `toggleSubSection(setter, sectionId, eventName)` helper for the inner collapsibles.

esbuild parse-clean across all 12 affected JS/JSX files. No leftover conflict markers anywhere in the tree.

## H1-H3 + extended brand-name audit findings (now fully resolved)

Per Path C language guardrails, brand-name medications replaced with medication CLASS or treatment APPROACH.

**H1-H3 in scope** — only Bichon Frise had violations (3 occurrences: health bullet, checklist `why`, tips). All fixed.

**Out of scope but flagged + later resolved** — 6 entries in addition: Labrador, French Bulldog, Cavalier KCS (Pimobendan/Vetmedin), Doberman (Pimobendan/Vetmedin), Shih Tzu, Brittany. All fixed in commit `acc58c4`. Pimobendan kept as generic class name; Vetmedin parenthetical dropped.

Result: ZERO brand-name medication references across all breed entries in `src/data/breeds.js`.

## PostHog credential gap (re: pulling multi-pet stat for v1.3 planning)

Only the public-write project key (`phc_kF5d...`) is in `.env`. Querying PostHog for an aggregate stat (e.g., what % of active users have multiple pets) requires a personal API key (`phx_...`) which isn't stored locally. Cannot pull such numbers autonomously.

**Defaulted to <10% multi-pet households** for v1.2.0 design decisions (per US national multi-species rate ~14%, single-species multi-pet much rarer, early TestFlight + App Store users skew single-pet). Active-pet chip ships as a small component (24×24 avatar + first-name pill) only for multi-pet households.

**To pull the actual number once telemetry exists**: in PostHog dashboard run an Insight with breakdown by `pet_count` distinct property. We can fire `pet_count` on `app_opened` events going forward — flagged as a v1.3 analytics enhancement.

## Future feature: My Vet contact integration (NOT in scope for v1.2)

The vet-discussion framing across the app would be more actionable if Settings had a saved "My Vet" profile (name, phone, email) and every "discuss with your vet" prompt had a one-tap "Call your vet" / "Email your vet" button.

- **Settings → My Vet**: form with vet practice name, phone, email, address, after-hours emergency contact.
- **Per vet-discussion prompt**: a small "Call your vet" / "Email your vet" CTA when a saved vet exists; falls back to `Vets Near Me` when none saved.
- **Email pre-fill**: when emailing the vet from a Tummy Tracker / Tick log / Seizure log thread, auto-attach the relevant log export as a vet-friendly summary.
- **Multi-vet support**: a household with a primary vet + an emergency vet + a specialist (cardiologist, ophthalmologist, behaviorist) should be able to save all three.
- **Schedule**: v1.4 or later. Probably groups well with the existing Tummy Tracker spec since both feed the same vet-handoff workflow.
- **Schema**: `pawrent_vets_v1` AsyncStorage key, shape `{ primary: VetContact, emergency?: VetContact, specialists?: VetContact[] }` where `VetContact = { name, phone, email, address, notes }`. Backend table `vets` FK'd to `auth.users`, RLS user-owns-own per security doc.

Just documenting — not building. Could be its own spec doc under `docs/features/my-vet-contact.md` if formally specced.

## Visual verification gap → physical-device smoke test

No iOS simulator runtime is installed on this dev machine (already noted in V1_REMOVED_FEATURES.md). `expo start --web` doesn't work without `react-dom` + `react-native-web` (intentionally not added — not a project target).

**Replacement**: physical-device smoke test via `npx expo start` + Expo Go QR scan. The 22-section PRE-BUILD-18 manual checklist above is the verification gate. If all 22 sections pass on the device, we trigger build 18.

**What was static-verified** (pre-physical-device): esbuild parse-clean across 12+ affected JS/JSX files; zero stale `setBreed` / `pet.breed` / `isMixed` references after merge; mental traces of single-breed, mixed-breed, and pet-switcher scenarios all coherent; founder IDFV present; SettingsScreen URLs wired; haptics + analytics safe-degrade.

**What needs physical-device verification**: pixel-level rendering, active-pet switcher feel, real haptic firing, RevenueCat live offering fetch, real photo capture flow, real Mail composer rendering, FDA recall match against live API, vet-suggestion banner triggering on real entries, PDF export → iOS share sheet round-trip.

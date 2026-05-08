# FloofLife — Builder's Log

A personal record of what got built, when, and what it took.

---

## Week of April 27, 2026 — App Store launch

### April 29 — v1.0 shipped
- Initial App Store release after weeks of single-developer work
- Apple approved on first try
- 51 breeds covered with personalized weekly checklists
- Local-first architecture (data stays on device)
- 10 first-time downloads in first 24 hours, 41.7% conversion rate
- Hard call: stayed local-first instead of cloud-first to honor "your data stays on your device" promise
- LinkedIn personal post + Company Page launched same day

### May 1 — v1.0.1 patch
- User feedback: "Heartbreakingly short lifespan due to high cancer rates" too harsh
- Audited every breed's health language in 4 hours
- Softened mortality phrasing across Doberman, Boxer, Bernese Mountain Dog, Burmese, Great Dane
- Apple approved + released same day
- Lesson: brutally honest content can break the user before it educates them

---

## Week of May 4, 2026 — Premium + features sprint

### May 4 — v1.1 Premium subscription system + v1.2 feature work
- RevenueCat integration end-to-end (products, entitlements, offerings, paywall logic)
- Subscription pricing: $4.99/mo or $39/yr with 7-day free trial on annual
- Restored multi-pet support (gated behind Premium)
- Built v1.2 in parallel: mixed-breed support, Health Tracker (vaccines/preventatives/wellness), multi-factor age calculator, URL audit infrastructure
- Real fix on a real bug: greyed-out trial button on TestFlight build 6 → diagnosed + patched same afternoon (StrictMode double-effect orphaning the `ready` flag in the finally block) → shipped as v1.1 build 7
- Rebrand: "Your Pets" → "My Floofs" — distinctive, on-brand. Cherry-picked to both v1.1 + v1.2 branches
- Phase 4 polish: Age Calculator rebrand + multi-factor calc (AVMA size-adjusted + Wang 2020 epigenetic clock for dogs, AAFP curve for cats), home card reorder, `npm run audit:links` script that found and fixed four real dead links (FDA recalls 404, AVDC, Red Cross course, LA River), recall source tags + new disclaimer copy, v1.3-v1.5 roadmap committed
- Phase 4 follow-on polish: pet photos now stored in `documentDirectory` so they survive app updates (no more vanishing dog face after every TestFlight install); RevenueCat package resolver scans `availablePackages` instead of relying on the canonical `$rc_annual` / `$rc_monthly` getters (the silent build-7 trial button); checklist items auto-uncheck on their own cadence (daily / weekly / 3x-per-week / monthly all handled, ambient cadences never expire); founder origin paragraph on welcome + a Story page reachable from Settings ("Built by a dog dad who wanted the best for his floof — and yours."); v2.0 cloud-migration constraint documented in the repo so future-us doesn't ship something that wipes local data; Chow Chow origin reframed as contested with three competing lineage theories instead of a definitive Chinese claim
- 4 phases of feature work shipped in one afternoon
- Hard call: deferred document parsing + remote push notifications to v1.3 instead of cramming into v1.2 (would have shipped broken)

### May 4 EOD — trial button still silent, pausing for the evening
- Four v1.1 builds deployed to TestFlight today: 6 (greyed button), 7 (button visually fixed but tap silent), 8 (Pressable + hitSlop + heavy `console.warn` instrumentation), 9 (`resolvePkg` fallback so the SDK package matches custom RevenueCat dashboard identifiers, plus pet-photo persistence to `documentDirectory`, plus checklist cadence-based auto-uncheck)
- Build 9 verified to contain every fix on the v1.1-work branch — `git show v1.1-work:src/screens/PremiumScreen.js` shows `Pressable`, `hitSlop={12}`, `resolvePkg`, the full `[premium]` log set; `git show v1.1-work:src/lib/photoPicker.js` shows the `FileSystem.documentDirectory` copy and `persistPhotoForPet` helper. The fixes are in the binary
- User on build 9 reports: trial button still does nothing, Console.app shows the FloofLife process is alive but **none of the `[premium]` diagnostic warns are visible** at any log level. That's the biggest signal — it means either (a) the JS bundle in the binary isn't the one we built (stale OTA cached somewhere), (b) production-build `console.warn` isn't reaching OS log under the filter we're using, or (c) the screen we think is mounting actually isn't
- Photo persistence fix is in the v1.1 binary but hasn't been confirmed in the wild yet — the user can test by deleting + reinstalling FloofLife from TestFlight and seeing whether their pet's photo survives
- **Pausing for the evening — no more EAS builds tonight.** Plan for tomorrow morning:
  1. Verify what JS bundle is actually live on build 9 (check the build's source map / fingerprint vs the commit)
  2. Switch the diagnostic surface from `console.warn` (which depends on Console.app filtering working correctly) to in-app `Alert`s or an on-screen debug banner — if the press fires, an alert can't be missed; if no alert appears, the press isn't reaching JS at all
  3. Try the purchase flow with a fresh sandbox tester account in case the existing one is in a weird state
  4. If still broken, consider stripping the Premium screen down to a 10-line minimal repro (one Pressable, one console.warn, one Alert) and shipping that as build 10 to isolate the issue

---

## Week of May 7-8, 2026 — v1.2.0 sprint + ship saga

### May 7-8 overnight — v1.2.0 cycle, the big one
- 30+ commits on `v1.2-work` since the v1.1.2-work merge
- Headline features: Pawgress (daily-care tracker) + Tummy Tracker (stool + diet log with FDA recall match) + 40+ new breeds + cleaner multi-pet UX + microchip onboarding + light gamification polish
- Hard call: skipped local dev-client smoke test entirely. Burned 2+ hours on the Xcode 26.3 / `@expo/cli` 54.0.24 incompatibility (devicectl JSON format change broke device detection in the bundled Expo CLI), then realized the path was pointless because RevenueCat is a native module Expo Go can't load. Pivoted to "trust static analysis + smoke-test against TestFlight build 18 instead." Saved time but burned the build credit on the failed v1.1.0-tagged upload — which became the lesson of the day.

### Pawgress — built v1
- Tap a paw segment as you go through the day (Food & Water, Movement, Body Check, Mind & Bond, Daily Special)
- Complete all 5 → 12-particle floating-emoji celebration (🐾 / 💛 / 🎉 / ✨) + haptic
- Streak counter for the consistent humans, today's incompleteness doesn't break the streak
- Rotating "daily special" task by day of week (dental Mondays, brush Wednesdays, weigh Sundays)
- Storage shape designed to mirror the future Supabase `pawgress_days` table — when backend ships, sync engine just flips records from local-only to synced
- Hard call: shipped MVP only. Premium history grids (week/month/year visual layouts) deferred to v1.3 — just a tease + upsell for now. Wanted ship-able feature this cycle, not perfect feature.

### Tummy Tracker — built v1
- Bristol Stool Scale 1-7 picker with abstract line-art icons (Apple-review choice — graphic photographic visuals would have triggered medical-content review)
- Color, volume, modifier toggles (mucus, blood, foreign material, undigested food); blood toggle fires inline "discuss with your vet" hint
- Photo capture from camera or library — stored in app sandbox, NEVER written to camera roll (privacy contract from the security non-negotiables doc)
- Diet log with brand + product + amount + autocomplete from a per-pet "saved foods" cache that auto-touches on save
- **FDA recall match — always free.** Fetches openFDA food/enforcement + animalandveterinary endpoints, normalizes + dedupes, caches 24h with offline fallback. Matching runs LOCALLY against logged diet entries — third party never sees what you've logged. Banner copy: "FDA recalled [Brand] [Product] on [date]. Reason: [reason]. Last logged: [date]. Discuss with your vet."
- **Vet visit suggestion — always free.** Anomaly detection on stool entries: 3+ Bristol 1-2 in 48h (constipation cluster), 3+ Bristol 6-7 in 48h (diarrhea cluster), any visible blood, black or red-tinged color, sudden volume change. Banner: "Pattern detected — discuss with your vet."
- 30-day timeline free; 90-day, 365-day, all-time gated to Premium
- PDF export via `expo-print` HTML→PDF + `expo-sharing` iOS share sheet — vet-friendly chronological layout with photos embedded inline at 240×180 max
- Hard call: shipped MVP. CSV export, multi-pet comparison view, anomaly history dashboard all deferred to v1.3. The recall match + vet suggestion are the irreducible safety value; everything else is convenience.

### Big merge — v1.1.2-work into v1.2-work, 16 conflicts
- 14 content conflicts + 2 add/add. The bug story: auto-merge produced TWO `toggleAbout` function declarations in YourPetsScreen.js (one keyed by `sectionId` from v1.2-work, one keyed by `petId` from v1.1.2-work) — JavaScript function declarations hoist, so the second silently overrode the first. Caught it during static analysis, consolidated into one sectionId-keyed `toggleAbout` that has both behaviors (default-expanded from v1.2-work + analytics + haptics from v1.1.2-work). Without that catch, mixed-breed pets would have shared a single About-collapsed state across all their contributing breeds. Quiet win.
- Resolution map: take v1.2-work for `breeds.js` (rich audit + new breeds); take v1.1.2-work for `SettingsScreen`/`EmergencyScreen`/`ChecklistScreen`/`PremiumScreen`/`founderOverride`/`purchasesContext`/`checklist`; real 3-way for App.js + V1_REMOVED_FEATURES.md + package files + HomeScreen + OnboardingScreen + YourPetsScreen
- Hard call: hand-resolved the merge instead of auto-merging + retroactively fixing. Auto-merge would have produced subtle bugs (the toggleAbout one) that would only surface in mixed-breed pet households at runtime — the worst kind of silent breakage. Two hours of careful 3-way reconciliation now > one App-Review rejection later.

### 40+ new breeds added (now 123 total)
- 12 mid-popularity dogs: Bull Terrier, Cardigan Welsh Corgi, English Mastiff, Great Pyrenees, Jack Russell Terrier, Pekingese, Rhodesian Ridgeback, Scottish Terrier, Standard Schnauzer, Tibetan Mastiff, West Highland White Terrier (Westie), Xoloitzcuintli
- 3 pit-type breeds with neutral framing: American Pit Bull Terrier, American Staffordshire Terrier, Staffordshire Bull Terrier — zero aggression / fighting / tough / guard-dog language; BSL flagged only as "verify housing + insurance + travel policies" practical owner consideration
- Munchkin cat with welfare-aware framing modeled on the Scottish Fold pattern. Cites International Cat Care, RSPCA, BVA, GCCF, FIFe positions on the chondrodysplasia welfare debate. "If you have one, you're not at fault — you can still advocate for the welfare of the cat in front of you. If you're considering buying one, this is worth thinking carefully about."
- 3 cats: American Curl, Savannah (with the "verify legality in your state" callout — Savannahs are restricted/banned in NY/GA/HI/MA/RI), Selkirk Rex
- Hard call: pit-type breeds get the same audit-quality treatment as every other breed — no special handling, no "controversy" framing. The neutral framing is what's defensible; the alternative (skip them, or label them as different) would have been a worse signal.

### Brand-name medications removed from breeds.js
- Found 9 breed entries (Bichon Frise, Labrador, French Bulldog, Cavalier KCS, Doberman, Shih Tzu, Brittany) referencing Apoquel, Cytopoint, Bravecto, Nexgard, Vetmedin, etc.
- Replaced with the medication CLASS or treatment APPROACH: "Modern allergy medications have transformed quality of life for the breed — discuss with your vet whether oral medications, injectable options, or allergen-specific immunotherapy might fit your dog."
- Pimobendan kept as the generic class name (it IS the generic, not a brand); the (Vetmedin) parenthetical dropped
- Result: zero brand-name medications anywhere in the breed catalog. Owners get the same medical understanding without us inadvertently endorsing specific products
- Hard call: this is editorial integrity. Owners SHOULD discuss specific products with their vets, not us. Our value-add is the framework for that conversation, not the product recommendation.

### Multi-pet UX refinement (the third pass at this)
- Pet name on My Floofs is now the obvious tap target — pencil icon next to it; tap → edit modal opens
- Active-pet chip in nav-bar top-right of pet-scoped screens (multi-pet only — single-pet households get clean uncluttered chrome)
- Pet-name nav title: "Falafel's Checklist" / "Falafel's Health Tracker"
- Whole-card tap on My Floofs REMOVED — was clunky. The pet-switcher modal is now the single switching mechanism
- Hard call on the chip placement: tried to pull the multi-pet percentage stat from PostHog before deciding "primary" vs "secondary" component sizing. Discovered we only have the public-write key in `.env`, not a personal-read API key — can't query dashboard insights autonomously. Defaulted to <10% multi-pet (US national multi-species rate is ~14%, single-species multi-pet much rarer, early TestFlight users skew single-pet) which sized the chip as a small component. Will pull the real number for v1.3 planning when telemetry on `pet_count` lands.

### Microchip onboarding step (Phase 1)
- New step in onboarding: "Does [pet name] have a microchip?"
- Four options: Yes-with-number / Yes-ask-later / No / Unsure
- 15-digit ISO 11784/11785 numeric input appears inline when "yes"
- Existing v1.0/v1.1 pets soft-migrate to "unsure" via fallback default in editMode pre-fill
- No registry alert integration yet — that's v2.5+ territory and gated on partnership with HomeAgain / AKC Reunite / etc. (no universal microchip API exists in the US)
- Roadmap captured in V1_REMOVED_FEATURES.md: 3-phase plan from data capture (now) → lost-pet workflow with poster generation (v2.0+) → real-time scan alerts (v2.5+ via partnership)

### Light gamification polish
- Smooth LayoutAnimation expand/collapse on every breed-card section (About, Health, Tips, Sources, Origin Story) — was snap, now eases
- Celebratory haptic + 🎉 overlay when you complete ALL the day's checklist items for one pet (de-duped per pet/date so re-toggling the last item doesn't re-fire)
- Light tap haptic on every tab switch
- Welcoming first-time-user empty state replaced "Reset all data and run onboarding" dev-speak with "Welcome to FloofLife" + paw icon + "Add your first floof" CTA + privacy reassurance line
- No new screens, no new dependencies. Strictly polish.

### Future-feature specs documented (8 specs, ~10K words)
- Branch `feature-specs-batch-1` off main: detailed specs for v1.3-v2.0 work
- Pawgress (built), Tummy Tracker (built), Tick Map + Disease Awareness, Weather-Aware Notifications, Seizure Awareness, Checklist Weekly Refresh Paywall, New Home / Relocation Support, Emergency Procedures Library
- Each spec has goal / founder anchor / user flow / data model (with future Supabase schema) / UI / free-vs-Premium gating / authoritative sources / language guardrails / edge cases / analytics events / Apple review risk / time estimate / open questions / explicit out-of-scope
- Hard call: write all the specs UP FRONT. Future implementation sessions just code; they don't re-litigate "what should this feature do?". Reduces architecture-by-Slack-message in 6 months.

### Security non-negotiables for backend work
- Wrote `docs/security-non-negotiables.md` on main — read-this-first reference for any future backend / auth / premium-gating / admin work
- Five sections: RLS rules, App Store privacy disclosures, bulk-data-exfiltration defenses, premium-bypass defenses, founder/admin access
- Key rules captured: service-role key NEVER in the React Native client (rotated immediately if it ever appears there); RLS on every Supabase table BEFORE any data goes in; entitlement check ALWAYS server-side (client `isPremium` is UI hint only); RevenueCat webhooks must be HMAC-verified with constant-time compare; FOUNDER_DEVICE_IDS hardcoded array migrates to a server-side `is_founder` column when backend ships
- Cross-cutting engineering rules + an incident-response runbook ("cold-state writing beats panicked decisions")
- Hard call: write this BEFORE the backend buildout, not during. Every default leans toward "least exposed". Loosening RLS later is a small change; tightening RLS after data has leaked is impossible.

### May 8 — build 18 fail / build 19 retry / pay-as-you-go enabled
- Triggered build 18 (production, iOS) on EAS — finished cleanly, 9.2 MB project, free-tier queue, ~25 min total
- Downloaded the .ipa, dropped it into Transporter, hit Deliver — Apple rejected with `Validation failed (409): Invalid Pre-Release Train. The train version '1.1.0' is closed for new build submissions`
- Diagnosed in 30 seconds: `app.json` was still on `"version": "1.1.0"` — same marketing version as already-shipped builds 15/16/17. Apple closes the marketing-version "train" once that version releases publicly; new builds in that train get the 409
- EAS auto-increment only handles the BUILD number (CFBundleVersion), not the marketing version (CFBundleShortVersionString). The marketing version comes from app.json and was never bumped for v1.2.0
- Bumped app.json to "1.2.0", committed, pushed
- Enabled pay-as-you-go billing on EAS ($2/build) since the failed v1.1.0 build had eaten the discretionary credit
- Triggered build 19 → ✅ **finished successfully** as `1.2.0 (19)`. .ipa at https://expo.dev/artifacts/eas/9qLj9nk4Y8nxJ1RDBmMmsL.ipa
- Same payload as build 18 (version-bump was the only diff). Ready for Transporter upload + Apple validation should pass this time (fresh 1.2.0 train, no closed-train conflict)
- Lesson committed to project memory: bump `app.json` version BEFORE triggering EAS for major releases. Auto-increment handles build numbers; humans handle marketing versions.
- New rule committed to project memory: every `eas build` trigger needs an explicit "yes" confirmation including the cost. Even when I said "go" 5 minutes ago. Even for emergency rebuilds. The $ cost makes builds categorically different from code edits.

### Documentation cleanups
- Consolidated `OVERNIGHT_NOTES.md` from 562 → 338 lines. The 22-section pre-build smoke-test checklist is now one contiguous block instead of split across the file
- Wrote `HANDOFF.md` — cold-start context doc so future Claude conversations can pick up without re-reading the full history. Branch state, hard rules, conventions, key file paths, last-known HEAD
- Microchip integration roadmap (3-phase: data capture → lost-pet workflow → real-time scan alerts) added to V1_REMOVED_FEATURES.md
- Hard call: keep maintaining the running log files (OVERNIGHT_NOTES + HANDOFF + this PROGRESS.md). They've already paid for themselves twice (helped diagnose the build-18 issue fast, will help any future Claude conversation pick up cleanly). Documentation that compounds is rare.

---

## What's next — v1.3 through v1.5 (May 2026)

- Remote JSON for recalls (no more App Store updates for recall data)
- AI-assisted weekly recall workflow
- Local push notifications for vaccine reminders
- FDA RSS automated scraper
- Class action lawsuit integration via PACER
- Fully automated recall pipeline by June 1, 2026

---

## What's coming after — v2.0 (Summer 2026)

- Emergency preparedness (CPR + first aid, breed-specific) — pending vet partnership
- Emergency vet locator (nearest 24-hour animal hospitals)
- DNA test import
- Real-time veterinary medical journal integration (JAVMA, JFMS, JSAP)
- Cloud sync as paid feature

---

## Hard things that got solved

- Single-developer subscription billing infrastructure (RevenueCat → Apple → tested in sandbox)
- Multi-pet data migration (existing pets auto-upgraded to breeds[] array, zero-loss)
- Calendar export (RFC 5545-compliant iCal generation, zero backend)
- Defensible data sourcing language (no ToS violations, no medical liability)
- Mixed-breed checklist blending without duplicate items
- Disclaimer triple-layering (banner + first-time modal + save-confirmation checkbox)
- "Greyed button on TestFlight" diagnosed and fixed same day

---

> This file is updated whenever significant work lands. Commits that change features should also append a brief entry to the appropriate week's section.

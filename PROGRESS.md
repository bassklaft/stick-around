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

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
- 4 phases of feature work shipped in one afternoon
- Hard call: deferred document parsing + remote push notifications to v1.3 instead of cramming into v1.2 (would have shipped broken)

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

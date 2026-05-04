# FloofLife — User-Facing Changelog

A marketing-friendly log of everything we've shipped (or are working on)
since the v1.0 App Store launch on **April 29, 2026**. This file is the
source of truth for App Store "What's New" copy, LinkedIn posts, press
mentions, and investor decks. Every meaningful user-facing change goes
here as soon as it lands in code, not at end-of-day.

Entry format:

> **[Feature name]** — one-line user benefit (no jargon)
> - What it does
> - Why it matters to users
> - Status: shipped · in TestFlight · in development
> - Version: v1.0.1, v1.1, etc.

---

## v1.2 (in development)

> **Smarter Age Calculator** — Multi-factor age math, in plain language.
> - We replaced the placeholder "1 dog year ≈ 7 human years" with a real calculation that combines breed-size class (using AVMA-aligned thresholds — toy/small/medium/large/giant), the breed's typical lifespan range, body weight, and the Wang et al. 2020 epigenetic-clock formula (UC San Diego methylation curve). Cats get the AAFP feline life-stage curve. The result is a low/mid/high range, plus a list of every named factor we considered ("Size class: Large 50–90 lb · Breed lifespan: 10–12 yr · Epigenetic curve: Wang 2020"). The calculator briefly walks you through the steps it's actually running — no fake "analyzing" theater.
> - Owners deserve the real answer. Mixed-breed pets get a blended lifespan range across all their breeds; lifestyle adjustments (weight status, diet, exercise, vet checkups) nudge the rate within bounded limits. Honest disclaimer included: it's an estimate, not a measurement.
> - Status: code complete on `v1.2-work` (not yet built)
> - Version: v1.2

> **Recalls now sourced and clearly labeled** — FDA, consumer advocacy, and active class actions, with peer-reviewed journals coming.
> - Every recall entry now carries a source tag visible on the card ("SOURCE · FDA", "SOURCE · CONSUMER ADVOCACY", "SOURCE · FDA + CLASS ACTION") and a Last Updated timestamp the user can rely on. The disclaimer banner explicitly names where the data comes from and explicitly says these are not FloofLife's opinions — we surface what the original source has published. Active class action allegations are labeled as allegations, not as proof of harm. Real-time veterinary medical journal integration (JAVMA, JFMS, JSAP) is signaled as in-development.
> - Trust is the whole game in pet health. Owners want to know whether something on the list is "the FDA opened an investigation" vs "a vet on Twitter said". Now they can tell at a glance.
> - Status: code complete on `v1.2-work` (not yet built)
> - Version: v1.2

> **External link audit infrastructure** — Dead links don't live in the app for long.
> - A `npm run audit:links` script walks every source file, finds every external URL, probes them with HEAD/GET, and writes a `deadLinks.json` report on any 404 / 410 / DNS failure. Found four real dead links in v1.0/v1.1 and fixed them: the FDA recalls page (which had moved paths and was hitting 404 on every Recalls screen card), the AVDC dental position statement, the Red Cross pet first-aid course, and the LA River reference link. The script is CI-friendly — a v1.3 GitHub Action will run it weekly and open issues for breakage.
> - Stale links are corrosive — a single dead link from a recall card erodes the user's trust in everything else on the screen.
> - Status: code complete on `v1.2-work` (not yet built)
> - Version: v1.2

> **Roadmap: fully automated recall feeds by June 2026** — Documented in the repo so it's not a vague pitch.
> - v1.3 introduces remote-hosted JSON for recalls (push updates without an App Store version bump) and AI-assisted weekly ingest with manual review. v1.4 swaps in the FDA RSS feed (legal, structured, free) and adds PACER-driven class-action awareness. v1.5+ delivers a fully automated pipeline. Peer-reviewed journal integration is honestly flagged as a permanent manual-curation channel — those are paywalled, scraping isn't legal, and we'll either pay for subscriptions or build partnerships with vet schools.
> - Lets investors and partners see exactly when each capability lands and what's blocking what.
> - Status: planning artifact in `V1_REMOVED_FEATURES.md`
> - Version: planning

> **Breed origin honesty** — Contested origins now framed as contested.
> - Updated the Chow Chow entry significantly: the origin field flips from "Northern China · ~2,000+ years old" (definitive) to "Northern Asia · ancient lineage (origin actively debated)", and the origin story now lays out the three competing lineage theories — Han Chinese mastiff descent, Tibetan mastiff lineage, and Siberian/Russian spitz descent — rather than picking the popular one. Modern genetic research is named honestly: the breed's exact lineage is an active research area, not a settled question. The summary copy flips "ancient Chinese breed" to "ancient Northern Asian breed" so the contested framing carries through everywhere.
> - We added a small italic footnote anywhere a breed origin shows: "Origin information reflects current scholarly consensus where available, and acknowledged debate where it exists." The About page now carries the same line, plus an explicit "we don't pick a side in academic disputes about ancient lineages."
> - Audited every other breed in the catalog for similar issues. The other three breeds with origin fields (Bulldog, French Bulldog, Boston Terrier) have well-documented origins that don't need softening. Breeds the user flagged for review — Akita, Basenji, Saluki, Lhasa Apso, Pekingese, Tibetan Mastiff, Pharaoh Hound — aren't in the v1.2 catalog yet, so they'll get the contested-origin framing as they're added (deferred to v1.3 breed expansion).
> - Status: code complete on `v1.2-work` (and cherry-picked to `v1.1-work`)
> - Version: v1.1 hotfix + v1.2

> **Founder origin story** — Honest framing about how FloofLife came to be.
> - A short founder paragraph at the bottom of the welcome screen ("Built by a dog dad who wanted the best for his floof — and yours…") plus a fuller Story page reachable from Settings → About FloofLife. The Story page includes the origin paragraph, a "What FloofLife is not" boundary, a Sources section that names where breed and recall data come from, an Acknowledgments line, and the current version.
> - No outcome claims and no positioning against veterinary care — just the truth about why this app exists, where the data comes from, and what it can and can't do.
> - Status: code complete on `v1.2-work` (also cherry-picked to `v1.1-work`)
> - Version: v1.1 hotfix + v1.2

> **"My Floofs"** — Distinctive, on-brand replacement for "Your Pets".
> - Tab bar, screen titles, empty-state copy, and the Add-Another-Floof CTA all flip to the floof framing. Internal route names stay unchanged so the rebrand is purely surface-level — your existing pets, photos, checklists, and Premium status carry through with zero re-onboarding.
> - "FloofLife" + "My Floofs" reinforce each other and travel better in marketing than the generic "Your Pets".
> - Status: shipped on `v1.1-work` and `v1.2-work` (cherry-picked to both)
> - Version: v1.1 hotfix + v1.2

> **Fixed the greyed-out Start-Trial button** — TestFlight build 7 unblocks the purchase flow.
> - Build 6 of v1.1 rendered prices correctly but the trial button stayed disabled regardless of the user's selection. Root cause: the disabled prop was gated on a `ready` flag from the RevenueCat context that was getting orphaned by a React 18 / RN 0.81 StrictMode double-effect timing window. Fixed by flipping `ready` true synchronously the moment `Purchases.configure()` returns, and dropping `ready` from the button's gate entirely. Now the button lights up the moment a package is selected; offerings continue to populate state in their own time. Diagnostic console logs added for any future repros.
> - The literal first-paying-customer path can't be flaky. Build 7 fixes it for everyone on the v1.1 channel.
> - Status: shipped to TestFlight as v1.1 build 7
> - Version: v1.1 hotfix


> **Mixed-breed support** — Pick up to 3 breeds and get a blended care plan.
> - Owners of Lab/Poodle mixes, Aussie/Border Collie crosses, "DNA-test surprises," and rescue mutts can now select multiple breeds during onboarding. The weekly checklist blends recommendations from each, deduplicates anything they share in common, and tags items so you know whether a guideline came from one breed or all of them. The "Your Pets" screen shows each breed's About card and insider tips side-by-side, and breed-specific risks (IVDD, bloat, escape tendencies) trigger if any of the selected breeds qualify — half-Husky still digs.
> - Most American dogs are mixed. v1 forced them into a single bucket; v1.2 finally treats them honestly. Existing single-breed pets auto-migrate; nothing to re-enter.
> - **Marketing angle confirmed by analysis:** blended plans are *additive*, not redundant. We checked all 36 breeds with checklist items and found near-zero overlap (only Yorkie + Pomeranian share two items). Translation for owners: "two breeds means twice the guidance, not duplicate guidance."
> - Status: code complete on `v1.2-work` (not yet built)
> - Version: v1.2

> **Health Tracker** — A per-pet log of vaccines, preventatives, and wellness visits with a real next-due date for each one.
> - Pick from the built-in catalog (Rabies 1y/3y, DHPP, Bordetella, Heartworm, Flea/Tick, Annual Wellness, Dental, Bloodwork, Heartworm Test, Fecal, Weight Check, FVRCP / FeLV for cats) or add your own custom entry. Each record stores the date given, the cadence, your notes (lot number, vet, side effects), and an optional photo or PDF of the actual paperwork. The tracker buckets every record into Overdue / Upcoming (next 12 months) / History with status badges in red, yellow, and green. Free pets get one record; Premium unlocks unlimited entries.
> - Vaccine and preventative lapses are one of the most common reasons healthy pets end up at an emergency vet. Calendar-style awareness (rather than memory) is a big quality-of-life win — and the safety framing keeps the tracker from sounding like medical advice. We do not parse your documents, transmit them anywhere, or read them. Attachments live on your device.
> - Status: code complete on `v1.2-work` (not yet built)
> - Version: v1.2

> **Calendar export (.ics)** — One tap sends every upcoming health entry to Apple Calendar, Google Calendar, or Outlook.
> - The Health Tracker generates a standards-compliant .ics file with one VEVENT per upcoming record (9 AM local on the next-due date, 1-day VALARM, "Bella: Rabies" summary, your notes in the description) and hands it to the iOS share sheet so the user picks where it lands. We chose calendar export over push notifications deliberately — the user's existing calendar is where their other obligations live, and we don't want to be the app that nags people about pet vaccines from a notification tray.
> - Lower friction than re-entering due dates manually; uses the system the user already trusts. Vet appointments and pet care end up on the same canvas.
> - Status: code complete on `v1.2-work` (not yet built)
> - Version: v1.2

> **Photo & PDF attachments on health records** — Snap a photo of the rabies certificate; attach the PDF the vet emailed.
> - Tap "Attach photo or PDF" while logging an entry to pull from the photo library or pick a PDF. The file is copied into FloofLife's private storage on your device, the filename is shown in the record list, and tapping View opens it in the system viewer. We do not extract, OCR, summarize, or transmit the contents — what you store is what you store.
> - Owners hate keeping a folder of vaccine papers. Pinning a photo to the entry replaces that folder with one tap.
> - Status: code complete on `v1.2-work` (not yet built)
> - Version: v1.2

> **Vet integration** — Find your vet, save the contact info, schedule from inside the app.
> - Search-as-you-type to find your vet by name or zip, save the address + phone + after-hours number to your pet's profile, and tap a "Schedule appointment" button on any vaccine card to call or open Maps directions in one motion.
> - Eliminates the "where's the vet's number?" panic moment. Especially useful for newly-rescued pets or anyone with multiple pets across multiple clinics.
> - Status: in development
> - Version: v1.2

> **Defensible data sourcing copy** — Clear About section explaining the peer-reviewed veterinary research backbone.
> - In-app copy spelling out where breed-specific guidance, mortality framing, and preventative cadences come from (AKC breed clubs, AAHA, ACVS, peer-reviewed journals like JAVMA and JVIM, breed health foundations like Berner-Garde). Includes a per-claim source list users can tap into.
> - Builds trust with skeptical owners and gives FloofLife a defensible position in conversations with vets, breed clubs, and reviewers. "A LLM-generated wellness app" vs "a clinically-grounded reference tool" is the gap this closes.
> - Status: in development
> - Version: v1.2

---

## v1.1 (in TestFlight, build 6 — uploaded 2026-05-04)

> **Premium subscription** — Unlock multi-pet, expanded breed depth, and health tracking.
> - $4.99/month or $39/year (35% savings). Annual includes a 7-day free trial. Subscriptions are processed by Apple StoreKit through RevenueCat — no separate account creation, manage or cancel from iPhone Settings.
> - Gives serious pet owners a clean upgrade path to features they've been asking for, while keeping the v1 free tier intact for casual users.
> - Status: in TestFlight
> - Version: v1.1

> **Multi-pet support** — Add and manage multiple pets in one account.
> - Premium users can add a second, third, or fifth pet to FloofLife. Each pet gets its own breed-tailored weekly checklist, photo, age tracker, and breed insider tips. Pets are sorted oldest-first on the "Your Pets" screen so the elders surface naturally.
> - Multi-pet households are the majority of dog and cat owners in the US. Until v1.1 they had to pick a favorite to put in the app. Not anymore.
> - Status: in TestFlight
> - Version: v1.1

> **Restore purchases** — One tap to bring your subscription back on a new phone.
> - Users who reinstall FloofLife or switch devices can tap "Restore purchases" on the Premium screen and get their entitlement back instantly via the Apple ID that paid for it.
> - Required by App Store Review Guidelines and good for users — no support tickets, no lost subscriptions.
> - Status: in TestFlight
> - Version: v1.1

---

## v1.0.1 (shipped 2026-04-30)

> **Softer breed health language** — Replaced clinical mortality framing with empathetic "needs extra care due to heightened [X] risk" wording.
> - A real user (Bernese Mountain Dog owner) flagged that the original copy felt blunt and emotionally heavy. We audited every breed entry and rewrote the harshest lines across Doberman, Boxer, Bernese Mountain Dog, Burmese, and Great Dane. We also moved the detailed health considerations behind a "Tap to learn more" disclosure on the breed card so the information is available but not in your face.
> - The information is the same; the relationship to the user isn't. FloofLife earns trust by telling people the truth about their breed without making them feel awful when they open the app.
> - Status: shipped (App Store, build 5)
> - Version: v1.0.1

---

## v1.0 (shipped 2026-04-29)

> **FloofLife — Better pet parenting, on autopilot.**
> - Personalized weekly checklist by breed + age + season, breed-specific care tips, toxic foods/plants reference, recall feed, vets-near-me search, age-in-human-years calculator, emergency resources, trip planning, training exercises, risk map.
> - Status: shipped (App Store)
> - Version: v1.0

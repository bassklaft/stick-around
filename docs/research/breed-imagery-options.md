# Breed Imagery Options — Research Write-Up (Part 3.J)

**Status:** Research only — no code or image generation done. This document presents options for the user to choose from before any implementation begins.

**Date:** 2026-05-08
**Context:** The current emoji system (`BREED_EMOJI` in `src/data/breeds.js`) uses generic emoji that fail to differentiate breeds — the same orange tabby 🐈 appears for Abyssinian, Burmese, and Norwegian Forest Cat; the same generic 🐕 covers many dogs. This violates the "we know YOUR breed" brand promise that's central to the FloofLife product principle.

User-stated constraints:
- **Cannot use Google Images** — copyrighted, would expose us to takedown notices, App Store rejection, and lawsuits.
- **Bootstrap-mode founder** — cost matters; ~$30-50/mo recurring is fine, $1,000+ upfront is not.
- **Coverage** must be all breeds in the catalog (currently 80+ entries; growing toward 100+ with the v1.2 expansion).
- **Visual consistency** matters — the imagery should feel like one unified design language, not a Frankenstein of mismatched styles.

---

## Option A — Free royalty-free stock photo services

**Sources:** Unsplash, Pexels, Pixabay.

**License:** All three offer photos under their respective free licenses that permit commercial use without attribution (Unsplash License, Pexels License, Pixabay License). All three explicitly permit use in mobile apps. **Verify each photo individually** — some photographers attach extra restrictions, and some platforms have changed terms over time.

**Coverage:** Strong for the most popular ~30 breeds (Lab, Golden, Poodle, Persian, Maine Coon). Drops sharply for less common breeds. Many entries return zero matches or only stock photos that don't visually represent the breed well (Italian Greyhound, Norwegian Forest Cat, Sphynx, Birman are typically thin).

**Cost:** $0/mo.

**Visual consistency:** Poor. Each photo is a different photographer, lighting setup, background, pose, color grading. Side by side they look like a thrift-store collection, not a designed brand asset.

**Time to implement:** 8-15 hours of manual sourcing for current catalog. Each entry requires: searching, selecting, downloading, attribution-checking, color-correcting (or accepting inconsistency), bundling into the app or hosting on a CDN. Plus license-verification time per image.

**Verdict:** Acceptable as a stopgap for a small subset of breeds, but the visual inconsistency makes it incompatible with the brand-promise framing. Doesn't scale to the full catalog without long-tail gaps.

---

## Option B — Licensed stock photos (Shutterstock, Adobe Stock, iStock)

**License:** Standard commercial license per image, typically valid for use in mobile apps.

**Coverage:** Strong for nearly every named breed. Less common breeds (Xoloitzcuintli, Pixie-Bob) sometimes thin but generally present.

**Cost:** Roughly $10-30 per standard license image, or subscription tiers (~$30-50/mo for limited downloads, ~$200/mo for higher tiers). At 80-100 breeds × $15-30 = **$1,200-3,000 upfront**, OR 4-6 months of a higher subscription tier to download progressively.

**Visual consistency:** Better than free stock (curated photographers, often professional studio lighting), but still not unified — different photographers, different settings, different breeds.

**Time to implement:** Similar to Option A, plus license-tracking. Subscription tier means staying within download limits per month.

**Verdict:** **Too expensive for current stage.** Even at the lower end ($1,200) it's outside the bootstrap budget. The visual-consistency improvement over free stock is real but not transformative.

---

## Option C — Custom illustrations commissioned

**Source:** A commissioned illustrator (Upwork, Dribbble, behance contracts).

**License:** Commissioned work-for-hire, full ownership.

**Coverage:** Whatever you commission — typically scoped per project.

**Cost:** $30-150 per illustration depending on illustrator skill level and complexity. At 80-100 breeds, that's **$2,400-15,000**. Plus revision rounds and onboarding cost.

**Visual consistency:** Excellent if commissioned from a single illustrator with a clear style guide. The strongest option for brand-consistency.

**Time to implement:** 2-4 months elapsed time (illustrator scheduling, iteration, delivery). Not workable for a v1.2 ship in the next few weeks.

**Verdict:** Best long-term option for visual quality, but **too expensive and too slow for current stage.** Worth revisiting at v1.5 or v2.0 when revenue justifies the investment.

---

## Option D — AI-generated illustrations in a consistent style

**Sources:** Midjourney, DALL·E 3, Stable Diffusion (commercial-licensed via providers like Replicate or RunwayML), Imagen.

**License:** Varies by provider. **Critical to verify the specific terms before committing:**
- Midjourney's Standard / Pro / Mega tiers grant commercial use with appropriate plan ($30-120/mo subscription).
- DALL·E 3 outputs are owned by the user generating them (commercial use permitted), per OpenAI's terms.
- Stable Diffusion outputs are typically permissive but providers may have their own terms.
- **Confirm at time of use** — terms have shifted across providers in 2024-2026.

Some providers prohibit using the outputs for training competing AI models, but mobile-app inclusion is universally permitted across the major providers.

**Coverage:** Unlimited — you generate one for each breed, and additional ones for new breeds as the catalog grows. Genuinely scales with the v1.3 / v1.4 expansion.

**Cost:** ~$30/mo Midjourney, OR pay-per-image via Replicate/Stability ($0.02-0.10 per image generation). At 80-100 breeds × $0.10 = **~$10 one-time** + subscription if iterating heavily. Far cheaper than commissioned illustration, far cheaper than licensed stock.

**Visual consistency:** **The strongest argument for this option.** A single style prompt applied across all breeds gives a unified brand asset that's not achievable with stock photography. Iteration is fast (re-generate, tweak prompt, accept).

**Time to implement:** 6-15 hours total — generate, review, iterate, finalize. Plus brand-style decisions upfront (illustrative? watercolor? line-art? geometric?).

**Risks / caveats:**
- AI-generated outputs occasionally have anatomical errors (extra limbs, wrong proportions) — manual review per image is required.
- Some breeds are under-represented in training data and may produce less accurate likenesses (Xoloitzcuintli, Lykoi, breed-specific cat color patterns).
- App Store policy currently permits AI-generated assets in apps; this could change.
- The visual style might feel "AI-y" to users who recognize the aesthetic. Style choice mitigates this — abstract / illustrative styles age better than photoreal.

**Verdict:** **Recommended option** for the FloofLife stage. Lowest cost, highest scalability, strongest visual consistency, fastest iteration. Manual review per breed is the main labor cost; generation is cheap.

---

## Option E — Existing icon libraries

**Sources:** SF Symbols (Apple), Iconify (multi-source), Phosphor Icons, Heroicons, FontAwesome Pro.

**License:** Varies. SF Symbols are Apple-platform-restricted and free; Iconify aggregates many libraries with different terms; FontAwesome Pro requires subscription.

**Coverage:** Generally LIMITED for breed-specific imagery. Most icon libraries have a generic dog and a generic cat — not a Bichon Frise vs. a Bulldog. Few libraries target breed-level differentiation.

**Cost:** $0-30/mo depending on library. SF Symbols is free. FontAwesome Pro is ~$100/year.

**Visual consistency:** Excellent within a chosen library — the whole point of icon libraries is consistency. But the absence of breed-specific icons defeats the purpose.

**Time to implement:** Hours, not days. Drop-in.

**Verdict:** **Insufficient for breed differentiation.** Could complement another option for non-breed UI elements (Settings rows, navigation chevrons), but doesn't solve the breed-imagery problem.

---

## Recommendation

**Primary: Option D (AI-generated illustrations).** Lowest cost, highest scalability, best visual consistency for the bootstrap stage. ~$30/mo for Midjourney or pay-per-image via Stability/Replicate covers all current and future breeds.

**Style suggestion:** Flat-illustrated, slightly stylized, single-color-background. Avoid photoreal (the AI artifacts are more visible there) and avoid heavily-textured (consistency suffers). The Duolingo-mascot or Headspace-character aesthetic ages well and feels brand-cohesive.

**Workflow if approved:**
1. User picks a style direction (3-5 reference styles to compare).
2. Generate 5-10 sample images across diverse breeds (Lab, Persian, Sphynx, Bulldog, Italian Greyhound) to validate the style.
3. Iterate on style prompt until samples feel consistent.
4. Batch-generate one image per breed in the catalog (~80-100 images total).
5. Manual review per image — re-generate or accept.
6. Bundle as PNGs in the app or host on a CDN; update `src/data/breeds.js` to reference image paths instead of (or alongside) the existing `BREED_EMOJI` map.
7. UI changes: replace the `breedEmoji()` calls in `YourPetsScreen.js`, `OnboardingScreen.js`, and `HomeScreen.js` with image components. Keep the emoji fallback for unknown breeds.

**Backup option: Option A (free stock)** for the top-30 most-searched breeds, accepting visual inconsistency, while waiting on AI generation. Ships the worst-offender gaps fast (Lab, Golden, Persian, Maine Coon, Frenchie) while the AI workflow gets built.

**Deferred for future revisit:**
- **Option B (licensed stock)** — too expensive for current stage; revisit if a budget materializes.
- **Option C (commissioned)** — best long-term option for visual quality but multi-month timeline + multi-thousand-dollar cost; revisit at v1.5+ when revenue justifies it.
- **Option E (icon libraries)** — useful for non-breed UI consistency but doesn't solve breed differentiation.

---

## Decisions Needed From You

Before any implementation begins:

1. **Approve Option D as the primary direction?** (Yes / No / Other.) If yes, I scope the workflow.
2. **Style preference?** Flat-illustrated, watercolor, geometric, line-art, photoreal, hybrid? Pick a reference aesthetic if you have one in mind.
3. **Provider preference?** Midjourney (subscription, polished outputs) vs. Stability/Replicate (pay-per-image, more flexible). I lean Midjourney for ease but the cost calculus depends on your iteration appetite.
4. **Bundle vs. CDN?** Bundle in the app (no network, faster initial load, larger app size — currently the app bundle is small) vs. CDN (smaller app, image fetch on first view per breed). For 80-100 images at typical illustration size (~50-100 KB each), bundling adds 5-10 MB to the app — not trivial but not blocking.

For build 18 / v1.2.0: keep the current emoji system in place. Mark this as a known issue in `V1_REMOVED_FEATURES.md` so it doesn't get lost. Tackle the imagery in v1.3 or v1.4 once a direction is picked.

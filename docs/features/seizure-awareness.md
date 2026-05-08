# Seizure Awareness (v1.4 Layer 1, v2.0 Layer 2 + 3)

## Goal

A three-layer system for owners of seizure-prone or epileptic pets: (1) educational content surfaced contextually when the user logs an at-risk preventative or sees a vaccine reminder, (2) a structured seizure tracker — duration, type, postictal recovery time, triggers, video — that gives a vet far more than a frantic verbal description can, and (3) a future cross-reference layer that connects logged seizures to logged flea/tick preventative timing, vaccine timing, food brands, and other potential triggers, surfacing "the day before this seizure, [event] happened" patterns. The seizure space is one of FloofLife's highest-value content opportunities because owner-facing seizure information is fragmented and emotionally charged.

**Critical content rule (Path C language guardrail):** seizure content touches the isoxazoline-class flea/tick controversy (Bravecto, Nexgard, Simparica, Credelio + FDA September 2018 safety communication). FloofLife's stance is **explicit dual-perspective surfacing with sourcing — never pick a side.** A pet owner who reads our content should leave more informed, not pushed toward one camp. The FDA communication is real and worth knowing; equally, the products work for most dogs and the FDA itself stops short of advising against use. Surface both.

## Founder Anchor

Seizure events are isolating and traumatic for owners. Most never get a clean answer about cause; many feel guilty afterward. FloofLife's value-add is structure: a clean log the vet can read in 30 seconds + an honest dual-perspective on isoxazolines + a never-implied judgment of the owner's past choices. The Layer 2 tracker is for the moment after a seizure when an owner is shaking and trying to remember if it was 30 seconds or 90 seconds — the app should make logging frictionless.

## User Flow

### Layer 1 — Education (v1.4)
1. Surfaces in three contexts:
   - User logs an isoxazoline-class flea/tick product (e.g., Bravecto/Nexgard/Simparica/Credelio) → soft info card after save: "These products are FDA-flagged for potential neurological effects in dogs with seizure history. Some vets prescribe them with monitoring; others avoid in seizure-prone dogs. Discuss with your vet." Tap → full Layer 1 content page.
   - User views a vaccine reminder → if breed is on the seizure-predisposed list (Border Collie, Australian Shepherd, Golden Retriever, Labrador, Vizsla, Beagle, Belgian Malinois, German Shepherd, Tervuren, Standard Poodle, Boxer, Cocker Spaniel) AND the vaccine is one with reported neurological adverse events, surface a soft info card.
   - User opens the Pet Detail screen and the pet has logged ≥1 seizure → "Seizure resources for [pet name]" card visible at top.
2. Layer 1 content pages:
   - "What is a seizure" — 3 paragraphs, neutral, informational. Defines focal vs generalized; common signs; what to time.
   - "Isoxazoline class flea/tick — what the FDA says, what vets say" — dual-perspective. Verbatim FDA quote. Counter-perspective from AVMA + practicing vets. Always frames as "discuss with your vet" with bullet questions to bring.
   - "Seizure-predisposed breeds" — list with citations. Frame as "these breeds have higher reported rates per peer-reviewed lit" — never as deterministic.
   - "What to do during and after a seizure" — vet-discussion framed checklist. Time the event. Don't hold the pet down. Let the postictal phase resolve. Call the vet if it's the first seizure or lasts >5 minutes (status epilepticus → emergency).

### Layer 2 — Tracker (v2.0)
1. From Pet Detail or "+" tab → "Log a seizure."
2. **Step 1 — Live timer**: a big "Start timer" button. The owner taps when the seizure begins; tap again to stop. If the owner wasn't fast enough, manually enter duration.
3. **Step 2 — Type**: focal (twitching one limb / facial), generalized (full-body convulsion), absence (staring into space, unresponsive). Plain-language descriptions with vet-vetted illustrations.
4. **Step 3 — Pre-ictal signs**: behavior change in the hour before? Y/N + tags (restless, seeking owner, hiding, vocalizing, eating differently).
5. **Step 4 — Postictal recovery**: how long until the dog seemed normal? Tags (disoriented, blind, hungry, thirsty, sleepy).
6. **Step 5 — Video** (optional, encouraged): vet diagnosis is far more accurate when the vet sees footage. Video stays on-device unless backend sync is opted-in.
7. **Step 6 — Recent context**: auto-populated. Last flea/tick dose date + brand. Last vaccine date. Recent dietary change. New environment. The owner can confirm or edit.
8. **Step 7 — Save + share**: option to share the log + video with vet via email or share sheet.
9. **Auto-suggested follow-ups**: "If this is [pet name]'s first seizure, an ER visit may be warranted. If this is the [Nth] in 24 hours (cluster), call your vet now (cluster seizures are an emergency)."

### Layer 3 — Cross-reference (v2.0+)
1. Pattern card on the Pet Detail screen if the user has ≥2 logged seizures.
2. "We noticed: 2 of [pet name]'s 3 logged seizures occurred within 14 days of an isoxazoline-class flea/tick dose. This may or may not be related — discuss with your vet."
3. Pattern detection rules surfaced honestly:
   - Same brand pre-seizure ≥2x → flag.
   - Same vaccine pre-seizure ≥2x → flag.
   - Same food change pre-seizure → flag.
   - Time-of-day clustering → flag (some seizure disorders cluster at sleep/wake).
4. Always framed as "may or may not be related — discuss with your vet." Never causal.

## Data Model

### AsyncStorage (local-only)
```
pawrent_seizure_log_v1: { [petId]: SeizureEntry[] }
```
SeizureEntry shape:
```json
{
  "id": "sz_xyz",
  "ts": 1715200800000,
  "durationSeconds": 78,
  "type": "generalized",
  "preIctalSigns": ["restless"],
  "postIctalRecoveryMinutes": 45,
  "postIctalSigns": ["disoriented","hungry"],
  "videoUri": "file:///.../seizure_xyz.mp4",
  "recentContext": {
    "lastFleaTickDose": { "ts": 1714000000000, "brand": "(generic isoxazoline)" },
    "lastVaccine": null,
    "recentDietChange": false
  },
  "vetDiscussed": false
}
```

### Backend (Supabase)
```sql
create table seizure_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pet_id uuid references pets not null,
  ts timestamptz not null,
  duration_seconds int not null,
  type text not null check (type in ('focal','generalized','absence','unknown')),
  pre_ictal_signs jsonb,
  post_ictal_recovery_minutes int,
  post_ictal_signs jsonb,
  video_url text,
  recent_context jsonb,
  vet_discussed boolean default false,
  created_at timestamptz default now()
);
create index seizure_entries_user_pet_ts_idx on seizure_entries (user_id, pet_id, ts desc);

alter table seizure_entries enable row level security;
create policy "users own seizure entries" on seizure_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Videos: stored in private R2 bucket `floof-seizure-videos`. **Strongly considered: never sync videos to backend by default.** Seizure videos are emotionally sensitive. Offer Premium-only opt-in cloud sync with explicit disclosure.

### Migration
First-launch v1.4 / v2.0: empty seizure log per pet. Existing users not affected.

### Schema versioning
`v1` suffix on the AsyncStorage key. Future fields (e.g., medication response) bump to `v2`.

### Local-only fallback
Layer 1 content fully bundled in app — no network needed. Layer 2 tracker fully offline. Layer 3 cross-reference runs locally on the device.

## UI Components

### New screens
- `SeizureLayer1ContentScreen` — informational pages.
- `LogSeizureScreen` — multi-step form with live timer.
- `SeizureHistoryScreen` — past seizures + cross-reference patterns.
- `SeizureDetailScreen` — single-entry detail.

### Modified screens
- `PetDetailScreen` (or `YourPetsScreen`) — surface seizure resources card if ≥1 logged seizure.
- `App.js` — register new routes.
- `HomeScreen.js` — surface a "log a seizure" quick-add tile if any pet has any logged seizure.

### New reusable components
- `<SeizureTimer running onStart onStop />` — big-button timer with second display.
- `<DualPerspectiveCard topic source1Label source1Url source2Label source2Url />` — used for the isoxazoline content. Shows both sides with citations.
- `<SeizurePatternCard pattern />` — Layer 3 pattern banner.

## Free vs Premium Gating

- **Free**: Layer 1 educational content (full access, never paywalled — safety-critical), Layer 2 tracker (full logging, video on-device), Layer 3 pattern cross-reference (basic patterns).
- **Premium**: video cloud sync (opt-in, with explicit disclosure), unlimited history beyond 90 days, advanced pattern correlation (Layer 3+), PDF/video bundle export for vet visits, push notification when a seizure-prone trigger event occurs (e.g., scheduled flea/tick dose for a seizure-prone pet).
- **Rationale**: education and basic logging are safety. Cloud sync of videos is convenience. Pattern correlation depth is convenience.
- **Upgrade prompt**: appears once at the bottom of `SeizureHistoryScreen` after the user has logged ≥2 seizures. Soft.
- **Grandfather**: existing v1.0/v1.1 free users get the same free tier.

## Sources & Citations (CRITICAL — content-heavy feature)

- [FDA Animal Drug Safety Communication, September 2018: Neurologic Adverse Events with Isoxazoline Class Flea/Tick Products](https://www.fda.gov/animal-veterinary/cvm-updates/fda-alerts-pet-owners-and-veterinarians-about-potential-neurologic-adverse-events-associated-certain) — primary source for the isoxazoline framing. Verbatim relevant quote in app.
- [AVMA on flea/tick prevention](https://www.avma.org/) — counter-perspective: products work; vets prescribe with monitoring.
- [ACVIM Consensus Statement on Idiopathic Epilepsy in Dogs](https://onlinelibrary.wiley.com/journal/19391676) — peer-reviewed reference on epilepsy diagnosis + management.
- [International Veterinary Epilepsy Task Force (IVETF) consensus papers](https://bmcvetres.biomedcentral.com/) — gold-standard veterinary literature on canine epilepsy.
- [AKC Canine Health Foundation — Epilepsy](https://www.akcchf.org/) — owner-facing version of peer-reviewed work.
- [Cornell Riney Canine Health Center — Epilepsy](https://www.vet.cornell.edu/) — additional reference.
- [Merck Veterinary Manual — Seizures in dogs and cats](https://www.merckvetmanual.com/) — clinical reference.
- For breed-predisposition lists, cite the IVETF + breed-club-specific research. Never use forum / hearsay sources.

## Language Guardrails

**Good — dual-perspective example for isoxazolines (verbatim template)**:

> Isoxazoline-class flea/tick products (Bravecto, Nexgard, Simparica, Credelio) are FDA-approved for use in dogs and cats. In September 2018, the FDA issued an Animal Drug Safety Communication noting potential for neurological adverse events including muscle tremors, ataxia, and seizures, particularly in animals with a history of seizures. The FDA did not recommend against use; the AVMA and most practicing veterinarians continue to prescribe these products, often with extra monitoring in seizure-prone animals. Some owners and some practitioners prefer alternatives (older oral chemistries like spinosad, topicals, environmental tick management) for seizure-prone pets.
>
> If your pet has a seizure history or is in a seizure-predisposed breed, discuss with your vet:
> - Is an isoxazoline appropriate for [pet name]?
> - What signs would warrant calling you immediately after a dose?
> - Are there alternatives suitable for our region's tick load?
>
> Sources: FDA Animal Drug Safety Communication, September 2018 · AVMA position on parasiticide use · ACVIM consensus.

**Good — neutral seizure context**:
- "Idiopathic epilepsy is the most common cause of recurrent seizures in dogs (IVETF consensus). Diagnosis is one of exclusion; discuss workup with your vet."
- "Status epilepticus (a seizure lasting >5 minutes or back-to-back without recovery) is a veterinary emergency. Call your vet immediately."

**Bad — explicit no-go examples**:
- "Bravecto causes seizures." (oversimplified; not what the FDA said).
- "Don't use Nexgard." (we don't pick sides).
- "Use Frontline instead." (brand recommendation).
- "Stop the medication." (medication-direction without vet).
- "Phenobarbital 2mg/kg BID." (drug dose).
- "Your dog has epilepsy." (diagnosis claim).
- Any advice that tells the owner to override their vet's prescription.

**Brand discipline**: when naming isoxazolines specifically, use the four FDA-named brands (Bravecto, Nexgard, Simparica, Credelio) since the FDA communication names them by brand. In all other contexts use the generic class ("isoxazoline-class"). Use "tetracycline-class" not "doxycycline" in tickborne disease contexts.

## Edge Cases & Error States

- **Empty state (Layer 2)**: tracker shows "Log a seizure if it happens. Hope you never need to."
- **Video too long for backend (over R2 size limit, e.g., 100 MB)**: keep on-device; offer to share via system share sheet (AirDrop, email) instead of cloud sync.
- **Permission denied (camera/photo for video)**: log saves without video. Add a one-line hint about how video helps the vet.
- **Multi-pet**: each pet has its own seizure log. Cross-reference doesn't span pets (epilepsy isn't transmissible).
- **iCloud transfer**: AsyncStorage data restores. Backend sync re-pushes on first signed-in launch. Videos in app's documents directory are restored via iCloud backup if user has it on.
- **Auth state**: anonymous users have full local logging + content. Pattern detection runs locally.
- **First seizure ever**: surface "this is your first logged seizure. If this is also your pet's first seizure ever, an ER visit is typically warranted. Discuss with your vet."
- **Status epilepticus (>5 min)**: surface a HIGHLIGHTED red banner: "This is a veterinary emergency. Call your vet now." Banner appears as soon as the timer crosses 5 minutes.
- **Cluster seizures (≥2 in 24 hours)**: surface "This is the [Nth] seizure in 24 hours. Call your vet now."
- **Backend video sync fails**: keep retrying in background; log entry saves regardless.

## Analytics Events to Fire

- `seizure_layer1_viewed` — `{ topic: 'what_is_a_seizure'|'isoxazoline_dual'|'breeds'|'during_after', pet_species: 'dog'|'cat' }`. No PII.
- `seizure_logged` — `{ duration_bucket: '<60s'|'60-120s'|'120-300s'|'>300s', type: 'focal'|'generalized'|'absence'|'unknown', has_video: bool, pet_species: 'dog'|'cat' }`. NEVER track exact duration, video bytes/URL, or signs verbatim.
- `seizure_emergency_banner_shown` — `{ trigger: 'status_epilepticus'|'cluster_seizures'|'first_ever' }`.
- `seizure_pattern_detected` — `{ pattern_type: 'isoxazoline_correlation'|'vaccine_correlation'|'food_correlation'|'time_of_day' }`.
- `seizure_share_export` — `{ format: 'pdf'|'video_bundle'|'text', day_count: int }`.
- Privacy: NEVER track the pet name, video, signs verbatim, or specific brand names from `recent_context`.

## Apple Review Risk Assessment

- **Guideline 1.4.1 (Safety - Medical) — VERY HIGH attention**. This is among the highest-risk content in the app.
- **Mitigations**:
  - Every health line is "discuss with your vet" framed.
  - The dual-perspective isoxazoline framing avoids picking a side and follows the actual FDA + AVMA positions.
  - No drug doses, no medication recommendations, no "stop / start / switch" instructions.
  - The status-epilepticus emergency banner directs to vet, not to a self-administered protocol.
  - Disclaimer prominent: "This app does not diagnose, treat, or prescribe. It helps you log and discuss with your vet."
- **DVM advisor sign-off REQUIRED before shipping Layer 2 + 3.** Same gating logic as CPR — no licensed-vet review = no ship.
- **Guideline 5.1 (Privacy)**: video upload is opt-in only, with explicit disclosure of where it's stored (R2) and who can access it (only the user).
- **Guideline 4.5 (Spam / repetitive)**: pattern cross-reference must not be alarmist. Cap at 1 pattern banner per pet per visible session.
- New permission strings: `NSCameraUsageDescription` (for video) — verify wording specifies "to record seizure footage for your vet."

## Implementation Estimate

- New files: ~8-10 (4 screens, 3-4 components, 1 storage helper, 1 pattern-detection helper).
- Modified files: 3-4 (`App.js`, `PetDetailScreen.js`, `HomeScreen.js`, `analytics.js`).
- Build budget: Layer 1 + 2 = 1 build (v1.4). Layer 3 = its own build (v2.0).
- Time estimate: Layer 1 = 6-8 hours (mostly content writing + sourcing). Layer 2 = 12-15 hours (timer, video, multi-step form, vet-share). Layer 3 = 8-10 hours (pattern detection + UI).
- Backend work: 1 table + RLS + R2 bucket. Layer 3 patterns run client-side; no server compute.

## Open Questions / Decisions Needed

1. **DVM advisor signed?** Hard gate. Layer 1 content + Layer 2 tracker should be reviewed by a licensed vet before App Store submission. Same gating as CPR.
2. **Isoxazoline framing — final wording**. Above is a draft; needs DVM + (possibly) attorney sign-off before shipping. The legal risk in seizure content + brand-named products is non-trivial — potential defamation / interference-with-prescription claims if the framing skews even slightly.
3. **Video retention** — local indefinite vs. local 1 year vs. backend sync only Premium. Recommend backend opt-in for Premium with explicit consent flow.
4. **Pattern detection thresholds** — ≥2 correlated events surfaces a pattern card. Could be ≥3 for stricter signal. Recommend 2 with strong "may or may not be related" framing.
5. **Cluster vs. status epilepticus distinction** — current spec uses 5 min for status, 2 in 24 h for cluster. Confirm with DVM advisor.
6. **Breed predisposition list** — current list above is from public veterinary literature, but should be DVM-reviewed before shipping.
7. **Layer 1 content as bundled JSON vs. backend-served Markdown** — bundled JSON ships with the app (no network), but updates require a build. Backend-served allows faster correction of medical errata. Recommend bundled JSON for v1.4 + backend-served Layer 1 update mechanism in v2.0.
8. **Owner emotional state** — most owners log a seizure within minutes of it happening. UX must be calm, not flashy. No celebratory animations, no haptic flourish. Sober, fast, vet-share-ready.

## Out of Scope (for v1.4 / v2.0)

- AI video analysis to auto-detect seizure type — too high risk for v1, hard to validate.
- Real-time seizure detection from a wearable / collar — partnerships only, v3+.
- Medication tracker integration (Phenobarbital, Keppra) — not in v1.4 / v2.0; comes with the broader medication-tracker spec (separate from this).
- Direct vet messaging from a seizure log — partnerships only.
- Insurance claim integration — partnerships only.
- Genetic test integration (Embark, Wisdom Panel) for epilepsy markers — v3+.
- Crowdsourced seizure trigger reporting (other dogs in your area + same brand + seizures) — explicit non-goal for privacy + signal-to-noise.

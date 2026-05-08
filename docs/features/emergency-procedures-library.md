# Emergency Procedures Library (v2.0 — conservative path)

## Goal

A vet-reviewed library of common pet emergency assessments — temperature checking, fever signs, hypothermia recognition, cooling steps for heat stroke, basic wound assessment, choking recognition (without the Heimlich-style intervention), shock signs — that a worried owner can reference *while waiting for or driving to a vet*. The library deliberately does NOT include CPR illustrations, drug administration, or any procedure that could cause harm if done wrong without supervision. The conservative path: ship what's defensible without a signed DVM partnership; reserve CPR + intervention content for a v3+ release with vet advisor + insurance + attorney review in place.

This spec is explicitly **gated** behind three external sign-offs (vet, insurance, attorney). The implementation work is small — the gate is most of the value of writing this spec.

## Founder Anchor

The pre-strip v1.0 of FloofLife included CPR illustrations (chest-type-specific hand placement, depth, rate, ratio). They were stripped before App Store submission per V1_REMOVED_FEATURES.md because medical-instruction review for pet apps is strict and the rejection risk was high. The right path forward is *not* to bring CPR back as soon as possible — it's to **build trust through defensible content first**, partner with a vet, then add the more complex procedures with an actual reviewed-by-licensed-DVM endorsement. This spec captures the conservative-path content and prominently flags the gating for the harder content.

## User Flow

### Entry points
1. **Emergency tab** (already exists; this feature augments it). Tab → "Procedures library" section.
2. **Tummy Tracker** vet-suggestion banner → if banner indicates emergency-level concern (melena, cluster issues), surface "Cooling steps if heat stroke" / "Temperature check" entries as relevant.
3. **Tick log** treatment context → links into the relevant procedures (fever recognition, etc.).
4. **Search**: a procedures-search bar at top of the Emergency tab.

### Procedures included (v2.0 scope, conservative)
1. **Temperature checking** — when, how (rectal thermometer is the standard; ear thermometers exist but are less reliable per VCA), normal range (dog 100.5-102.5°F, cat 100.4-102.5°F per Merck). Frame as: "Use a digital thermometer with a small amount of lubricant. Insert ~1 inch into the rectum, hold for the device's reading time. Discuss results with your vet — fever is anything above 103°F."
2. **Fever recognition (without thermometer)** — warm ears, dry nose, lethargy, panting, decreased appetite. Frame as "may indicate fever; ideally confirm with a thermometer. Discuss with your vet."
3. **Hypothermia recognition** — shivering, lethargy, slow pulse, dilated pupils. Cold-weather-warning context.
4. **Cooling steps for suspected heat stroke** — move to shade, wet (not ice-cold) water on paws + belly + groin, fan, drive to vet immediately. Critical: heat stroke is always a vet emergency; cooling steps are *during transport*, not instead of vet care.
5. **Choking recognition** — frantic pawing at mouth, blue gums, panic. Frame as "stay calm, move to vet immediately, do NOT attempt to pull foreign objects out without veterinary guidance — risk of pushing further or laceration."
6. **Shock signs** — pale or blue gums, weak pulse, rapid breathing, cold extremities. Frame as "veterinary emergency. Wrap in a blanket and transport immediately. Call ahead so the ER can prepare."
7. **Bleeding assessment** — when to apply pressure (any visible active bleeding), when to elevate (if extremity, above heart), when to wrap (if pressure-only doesn't reduce bleeding within 5 minutes). Frame as "apply firm pressure; transport to vet. Do not apply tourniquet unless trained."
8. **Pain recognition** — silent indicators (hiding, hunched posture, panting at rest, refusal to lie down or get up). Owner-facing reference.
9. **Poison control protocol** — already exists in v1.0 EmergencyScreen, augmented here: do NOT induce vomiting without vet/poison-control instruction (some toxins cause more harm coming back up). Call ASPCA APCC ($95 fee) or Pet Poison Helpline ($85 fee).

### Excluded from v2.0 (gating-required)
1. **CPR** — chest-type-specific compressions, hand placement, ratio, rescue breathing. Requires vet advisor + insurance + attorney sign-off. Defer to v3+.
2. **Heimlich-style intervention for choking** — same gating. Risk of pushing object further or causing thoracic injury.
3. **Wound suturing / butterfly bandage application** — vet-only.
4. **Snake bite intervention** — first aid is contested even among DVMs (don't suck the venom, don't apply tourniquet, don't ice). Recommend "vet immediately, call ahead" with no procedural detail.
5. **Drug administration of any kind** — never inline.
6. **Bone-setting** — never inline.

### Per-procedure card design
1. Tap a procedure → full-screen detail.
2. Sections per card:
   - "Recognize" — signs / when this applies
   - "What to do" — conservative, vet-routing-focused
   - "What NOT to do" — common mistakes (e.g., for heat stroke: ice-cold water can cause vasoconstriction and worsen the issue)
   - "Discuss with your vet" — concrete questions to bring
   - "Sources" — citations
3. Bottom of every card: "Call your vet first if you have any doubt."

## Data Model

Procedures library is bundled content, not user-generated. Stored as a JSON / JS data file `src/data/emergencyProcedures.js`. No backend table needed for the library itself.

### AsyncStorage (local-only, for usage analytics)
```
pawrent_emergency_views_v1: { [procedureId]: { lastViewedAt: timestamp, viewCount: int } }
```

### Backend (Supabase) — minimal
```sql
create table emergency_procedure_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  procedure_id text not null,
  viewed_at timestamptz default now(),
  pet_species text
);
create index emergency_procedure_views_user_idx on emergency_procedure_views (user_id, viewed_at desc);

alter table emergency_procedure_views enable row level security;
create policy "users own views" on emergency_procedure_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Views table is for engagement analytics + understanding which procedures owners need most. It is anonymized for aggregate use (no PII tied to procedure usage at the aggregate level — RLS limits user reads to their own).

### Migration
First-launch v2.0: empty views log. Existing Emergency screen content (poison hotlines, vet finder, AAHA + ASPCA) preserved — Procedures library is additive.

### Schema versioning
Procedures content carries a `version` field per procedure so the app can show "Last updated [date]" and we can iterate procedures without breaking older clients. Backend-served updates considered for v3+ to avoid app rebuilds for content fixes.

### Local-only fallback
Full feature works offline (procedures are bundled). View analytics queue and sync when online.

## UI Components

### New screens
- `EmergencyProceduresScreen` — list of procedures with search.
- `EmergencyProcedureDetailScreen` — full card view per procedure.

### Modified screens
- `EmergencyScreen.js` — add the Procedures library section above the existing toxic-ingestion + vet finder + hotlines sections.
- `App.js` — register new routes.

### New reusable components
- `<ProcedureCard procedure pet />` — list-item card.
- `<ProcedureSection title body type='recognize'|'do'|'dont'|'vet_questions'|'sources' />` — per-section block within a procedure detail.
- `<EmergencyDisclaimerBanner />` — persistent banner at top of procedures screens.

## Free vs Premium Gating

- **Free**: ALL conservative-path procedures. ALL safety content is free, period. This is non-negotiable for the same ethical + Apple-review reasons as the Tummy Tracker recall match.
- **Premium**: nothing additional in the procedures library. (Premium upsells live elsewhere — Pawgress, Tummy patterns, paywall-gated checklist refresh, etc.)
- **Rationale**: emergency information cannot be paywalled. Pet life-safety > subscription revenue. Apple review would likely flag any paywall here.
- **Upgrade prompt**: never on emergency procedures.

## Sources & Citations (CRITICAL — content-heavy and high-stakes)

- [Merck Veterinary Manual — Emergency Care for Pets](https://www.merckvetmanual.com/) — primary source for normal vital ranges, recognition signs.
- [AVMA — Pet First Aid Basics](https://www.avma.org/resources/pet-owners/petcare/pet-first-aid) — owner-facing guidance.
- [American Red Cross — Pet First Aid course](https://www.redcross.org/take-a-class/classes/pet-first-aid) — gold-standard course; link in-app for owners who want training.
- [VCA Animal Hospitals — clinical articles per condition](https://vcahospitals.com/) — owner-facing clinical content.
- [Cornell Riney Canine Health Center](https://www.vet.cornell.edu/) — peer-reviewed underpinning.
- [ASPCA Animal Poison Control Center (APCC)](https://www.aspca.org/pet-care/animal-poison-control) — already linked in v1.0; reference for poison protocols.
- [Pet Poison Helpline](https://www.petpoisonhelpline.com/) — already linked in v1.0; alternate hotline.
- [Veterinary Cooperative of Pet Owners (VCPO) on heat stroke](https://www.avma.org/) — for heat-stroke conservative cooling protocol.
- [AVECCT (American College of Veterinary Emergency and Critical Care)](https://acvecc.org/) — board-certified specialist organization; cite as the standard-of-care backstop for our framings.

Each procedure card cites at least 2 sources, with at least one peer-reviewed or board-cert organization.

## Language Guardrails

**Good — heat-stroke example**:
> Heat stroke is a veterinary emergency. While you transport [pet name] to the vet:
> - Move them to shade or air-conditioning immediately.
> - Apply *cool* (not ice-cold) water to paws, belly, and groin.
> - Use a fan to increase evaporation.
> - Call your vet en route so the ER can prepare.
>
> Do NOT use ice-cold water — vasoconstriction can worsen heat stroke (Merck Veterinary Manual). Do NOT skip the vet visit because the pet "seems better" — internal organ damage from heat stroke can present hours later.
>
> Sources: Merck Veterinary Manual · AVMA Pet First Aid · AVECCT consensus.

**Bad — explicit no-go**:
- "Do CPR." (gating-required content)
- "Give 1 mg/kg of [drug]." (drug administration — never)
- "Suture the wound." (vet-only)
- "Force water down their throat." (aspiration risk; harmful)
- "If your dog isn't breathing, do mouth-to-snout." (CPR-adjacent; gating-required)
- Any absolute claim ("this will save your pet's life").

Frame every procedure as: recognize → conservative action → vet → discussion. Never as "definitive treatment."

## Edge Cases & Error States

- **Empty state**: list view shows all procedures by default. Empty-state hint: "Start with Temperature Checking — useful to know any time."
- **Offline**: full functionality. Procedures bundled; hotlines surface their phone numbers.
- **Permission denied**: N/A.
- **Multi-pet**: procedures are species-agnostic where applicable; species-specific where applicable (cat heart rate range differs from dog). Each procedure card species-tags relevant sections.
- **iCloud transfer**: views log restores via AsyncStorage backup.
- **Auth state**: procedures are public content; no auth gating.
- **Procedure card displayed during high stress**: design discipline — large fonts, big buttons, clear "call vet now" CTA at top + bottom. No clever animations.
- **Pet species-specific content**: dog vs cat normal vitals differ; the card should adapt to the active pet.

## Analytics Events to Fire

- `emergency_procedure_viewed` — `{ procedure_id: enum, pet_species: 'dog'|'cat' }`. No PII. Helps prioritize future procedure additions.
- `emergency_procedure_search_performed` — `{ query_token_count: int }`. NEVER track query string verbatim (could be PII like pet name or symptom).
- `emergency_call_vet_tapped` — `{ procedure_id: enum }`. Conversion to safety action.
- `emergency_external_resource_tapped` — `{ resource: 'aspca'|'pet_poison_helpline'|'red_cross_course'|'avma' }`.
- Privacy: NEVER track query strings, pet name, or specific procedure usage frequency at user level.

## Apple Review Risk Assessment

- **Guideline 1.4.1 (Safety - Medical) — VERY HIGH**. This is among the highest-scrutiny content in the app. Mitigations:
  - All content is conservatively framed (recognize → conservative action → vet).
  - No drug administration. No CPR. No procedural illustrations of risky interventions.
  - Disclaimer banner on every procedure card.
  - Each procedure cites 2+ peer-reviewed / board-cert / standard-of-care sources.
- **Guideline 4.0 (Design)**: emergency content must be reachable in <2 taps from any screen. Already true via Emergency tab.
- **Guideline 3.1.1 (In-app Purchase)**: nothing paywalled here.
- **Guideline 5.1 (Privacy)**: no new permissions.
- **EXTERNAL GATING REQUIREMENTS — CANNOT SHIP WITHOUT**:
  1. **Licensed DVM content reviewer**, signed agreement, named in the app credits with title + license.
  2. **Professional liability insurance** for FloofLife covering pet medical content distribution. Recommend ~$1M / $3M occurrence/aggregate Errors & Omissions policy as the floor; verify with broker.
  3. **Attorney review** of every procedure card's language — specifically the "what not to do" sections (negative-instruction phrasing has more legal exposure than positive instruction).
  4. **App-level disclaimer + EULA update** explicitly carving out medical content from indemnification.
  5. Consider **state-specific veterinary practice statutes** — some states regulate "practice of veterinary medicine" broadly enough to scope user-facing pet medical apps. Recommend a pre-ship 50-state legal scan.

## Implementation Estimate

- New files: ~3-4 (2 screens, 2-3 components, 1 procedures data file).
- Modified files: 2-3 (`EmergencyScreen.js`, `App.js`, `analytics.js`).
- Build budget: own build for v2.0 (likely combined with Seizure Layer 2 + 3 since both touch high-stakes medical content and benefit from one vet-review cycle).
- Time estimate: 8-12 hours focused autonomous-Claude-Code work for the implementation. Content writing + sourcing is another 12-20 hours (real veterinary writing, fully sourced).
- Backend work: 1 minimal views table.
- **External work** (CRITICAL): 4-12 weeks for vet partnership signing + insurance broker engagement + attorney review of content. THIS IS THE CRITICAL PATH, not the code.

## Open Questions / Decisions Needed

1. **DVM partnership** — who's the named DVM reviewer? Need to identify, contract, and pay them. Recommend retainer relationship for ongoing content review across this + Seizure + Tummy + Tick disease pages.
2. **Insurance carrier + policy** — engage a broker. Specifically a tech/healthtech-friendly broker familiar with consumer health-adjacent app exposure.
3. **Attorney** — ideally one with veterinary or medical-app experience. Cost estimate: $5-15K for content review of v2.0 emergency library.
4. **State practice statute scan** — engage attorney to scope. Cost ~$3-8K depending on depth.
5. **Procedure list scope for v2.0** — list above is a starting point. DVM advisor should curate what's appropriate for owner-facing distribution.
6. **CPR roadmap** — does CPR ship in v3.0 with full gating, or stay deferred indefinitely? Founder call. Recommend planning for v3.0 with the partnership pipeline.
7. **Inline video vs. external links to Red Cross course** — recommend external links only for v2.0 (no in-app videos requiring vetting). Adds caution buffer.
8. **Per-procedure species split** — for vitals-related procedures, dog vs cat ranges matter. Confirm UX: separate cards or unified card with species toggle? Recommend unified with active-pet-aware highlighting.
9. **Translation / non-English support** — explicit non-goal for v2.0 (English only). Adding language variants would multiply DVM-review scope linearly.

## Out of Scope (for v2.0 — explicit non-goals)

- **CPR illustrations / step-by-step compressions / rescue breathing** — gating-required (vet + insurance + attorney). Defer to v3+ with full partnership pipeline.
- **Heimlich / abdominal thrust** — same gating.
- **Drug administration of any kind** — explicit forever-non-goal for owner-facing content. Drugs are vet-only.
- **Suturing, splinting, bandaging beyond basic pressure** — vet-only.
- **Snake bite intervention** — first-aid is contested; recommend "vet immediately" only with no procedural detail.
- **Triage decision tree** ("should I take my pet to the ER right now?" flowchart) — would require deep DVM review and is a different feature class.
- **Real-time vet messaging from emergency screen** — partnerships only, v3+.
- **Wearable integration (collar that detects falls / cardiac events)** — partnerships only, v4+.
- **Emergency vet hospital live wait times** — would require a partnership data feed; explicit non-goal for v2.0.
- **AI-driven symptom triage** — explicit forever-non-goal for liability reasons unless it's clearly a vet-licensed product (different company / different app).
- **Translation of medical content into other languages** — explicit non-goal for v2.0; adds linear cost to DVM review.

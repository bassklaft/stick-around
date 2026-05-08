# New Home / Relocation Support (v1.4 or v2.0)

## Goal

A 30-day transition-care experience for pets moving to a new home — the under-discussed reality that most adopted dogs and cats need 3-6 weeks (sometimes longer) to feel settled in a new environment, and most owners get insufficient guidance from the rescue, breeder, or vet on what to expect during that window. This feature delivers a structured, day-by-day checklist + species-specific guidance + behavior-tracking + "is this normal?" anchors so a new owner can recognize the difference between expected adjustment behavior and a genuine concern. It's also a powerful retention loop: users who get the relocation flow at install time engage with the app daily for 30 days during a moment of high information-seeking.

## Founder Anchor

Max's dog took 5 weeks to feel fully settled after a move. During that window Max experienced the universal new-pet-owner cycle — *"is this hiding behavior normal? is the appetite loss normal? is the soft stool the new water? is this a vet trip yet?"* — without a clear answer to any of it. Most rescues hand owners a 1-page sheet; most breeders verbally walk through the first few days and stop there. The relocation feature is a structured 30-day companion that knows what's normal and when something isn't.

## User Flow

### Activation
1. Two entry points:
   - **Onboarding**: when the user enters the pet's "How long have you had [pet name]?" answer, if the answer is "Just got them" or "<30 days," surface "Set up a New Home Plan?" CTA.
   - **Anytime from Pet Detail**: a "New Home Plan" tile under the pet's profile.
2. Tap → Setup screen: pick the move-in date (defaults to today), confirm species + age, confirm household composition (single owner, family, other pets, kids).
3. App generates a 30-day plan tailored to those answers.

### Daily flow
1. Home tab gets a "Day [N] of [pet name]'s New Home Plan" card during the active 30-day window.
2. Each day shows 1-3 day-specific tasks + 1 "what to expect today" note. Examples:
   - Day 1: Set up a quiet retreat space. Don't introduce visitors yet. Some hiding is normal.
   - Day 3: First walk in the new neighborhood. Short and calm. Many dogs lose appetite for 1-3 days; this is usually normal.
   - Day 7: Schedule the first vet visit if not already done. Establish a primary vet relationship.
   - Day 14: Some pets begin to "test" boundaries this week — they're settling in enough to show personality. This is good news.
   - Day 21: Most pets show a noticeable behavior shift this week — more relaxed, more affectionate. Some take longer.
   - Day 30: Plan complete. Reflect on the journey + transition into the regular checklist.
3. Each task has a check-off. Each "what to expect" line is informational and dismissable.

### Behavior tracker (Layer 2)
1. Optional daily 30-second check-in prompt: "How was [pet name] today?" with 4 emoji-style answers (settling, mostly OK, struggling, vet-worthy).
2. Tap "vet-worthy" → triage flow: surfaces relevant existing FloofLife resources (Tummy Tracker if GI, Tick log if recent walk, Emergency screen if acute) + "Discuss with your vet" CTA with a one-tap log export.

### "Is this normal?" knowledge base
1. Searchable list of common transition concerns:
   - Hiding for the first 3-5 days (often normal)
   - Appetite loss for 1-3 days (often normal — rule out underlying illness)
   - Loose stool (often new water / new food / stress; ≥3 days warrants vet — links to Tummy Tracker)
   - Vocal at night (often normal week 1; Premium offers a settling routine)
   - Marking indoors (training reset; Premium offers a behavior-modification routine)
   - Aggression toward new household members (always vet + behaviorist consult)
2. Each entry frames as "common, but discuss with your vet if [thresholds]" — never absolutes.

### Day 30 wrap-up
1. Plan completes with a celebratory paw-print summary.
2. Transitions the user into the regular daily checklist.
3. Optional: prompt for a short reflection ("What was the hardest part?") that we can use anonymously to improve the plan.

## Data Model

### AsyncStorage (local-only)
```
pawrent_relocation_v1: {
  [petId]: {
    moveInDate: timestamp,
    completedDays: int[],
    dailyTasksCompleted: { [dayIndex]: { [taskId]: bool } },
    behaviorLog: { [yyyy-mm-dd]: 'settling'|'mostly_ok'|'struggling'|'vet_worthy' },
    knowledgeBaseViews: string[],
    completed: bool
  }
}
```

### Backend (Supabase)
```sql
create table relocation_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pet_id uuid references pets not null,
  move_in_date date not null,
  completed_days int[] default '{}',
  daily_tasks_completed jsonb default '{}',
  behavior_log jsonb default '{}',
  completed boolean default false,
  created_at timestamptz default now(),
  unique (user_id, pet_id)
);
create index relocation_plans_user_pet_idx on relocation_plans (user_id, pet_id);

alter table relocation_plans enable row level security;
create policy "users own relocation plans" on relocation_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Migration
First-launch v1.4 / v2.0: no existing relocation plans. Existing users with `createdAt < 30 days ago` see the "Set up a New Home Plan?" CTA on first v1.4 launch as a one-time invitation.

### Schema versioning
`v1` suffix. Future versions could expand to longer-term plans (60-day, 90-day) or species-specific tracks.

### Local-only fallback
Full feature works offline. Plan content (30 days × 1-3 tasks) bundled in app as a static data file: `src/data/relocationPlan.js`.

## UI Components

### New screens
- `RelocationSetupScreen` — initial setup form (move-in date, household composition, species/age confirm).
- `RelocationDayScreen` — today's tasks + "what to expect" note + behavior check-in.
- `RelocationKnowledgeBaseScreen` — searchable "is this normal?" list.
- `RelocationKnowledgeDetailScreen` — single entry detail.
- `RelocationDay30Screen` — wrap-up celebration + transition.

### Modified screens
- `OnboardingScreen.js` — add the "Just got them" answer detection + CTA.
- `PetDetailScreen.js` — add the "New Home Plan" tile.
- `HomeScreen.js` — surface the active-day card during the 30-day window.
- `App.js` — register new routes.

### New reusable components
- `<RelocationDayCard pet day onCheck />` — Home-tab card.
- `<RelocationBehaviorPicker value onChange />` — emoji 4-button row.
- `<NormalConcerncard topic />` — knowledge base entry.

## Free vs Premium Gating

- **Free**: full 30-day plan content, daily tasks, behavior tracker, "is this normal?" knowledge base. Day 30 wrap-up. ALL of the safety-relevant content (when to vet) — never paywalled.
- **Premium**: extended plans (60-day, 90-day for special cases like rescues with trauma history), behavior-modification routines for specific concerns (vocalization at night, marking indoors), printable / shareable plan summary for vet visits, multi-pet plan tracking (households moving with multiple pets get one consolidated view), historic relocation plan archive (re-reference a past plan).
- **Rationale**: the relocation experience is a critical retention + activation feature. Free tier is generous; Premium adds depth and convenience.
- **Upgrade prompt**: appears day 14 of the plan ("Want a longer plan?" — once, not naggy).
- **Grandfather**: existing v1.0/v1.1 free users get the same free tier.

## Sources & Citations (for content-heavy parts)

- [ASPCA — Helping a New Pet Adjust](https://www.aspca.org/pet-care/general-pet-care/helping-your-pet-adjust-new-home) — primary source for the 3-3-3 rule (3 days to decompress, 3 weeks to settle, 3 months to feel at home), widely cited.
- [Best Friends Animal Society — Adoption transition](https://bestfriends.org/) — owner-facing transition guidance.
- [American Animal Hospital Association (AAHA)](https://www.aaha.org/) — first-vet-visit timing guidance.
- [Cornell Feline Health Center — New cat introduction](https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center) — cat-specific.
- [AVSAB (American Veterinary Society of Animal Behavior)](https://avsab.org/) — for behavior-related entries.
- [Karen Pryor / Patricia McConnell behavior literature](https://www.patriciamcconnell.com/) — cited for the gentle-introduction principles.
- [The 3-3-3 Rule infographic (widely circulated rescue guidance)](https://www.aspca.org/) — pull from public version, rephrase original.

## Language Guardrails

**Good**:
- "Some hiding for the first 3-5 days is common. If [pet name] is hiding, hasn't eaten in 48 hours, OR seems painful, discuss with your vet."
- "Day 21 is when many pets show a noticeable shift toward feeling more comfortable. Some take longer — that's also normal."
- "Loose stool can come from new water, new food, or stress. If it's been 3+ days, discuss with your vet — and consider logging it in Tummy Tracker."

**Bad**:
- "Your dog will be fine in 3 weeks." (false certainty)
- "Don't worry — it's normal." (dismissive of legitimate concerns)
- "Just give it time." (passive when action may be warranted)
- "Crate training is the answer." (prescriptive)
- "All rescues have trauma." (false generalization)

Frame everything as *"common, but [thresholds when to discuss with vet]"*. Don't claim certainty about timelines (some pets take 6 months). Don't dismiss owner concerns.

## Edge Cases & Error States

- **Empty state (no plan started)**: Pet Detail shows "Just got [pet name]? Set up a New Home Plan." CTA.
- **Offline**: full functionality. Plan content bundled.
- **Permission denied**: N/A.
- **Multi-pet (Premium)**: consolidated plan view shows each pet's day-N progress side by side.
- **Multi-pet (Free)**: each pet has its own plan accessed individually.
- **iCloud transfer**: AsyncStorage data restores. Plan continues seamlessly.
- **Auth state**: anonymous users use plan locally. On sign-in, plan syncs to backend.
- **Plan started, then user re-relocates mid-plan**: offer "Restart plan with new move-in date?" CTA. Old plan archived.
- **Day skipping**: if the user opens the app on day 5 having missed days 2-4, show a gentle "Pick up where you are" message — don't penalize. Past days remain accessible to scroll back through.
- **Plan completion + new pet added**: each pet has independent plan. New pet → new plan trigger.
- **Long-term concerns post day 30**: at day 30 wrap-up, link forward to Tummy Tracker / Behavior log / regular checklist for ongoing tracking.

## Analytics Events to Fire

- `relocation_plan_started` — `{ pet_species: 'dog'|'cat', age_bucket: 'puppy_kitten'|'adult'|'senior', household_composition: 'single'|'family'|'multi_pet'|'kids' }`. No PII.
- `relocation_day_completed` — `{ day_index: 1-30, all_tasks_done: bool, pet_species: 'dog'|'cat' }`.
- `relocation_behavior_logged` — `{ value: 'settling'|'mostly_ok'|'struggling'|'vet_worthy', day_index: int, pet_species: 'dog'|'cat' }`.
- `relocation_knowledge_base_viewed` — `{ topic: enum }`.
- `relocation_vet_worthy_triage` — `{ resource_routed_to: 'tummy'|'tick'|'emergency'|'general_vet' }`. Important conversion-to-safety event.
- `relocation_plan_completed` — `{ days_active: int, behavior_struggling_days: int }`. Aggregate retention signal.
- Privacy: NEVER track pet name or specific notes from reflection.

## Apple Review Risk Assessment

- **Guideline 1.4.1 (Safety - Medical)**: low-medium. Behavior content can flirt with medical territory. Mitigation: every behavior concern frames as "discuss with your vet" if thresholds are crossed.
- **Guideline 5.1 (Privacy)**: no new permissions. Reflection field is local-only by default.
- **Guideline 3.1.1 (In-app Purchase)**: standard subscription gating.
- **Guideline 4.0 (Design)**: 30-day plan content must not feel like spam / repetitive nags. Once-per-day card on Home is the design discipline.
- New permission strings: none.
- Privacy disclosures: none new.

## Implementation Estimate

- New files: ~7-9 (5 screens, 3 components, 1 plan-data-file, 1 storage helper).
- Modified files: 4-5 (`OnboardingScreen.js`, `PetDetailScreen.js`, `HomeScreen.js`, `App.js`, `analytics.js`).
- Build budget: own build for v1.4 if shipping alongside Tummy Tracker, OR fits in v2.0 with the broader behavior + emergency expansion. Recommend v1.4 to capture the activation-loop value.
- Time estimate: 12-18 hours focused autonomous-Claude-Code work. The bulk is content writing for the 30-day plan + knowledge base entries (real veterinary writing, not copy-paste).
- Backend work: 1 table + RLS. No additional infrastructure.

## Open Questions / Decisions Needed

1. **30-day plan content writing — single source of truth**. Recommend writing the 30 × 1-3 tasks as a structured JSON file with citations per entry. Should be DVM advisor reviewed before shipping. This is content, not code — flag for vet content-review pipeline.
2. **3-3-3 rule attribution** — widely circulated, no clear attribution. Can be presented as our framing or attributed to ASPCA's published version. Recommend our framing with ASPCA citation.
3. **Behavior-modification routines (Premium)** — these flirt with veterinary behavior territory. AVSAB vs. self-help framing. Recommend AVSAB-aligned tone with explicit "discuss with a board-certified veterinary behaviorist for serious concerns."
4. **Multi-pet relocation** — household moves with multiple pets are common. Should the consolidated view be Premium or free? Recommend Premium (it's a convenience feature).
5. **Plan length variants** — fixed 30-day for v1.4. Should we offer 14-day (mild adjustment) and 60-day (rescue with trauma) variants in v2.0? Yes, but defer.
6. **Reflection field privacy** — should it sync to backend? Recommend NO — keep on-device. Less risk + less rare-but-possible breach surface.
7. **Day 30 wrap-up tone** — celebratory vs. somber transition. Recommend celebratory ("[Pet name] made it through the first month — you did good.") with a soft transition to regular checklist.
8. **Cat vs. dog content split** — significantly different transition patterns. Need separate content tracks. Two complete 30-day plans (dog + cat). Confirm scope.

## Out of Scope (for v1.4 / v2.0)

- AI-generated transition advice from photos / videos — too high risk, no clear validation path.
- Real-time vet chat from the relocation flow — partnerships only.
- Behaviorist marketplace integration — partnerships only, v3+.
- Geo-aware plan adjustments (e.g., "you moved to a tick-heavy area, here's tick-specific guidance") — already covered by the Tick spec; let those features reference each other.
- Multi-household coordination (co-parents managing the same pet) — future feature, not relocation-scoped.
- Adoption-event-specific plans (just-fostered vs just-adopted vs just-purchased) — start with single 30-day plan; differentiate later if data warrants.

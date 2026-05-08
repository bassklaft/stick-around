# FloofLife — v1.1 Backlog: Features Stripped for v1.0 App Store Submission

**Date stripped:** 2026-04-27
**Pre-strip git commit:** `56444e1` — `v1.0-pre-strip-FULL-BACKUP - all features intact, before App Store prep`
**Pre-strip zip backup:** `~/Downloads/stickaround_v1_pre_strip_BACKUP_20260427_1622.zip`

This document is the canonical record of every feature removed or changed for v1.0 Apple App Store submission. The original code is preserved verbatim below so it can be restored exactly in v1.1.

**Restore strategy when re-adding features:** `git checkout 56444e1 -- <path>` will restore any individual file to its pre-strip state. Or unzip the backup zip into a sibling directory and copy files individually.

---

## North Star: bootstrap to revenue, defer infrastructure

FloofLife is built by a solo founder in bootstrap mode. The strategic priority is **revenue from v1.x first, infrastructure investment second**. Backend buildout (Supabase, accounts, cloud sync — see the "Architecture pivot" section below) is deferred until revenue justifies it: minimum 3 months post-v1.1 launch.

### Order of operations

1. **Ship v1.1**, push marketing hard for 2-4 weeks (validate demand)
2. **Ship v1.1.1** with the feedback button + PostHog analytics SDK only — no backend yet, just product analytics on free tier (cost: $0)
3. **Ship v1.2** with breed audit + Health Tracker + Tummy Tracker (already mostly code-complete on `v1.2-work`)
4. **Ship v1.3** with Pawgress + push notifications + weather alerts + tick features
5. **By month 3, evaluate revenue.** If ~$2,500+ MRR, backend buildout for v2.0 makes sense; if not, pivot or persist with the v1.x local-only architecture
6. **If green-lit:** lean backend buildout per the Architecture pivot section — Supabase free tier, Resend free tier, PostHog free tier — $0/mo to start, scaling only when traction justifies

This sequencing keeps cash burn near-zero through validation. The v1.x local-only architecture continues to serve users well; **no forced migration when v2.0 ships.**

### Founder priority

Every v1.x feature decision should answer: *"does this make a Premium subscription a no-brainer for the right user?"*

Features that help pet owners genuinely **and** justify Premium subscription pricing get prioritized. Features that are nice-to-have but don't move the conversion needle get deferred. The North Star is not "build the most beautiful pet care app" — it's "build the pet care app that owners feel they can't live without, then charge a fair price for it."

### What this means in practice

- The architecture pivot section below (added 2026-05-06) describes the backend stack and timeline **if** revenue clears the gate. Treat the timelines there as conditional, not committed.
- The Vet+ tier (separate section) is explicitly a v2.0+ consideration — second tier ships only after v1.x economics work and we have documented user demand for at least one of its pillars.
- The paywall placement roadmap (separate section) ships incrementally throughout v1.x because it directly serves the conversion-driven prioritization above.

---

## Development workflow notes

### EAS build budget — current cycle constrained, normal target 12/month

Bootstrap-mode founder; build credits are a constrained resource. Two-tier rule:

**This billing cycle (constrained — through 2026-05-31 reset):**
- 2 production builds remaining, 1 reserved for emergencies → realistically 1 more discretionary build before the reset.
- Cadence target: **1 build/week MAX** for the rest of this cycle.
- Each build needs **5-8+** meaningful changes stacked.

**Next billing cycle onward (normal target):**
- 12 production builds per month, 3 in reserve for emergencies (~3 builds/week).
- Each build still needs 3-5+ meaningful changes stacked.

**Both cycles — non-negotiable:**

- **Each build bundles multiple meaningful changes — never one tiny fix per build.**
- **Default answer to "should we build now" is NO** unless the user explicitly approves AND the manifest is substantial.
- **Code commits accumulate on the working branch between builds.** Don't reflexively reach for `eas build` after every commit; let work pile up.
- **Test aggressively in TestFlight on the current build before triggering a new one.** Surface obvious issues during the testing window, not via fresh build cycles.
- **Before triggering any build, list the stacked manifest and confirm explicitly.** Format: *"Build N includes X, Y, Z. Trigger build now or stack more?"* Wait for explicit go-ahead — never auto-trigger, even when the stack is obviously big enough.

**Emergency builds — bypass the rule, do not count against the weekly cadence:**

- Critical production bug affecting existing users.
- Apple Review requires a binary fix to clear a rejection.
- Paywall broken (revenue impact).

For emergencies, propose the fix + immediate rebuild without the stacking ritual. **Do NOT quietly ship "while I'm at it" extras during an emergency build** — keep emergency builds minimal so the rebuild cost stays clearly justified.

### Autonomous-work rule

When given a stacked manifest of work (e.g., a multi-part Part 1 / Part 2 / Part 3 batch), run autonomously:

- Don't ask permission item-by-item.
- Commit each piece separately on the appropriate branch with a clear message that names the piece (e.g., "Part 1.A — Emergency layout audit").
- Surface diffs in the response for review, but don't block on them — Max reviews diffs over the next few days, not in real time.
- Only stop and ask if there's a genuine blocker: missing information that prevents shipping (e.g., an API key), a conflicting requirement between two items, or a high-stakes ambiguous decision.

### Content principles

Codified rules for any user-facing content:

- **About card** — default expanded, warm, charming, screenshot-worthy for friends. Personality, origin story, "did you know" facts, ONE soft health-flavor line MAX. No specific medical content.
- **Health Considerations card** — default collapsed, serious, audit-quality, screenshot-worthy for vets. All specific medical content (named conditions, watch-list, vet cadence, sources).
- **"We know YOUR breed"** — every collapsed header, every tone choice should reinforce specificity. *"Insider Tips · 7 things only Cocker Spaniel owners know"* not *"Tap to learn more"*. Personalize by breed name + concrete count + concrete promise.
- **Contested topics** — surface BOTH sides with sourcing, never pick. Four-part format: state neutrally → summarize each side with sources → owner watch-list → end on the vet.
- **Brand voice** — warm but never childish; informed but never lecturing; breed-specific (use the breed name often). Health information stays accurate — warmth doesn't soften medical seriousness. Brachycephalic warning, recall warnings, toxic foods, dosing cautions stay direct.

These rules are persisted to Claude's memory system (`feedback_build_budget.md`, `feedback_autonomous_work.md`, `feedback_content_principles.md`) so they apply autonomously across sessions, not just within this repo.

---

## v1.1 BACKLOG

(a) **Premium subscription system** — wire up via RevenueCat. The PremiumScreen UI below is ready to drop back in once StoreKit products are configured in App Store Connect. RevenueCat SDK (`react-native-purchases`) handles the iOS + Android wrapping.

(b) **KNOWN BUG (carried into v1.1):** The MONTHLY subscription button in the Premium price-row is non-clickable. Only the ANNUAL card has the active styling and tap handler. When wiring RevenueCat, fix by giving both `priceCard` views their own `TouchableOpacity` wrapper with distinct `onPress` handlers calling the right SKU.

(c) **Multi-pet onboarding flow** — fully surface. The storage layer (`src/lib/storage.js` → `Pets`) already supports multi-pet via the v2 array. Currently `YourPetsScreen` shows a "Add another pet" button that's been replaced for v1.0 with a disabled "Coming soon" state. v1.1 should: (1) launch a fresh `OnboardingScreen` flow when tapped, (2) on `finish()`, call `Pets.add()` instead of `Pets.set()`, (3) sort the YourPets list by age (oldest-first — already implemented in `Pets.listSortedOldestFirst()`).

(d) **CPR content** — add back ONLY after a signed vet partnership. The full `EmergencyScreen` with chest-type-specific CPR is preserved below. Restoring requires a documented review by a licensed DVM and updated wording that reflects the real partnership (no "we're partnering" intent language unless it's actually true at restore time).

(e) **BREED CONTENT EXPANSION** — expand `origin`, `originStory`, and `references` fields for ALL 51 breeds (33 dogs + 18 cats) in `src/data/breeds.js`. Currently only Chow Chow, French Bulldog, Bulldog, and Boston Terrier have rich origin data. Source from publicly available info on:

  - AKC.org breed standards (rewrite, do NOT scrape)
  - ASPCA general breed pages
  - Cornell Feline Health Center
  - VCA Hospitals breed articles
  - Merck Veterinary Manual

  Priority: less common / underrepresented breeds first — the product thesis is helping owners of breeds where info is hard to find. Specifically:

  - Cane Corso
  - Bernese Mountain Dog
  - Cavalier King Charles Spaniel
  - Doberman Pinscher
  - Burmese
  - Sphynx
  - Scottish Fold
  - Bengal
  - Norwegian Forest Cat
  - Devon Rex
  - Abyssinian
  - Brittany
  - English Springer Spaniel
  - Cocker Spaniel
  - Miniature Schnauzer
  - Pomeranian
  - Havanese
  - Shih Tzu
  - Pembroke Welsh Corgi
  - Australian Shepherd
  - German Shorthaired Pointer

  All content rewritten in original plain language. No AI-generated content from training data; reword from public sources.

(f) **Wording changes to revisit if vet partnership signed:**

  - EmergencyScreen "We're partnering with veterinarians" — currently aspirational; can be made literal if a real partnership exists.
  - rulesOfThumb.js "vet-approved solution" → softened in v1.0 to "veterinary cleaning solution" or similar; restore stronger language with real endorser citation.
  - "Vet-reviewed, certified" comment in emergencyProtocols.js — restore if real review happens.

(g) **Other deferred items:**

  - iOS Home Screen + Lock Screen widgets (Swift via Expo config plugin + App Groups data sharing)
  - Observation log UI (`Observations` storage helper exists but no screen)
  - DNA file upload from Embark/Wisdom Panel/Basepaws (currently text-paste only; needs per-vendor PDF/JSON parsers + a backend)
  - Cloud sync across devices
  - AI chat / symptom triage
  - Live data: dog-bite stats, real-time tick density, reactive-dog locations
  - Lottie/SVG animations on checklist + emergency walkthroughs
  - "FloofLife written on the actual checkmark" in the logo — currently the wordmark sits beside the paw+check; the user wanted text inside the check, but the check is too small to fit legible text. Revisit with a designer.
  - Real per-breed photographs (currently breed-specific emojis where available)
  - Soil/puddle contaminants by user location (geolocation + EPA water-quality data + backend)

(h) **Rename "Your Pets" → "My Pets" throughout the app.** Affects:

  - Tab label (`App.js`, `Tabs.Screen` for `name="YourPets"` — keep the route name as `YourPets` to avoid breaking AsyncStorage / navigation history; only change `tabBarLabel` and `title`)
  - `YourPetsScreen` header title
  - HomeScreen "Your Pets" card title (line ~50 in `cards` array, key: `"pets"`)
  - HomeScreen tip-card "See all N tips" navigation target — text only ("See all tips for {breed}") unaffected, but verify
  - Any user-facing copy in onboarding or alerts that says "Your Pets"
  - The screen file can stay as `YourPetsScreen.js` (filename = component name = stable)

(i) **Confirm "My Pets" doesn't conflict with any in-app navigation or screen identifier.** When (h) lands:

  - Search for any string `"My Pets"` already in the codebase before adding (none currently)
  - Confirm no AsyncStorage key uses `myPets` / `my_pets`
  - Confirm tab `initialRouteName` still resolves (Home is the initial — unaffected)
  - Test deep-link reset / multi-pet add flow doesn't break

(j) **Generate updated screenshots after the "My Pets" rename for the v1.0.1 minor update.** Required screenshots for App Store Connect (6.7" + 6.1" + 5.5" iPhone displays):

  - Home hub (with photo hero + emergency card)
  - My Pets (renamed) with breed insider tips
  - Checklist with progress bar
  - Toxic foods/plants reference
  - Risk Map with location-aware hazards
  - Emergency Resources screen

  Use a real Chow Chow profile (or whatever the demo pet is) so the screenshots feel populated, not empty. Tool: iPhone Simulator → Xcode → Window → Devices and Simulators → screenshot via ⌘S, or `xcrun simctl io <device> screenshot`. Each screenshot needs the time set to 9:41 (Apple's convention) — there's a simctl flag for that.

---

## v1.1 NEW FEATURES — FROM USER FEEDBACK 2026-04-28

These are NEW v1.1 ideas, not restorations of v1.0 features. Captured from user feedback session 2026-04-28.

### PREVENTIVE CARE TRACKING (high priority for v1.1)

#### 1. Vaccination & preventive medication tracker (integrated into the weekly checklist)

- **Flea/tick preventative** — track product, last dose date, frequency (monthly, 3-month, 6-month options like Bravecto)
- **Heartworm preventative** — track product, last dose date, frequency
- **Core vaccines:**
  - Rabies (dogs + cats)
  - DHPP / DAPP (dogs)
  - FVRCP (cats)
  - Track date administered, due date based on standard schedules
- **Non-core vaccines** surfaced as breed/region-aware prompts:
  - Bordetella
  - Lyme
  - Leptospirosis
  - Canine Influenza
  - FeLV (cats)
- **Each entry tracks:**
  - Which vet administered
  - Date
  - Next due date
  - Any reactions noted
- **Reminders:** generate checklist items 30 / 14 / 7 days before next dose due

#### 2. Vaccine education prompts (informational only — NOT recommendations)

"Check with vet about [specific vaccine]" prompts based on:

- **Region** — e.g., Lepto in areas with rodent / standing-water exposure, Lyme in tick-heavy zones
- **Breed** — flagging breeds with documented vaccine sensitivities
- **Lifestyle** — boarding / dog parks / hiking → Bordetella, Lepto
- **Age** — puppy vs adult vs senior schedules

Pull regional disease-prevalence data if a free public source exists (CDC, Companion Animal Parasite Council). Otherwise, editorial summary with explicit "verify locally" disclaimer.

#### 3. Spay / neuter timing guidance (informational only — NOT a recommendation)

Display breed-specific timing research from peer-reviewed sources:

- UC Davis hip-dysplasia studies
- Hart et al. cancer-risk studies for golden retrievers
- Other breed-specific research as it surfaces

**Framing:** "Current research suggests X timing for [breed] due to [reason]. Discuss with your vet."

**Rules:**
- NEVER make a direct recommendation
- Always defer to vet
- Cite sources

#### 4. CRITICAL — Breed-specific vaccine reaction warnings

This is genuinely safety-critical content. Treat with the seriousness of toxic-food warnings.

- **Chow Chows:** documented adverse reactions to Leptospirosis vaccines (both combo and standalone). User Max has personal experience — his Chow Chow Falafel almost died from a lepto vaccine reaction. Flag this **prominently** for Chow Chow owners on any Lepto-related prompt.
- **Shar-Peis:** prone to Familial Shar-Pei Fever (FSF) — autoinflammatory condition. Flag in breed health concerns. Related Asian primitive breeds (Chow, Akita, etc.) may share inflammatory tendencies.
- **General principle:** when adding any vaccine prompt, cross-check the breed for documented adverse reactions and surface a warning card BEFORE the prompt.
- **Source discipline:** peer-reviewed veterinary literature, AKC parent-club resources, breed-specific veterinary research. **NOT** forum anecdotes.

#### 5. Vaccine reaction logging

- When a user logs a vaccine in their pet's history, prompt: "Did you observe any reaction in the 24–48 hours after?" with options:
  - None
  - Mild lethargy
  - Vomiting
  - Facial swelling
  - Anaphylactic
  - Other (free text)
- Build a **longitudinal record** the user can show the vet at next visit
- If a severe reaction is logged, surface a warning before any future similar vaccine: "Falafel had a severe reaction to Lepto in [date]. Discuss with your vet before any future Lepto vaccination."

### DESIGN NOTES FOR IMPLEMENTATION

- All vaccine guidance carries the standard disclaimer ("informational only, consult your vet")
- Breed-specific reaction warnings = HIGHLIGHTED card, not a footnote (safety-critical)
- Cross-reference with the existing breed health concerns data structure
- Consider either:
  - A new "Health Records" tab, or
  - Folding into the existing My Pets tab (post-rename per backlog item h)
- **Storage layer:** extend the pet schema with a `vaccinations` array. Each entry shape:
  ```js
  {
    date: "2026-04-15",
    vaccine: "Leptospirosis",
    brand: "Nobivac Lepto4",
    vet: "Dr. Smith — Heart of Chelsea Veterinary",
    nextDueDate: "2027-04-15",
    reactions: ["mild_lethargy"], // or [] if none
    notes: "Free text"
  }
  ```
- Migrate any existing pet records by initialising `vaccinations: []` on first load
- Keep AsyncStorage key namespacing consistent with existing `pawrent` prefix (do not rename storage keys here — see backlog item h for the broader rename plan)

---

## 2026-04-29 — additional feature ideas

### FLEA/TICK PREVENTATIVE SEIZURE WARNING (v1.1 priority — high, safety-critical)

Add to the breed-specific warnings system (alongside the Lepto / Chow Chow warning from the 2026-04-28 section above).

#### General warning

Flea/tick preventatives in the **isoxazoline class** (Bravecto, Nexgard, Simparica, Credelio) have FDA-documented neurological adverse events including seizures, especially in dogs with a history of seizures or epilepsy.

**Source:** FDA Animal Drug Safety Communication, September 2018 — "FDA Alerts Pet Owners and Veterinarians About Potential for Neurologic Adverse Events Associated with Certain Flea and Tick Products."

#### Surface conditions

- **For dogs flagged as seizure-prone** (user has logged a seizure history on the pet's profile, or breed is in a known seizure-predisposed list): surface a HIGHLIGHTED warning card BEFORE any flea/tick preventative reminder:

  > Some flea/tick preventatives have been associated with seizures in dogs with epilepsy or seizure history. Discuss isoxazoline-class drugs (Bravecto, Nexgard, Simparica, Credelio) with your vet before use.

- **For all dogs receiving a new flea/tick preventative for the first time**: prompt the user to monitor for adverse reactions for 48 hours. Build into the vaccine-reaction-logging UI already specified in the 2026-04-28 backlog (item 5 — "Vaccine reaction logging").

#### Natural / alternative preventatives

Editorial note (informational, NOT prescriptive):

- Natural / herbal flea preventatives (essential oils, garlic, brewer's yeast) have **weaker efficacy data** and are not equivalent in protection.
- Frame as: "Discuss tradeoffs with your vet." Never recommend an alternative directly.

#### Implementation notes

- Same warning-card design pattern as the Lepto / Chow Chow warning (HIGHLIGHTED, not footnote — safety-critical content)
- Cross-reference with the `vaccinations` schema's `reactions` array — if user logs a seizure reaction to a previous flea/tick dose, surface a stronger warning before any future similar product
- Sources for any expanded list of seizure-predisposed breeds must be peer-reviewed veterinary literature (NOT forum anecdotes), per the 2026-04-28 source-discipline guidance

---

## DELETED FILE 1: `src/screens/PremiumScreen.js`

This was the entire Premium upsell screen. Reason for deletion: contained "Start 7-day free trial" CTA that triggered an `Alert.alert("Coming soon", ...)` — guaranteed Apple Guideline 2.1 rejection (placeholder content). MONTHLY card was visually styled but non-clickable (known bug, see backlog item b).

**Original full contents:**

```jsx
// Premium upsell — currently informational only. iOS subscriptions go
// through Apple StoreKit (managed via RevenueCat in production); the
// SDK + product setup land in v2 per the PRD timeline.
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const FREE = [
  "1 pet profile",
  "Generic weekly checklist",
  "Toxic foods + plants reference",
  "Recalls feed",
  "Vets Near Me search",
  "Your photo on the home screen",
];

const PREMIUM = [
  "Full breed-personalized + age + season checklist (10-15 items)",
  "Full insider-tips library for your breed",
  "Diet & care library (supplements, joint chews, grooming, treats)",
  "Trip planning + training guides",
  "Multi-pet (households with more than one)",
  "Observation log + export-to-text for vet visits",
  "iOS Home Screen + Lock Screen widgets",
  "Future: cloud sync across devices",
];

export default function PremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  function comingSoon() {
    Alert.alert(
      "Coming soon",
      "Premium subscriptions launch with v1.1. Apple App Store handles billing through your iCloud account — same way you'd subscribe to Apple Music or any other app. Free trial on annual.",
      [{ text: "OK" }]
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}>
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <MaterialCommunityIcons name="star-circle" size={42} color={theme.accent} />
        </View>
        <Text style={s.heroTitle}>Premium</Text>
        <Text style={s.heroSub}>Add a few good years to the life you're already giving them.</Text>
      </View>

      <View style={s.priceRow}>
        <View style={[s.priceCard, s.priceCardActive]}>
          <Text style={s.priceLabel}>ANNUAL</Text>
          <Text style={s.priceAmt}>$39<Text style={s.priceUnit}>/yr</Text></Text>
          <Text style={s.priceMeta}>$3.25/mo · 7-day free trial</Text>
          <View style={s.bestBadge}><Text style={s.bestBadgeText}>SAVE 35%</Text></View>
        </View>
        <View style={s.priceCard}>
          <Text style={s.priceLabel}>MONTHLY</Text>
          <Text style={s.priceAmt}>$4.99<Text style={s.priceUnit}>/mo</Text></Text>
          <Text style={s.priceMeta}>Cancel anytime</Text>
        </View>
      </View>

      <Text style={s.sectionHd}>WHAT YOU GET</Text>
      <View style={s.list}>
        {PREMIUM.map((p, i) => (
          <View key={i} style={s.row}>
            <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />
            <Text style={s.rowText}>{p}</Text>
          </View>
        ))}
      </View>

      <Text style={s.sectionHd}>FREE TIER</Text>
      <View style={s.list}>
        {FREE.map((p, i) => (
          <View key={i} style={s.row}>
            <MaterialCommunityIcons name="check" size={18} color={theme.muted} />
            <Text style={[s.rowText, { color: theme.muted }]}>{p}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={comingSoon} style={s.cta}>
        <Text style={s.ctaText}>Start 7-day free trial</Text>
        <Text style={s.ctaSubText}>Then $39/yr · cancel anytime in iPhone Settings</Text>
      </TouchableOpacity>

      <View style={s.fineprint}>
        <Text style={s.fineText}>
          Subscriptions are processed by Apple. Your subscription auto-renews unless canceled at least 24 hours before the end of the current period. Manage or cancel in Settings → Apple ID → Subscriptions.
        </Text>
        <Text style={[s.fineText, { marginTop: 8 }]}>
          FloofLife guidance is sourced from public veterinary references. It is not a substitute for veterinary advice.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero:         { alignItems: "center", paddingVertical: 18, paddingBottom: 4 },
  heroIcon:     { width: 76, height: 76, borderRadius: 38, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle:    { fontSize: 28, fontWeight: "800", color: theme.fg, letterSpacing: -0.5 },
  heroSub:      { fontSize: 14, color: theme.muted, marginTop: 4, textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },
  priceRow:     { flexDirection: "row", gap: 10, marginTop: 18, marginBottom: 8 },
  priceCard:    { flex: 1, padding: 16, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.line, alignItems: "center" },
  priceCardActive:{ borderColor: theme.accent, borderWidth: 2 },
  priceLabel:   { fontSize: 10, fontWeight: "800", color: theme.muted, letterSpacing: 1.2 },
  priceAmt:     { fontSize: 26, fontWeight: "800", color: theme.fg, marginTop: 6 },
  priceUnit:    { fontSize: 13, fontWeight: "600", color: theme.muted },
  priceMeta:    { fontSize: 11, color: theme.muted, marginTop: 4, textAlign: "center" },
  bestBadge:    { position: "absolute", top: -10, right: -8, backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  bestBadgeText:{ color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  sectionHd:    { marginTop: 18, marginBottom: 10, fontSize: 11, fontWeight: "700", color: theme.muted, letterSpacing: 1.2 },
  list:         { backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, padding: 14, gap: 10 },
  row:          { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  rowText:      { flex: 1, fontSize: 13, color: theme.fg, lineHeight: 19 },
  cta:          { marginTop: 22, backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  ctaText:      { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },
  ctaSubText:   { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 4, letterSpacing: 0.3 },
  fineprint:    { marginTop: 24 },
  fineText:     { fontSize: 11, color: theme.muted, lineHeight: 17 },
});
```

---

## REPLACED FILE 2: `src/screens/EmergencyScreen.js` (CPR content stripped)

**Reason for replacement:** The original screen contained step-by-step Pet CPR instructions (chest-type-specific hand placement, depth, rate, ratio). Apple medical-instruction review for pet apps is strict; without a signed licensed DVM as content reviewer, this is high rejection risk. The toxic-ingestion section is preserved because it's structured around "call poison control first, do NOT induce vomiting, here's what to bring to the ER" — that's defensible as resource pointing.

**v1.0 replacement** is a resources-only screen: poison hotlines, Maps deep-link for nearby emergency vets + AAHA-accredited hospital lookup, Red Cross Pet First Aid course link, plus the toxic-ingestion protocol unchanged.

**Original full contents** (the version with CPR + vet-partnership language):

```jsx
// Emergency — CPR + Toxic Ingestion protocols. Reference material only.
// Heavy disclaimers: every screen leads with "CALL THE VET FIRST" and
// links to certified video resources from Red Cross / AVMA / Cornell /
// ASPCA. v1 ships text + emoji walkthroughs; Lottie animations are a
// v2 art investment.
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import {
  POISON_HOTLINES, CPR_BY_CHESTTYPE, CPR_STEPS,
  TOXIC_INGESTION_PROTOCOL, CERTIFIED_VIDEOS,
} from "../data/emergencyProtocols";

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("toxic");
  const [chest, setChest] = useState("small");

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}
    >
      {/* Top alarm — call vet first */}
      <View style={s.alarm}>
        <Text style={s.alarmHd}>⚠ READ THIS FIRST</Text>
        <Text style={s.alarmBody}>
          If something is happening RIGHT NOW, call your vet or poison control before doing anything else. The protocols below are reference, not real-time triage. Wrong action causes more deaths than the original incident.
        </Text>
        {POISON_HOTLINES.map((h, i) => (
          <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${h.phone}`)} style={s.callBtn}>
            <MaterialCommunityIcons name="phone" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.callBtnText}>{h.name}: {h.display}</Text>
          </TouchableOpacity>
        ))}
        <Text style={s.alarmFee}>Both poison-control lines charge $85–95 per consult. Worth every dollar.</Text>
      </View>

      {/* Vet-partnership trust note */}
      <View style={s.partnerCard}>
        <MaterialCommunityIcons name="stethoscope" size={22} color={theme.accent} />
        <Text style={s.partnerText}>
          <Text style={{ fontWeight: "800" }}>We're partnering with veterinarians.</Text>{" "}
          FloofLife is bringing licensed vets onboard to review every emergency protocol on this screen. Until that's complete, all guidance here is summarized from public references — Red Cross Pet First Aid, AVMA, ASPCA APCC, Pet Poison Helpline, Cornell Veterinary College.
        </Text>
      </View>

      {/* Tab switcher */}
      <View style={s.tabs}>
        <TouchableOpacity onPress={() => setTab("toxic")} style={[s.tab, tab === "toxic" && s.tabActive]}>
          <MaterialCommunityIcons name="biohazard" size={16} color={tab === "toxic" ? "#fff" : theme.fg} style={{ marginRight: 6 }} />
          <Text style={[s.tabText, tab === "toxic" && s.tabTextActive]}>Toxic Ingestion</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("cpr")} style={[s.tab, tab === "cpr" && s.tabActive]}>
          <MaterialCommunityIcons name="heart-pulse" size={16} color={tab === "cpr" ? "#fff" : theme.fg} style={{ marginRight: 6 }} />
          <Text style={[s.tabText, tab === "cpr" && s.tabTextActive]}>Pet CPR</Text>
        </TouchableOpacity>
      </View>

      {tab === "toxic" && <ToxicView />}
      {tab === "cpr" && <CprView chest={chest} setChest={setChest} />}

      {/* Certified videos */}
      <Text style={s.sectionHd}>VET-CERTIFIED VIDEO RESOURCES</Text>
      <Text style={s.sectionSub}>
        We can't host video walkthroughs ourselves yet. These are the organizations whose pet first-aid courses are widely recommended by veterinarians.
      </Text>
      {CERTIFIED_VIDEOS.map((v, i) => (
        <TouchableOpacity key={i} onPress={() => Linking.openURL(v.url)} style={s.linkCard}>
          <MaterialCommunityIcons name="play-circle" size={20} color={theme.accent} />
          <Text style={s.linkCardText}>{v.label}</Text>
          <MaterialCommunityIcons name="open-in-new" size={14} color={theme.muted} />
        </TouchableOpacity>
      ))}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          ⚠ <Text style={{ fontWeight: "700" }}>Consult your vet on how to perform any of these protocols properly before performing them.</Text> Practice CPR on a stuffed animal, not a live pet. The wrong technique can break ribs or cause aspiration pneumonia. FloofLife is not a substitute for veterinary advice or emergency medical training.
        </Text>
      </View>
    </ScrollView>
  );
}

// [ToxicView and CprView function bodies omitted here for brevity but
//  are preserved verbatim in the git commit 56444e1 and the zip backup.
//  The full component including:
//   - All chest-type cards (small / deep / narrow / barrel)
//   - 7 universal CPR steps
//   - Tab switcher between Toxic + CPR
//   - "About the animations" warning card
//  is recoverable via:
//      git show 56444e1:src/screens/EmergencyScreen.js
// ]
```

---

## CHANGED FILE 3: `App.js`

**What changed:** Removed `PremiumScreen` import + `Premium` route registration.

**Original snippet (BEFORE):**

```jsx
import EmergencyScreen from "./src/screens/EmergencyScreen";
import PremiumScreen from "./src/screens/PremiumScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
```

```jsx
              <RootStack.Screen name="Emergency" component={EmergencyScreen} options={{ ...pushScreenOptions, title: "Emergency · CPR + Toxic" }} />
              <RootStack.Screen name="Premium"  component={PremiumScreen}  options={{ ...pushScreenOptions, presentation: "modal", title: "Premium" }} />
              <RootStack.Screen
                name="Settings"
```

**Replacement (AFTER):**

```jsx
import EmergencyScreen from "./src/screens/EmergencyScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
```

```jsx
              <RootStack.Screen name="Emergency" component={EmergencyScreen} options={{ ...pushScreenOptions, title: "Emergency Resources" }} />
              <RootStack.Screen
                name="Settings"
```

Also: the Emergency screen route title changed from "Emergency · CPR + Toxic" to "Emergency Resources" since CPR is no longer in-app.

---

## CHANGED FILE 4: `src/screens/SettingsScreen.js`

**What changed:** SUBSCRIPTION section removed entirely (the "⭐ Upgrade to Premium" card linking to `navigation.navigate("Premium")`).

**Original snippet (BEFORE):**

```jsx
      <Text style={s.sectionHd}>SUBSCRIPTION</Text>
      <TouchableOpacity onPress={() => navigation.navigate("Premium")} style={[s.card, { borderColor: theme.accent }]}>
        <Text style={[s.body, { fontWeight: "700", color: theme.accent }]}>⭐ Upgrade to Premium</Text>
        <Text style={[s.sub, { marginTop: 4 }]}>$4.99/mo or $39/yr — full personalized checklist, breed insider tips, multi-pet, widgets, trip + training guides.</Text>
      </TouchableOpacity>

      <Text style={s.sectionHd}>HELP</Text>
```

**Replacement (AFTER):** the entire SUBSCRIPTION block deleted. HELP follows directly after the pet-info card.

---

## CHANGED FILE 5: `src/screens/YourPetsScreen.js`

**What changed:** "Add another pet" CTA replaced with a disabled "Coming soon" pill. Removed Alert that linked to Premium.

**Original snippet (BEFORE):**

```jsx
  function addAnotherPet() {
    Alert.alert(
      "Add another pet",
      "Multi-pet onboarding is coming with Premium. For now, your first pet's profile is the main one and breed-specific tips center on them. Want to upgrade?",
      [
        { text: "Maybe later" },
        { text: "See Premium", onPress: () => navigation.navigate("Premium") },
      ]
    );
  }
```

```jsx
      <TouchableOpacity onPress={addAnotherPet} style={s.addBtn}>
        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={theme.accent} />
        <Text style={s.addBtnText}>Add another pet</Text>
      </TouchableOpacity>
```

**Replacement (AFTER):** `addAnotherPet` removed. Button replaced with a non-interactive "View"-only block reading "Multi-pet support coming soon" — disabled visually (muted colors, no `onPress`).

---

## WORDING AUDIT CHANGES

### File: `src/screens/EmergencyScreen.js` (the v1.0 replacement)

The new resources-only EmergencyScreen does NOT contain any of the following phrases that appeared in the pre-strip version:
- ❌ "We're partnering with veterinarians" (aspirational vet-partnership claim)
- ❌ "FloofLife is bringing licensed vets onboard"
- ❌ "vet-certified video resources" header
- ❌ "We're working with veterinary partners + medical animators"

### File: `src/data/rulesOfThumb.js`

**Original (line 57):**
```
"Clean weekly with vet-approved solution; ..."
```
**Replacement:**
```
"Clean weekly with a veterinary cleansing solution (chlorhexidine-based, available without prescription); ..."
```

### File: `src/data/emergencyProtocols.js`

**Original (line 107 comment):**
```
// Vet-reviewed, certified, free video resources. These are real
```
**Replacement:**
```
// Free video resources from public veterinary organizations.
```

### Universal disclaimer

Both `theme.js` does not need editing, but every screen with health/care content already carries a disclaimer. The standard line used across screens:

> "FloofLife provides general care guidance and is not a substitute for professional veterinary care. Always consult your veterinarian for medical decisions."

---

## RecallsScreen + RiskScreen Audit (no functional removal)

### RecallsScreen
- Already labeled as curated/static editorial summary
- Added **"Last updated: 2026-04-27"** disclosure
- Added explicit copy: "verify current recalls at fda.gov before acting"
- All entries already link to FDA + AVMA primary sources

### RiskScreen
- Location permission is **substantively used**: fetches Open-Meteo current weather, matches against curated hazard-site bboxes (Meeker Plume, Gowanus, Newtown Creek, LA River) and regional flag bboxes (NYC metro, Northeast tick belt, SF Bay Area, Florida, Rocky Mountains)
- No placeholder behavior — keeping permission and feature
- Permission string in app.json updated to be more specific

---

## RESTORE CHECKLIST FOR v1.1

When you're ready to restore the full feature set (after v1.0 is approved + RevenueCat is wired):

1. `git show 56444e1:src/screens/PremiumScreen.js > src/screens/PremiumScreen.js`
2. `git show 56444e1:src/screens/EmergencyScreen.js > src/screens/EmergencyScreen.js`
3. Restore the App.js import + route registration for Premium and the Emergency title
4. Restore the SettingsScreen SUBSCRIPTION card
5. Restore YourPetsScreen `addAnotherPet` flow (or build the proper multi-pet onboarding instead)
6. Audit + restore the wording changes in rulesOfThumb.js, emergencyProtocols.js
7. **Fix the known monthly-button bug** before relaunching Premium
8. Wire RevenueCat (`react-native-purchases`) and configure StoreKit products in App Store Connect for `com.bassklaft.pawrent`
9. Sign the actual vet partnership before restoring "we're partnering with vets" wording
10. Then EAS build + submit v1.1

---

## 2026-04-30 — additional feature ideas

### TRANSFER APP TO TENTENTHS LLC (v1.x or v2.0 polish)

Currently FloofLife is published under Maxwell Bernard Klafter's Individual Apple Developer account. The App Store listing briefly shows "MAXWELL BERNARD KLAFTER" as developer/seller before the subtitle loads, which is unbranded and personal-feeling.

Goal: transfer the app to a TenTenths LLC Organization account on Apple Developer Program for cleaner branding ("TenTenths LLC" or similar appears as developer instead).

Steps required:
1. Obtain D-U-N-S number for TenTenths LLC from Dun & Bradstreet (free, 1-5 business days)
2. Enroll in Apple Developer Program as Organization under TenTenths LLC ($99/year; Apple verifies LLC against D-U-N-S, takes 1-3 weeks)
3. Use Apple's app transfer process to move FloofLife from Individual to Organization account (1-2 weeks; both accounts need to meet criteria, including having an active app, no in-app purchases conflicts, etc.)

Total timeline: 3-6 weeks of paperwork.

Tradeoffs to consider before doing this:
- Some download/review history may not transfer cleanly
- Need to keep Individual account active during transfer
- May want to do this once FloofLife has more momentum (so we're transferring something with traction, not a new app)
- Could combine with v1.1 launch as a clean rebrand moment


---

## 2026-05-04 — v1.3 / v1.4 / v1.5 roadmap

### v1.3 (target ship: mid-May 2026)

- **Remote JSON for recalls.** Host the recall list on Cloudflare Pages or GitHub Pages with a stable schema; the app fetches on launch and falls back to the bundled list on network failure. Lets us push recall updates without an App Store version bump.
- **AI-assisted weekly recall workflow.** Once-a-week scheduled task that uses a Claude API call to scan the FDA recalls/withdrawals page and DogFoodAdvisor for new entries, emit a structured JSON candidate list, hold for ~5 min of manual review by Max, then push to the remote feed. Manual review stays in the loop — no autopublish.
- **URL audit as a scheduled GitHub Action.** Runs `npm run audit:links` weekly, writes `deadLinks.json` if anything broke, opens an issue. The audit script (Phase 4 deliverable) is already CI-friendly.
- **Push notifications (local first; remote optional)** for vaccine/preventative reminders. Local-only is sufficient for v1.3 since the Health Tracker already knows the schedule client-side.
- **Document upload + photo storage for vaccine records.** Already partially landed in Phase 2; v1.3 finishes thumbnail generation + a richer attachment viewer.

### v1.4 (target ship: late May 2026)

- **FDA RSS scraper running on schedule.** The FDA publishes a structured RSS feed for recalls; legal, free, and stable. v1.4 swaps the Claude-assisted ingest for an RSS-driven pipeline. Manual review stays as a safety gate.
- **Class action lawsuit awareness via PACER.** PACER (federal court records) has a paid API; query for "pet food" / "pet treat" complaints filed and surface high-signal class actions to FloofLife's Recalls list.
- **DogFoodAdvisor partnership outreach** for a legitimate data-sharing agreement (rather than scraping). DogFoodAdvisor is the most active aggregator outside the FDA; a partnership lets us cite them by name without ToS friction.
- **Admin UI for Max** — a simple web form to add a recall in 30 seconds (name, severity, source, summary, advice, source URL) without editing JS.

### v1.5+ (target ship: by June 1, 2026)

- **Fully automated recall pipeline.** FDA RSS + DogFoodAdvisor (via partnership or their API if available) + class action awareness, all flowing into the remote JSON. NO user-side app updates required to push a new recall.
- **Acknowledged limitation:** peer-reviewed veterinary journals (JAVMA, JFMS, JSAP, et al.) require paid subscriptions and CANNOT be legally scraped. Either pay for academic subscriptions and curate manually, or build partnerships with veterinary schools who can republish under license. This is a manual-curation channel for the foreseeable future.

### Other deferred items (no specific version yet)

- Document parsing / AI extraction from vet uploads (OCR + structured field detection on rabies certificates, lab reports, etc.)
- Vet portal sync integrations (when major chains expose APIs — e.g. VCA, Banfield, MWI)
- Cross-pet Health Tracker overview ("Health" tab that aggregates upcoming due dates across all of a household's floofs)
- Mixed-breed percentage editor (UI for setting Lab 50% / Poodle 50% etc., feeding into checklist weighting)
- Spay/neuter timing guidance (breed + size dependent — there's real evidence early neutering harms some giant breeds)
- Vaccine reaction logging (a checkbox on each Health Tracker entry: "any reaction?" → free-form notes — useful for catching adjuvant intolerance patterns)
- DNA test import (Embark / Wisdom Panel / Basepaws JSON or CSV ingest, mapped to FloofLife's breed catalog)
- iCloud / cloud sync as a paid feature


---

## 2026-05-04 — Critical migration constraint: local → cloud (v2.0+)

When FloofLife eventually adds cloud accounts (v2.0+), users who have been
using the app in local-only mode MUST not lose any data when they:

- create an account for the first time
- subscribe to Premium for the first time
- migrate from free local-only to cloud-synced premium

### What MUST migrate seamlessly

- All pets (full pet data: name, species, `breeds[]`, age, weight, photos)
- All health records (vaccines, preventatives, wellness, attachments)
- All vet info (saved vet contacts)
- All checklist progress / completion state
- All user preferences and settings
- Pet photos stored in `documentDirectory`

### Implementation approach (when v2.0 lands)

1. On account creation, app reads ALL local AsyncStorage + FileSystem data.
2. App uploads to cloud-side database under the new account ID.
3. Local data is preserved (don't delete) until cloud sync confirms successful.
4. Photos in `documentDirectory` get uploaded to cloud storage with URLs replacing local URIs.
5. After successful migration, local data is kept as cache for offline-first behavior.
6. Add a "Restore from local data" option in Settings as a fallback.

### Anti-patterns to avoid

- Don't show a "create account" gate that wipes local data.
- Don't require account creation just to access existing local data.
- Don't show a confusing "merge or replace" prompt that scares users into losing data.

### Edge cases to plan for

- User with cloud account on Phone A + local data on Phone B → conflict resolution UI.
- User who creates account, then signs out → local data should persist.
- User who deletes app, reinstalls, signs in → cloud data restored, no local-only data lost.
- Photos that exist locally but not in cloud (older entries) — auto-upload on first sync.

### Test cases (when v2.0 ships)

1. Free user with 3 pets + 20 health records + photos → creates account → all data appears.
2. Free user with mixed-breed pet → upgrades to Premium → multi-breed data persists.
3. Free user → premium → adds 4th pet → all four sync to cloud.
4. User with cloud account on Phone A → installs on Phone B → all data syncs down.

**Status:** constraint documented; implementation deferred to v2.0.


---

## 2026-05-05 — v1.1.1 patch backlog (post-build-15 polish)

Build 15 is the v1.1 production submission. The items below are queued for a follow-up v1.1.1 patch — code-complete on `v1.1-work` working tree but **uncommitted, unbuilt, and not yet visually verified** at the time of build 15 submission.

### 1. Per-pet checklist state (correctness fix from multi-pet rollout)

**Bug:** When v1.1 introduced multi-pet, `ChecklistState` was left as a flat global map keyed by item id (`pawrent_checklist_state` → `{ [itemId]: { status, ts } }`). Pets sharing item ids (most common breeds share at least 8–10 default items) saw each other's checkmarks. Checking off "brush teeth" on Bella also showed it checked on Max.

**Fix landed on `v1.1-work` (uncommitted):**

- `src/lib/storage.js` — `ChecklistState` now reads/writes a pet-scoped map under a new key `pawrent_checklist_state_v2`, shape `{ [petId]: { [itemId]: { status, ts } } }`. The legacy single-pet map is migrated under the currently-active pet's id on first read after upgrade and the old key is deleted. If there is no active pet yet (fresh install / mid-onboarding), the legacy key is left untouched and migration retries on the next read. `Pet.clear()` now also wipes the v2 key.
- `src/screens/ChecklistScreen.js` — passes `pet.id` to `ChecklistState.get(petId)` and `ChecklistState.setItem(petId, key, status)`. Guards against `pet?.id` being missing.
- `src/screens/HomeScreen.js` — same `pet?.id` guard on the home-tab progress-bar read.

**What this fix covers:** the "active" pet (which is still defined as `Pets.list()[0]`) sees its own independent checklist state, and existing single-pet users have their existing checks preserved under that pet.

**What this fix does NOT cover (pushed to a later version):**

- A user-facing "switch active pet" UI. Today the active pet is the first item in the `Pets` array (oldest pet wins per `listSortedOldestFirst`); there is no "tap a pet card to make it active" interaction. Per-pet checklists won't truly feel per-pet until a switcher exists. Likely v1.2 work — track alongside the multi-pet UX polish.
- Per-pet completion counts on a multi-pet aggregate view ("3 of 12 done across all your floofs"). Out of scope for v1.1.1.

### 2. Layout collision sweep — visual polish

A `flexDirection: "row"` + `justifyContent: "space-between"` audit caught seven row layouts where titles, badges, and severity pills could touch when content grows. The pattern applied: `gap` (10–12) on the container, `flex: 1` on the growable side, `flexShrink: 0` on the fixed side (badges, chevrons, pills).

Files touched on `v1.1-work` (uncommitted):

- `src/screens/YourPetsScreen.js` — `healthHeader` ("💛 Health considerations to know" + "Tap to learn more" hint colliding) — the collision the user actually flagged on-device.
- `src/screens/SettingsScreen.js` — `row` (label vs PREMIUM badge / chevron), `premiumBadge`.
- `src/screens/TrainingScreen.js` — `cardHd` (category chip vs cadence text), `catChip`, `cadence`.
- `src/screens/RecallsScreen.js` — `sevBadge`.
- `src/screens/ChecklistScreen.js` — `progress` (label vs count).
- `src/screens/HomeScreen.js` — `progress` (label vs "X of Y done →" count).
- `src/screens/RiskScreen.js` — `sevBadge` (RiskCard).

LOW-severity items the audit flagged (emoji adjacency, `→` arrows, fragile-but-currently-fine bullets) were skipped — most already have spacing or `marginRight` and aren't actually crowded.

### Visual verification

Visual pass via simulator was attempted but blocked: no iOS simulator runtime is installed on the dev machine. Options when picking v1.1.1 back up: (a) install an iOS 18 runtime in Xcode (~6–7 GB, 10 min) for a true pixel-level pass, (b) use `expo start --web` as a rough flexbox proxy, or (c) trust the diff and verify on the next physical-device build. The fixes are mechanical (`gap` / `flex: 1` / `flexShrink: 0`) so regression risk is low, but neither path has been exercised yet.

### Build pipeline status (as of 2026-05-05)

- Build 15 (v1.1.0): on TestFlight via Transporter, on Max's iPhone, awaiting "Add for Review" on App Store Connect.
- Build 16 (v1.1.1): **shipped** — bundled the per-pet checklist + active pet switcher (added mid-cycle as Option B) + the layout collision sweep. IPA at https://expo.dev/artifacts/eas/2WQx7myWSsk2mS4Kteiyhd.ipa. Transportered to App Store Connect.

---

## 2026-05-05 — v1.1.2 patch backlog (post-build-16 polish)

Items flagged after build 16 was already in flight. Queued for the next build.

### 1. Collapsible "About {breed}" card (My Floofs)

**Today:** the About-breed card on My Floofs always renders fully expanded — origin, summary, origin story, sources/references, brachycephalic warning, plus the Health-considerations sub-section. With the v1.2 breed-health audit landing soon, each card will get longer, not shorter.

**Fix:** mirror the existing `healthOpen[pet.id]` toggle pattern. Add `aboutOpen[pet.id]` state, default collapsed. The header (breed title + tap hint) stays visible; the body (origin + summary + originStory + originNote + references + brachy warning + healthDisclosure) only renders when expanded.

**Implementation sketch:**
- `src/screens/YourPetsScreen.js` — add `aboutOpen` state, replace the breedCard `<View>` opener with a header `<TouchableOpacity>` (only the header toggles, not the whole card — so inner reference-link tappables still work). Conditionally render the expanded body. Reuse the gap/flex/flexShrink pattern from `healthHeader` for the new `breedHeader`.
- ~20 lines of code; should not require new style additions beyond a `breedHeader` row + a `breedHeaderHint` text style.

**Why deferred from build 16:** flagged after build 16 was uploaded via Transporter; user explicitly chose to ship build 16 and bundle this with the next patch rather than re-build.

### Build pipeline status (next)

- Build 17 (v1.1.2): not started. Bundles the collapsible About card plus anything else that surfaces. Branch: continue on `v1.1-work`.


---

## 2026-05-05 — v1.1 ship day (massive solo founder push)

Closing log for May 5, 2026 — the day v1.1 went from "still rebuilding the paywall" to build 16 submitted for App Store Review, plus a full v1.2 breed-health audit landed, plus the LLC paperwork that's been sitting around finally moved.

### Personal / business milestones

- EIN issued for TenTenths LLC (42-2335903)
- Amex Business Checking application submitted
- D&B documentation sent for D-U-N-S verification
- LLC publication confirmed done from 2022 — no remediation needed
- NY DOS address change deferred to a future Brooklyn batch

### v1.1 shipped

- Builds 12 → 16: iterations through paywall debugging (greyed-out trial button → custom-package-id resolver → empty RC offering → direct-product fallback), founder override (IDFV allowlist), and photo persistence (documentDirectory copy on pick)
- Switched to Apple Transporter to bypass jammed EAS Submit Free Tier queue — direct .ipa upload to App Store Connect
- Build 16 submitted to App Store Review at end of day
- Includes: Premium subscription via RevenueCat ($4.99/mo or $39/yr with 7-day annual trial), multi-pet support with active pet switcher (tap any My Floofs card → that pet becomes active + jumps to Home; tap Home hero or Checklist header to switch back), per-pet checklist data (state now keyed by pet id with one-time legacy-map migration), pet photo persistence across TestFlight/App Store updates, layout collision sweep across 7 screens, "My Floofs" rebrand
- App Store metadata cleaned up — Klafter typo fixed, manual release toggle set, sign-in unchecked
- Founder override active for Max's iPhone (IDFV `981F7B5B-46DF-4B89-AF5D-49B812EB939D`)

### v1.2 work started

- Pawgress Indicator and Tummy Tracker feature briefs committed under `docs/features/`
- Breed-health content audit COMPLETE across 47 named breeds — roughly 270 new health bullets, 210 new references citing AKC, parent breed clubs, peer-reviewed literature (Cooley 2002 on early-spay osteosarcoma, Raffan 2016 on Lab POMC, Keene 2019 ACVIM consensus on canine MVD), Washington State VCGL + UC Davis VGL for genetic tests, Berner-Garde, RVC, Cornell Feline, ACVO/OFA, BVA + International Cat Care for Scottish Fold welfare position, Merck Vet Manual
- Audit format locked to: editorial tone (never prescriptive), sourced citations per claim cluster, per-condition checklist items with cadence + category, practical owner-level tips
- Skipped intentionally: 4 generic catch-alls (mixed dog, other dog, mixed cat, other cat) and 10 designer mixes (already at audit-quality depth from prior v1.2-work content)

### Deferred to v1.1.1 patch

- Collapsible "About {breed}" card on My Floofs (mirror the existing `healthOpen` toggle pattern; ~20 lines of code)
- Any post-launch issues that surface from v1.1 users in TestFlight or App Store Review feedback


---

## 2026-05-05 — paywall placement roadmap (post-v1.1 monetization)

v1.1 ships Premium with multi-pet, expanded breed depth, and health/care tracking as the headline gates. A user with a single pet on v1.1 has no concrete reason to upgrade — the free tier is too generous. v1.2+ needs more touchpoints across the user journey that surface Premium at moments when users are demonstrably engaged and getting recurring value.

### 1. Checklist weekly refresh paywall (priority — high)

**Today:** `generateChecklist()` produces a derived list from breed/age/season that's effectively static for the pet's lifetime. Items cycle by cadence (the v1.2 cadence-reset rule unchecks them on schedule), but the underlying list doesn't refresh week to week with new tailored items. Single-pet free users see the same items forever.

**The change:**
- Each week, the checklist generates a fresh tailored refresh of new items keyed to the pet's current life stage, season, and recent care history. Some carry over (the breed-fundamentals); some are new (e.g., a senior-cat-specific oral exam reminder appears in week 8 if the cat is 7+).
- Free tier sees their first week's list (the current behavior).
- Week 2+ refresh requires Premium.

**The paywall surface:** at the bottom of the Checklist tab once the free user enters week 2, a CTA card reading something like:

> **Want next week's tailored list?**
> Floof Parents on Premium get a fresh, breed-tailored refresh every week — new items keyed to the season, your pet's age, and what you've already done.
> [Upgrade to Premium →]

CTA links directly to `PremiumScreen` modal, same surface the Settings → Upgrade flow uses today.

**Implementation notes:**
- New field on the pet record: `checklistWeekStart: Date` (set on first generation; week index = `floor((now - start) / 7days)`).
- Free tier gates by `weekIndex > 0 && !isPremium`.
- Existing free users from v1.0 / v1.1 should be grandfathered — don't yank weekly refreshes from people who already have them. Set a `grandfatheredFreeWeekly: true` flag on any pet whose `checklistWeekStart` predates the v1.2 ship date.
- Paywall copy must lead with what they're getting (a tailored next-week refresh), not just "go Premium". Apple's review guidelines also prefer specific value framing over generic upsell.
- Show the CTA at the end-of-week moment, not after every checklist tap. One nag, in context, is far better than a persistent banner.

**Why it matters:** this is the first recurring, value-aligned Premium touchpoint in the app. Multi-pet is one-time (you have multiple pets or you don't). Weekly refresh is a continual reason to upgrade because the value compounds week over week.

### 2. Future paywall touchpoints (seeds — flesh out as the product evolves)

- Health Tracker history beyond 30 days (free tier truncates).
- Recall alert push notifications (free tier sees recalls in-app; Premium gets the push).
- Multi-pet aggregate views ("3 of 12 done across all your floofs" on the home tab).
- Photo storage beyond a free-tier cap (e.g., 1 pet portrait + 5 health-record attachments free; unlimited Premium).
- Tummy Tracker PDF vet export (already specified in the v1.4 brief — Premium-gated).
- Pawgress Indicator weekly / monthly / yearly views (already specified in the brief — Daily is free; longer horizons are Premium).
- Vet integration "Schedule appointment" deep-link (already in v1.2 plan; consider gating advanced multi-vet contact storage).

Each of these gets the same treatment when its underlying feature lands: specific value framing, in-context CTA, grandfathering rules for v1.0 / v1.1 users, no nag-spam.


---

## 2026-05-06 — Weather-aware notifications (target v1.3)

A small, useful, non-creepy use of location data. Two distinct notification flows tied to local weather forecasts:

### 1. Walk-now nudges (dogs only)

If rain, snow, or storm is predicted within the next 1-2 hours, push a local notification suggesting the user get the walk in before it starts. Disabled for cats (no walk semantics).

### 2. Supply prep alerts (all species)

3-5 days before severe weather (storm, blizzard, heat wave) is forecast in the user's area, push a "do you have enough food, litter, meds?" prompt. Frames the app as a gentle ally during weather events without requiring user action.

### Implementation notes

- **Weather source:** Apple WeatherKit. Free tier is sufficient for iOS apps and requires no API key beyond developer entitlement. Includes hourly + daily forecast, severe weather alerts, and reasonable accuracy globally.
- **Fetch cadence:** on app open + once per day in the background (iOS background fetch). Don't poll continuously.
- **Notifications:** scheduled local notifications keyed off the forecast + the user's pet species. Local-only — no backend, no push server, no PII transmission.
- **Location use:** lat/long fetched in-the-moment for each WeatherKit call, then discarded. Never stored on device beyond the active fetch. Permission string in app.json should explicitly mention weather alerts as a use case.
- **Settings toggle:** new row in Settings → Notifications (or under FLOOFLIFE) to disable weather alerts globally. Per-pet toggles probably overkill for v1.3 — single global on/off ships.
- **Quiet hours:** respect the user's iOS Focus / Do Not Disturb settings; don't fire at 3 AM regardless of weather.
- **Privacy disclosure:** Privacy Policy needs an additional clause covering WeatherKit use ("location is used at fetch time only and not retained").


---

## 2026-05-06 — New home / relocation support (target v1.4 or v2.0)

Pets stress significantly during relocations and many owners underestimate the timeline for adjustment. This is real lived founder experience: the founder's own dog took 5 weeks to feel fully settled after a move. There's genuine demand for structured guidance during this transition.

### Onboarding question

A new optional question during pet onboarding (and editable later in My Floofs settings):

> "Have you recently moved or are you about to move?"

If yes, ask for the move date (past or future). Store on the pet record as `relocationDate: ISODate?`.

### 30-day species-specific transition checklist

Day-by-day care tasks for the first 30 days post-move, branched by species. Cat tactics differ significantly from dog tactics — separate flows, not a generic checklist.

- **Cats:** start in a single small "safe room" with food, water, litter, and a hiding spot; expand territory progressively over days 3-10; minimal forced interaction; familiar smells (old bedding, owner's worn shirt) carry through; pheromone diffusers (Feliway) optional.
- **Dogs:** maintain previous routine timing as much as possible; familiar walks before exploration walks; new neighborhood scout in short increments; confidence-building through known commands in new spaces.

### "What's normal vs concerning" reassurance

Inline reassurance content addressing the most common owner anxieties:

- Cats hiding for 3-5 days post-move is normal. Hiding past 10 days, refusing food past 48 hours, or excessive vocalization warrants a vet check.
- Dogs being clingy, vocal, or off their food for the first week is normal. Persistent appetite changes, accidents, or destructive behavior past 2-3 weeks warrants attention.
- Both species: changes in litter habits, vomiting, or hiding combined with other signs is a vet visit, not "just stress".

### Walk anxiety guidance (dogs)

For dogs in new neighborhoods: short familiarization walks first (sniff-only, no agenda); gradual exposure to the new sight lines, sounds, and smells; counter-conditioning with treats around triggers (other dogs, garbage trucks, kids on bikes) during the first 2 weeks.

### Week 4 / week 6 followup

If the user reports the pet's behavior hasn't normalized by week 4 or week 6, the app surfaces a soft suggestion to schedule a vet behavioral consult — not a diagnosis, just "if you're still seeing X, this is worth a 30-min vet conversation." Connects naturally to the v1.2 vet contact integration.

### Why it matters

Relocation is one of the highest-stress life events for both pets and owners, and existing pet-care apps don't address it well. This is the kind of feature that users tell their friends about ("the app actually understood my cat hiding for a week"). It's also the kind of feature that's hard to build without lived experience — the founder has it.


---

## 2026-05-06 — Emergency procedures library (target v2.0, conservative path)

A set of vet-aligned reference content for non-acute emergency situations. **Conservative scope deliberately** — see liability note below.

### What's in scope (informational only)

- "How to check your pet's temperature" — describes the procedure but always points to the vet for action on the result. Normal temp ranges by species included.
- "Signs of fever in your pet" — observational checklist (lethargy, warm ears, dry nose, decreased appetite). Lead with "call your vet immediately" rather than self-treatment.
- Cooling-down steps that are universally safe and well-established: cool water on belly + groin + paw pads, AC, shade, fan, removal from heat source. Explicitly call out that ICE is not appropriate (vasoconstriction).
- Emergency vet locator (Maps deep-link with "emergency veterinarian near me" — already in the v2.0 plan).
- Outbound links to certified educational resources rather than reproducing their content: American Red Cross Pet First Aid (course + reference), ASPCA Animal Poison Control, AVMA emergency preparedness.

### What is NOT in scope (liability gate)

The following are deliberately out of scope until specific gates are met:

- Pet CPR (illustrations or step-by-step instructions)
- Specific medication dosing (Benadryl, hydrogen peroxide for emesis, etc.)
- Step-by-step diagnostic flowcharts ("if symptom A → do B → if also C → do D")

### Liability gate (must be met before in-scope content expands)

The founder's existing app-wide disclaimer ("FloofLife provides general guidance for healthy pets. It is not a substitute for veterinary advice") is a necessary condition but **not sufficient** for the level of specificity above. Before expanding emergency content into CPR, dosing, or flowcharts, all three of the following must be in place:

- **(a) Vet advisor on retainer with DVM certification of content** — every page reviewed and signed off by a licensed Doctor of Veterinary Medicine.
- **(b) Liability insurance** — pet-care content liability rider, estimated $500-1,500/yr depending on scope and reach.
- **(c) Attorney review** — language reviewed by counsel familiar with veterinary publishing and FDA guidance on animal medicine information.

Until those three are in place, emergency content stays at the informational/observational level above and links out to certified content for anything involving action. This is intentional and matches the v1.0 emergency-content strip rationale (see backlog item d).


---

## 2026-05-06 — New monetization tier: FloofLife Vet+ (consideration for v2.0+)

A second Premium tier above the current $4.99/mo / $39/yr Premium. Contemplating; not committed; not in v1.x.

### Pricing

- **Tier 1 (current Premium):** $4.99/mo or $39/yr
- **Tier 2 (Vet+, proposed):** $9.99/mo or $79/yr (~33% savings annual)

### What Vet+ includes (proposed scope)

- **Emergency procedures library** (illustrated, conservatively scoped per the section above) — gates the deeper content behind the higher tier.
- **Vet teleconsult integration** — partnership with one or more existing teleconsult services (Pawp, Fuzzy, AskVet, Petriage, Dutch). Vet+ subscribers get a flat-rate or unlimited consult included; FloofLife collects a referral or revenue share.
- **Document storage** — vaccine records, prescriptions, X-rays, lab results uploaded and stored locally (then optionally synced to cloud once v2.0 cloud sync ships). Free tier sees current Health Tracker; Vet+ extends to unlimited document attachments + multi-year history.
- **Multi-pet aggregate health dashboard** — for households with 3+ pets, a unified upcoming-care + recall + risk view across all floofs. Premium gets per-pet; Vet+ gets the aggregate.

### Hard requirements before launch

- **Vet partnership** — at least one signed teleconsult partnership with clear referral/revenue terms.
- **Liability insurance** — same rider as needed for the emergency procedures library, plus expanded coverage for facilitating teleconsult connections.
- **Possible LLC operating agreement update** — depending on partnership structure, may require amending TenTenths LLC's operating agreement (currently set up for solo-founder app revenue; partnerships add complexity around revenue allocation and liability).
- **Apple subscription tier configuration** — second In-App Purchase product in App Store Connect, second RevenueCat offering. Trivial vs the partnership work.

### Why it's a v2.0+ consideration, not earlier

- v1.x economics work without a second tier. Single Premium gets us to product-market-fit signal first.
- Vet partnerships are slow (multi-month sales cycles) and don't accelerate product development.
- Each requirement above is real money or time; doing them prematurely burns runway without proportional revenue lift.
- The v1.x roadmap already has enough premium-gateable features (multi-pet, expanded breed depth, health tracker, weekly checklist refresh, Pawgress longer horizons, Tummy Tracker PDF) to differentiate Premium from Free without needing a second tier.

**Status:** logged as a future consideration. Don't build until at least v2.0 and ideally with documented user demand for at least one of the Vet+ pillars first (most likely teleconsult).


---

## 2026-05-06 — Seizure awareness + neurological monitoring (v1.4 awareness, v2.0 tracker, v2.0+ cross-referencing)

Roughly 5% of dogs have epilepsy or a seizure disorder in their lifetime, with elevated rates in Beagle, Border Collie, Australian Shepherd, Boxer, Miniature Schnauzer, Cavalier King Charles Spaniel, Vizsla, and Bernese Mountain Dog. Cats are less commonly affected but seizures still occur. Most owners' first encounter with a seizure is a panic moment — they don't know what to do during, what to film, what to bring to the vet, or when to call it an emergency. This is a genuinely under-served space and FloofLife is well-positioned to fill it.

The feature splits cleanly into three layers shipping at different versions.

### Layer 1 — Awareness content (target v1.4)

Build on the existing v1.2 breed-health audit, which already calls out epilepsy on Beagle, Border Collie, Aussie, Brittany, Cavalier, Cane Corso, and Mini Schnauzer entries. Expand to a dedicated awareness module accessible from the breed card and from a new top-level "Seizure 101" reference doc.

Content scope:

- **What a seizure looks like** — the three phases described in plain language: pre-ictal aura (anxiety, restlessness, attention-seeking, hiding), ictal (the seizure itself — usually under 2 minutes), postictal (disorientation, blindness, hunger, exhaustion lasting minutes to hours).
- **What to do during** — don't put hands near the mouth (no tongue-swallowing risk; bite risk to the human is real), clear obstacles, time the duration, video if possible, dim lights and reduce noise.
- **When to ER** — single seizure under 5 minutes with normal recovery: call your vet next business day. Over 5 minutes (status epilepticus): emergency. Two or more seizures in 24 hours (cluster): emergency. First-ever seizure in a dog over 5 years old: needs workup soon, not necessarily emergency.
- **What to bring the vet** — video of the seizure is gold. Notes on duration, time of day, what the pet was doing immediately before, postictal duration, recent meds, recent food/treat changes, possible toxin exposures.
- **Postictal expectations** — disoriented for minutes to hours is normal. Hungry/thirsty post-seizure is normal. Persistent neurologic deficits (continued blindness, circling, weakness) past several hours is not normal.
- **Subtle pre-seizure watch-list** — twitchiness in response to sudden noise or light, behavioral changes in the hours before (hiding, clinginess, vocalizing), "fly-biting" episodes (snapping at invisible flies), focal facial twitches, brief unresponsive staring spells.

Tone: always points to the vet for action. No diagnostic content; no medication recommendations. Editorial summary, not advice.

### Layer 2 — Seizure tracker (target v2.0)

A structured per-event log similar in shape to the Tummy Tracker. Each entry captures:

- Date/time
- Duration (in-app timer with start/stop, plus manual entry for retroactive logs)
- Type — focal (one body part, possibly conscious) vs generalized (whole body, unconscious) vs absence (brief unresponsive)
- Pre-seizure behavior (free text + checkbox shortcuts)
- Postictal duration + symptoms (free text + checkbox shortcuts)
- Suspected trigger (food, medication, vaccine, exposure, none/unknown)
- Video upload (stored locally per the existing photo-storage pattern)
- Free-text notes

Beyond the per-event log, the tracker provides:

- **Trend chart over time** — frequency, duration, time-of-day patterns
- **Cluster detection** — automated alert when 2+ seizures are logged in 24 hours, with a "this is an emergency situation; here's what to do" overlay
- **Trigger pattern recognition** — surfaces correlations between logged triggers and seizure events ("3 of your last 4 seizures were within 24 hours of a flea/tick dose — worth discussing with your vet")
- **Vet PDF export** — Premium feature; veterinary neurologists value structured seizure history heavily for diagnosis and medication titration

Storage layout follows the same per-pet inline pattern as Health Tracker (inline `seizureEvents: []` on the pet record, attachments on filesystem).

### Layer 3 — Cross-reference with diet, meds, and exposures (target v2.0+ or v3.0)

Once the user has both a Diet Log (from Tummy Tracker) and a seizure event, the app can surface possible contributing factors at the moment a seizure is logged:

- **Diet** — foods with seizure-implicated compounds (xylitol acutely; certain preservatives chronically). Cross-checks against the user's logged diet.
- **Meds** — isoxazolines (Bravecto, Nexgard, Simparica, Credelio), metronidazole, acepromazine. Cross-checks against the user's logged Health Tracker entries.
- **Plants and exposures** — sago palm, certain essential oils (especially diffused tea tree, eucalyptus, peppermint at high concentration), mycotoxins from moldy food. Cross-checks against the user's environment notes if recorded.

Framing is critical: surfaced as "possible factors to discuss with your vet," never "this caused the seizure." Sources cited inline; outbound link to the FDA Animal Drug Safety Communications and to vet-authored references for each. Owners get the information; the vet does the diagnosis.


---

## 2026-05-06 — Content principle: how we handle contested topics

The seizure module above includes a contested topic — the relationship between isoxazoline-class flea/tick medications and seizures. The FDA has flagged it; vets are split on whether the relationship is causal or coincidental. This is the first of several contested topics FloofLife will need to surface, and the principle below applies to all of them.

### The principle

When a topic is medically contested — vets are split, evidence is mixed, owner communities are divided — FloofLife surfaces both sides with sourcing and lets the owner decide with their vet. **We do not pick a side.** We are a reference layer between owners and the veterinary literature, not a clinic.

### Reference framing for the isoxazoline/seizure question

> The FDA has flagged isoxazoline-class flea/tick medications (Bravecto, Nexgard, Simparica, Credelio) for possible neurological adverse events including seizures. Vets are split on whether the connection is causal or coincidental, but it's something to consider — especially for dogs with a prior seizure history. Watch for: twitchiness from sudden noise or light, behavioral changes after a dose, unexplained tremors. Always discuss with your vet before changing medications.

That paragraph is the template. State the contested fact, note the split, give the owner a watch-list, end on the vet.

### Other contested topics that will be surfaced over time

- Vaccine titer testing vs annual revaccination — meaningful split among vets, especially for older animals
- Raw vs kibble diets — split, with significant safety concerns on raw (bacterial contamination, nutrient imbalance) that some camps minimize
- Neuter timing — early (under 6 months) vs delayed (12-24 months) has real evidence on both sides for orthopedic outcomes and certain cancer risks; varies by breed
- Ear cropping and tail docking — banned in many countries, normalized in others; ethical debate plus medical necessity claims
- Grain-free diets and DCM — FDA investigation ongoing; some lines of evidence implicate boutique exotic-protein diets, others do not
- Vaccine timing for breed-sensitive lines (the Lepto-and-Chow-Chows pattern, expanded to other breeds with documented adjuvant sensitivity)
- Spay/neuter and behavior — claims about reduced aggression are mixed; evidence varies by breed and timing

### Format for contested-topic content

Every contested-topic surface in the app follows the same four-part structure:

1. **State the topic neutrally** — describe the question without leading language ("there is an active discussion about X" rather than "X is dangerous").
2. **Summarize what each side says with sources** — at minimum, the FDA / AVMA / peer-reviewed-journal position alongside the breed-club, owner-community, or alternative-vet position. Cite both.
3. **Note what owners should watch for or consider** — a practical watch-list or set of considerations (the dog's history, the breed, the alternative options) that lets the owner have an informed conversation.
4. **Always end with "discuss with your vet"** — the owner decides; we don't.

### What we do not do

- Don't invent positions or take a side. If FloofLife's editorial voice is going to land somewhere on a contested topic, that decision needs (a) a DVM advisor on retainer, (b) attorney review, (c) explicit founder sign-off. Until those gates are met, we surface, we don't decide.
- Don't summarize a debate dishonestly. If one side has clearly stronger evidence, that strength should come through in the sourcing, not in the editorial voice.
- Don't mock or dismiss either side, even if the founder personally disagrees. Owners come to FloofLife from many priors; trust collapses if they feel their views are being editorialized against.
- If a topic is too contested to summarize fairly within the four-part format above, defer it. Better to omit than to harm trust.

This principle applies to seizure / isoxazolines first, but is the general policy for every contested medical topic the app will surface as the catalog grows.


---

## 2026-05-06 — Architecture pivot: backend buildout for v2.0 (cloud accounts + analytics + scale)

### Context

v1.0 and v1.1 shipped local-only as a fast-prototyping decision: every pet, photo, checklist state, and health record lives in AsyncStorage + the FileSystem documentDirectory on the user's device. That architectural minimalism doubled as a privacy story for v1 marketing. **It was the right call for getting to App Store; it is not the right call for the next phase.**

Going forward, FloofLife is being built as a real business with the goal of becoming a sustainable money-making product. The founder is retiring the "everything on-device" architectural decision while preserving local-only as a respected option for existing v1.0 / v1.1 users (no forced migration, ever — see GUARDRAILS).

### Strategic goal

Move from "free privacy-first checklist app" to "real product with real backend, with privacy still respected through good practices rather than architectural minimalism." Backend unlocks:

- Cross-device sync
- Server-driven recall alerts (no App Store version bump for new recalls)
- Re-engagement notifications (vaccine reminders, inactivity prompts, weather-tied alerts)
- Real analytics (PostHog) so feature decisions are data-informed, not gut-checked
- AI features (breed-from-photo, symptom triage, care recommendations)
- Tier expansion (Vet+, multi-household, family sharing)

### Cost priority

Lean stack, **$0/mo backend until we cross free-tier limits.** Founder is bootstrapping; cash burn during validation must be near-zero.

### Phase 1 — Backend foundation (target: weeks 3-6 post-v1.1)

Tech stack, all on free tiers to start:

- **Supabase free tier** (Postgres + Auth + Storage + Realtime + Edge Functions) — 500 MB database, 1 GB file storage, 50K MAU. $0/mo until we cross limits.
- **Resend free tier** for transactional email — 3,000/month, 100/day. $0/mo.
- **PostHog free tier** for product analytics — 1M events/month. $0/mo.
- **Vercel Hobby** for any serverless / edge logic — free for personal projects. $0/mo.
- **Apple Push Notification Service** — free.
- **Cloudflare R2** if/when we outgrow Supabase storage — 10 GB free, free egress.

**Total operational cost: $0/mo to start.** Graduating to paid tiers (~$50-100/mo combined) only happens when we cross free limits, which by definition means we have meaningful traction.

What gets built in Phase 1:

- User accounts: email + Apple Sign-In + Google Sign-In via Supabase Auth.
- Database schema: `users`, `pets`, `checklist_items`, `checklist_state`, `health_records`, `vaccine_logs`, `photos`, `diet_logs`, `recall_watchlist`, `seizure_logs`. Versioned migrations from day one.
- Sync layer with conflict resolution — offline-first approach (writes go to local cache, then push when online; reads prefer cache, refresh in background).
- File storage for pet photos and document uploads.
- API for the app to read/write — Supabase auto-generates a REST + Realtime API from the schema, so most CRUD is zero custom code.
- Server-side push notification dispatch via APNS.
- Server-side recall feed (the v1.3 remote-JSON plan, but now stored in Postgres rather than as a static JSON on Cloudflare Pages).

### Phase 2 — App rewrites (target: weeks 5-7 post-v1.1)

- Add an optional account-creation flow at app launch and inside Settings.
- **Local-only users keep working forever, no forced migration.** This is non-negotiable (see GUARDRAILS).
- New users on a fresh install see a "Create an account or use locally" choice.
- Sync logic in the app: offline-first, conflict resolution surfaces in UI only when truly ambiguous.
- Migration path for existing local users who choose to upgrade to cloud: read all local AsyncStorage + documentDirectory data → upload to Supabase under the new account → preserve local as cache → never wipe local until cloud sync is confirmed (per the migration constraint already documented in this file).

### Phase 3 — v2.0 ship (target: ~7 weeks post-v1.1)

- Cloud-optional version goes to App Store Review.
- Privacy Policy rewritten for the new architecture (transparent data handling, anonymous-by-default analytics, opt-in cloud, easy data deletion).
- Terms of Service updated.
- App Privacy declarations in App Store Connect updated to match.
- Marketing positioning shifts: "Now syncs across your devices" / "Never lose your pet's care history."

### Phase 4 — Backend-dependent features (target: weeks 8-12 post-v1.1)

Features that require Phase 1 to exist:

- Server-side recall alerts (push when a recall hits, no app update needed).
- Re-engagement notifications: 5-day inactivity prompt, vaccine due reminders, Pawgress streak nudges.
- Cross-device sync of all pet data.
- Pawgress with full historical data (today's local-only design caps at 7-day history on free tier).
- Tummy Tracker with vet PDF export (server-rendered PDFs).
- Real customer support — operator can look up a user by email.
- Weather-aware notifications now possible at scale (server-side WeatherKit + APNS dispatch instead of in-app fetch + local notifications).

### Phase 5 — Monetization expansion (target: month 4+)

- Vet+ tier launched (see separate Vet+ section in this file).
- Analytics-driven feature prioritization replaces gut-feel.
- AI-powered features (breed identification from photo, symptom triage, care recommendations) become technically possible because we have a backend that can run inference.

### Guardrails

These are non-negotiable rules for the architecture pivot:

- **Local-only users from v1.0 / v1.1 must keep working forever.** No forced migration. No "create an account to keep using the app" wall. The local path stays viable as a first-class option, even if it stops getting new server-driven features.
- **Privacy still matters even with a backend.** Anonymous-by-default analytics; opt-in for richer data; transparent disclosure of what is and isn't collected.
- **GDPR / CCPA compliance built in from day one** — data export endpoint, deletion request handling, retention policies, privacy-policy clauses for both. Not bolted on later.
- **Privacy Policy and Terms of Service rewritten** to reflect the new architecture before v2.0 ships. Don't update them after the fact.
- **Breach notification plan** in place before storing any PII. At minimum: who to contact internally, what to disclose to users, what timeline applies under GDPR / CCPA.
- **Stay on free tiers as long as possible.** Crossing into paid tiers should be a celebration (we have traction), not a panic. If we're paying $200/mo for backend with 50 paying users, we did something wrong.

### Architectural decision reversal (explicitly acknowledged)

The original "all data stays on device, we don't track" privacy framing was a v1.0 prototype-speed decision, not a long-term position. It was useful for getting to App Store fast and for the v1 marketing story.

Going forward, FloofLife is a backend-supported business that respects privacy through good practices — anonymous analytics, opt-in cloud, transparent policies, easy data deletion — rather than through architectural minimalism. This positioning will be reflected in v2.0 marketing copy and in the rewritten Privacy Policy. The app's relationship with user data graduates from "we never see it" to "we see what we need to make the product work, we tell you exactly what that is, and you can take it back any time." That's the more honest version anyway; the v1 framing was as much about not having servers as it was about principle.


---

## 2026-05-06 — Tick map + tick disease awareness (target v1.3 or v1.4)

### Founder context

Falafel was bitten by a tick despite being on preventatives, contracted anaplasmosis, and battled fevers and joint pain through multiple rounds of doxycycline over years, with relapse fevers later. This feature exists so other owners can avoid that journey — or, if they're already in it, feel less alone and have better information for their vet conversations.

This is the kind of feature that's hard to fake. Owners who've been through tick-borne illness will recognize the difference between "the app gets it" and "the app reads like a generic vet pamphlet."

### Layer 1 — Tick risk by location (v1.3 or v1.4)

- Pull CDC + USGS public tick distribution data + Companion Animal Parasite Council (CAPC) forecast maps
- Show the user their county or ZIP-level risk level
- Identify the tick species active in their area: Black-legged / Deer (Lyme, Anaplasmosis, Babesia), American Dog (Rocky Mountain Spotted Fever, Tularemia), Lone Star (Ehrlichia, Heartland virus, alpha-gal syndrome in humans), Brown Dog (Ehrlichia, Babesia), Gulf Coast (American canine hepatozoonosis)
- Diseases of concern per tick type with brief plain-language descriptions
- Seasonal awareness: "Tick activity peaks April-October in your area" — pulls from regional climate data + CAPC forecasts

### Layer 2 — Walk planner with tick-aware route suggestions (v1.4)

- Wooded trails are higher risk than open grass parks; tall grass and leaf litter are higher risk than short-mown turf
- Weather integration (warm + wet + still air = high tick activity)
- "Avoid tall grass and leaf litter areas during peak season" reminders surfaced contextually
- Reminds the user to do a tick check after walks during high-activity periods (15-30 min head-to-tail, especially around ears, between toes, armpits, groin, under collar)

### Layer 3 — Tick log + post-bite followup (v1.4)

When the user finds a tick on their pet, they hit "Found a tick on Falafel" and log:

- Date and time
- Location of bite on body
- Estimated time the tick was attached (if known) — disease transmission risk varies by attachment time (Lyme typically requires 24-48 hr attachment; Anaplasmosis can transmit faster)
- Tick species (with a photo guide for ID — adult vs nymph, engorged vs unfed)
- Removal method
- Photo of the tick (helpful for vet ID if the user wants to send it)

Auto-followups generate from the log:

- **Day 14 push:** "Watch for fever, lethargy, lameness, joint pain, decreased appetite. Anaplasmosis and Lyme typically present 1-2 weeks after bite. If you see any, call your vet."
- **Day 30 push:** "Talk to your vet about a 4DX or SNAP test if you've seen any symptoms since the bite — or even as a baseline. Lyme antibodies take 4-6 weeks to develop."
- **Lifetime tick log per pet** — vet finds this valuable for diagnosis decisions years later. Some tick-borne diseases relapse months or years after initial infection.

### Layer 4 — Personalized treatment context for tick-borne illness diagnosis

Editorial content (informational, not diagnostic) that surfaces when the user logs a tick-borne illness diagnosis from their vet:

- "Anaplasmosis treatment is typically a 28-day course of doxycycline. Symptoms usually resolve within 1-2 weeks of starting treatment, but the full course is needed to clear the organism."
- "Lyme disease in dogs is treated with doxycycline or amoxicillin, typically 28-30 days. Lyme nephritis is a serious complication; ask your vet about urine protein:creatinine ratio monitoring."
- "Even after treatment, watch for return of high fevers or joint stiffness over the next 6-12 months. Chronic or recurrent infections are real, especially with Anaplasmosis and Ehrlichia."

Sources cited inline: AVMA, AKC Canine Health Foundation, CAPC, peer-reviewed literature where appropriate.

**Founder's personal note (in-app, attributed):** "My dog Falafel went through this. He had multiple rounds of doxycycline over the years. The relapse fevers were unexpected and frightening. If you're going through this, you're not alone, and please push your vet to test thoroughly." This kind of personal anchor is exactly the editorial voice that distinguishes FloofLife from generic vet content.

### Layer 5 — Aggregate exposure data (v2.0+, requires backend per the Architecture pivot section)

When the backend ships:

- User opts in to share their tick-log data anonymously
- Build a heat map of tick exposure reports nationwide
- Surface to other users: "47 tick reports on this trail this season — high tick activity reported in the last 14 days"
- Long-tail data play; gets meaningfully more valuable with more users
- Privacy: aggregated geographic data only, never individual reports linked to a user; opt-in only

### Premium positioning

- **Free tier:** tick risk awareness for the user's area, basic content layer
- **Premium:** detailed risk maps, walk planner with tick-aware route suggestions, tick log + automated followups, treatment context library, lifetime exposure history

This feature is a strong Premium conversion driver. Owners in tick country with a dog will pay $4.99/month to avoid going through what Falafel did — that calculation makes itself.

### Sources to cite when implementing

- [CDC tick maps and disease data](https://www.cdc.gov/ticks/)
- [USGS tick distribution research](https://www.usgs.gov/)
- [AVMA tick-borne disease resources](https://www.avma.org/)
- [AKC Canine Health Foundation](https://www.akcchf.org/)
- [Companion Animal Parasite Council (CAPC) forecast maps](https://capcvet.org/maps/)


---

## 2026-05-07 — Polish, animation, and gamification (target v1.2 or v1.3 — HIGH priority for retention)

### Strategic context

FloofLife is currently functional but visually flat. For a subscription app to retain users past the 7-day trial, **it has to feel satisfying every time they open it.** The paywall is sellable; the daily experience needs to be enticing. This work is not "nice-to-have" — it's a core retention lever and is being treated as a hard requirement before the v1.3 marketing push.

### Guiding principle

Every interaction should produce a small dopamine hit. **Subtle, not overkill. Cute, not childish.** Branded with paw motifs throughout but tasteful. Haptics differ by interaction weight — heavier for transactions, lighter for daily care. The goal is users feel rewarded for engaging and want to come back tomorrow.

### Reference apps for inspiration (study what they do well)

- **Duolingo** — streak satisfaction, mascot personality, micro-celebrations
- **Streaks** — haptics on completion
- **Apple Fitness** — ring-close animations
- **Finch** — gentle gamification, character progression
- **Headspace** — breathing-room animations, considered branding

### Scope — visual polish

1. Paw print pattern wallpaper as subtle background texture across the app — very low opacity, brand color, repeating pattern. Available in light + dark mode variants.
2. Brand color refinement — current accent color used consistently across all interactive elements. Audit for inconsistency.
3. Card transitions — smooth scale-and-fade as cards expand/collapse (the new collapsible About card should animate, not snap).
4. List item entry animations — when My Floofs renders, pet cards stagger-fade in.
5. Empty states with personality — illustrated empty checklist, empty recall list, etc. Currently they're plain text.
6. Loading states with paw animation — a paw walking across the screen while data loads, replacing generic spinners.
7. Pull-to-refresh on Home and Checklist with custom paw-themed indicator.

### Scope — micro-interactions

1. **Checklist item completion** — when user taps the checkbox, paw stamp animation overlays the row briefly + light haptic + completion sound (optional, off by default).
2. **Pawgress fill animation** — when a checklist item completes, the Pawgress indicator visibly fills toward its next segment with a smooth animation (when Pawgress ships in v1.3).
3. **Pawgress paw-close** — when user completes a paw segment, full confetti + spinning paw animation + medium haptic + celebratory toast ("Good Floof Parent!" or similar varied messages).
4. **Paywall reveal** — cards stagger in, price highlight pulses subtly to draw eye to the trial offer.
5. **Premium purchase success** — large animation moment: confetti, paw bounce, "Welcome to FloofLife Premium!" personalized with the active pet's name.
6. **Pet switcher tap** — subtle scale-up bounce as the active pet card animates to selected state.
7. **Pet photo update** — smooth crossfade between old and new photo, brief shimmer.
8. **Streak indicators** (when daily care logged) — flame or paw glow that intensifies with streak length.

### Scope — haptics (use Expo Haptics, calibrated)

- **Light tap** (UI navigation, card taps) — `Haptics.ImpactFeedbackStyle.Light`
- **Medium tap** (checklist item complete, photo upload, settings toggle) — `Haptics.ImpactFeedbackStyle.Medium`
- **Heavy tap** (premium purchase, restore purchases, deletion confirmation) — `Haptics.ImpactFeedbackStyle.Heavy`
- **Success notification** (purchase complete, trial started) — `Haptics.NotificationFeedbackType.Success`
- **Warning notification** (paywall blocked action, error) — `Haptics.NotificationFeedbackType.Warning`
- **Error notification** (purchase failed, network error) — `Haptics.NotificationFeedbackType.Error`
- All haptics should respect system settings (iOS users can disable haptics globally).
- **Settings toggle:** "Haptic feedback" with three options (On, Subtle, Off) — default On.

### Scope — sound design (optional, off by default)

1. Paw stamp sound on checklist completion — very brief, satisfying.
2. Confetti pop on Pawgress segment close.
3. Subscription success chime.
4. All sound respects system silent mode.
5. **Settings toggle:** "Sound effects" — default OFF (many users have notifications muted; opt-in not opt-out).

### Scope — branding refinement

1. Custom app icon variants — offer 3-5 alternatives via the iOS alternate icon API: default, dark mode, paw monogram, Floof Parent badge variant.
2. Splash screen animation — paw print materializing into the FloofLife logo. Currently static.
3. Loading states throughout the app share visual language with the splash animation.
4. Tab bar icon refinement — make the active state more visually distinct (color + bounce on tap).
5. Toast notifications styled with paw motif (currently `Alert.alert`, which feels generic).

### Implementation notes

- Use **react-native-reanimated** for all animations (already common in RN, works with Expo).
- Use **Lottie** for complex animations (paw walking, confetti, Pawgress fill). Lottie files can be designed in After Effects or sourced from LottieFiles.
- Keep animation durations under **600ms** — anything longer feels slow.
- **Reduce motion:** respect the iOS Reduce Motion accessibility setting (Settings → Accessibility → Reduce Motion). When enabled, replace animations with simple fades.
- **Performance:** target 60fps throughout. Profile on iPhone 12 / iPhone SE 3rd gen as the low-end target devices.

### Phasing

- **v1.2 (with breed audit)** — basic haptics, micro-interaction polish on existing screens, animation refinement on the collapsible About card. No major new visual patterns yet.
- **v1.3 (with Pawgress + push notifications)** — full visual polish pass: paw wallpaper backgrounds, custom loading states, empty states with illustrations, Pawgress confetti + sound + haptics integration, custom app icon variants, splash screen animation. **This is the big visual moment.**
- **Ongoing** — every new feature ships with appropriate haptics + animations baked in. New features without polish are not considered done.

### Principle — retention over acquisition

Acquisition is marketing's job. Retention is the product's job. Every visual polish item in this section is a retention lever. **A user who feels satisfied opening FloofLife daily will not cancel after the trial. A user who feels nothing will cancel.**

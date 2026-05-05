# FloofLife — v1.1 Backlog: Features Stripped for v1.0 App Store Submission

**Date stripped:** 2026-04-27
**Pre-strip git commit:** `56444e1` — `v1.0-pre-strip-FULL-BACKUP - all features intact, before App Store prep`
**Pre-strip zip backup:** `~/Downloads/stickaround_v1_pre_strip_BACKUP_20260427_1622.zip`

This document is the canonical record of every feature removed or changed for v1.0 Apple App Store submission. The original code is preserved verbatim below so it can be restored exactly in v1.1.

**Restore strategy when re-adding features:** `git checkout 56444e1 -- <path>` will restore any individual file to its pre-strip state. Or unzip the backup zip into a sibling directory and copy files individually.

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

- Build 15 (v1.1.0): on TestFlight via Transporter upload, on Max's iPhone, awaiting "Add for Review" on App Store Connect.
- Build 16 (v1.1.1): not started. Will bundle the two items above plus anything else flagged before submission. Branch: continue on `v1.1-work` and bump `expo.ios.buildNumber`, OR cut a fresh `v1.1.1-work` branch — TBD.

// Trip Planning — weekend & travel guide. Pre-trip prep, packing list,
// transit-mode safety. Items pulled from AVMA travel-with-pets guidance,
// AAA pet travel resources, and owner-community packing lists.
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const SECTIONS = [
  {
    title: "1-2 Weeks Before",
    icon: "calendar-clock",
    color: theme.accent,
    items: [
      "Confirm tick + flea preventative is up to date — not the day-of, since some take 24-48h to take effect (Frontline, Nexgard, Bravecto).",
      "If flying or boarding, check vaccine records — many destinations require rabies + Bordetella within the past 6-12 months.",
      "Schedule a vet check if your pet has chronic conditions or is over 8 — get refills + a copy of records to bring along.",
      "Get an ID tag with the destination address (or your phone) in case the home tag isn't useful while traveling.",
    ],
  },
  {
    title: "Day Before",
    icon: "package-variant",
    color: "#3F8E5C",
    items: [
      "Freeze a couple days' worth of raw/wet food in zip bags. Sealed in a small cooler with ice packs, it'll keep 24-48 hours.",
      "Pack 1.5x the regular kibble portion in case of delays. Pre-portion in zip bags by meal.",
      "Bring their normal water from home in a refillable bottle for the first day — sudden water-source changes can cause GI upset.",
      "Pack a soft, familiar bed or blanket from home — the smell reduces travel anxiety more than any toy.",
      "Trim nails so they don't snag on car seats or carrier mesh.",
      "Confirm pet-friendly hotels/campsites in advance — many have weight limits or breed restrictions.",
    ],
  },
  {
    title: "Packing List",
    icon: "bag-suitcase",
    color: "#7A4F0A",
    items: [
      "Collapsible water + food bowls (Dexas, Outward Hound) — easier than rigid bowls in a bag.",
      "Leash (regular + extra in case the buckle fails) and poop bags — way more than you think you need.",
      "Familiar bed, blanket, or worn t-shirt of yours.",
      "Favorite toy + chew (helps in the car and at the destination).",
      "Travel-size first aid: styptic powder, gauze, vet wrap, tweezers (for ticks), Benadryl (vet-confirmed dose).",
      "Medications + supplements in original bottles + a printed dosing schedule.",
      "Recent photo on your phone (in case lost).",
      "Cooler with ice packs for refrigerated/raw food.",
    ],
  },
  {
    title: "Car Travel",
    icon: "car",
    color: "#3F5A30",
    items: [
      "Use a crash-tested harness (Sleepypod Clickit, Kurgo Impact) or a secured crate. Loose pets become projectiles in collisions.",
      "Stop every 2-3 hours for water + bathroom + a brief leash-walk.",
      "NEVER leave a pet in a parked car in summer. Interior temps hit 120°F+ in 10 minutes even with windows cracked.",
      "Tinted windows don't replace shade. Park in shade or take them with you.",
      "First few rides: short trips that end somewhere good (a park) so the car becomes a positive association.",
    ],
  },
  {
    title: "Air Travel",
    icon: "airplane",
    color: "#9C2A0F",
    items: [
      "Confirm airline pet policy 30+ days ahead — limits change seasonally and many flights cap pet count.",
      "In-cabin only if your pet fits under the seat (typically <20 lb in carrier). Avoid cargo for brachycephalic breeds (Frenchie, Bulldog, Boxer, Pug, Persian) — many airlines ban them outright.",
      "Health certificate from your vet within 10 days of travel (most airlines + USDA-accredited vet for international).",
      "Don't sedate without vet approval — sedation at altitude affects breathing and is the leading cause of in-cabin pet emergencies.",
      "Skip the morning meal (or feed half) to reduce nausea. Water access through carrier door OK.",
    ],
  },
  {
    title: "Train + Bus",
    icon: "train",
    color: "#5A4A30",
    items: [
      "Amtrak allows small pets (<20 lb) on most routes for $26 — book pet ticket in advance, separate from yours.",
      "Greyhound allows small service animals only — no pet pets.",
      "Carrier rules: ventilated, leak-proof, fits under seat. Same as airline-style.",
      "Bring a chew or long-lasting treat for the duration of the ride.",
    ],
  },
  {
    title: "At the Destination",
    icon: "tent",
    color: "#3F8E5C",
    items: [
      "Walk the perimeter on-leash before letting them off-leash anywhere new — they need to map the space.",
      "Note the nearest emergency vet's address before you arrive (use the Vets tab).",
      "Outdoor + cabin trips: do a tick check every night. Ticks love armpits, groin, ears, between toes.",
      "Don't let them drink from puddles or stagnant water (giardia, leptospirosis).",
      "Watch for wildlife encounters in unfamiliar terrain — porcupines, snakes, foxtails (the grass kind that lodges in paws/ears) are top emergency-vet calls in summer.",
    ],
  },
];

export default function TripScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}>
      <View style={s.intro}>
        <Text style={s.introBody}>
          A weekend trip with your pet is a gift — the planning is what keeps it that way. Sourced from AVMA travel guidance, AAA pet travel data, and owner community packing lists.
        </Text>
      </View>

      {SECTIONS.map((sec, si) => (
        <View key={si} style={s.section}>
          <View style={s.sectionHd}>
            <View style={[s.iconCircle, { backgroundColor: sec.color + "22" }]}>
              <MaterialCommunityIcons name={sec.icon} size={20} color={sec.color} />
            </View>
            <Text style={s.sectionTitle}>{sec.title}</Text>
          </View>
          {sec.items.map((it, i) => (
            <View key={i} style={s.itemRow}>
              <Text style={[s.bullet, { color: sec.color }]}>›</Text>
              <Text style={s.itemBody}>{it}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          General travel guidance only — your vet is the right call for medication adjustments, sedation questions, and breed-specific transit risks.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  intro:        { padding: 14, backgroundColor: theme.accentSoft, borderRadius: 12, marginBottom: 14 },
  introBody:    { fontSize: 13, color: theme.fg, lineHeight: 19 },
  section:      { marginBottom: 22 },
  sectionHd:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  iconCircle:   { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: theme.fg },
  itemRow:      { flexDirection: "row", paddingVertical: 6 },
  bullet:       { fontWeight: "800", marginRight: 10, fontSize: 16, lineHeight: 21 },
  itemBody:     { flex: 1, fontSize: 14, color: theme.fg, lineHeight: 21 },
  disclaimer:   { marginTop: 10, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

// About FloofLife — origin story, version, and acknowledgments. Linked
// from Settings → Story.
//
// Tone: honest framing about how FloofLife came to be. No outcome
// claims, no positioning against veterinary care. The breed-tailored
// care is the product; this screen explains why it exists.
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { theme } from "../theme";

const VERSION = Constants?.expoConfig?.version ?? "—";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 60 }}
    >
      <Text style={s.brand}>FloofLife</Text>
      <Text style={s.tagline}>Better pet parenting, on autopilot.</Text>

      <Text style={s.sectionHd}>STORY</Text>
      <View style={s.card}>
        <Text style={s.body}>
          Built by a dog dad who wanted the best for his floof — and yours.
        </Text>
        <Text style={[s.body, { marginTop: 12 }]}>
          Even with great vets and specialists, generic advice didn't always fit. So he dug into the peer-reviewed research, breed-specific clinical literature, and consumer health data to build customized care suited to his floof's specific breed — the do's, the don'ts, the things other dogs don't need to worry about.
        </Text>
        <Text style={[s.body, { marginTop: 12 }]}>
          Now that guide is here for you, too.
        </Text>
      </View>

      <Text style={s.sectionHd}>WHAT FLOOFLIFE IS NOT</Text>
      <View style={s.card}>
        <Text style={s.body}>
          FloofLife is a personal companion — not a vet visit. It surfaces breed-specific care patterns, recall data from FDA and consumer aggregators, and a place to track vaccines and preventatives. It is not a diagnostic tool, not a substitute for in-person veterinary care, and not a replacement for the clinic that knows your floof.
        </Text>
        <Text style={[s.body, { marginTop: 10, fontStyle: "italic" }]}>
          When something feels wrong, call your vet.
        </Text>
      </View>

      <Text style={s.sectionHd}>SOURCES</Text>
      <View style={s.card}>
        <Text style={s.body}>
          Breed information comes from AKC breed standards, breed-club health foundations, and peer-reviewed veterinary literature where available. Recalls come from FDA, consumer-advocacy aggregators (DogFoodAdvisor, TruthAboutPetFood), and active class action lawsuits — clearly labeled by source on each card.
        </Text>
        <Text style={[s.body, { marginTop: 10 }]}>
          The age calculator blends AVMA size-adjusted formulas, the Wang et al. 2020 epigenetic clock for dogs, and the AAFP feline life-stage curve for cats.
        </Text>
        <Text style={[s.body, { marginTop: 10, fontStyle: "italic" }]}>
          Breed origin information reflects current scholarly consensus where available, and acknowledged debate where it exists. We don't pick a side in academic disputes about ancient lineages.
        </Text>
      </View>

      <Text style={s.sectionHd}>ACKNOWLEDGMENTS</Text>
      <View style={s.card}>
        <Text style={s.body}>
          To every owner who shared a story, asked a hard question, or pushed back on something that felt off. To the vets and breed-club volunteers who quietly maintain the public reference data this app rests on. To the floofs.
        </Text>
      </View>

      <Text style={s.sectionHd}>VERSION</Text>
      <View style={s.card}>
        <Text style={s.body}>FloofLife v{VERSION}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  brand:     { fontSize: 36, fontWeight: "800", color: theme.fg, letterSpacing: -1 },
  tagline:   { fontSize: 14, color: theme.muted, marginTop: 4 },
  sectionHd: { marginTop: 22, marginBottom: 8, fontSize: 11, fontWeight: "800", color: theme.muted, letterSpacing: 1.2 },
  card:      { padding: 16, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line },
  body:      { fontSize: 13, color: theme.fg, lineHeight: 19 },
});

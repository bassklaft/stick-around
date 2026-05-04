// Dog → human age translator. Shows a stair-step timeline of life
// stages for the user's actual pet, plus an interactive panel where
// owners can refine the estimate with weight/diet/exercise/vet-care.
//
// Why this isn't "dog years × 7":
//   - Year 1 alone is roughly 15 human years (rapid maturation)
//   - Year 2 adds another 9 (~24 by age 2)
//   - After year 2, aging speed depends heavily on body size and breed
//     lifespan. Small dogs age slower; giants age fast.
//
// We model that piecewise (see lib/dogAge.js) and let lifestyle factors
// nudge the rate ±5–20%, with sensible bounds.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pet } from "../lib/storage";
import { ageSummary, lifeStageTimeline, humanYearsAt, lifestyleMultiplier } from "../lib/dogAge";
import { breedFacts, breedDisplayName, breedEmoji } from "../data/breeds";
import { getPrimaryBreed, mixedBreedLabel } from "../lib/petBreeds";
import { theme } from "../theme";

const titleCase = s => (s || "").split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");

const LIFESTYLE_OPTIONS = {
  weightStatus: [
    { value: "underweight", label: "Underweight" },
    { value: "healthy",     label: "Healthy" },
    { value: "overweight",  label: "Overweight" },
    { value: "obese",       label: "Obese" },
  ],
  diet: [
    { value: "fresh",    label: "Fresh / cooked" },
    { value: "mixed",    label: "Mixed" },
    { value: "standard", label: "Standard kibble" },
    { value: "freefeed", label: "Free-fed" },
  ],
  exercise: [
    { value: "athletic", label: "Athletic" },
    { value: "regular",  label: "Daily walks" },
    { value: "light",    label: "Light" },
    { value: "none",     label: "Sedentary" },
  ],
  vetCheckups: [
    { value: "annual", label: "Annual checkups" },
    { value: "lapsed", label: "Overdue" },
  ],
};

const LIFESTYLE_LABELS = {
  weightStatus: "Body condition",
  diet:         "Diet",
  exercise:     "Exercise",
  vetCheckups:  "Vet care",
};

export default function DogAgeScreen() {
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState(null);

  const load = useCallback(async () => {
    const p = await Pet.get();
    setPet(p);
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setLifestyleField(field, value) {
    if (!pet) return;
    const lifestyle = { ...(pet.lifestyle || {}), [field]: value };
    const next = { ...pet, lifestyle };
    setPet(next);
    await Pet.set(next);
  }

  if (!pet) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  const summary = ageSummary(pet);
  const timeline = lifeStageTimeline(pet);
  const primaryBreed = getPrimaryBreed(pet);
  const breed = breedFacts[primaryBreed];
  const breedLabel = mixedBreedLabel(pet) || titleCase(primaryBreed) || "Mixed";
  const lifestyle = pet.lifestyle || {};
  const adjustment = lifestyleMultiplier(lifestyle);
  const adjPct = Math.round((adjustment - 1) * 100);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
    >
      {/* Title strip */}
      <View style={s.titleStrip}>
        <Text style={s.kicker}>THE AGE OF YOUR {breedLabel.toUpperCase()}</Text>
        <Text style={s.kicker}>IN HUMAN YEARS</Text>
        <Text style={s.tagline}>Understand {pet.name}'s true evolution</Text>
      </View>

      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroPhotoWrap}>
          {pet.photoUri ? (
            <Image source={{ uri: pet.photoUri }} style={s.heroPhoto} />
          ) : (
            <View style={[s.heroPhoto, s.heroFallback]}>
              <Text style={{ fontSize: 64 }}>{breedEmoji(primaryBreed)}</Text>
            </View>
          )}
        </View>
        {summary.humanAge != null ? (
          <>
            <Text style={s.heroDogAge}>{pet.name} · {summary.dogAge} dog yr</Text>
            <Text style={s.heroHumanAge}>≈ {summary.humanAge}</Text>
            <Text style={s.heroHumanLabel}>human years</Text>
            <View style={s.stageBadge}>
              <Text style={s.stageBadgeText}>{summary.stage.toUpperCase()}</Text>
            </View>
          </>
        ) : (
          <Text style={s.missingAge}>Add {pet.name}'s age in onboarding to see this.</Text>
        )}
      </View>

      {/* Stair-step timeline */}
      <View style={s.section}>
        <Text style={s.sectionHd}>LIFE-STAGE TIMELINE</Text>
        <Text style={s.sectionSub}>
          Calibrated to the average {breedLabel} lifespan ({summary.lifespan.lo}–{summary.lifespan.hi} years).
        </Text>
        <View style={s.timeline}>
          {timeline.map((pt, i) => {
            const indent = Math.min(i * 14, 84);
            return (
              <View key={i} style={[s.step, { marginLeft: indent }, pt.isCurrent && s.stepCurrent]}>
                <View style={s.stepPhotoWrap}>
                  {pet.photoUri ? (
                    <Image
                      source={{ uri: pet.photoUri }}
                      style={[s.stepPhoto, !pt.isCurrent && { opacity: 0.55 }]}
                    />
                  ) : (
                    <View style={[s.stepPhoto, s.heroFallback, !pt.isCurrent && { opacity: 0.55 }]}>
                      <Text style={{ fontSize: 26 }}>{breedEmoji(primaryBreed)}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepDogAge}>{pt.label}</Text>
                  <Text style={s.stepHumanAge}>→ {pt.humanAge} years human</Text>
                  <Text style={s.stepStage}>{pt.stage}</Text>
                </View>
                {pt.isCurrent && (
                  <View style={s.youAreHere}>
                    <Text style={s.youAreHereText}>YOU ARE HERE</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Lifestyle tuner */}
      <View style={s.section}>
        <Text style={s.sectionHd}>REFINE THE ESTIMATE</Text>
        <Text style={s.sectionSub}>
          Lifestyle changes the aging rate by {adjPct >= 0 ? "+" : ""}{adjPct}% in this estimate.
          {pet.weightLbs ? ` Weight on file: ${pet.weightLbs} lb.` : ""}
        </Text>
        {Object.keys(LIFESTYLE_OPTIONS).map(field => (
          <View key={field} style={s.tunerRow}>
            <Text style={s.tunerLabel}>{LIFESTYLE_LABELS[field]}</Text>
            <View style={s.tunerChips}>
              {LIFESTYLE_OPTIONS[field].map(opt => {
                const active = (lifestyle[field] || defaultFor(field)) === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setLifestyleField(field, opt.value)}
                    style={[s.chip, active && s.chipActive]}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Vet records — placeholder for future blood-panel integration */}
      <View style={s.section}>
        <Text style={s.sectionHd}>DEEPER INSIGHTS</Text>
        <TouchableOpacity
          style={s.vetCard}
          onPress={() =>
            Alert.alert(
              "Vet records — coming soon",
              "Soon you'll be able to upload bloodwork and vet records to refine this estimate with kidney/liver markers, thyroid panel, and inflammation indicators."
            )
          }
        >
          <View style={s.vetIcon}>
            <MaterialCommunityIcons name="file-document-outline" size={28} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.vetTitle}>Upload vet records</Text>
            <Text style={s.vetSub}>
              Bloodwork + biomarkers will tighten the estimate beyond what age, breed, and routine alone can show. Coming soon.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />
        </TouchableOpacity>
      </View>

      {/* Method note + disclaimer */}
      <View style={s.section}>
        <View style={s.methodCard}>
          <Text style={s.methodTitle}>How we calculate this</Text>
          <Text style={s.methodBody}>
            • Year 1 ≈ 15 human years (rapid maturation){"\n"}
            • Year 2 adds ~9 (≈ 24 human at age 2){"\n"}
            • After year 2, aging speed depends on body size and breed lifespan — small dogs age ~4 yr/yr, giants ~7+ yr/yr{"\n"}
            • Lifestyle factors nudge the rate ±5–20% within bounds
          </Text>
          <Text style={[s.methodBody, { marginTop: 8, fontStyle: "italic" }]}>
            "1 dog year = 7 human years" is a folk estimate, not a vet formula. Real aging depends on size, breed, and care.
          </Text>
        </View>

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            FloofLife guidance is not a substitute for veterinary advice. When something feels wrong, call your vet.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function defaultFor(field) {
  return ({
    weightStatus: "healthy",
    diet:         "standard",
    exercise:     "regular",
    vetCheckups:  "annual",
  })[field];
}

const s = StyleSheet.create({
  titleStrip:   { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 4 },
  kicker:       { fontSize: 22, fontWeight: "800", color: theme.fg, letterSpacing: -0.3 },
  tagline:      { fontSize: 14, color: theme.muted, marginTop: 6 },

  hero:         { alignItems: "center", paddingTop: 18, paddingHorizontal: 22, paddingBottom: 12 },
  heroPhotoWrap:{ width: 200, height: 200, borderRadius: 100, borderWidth: 4, borderColor: theme.accent + "55", overflow: "hidden", backgroundColor: theme.accentSoft },
  heroPhoto:    { width: "100%", height: "100%" },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  heroDogAge:   { marginTop: 16, fontSize: 14, color: theme.muted, fontWeight: "600", textTransform: "capitalize" },
  heroHumanAge: { marginTop: 4, fontSize: 64, fontWeight: "800", color: theme.accent, letterSpacing: -1 },
  heroHumanLabel:{ fontSize: 12, color: theme.muted, fontWeight: "700", letterSpacing: 1.2, marginTop: -4 },
  stageBadge:   { marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.accent + "44" },
  stageBadgeText:{ fontSize: 11, fontWeight: "800", color: theme.accent, letterSpacing: 1 },
  missingAge:   { marginTop: 14, fontSize: 13, color: theme.muted, textAlign: "center" },

  section:      { paddingHorizontal: 22, marginTop: 22 },
  sectionHd:    { fontSize: 11, fontWeight: "800", color: theme.muted, letterSpacing: 1.2, marginBottom: 4 },
  sectionSub:   { fontSize: 12, color: theme.muted, lineHeight: 17, marginBottom: 12 },

  timeline:     { gap: 10 },
  step:         { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card, gap: 12 },
  stepCurrent:  { borderColor: theme.accent, backgroundColor: theme.accentSoft, borderWidth: 2 },
  stepPhotoWrap:{ width: 60, height: 60, borderRadius: 30, overflow: "hidden", backgroundColor: theme.accentSoft },
  stepPhoto:    { width: "100%", height: "100%" },
  stepDogAge:   { fontSize: 16, fontWeight: "700", color: theme.fg },
  stepHumanAge: { fontSize: 13, color: theme.muted, marginTop: 2 },
  stepStage:    { fontSize: 11, color: theme.accent, fontWeight: "700", letterSpacing: 0.5, marginTop: 2 },
  youAreHere:   { backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  youAreHereText:{ color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },

  tunerRow:     { marginBottom: 14 },
  tunerLabel:   { fontSize: 12, fontWeight: "700", color: theme.fg, marginBottom: 6, letterSpacing: 0.4 },
  tunerChips:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  chipActive:   { borderColor: theme.accent, backgroundColor: theme.accent },
  chipText:     { fontSize: 12, color: theme.fg },
  chipTextActive:{ color: "#fff", fontWeight: "700" },

  vetCard:      { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.line, gap: 12 },
  vetIcon:      { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.accentSoft },
  vetTitle:     { fontSize: 15, fontWeight: "700", color: theme.fg },
  vetSub:       { fontSize: 12, color: theme.muted, marginTop: 3, lineHeight: 17 },

  methodCard:   { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line },
  methodTitle:  { fontSize: 13, fontWeight: "700", color: theme.fg, marginBottom: 6 },
  methodBody:   { fontSize: 12, color: theme.muted, lineHeight: 18 },

  disclaimer:   { marginTop: 14, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

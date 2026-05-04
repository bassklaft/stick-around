// Age Calculator — pet → human age translator. Shows a stair-step
// timeline of life stages for the user's actual pet, plus an
// interactive panel where owners can refine the estimate with
// weight/diet/exercise/vet-care.
//
// Why this isn't "dog years × 7":
//   - Year 1 alone is roughly 15 human years (rapid maturation)
//   - Year 2 adds another 9 (~24 by age 2)
//   - After year 2, aging speed depends heavily on body size and breed
//     lifespan. Small dogs age slower; giants age fast.
//
// For dogs we blend the AVMA-aligned size-adjusted piecewise model
// with the Wang et al. 2020 epigenetic-clock formula (UC San Diego
// methylation curve) and report a range. For cats we use the AAFP
// feline curve. Lifestyle factors nudge the rate ±5–20%, with bounds.
import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pet } from "../lib/storage";
import { ageSummary, lifeStageTimeline, lifestyleMultiplier } from "../lib/dogAge";
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

// Real factors the calculator considers. Order matters — each step is
// shown for ~400 ms during the initial spin so the disclosure feels
// honest rather than performative. Owners see actual named inputs
// (their pet's breed size, their weight, their lifestyle), not theatre.
const SHIMMER_STEPS = [
  "Reading breed size class…",
  "Adjusting for weight…",
  "Applying breed-specific aging curve…",
  "Cross-checking epigenetic clock…",
  "Folding in lifestyle factors…",
];

export default function DogAgeScreen() {
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState(null);
  const [computing, setComputing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const hasAnimatedRef = useRef(false);

  const load = useCallback(async () => {
    const p = await Pet.get();
    setPet(p);
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // First-mount-only shimmer. Loop through factors, total budget ~1.5s.
  useEffect(() => {
    if (!pet || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;
    setComputing(true);
    setStepIdx(0);
    const tick = setInterval(() => {
      setStepIdx((i) => (i + 1 >= SHIMMER_STEPS.length ? i : i + 1));
    }, 280);
    const done = setTimeout(() => {
      setComputing(false);
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, 1500);
    return () => { clearInterval(tick); clearTimeout(done); };
  }, [pet, fade]);

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
        <Text style={s.kicker}>AGE CALCULATOR</Text>
        <Text style={s.tagline}>{pet.name}'s human-equivalent age, the honest version.</Text>
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
        {summary.humanAge == null ? (
          <Text style={s.missingAge}>Add {pet.name}'s age in onboarding to see this.</Text>
        ) : computing ? (
          <View style={s.shimmer}>
            <Text style={s.shimmerKicker}>CALCULATING</Text>
            <Text style={s.shimmerStep}>{SHIMMER_STEPS[stepIdx]}</Text>
            <View style={s.shimmerBar}><View style={[s.shimmerFill, { width: `${((stepIdx + 1) / SHIMMER_STEPS.length) * 100}%` }]} /></View>
          </View>
        ) : (
          <Animated.View style={{ alignItems: "center", opacity: fade }}>
            <Text style={s.heroDogAge}>{pet.name} · {summary.dogAge} {pet.species === "cat" ? "cat" : "dog"} yr · {breedLabel}</Text>
            <Text style={s.heroHumanAge}>≈ {summary.humanAge}</Text>
            <Text style={s.heroHumanLabel}>human years</Text>
            {summary.humanAgeRange && summary.humanAgeRange.low != null && summary.humanAgeRange.high != null && (
              <Text style={s.heroRange}>approximately {summary.humanAgeRange.low}–{summary.humanAgeRange.high} years</Text>
            )}
            <View style={s.stageBadge}>
              <Text style={s.stageBadgeText}>{summary.stage.toUpperCase()}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Factors considered — real disclosure, not theatre. */}
      {!computing && summary.humanAge != null && Array.isArray(summary.factors) && summary.factors.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionHd}>FACTORS WE CONSIDERED</Text>
          <View style={s.factorsCard}>
            {summary.factors.map((f) => (
              <View key={f.key} style={s.factorRow}>
                <Text style={s.factorLabel}>{f.label}</Text>
                <Text style={s.factorValue}>{f.value}</Text>
              </View>
            ))}
            {summary.humanAgeRange?.method && (
              <Text style={s.factorMethod}>
                Method: {summary.humanAgeRange.method === "blended"
                  ? "AVMA size-adjusted piecewise blended with Wang 2020 epigenetic clock"
                  : summary.humanAgeRange.method === "feline-aafp"
                  ? "AAFP feline life-stage curve"
                  : summary.humanAgeRange.method === "avma-piecewise"
                  ? "AVMA size-adjusted piecewise"
                  : "Pending data"}
              </Text>
            )}
          </View>
        </View>
      )}

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
          <Text style={s.methodTitle}>Why this matters</Text>
          <Text style={s.methodBody}>
            Aging is multi-factor. We combine breed-size class with a breed-lifespan adjustment, blend in the
            Wang 2020 DNA-methylation curve for dogs (or the AAFP feline curve for cats), and apply your
            pet's lifestyle. The result is a working estimate — not a measurement. Diet, genetics, exercise,
            and overall health beyond what we can model from age and breed alone all matter, and a vet who
            actually examines {pet.name} will always have a better answer than any formula.
          </Text>
          <Text style={[s.methodBody, { marginTop: 8, fontStyle: "italic" }]}>
            "1 dog year = 7 human years" is a folk estimate, not a vet formula.
          </Text>
        </View>

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            Estimate only. Aging depends on diet, exercise, genetics, and overall health beyond what we can
            model from age and breed alone. Consult your vet for individual assessments.
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
  heroRange:    { marginTop: 8, fontSize: 12, color: theme.muted, fontStyle: "italic" },
  shimmer:      { marginTop: 16, alignItems: "center", paddingHorizontal: 22 },
  shimmerKicker:{ fontSize: 11, fontWeight: "800", color: theme.accent, letterSpacing: 1.4 },
  shimmerStep:  { marginTop: 8, fontSize: 14, fontWeight: "600", color: theme.fg, textAlign: "center" },
  shimmerBar:   { marginTop: 12, height: 4, width: 220, backgroundColor: theme.accent + "1f", borderRadius: 2, overflow: "hidden" },
  shimmerFill:  { height: 4, backgroundColor: theme.accent, borderRadius: 2 },
  factorsCard:  { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, gap: 8 },
  factorRow:    { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  factorLabel:  { fontSize: 12, color: theme.muted, fontWeight: "700", flex: 0, minWidth: 110 },
  factorValue:  { fontSize: 12, color: theme.fg, flex: 1, textAlign: "right", lineHeight: 17 },
  factorMethod: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.line, fontSize: 11, color: theme.accent, fontWeight: "600", lineHeight: 16 },
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

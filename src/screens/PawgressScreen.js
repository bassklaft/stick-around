// Pawgress detail screen — full-size paw at top, 5 tappable rows
// below for the day's segments, streak counter, history preview
// (Premium upsell). Modal presentation from Home.
//
// Spec: docs/features/pawgress-indicator.md.
import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pet, Pets, ChecklistState } from "../lib/storage";
import { Pawgress, PAW_SEGMENTS, SEGMENT_LABELS, SEGMENT_DESCRIPTIONS, todayKey, dailySpecialFor } from "../lib/pawgress";
import { generateChecklist, effectiveStatus } from "../lib/checklist";
import { usePurchases } from "../lib/purchasesContext";
import { track } from "../lib/analytics";
import { tapLight, tapMedium, notifySuccess } from "../lib/haptics";
import PawgressPaw from "../components/PawgressPaw";
import AnimatedCheckmark from "../components/AnimatedCheckmark";
import PawgressCelebration from "../components/PawgressCelebration";
import { theme } from "../theme";

export default function PawgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { isPremium } = usePurchases();
  const [pet, setPet] = useState(null);
  const [day, setDay] = useState(null);
  const [streak, setStreak] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  // Daily-checklist remaining count, surfaced in the hero copy so
  // "all 5 pads filled" doesn't read as "everything done" when the
  // user still has daily checklist items to do.
  const [dailyRemaining, setDailyRemaining] = useState(0);
  const lastCelebratedKeyRef = useRef(null);

  const dateKey = todayKey();
  const special = dailySpecialFor(dateKey);
  // Caller passes petId as a route param so we don't have to read
  // AsyncStorage's activeId — bulletproof against any race window
  // where storage hasn't yet caught up with the user's most recent
  // active-pet swipe on Home.
  const routePetId = route?.params?.petId || null;

  const load = useCallback(async () => {
    let p = null;
    if (routePetId) {
      const all = await Pets.list();
      p = all.find((x) => x.id === routePetId) || null;
    }
    if (!p) p = await Pet.get();
    setPet(p);
    if (!p?.id) return;
    const d = await Pawgress.getDay(p.id, dateKey);
    setDay(d);
    setStreak(await Pawgress.getStreak(p.id));
    // Compute daily-checklist items still pending so the hero copy
    // can mention them when the 5 pads are all filled but breed-
    // specific daily care is still outstanding.
    const items = generateChecklist(p);
    const state = await ChecklistState.get(p.id);
    const dailyPending = items.filter((it) => {
      if (it.frequency !== "daily") return false;
      const status = effectiveStatus(it, state[it.id]);
      return status !== "done" && status !== "skipped";
    }).length;
    setDailyRemaining(dailyPending);
  }, [dateKey, routePetId]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  useLayoutEffect(() => {
    navigation.setOptions({
      title: pet?.name ? `${pet.name}'s Pawgress` : "Pawgress",
    });
  }, [navigation, pet]);

  async function handleToggle(segment) {
    if (!pet?.id) return;
    const next = await Pawgress.toggleSegment(pet.id, segment, dateKey);
    setDay(next);
    track("pawgress_pad_tapped", {
      pad: segment,
      completed: !!next?.[segment],
      day_count_filled: Pawgress.countCompleted(next),
      pet_species: pet.species,
    });
    if (next?.[segment]) tapMedium();
    else tapLight();

    // Celebrate when "today is fully done" — 5 pads AND daily
    // checklist all-clear. Fires only once per pet+date via the
    // celebration-key ref. Pads-only completion no longer triggers
    // the green-check + spin (that was the build-23 mismatch the
    // user flagged: "Max is set for today" while daily items still
    // pending).
    if (Pawgress.isAllFive(next) && dailyRemaining === 0) {
      const key = `${pet.id}:${dateKey}`;
      if (lastCelebratedKeyRef.current !== key) {
        lastCelebratedKeyRef.current = key;
        track("pawgress_day_completed", {
          all_five: true,
          daily_checklist_done: true,
          pet_species: pet.species,
          time_of_day: new Date().getHours(),
        });
        notifySuccess();
        setCelebrating(true);
        // Refresh streak after the celebration so it reflects the new day count.
        setTimeout(async () => {
          if (pet?.id) setStreak(await Pawgress.getStreak(pet.id));
        }, 200);
      }
    }
  }

  if (!pet) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  if (!day) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  const completed = Pawgress.countCompleted(day);
  const allFive = completed === 5;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 60, paddingHorizontal: 20 }}
      >
        <View style={s.heroCard}>
          {/* Green-check + spin only fire when the user has wrapped
              everything for today — 5 pads AND no pending daily
              checklist items. Reads as "today is fully done"
              instead of "5 pads alone". */}
          <PawgressPaw
            completion={day}
            size={220}
            colorMode="today"
            isComplete={allFive && dailyRemaining === 0}
          />
          <Text style={s.heroSummary}>
            {allFive
              ? `Today's 5 pads filled · ${pet.name}`
              : `${completed} of 5 pads filled`}
          </Text>
          {streak > 0 && (
            <View style={s.streakRow}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <Text style={s.streakText}>{streak}-day streak</Text>
            </View>
          )}
          <Text style={s.heroHint}>
            {allFive
              ? (dailyRemaining > 0
                  ? `Pads done — but ${dailyRemaining} daily checklist item${dailyRemaining === 1 ? "" : "s"} still need attention. Tap "This Week" on Home to finish those.`
                  : "Sweet dreams. Come back tomorrow for another paw.")
              : "Complete today's pawgress checklist to fill in the paw!"}
          </Text>
        </View>

        <Text style={s.sectionHd}>TODAY'S PADS</Text>

        {PAW_SEGMENTS.map((segment) => {
          const isSpecial = segment === "special";
          const filled = !!day[segment];
          return (
            <TouchableOpacity
              key={segment}
              onPress={() => handleToggle(segment)}
              activeOpacity={0.7}
              style={[s.padRow, filled && s.padRowFilled]}
              accessibilityRole="button"
              accessibilityLabel={`${SEGMENT_LABELS[segment]}, ${filled ? "completed" : "not completed"}`}
              accessibilityState={{ checked: filled }}
            >
              <View style={[s.padCheckbox, filled && s.padCheckboxFilled]}>
                {filled ? (
                  <AnimatedCheckmark size={18} color="#fff" strokeWidth={2.5} />
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.padTitle, filled && s.padTitleFilled]}>
                  {isSpecial ? special.label : SEGMENT_LABELS[segment]}
                </Text>
                <Text style={s.padDescription}>
                  {isSpecial
                    ? "Today's rotating extra. Updates daily."
                    : SEGMENT_DESCRIPTIONS[segment]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Premium history teaser. Free tier sees today only; Premium
            unlocks weekly / monthly / yearly views per the spec. */}
        {!isPremium && (
          <TouchableOpacity
            onPress={() => {
              track("pawgress_history_premium_tapped");
              navigation.navigate("Premium");
            }}
            style={s.historyTease}
            activeOpacity={0.85}
          >
            <View style={s.historyIconCircle}>
              <MaterialCommunityIcons name="calendar-month" size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.historyTitle}>See {pet.name}'s history</Text>
              <Text style={s.historySub}>Premium unlocks the past week, month, and year of paws.</Text>
            </View>
            <View style={s.historyBadge}>
              <Text style={s.historyBadgeText}>PREMIUM</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            Pawgress is encouragement, not judgement. Empty pads at the end of the day are fine — tomorrow is a fresh paw.
          </Text>
        </View>
      </ScrollView>
      <PawgressCelebration
        visible={celebrating}
        onDone={() => setCelebrating(false)}
        headline={pet?.name ? `${pet.name} is set for today` : "All 5 today"}
      />
    </>
  );
}

const s = StyleSheet.create({
  heroCard:        { alignItems: "center", paddingVertical: 18, paddingHorizontal: 18, backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.line, marginTop: 8 },
  heroSummary:     { fontSize: 18, fontWeight: "700", color: theme.fg, marginTop: 12, textAlign: "center" },
  streakRow:       { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.accentSoft },
  streakText:      { fontSize: 13, fontWeight: "700", color: theme.accent },
  heroHint:        { fontSize: 12, color: theme.muted, marginTop: 10, textAlign: "center", fontStyle: "italic" },
  sectionHd:       { marginTop: 22, marginBottom: 10, fontSize: 11, fontWeight: "700", color: theme.muted, letterSpacing: 1.2 },
  padRow:          { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card, marginBottom: 8 },
  padRowFilled:    { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  padCheckbox:     { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: theme.muted, alignItems: "center", justifyContent: "center" },
  padCheckboxFilled:{ backgroundColor: theme.accent, borderColor: theme.accent },
  padTitle:        { fontSize: 15, fontWeight: "700", color: theme.fg },
  padTitleFilled:  { color: theme.accent },
  padDescription:  { fontSize: 12, color: theme.muted, marginTop: 3, lineHeight: 17 },
  historyTease:    { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginTop: 18, borderRadius: 12, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.accent + "55", borderStyle: "dashed" },
  historyIconCircle:{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: theme.accentSoft },
  historyTitle:    { fontSize: 14, fontWeight: "700", color: theme.fg },
  historySub:      { fontSize: 12, color: theme.muted, marginTop: 2 },
  historyBadge:    { backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  historyBadgeText:{ color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  disclaimer:      { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:  { fontSize: 12, color: theme.fg, lineHeight: 18, textAlign: "center", fontStyle: "italic" },
});

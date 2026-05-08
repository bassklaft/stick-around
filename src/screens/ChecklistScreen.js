// Weekly checklist — extracted from the prior YourPets screen so it
// stands as its own bottom-tab destination.
import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Pet, Pets, ChecklistState } from "../lib/storage";
import { generateChecklist, effectiveStatus } from "../lib/checklist";
import { track } from "../lib/analytics";
import { tapMedium, tapLight, notifySuccess } from "../lib/haptics";
import ActivePetTitle from "../components/ActivePetTitle";
import ActivePetChip from "../components/ActivePetChip";
import PetSwitcherModal from "../components/PetSwitcherModal";
import { theme } from "../theme";

export default function ChecklistScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [pet, setPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [items, setItems] = useState([]);
  const [state, setState] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.6)).current;
  const lastCelebratedKeyRef = useRef(null);

  const multiPet = pets.length > 1;

  const load = useCallback(async () => {
    const p = await Pet.get();
    setPet(p);
    const all = await Pets.list();
    setPets(all);
    setItems(generateChecklist(p));
    setState(await ChecklistState.get(p?.id));
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Pet-name context header in the nav bar + active-pet chip on right
  // (multi-pet only). Title is tappable to open the switcher; chip is
  // a parallel affordance for the same action.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <ActivePetTitle
          pet={pet}
          screenName="Checklist"
          multiPet={multiPet}
          onPress={() => setSwitcherVisible(true)}
        />
      ),
      headerRight: multiPet
        ? () => <ActivePetChip pet={pet} onPress={() => setSwitcherVisible(true)} />
        : undefined,
    });
  }, [navigation, pet, multiPet]);

  async function handlePickPet(petId) {
    if (!petId || petId === pet?.id) {
      setSwitcherVisible(false);
      return;
    }
    await Pets.setActive(petId);
    track("active_pet_switched", { source: "checklist_switcher", pet_count: pets.length });
    tapLight();
    setSwitcherVisible(false);
    load();
  }

  async function setStatus(id, status) {
    if (!pet?.id) return;
    const next = await ChecklistState.setItem(pet.id, id, status);
    setState(next);
    track("checklist_item_toggled", { action: status });
    if (status === "done") tapMedium();
    else tapLight();

    // Celebrate the moment the user completes ALL items for this pet.
    // De-dup so re-toggling the last item doesn't fire repeatedly:
    // one celebration per pet+date+itemcount combo per session.
    if (status === "done" && items.length > 0) {
      const stillUndone = items.some(i => {
        if (i.id === id) return false; // the just-toggled item
        return effectiveStatus(i, next[i.id]) !== "done";
      });
      if (!stillUndone) {
        const today = new Date().toISOString().slice(0, 10);
        const key = `${pet.id}:${today}:${items.length}`;
        if (lastCelebratedKeyRef.current !== key) {
          lastCelebratedKeyRef.current = key;
          fireCelebration();
        }
      }
    }
  }

  function fireCelebration() {
    track("checklist_all_done");
    notifySuccess();
    setCelebrationVisible(true);
    celebrationOpacity.setValue(0);
    celebrationScale.setValue(0.6);
    Animated.parallel([
      Animated.timing(celebrationOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(celebrationScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start(() => {
      // Hold visible for ~1.4s, then fade out.
      setTimeout(() => {
        Animated.timing(celebrationOpacity, { toValue: 0, duration: 350, useNativeDriver: true })
          .start(() => setCelebrationVisible(false));
      }, 1400);
    });
  }

  if (!pet) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  const completed = items.filter(i => effectiveStatus(i, state[i.id]) === "done").length;

  return (
    <>
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <View style={s.progress}>
        <Text style={s.progressLabel}>This week</Text>
        <Text style={s.progressCount}>{completed} of {items.length} done</Text>
      </View>

      {items.map((it, i) => {
        const status = effectiveStatus(it, state[it.id]);
        const done = status === "done";
        const skipped = status === "skipped";
        return (
          <View key={it.id + i} style={[s.item, done && s.itemDone, skipped && s.itemSkipped]}>
            <TouchableOpacity onPress={() => setStatus(it.id, done ? "open" : "done")} style={s.checkbox}>
              <View style={[s.checkboxBox, done && s.checkboxDone]}>
                {done && <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text>}
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[s.itemTitle, done && { textDecorationLine: "line-through", color: theme.muted }]}>{it.title}</Text>
              {it.why && <Text style={s.itemWhy}>{it.why}</Text>}
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {it.cadence && <Text style={s.tag}>{it.cadence}</Text>}
                {it.category && <Text style={[s.tag, s.tagAlt]}>{it.category}</Text>}
              </View>
            </View>
            <TouchableOpacity onPress={() => setStatus(it.id, skipped ? "open" : "skipped")} style={s.skipBtn}>
              <Text style={[s.skipText, skipped && { color: theme.accent, fontWeight: "700" }]}>{skipped ? "skipped" : "skip"}</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>FloofLife guidance is not a substitute for veterinary advice. When something feels wrong, call your vet.</Text>
      </View>
    </ScrollView>
    <PetSwitcherModal
      visible={switcherVisible}
      onClose={() => setSwitcherVisible(false)}
      pets={pets}
      activeId={pet?.id}
      onPick={handlePickPet}
    />
    {celebrationVisible && (
      <Animated.View
        pointerEvents="none"
        style={[
          s.celebrationOverlay,
          { opacity: celebrationOpacity, transform: [{ scale: celebrationScale }] },
        ]}
      >
        <Text style={s.celebrationEmoji}>🎉</Text>
        <Text style={s.celebrationText}>{pet?.name ? `${pet.name} is set for today` : "All set for today"}</Text>
      </Animated.View>
    )}
    </>
  );
}

const s = StyleSheet.create({
  celebrationOverlay:{ position: "absolute", top: "40%", left: 24, right: 24, paddingVertical: 22, paddingHorizontal: 18, borderRadius: 18, backgroundColor: theme.card, borderWidth: 2, borderColor: theme.accent, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  celebrationEmoji:{ fontSize: 48 },
  celebrationText:{ marginTop: 8, fontSize: 16, fontWeight: "700", color: theme.fg, textAlign: "center", textTransform: "capitalize" },
  progress:     { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 14, paddingHorizontal: 16, backgroundColor: theme.accentSoft, borderRadius: 12, marginBottom: 16, gap: 12 },
  progressLabel:{ color: theme.fg, fontWeight: "700", fontSize: 14, letterSpacing: 0.5 },
  progressCount:{ color: theme.accent, fontWeight: "800", fontSize: 18 },
  item:         { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, marginBottom: 8 },
  itemDone:     { backgroundColor: "#F2EBE0", opacity: 0.85 },
  itemSkipped:  { opacity: 0.55 },
  checkbox:     { paddingRight: 12, paddingTop: 2 },
  checkboxBox:  { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: theme.muted, alignItems: "center", justifyContent: "center" },
  checkboxDone: { backgroundColor: theme.green, borderColor: theme.green },
  itemTitle:    { fontSize: 15, fontWeight: "600", color: theme.fg, lineHeight: 20 },
  itemWhy:      { fontSize: 12, color: theme.muted, marginTop: 4, lineHeight: 17 },
  tag:          { fontSize: 10, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: theme.accentSoft, color: theme.accent, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  tagAlt:       { backgroundColor: "#EDE3D2", color: theme.muted },
  skipBtn:      { paddingHorizontal: 6, paddingVertical: 4 },
  skipText:     { fontSize: 11, color: theme.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  disclaimer:   { marginTop: 24, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

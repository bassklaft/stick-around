// Weekly checklist — extracted from the prior YourPets screen so it
// stands as its own bottom-tab destination.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Pet, ChecklistState } from "../lib/storage";
import { generateChecklist } from "../lib/checklist";
import { theme } from "../theme";

export default function ChecklistScreen() {
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState(null);
  const [items, setItems] = useState([]);
  const [state, setState] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const p = await Pet.get();
    setPet(p);
    setItems(generateChecklist(p));
    setState(await ChecklistState.get());
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setStatus(id, status) {
    const next = await ChecklistState.setItem(id, status);
    setState(next);
  }

  if (!pet) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  const completed = items.filter(i => state[i.id]?.status === "done").length;

  return (
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
        const status = state[it.id]?.status;
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
  );
}

const s = StyleSheet.create({
  progress:     { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 14, paddingHorizontal: 16, backgroundColor: theme.accentSoft, borderRadius: 12, marginBottom: 16 },
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

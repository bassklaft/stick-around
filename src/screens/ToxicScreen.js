import React, { useState, useMemo } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toxicFoods } from "../data/toxicFoods";
import { toxicPlants } from "../data/toxicPlants";
import { theme } from "../theme";

const SEV_COLOR = {
  severe:   { bg: "#F9DAD0", fg: "#9C2A0F", label: "ER NOW" },
  moderate: { bg: "#FCE9C8", fg: "#7A4F0A", label: "VET CALL" },
  mild:     { bg: "#E2EFDC", fg: "#3F5A30", label: "MONITOR" },
};

export default function ToxicScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("foods");
  const [query, setQuery] = useState("");

  const data = tab === "foods" ? toxicFoods : toxicPlants;
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(d => d.name.toLowerCase().includes(q) || (d.note || "").toLowerCase().includes(q));
  }, [data, query]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 8 }}>
      <View style={s.disclaimer}>
        <Text style={s.disclaimerHd}>⚠ NOT EXHAUSTIVE</Text>
        <Text style={s.disclaimerBody}>
          Curated from ASPCA, AVMA, and Pet Poison Helpline data and updated regularly — but new research emerges and not every substance is listed. If your pet ate something that isn't here, treat it as a possible emergency and call:
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL("tel:18884264435")} style={s.callBtn}>
          <Text style={s.callBtnText}>📞 ASPCA Poison Control · (888) 426-4435</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL("tel:18557647661")} style={[s.callBtn, { backgroundColor: "#F5DDD2" }]}>
          <Text style={s.callBtnText}>📞 Pet Poison Helpline · (855) 764-7661</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8 }}>
        {["foods", "plants"].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === "foods" ? "Foods" : "Plants"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        value={query} onChangeText={setQuery}
        placeholder={`Search ${tab}…`} placeholderTextColor={theme.muted}
        style={s.search}
      />
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 60 }}
        data={filtered}
        keyExtractor={(item, i) => item.name + i}
        renderItem={({ item }) => {
          const sev = SEV_COLOR[item.severity] || SEV_COLOR.mild;
          return (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowName}>{item.name}</Text>
                <Text style={s.rowNote}>{item.note}</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                  {item.species.map(sp => (
                    <Text key={sp} style={s.speciesTag}>{sp === "dog" ? "🐕 dog" : "🐈 cat"}</Text>
                  ))}
                </View>
              </View>
              <View style={[s.sevBadge, { backgroundColor: sev.bg }]}>
                <Text style={[s.sevText, { color: sev.fg }]}>{sev.label}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={{ color: theme.muted, textAlign: "center", marginTop: 40 }}>No matches.</Text>}
        ListFooterComponent={
          <View style={s.footerDisclaimer}>
            <Text style={s.footerDisclaimerText}>
              FloofLife provides general care guidance and is not a substitute for professional veterinary care. Always consult your veterinarian for medical decisions.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  tab:        { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  tabActive:  { backgroundColor: theme.accent, borderColor: theme.accent },
  tabText:    { color: theme.fg, fontWeight: "600", fontSize: 14 },
  tabTextActive:{ color: "#fff" },
  search:     { marginTop: 12, marginHorizontal: 20, marginBottom: 8, backgroundColor: theme.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.fg, borderWidth: 1, borderColor: theme.line },
  row:        { flexDirection: "row", padding: 14, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.line, marginBottom: 8, alignItems: "flex-start", gap: 10 },
  rowName:    { fontSize: 15, fontWeight: "700", color: theme.fg },
  rowNote:    { fontSize: 12, color: theme.muted, marginTop: 4, lineHeight: 17 },
  speciesTag: { fontSize: 11, color: theme.muted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "#EDE3D2" },
  sevBadge:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  sevText:    { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  disclaimer: { marginHorizontal: 20, marginBottom: 12, padding: 14, backgroundColor: "#FCE9C8", borderRadius: 12, borderWidth: 1, borderColor: "#E0A82E" },
  disclaimerHd: { fontSize: 11, fontWeight: "800", color: "#7A4F0A", letterSpacing: 1.2, marginBottom: 6 },
  disclaimerBody: { fontSize: 12, color: "#5A3F0A", lineHeight: 17, marginBottom: 10 },
  callBtn:    { backgroundColor: "#F9DAD0", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
  callBtnText:{ fontSize: 12, fontWeight: "700", color: "#9C2A0F", textAlign: "center", letterSpacing: 0.3 },
  footerDisclaimer:    { marginTop: 16, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  footerDisclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

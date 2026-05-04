import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pet } from "../lib/storage";
import { usePurchases } from "../lib/purchasesContext";
import { mixedBreedLabel, getPrimaryBreed } from "../lib/petBreeds";
import { theme } from "../theme";

const titleCase = s => s.split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState(null);
  const { isPremium } = usePurchases();

  useEffect(() => { Pet.get().then(setPet); }, []);

  if (!pet) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  function openMultiPet() {
    if (!isPremium) {
      navigation.navigate("Premium");
      return;
    }
    navigation.navigate("AddPet");
  }

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 60 }}>
      <View style={s.card}>
        <Text style={s.h2}>{pet.name}</Text>
        <Text style={s.sub}>{mixedBreedLabel(pet) || titleCase(getPrimaryBreed(pet))} {pet.species} · {pet.ageYears} yr{pet.weightLbs ? ` · ${pet.weightLbs} lb` : ""}</Text>
      </View>

      <Text style={s.sectionHd}>SUBSCRIPTION</Text>
      {isPremium ? (
        <TouchableOpacity onPress={() => navigation.navigate("Premium")} style={[s.card, { borderColor: theme.accent }]}>
          <Text style={[s.body, { fontWeight: "700", color: theme.accent }]}>⭐ Premium active</Text>
          <Text style={[s.sub, { marginTop: 4 }]}>Tap to view details or restore on another device.</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate("Premium")} style={[s.card, { borderColor: theme.accent }]}>
          <Text style={[s.body, { fontWeight: "700", color: theme.accent }]}>⭐ Upgrade to Premium</Text>
          <Text style={[s.sub, { marginTop: 4 }]}>$4.99/mo or $39/yr — multi-floof, expanded breed depth, health & care tracking.</Text>
        </TouchableOpacity>
      )}

      <Text style={s.sectionHd}>FEATURES</Text>
      <TouchableOpacity onPress={openMultiPet} style={s.row}>
        <Text style={s.rowLabel}>Multi-floof support</Text>
        {isPremium ? (
          <Text style={{ color: theme.muted }}>›</Text>
        ) : (
          <View style={s.premiumBadge}>
            <Text style={s.premiumBadgeText}>PREMIUM</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={s.sectionHd}>HELP</Text>
      <Row label="Contact support"   onPress={() => Linking.openURL("mailto:hello@stickaround.app")} />
      <Row label="Privacy policy"    onPress={() => Alert.alert("Privacy", "FloofLife stores all data on your device. We do not collect, transmit, or sell your data.")} />
      <Row label="Terms of service"  onPress={() => Alert.alert("Terms", "FloofLife provides general guidance for healthy pets. It is not a substitute for veterinary advice.")} />

      <Text style={s.sectionHd}>DANGER ZONE</Text>
      <TouchableOpacity onPress={() => Alert.alert("Reset FloofLife?", "This deletes your pet profile and all checklist data. Cannot be undone.", [
        { text: "Cancel" },
        { text: "Delete", style: "destructive", onPress: async () => { await Pet.clear(); Alert.alert("Done", "Restart the app."); } },
      ])} style={[s.card, { borderColor: theme.red }]}>
        <Text style={[s.body, { color: theme.red, fontWeight: "700" }]}>Reset all data</Text>
      </TouchableOpacity>

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>FloofLife provides general guidance for healthy pets. It is not a substitute for veterinary advice. Always consult your vet for medical questions.</Text>
      </View>
    </ScrollView>
  );
}

function Row({ label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={{ color: theme.muted }}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  h2:           { fontSize: 22, fontWeight: "700", color: theme.fg },
  sub:          { fontSize: 13, color: theme.muted, marginTop: 4, textTransform: "capitalize" },
  body:         { fontSize: 14, color: theme.fg, lineHeight: 20 },
  card:         { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 8 },
  sectionHd:    { marginTop: 18, marginBottom: 8, fontSize: 11, fontWeight: "700", color: theme.muted, letterSpacing: 1.2 },
  row:          { flexDirection: "row", justifyContent: "space-between", padding: 14, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.line, marginBottom: 6, alignItems: "center" },
  rowLabel:     { fontSize: 14, color: theme.fg },
  disclaimer:   { marginTop: 24, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
  premiumBadge: { backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  premiumBadgeText:{ color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
});

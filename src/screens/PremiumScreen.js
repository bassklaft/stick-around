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
          Stick Around guidance is sourced from public veterinary references. It is not a substitute for veterinary advice.
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

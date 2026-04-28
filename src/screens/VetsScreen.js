// Vets Near Me — choose between Apple Maps or Google Maps. iOS users
// often prefer one strongly over the other; we don't decide for them.
import React from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const APPLE_MAPS  = (q) => `https://maps.apple.com/?q=${encodeURIComponent(q)}`;
const GOOGLE_MAPS = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export default function VetsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 12 }]}>
      <View style={s.iconCircle}>
        <MaterialCommunityIcons name="hospital-marker" size={48} color={theme.accent} />
      </View>
      <Text style={s.title}>Find Vets Near You</Text>
      <Text style={s.body}>
        Choose your preferred map app — both will use your current location to search for nearby veterinary clinics.
      </Text>

      <TouchableOpacity onPress={() => Linking.openURL(APPLE_MAPS("veterinarian")).catch(() => {})} style={s.btn}>
        <MaterialCommunityIcons name="apple" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={s.btnText}>Open in Apple Maps</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Linking.openURL(GOOGLE_MAPS("veterinarian")).catch(() => {})} style={[s.btn, s.btnAlt]}>
        <MaterialCommunityIcons name="google" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={s.btnText}>Open in Google Maps</Text>
      </TouchableOpacity>

      <View style={s.divider} />

      <Text style={s.subTitle}>24-hour emergency vet</Text>
      <Text style={s.body}>
        For after-hours emergencies, search "emergency veterinary hospital" — many regular clinics close evenings and weekends.
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL(APPLE_MAPS("emergency veterinary hospital")).catch(() => {})} style={[s.btnSmall, s.btnUrgent]}>
        <MaterialCommunityIcons name="hospital-box-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={s.btnSmallText}>Find emergency vet (Apple)</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL(GOOGLE_MAPS("emergency veterinary hospital")).catch(() => {})} style={[s.btnSmall, s.btnUrgent, { marginTop: 8 }]}>
        <MaterialCommunityIcons name="hospital-box-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={s.btnSmallText}>Find emergency vet (Google)</Text>
      </TouchableOpacity>

      <Text style={s.hint}>
        Tip: save your regular vet's number in your phone Contacts as "🐾 Vet" so it's instantly searchable in an emergency.
      </Text>

      <View style={s.footerDisclaimer}>
        <Text style={s.footerDisclaimerText}>
          FloofLife provides general care guidance and is not a substitute for professional veterinary care. Always consult your veterinarian for medical decisions.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { flex: 1, backgroundColor: theme.bg, alignItems: "center", paddingHorizontal: 28 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: 14, marginTop: 8 },
  title:      { fontSize: 22, fontWeight: "800", color: theme.fg, marginBottom: 6, textAlign: "center" },
  subTitle:   { fontSize: 16, fontWeight: "700", color: theme.fg, marginBottom: 6, alignSelf: "stretch" },
  body:       { fontSize: 13, color: theme.muted, textAlign: "center", lineHeight: 19, marginBottom: 18 },
  btn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: theme.accent, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignSelf: "stretch", marginBottom: 10 },
  btnAlt:     { backgroundColor: "#3F8E5C" },
  btnText:    { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
  btnSmall:   { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: theme.muted, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: "stretch" },
  btnSmallText:{ color: "#fff", fontWeight: "700", fontSize: 13 },
  btnUrgent:  { backgroundColor: "#C04A2C" },
  divider:    { width: "100%", height: 1, backgroundColor: theme.line, marginVertical: 24 },
  hint:       { fontSize: 11, color: theme.muted, textAlign: "center", marginTop: 24, lineHeight: 17, fontStyle: "italic" },
  footerDisclaimer:    { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft, alignSelf: "stretch" },
  footerDisclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17, textAlign: "center" },
});

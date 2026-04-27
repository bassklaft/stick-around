// Emergency Resources — v1.0 build (App Store submission).
//
// This screen is INTENTIONALLY a resource directory. It does not
// contain step-by-step CPR or first-aid instructions. The earlier
// EmergencyScreen with chest-type CPR + induced-vomiting protocol is
// preserved at git commit 56444e1 and in V1_REMOVED_FEATURES.md, to
// be restored after a signed licensed-DVM partnership reviews the
// content.
//
// What this screen does:
//   - Tap-to-call poison-control hotlines
//   - Maps deep-link to nearest 24-hour emergency vet (Apple + Google)
//   - Maps deep-link to AAHA-accredited hospital lookup
//   - Outbound link to the American Red Cross Pet First Aid course
//   - The toxic-ingestion protocol that points OUT to poison control
//     (it tells you what NOT to do at home + what to bring to the ER —
//     no induced-vomiting recipes, no charcoal dosing)
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { POISON_HOTLINES, TOXIC_INGESTION_PROTOCOL } from "../data/emergencyProtocols";

const APPLE_MAPS  = q => `https://maps.apple.com/?q=${encodeURIComponent(q)}`;
const GOOGLE_MAPS = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();

  function openMaps(query) {
    const url = Platform.OS === "ios" ? APPLE_MAPS(query) : GOOGLE_MAPS(query);
    Linking.openURL(url).catch(() => {});
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}
    >
      {/* Top alarm — call vet first */}
      <View style={s.alarm}>
        <Text style={s.alarmHd}>⚠ READ THIS FIRST</Text>
        <Text style={s.alarmBody}>
          If something is happening RIGHT NOW, call your vet or poison control before doing anything else. This screen is a resource directory — not a substitute for a real-time call to a licensed veterinarian.
        </Text>
        {POISON_HOTLINES.map((h, i) => (
          <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${h.phone}`)} style={s.callBtn}>
            <MaterialCommunityIcons name="phone" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.callBtnText}>{h.name}: {h.display}</Text>
          </TouchableOpacity>
        ))}
        <Text style={s.alarmFee}>Both poison-control lines charge a consultation fee (~$85–95) and operate 24/7.</Text>
      </View>

      {/* Find an emergency vet via Maps */}
      <Text style={s.sectionHd}>FIND AN EMERGENCY VET NEAR YOU</Text>
      <Text style={s.sectionSub}>
        Maps will use your current location to search. Save your nearest 24-hour clinic to your phone Contacts now — when you actually need it, you won't want to be searching.
      </Text>

      <TouchableOpacity onPress={() => openMaps("emergency veterinary hospital")} style={s.linkBtnPrimary}>
        <MaterialCommunityIcons name="hospital-box" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={s.linkBtnPrimaryText}>24-Hour Emergency Vet Near Me</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => openMaps("AAHA accredited veterinary hospital")} style={s.linkBtn}>
        <MaterialCommunityIcons name="shield-check" size={18} color={theme.accent} style={{ marginRight: 10 }} />
        <Text style={s.linkBtnText}>AAHA-Accredited Hospital Lookup</Text>
      </TouchableOpacity>
      <Text style={s.linkHint}>AAHA accreditation is a voluntary standard met by ~12-15% of US vet hospitals.</Text>

      {/* Pet first aid — outbound link only */}
      <Text style={s.sectionHd}>LEARN PET FIRST AID</Text>
      <Text style={s.sectionSub}>
        Stick Around does not provide step-by-step emergency medical instructions. For pet CPR, choking response, and bleed control, take a certified course from the American Red Cross.
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL("https://www.redcross.org/take-a-class/classes/cat-and-dog-first-aid/online-LP-00012380.html")} style={s.linkBtn}>
        <MaterialCommunityIcons name="open-in-new" size={16} color={theme.accent} style={{ marginRight: 10 }} />
        <Text style={s.linkBtnText}>American Red Cross — Cat & Dog First Aid Course</Text>
      </TouchableOpacity>
      <Text style={s.linkHint}>Online, ~$25 one-time, lifetime access. Recognized standard for non-vet pet first aid.</Text>

      {/* Toxic ingestion — point OUT, don't instruct */}
      <Text style={s.sectionHd}>IF YOUR PET ATE SOMETHING</Text>

      <View style={s.bigCard}>
        <Text style={s.bigCardHd}>Step 1 · Call poison control immediately</Text>
        <Text style={s.bigCardBody}>{TOXIC_INGESTION_PROTOCOL.callFirst}</Text>
      </View>

      <View style={[s.bigCard, { borderColor: "#9C2A0F", backgroundColor: "#F9DAD0" }]}>
        <Text style={[s.bigCardHd, { color: "#9C2A0F" }]}>Do NOT try to make your pet vomit at home</Text>
        <Text style={[s.bigCardBody, { color: "#5A1A0A" }]}>
          Inducing vomiting can be fatal for the wrong substance, the wrong species, or the wrong physiology. Only a licensed veterinarian or poison-control specialist can tell you whether vomiting is safe for THIS substance + THIS pet. Call them first — every time.
        </Text>
      </View>

      <Text style={s.subSectionHd}>What to bring to the ER</Text>
      <View style={s.bigCard}>
        {TOXIC_INGESTION_PROTOCOL.whatToBring.map((line, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bullet}>›</Text>
            <Text style={s.bulletText}>{line}</Text>
          </View>
        ))}
      </View>

      <Text style={s.subSectionHd}>Top toxins to know about</Text>
      {TOXIC_INGESTION_PROTOCOL.topToxins.map((t, i) => (
        <View key={i} style={s.toxinCard}>
          <Text style={s.toxinName}>{t.name}</Text>
          <Text style={s.toxinAction}>{t.action}</Text>
        </View>
      ))}

      {/* Bottom disclaimer */}
      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          Stick Around provides general care guidance and is not a substitute for professional veterinary care. Always consult your veterinarian for medical decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  alarm:          { padding: 16, backgroundColor: "#F9DAD0", borderRadius: 12, borderWidth: 2, borderColor: "#C04A2C", marginBottom: 14 },
  alarmHd:        { fontSize: 12, fontWeight: "800", color: "#9C2A0F", letterSpacing: 1.2, marginBottom: 6 },
  alarmBody:      { fontSize: 13, color: "#5A1A0A", lineHeight: 19, marginBottom: 12 },
  alarmFee:       { fontSize: 11, color: "#7A2A0F", marginTop: 6, fontStyle: "italic" },
  callBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#C04A2C", paddingVertical: 12, borderRadius: 10, marginBottom: 8 },
  callBtnText:    { color: "#fff", fontWeight: "700", fontSize: 14 },
  sectionHd:      { marginTop: 22, marginBottom: 6, fontSize: 11, fontWeight: "800", color: theme.muted, letterSpacing: 1.2 },
  sectionSub:     { fontSize: 12, color: theme.muted, marginBottom: 10, lineHeight: 18, fontStyle: "italic" },
  subSectionHd:   { marginTop: 14, marginBottom: 6, fontSize: 13, fontWeight: "700", color: theme.fg },
  linkBtnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 10, marginBottom: 8 },
  linkBtnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  linkBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", backgroundColor: theme.card, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.line, marginBottom: 4 },
  linkBtnText:    { color: theme.fg, fontWeight: "600", fontSize: 14, flex: 1 },
  linkHint:       { fontSize: 11, color: theme.muted, marginTop: 4, marginBottom: 6, paddingHorizontal: 4 },
  bigCard:        { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 8 },
  bigCardHd:      { fontSize: 14, fontWeight: "800", color: theme.fg, marginBottom: 6 },
  bigCardBody:    { fontSize: 13, color: theme.fg, lineHeight: 19 },
  bulletRow:      { flexDirection: "row", paddingVertical: 4 },
  bullet:         { fontWeight: "800", marginRight: 10, fontSize: 14, color: theme.accent, lineHeight: 19 },
  bulletText:     { flex: 1, fontSize: 13, color: theme.fg, lineHeight: 19 },
  toxinCard:      { padding: 12, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.line, marginBottom: 6 },
  toxinName:      { fontSize: 14, fontWeight: "700", color: theme.fg },
  toxinAction:    { fontSize: 12, color: theme.muted, marginTop: 4, lineHeight: 18 },
  disclaimer:     { marginTop: 22, padding: 14, borderRadius: 10, backgroundColor: "#FCE9C8", borderWidth: 1, borderColor: "#E0A82E" },
  disclaimerText: { fontSize: 12, color: "#5A3F0A", lineHeight: 18 },
});

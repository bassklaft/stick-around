// Emergency — CPR + Toxic Ingestion protocols. Reference material only.
// Heavy disclaimers: every screen leads with "CALL THE VET FIRST" and
// links to certified video resources from Red Cross / AVMA / Cornell /
// ASPCA. v1 ships text + emoji walkthroughs; Lottie animations are a
// v2 art investment.
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import {
  POISON_HOTLINES, CPR_BY_CHESTTYPE, CPR_STEPS,
  TOXIC_INGESTION_PROTOCOL, CERTIFIED_VIDEOS,
} from "../data/emergencyProtocols";

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("toxic");
  const [chest, setChest] = useState("small");

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}
    >
      {/* Top alarm — call vet first */}
      <View style={s.alarm}>
        <Text style={s.alarmHd}>⚠ READ THIS FIRST</Text>
        <Text style={s.alarmBody}>
          If something is happening RIGHT NOW, call your vet or poison control before doing anything else. The protocols below are reference, not real-time triage. Wrong action causes more deaths than the original incident.
        </Text>
        {POISON_HOTLINES.map((h, i) => (
          <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${h.phone}`)} style={s.callBtn}>
            <MaterialCommunityIcons name="phone" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.callBtnText}>{h.name}: {h.display}</Text>
          </TouchableOpacity>
        ))}
        <Text style={s.alarmFee}>Both poison-control lines charge $85–95 per consult. Worth every dollar.</Text>
      </View>

      {/* Vet-partnership trust note */}
      <View style={s.partnerCard}>
        <MaterialCommunityIcons name="stethoscope" size={22} color={theme.accent} />
        <Text style={s.partnerText}>
          <Text style={{ fontWeight: "800" }}>We're partnering with veterinarians.</Text>{" "}
          Stick Around is bringing licensed vets onboard to review every emergency protocol on this screen. Until that's complete, all guidance here is summarized from public references — Red Cross Pet First Aid, AVMA, ASPCA APCC, Pet Poison Helpline, Cornell Veterinary College.
        </Text>
      </View>

      {/* Tab switcher */}
      <View style={s.tabs}>
        <TouchableOpacity onPress={() => setTab("toxic")} style={[s.tab, tab === "toxic" && s.tabActive]}>
          <MaterialCommunityIcons name="biohazard" size={16} color={tab === "toxic" ? "#fff" : theme.fg} style={{ marginRight: 6 }} />
          <Text style={[s.tabText, tab === "toxic" && s.tabTextActive]}>Toxic Ingestion</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("cpr")} style={[s.tab, tab === "cpr" && s.tabActive]}>
          <MaterialCommunityIcons name="heart-pulse" size={16} color={tab === "cpr" ? "#fff" : theme.fg} style={{ marginRight: 6 }} />
          <Text style={[s.tabText, tab === "cpr" && s.tabTextActive]}>Pet CPR</Text>
        </TouchableOpacity>
      </View>

      {tab === "toxic" && <ToxicView />}
      {tab === "cpr" && <CprView chest={chest} setChest={setChest} />}

      {/* Certified videos */}
      <Text style={s.sectionHd}>VET-CERTIFIED VIDEO RESOURCES</Text>
      <Text style={s.sectionSub}>
        We can't host video walkthroughs ourselves yet. These are the organizations whose pet first-aid courses are widely recommended by veterinarians.
      </Text>
      {CERTIFIED_VIDEOS.map((v, i) => (
        <TouchableOpacity key={i} onPress={() => Linking.openURL(v.url)} style={s.linkCard}>
          <MaterialCommunityIcons name="play-circle" size={20} color={theme.accent} />
          <Text style={s.linkCardText}>{v.label}</Text>
          <MaterialCommunityIcons name="open-in-new" size={14} color={theme.muted} />
        </TouchableOpacity>
      ))}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          ⚠ <Text style={{ fontWeight: "700" }}>Consult your vet on how to perform any of these protocols properly before performing them.</Text> Practice CPR on a stuffed animal, not a live pet. The wrong technique can break ribs or cause aspiration pneumonia. Stick Around is not a substitute for veterinary advice or emergency medical training.
        </Text>
      </View>
    </ScrollView>
  );
}

function ToxicView() {
  return (
    <>
      <Text style={s.sectionHd}>STEP 1 · CALL POISON CONTROL FIRST</Text>
      <View style={s.bigCard}>
        <Text style={s.bigCardBody}>{TOXIC_INGESTION_PROTOCOL.callFirst}</Text>
      </View>

      <Text style={s.sectionHd}>STEP 2 · DO NOT INDUCE VOMITING IF…</Text>
      <View style={[s.bigCard, { borderColor: "#9C2A0F", backgroundColor: "#F9DAD0" }]}>
        {TOXIC_INGESTION_PROTOCOL.doNotInduce.map((line, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={[s.bullet, { color: "#9C2A0F" }]}>✗</Text>
            <Text style={[s.bulletText, { color: "#5A1A0A" }]}>{line}</Text>
          </View>
        ))}
      </View>

      <Text style={s.sectionHd}>STEP 3 · IF VET SAYS YES, INDUCE WITH 3% H₂O₂</Text>
      <View style={s.bigCard}>
        <Text style={s.bigCardBody}>{TOXIC_INGESTION_PROTOCOL.inducingMethod}</Text>
      </View>

      <Text style={s.sectionHd}>ACTIVATED CHARCOAL</Text>
      <View style={s.bigCard}>
        <Text style={s.bigCardBody}>{TOXIC_INGESTION_PROTOCOL.activatedCharcoal}</Text>
      </View>

      <Text style={s.sectionHd}>WHAT TO BRING TO THE ER</Text>
      <View style={s.bigCard}>
        {TOXIC_INGESTION_PROTOCOL.whatToBring.map((line, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bullet}>›</Text>
            <Text style={s.bulletText}>{line}</Text>
          </View>
        ))}
      </View>

      <Text style={s.sectionHd}>TOP TOXINS · QUICK ACTIONS</Text>
      {TOXIC_INGESTION_PROTOCOL.topToxins.map((t, i) => (
        <View key={i} style={s.toxinCard}>
          <Text style={s.toxinName}>{t.name}</Text>
          <Text style={s.toxinAction}>{t.action}</Text>
        </View>
      ))}
    </>
  );
}

function CprView({ chest, setChest }) {
  const sel = CPR_BY_CHESTTYPE.find(c => c.id === chest) || CPR_BY_CHESTTYPE[0];
  return (
    <>
      <Text style={s.sectionHd}>UNIVERSAL STEPS · BEFORE COMPRESSIONS</Text>
      {CPR_STEPS.map(step => (
        <View key={step.n} style={s.stepCard}>
          <View style={s.stepNum}><Text style={s.stepNumText}>{step.n}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.stepBody}>{step.body}</Text>
          </View>
        </View>
      ))}

      <Text style={s.sectionHd}>SELECT YOUR PET'S BODY TYPE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }} style={{ marginBottom: 8 }}>
        {CPR_BY_CHESTTYPE.map(c => (
          <TouchableOpacity key={c.id} onPress={() => setChest(c.id)} style={[s.chestChip, chest === c.id && s.chestChipActive]}>
            <Text style={s.chestEmoji}>{c.illustration}</Text>
            <Text style={[s.chestText, chest === c.id && s.chestTextActive]} numberOfLines={2}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.cprDetailCard}>
        <Text style={s.cprLabel}>{sel.label}</Text>
        <Text style={s.cprExamples}>e.g. {sel.examples}</Text>

        <View style={s.cprRow}>
          <MaterialCommunityIcons name="human-handsdown" size={20} color={theme.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.cprFieldLabel}>POSITION</Text>
            <Text style={s.cprFieldBody}>{sel.posture}</Text>
          </View>
        </View>

        <View style={s.cprRow}>
          <MaterialCommunityIcons name="hand-back-right" size={20} color={theme.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.cprFieldLabel}>HAND PLACEMENT</Text>
            <Text style={s.cprFieldBody}>{sel.handPosition}</Text>
          </View>
        </View>

        <View style={s.cprRow}>
          <MaterialCommunityIcons name="arrow-down-bold" size={20} color={theme.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.cprFieldLabel}>DEPTH</Text>
            <Text style={s.cprFieldBody}>{sel.depth}</Text>
          </View>
        </View>

        <View style={s.cprRow}>
          <MaterialCommunityIcons name="metronome" size={20} color={theme.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.cprFieldLabel}>RATE</Text>
            <Text style={s.cprFieldBody}>{sel.rate} — keep tempo with "Stayin' Alive"</Text>
          </View>
        </View>

        <View style={s.cprRow}>
          <MaterialCommunityIcons name="lungs" size={20} color={theme.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.cprFieldLabel}>RESCUE BREATHS</Text>
            <Text style={s.cprFieldBody}>{sel.breathRatio}</Text>
          </View>
        </View>
      </View>

      <View style={s.warnCard}>
        <Text style={s.warnHd}>⚠ ABOUT THE ANIMATIONS</Text>
        <Text style={s.warnBody}>
          We're working with veterinary partners + medical animators on full step-by-step CPR animations for v2. Until then, the most accurate visual training is the Red Cross Pet First Aid course (linked below — fully certified, ~$25 one-time, lifetime access). Practice on a stuffed animal — never a healthy pet.
        </Text>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  alarm:        { padding: 16, backgroundColor: "#F9DAD0", borderRadius: 12, borderWidth: 2, borderColor: "#C04A2C", marginBottom: 14 },
  alarmHd:      { fontSize: 12, fontWeight: "800", color: "#9C2A0F", letterSpacing: 1.2, marginBottom: 6 },
  alarmBody:    { fontSize: 13, color: "#5A1A0A", lineHeight: 19, marginBottom: 12 },
  alarmFee:     { fontSize: 11, color: "#7A2A0F", marginTop: 6, fontStyle: "italic" },
  callBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#C04A2C", paddingVertical: 12, borderRadius: 10, marginBottom: 8 },
  callBtnText:  { color: "#fff", fontWeight: "700", fontSize: 14 },
  partnerCard:  { flexDirection: "row", padding: 14, backgroundColor: theme.accentSoft, borderRadius: 12, borderWidth: 1, borderColor: theme.accent + "44", marginBottom: 14, gap: 10, alignItems: "flex-start" },
  partnerText:  { flex: 1, fontSize: 12, color: theme.fg, lineHeight: 18 },
  tabs:         { flexDirection: "row", gap: 8, marginBottom: 14 },
  tab:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  tabActive:    { backgroundColor: theme.accent, borderColor: theme.accent },
  tabText:      { color: theme.fg, fontWeight: "700", fontSize: 13 },
  tabTextActive:{ color: "#fff" },
  sectionHd:    { marginTop: 18, marginBottom: 8, fontSize: 11, fontWeight: "800", color: theme.muted, letterSpacing: 1.2 },
  sectionSub:   { fontSize: 12, color: theme.muted, marginBottom: 10, lineHeight: 18, fontStyle: "italic" },
  bigCard:      { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 4 },
  bigCardBody:  { fontSize: 13, color: theme.fg, lineHeight: 19 },
  bulletRow:    { flexDirection: "row", paddingVertical: 4 },
  bullet:       { fontWeight: "800", marginRight: 10, fontSize: 14, color: theme.accent, lineHeight: 19 },
  bulletText:   { flex: 1, fontSize: 13, color: theme.fg, lineHeight: 19 },
  toxinCard:    { padding: 12, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.line, marginBottom: 6 },
  toxinName:    { fontSize: 14, fontWeight: "700", color: theme.fg },
  toxinAction:  { fontSize: 12, color: theme.muted, marginTop: 4, lineHeight: 18 },
  stepCard:     { flexDirection: "row", padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 8, gap: 12 },
  stepNum:      { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
  stepNumText:  { color: "#fff", fontWeight: "800", fontSize: 14 },
  stepTitle:    { fontWeight: "700", color: theme.fg, fontSize: 14 },
  stepBody:     { fontSize: 12, color: theme.muted, marginTop: 4, lineHeight: 18 },
  chestChip:    { width: 140, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card, marginRight: 8, alignItems: "center" },
  chestChipActive: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  chestEmoji:   { fontSize: 28, marginBottom: 6 },
  chestText:    { fontSize: 11, color: theme.fg, fontWeight: "600", textAlign: "center" },
  chestTextActive: { color: theme.accent, fontWeight: "800" },
  cprDetailCard:{ padding: 16, backgroundColor: theme.card, borderRadius: 14, borderWidth: 2, borderColor: theme.accent, marginBottom: 10, marginTop: 4 },
  cprLabel:     { fontSize: 16, fontWeight: "800", color: theme.fg },
  cprExamples:  { fontSize: 11, color: theme.muted, marginTop: 4, marginBottom: 14, fontStyle: "italic" },
  cprRow:       { flexDirection: "row", paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.line, alignItems: "flex-start" },
  cprFieldLabel:{ fontSize: 10, fontWeight: "800", color: theme.muted, letterSpacing: 0.8, marginBottom: 3 },
  cprFieldBody: { fontSize: 13, color: theme.fg, lineHeight: 19 },
  warnCard:     { padding: 14, backgroundColor: "#FCE9C8", borderRadius: 10, borderWidth: 1, borderColor: "#E0A82E", marginTop: 8 },
  warnHd:       { fontSize: 11, fontWeight: "800", color: "#7A4F0A", letterSpacing: 1, marginBottom: 4 },
  warnBody:     { fontSize: 12, color: "#5A3F0A", lineHeight: 18 },
  linkCard:     { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.line, marginBottom: 6, gap: 10 },
  linkCardText: { flex: 1, fontSize: 13, color: theme.fg, fontWeight: "600" },
  disclaimer:   { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: "#FCE9C8", borderWidth: 1, borderColor: "#E0A82E" },
  disclaimerText:{ fontSize: 12, color: "#5A3F0A", lineHeight: 18 },
});

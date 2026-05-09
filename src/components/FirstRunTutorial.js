// FirstRunTutorial — one-shot welcome overlay shown after a new user
// finishes onboarding. Lists 4 quick tips on how to navigate the app.
// Stored flag in AsyncStorage prevents re-show on subsequent launches.
//
// Per build 19 smoke-test feedback. Kept intentionally simple — no
// step-by-step coach marks pointing at specific UI elements (those
// add real complexity for marginal value when the user already has
// a small surface area to discover). One welcome card, four tips,
// "Got it" CTA, never seen again.
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { tapMedium } from "../lib/haptics";

const TIPS = [
  { icon: "home-outline",                 text: "All your tools live on the Home page — checklist, recalls, vets, emergency, more." },
  { icon: "paw",                          text: "Switch between your floofs from the My Floofs tab, OR long-press the 🐾 in the bottom-right for a quick fan-out." },
  { icon: "stomach",                      text: "Tap the pawprint at the top of Pawgress to fill today's 5 care segments. Daily reset, streaks for the consistent." },
  { icon: "hospital-box",                 text: "The red Emergency card is easily accessible. Poison-control hotlines, ER vet finder, first-aid resources." },
];

export default function FirstRunTutorial({ visible, onClose }) {
  const insets = useSafeAreaInsets();

  function handleGotIt() {
    tapMedium();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.scrim, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 38 }}>🐾</Text>
          </View>
          <Text style={styles.eyebrow}>WELCOME TO FLOOFLIFE</Text>
          <Text style={styles.title}>A quick tour, then you're in</Text>
          <View style={styles.tipList}>
            {TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipIconCircle}>
                  <MaterialCommunityIcons name={tip.icon} size={18} color={theme.accent} />
                </View>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={handleGotIt} style={styles.cta} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Got it — let's go</Text>
          </TouchableOpacity>
          <Text style={styles.footer}>
            FloofLife guidance is not a substitute for veterinary advice. Always consult your vet.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.card,
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: theme.accentSoft,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: theme.accent + "55",
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11, fontWeight: "800", color: theme.muted,
    letterSpacing: 1.6, marginBottom: 6,
  },
  title: {
    fontSize: 22, fontWeight: "800", color: theme.fg,
    letterSpacing: -0.4, textAlign: "center", marginBottom: 18,
  },
  tipList: {
    width: "100%",
    gap: 12,
    marginBottom: 22,
  },
  tipRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  tipIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.accentSoft,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 13, color: theme.fg, lineHeight: 19,
  },
  cta: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: "center",
  },
  ctaText: {
    color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.4,
  },
  footer: {
    fontSize: 11, color: theme.muted, textAlign: "center",
    marginTop: 16, fontStyle: "italic", lineHeight: 16,
  },
});

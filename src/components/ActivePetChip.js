// Active pet chip — small avatar + first-name pill that lives in the
// nav-bar top-right of pet-scoped screens for multi-pet households.
//
// Tap → opens the pet switcher modal (parent owns the visibility
// state and passes onPress).
//
// Renders nothing if there's no active pet or the household has
// only one pet (single-pet UI stays uncluttered).
//
// Per the v1.2 multi-pet UX design, this is the consolidated
// active-pet-switching mechanism (replaces the whole-card tap on
// My Floofs which was removed).
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import PetAvatar from "./PetAvatar";
import { theme } from "../theme";

export default function ActivePetChip({ pet, onPress }) {
  if (!pet) return null;
  const firstName = (pet.name || "").split(" ")[0] || pet.name;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.chip}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Active floof: ${pet.name}. Tap to switch.`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={s.avatarRing}>
        <PetAvatar pet={pet} size={32} slot="chip" />
      </View>
      <Text style={s.name} numberOfLines={1}>{firstName}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  // Larger avatars per build 19 smoke-test feedback ("mini circular
  // icons are so small that its hard to see him so enlarge"). Bumped
  // from 22px to 32px; chip background padding adjusted so the
  // avatar looks at home and the first-name still fits.
  chip:          { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.accentSoft, borderWidth: 1.5, borderColor: theme.accent + "66", marginRight: 8, maxWidth: 140 },
  avatarRing:    { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  name:          { fontSize: 13, fontWeight: "700", color: theme.fg, textTransform: "capitalize", maxWidth: 80, paddingRight: 8 },
});

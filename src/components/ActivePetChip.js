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
      {/* PetAvatar handles its own circular shape via size/2 radius.
          Wrapping it in a 28×28 ring while passing size={32} (build
          ≤43) caused a visible white crescent because the avatar's
          radius (16) didn't match the ring's clip (14). Render the
          avatar at the chip's intended size directly — no wrapper. */}
      <PetAvatar pet={pet} size={26} slot="chip" />
      <Text style={s.name} numberOfLines={1}>{firstName}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  // Compact pill that fits the navigation header's right slot
  // without cropping.
  //
  // Border removed in build 45 — the 1.5px accent-at-40% border
  // over the cream header bg read as a washed-out halo even after
  // the avatar wrapper was dropped (the user kept circling it).
  // The accentSoft fill is already enough contrast against the
  // header bg to read as a distinct chip.
  chip:          { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4, paddingRight: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: theme.accentSoft, marginRight: 12, maxWidth: 130 },
  name:          { fontSize: 13, fontWeight: "700", color: theme.fg, textTransform: "capitalize", maxWidth: 70 },
});

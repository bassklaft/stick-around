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
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { breedEmoji } from "../data/breeds";
import { getPrimaryBreed } from "../lib/petBreeds";
import { theme } from "../theme";

export default function ActivePetChip({ pet, onPress }) {
  if (!pet) return null;
  const primary = getPrimaryBreed(pet);
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
      {pet.photoUri ? (
        <Image source={{ uri: pet.photoUri }} style={s.avatar} />
      ) : (
        <View style={s.avatarFallback}>
          <Text style={{ fontSize: 14 }}>{breedEmoji(primary)}</Text>
        </View>
      )}
      <Text style={s.name} numberOfLines={1}>{firstName}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chip:          { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.accent + "55", marginRight: 8, maxWidth: 120 },
  avatar:        { width: 22, height: 22, borderRadius: 11 },
  avatarFallback:{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
  name:          { fontSize: 12, fontWeight: "700", color: theme.fg, textTransform: "capitalize", maxWidth: 80 },
});

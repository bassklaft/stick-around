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
import { pickPhotoForSlot } from "../lib/petPhotos";
import { theme } from "../theme";

export default function ActivePetChip({ pet, onPress }) {
  if (!pet) return null;
  const primary = getPrimaryBreed(pet);
  const firstName = (pet.name || "").split(" ")[0] || pet.name;
  // Chip avatar rotates daily across the pet's photos[]. Same daily
  // bucket as the hero, but the slot-specific seed means the chip
  // rotates independently from the home banner.
  const chipPhoto = pickPhotoForSlot(pet, "chip");
  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.chip}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Active floof: ${pet.name}. Tap to switch.`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {chipPhoto ? (
        <Image source={{ uri: chipPhoto }} style={s.avatar} />
      ) : (
        <View style={s.avatarFallback}>
          <Text style={{ fontSize: 18 }}>{breedEmoji(primary)}</Text>
        </View>
      )}
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
  avatar:        { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#fff" },
  avatarFallback:{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  name:          { fontSize: 13, fontWeight: "700", color: theme.fg, textTransform: "capitalize", maxWidth: 80, paddingRight: 8 },
});

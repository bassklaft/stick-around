// PetAvatar — single source of truth for rendering a pet's avatar.
//
// Rules (from build 21 smoke-test feedback):
//   1. If the pet has ANY photos, render an image. Slot rotation
//      ("hero", "card", "chip", etc.) picks which one; if the slot
//      logic somehow returns null while photos exist, we fall back
//      to the first available photo so the avatar is never blank.
//   2. If the pet has zero photos, render the FloofLife brand mark
//      (paw + green check overlay) and the pet's name underneath.
//      If the pet has no name yet, render "FloofLife" instead.
//   3. If the underlying file fails to load (deleted from
//      documentDirectory, etc.), gracefully fall back to the
//      branded placeholder.
//
// Sizing: a single `size` prop drives both width/height. Inner
// elements scale proportionally so the avatar reads cleanly at
// 32px (chip) and at 200px (collage tile / card-stack hero).
import React, { useState, useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { pickPhotoForSlot } from "../lib/petPhotos";
import { theme } from "../theme";

export default function PetAvatar({
  pet,
  size = 48,
  slot = "primary",
  showName = false,
  // Override how the placeholder behaves when there's no name AND no
  // pet — useful for "Add a floof" empty-state surfaces.
  emptyName = "FloofLife",
}) {
  const [imgError, setImgError] = useState(false);

  // Prefer the slot-rotated photo. If the slot picker returns null
  // (defensive — shouldn't happen when pet has photos), fall through
  // to ANY available photo so we never render a blank avatar when
  // the user has uploaded at least one shot.
  const slotUri = useMemo(() => pickPhotoForSlot(pet, slot), [pet, slot]);
  const fallbackUri = useMemo(() => {
    if (!pet) return null;
    if (Array.isArray(pet.photos)) {
      const first = pet.photos.find((u) => typeof u === "string" && u.length > 0);
      if (first) return first;
    }
    if (typeof pet.photoUri === "string" && pet.photoUri.length > 0) return pet.photoUri;
    return null;
  }, [pet]);
  const photoUri = slotUri || fallbackUri;
  const hasUsablePhoto = !!photoUri && !imgError;

  const placeholderName = (pet?.name && pet.name.trim()) || emptyName;
  const radius = size / 2;
  // Inner sizing: paw is ~52% of avatar, check badge is ~28%.
  const pawSize = Math.round(size * 0.52);
  const badgeSize = Math.max(12, Math.round(size * 0.28));
  const checkSize = Math.max(8, Math.round(badgeSize * 0.62));
  const nameSize = Math.max(11, Math.round(size * 0.13));

  if (hasUsablePhoto) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[s.image, { width: size, height: size, borderRadius: radius }]}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View
      style={[
        s.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          paddingHorizontal: Math.max(2, Math.round(size * 0.06)),
        },
      ]}
    >
      <View style={[s.iconStack, { width: pawSize + 6, height: pawSize }]}>
        <MaterialCommunityIcons name="paw" size={pawSize} color={theme.accent} />
        <View
          style={[
            s.checkBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              borderWidth: Math.max(1.5, badgeSize * 0.12),
            },
          ]}
        >
          <MaterialCommunityIcons name="check-bold" size={checkSize} color="#fff" />
        </View>
      </View>
      {showName && (
        <Text
          style={[s.name, { fontSize: nameSize, lineHeight: nameSize + 2 }]}
          numberOfLines={1}
        >
          {placeholderName}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  image: {
    resizeMode: "cover",
  },
  fallback: {
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconStack: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -4,
    backgroundColor: "#3F8E5C",
    alignItems: "center",
    justifyContent: "center",
    borderColor: theme.bg,
  },
  name: {
    marginTop: 4,
    fontWeight: "800",
    color: theme.fg,
    letterSpacing: -0.2,
    textAlign: "center",
    textTransform: "capitalize",
    maxWidth: "92%",
  },
});

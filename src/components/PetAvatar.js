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
import React, { useState, useMemo, useCallback } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { pickPhotoForSlot } from "../lib/petPhotos";
import PawIcon from "./PawIcon";
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
  // Track which URIs have failed to load. When the slot-picked photo
  // (or any candidate) is broken — e.g. file deleted from
  // documentDirectory after a reinstall — we cycle to the next
  // available candidate before falling through to the branded
  // placeholder. This is what fixes "icon is blank even though the
  // pet has photos" — a broken-but-truthy URI used to short-circuit
  // straight to the placeholder. Now we exhaust all candidates first.
  const [errored, setErrored] = useState(() => new Set());

  // Build the full list of candidate URIs in priority order:
  //   1. The slot-specific pick (rotation logic)
  //   2. Every photo in pet.photos[]
  //   3. Legacy pet.photoUri (if not already covered)
  // Then filter out anything in the errored set.
  const candidates = useMemo(() => {
    if (!pet) return [];
    const list = [];
    const add = (u) => {
      if (typeof u === "string" && u.length > 0 && !list.includes(u)) list.push(u);
    };
    add(pickPhotoForSlot(pet, slot));
    if (Array.isArray(pet.photos)) {
      for (const u of pet.photos) add(u);
    }
    add(pet.photoUri);
    return list;
  }, [pet, slot]);

  const photoUri = useMemo(() => {
    for (const c of candidates) if (!errored.has(c)) return c;
    return null;
  }, [candidates, errored]);
  const hasUsablePhoto = !!photoUri;

  const onImgError = useCallback(() => {
    if (!photoUri) return;
    setErrored((prev) => {
      if (prev.has(photoUri)) return prev;
      const next = new Set(prev);
      next.add(photoUri);
      return next;
    });
  }, [photoUri]);

  const placeholderName = (pet?.name && pet.name.trim()) || emptyName;
  const radius = size / 2;
  // Inner sizing: PawIcon's 24×24 viewBox includes both paw glyph
  // (~83% of size) and the integrated check badge (anchored bottom-
  // right via translate(19, 20)). 0.6 here matches the prior
  // pawSize=size*0.52 + check overlay's combined visual footprint.
  const iconSize = Math.round(size * 0.6);
  const nameSize = Math.max(11, Math.round(size * 0.13));

  if (hasUsablePhoto) {
    return (
      <Image
        // key forces React to mount a fresh Image when the candidate
        // changes, so onError fires reliably on each new attempt
        // rather than only on the very first source.
        key={photoUri}
        source={{ uri: photoUri }}
        style={[s.image, { width: size, height: size, borderRadius: radius }]}
        onError={onImgError}
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
      <PawIcon
        size={iconSize}
        withCheck
        color={theme.accent}
        checkBg={theme.bg}
      />
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

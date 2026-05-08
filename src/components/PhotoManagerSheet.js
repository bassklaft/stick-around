// PhotoManagerSheet — modal for adding, reordering (set-as-primary),
// and removing photos for a single pet. Bound to one pet at a time;
// caller passes `pet` and an `onChange(photos)` callback that should
// persist via Pets.update(pet.id, { photos: next }).
//
// Constraints:
//   - photos[0] is the canonical "primary" photo (used by fan-out and
//     switcher slots). Tapping a non-primary photo offers "Set as
//     primary" + "Remove".
//   - Capped at MAX_PHOTOS_PER_PET (10). When at cap, the "Add" tile
//     is hidden and a hint tells the user to remove one to add more.
//   - Add path uses the standard pickPetPhoto helper (sandbox storage
//     only — guardrail E preserved).
//   - Removing a file does NOT delete the underlying file from disk;
//     orphan cleanup is a separate concern. We just drop the URI from
//     the array.
//
// No drag-to-reorder (yet) — keeps this a small, robust UI for v1.2.0.
import React, { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { pickPetPhoto } from "../lib/photoPicker";
import { MAX_PHOTOS_PER_PET } from "../lib/petPhotos";
import { tapLight, tapMedium, notifySuccess } from "../lib/haptics";
import { track } from "../lib/analytics";

export default function PhotoManagerSheet({ visible, pet, onClose, onChange }) {
  const insets = useSafeAreaInsets();

  const photos = useMemo(() => {
    if (!pet) return [];
    if (Array.isArray(pet.photos) && pet.photos.length > 0) {
      return pet.photos.filter((u) => typeof u === "string" && u.length > 0);
    }
    return pet.photoUri ? [pet.photoUri] : [];
  }, [pet]);

  const atCap = photos.length >= MAX_PHOTOS_PER_PET;

  async function handleAdd() {
    if (atCap) return;
    const uri = await pickPetPhoto({ petId: pet?.id });
    if (!uri) return;
    const next = [uri, ...photos.filter((u) => u !== uri)].slice(0, MAX_PHOTOS_PER_PET);
    onChange?.(next);
    track("pet_photo_added", { context: "photo_manager", total: next.length });
    notifySuccess();
  }

  function handlePromote(idx) {
    if (idx === 0) return;
    const next = photos.slice();
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange?.(next);
    track("pet_photo_promoted", { from_index: idx });
    tapMedium();
  }

  function handleRemove(idx) {
    Alert.alert(
      "Remove this photo?",
      "It won't show up anywhere in the app. (You can re-add it later from your photo library.)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const next = photos.slice();
            next.splice(idx, 1);
            onChange?.(next);
            track("pet_photo_removed", { remaining: next.length });
            tapLight();
          },
        },
      ],
    );
  }

  function handlePhotoTap(idx) {
    if (idx === 0) {
      // Primary already — only action is remove.
      Alert.alert(
        photos.length > 1 ? "Primary photo" : "This photo",
        photos.length > 1
          ? "This is the canonical photo used for the fan-out and pet switcher. Pick another photo to make it the primary, or remove this one."
          : "This is the only photo on file.",
        [
          { text: "Done", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: () => handleRemove(idx) },
        ],
      );
      return;
    }
    Alert.alert(
      "What to do with this photo?",
      "",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Make primary", onPress: () => handlePromote(idx) },
        { text: "Remove", style: "destructive", onPress: () => handleRemove(idx) },
      ],
    );
  }

  if (!pet) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.container, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerRow}>
          <Text style={s.heading} numberOfLines={1}>
            {pet.name}'s photos
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="close" size={26} color={theme.fg} />
          </TouchableOpacity>
        </View>
        <Text style={s.subhead}>
          The first photo (★) is the canonical face used in the fan-out and switcher. The home banner, collage tiles, and pet chip rotate across the rest. {photos.length}/{MAX_PHOTOS_PER_PET} on file.
        </Text>

        <ScrollView contentContainerStyle={[s.gridWrap, { paddingBottom: insets.bottom + 24 }]}>
          {photos.map((uri, i) => (
            <TouchableOpacity
              key={`${i}-${uri}`}
              onPress={() => handlePhotoTap(i)}
              activeOpacity={0.85}
              style={s.tile}
              accessibilityRole="button"
              accessibilityLabel={i === 0 ? "Primary photo. Tap for options." : `Photo ${i + 1}. Tap to set as primary or remove.`}
            >
              <Image source={{ uri }} style={s.tileImage} />
              {i === 0 && (
                <View style={s.primaryStar}>
                  <Text style={s.primaryStarText}>★ PRIMARY</Text>
                </View>
              )}
              <View style={s.tileOverlay}>
                <MaterialCommunityIcons name="dots-horizontal-circle" size={22} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
          {!atCap && (
            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.85}
              style={[s.tile, s.tileAdd]}
              accessibilityRole="button"
              accessibilityLabel="Add a photo"
            >
              <MaterialCommunityIcons name="camera-plus" size={36} color={theme.accent} />
              <Text style={s.tileAddText}>Add photo</Text>
            </TouchableOpacity>
          )}
          {atCap && (
            <View style={[s.tile, s.tileAddDisabled]}>
              <MaterialCommunityIcons name="image-multiple" size={32} color={theme.muted} />
              <Text style={s.atCapText}>Max reached · remove one to add more</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const TILE_SIZE = "31%"; // 3 columns with small gap

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.bg },
  headerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 6 },
  heading:      { fontSize: 22, fontWeight: "800", color: theme.fg, letterSpacing: -0.4, flex: 1, marginRight: 12, textTransform: "capitalize" },
  subhead:      { fontSize: 12, color: theme.muted, paddingHorizontal: 20, paddingBottom: 14, lineHeight: 17 },
  gridWrap:     { flexDirection: "row", flexWrap: "wrap", gap: "2.5%", paddingHorizontal: 20, paddingTop: 4 },
  tile:         { width: TILE_SIZE, aspectRatio: 1, borderRadius: 12, overflow: "hidden", backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, marginBottom: 10, alignItems: "center", justifyContent: "center" },
  tileImage:    { width: "100%", height: "100%" },
  tileOverlay:  { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 999, padding: 2 },
  primaryStar:  { position: "absolute", bottom: 6, left: 6, backgroundColor: theme.accent, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  primaryStarText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  tileAdd:      { borderStyle: "dashed", borderColor: theme.accent + "AA", backgroundColor: theme.accentSoft, gap: 6, padding: 8 },
  tileAddText:  { color: theme.accent, fontWeight: "700", fontSize: 11, letterSpacing: 0.4, textAlign: "center" },
  tileAddDisabled:{ borderStyle: "dashed", borderColor: theme.line, gap: 6, padding: 8 },
  atCapText:    { color: theme.muted, fontSize: 10, textAlign: "center", lineHeight: 13 },
});

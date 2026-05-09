// PhotoManagerSheet — modal for adding and removing photos for a
// single pet. Bound to one pet at a time; caller passes `pet` and an
// `onChange(photos)` callback that should persist via
// Pets.update(pet.id, { photos: next }).
//
// Layout:
//   - 5 LABELED prompt slots, one per item in PHOTO_PROMPTS. The
//     same labels the user saw at first-run onboarding ("The day
//     you met", "A silly one", etc.). Empty slots show "Add the
//     silly one" CTAs so existing users — who never saw the
//     onboarding reel — can still fill them in.
//   - "Extra photos" section (slots 5-9) for users who want to
//     keep more than the 5 labeled prompts.
//
// photos[] is sparse-array-aware: position 0..4 stays bound to the
// prompt label even when intermediate slots are empty. Removing a
// labeled slot writes `null` at that index rather than splicing,
// so the next photo the user adds for slot 2 lands as "the silly
// one" again.
//
// Constraints:
//   - Capped at MAX_PHOTOS_PER_PET (10). When at cap, no extra-add
//     tile is offered; "remove one to add more" hint shows instead.
//   - photos[0] doubles as the canonical "primary" face used by
//     the fan-out and pet-switcher (slot "primary" in
//     pickPhotoForSlot). To change that, the user re-picks slot 0.
//   - Add path uses the standard pickPetPhoto helper (sandbox
//     storage only — guardrail E preserved). Files are NEVER
//     written to the camera roll.
//   - Removing a file does NOT delete the underlying file from
//     disk; orphan cleanup is a separate concern. We just drop
//     the URI from the array slot.
import React, { useMemo, useState, useEffect } from "react";
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
import {
  MAX_PHOTOS_PER_PET,
  PHOTO_PROMPTS,
  PROMPT_SLOTS,
} from "../lib/petPhotos";
import { tapLight, tapMedium, notifySuccess } from "../lib/haptics";
import { track } from "../lib/analytics";

export default function PhotoManagerSheet({ visible, pet, onClose, onChange }) {
  const insets = useSafeAreaInsets();

  // Source-of-truth array, sparse-array-aware. Pulls from pet.photos
  // when present, falling back to legacy photoUri (which the storage
  // migration already mirrors into photos[0] — but we double-check
  // here so this component renders sensibly even before the next
  // migration tick).
  const photos = useMemo(() => {
    if (!pet) return [];
    if (Array.isArray(pet.photos) && pet.photos.length > 0) {
      return pet.photos.slice();
    }
    return pet.photoUri ? [pet.photoUri] : [];
  }, [pet]);

  // Track which slot indexes have a broken image (file deleted from
  // documentDirectory after a reinstall, etc.). When a tile's Image
  // fails to load, we treat that slot as empty for both display and
  // tap-handling — the user sees an "Add the silly one" CTA instead
  // of a "Replace" action sheet for a slot that LOOKS empty.
  const [brokenSlots, setBrokenSlots] = useState(() => new Set());

  // Reset broken-slot tracking whenever the pet changes (different
  // pet → different photo set → start fresh) and when the photos
  // array itself changes (new uploads might fix previously-broken
  // slots if URIs were reassigned).
  useEffect(() => {
    setBrokenSlots(new Set());
  }, [pet?.id, photos.join("|")]);

  function markSlotBroken(idx) {
    setBrokenSlots((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }

  function isSlotUsable(idx) {
    const u = photos[idx];
    return typeof u === "string" && u.length > 0 && !brokenSlots.has(idx);
  }

  // Total photos actually filled (sparse positions don't count).
  const filledCount = photos.filter((u) => typeof u === "string" && u.length > 0).length;
  const atCap = filledCount >= MAX_PHOTOS_PER_PET;

  // Trim trailing empties when persisting so the array doesn't grow
  // unbounded across edits.
  function compactWriteArray(arr) {
    let lastIdx = -1;
    for (let i = 0; i < arr.length; i += 1) {
      if (typeof arr[i] === "string" && arr[i].length > 0) lastIdx = i;
    }
    return arr.slice(0, lastIdx + 1);
  }

  // Ensure we always write at least PROMPT_SLOTS positions if any
  // labeled slot is filled — keeps `photos[idx]` semantics intact
  // for sparse labeled records on read.
  function persist(nextSparse) {
    const compacted = compactWriteArray(nextSparse);
    const final = compacted.map((u) => (typeof u === "string" && u.length > 0 ? u : null));
    onChange?.(final);
  }

  function petName() {
    return pet?.name || "your floof";
  }

  function promptTitle(idx) {
    const p = PHOTO_PROMPTS[idx];
    if (!p) return "Extra photo";
    return p.title.replace(/\{pet\}/g, petName());
  }

  function shortLabel(idx) {
    if (idx < PROMPT_SLOTS) return PHOTO_PROMPTS[idx].shortLabel;
    return `Extra ${idx - PROMPT_SLOTS + 1}`;
  }

  async function pickPhotoIntoSlot(idx) {
    if (atCap && !photos[idx]) return;
    const uri = await pickPetPhoto({ petId: pet?.id });
    if (!uri) return;
    const next = photos.slice();
    // Pad up to idx+1 so position is preserved (sparse — empties
    // stay null).
    while (next.length <= idx) next.push(null);
    next[idx] = uri;
    persist(next);
    track("pet_photo_added", { context: "photo_manager", slot: idx, total: filledCount + (photos[idx] ? 0 : 1) });
    notifySuccess();
  }

  function handleRemoveSlot(idx) {
    Alert.alert(
      `Remove "${shortLabel(idx)}"?`,
      "It won't show up anywhere in the app. (You can re-add it later from your photo library.)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const next = photos.slice();
            // Labeled slots: replace with null to preserve label binding.
            // Extras: actually splice out so the array doesn't keep
            // null trailers.
            if (idx < PROMPT_SLOTS) {
              next[idx] = null;
            } else {
              next.splice(idx, 1);
            }
            persist(next);
            track("pet_photo_removed", { slot: idx });
            tapLight();
          },
        },
      ],
    );
  }

  function handleSlotTap(idx) {
    if (!isSlotUsable(idx)) {
      // Empty OR broken slot — direct picker, no Replace/Remove
      // sheet (nothing visually there to act on).
      pickPhotoIntoSlot(idx);
      tapMedium();
      return;
    }
    // Filled + loadable slot — offer Replace / Remove.
    Alert.alert(
      promptTitle(idx),
      idx === 0
        ? "This is the canonical photo used in the fan-out and pet switcher. Replace it or remove it."
        : `What to do with "${shortLabel(idx)}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Replace", onPress: () => pickPhotoIntoSlot(idx) },
        { text: "Remove", style: "destructive", onPress: () => handleRemoveSlot(idx) },
      ],
    );
  }

  async function handleAddExtra() {
    if (atCap) return;
    const uri = await pickPetPhoto({ petId: pet?.id });
    if (!uri) return;
    // Find the first available extra slot (>=5) or append at the
    // end of the array up to MAX.
    const next = photos.slice();
    while (next.length < PROMPT_SLOTS) next.push(null);
    next.push(uri);
    persist(next.slice(0, MAX_PHOTOS_PER_PET));
    track("pet_photo_added", { context: "photo_manager", slot: "extra" });
    notifySuccess();
  }

  if (!pet) return null;

  // Build the visible slot list:
  //   - Always 5 labeled slots (whether filled or not)
  //   - Any extras beyond index 4 that are filled
  const labeledSlots = Array.from({ length: PROMPT_SLOTS }, (_, i) => ({
    idx: i,
    uri: photos[i] || null,
  }));
  const extras = [];
  for (let i = PROMPT_SLOTS; i < photos.length; i += 1) {
    if (typeof photos[i] === "string" && photos[i].length > 0) {
      extras.push({ idx: i, uri: photos[i] });
    }
  }

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
            {petName()}'s photos
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="close" size={26} color={theme.fg} />
          </TouchableOpacity>
        </View>
        <Text style={s.subhead}>
          5 prompts, one photo each. The first photo (★) doubles as the canonical face used in the fan-out and switcher; the home banner, collage tiles, and pet chip rotate across the rest. {filledCount}/{MAX_PHOTOS_PER_PET} on file.
        </Text>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <Text style={s.sectionHd}>YOUR STORY IN 5 PHOTOS</Text>
          <View style={s.gridWrap}>
            {labeledSlots.map(({ idx, uri }) => {
              const usable = isSlotUsable(idx);
              return (
                <TouchableOpacity
                  key={`labeled-${idx}`}
                  onPress={() => handleSlotTap(idx)}
                  activeOpacity={0.85}
                  style={[s.tile, !usable && s.tileEmpty]}
                  accessibilityRole="button"
                  accessibilityLabel={usable ? `${shortLabel(idx)}. Tap to replace or remove.` : `Add ${shortLabel(idx)}.`}
                >
                  {usable ? (
                    <>
                      <Image
                        source={{ uri }}
                        style={s.tileImage}
                        onError={() => markSlotBroken(idx)}
                      />
                      {idx === 0 && (
                        <View style={s.primaryStar}>
                          <Text style={s.primaryStarText}>★</Text>
                        </View>
                      )}
                      <View style={s.tileLabelOverlay}>
                        <Text style={s.tileLabelText} numberOfLines={1}>
                          {shortLabel(idx)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={s.tileEmptyContent}>
                      <MaterialCommunityIcons name="camera-plus" size={28} color={theme.accent} />
                      <Text style={s.tileEmptyHint} numberOfLines={2}>
                        Add{"\n"}{shortLabel(idx)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {(extras.length > 0 || (!atCap && filledCount > 0)) && (
            <>
              <Text style={s.sectionHd}>EXTRA PHOTOS</Text>
              <View style={s.gridWrap}>
                {extras.map(({ idx, uri }) => (
                  <TouchableOpacity
                    key={`extra-${idx}`}
                    onPress={() => handleSlotTap(idx)}
                    activeOpacity={0.85}
                    style={s.tile}
                    accessibilityRole="button"
                    accessibilityLabel={`Extra photo ${idx - PROMPT_SLOTS + 1}. Tap to replace or remove.`}
                  >
                    <Image
                      source={{ uri }}
                      style={s.tileImage}
                      onError={() => markSlotBroken(idx)}
                    />
                    <View style={s.tileOverlay}>
                      <MaterialCommunityIcons name="dots-horizontal-circle" size={22} color="#fff" />
                    </View>
                  </TouchableOpacity>
                ))}
                {!atCap && (
                  <TouchableOpacity
                    onPress={handleAddExtra}
                    activeOpacity={0.85}
                    style={[s.tile, s.tileAdd]}
                    accessibilityRole="button"
                    accessibilityLabel="Add an extra photo"
                  >
                    <MaterialCommunityIcons name="camera-plus" size={28} color={theme.accent} />
                    <Text style={s.tileAddText}>Add extra</Text>
                  </TouchableOpacity>
                )}
                {atCap && (
                  <View style={[s.tile, s.tileAddDisabled]}>
                    <MaterialCommunityIcons name="image-multiple" size={26} color={theme.muted} />
                    <Text style={s.atCapText}>Max reached · remove one to add more</Text>
                  </View>
                )}
              </View>
            </>
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
  sectionHd:    { fontSize: 11, fontWeight: "800", color: theme.muted, letterSpacing: 1.4, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8 },
  gridWrap:     { flexDirection: "row", flexWrap: "wrap", gap: "2.5%", paddingHorizontal: 20, paddingTop: 0 },
  tile:         { width: TILE_SIZE, aspectRatio: 1, borderRadius: 12, overflow: "hidden", backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, marginBottom: 10, alignItems: "center", justifyContent: "center", position: "relative" },
  tileEmpty:    { borderStyle: "dashed", borderColor: theme.accent + "AA", backgroundColor: theme.accentSoft },
  tileEmptyContent:{ alignItems: "center", justifyContent: "center", padding: 6, gap: 6 },
  tileEmptyHint:{ color: theme.accent, fontWeight: "700", fontSize: 10.5, letterSpacing: 0.3, textAlign: "center", lineHeight: 13 },
  tileImage:    { width: "100%", height: "100%" },
  tileOverlay:  { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 999, padding: 2 },
  tileLabelOverlay:{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.55)", paddingVertical: 4, paddingHorizontal: 6 },
  tileLabelText:{ color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.3, textAlign: "center" },
  primaryStar:  { position: "absolute", top: 6, left: 6, backgroundColor: theme.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, minWidth: 22, alignItems: "center" },
  primaryStarText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  tileAdd:      { borderStyle: "dashed", borderColor: theme.accent + "AA", backgroundColor: theme.accentSoft, gap: 6, padding: 6 },
  tileAddText:  { color: theme.accent, fontWeight: "700", fontSize: 11, letterSpacing: 0.4, textAlign: "center" },
  tileAddDisabled:{ borderStyle: "dashed", borderColor: theme.line, gap: 6, padding: 6 },
  atCapText:    { color: theme.muted, fontSize: 10, textAlign: "center", lineHeight: 13 },
});

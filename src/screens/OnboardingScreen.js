import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Pressable, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pet, Pets } from "../lib/storage";
import { breedFacts, dogBreeds, catBreeds, breedEmoji } from "../data/breeds";
import { MAX_BREEDS, shortBreedName } from "../lib/petBreeds";
import { pickPetPhoto } from "../lib/photoPicker";
import { track } from "../lib/analytics";
import { tapMedium, tapHeavy, notifySuccess } from "../lib/haptics";
import { theme } from "../theme";
import PhotoboothAnimation from "../components/PhotoboothAnimation";
import { PHOTO_PROMPTS, PROMPT_SLOTS } from "../lib/petPhotos";
import { LIFESTYLE_QUESTIONS, LIFESTYLE_FIELDS } from "../data/lifestyleQuestions";

// Build-39: lifestyle questionnaire RE-ENABLED with three
// defense-in-depth changes targeting the iOS 26.3.x crash
// without root-cause-fixing it (we still don't have dSYM-
// symbolicated proof of which TurboModule was throwing):
//
//   1. <Pressable> instead of <TouchableOpacity> for option
//      taps. TouchableOpacity uses Animated internally for
//      its opacity transition, which routes through
//      NativeAnimatedModule (a TurboModule). Pressable's
//      default press feedback is a CSS-style style override,
//      no native-driver Animated calls.
//
//   2. No accessibilityRole={"checkbox"|"radio"} on the
//      option Pressable. AccessibilityInfo emission for those
//      roles routes through a TurboModule. The role is
//      omitted; press semantics are clear from layout +
//      accessibilityState (selected) which uses generic
//      semantics.
//
//   3. cleanLabel() strips ALL emoji + variation selectors
//      from option / title / help strings at render time.
//      The "🛋️" couch emoji has a variation selector
//      (U+FE0F) and was the very first option the user
//      tapped before the crash. Other questions also include
//      VS-bearing emoji (⛈️ thunder). Stripping all of them
//      removes that suspect entirely. The data file is
//      unchanged — when emoji are safe to render again on
//      iOS 26.3.x, this helper becomes a no-op.
//
// LIFESTYLE_DISABLED kept as a kill switch — flip to true to
// hide the questionnaire app-wide if a new repro lands.
const LIFESTYLE_DISABLED = false;

// Strip emoji + variation selectors + ZWJ from a label string.
// See the build-39 comment above for why.
function cleanLabel(s) {
  return String(s || "")
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}️︎‍]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 5-photo onboarding reel — pulls prompt copy from petPhotos.js (single
// source of truth shared with PhotoManagerSheet so existing users see
// the same labels in the manager that new users saw at first run).
// Each prompt is individually skippable and "Skip all photos" jumps
// the user past the entire reel in one tap (Apple Guideline 4.0 +
// build 20 guardrail B: complete-skip path < 90s).
function promptEyebrow(idx) {
  return `📸  PHOTO ${idx + 1} OF ${PROMPT_SLOTS}`;
}

const titleCase = s => s.split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");

// `addMode` reuses the same form as first-run onboarding to add an
// additional pet to the household — finish() routes through Pets.add()
// so existing pets are preserved.
//
// `editMode` reuses the same form to edit an existing pet's record.
// finish() routes through Pets.update(editPetId, ...) preserving the
// original createdAt. Caller passes `editPetId` so we know which record
// to load and update.
export default function OnboardingScreen({ onDone, addMode = false, editMode = false, editPetId = null, navigation }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [selectedBreeds, setSelectedBreeds] = useState([]);
  const [ageYears, setAgeYears] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  // photos[] is the new v1.2 multi-photo array. photoUri (the v1.1.x
  // single-photo field) is preserved as a backward-compat mirror via
  // the storage migration — we don't track it separately here.
  const [photos, setPhotos] = useState([]);
  // Index into PHOTO_PROMPTS that the user is currently being asked.
  // Independent of the form's outer step counter so we can sub-step
  // through the reel without bloating the main step machine.
  const [photoPromptIdx, setPhotoPromptIdx] = useState(0);
  const [mixOf, setMixOf] = useState("");
  const [dnaNotes, setDnaNotes] = useState("");
  const [microchipStatus, setMicrochipStatus] = useState(null); // 'confirmed' | 'pending' | 'none' | 'unsure' | null
  const [microchipNumber, setMicrochipNumber] = useState("");
  // Lifestyle / habits questionnaire. Object keyed by question key
  // (see src/data/lifestyleQuestions.js). Sub-step counter walks
  // through LIFESTYLE_QUESTIONS while step === 5.
  const [lifestyle, setLifestyle] = useState({});
  const [lifestyleStep, setLifestyleStep] = useState(0);
  // Photobooth-animation overlay shown right before onDone(). Only
  // mounted while we're transitioning out of the form.
  const [showPhotobooth, setShowPhotobooth] = useState(false);

  // In editMode, pre-fill from the existing pet record on first mount.
  useEffect(() => {
    if (!editMode || !editPetId) return;
    let mounted = true;
    (async () => {
      const all = await Pets.list();
      const target = all.find((p) => p.id === editPetId);
      if (!mounted || !target) return;
      setName(target.name || "");
      setSpecies(target.species || "dog");
      const existingBreeds = Array.isArray(target.breeds) && target.breeds.length > 0
        ? target.breeds
        : (target.breed ? [target.breed] : []);
      setSelectedBreeds(existingBreeds);
      setAgeYears(target.ageYears != null ? String(target.ageYears) : "");
      setWeightLbs(target.weightLbs != null ? String(target.weightLbs) : "");
      const existingPhotos = Array.isArray(target.photos) && target.photos.length > 0
        ? target.photos
        : (target.photoUri ? [target.photoUri] : []);
      setPhotos(existingPhotos);
      setMixOf(target.mixOf || "");
      setDnaNotes(target.dnaNotes || "");
      setMicrochipStatus(target.microchipStatus || "unsure");
      setMicrochipNumber(target.microchipNumber || "");
      // Lifestyle: pull whatever's been saved; missing fields stay
      // undefined so the wizard renders empty options for them.
      setLifestyle(target.lifestyle && typeof target.lifestyle === "object" ? { ...target.lifestyle } : {});
      // Edit jumps straight to step 1 (name) since the form is pre-filled
      // and the species toggle is rarely meaningful for an existing pet.
      setStep(1);
    })();
    return () => { mounted = false; };
  }, [editMode, editPetId]);

  const breeds = species === "cat" ? catBreeds : dogBreeds;
  const includesMixed = selectedBreeds.includes("mixed") || selectedBreeds.includes("mixed cat");
  const showMixDetails = includesMixed || selectedBreeds.length >= 2;
  const atMax = selectedBreeds.length >= MAX_BREEDS;

  function toggleBreed(b) {
    setSelectedBreeds((prev) => {
      if (prev.includes(b)) return prev.filter((x) => x !== b);
      if (prev.length >= MAX_BREEDS) {
        Alert.alert("3 breeds max", "Remove one to swap. Most mixes are well-described by 2-3 dominant breeds.");
        return prev;
      }
      return [...prev, b];
    });
  }
  function removeBreed(b) {
    setSelectedBreeds((prev) => prev.filter((x) => x !== b));
  }

  // Pick a photo for the given prompt index. Photos are stored to
  // documentDirectory by the picker (sandbox only — guardrail E:
  // never written to camera roll). On success we replace the
  // photo at that prompt index; we DON'T auto-advance so the user
  // can re-pick if they don't love the choice.
  async function pickPhotoForPrompt(idx) {
    const uri = await pickPetPhoto();
    if (uri) {
      setPhotos((prev) => {
        const next = prev.slice();
        next[idx] = uri;
        return next;
      });
      track("pet_photo_picked", { context: "onboarding", prompt_index: idx });
      tapMedium();
    }
  }

  function clearPhotoAtPrompt(idx) {
    setPhotos((prev) => {
      const next = prev.slice();
      next[idx] = undefined;
      return next;
    });
  }

  // Advance through the 5-prompt reel. If we're on the last prompt,
  // move to step 4 (microchip).
  function nextPhotoPrompt() {
    if (photoPromptIdx < PHOTO_PROMPTS.length - 1) {
      setPhotoPromptIdx(photoPromptIdx + 1);
      tapMedium();
    } else {
      setStep(4);
    }
  }

  function prevPhotoPrompt() {
    if (photoPromptIdx > 0) {
      setPhotoPromptIdx(photoPromptIdx - 1);
    } else {
      setStep(2);
    }
  }

  // Skip the entire 5-photo reel. Per build 20 guardrail B, this is
  // always one tap away on every prompt — total skip path is well
  // under 90s.
  function skipAllPhotos() {
    track("photo_reel_skipped_all", { from_prompt: photoPromptIdx });
    setStep(4);
  }

  // List of present (non-undefined, non-empty) photos in prompt-order.
  function compactPhotos() {
    return photos.filter((u) => typeof u === "string" && u.length > 0);
  }

  // ───────────────── Lifestyle wizard helpers ─────────────────
  function setLifestyleAnswer(key, value, type) {
    setLifestyle((prev) => {
      if (type === "multi") {
        const arr = Array.isArray(prev[key]) ? prev[key] : [];
        const has = arr.includes(value);
        const toggled = has ? arr.filter((x) => x !== value) : [...arr, value];
        // "none" is exclusive — picking it clears everything else; picking
        // anything else clears "none".
        const final = value === "none"
          ? (has ? [] : ["none"])
          : toggled.filter((x) => x !== "none");
        return { ...prev, [key]: final };
      }
      return { ...prev, [key]: value };
    });
  }

  function isLifestyleSelected(question, optionValue) {
    const v = lifestyle[question.key];
    if (question.type === "multi") return Array.isArray(v) && v.includes(optionValue);
    return v === optionValue;
  }

  function nextLifestyle() {
    if (lifestyleStep < LIFESTYLE_QUESTIONS.length - 1) {
      setLifestyleStep(lifestyleStep + 1);
      tapMedium();
    } else {
      setStep(6);
    }
  }

  function prevLifestyle() {
    if (lifestyleStep > 0) {
      setLifestyleStep(lifestyleStep - 1);
    } else {
      setStep(4);
    }
  }

  function skipAllLifestyle() {
    track("lifestyle_skipped_all", { from_question: lifestyleStep });
    setStep(6);
  }

  // Compact answered representation for storage — drops undefined keys
  // and empty arrays so the persisted object only contains real input.
  function compactLifestyle() {
    const out = {};
    for (const k of LIFESTYLE_FIELDS) {
      const v = lifestyle[k];
      if (Array.isArray(v) && v.length > 0) out[k] = v;
      else if (typeof v === "string" && v.length > 0) out[k] = v;
    }
    return out;
  }

  // ────────── Delete a floof (editMode only) ──────────
  // Lives in the navigation header's top-right, as a red "Delete"
  // text button — no trash icon (a trash icon for a possibly-
  // deceased pet would be the wrong tone). Confirmation alert
  // explains the data scope; on success, the user sees a gentle
  // farewell ("Goodbye for now / Your Floof left your home, but
  // never your heart.") before the modal dismisses back.
  function confirmDeleteFloof() {
    Alert.alert(
      `Delete ${name?.trim() || "this floof"}?`,
      "All of their photos, checklist progress, Pawgress streak, Tummy Tracker entries, and health records will be permanently removed from this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Pets.remove(editPetId);
              track("pet_removed", { species });
              tapHeavy();
              Alert.alert(
                "Goodbye for now",
                "Your Floof left your home, but never your heart.",
                [{ text: "OK", onPress: () => onDone?.() }],
              );
            } catch {
              Alert.alert("Couldn't delete", "Something went wrong. Try again.");
            }
          },
        },
      ],
    );
  }

  useLayoutEffect(() => {
    if (!editMode || !editPetId || !navigation?.setOptions) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={confirmDeleteFloof}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${name || "this floof"}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: "#9C2A0F", fontSize: 16, fontWeight: "600" }}>Delete</Text>
        </TouchableOpacity>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, editMode, editPetId, name]);

  // Build the payload, persist it, then trigger the photobooth animation
  // (if any photos were captured). When the photobooth ends — by either
  // its own timer or the Skip button — we call the original onDone().
  async function finish() {
    if (!name.trim()) { Alert.alert("Pick a name", "Your pet needs a name."); return; }
    const ageNum = parseFloat(ageYears);
    const weightNum = parseFloat(weightLbs);
    const breedsList = selectedBreeds.length > 0
      ? selectedBreeds
      : [species === "cat" ? "domestic shorthair" : "mixed"];
    const finalMicrochipStatus = microchipStatus || "unsure";
    const finalMicrochipNumber = (finalMicrochipStatus === "confirmed" && microchipNumber.trim())
      ? microchipNumber.trim()
      : null;
    const photosList = compactPhotos();
    const hasPhoto = photosList.length > 0;
    const basePayload = {
      name: name.trim(),
      species,
      breeds: breedsList,
      breed: breedsList[0],
      mixOf: mixOf.trim() || null,
      dnaNotes: dnaNotes.trim() || null,
      ageYears: isFinite(ageNum) ? ageNum : null,
      weightLbs: isFinite(weightNum) ? weightNum : null,
      // v1.2 multi-photo. Storage migration mirrors photos[0] back into
      // pet.photoUri so legacy read sites keep working.
      photos: photosList,
      photoUri: photosList[0] || null,
      microchipStatus: finalMicrochipStatus,
      microchipNumber: finalMicrochipNumber,
      // Lifestyle questionnaire answers (compacted — empty/undefined
      // fields not persisted). Object subkey on the pet record;
      // optional, no schema migration required.
      lifestyle: compactLifestyle(),
    };
    try {
      if (editMode && editPetId) {
        // Don't overwrite createdAt on edits.
        await Pets.update(editPetId, basePayload);
        track("pet_edited", {
          species,
          has_photo: hasPhoto,
          photo_count: photosList.length,
          is_mix: !!basePayload.mixOf,
        });
        notifySuccess();
      } else if (addMode) {
        await Pets.add({ ...basePayload, createdAt: Date.now() });
        track("pet_added", {
          species,
          has_photo: hasPhoto,
          photo_count: photosList.length,
          has_age: basePayload.ageYears != null,
          has_weight: basePayload.weightLbs != null,
          is_mix: !!basePayload.mixOf,
        });
        notifySuccess();
      } else {
        await Pet.set({ ...basePayload, createdAt: Date.now() });
        track("onboarding_completed", {
          species,
          has_photo: hasPhoto,
          photo_count: photosList.length,
          has_age: basePayload.ageYears != null,
          has_weight: basePayload.weightLbs != null,
          is_mix: !!basePayload.mixOf,
        });
        notifySuccess();
      }
    } catch (err) {
      // Storage write failed — surface gracefully instead of letting
      // an unhandled promise rejection kill the JS bridge.
      Alert.alert(
        "Couldn't save",
        "Something went wrong saving this floof. Please try again.",
      );
      return;
    }
    // Build-37 follow-up: skip the photobooth strip animation
    // entirely. Build 37 (LIFESTYLE_DISABLED) got the user past
    // the questionnaire crash, but tapping Done on the final
    // page now crashes via the same TurboModule throw class —
    // RN's convertNSExceptionToJSError is on the stack, meaning
    // a native call threw and the Hermes wrapper itself crashed
    // constructing the JS error. Most likely culprit:
    // PhotoboothAnimation's Animated.parallel + Animated.sequence
    // chain through NativeAnimatedModule on iOS 26.3.x. Same
    // pragmatic decision as the lifestyle questionnaire: nuke
    // it for now, re-introduce after we identify the exact
    // offending native call. Direct onDone() in all paths.
    onDone();
  }

  function handlePhotoboothDone() {
    setShowPhotobooth(false);
    onDone();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: 60, paddingHorizontal: 22 }} keyboardShouldPersistTaps="handled">
        <Text style={s.brand}>{editMode ? `Edit ${name.trim() || "this pet"}` : addMode ? "Add a floof" : "FloofLife"}</Text>
        <Text style={s.tagline}>{editMode ? "Update the details for your floof." : addMode ? "A few quick details about your new floof." : "Here to help you keep your Floof thriving"}</Text>

        {step === 0 && (
          <View style={s.section}>
            <Text style={s.h1}>What kind of pet?</Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              {["dog", "cat"].map(sp => (
                <TouchableOpacity key={sp} style={[s.bigCard, species === sp && s.bigCardActive]} onPress={() => setSpecies(sp)}>
                  <Text style={[s.bigCardText, species === sp && s.bigCardTextActive]}>{sp === "dog" ? "🐕  Dog" : "🐈  Cat"}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton label="Next" onPress={() => setStep(1)} />
            {(addMode || editMode) && <SecondaryButton label="Cancel" onPress={onDone} />}

            {!addMode && !editMode && (
              <View style={s.founder}>
                <Text style={s.founderText}>
                  Built by a dog dad who wanted the best for his floof — and yours.
                </Text>
                <Text style={s.founderText}>
                  Even with great vets and specialists, generic advice didn't always fit. So he dug into the peer-reviewed research, breed-specific clinical literature, and consumer health data to build customized care suited to his floof's specific breed — the do's, the don'ts, the things other dogs don't need to worry about.
                </Text>
                <Text style={s.founderText}>
                  Now that guide is here for you, too.
                </Text>
              </View>
            )}
          </View>
        )}

        {step === 1 && (
          <View style={s.section}>
            <Text style={s.h1}>What's their name?</Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder="e.g. Bella" placeholderTextColor={theme.muted}
              style={s.input} autoFocus returnKeyType="next"
            />
            <PrimaryButton label="Next" onPress={() => name.trim() ? setStep(2) : Alert.alert("Pick a name")} />
            <SecondaryButton label="Back" onPress={() => setStep(0)} />
          </View>
        )}

        {step === 2 && (
          <View style={s.section}>
            <Text style={s.h1}>What breed?</Text>
            <Text style={s.sub}>
              Pick up to {MAX_BREEDS} breeds. The first one is the primary; the rest blend into the weekly checklist for accurate mixed-breed care.
            </Text>

            {selectedBreeds.length > 0 && (
              <View style={s.selectedRow}>
                {selectedBreeds.map((b, idx) => (
                  <TouchableOpacity key={b} style={[s.selectedChip, idx === 0 && s.primaryChip]} onPress={() => removeBreed(b)} activeOpacity={0.7}>
                    {idx === 0 && <Text style={s.primaryFlag}>PRIMARY · </Text>}
                    <Text style={s.selectedChipEmoji}>{breedEmoji(b)}</Text>
                    <Text style={s.selectedChipText}>{shortBreedName(b)}</Text>
                    <MaterialCommunityIcons name="close-circle" size={16} color="#fff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                ))}
                <Text style={s.selectedHint}>{atMax ? "Maximum reached — tap a chip to remove." : `Tap to remove · ${MAX_BREEDS - selectedBreeds.length} more allowed.`}</Text>
              </View>
            )}

            <View style={s.breedGrid}>
              {breeds.map(b => {
                const isSelected = selectedBreeds.includes(b);
                return (
                  <TouchableOpacity key={b} style={[s.breedChip, isSelected && s.breedChipActive]} onPress={() => toggleBreed(b)}>
                    <Text style={s.breedChipEmoji}>{breedEmoji(b)}</Text>
                    <Text style={[s.breedChipText, isSelected && s.breedChipTextActive]}>{titleCase(b)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {species === "cat" && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Tabby, Tortoiseshell, or Calico?",
                    "These are coat patterns that can appear on many cat breeds — not breeds themselves. If your cat is mixed-breed, pick 'Domestic Shorthair' or 'Mixed Cat' below. If they're a specific breed (like a Maine Coon) with one of these patterns, pick the breed.",
                    [
                      { text: "Use Domestic Shorthair", onPress: () => setSelectedBreeds(["domestic shorthair"]) },
                      { text: "Use Mixed Cat", onPress: () => setSelectedBreeds(["mixed cat"]) },
                      { text: "Cancel", style: "cancel" },
                    ],
                  );
                }}
                style={s.coatPatternHint}
              >
                <Text style={s.coatPatternHintText}>
                  💡 Is your cat a Tabby, Tortoiseshell, or Calico?
                </Text>
              </TouchableOpacity>
            )}

            {showMixDetails && (
              <View style={{ marginTop: 18 }}>
                <Text style={s.label}>Mix of (free-form, e.g. "75% lab, 25% pit bull")</Text>
                <TextInput value={mixOf} onChangeText={setMixOf} placeholder="optional — helps us tailor advice"
                  placeholderTextColor={theme.muted} style={s.input} />
                <Text style={[s.label, { marginTop: 14 }]}>DNA results breakdown (optional)</Text>
                <TextInput value={dnaNotes} onChangeText={setDnaNotes} multiline
                  placeholder="Paste from Embark, Wisdom Panel, or Basepaws — e.g. '40% Lab, 25% Pit Bull, 15% GSD…'"
                  placeholderTextColor={theme.muted} style={[s.input, { minHeight: 100, textAlignVertical: "top" }]} />
                <Text style={s.dnaHint}>
                  💡 We're working on direct file uploads from Embark/Wisdom Panel/Basepaws — for now, paste the breed breakdown text and we'll cross-reference it against our breed database.
                </Text>
              </View>
            )}

            <PrimaryButton label="Next" onPress={() => setStep(3)} />
            <SecondaryButton label="Back" onPress={() => setStep(1)} />
          </View>
        )}

        {step === 3 && (() => {
          const prompt = PHOTO_PROMPTS[photoPromptIdx];
          const promptTitle = prompt.title.replace(/\{pet\}/g, name.trim() || "them");
          const currentUri = photos[photoPromptIdx];
          const filledCount = compactPhotos().length;
          const isLast = photoPromptIdx === PHOTO_PROMPTS.length - 1;
          return (
            <View style={s.section}>
              {/* Reel progress dots — communicates "5 prompts" without being a clock */}
              <View style={s.reelDots}>
                {PHOTO_PROMPTS.map((_, i) => {
                  const has = !!photos[i];
                  const active = i === photoPromptIdx;
                  return (
                    <View
                      key={i}
                      style={[
                        s.reelDot,
                        has && s.reelDotFilled,
                        active && s.reelDotActive,
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={s.eyebrow}>{promptEyebrow(photoPromptIdx)}</Text>
              <Text style={s.h1}>{promptTitle}</Text>
              <Text style={s.sub}>{prompt.sub}</Text>

              <TouchableOpacity onPress={() => pickPhotoForPrompt(photoPromptIdx)} style={s.photoPicker} activeOpacity={0.8}>
                {currentUri ? (
                  <Image
                    source={{ uri: currentUri }}
                    style={s.photoPreview}
                    // onError swallowed — broken URIs after TestFlight
                    // reinstall (sandbox path changes) can throw
                    // NSException on iOS 26. Native-thrown exceptions
                    // from Image have been linked to TurboModule
                    // crashes in this app's logs.
                    onError={() => {}}
                  />
                ) : (
                  <View style={s.photoPlaceholder}>
                    <MaterialCommunityIcons name="camera-plus" size={42} color={theme.accent} />
                    <Text style={s.photoPlaceholderText}>Tap to choose photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              {currentUri && (
                <TouchableOpacity onPress={() => clearPhotoAtPrompt(photoPromptIdx)} style={{ alignSelf: "center", padding: 8 }}>
                  <Text style={{ color: theme.muted, fontSize: 13 }}>Remove this photo</Text>
                </TouchableOpacity>
              )}

              <PrimaryButton
                label={isLast ? (filledCount > 0 ? "Done with photos" : "Next") : (currentUri ? "Next prompt" : "Skip prompt")}
                onPress={nextPhotoPrompt}
              />
              <SecondaryButton
                label={photoPromptIdx > 0 ? "Back" : "Back"}
                onPress={prevPhotoPrompt}
              />
              <TouchableOpacity onPress={skipAllPhotos} style={{ alignSelf: "center", padding: 6 }}>
                <Text style={s.skipAllText}>Skip all photos · add later</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {step === 4 && (
          <View style={s.section}>
            <Text style={s.h1}>Does {name.trim() || "your pet"} have a microchip?</Text>
            <Text style={s.sub}>
              Microchip numbers matter at vet visits, boarding, and lost-pet situations. We just store the number locally — no registry sync (yet).
            </Text>

            <TouchableOpacity
              onPress={() => { setMicrochipStatus("confirmed"); }}
              style={[s.microchipOption, microchipStatus === "confirmed" && s.microchipOptionActive]}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: microchipStatus === "confirmed" }}
            >
              <MaterialCommunityIcons
                name={microchipStatus === "confirmed" ? "radiobox-marked" : "radiobox-blank"}
                size={20}
                color={microchipStatus === "confirmed" ? theme.accent : theme.muted}
              />
              <Text style={[s.microchipOptionText, microchipStatus === "confirmed" && s.microchipOptionTextActive]}>
                Yes — chip number is…
              </Text>
            </TouchableOpacity>
            {microchipStatus === "confirmed" && (
              <TextInput
                value={microchipNumber}
                onChangeText={setMicrochipNumber}
                placeholder="e.g. 985112345678901 (15 digits, ISO 11784/11785)"
                placeholderTextColor={theme.muted}
                style={[s.input, { marginTop: 6, marginBottom: 6 }]}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}

            <TouchableOpacity
              onPress={() => { setMicrochipStatus("pending"); }}
              style={[s.microchipOption, microchipStatus === "pending" && s.microchipOptionActive]}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: microchipStatus === "pending" }}
            >
              <MaterialCommunityIcons
                name={microchipStatus === "pending" ? "radiobox-marked" : "radiobox-blank"}
                size={20}
                color={microchipStatus === "pending" ? theme.accent : theme.muted}
              />
              <Text style={[s.microchipOptionText, microchipStatus === "pending" && s.microchipOptionTextActive]}>
                Yes, but ask me later (we'll remind you)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMicrochipStatus("none"); }}
              style={[s.microchipOption, microchipStatus === "none" && s.microchipOptionActive]}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: microchipStatus === "none" }}
            >
              <MaterialCommunityIcons
                name={microchipStatus === "none" ? "radiobox-marked" : "radiobox-blank"}
                size={20}
                color={microchipStatus === "none" ? theme.accent : theme.muted}
              />
              <Text style={[s.microchipOptionText, microchipStatus === "none" && s.microchipOptionTextActive]}>
                No
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMicrochipStatus("unsure"); }}
              style={[s.microchipOption, microchipStatus === "unsure" && s.microchipOptionActive]}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: microchipStatus === "unsure" }}
            >
              <MaterialCommunityIcons
                name={microchipStatus === "unsure" ? "radiobox-marked" : "radiobox-blank"}
                size={20}
                color={microchipStatus === "unsure" ? theme.accent : theme.muted}
              />
              <Text style={[s.microchipOptionText, microchipStatus === "unsure" && s.microchipOptionTextActive]}>
                I'm not sure
              </Text>
            </TouchableOpacity>

            <Text style={s.microchipFooter}>
              💡 Most US shelters and many breeders chip pets before adoption. Your vet can scan the chip in a few seconds at any visit.
            </Text>

            <PrimaryButton label="Next" onPress={() => setStep(LIFESTYLE_DISABLED ? 6 : 5)} />
            <SecondaryButton label="Back" onPress={() => setStep(3)} />
          </View>
        )}

        {step === 5 && (() => {
          // Build-37 unblock: on iOS 26.3.x the lifestyle screen
          // crashes the app via an unidentified void TurboModule
          // method that throws. Auto-advance off step 5 so users
          // on the affected OS skip past it on the way to step 6.
          if (LIFESTYLE_DISABLED) {
            // setState in render is safe here because it's a one-
            // shot boot-out — the very next render hits step === 6
            // and this branch is gone. React tolerates it.
            setStep(6);
            return null;
          }
          // Defensive guard — never render with an out-of-range
          // lifestyleStep. Bail to step 6 if somehow misaligned;
          // the visible no-op render avoids a crash from accessing
          // properties on an undefined `q`.
          if (lifestyleStep < 0 || lifestyleStep >= LIFESTYLE_QUESTIONS.length) {
            return null;
          }
          const q = LIFESTYLE_QUESTIONS[lifestyleStep];
          if (!q || !Array.isArray(q.options)) return null;
          const isLast = lifestyleStep === LIFESTYLE_QUESTIONS.length - 1;
          const total = LIFESTYLE_QUESTIONS.length;
          const stepNum = lifestyleStep + 1;
          const promptTitle = q.title.replace(/\{pet\}/g, name.trim() || "them");
          const petPossessive = (name.trim() || "your floof") + (name.trim().endsWith("s") ? "'" : "'s");
          return (
            <View style={s.section}>
              {/* Progress dots — one per lifestyle question; filled if
                  answered, accent if current. */}
              <View style={s.lifestyleDots}>
                {LIFESTYLE_QUESTIONS.map((qq, i) => {
                  const v = lifestyle[qq.key];
                  const answered = qq.type === "multi" ? Array.isArray(v) && v.length > 0 : !!v;
                  const active = i === lifestyleStep;
                  return (
                    <View
                      key={qq.key}
                      style={[
                        s.lifestyleDot,
                        answered && s.lifestyleDotFilled,
                        active && s.lifestyleDotActive,
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={s.eyebrow}>{cleanLabel(q.section)} · {stepNum} of {total}</Text>
              <Text style={s.h1}>{cleanLabel(promptTitle)}</Text>
              <Text style={s.sub}>{cleanLabel(q.sub)}</Text>

              <View style={{ marginTop: 8 }}>
                {q.options.map((opt) => {
                  const selected = isLifestyleSelected(q, opt.value);
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => { tapLight(); setLifestyleAnswer(q.key, opt.value, q.type); }}
                      style={({ pressed }) => [
                        s.lifestyleOption,
                        selected && s.lifestyleOptionActive,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityState={{ selected }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.lifestyleOptionLabel, selected && s.lifestyleOptionLabelActive]}>
                          {cleanLabel(opt.label)}
                        </Text>
                        {opt.help && (
                          <Text style={[s.lifestyleOptionHelp, selected && s.lifestyleOptionHelpActive]}>
                            {cleanLabel(opt.help)}
                          </Text>
                        )}
                      </View>
                      <MaterialCommunityIcons
                        name={
                          q.type === "multi"
                            ? (selected ? "check-circle" : "circle-outline")
                            : (selected ? "radiobox-marked" : "radiobox-blank")
                        }
                        size={22}
                        color={selected ? theme.accent : theme.muted}
                      />
                    </Pressable>
                  );
                })}
              </View>

              {q.cta === "tummyTracker" && (
                <View style={s.lifestyleCta}>
                  <Text style={s.lifestyleCtaTitle}>Track {petPossessive} input + output</Text>
                  <Text style={s.lifestyleCtaBody}>
                    The Tummy Tracker on Home logs every meal + every poop, scans for FDA recalls (locally — third-party never sees what you log), and turns into a vet-share PDF when you need it. Open it from Home anytime.
                  </Text>
                </View>
              )}
              {q.cta === "healthTracker" && (
                <View style={s.lifestyleCta}>
                  <Text style={s.lifestyleCtaTitle}>Add {petPossessive} health records</Text>
                  <Text style={s.lifestyleCtaBody}>
                    Vaccines, preventatives, and full health history go in Health Tracker on My Floofs — keeps you ahead of every due date and gives your vet a one-tap PDF for visits.
                  </Text>
                </View>
              )}

              <PrimaryButton label={isLast ? "Looking great — next" : "Next"} onPress={nextLifestyle} />
              <SecondaryButton label="Back" onPress={prevLifestyle} />
              <Pressable
                onPress={skipAllLifestyle}
                style={({ pressed }) => [
                  { alignSelf: "center", padding: 6 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={s.skipAllText}>Skip the rest · I'll fill these in later</Text>
              </Pressable>
            </View>
          );
        })()}

        {step === 6 && (
          <View style={s.section}>
            <Text style={s.h1}>A few quick details</Text>
            <Text style={s.label}>Age (years)</Text>
            <TextInput value={ageYears} onChangeText={setAgeYears} placeholder="e.g. 4" placeholderTextColor={theme.muted}
              keyboardType="decimal-pad" style={s.input} />
            <Text style={s.label}>Weight (lbs) — optional</Text>
            <TextInput value={weightLbs} onChangeText={setWeightLbs} placeholder="e.g. 28" placeholderTextColor={theme.muted}
              keyboardType="decimal-pad" style={s.input} />

            <View style={s.disclaimer}>
              <Text style={s.disclaimerText}>
                FloofLife gives general guidance for healthy pets, sourced from public veterinary references. It is <Text style={{ fontWeight: "700" }}>not a substitute for veterinary advice</Text>. Always consult your vet for medical questions.
              </Text>
            </View>

            <PrimaryButton label={editMode ? `Save changes` : addMode ? `Add ${name.trim() || "this pet"}` : `Start with ${name.trim() || "your pet"}`} onPress={finish} />
            <SecondaryButton label="Back" onPress={() => setStep(LIFESTYLE_DISABLED ? 4 : 5)} />
          </View>
        )}
      </ScrollView>
      <PhotoboothAnimation
        visible={showPhotobooth}
        photos={compactPhotos()}
        onDone={handlePhotoboothDone}
      />
    </KeyboardAvoidingView>
  );
}

function PrimaryButton({ label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.primaryBtn}>
      <Text style={s.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}
function SecondaryButton({ label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.secondaryBtn}>
      <Text style={s.secondaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  brand:    { fontSize: 38, fontWeight: "800", color: theme.fg, letterSpacing: -1 },
  tagline:  { fontSize: 14, color: theme.muted, marginTop: 4, marginBottom: 28 },
  h1:       { fontSize: 24, fontWeight: "700", color: theme.fg, marginBottom: 6 },
  sub:      { fontSize: 14, color: theme.muted, marginBottom: 14 },
  eyebrow:  { fontSize: 11, fontWeight: "800", color: theme.accent, letterSpacing: 1.4, marginBottom: 10, textTransform: "uppercase" },
  reelDots: { flexDirection: "row", gap: 6, marginBottom: 14 },
  reelDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.line, borderWidth: 1, borderColor: theme.line },
  reelDotFilled: { backgroundColor: theme.accent + "55", borderColor: theme.accent + "AA" },
  reelDotActive: { backgroundColor: theme.accent, borderColor: theme.accent, transform: [{ scale: 1.15 }] },
  skipAllText:   { color: theme.muted, fontSize: 12, fontStyle: "italic", marginTop: 6 },
  // Lifestyle wizard — progress dots + option rows + inline CTA card
  lifestyleDots:        { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 14 },
  lifestyleDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.line, borderWidth: 1, borderColor: theme.line },
  lifestyleDotFilled:   { backgroundColor: theme.accent + "55", borderColor: theme.accent + "AA" },
  lifestyleDotActive:   { backgroundColor: theme.accent, borderColor: theme.accent, transform: [{ scale: 1.2 }] },
  lifestyleOption:      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card, marginTop: 8 },
  lifestyleOptionActive:{ borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.accentSoft },
  lifestyleOptionLabel: { fontSize: 14, fontWeight: "600", color: theme.fg },
  lifestyleOptionLabelActive:{ color: theme.accent },
  lifestyleOptionHelp:  { fontSize: 12, color: theme.muted, marginTop: 2 },
  lifestyleOptionHelpActive:{ color: theme.accent + "CC" },
  lifestyleCta:         { marginTop: 18, padding: 14, borderRadius: 12, backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.accent + "44" },
  lifestyleCtaTitle:    { fontSize: 14, fontWeight: "800", color: theme.accent, marginBottom: 6, letterSpacing: -0.2 },
  lifestyleCtaBody:     { fontSize: 12, color: theme.fg, lineHeight: 18 },
  label:    { fontSize: 12, fontWeight: "600", color: theme.muted, marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  input:    { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 14, fontSize: 17, color: theme.fg, marginBottom: 4 },
  section:  { marginTop: 8 },
  bigCard:  { flex: 1, paddingVertical: 28, alignItems: "center", borderWidth: 1, borderColor: theme.line, borderRadius: 14, backgroundColor: theme.card },
  bigCardActive:    { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  bigCardText:      { fontSize: 18, fontWeight: "600", color: theme.fg },
  bigCardTextActive:{ color: theme.accent },
  breedGrid:{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  breedChip:{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  breedChipActive:    { borderColor: theme.accent, backgroundColor: theme.accent },
  breedChipEmoji:     { fontSize: 16 },
  breedChipText:      { color: theme.fg, fontSize: 14 },
  breedChipTextActive:{ color: "#fff", fontWeight: "600" },
  selectedRow:        { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14, marginBottom: 4, padding: 10, backgroundColor: theme.accentSoft, borderRadius: 12, borderWidth: 1, borderColor: theme.accent + "55" },
  selectedChip:       { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: theme.muted },
  primaryChip:        { backgroundColor: theme.accent },
  primaryFlag:        { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6, marginRight: 4 },
  selectedChipEmoji:  { fontSize: 14, marginRight: 4 },
  selectedChipText:   { color: "#fff", fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  selectedHint:       { width: "100%", fontSize: 11, color: theme.muted, marginTop: 4, fontStyle: "italic" },
  coatPatternHint:    { marginTop: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.accentSoft, alignSelf: "flex-start" },
  coatPatternHintText:{ fontSize: 13, color: theme.fg, fontWeight: "500" },
  disclaimer:       { marginTop: 24, padding: 14, backgroundColor: theme.accentSoft, borderRadius: 10 },
  disclaimerText:   { fontSize: 12, color: theme.fg, lineHeight: 18 },
  dnaHint:          { fontSize: 11, color: theme.muted, marginTop: 8, lineHeight: 17, fontStyle: "italic" },
  photoPicker:      { width: 220, height: 220, borderRadius: 110, alignSelf: "center", marginTop: 18, marginBottom: 6, overflow: "hidden", borderWidth: 2, borderColor: theme.accent + "55", backgroundColor: theme.accentSoft },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  photoPlaceholderText: { marginTop: 10, color: theme.accent, fontWeight: "700", fontSize: 13, letterSpacing: 0.4 },
  photoPreview:     { width: "100%", height: "100%" },
  microchipOption:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card, marginTop: 8 },
  microchipOptionActive:{ borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.accentSoft },
  microchipOptionText:{ flex: 1, fontSize: 14, color: theme.fg },
  microchipOptionTextActive:{ color: theme.accent, fontWeight: "600" },
  microchipFooter:    { fontSize: 12, color: theme.muted, marginTop: 14, lineHeight: 18, fontStyle: "italic" },
  primaryBtn:       { backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  primaryBtnText:   { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.4 },
  secondaryBtn:     { paddingVertical: 14, alignItems: "center", marginTop: 4 },
  secondaryBtnText: { color: theme.muted, fontSize: 14 },
  founder:          { marginTop: 36, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.line, gap: 10 },
  founderText:      { fontSize: 12, color: theme.muted, lineHeight: 18, fontStyle: "italic" },
});

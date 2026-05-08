import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pet, Pets } from "../lib/storage";
import { breedFacts, dogBreeds, catBreeds, breedEmoji } from "../data/breeds";
import { MAX_BREEDS, shortBreedName } from "../lib/petBreeds";
import { pickPetPhoto } from "../lib/photoPicker";
import { track } from "../lib/analytics";
import { tapMedium, notifySuccess } from "../lib/haptics";
import { theme } from "../theme";

const titleCase = s => s.split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");

// `addMode` reuses the same form as first-run onboarding to add an
// additional pet to the household — finish() routes through Pets.add()
// so existing pets are preserved.
//
// `editMode` reuses the same form to edit an existing pet's record.
// finish() routes through Pets.update(editPetId, ...) preserving the
// original createdAt. Caller passes `editPetId` so we know which record
// to load and update.
export default function OnboardingScreen({ onDone, addMode = false, editMode = false, editPetId = null }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [selectedBreeds, setSelectedBreeds] = useState([]);
  const [ageYears, setAgeYears] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [mixOf, setMixOf] = useState("");
  const [dnaNotes, setDnaNotes] = useState("");
  const [microchipStatus, setMicrochipStatus] = useState(null); // 'confirmed' | 'pending' | 'none' | 'unsure' | null
  const [microchipNumber, setMicrochipNumber] = useState("");

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
      setPhotoUri(target.photoUri || null);
      setMixOf(target.mixOf || "");
      setDnaNotes(target.dnaNotes || "");
      setMicrochipStatus(target.microchipStatus || "unsure");
      setMicrochipNumber(target.microchipNumber || "");
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

  async function pickPhoto() {
    const uri = await pickPetPhoto();
    if (uri) {
      setPhotoUri(uri);
      track("pet_photo_picked", { context: "onboarding" });
      tapMedium();
    }
  }

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
    const basePayload = {
      name: name.trim(),
      species,
      breeds: breedsList,
      breed: breedsList[0],
      mixOf: mixOf.trim() || null,
      dnaNotes: dnaNotes.trim() || null,
      ageYears: isFinite(ageNum) ? ageNum : null,
      weightLbs: isFinite(weightNum) ? weightNum : null,
      photoUri: photoUri || null,
      microchipStatus: finalMicrochipStatus,
      microchipNumber: finalMicrochipNumber,
    };
    if (editMode && editPetId) {
      // Don't overwrite createdAt on edits.
      await Pets.update(editPetId, basePayload);
      track("pet_edited", {
        species,
        has_photo: !!photoUri,
        is_mix: !!basePayload.mixOf,
      });
      notifySuccess();
    } else if (addMode) {
      await Pets.add({ ...basePayload, createdAt: Date.now() });
      track("pet_added", {
        species,
        has_photo: !!photoUri,
        has_age: basePayload.ageYears != null,
        has_weight: basePayload.weightLbs != null,
        is_mix: !!basePayload.mixOf,
      });
      notifySuccess();
    } else {
      await Pet.set({ ...basePayload, createdAt: Date.now() });
      track("onboarding_completed", {
        species,
        has_photo: !!photoUri,
        has_age: basePayload.ageYears != null,
        has_weight: basePayload.weightLbs != null,
        is_mix: !!basePayload.mixOf,
      });
      notifySuccess();
    }
    onDone();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: 60, paddingHorizontal: 22 }} keyboardShouldPersistTaps="handled">
        <Text style={s.brand}>{editMode ? `Edit ${name.trim() || "this pet"}` : addMode ? "Add a floof" : "FloofLife"}</Text>
        <Text style={s.tagline}>{editMode ? "Update the details for your floof." : addMode ? "A few quick details about your new floof." : "Better pet parenting, on autopilot"}</Text>

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

        {step === 3 && (
          <View style={s.section}>
            <Text style={s.h1}>Add a photo of {name.trim() || "your pet"}</Text>
            <Text style={s.sub}>The home screen turns into a daily reminder of who you're showing up for. Optional — you can skip.</Text>
            <TouchableOpacity onPress={pickPhoto} style={s.photoPicker} activeOpacity={0.8}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={s.photoPreview} />
              ) : (
                <View style={s.photoPlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={42} color={theme.accent} />
                  <Text style={s.photoPlaceholderText}>Tap to choose photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {photoUri && (
              <TouchableOpacity onPress={() => setPhotoUri(null)} style={{ alignSelf: "center", padding: 8 }}>
                <Text style={{ color: theme.muted, fontSize: 13 }}>Remove photo</Text>
              </TouchableOpacity>
            )}
            <PrimaryButton label="Next" onPress={() => setStep(4)} />
            <SecondaryButton label="Skip for now" onPress={() => setStep(4)} />
          </View>
        )}

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

            <PrimaryButton label="Next" onPress={() => setStep(5)} />
            <SecondaryButton label="Back" onPress={() => setStep(3)} />
          </View>
        )}

        {step === 5 && (
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
            <SecondaryButton label="Back" onPress={() => setStep(4)} />
          </View>
        )}
      </ScrollView>
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

// LogDietScreen — meal-type selector + brand/product fields with
// autocomplete from saved-foods cache + amount + note. Saves into
// the diet log; saved-foods cache auto-touches on save.
import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Pet } from "../lib/storage";
import { DietLog, SavedFoods, DIET_MEAL_TYPES, DIET_MEAL_TYPE_LABELS } from "../lib/tummy";
import { track } from "../lib/analytics";
import { tapMedium, tapLight, notifySuccess } from "../lib/haptics";
import { theme } from "../theme";

export default function LogDietScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const editEntryId = route?.params?.entryId || null;

  const [pet, setPet] = useState(null);
  const [mealType, setMealType] = useState("kibble");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [savedFoods, setSavedFoods] = useState([]);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editEntryId ? "Edit diet log" : "Log a meal" });
  }, [navigation, editEntryId]);

  useEffect(() => {
    (async () => {
      const p = await Pet.get();
      setPet(p);
      if (p?.id) {
        setSavedFoods(await SavedFoods.list(p.id));
      }
      if (editEntryId && p?.id) {
        const all = await DietLog.list(p.id);
        const target = all.find((e) => e.id === editEntryId);
        if (target) {
          setMealType(target.mealType || "kibble");
          setBrand(target.brand || "");
          setProductName(target.productName || "");
          setAmount(target.amount || "");
          setNote(target.note || "");
        }
      }
    })();
  }, [editEntryId]);

  function pickQuickFood(food) {
    tapLight();
    setBrand(food.brand || "");
    setProductName(food.productName || "");
  }

  async function save() {
    if (!pet?.id) return;
    setSaving(true);
    try {
      const payload = {
        mealType,
        brand: brand.trim(),
        productName: productName.trim(),
        amount: amount.trim(),
        note: note.trim(),
      };
      if (editEntryId) {
        await DietLog.update(pet.id, editEntryId, payload);
      } else {
        await DietLog.add(pet.id, payload);
      }
      track("tummy_tracker_diet_log_created", {
        meal_type: mealType,
        has_brand: !!payload.brand,
        pet_species: pet.species,
      });
      notifySuccess();
      navigation.goBack();
    } catch (e) {
      Alert.alert("Couldn't save", e?.message || "Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 80, paddingHorizontal: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.label}>MEAL TYPE</Text>
      <View style={s.chipRow}>
        {DIET_MEAL_TYPES.map((t) => {
          const isSelected = mealType === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => { tapMedium(); setMealType(t); }}
              style={[s.chip, isSelected && s.chipActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[s.chipText, isSelected && s.chipTextActive]}>{DIET_MEAL_TYPE_LABELS[t]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {savedFoods.length > 0 && (
        <>
          <Text style={s.label}>QUICK ADD</Text>
          <View style={s.savedRow}>
            {savedFoods.slice(0, 6).map((f) => (
              <TouchableOpacity key={f.id} onPress={() => pickQuickFood(f)} style={s.savedChip} activeOpacity={0.7}>
                <Text style={s.savedChipText} numberOfLines={1}>
                  {f.brand}{f.productName ? ` · ${f.productName}` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={s.label}>BRAND (optional)</Text>
      <TextInput
        value={brand}
        onChangeText={setBrand}
        placeholder="e.g. Purina Pro Plan"
        placeholderTextColor={theme.muted}
        style={s.input}
        autoCorrect={false}
      />

      <Text style={s.label}>PRODUCT NAME (optional)</Text>
      <Text style={s.help}>Brand + product help our recall match catch active FDA recalls.</Text>
      <TextInput
        value={productName}
        onChangeText={setProductName}
        placeholder="e.g. Adult Chicken & Rice"
        placeholderTextColor={theme.muted}
        style={s.input}
        autoCorrect={false}
      />

      <Text style={s.label}>AMOUNT (optional)</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g. 1 cup, ½ can, 3 treats"
        placeholderTextColor={theme.muted}
        style={s.input}
      />

      <Text style={s.label}>NOTE (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Anything else? Stays local."
        placeholderTextColor={theme.muted}
        style={[s.input, { minHeight: 70 }]}
        multiline
      />

      <TouchableOpacity onPress={save} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.6 }]} activeOpacity={0.85}>
        <Text style={s.saveBtnText}>{saving ? "Saving…" : (editEntryId ? "Save changes" : "Log this meal")}</Text>
      </TouchableOpacity>

      <Text style={s.disclaimer}>
        FloofLife is a personal log, not medical advice. Discuss diet changes with your veterinarian.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  label:       { fontSize: 11, fontWeight: "800", color: theme.muted, letterSpacing: 1.2, marginTop: 16, marginBottom: 6 },
  help:        { fontSize: 11, color: theme.muted, marginBottom: 8, lineHeight: 16 },
  chipRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip:        { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  chipActive:  { borderColor: theme.accent, backgroundColor: theme.accent },
  chipText:    { fontSize: 12, color: theme.fg },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  savedRow:    { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  savedChip:   { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.accent + "55", backgroundColor: theme.accentSoft, maxWidth: "100%" },
  savedChipText: { fontSize: 11, color: theme.accent, fontWeight: "600" },
  input:       { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, color: theme.fg, fontSize: 14 },
  saveBtn:     { marginTop: 22, paddingVertical: 16, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  disclaimer:  { fontSize: 11, color: theme.muted, marginTop: 16, textAlign: "center", fontStyle: "italic", lineHeight: 16 },
});

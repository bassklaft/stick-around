// Add or edit a single health record. Reuses the same form for both —
// pass `recordId` in route params to enter edit mode.
//
// Flow is steppy but linear: category → type → date → duration → optional
// attachment → optional notes → confirm. Each step validates before the
// next is shown so the user can't end up at "Save" without the basics.
//
// Attachments: PDFs go through expo-document-picker, photos through
// expo-image-picker. Either way the picked file is copied into the
// app's documentDirectory under healthRecords/<petId>/<recordId>.<ext>
// so we own the lifetime — Photos library URIs go stale.
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Pets } from "../lib/storage";
import {
  CATEGORIES,
  typesForSpecies,
  findType,
  computeNextDue,
  durationLabel,
} from "../lib/healthRecordTypes";
import { theme } from "../theme";

function todayParts() {
  const d = new Date();
  return {
    mm: String(d.getMonth() + 1).padStart(2, "0"),
    dd: String(d.getDate()).padStart(2, "0"),
    yyyy: String(d.getFullYear()),
  };
}

function partsToISO(mm, dd, yyyy) {
  const m = parseInt(mm, 10), day = parseInt(dd, 10), y = parseInt(yyyy, 10);
  if (!m || !day || !y || m < 1 || m > 12 || day < 1 || day > 31 || y < 1900 || y > 2100) return null;
  const d = new Date(y, m - 1, day);
  if (d.getMonth() !== m - 1 || d.getDate() !== day) return null;
  return d.toISOString();
}

function isoToParts(iso) {
  if (!iso) return todayParts();
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return todayParts();
  return {
    mm: String(d.getMonth() + 1).padStart(2, "0"),
    dd: String(d.getDate()).padStart(2, "0"),
    yyyy: String(d.getFullYear()),
  };
}

export default function AddHealthRecordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const petId = route?.params?.petId;
  const recordId = route?.params?.recordId;
  const isEdit = !!recordId;

  const [pet, setPet] = useState(null);
  const [category, setCategory] = useState("vaccine");
  const [typeId, setTypeId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [dateParts, setDateParts] = useState(todayParts());
  const [durationMonths, setDurationMonths] = useState(12);
  const [customDuration, setCustomDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [attachmentUri, setAttachmentUri] = useState(null);
  const [attachmentFilename, setAttachmentFilename] = useState(null);
  const [acked, setAcked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const arr = await Pets.list();
      const p = arr.find((x) => x.id === petId) || arr[0] || null;
      if (!mounted) return;
      setPet(p);
      if (isEdit) {
        const records = await Pets.listHealthRecords(p.id);
        const r = records.find((rec) => rec.id === recordId);
        if (r) {
          const t = findType(r.type);
          setCategory(t?.category || "custom");
          setTypeId(r.type);
          setCustomLabel(r.customLabel || "");
          setDateParts(isoToParts(r.dateGiven));
          setDurationMonths(r.durationMonths || 12);
          setNotes(r.notes || "");
          setAttachmentUri(r.attachmentUri || null);
          setAttachmentFilename(r.attachmentFilename || null);
          setAcked(true); // edit mode: trust the existing record
        }
      }
    })();
    return () => { mounted = false; };
  }, [petId, recordId, isEdit]);

  const speciesTypes = pet ? typesForSpecies(pet.species).filter((t) => t.category === category) : [];
  const selectedType = findType(typeId);
  const isCustom = category === "custom";

  const dateISO = partsToISO(dateParts.mm, dateParts.dd, dateParts.yyyy);
  const effectiveDuration = isCustom ? parseInt(customDuration, 10) || 0 : durationMonths;
  const nextDuePreview = dateISO && effectiveDuration > 0 ? computeNextDue(dateISO, effectiveDuration) : null;

  function pickType(id) {
    setTypeId(id);
    const t = findType(id);
    if (t) setDurationMonths(t.defaultDurationMonths);
  }

  async function pickAttachment() {
    Alert.alert("Attach a file", "Where's the document?", [
      { text: "Cancel", style: "cancel" },
      { text: "Photo Library", onPress: pickImage },
      { text: "PDF / File", onPress: pickPDF },
    ]);
  }

  async function pickImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission needed", "Allow photo access to attach a record."); return; }
      const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.85 });
      if (r.canceled || !r.assets?.[0]) return;
      await persistAttachment(r.assets[0].uri, r.assets[0].fileName || `photo-${Date.now()}.jpg`);
    } catch (e) {
      Alert.alert("Couldn't attach photo", e?.message || "Try again.");
    }
  }

  async function pickPDF() {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      await persistAttachment(r.assets[0].uri, r.assets[0].name || `doc-${Date.now()}.pdf`);
    } catch (e) {
      Alert.alert("Couldn't attach file", e?.message || "Try again.");
    }
  }

  async function persistAttachment(srcUri, filename) {
    if (!pet?.id) return;
    const dir = `${FileSystem.documentDirectory}healthRecords/${pet.id}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dst = `${dir}${Date.now()}-${safeName}`;
    await FileSystem.copyAsync({ from: srcUri, to: dst });
    setAttachmentUri(dst);
    setAttachmentFilename(safeName);
  }

  function clearAttachment() {
    Alert.alert("Remove attachment?", "The file will stay on disk until the record is saved without it.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { setAttachmentUri(null); setAttachmentFilename(null); } },
    ]);
  }

  function viewAttachment() {
    if (!attachmentUri) return;
    Linking.openURL(attachmentUri).catch((e) => Alert.alert("Couldn't open", e?.message || "Try a different file."));
  }

  function validate() {
    if (!isCustom && !typeId) { Alert.alert("Pick a type", "Choose what you're logging from the list."); return false; }
    if (isCustom && !customLabel.trim()) { Alert.alert("Name the entry", "Give your custom record a label so it's recognizable later."); return false; }
    if (!dateISO) { Alert.alert("Date", "Enter a valid date in MM/DD/YYYY format."); return false; }
    if (!effectiveDuration || effectiveDuration < 1) { Alert.alert("Duration", "Pick how long this record covers (in months)."); return false; }
    if (notes.length > 500) { Alert.alert("Notes too long", "Keep notes under 500 characters."); return false; }
    if (!acked) { Alert.alert("Confirm", "Acknowledge the disclaimer to save."); return false; }
    return true;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        type: isCustom ? "custom" : typeId,
        customLabel: isCustom ? customLabel.trim() : null,
        dateGiven: dateISO,
        durationMonths: effectiveDuration,
        nextDue: computeNextDue(dateISO, effectiveDuration),
        notes: notes.trim() || null,
        attachmentUri,
        attachmentFilename,
      };
      if (isEdit) await Pets.updateHealthRecord(pet.id, recordId, payload);
      else        await Pets.addHealthRecord(pet.id, payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Save failed", e?.message || "Try again.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete this record?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await Pets.removeHealthRecord(pet.id, recordId);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!pet) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 60 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h1}>{isEdit ? "Edit health record" : "Add health record"}</Text>
        <Text style={s.subtitle}>For {pet.name}</Text>

        <Text style={s.label}>1 · CATEGORY</Text>
        <View style={s.catRow}>
          {Object.entries(CATEGORIES).map(([key, def]) => (
            <TouchableOpacity
              key={key}
              onPress={() => { setCategory(key); setTypeId(""); }}
              style={[s.catChip, category === key && s.catChipActive]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={def.icon} size={18} color={category === key ? "#fff" : theme.accent} />
              <Text style={[s.catChipText, category === key && s.catChipTextActive]}>{def.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isCustom && (
          <>
            <Text style={s.label}>2 · TYPE</Text>
            {speciesTypes.length === 0 ? (
              <Text style={s.muted}>No types in this category for {pet.species}s.</Text>
            ) : (
              <View style={s.typeList}>
                {speciesTypes.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => pickType(t.id)}
                    style={[s.typeRow, typeId === t.id && s.typeRowActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.typeRowText, typeId === t.id && s.typeRowTextActive]}>{t.label}</Text>
                    <Text style={s.typeRowMeta}>default {durationLabel(t.defaultDurationMonths)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {isCustom && (
          <>
            <Text style={s.label}>2 · CUSTOM LABEL</Text>
            <TextInput
              value={customLabel}
              onChangeText={setCustomLabel}
              placeholder="e.g. Cardiology consult"
              placeholderTextColor={theme.muted}
              style={s.input}
              maxLength={60}
            />
          </>
        )}

        <Text style={s.label}>3 · DATE GIVEN</Text>
        <View style={s.dateRow}>
          <TextInput value={dateParts.mm} onChangeText={(v) => setDateParts((d) => ({ ...d, mm: v.replace(/\D/g, "").slice(0, 2) }))} placeholder="MM" placeholderTextColor={theme.muted} keyboardType="number-pad" style={[s.input, s.dateInput]} maxLength={2} />
          <Text style={s.dateSep}>/</Text>
          <TextInput value={dateParts.dd} onChangeText={(v) => setDateParts((d) => ({ ...d, dd: v.replace(/\D/g, "").slice(0, 2) }))} placeholder="DD" placeholderTextColor={theme.muted} keyboardType="number-pad" style={[s.input, s.dateInput]} maxLength={2} />
          <Text style={s.dateSep}>/</Text>
          <TextInput value={dateParts.yyyy} onChangeText={(v) => setDateParts((d) => ({ ...d, yyyy: v.replace(/\D/g, "").slice(0, 4) }))} placeholder="YYYY" placeholderTextColor={theme.muted} keyboardType="number-pad" style={[s.input, s.dateInputYr]} maxLength={4} />
        </View>

        <Text style={s.label}>4 · DURATION</Text>
        {!isCustom && selectedType ? (
          <View style={s.durationRow}>
            {selectedType.durationOptions.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setDurationMonths(m)}
                style={[s.durationChip, durationMonths === m && s.durationChipActive]}
                activeOpacity={0.85}
              >
                <Text style={[s.durationChipText, durationMonths === m && s.durationChipTextActive]}>{durationLabel(m)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TextInput value={customDuration} onChangeText={setCustomDuration} placeholder="months" placeholderTextColor={theme.muted} keyboardType="number-pad" style={[s.input, { flex: 1 }]} maxLength={3} />
            <Text style={s.muted}>between visits</Text>
          </View>
        )}

        {!!nextDuePreview && (
          <View style={s.previewCard}>
            <Text style={s.previewLabel}>NEXT DUE</Text>
            <Text style={s.previewDate}>{new Date(nextDuePreview).toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</Text>
          </View>
        )}

        <Text style={s.label}>5 · ATTACHMENT (optional)</Text>
        {attachmentUri ? (
          <View style={s.attachmentCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.attachmentName} numberOfLines={1}>📎 {attachmentFilename}</Text>
              <TouchableOpacity onPress={viewAttachment}><Text style={s.attachmentLink}>View</Text></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={clearAttachment} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={22} color={theme.muted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={pickAttachment} style={s.attachBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="paperclip" size={18} color={theme.accent} />
            <Text style={s.attachBtnText}>Attach photo or PDF</Text>
          </TouchableOpacity>
        )}

        <Text style={s.label}>6 · NOTES (optional)</Text>
        <TextInput
          value={notes} onChangeText={setNotes}
          multiline
          placeholder="Lot number, vet name, side effects observed, etc."
          placeholderTextColor={theme.muted}
          style={[s.input, s.notesInput]}
          maxLength={500}
        />
        <Text style={s.charCount}>{notes.length} / 500</Text>

        <TouchableOpacity onPress={() => setAcked(!acked)} style={s.ackRow} activeOpacity={0.8}>
          <View style={[s.checkbox, acked && s.checkboxOn]}>
            {acked && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
          </View>
          <Text style={s.ackText}>
            I confirm this info is accurate. FloofLife is a personal log, not medical advice — I'll verify schedules with my vet.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={save} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.6 }]} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>{isEdit ? "Save changes" : "Save record"}</Text>}
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity onPress={confirmDelete} style={s.deleteBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.red || "#C04A2C"} />
            <Text style={s.deleteBtnText}>Delete record</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  h1:           { fontSize: 24, fontWeight: "800", color: theme.fg },
  subtitle:     { fontSize: 13, color: theme.muted, marginTop: 2 },
  label:        { fontSize: 11, fontWeight: "700", color: theme.muted, letterSpacing: 1.2, marginTop: 22, marginBottom: 8 },
  muted:        { fontSize: 12, color: theme.muted },
  input:        { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, color: theme.fg },
  notesInput:   { minHeight: 90, textAlignVertical: "top" },
  charCount:    { fontSize: 11, color: theme.muted, alignSelf: "flex-end", marginTop: 4 },
  catRow:       { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip:      { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  catChipActive:{ backgroundColor: theme.accent, borderColor: theme.accent },
  catChipText:  { color: theme.fg, fontSize: 13, fontWeight: "600" },
  catChipTextActive:{ color: "#fff" },
  typeList:     { gap: 6 },
  typeRow:      { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  typeRowActive:{ borderColor: theme.accent, backgroundColor: theme.accentSoft },
  typeRowText:  { fontSize: 14, color: theme.fg, fontWeight: "600" },
  typeRowTextActive:{ color: theme.accent },
  typeRowMeta:  { fontSize: 11, color: theme.muted, marginTop: 2 },
  dateRow:      { flexDirection: "row", alignItems: "center", gap: 6 },
  dateInput:    { flex: 0, width: 64, textAlign: "center" },
  dateInputYr:  { flex: 0, width: 92, textAlign: "center" },
  dateSep:      { fontSize: 18, color: theme.muted, fontWeight: "700" },
  durationRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  durationChipActive:{ backgroundColor: theme.accent, borderColor: theme.accent },
  durationChipText:{ color: theme.fg, fontWeight: "600" },
  durationChipTextActive:{ color: "#fff" },
  previewCard:  { marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.accent + "55" },
  previewLabel: { fontSize: 10, fontWeight: "800", color: theme.accent, letterSpacing: 1.2 },
  previewDate:  { fontSize: 16, fontWeight: "700", color: theme.fg, marginTop: 4 },
  attachmentCard:{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  attachmentName:{ fontSize: 13, color: theme.fg, fontWeight: "600" },
  attachmentLink:{ fontSize: 12, color: theme.accent, fontWeight: "700", marginTop: 4 },
  attachBtn:    { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.accent + "77", borderStyle: "dashed", backgroundColor: theme.bg },
  attachBtnText:{ color: theme.accent, fontWeight: "700", fontSize: 13 },
  ackRow:       { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 22, padding: 12, borderRadius: 10, backgroundColor: theme.accentSoft },
  checkbox:     { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: theme.accent, alignItems: "center", justifyContent: "center" },
  checkboxOn:   { backgroundColor: theme.accent },
  ackText:      { flex: 1, fontSize: 12, color: theme.fg, lineHeight: 17 },
  saveBtn:      { backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 18, minHeight: 54, justifyContent: "center" },
  saveBtnText:  { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.4 },
  deleteBtn:    { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, padding: 14, marginTop: 6 },
  deleteBtnText:{ color: theme.red || "#C04A2C", fontWeight: "700", fontSize: 14 },
});

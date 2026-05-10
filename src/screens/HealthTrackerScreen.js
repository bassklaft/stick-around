// Per-pet Health Tracker. Shows overdue + upcoming + history records,
// triggers calendar export, and routes to the Add/Edit modal.
//
// Premium gating: free users can keep ONE record per pet. After that,
// the "+ Add entry" button shows the upsell instead. Edits + calendar
// export are never gated — once a record exists we don't retroactively
// take it away.
import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pets, Pet } from "../lib/storage";
import { useActivePet } from "../lib/activePet";
import { findType, statusFor, daysUntilDue, durationLabel, CATEGORIES } from "../lib/healthRecordTypes";
import { shareCalendarExport } from "../lib/icalExport";
import { usePurchases } from "../lib/purchasesContext";
import { track } from "../lib/analytics";
import { tapLight } from "../lib/haptics";
import ActivePetTitle from "../components/ActivePetTitle";
import ActivePetChip from "../components/ActivePetChip";
import PetSwitcherModal from "../components/PetSwitcherModal";
import { theme } from "../theme";

const FREE_TIER_RECORD_LIMIT = 1;

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function dueLabel(record) {
  const days = daysUntilDue(record);
  if (days == null) return "No date";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days < 30) return `Due in ${days} day${days === 1 ? "" : "s"}`;
  return `Due ${fmtDate(record.nextDue)}`;
}

function statusStyle(status) {
  if (status === "overdue") return { bg: "#FFE6E0", border: "#C04A2C", fg: "#7A2A14" };
  if (status === "due-soon") return { bg: "#FCF3D6", border: "#E0A82E", fg: "#5A3F0A" };
  return { bg: "#E2F2E5", border: "#3F8E5C", fg: "#1F4A2A" };
}

export default function HealthTrackerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const { isPremium } = usePurchases();

  // Active-pet drives the screen. The route param is honoured ONLY as
  // a one-shot seed (e.g., when navigated from a per-pet card on the
  // YourPets screen) — we then mirror it into the global active-pet
  // store so subsequent switches via the floof fan / chip / card
  // swipe propagate here without needing a navigate() with new params.
  const { petId: activePetId } = useActivePet();
  const seedPetId = route?.params?.petId || null;
  const multiPet = pets.length > 1;

  // If the screen was opened with a route-param petId that differs
  // from the global active pet, mirror it into active so this screen
  // and every other one stay in sync. Fire-and-forget; the
  // useActivePet listener will re-run load with the new id.
  useEffect(() => {
    if (seedPetId && seedPetId !== activePetId) {
      Pets.setActive(seedPetId).catch(() => {});
    }
    // Run once per route-param change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPetId]);

  // Generation counter — discards stale async results if a newer
  // load supersedes this one. See HomeScreen for the
  // wraparound-swipe race this protects against.
  const loadGenRef = useRef(0);

  const load = useCallback(async () => {
    const gen = ++loadGenRef.current;
    const all = await Pets.list();
    if (gen !== loadGenRef.current) return;
    const targetId = activePetId || seedPetId;
    let target = null;
    if (targetId) target = all.find((p) => p.id === targetId) || null;
    if (!target) {
      target = await Pet.get();
      if (gen !== loadGenRef.current) return;
    }
    if (!target) return;
    setPets(all);
    setPet(target);
    const list = await Pets.listHealthRecords(target.id);
    if (gen !== loadGenRef.current) return;
    setRecords(list);
    if (!target.healthDisclaimerAcked) setShowDisclaimer(true);
  }, [activePetId, seedPetId]);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Pet-name context header in the nav bar + active-pet chip on right
  // (multi-pet only). Switching pets here also updates the route param
  // and the global active pet so other screens stay in sync.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <ActivePetTitle
          pet={pet}
          screenName="Health Tracker"
          multiPet={multiPet}
          onPress={() => setSwitcherVisible(true)}
        />
      ),
      headerRight: multiPet
        ? () => <ActivePetChip pet={pet} onPress={() => {
            tapLight();
            navigation.navigate("Main", { screen: "YourPets" });
          }} />
        : undefined,
    });
  }, [navigation, pet, multiPet]);

  async function handlePickPet(newPetId) {
    if (!newPetId || newPetId === pet?.id) {
      setSwitcherVisible(false);
      return;
    }
    await Pets.setActive(newPetId);
    track("active_pet_switched", { source: "health_tracker_switcher", pet_count: pets.length });
    tapLight();
    setSwitcherVisible(false);
    // useActivePet listener picks up the new active pet and reloads.
  }

  async function ackDisclaimer() {
    if (pet?.id) await Pets.ackHealthDisclaimer(pet.id);
    setShowDisclaimer(false);
  }

  function startAdd() {
    if (!isPremium && records.length >= FREE_TIER_RECORD_LIMIT) {
      Alert.alert(
        "Premium feature",
        `Free pets can keep ${FREE_TIER_RECORD_LIMIT} health record. Upgrade to log unlimited vaccines, preventatives, and care entries.`,
        [
          { text: "Maybe later" },
          { text: "See Premium", onPress: () => navigation.navigate("Premium") },
        ],
      );
      return;
    }
    navigation.navigate("AddHealthRecord", { petId: pet.id });
  }

  async function exportCalendar() {
    if (records.length === 0) {
      Alert.alert("Nothing to export", "Add a record first — calendar export covers items with a next-due date.");
      return;
    }
    try {
      const ok = await shareCalendarExport(pet?.name || "Pet", records);
      if (!ok) Alert.alert("Sharing unavailable", "Couldn't open the share sheet on this device.");
    } catch (e) {
      Alert.alert("Export failed", e?.message || "Couldn't generate the .ics file.");
    }
  }

  if (!pet) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  const now = new Date();
  const future12mo = new Date(now); future12mo.setFullYear(future12mo.getFullYear() + 1);

  const overdue = records.filter((r) => statusFor(r, now) === "overdue").sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
  const upcoming = records.filter((r) => {
    if (!r.nextDue) return false;
    const d = new Date(r.nextDue);
    return d >= now && d <= future12mo;
  }).sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
  const history = records.filter((r) => !overdue.includes(r) && !upcoming.includes(r));
  history.sort((a, b) => new Date(b.dateGiven || 0) - new Date(a.dateGiven || 0));

  const atLimit = !isPremium && records.length >= FREE_TIER_RECORD_LIMIT;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        <View style={s.banner}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.accent} />
          <Text style={s.bannerText}>
            Verify every entry with your veterinarian. FloofLife logs what you enter — your vet sets the schedule.
          </Text>
        </View>

        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.subtitle}>{records.length} record{records.length === 1 ? "" : "s"} · {overdue.length} overdue</Text>
          </View>
          <TouchableOpacity onPress={exportCalendar} style={s.exportBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="calendar-export" size={18} color={theme.accent} />
            <Text style={s.exportBtnText}>Export</Text>
          </TouchableOpacity>
        </View>

        {overdue.length > 0 && (
          <Section title="Overdue" tint="#C04A2C">
            {overdue.map((r) => (
              <RecordRow key={r.id} record={r} pet={pet} navigation={navigation} />
            ))}
          </Section>
        )}

        {upcoming.length > 0 && (
          <Section title="Upcoming (next 12 months)">
            {upcoming.map((r) => (
              <RecordRow key={r.id} record={r} pet={pet} navigation={navigation} />
            ))}
          </Section>
        )}

        {records.length === 0 && (
          <View style={s.empty}>
            <MaterialCommunityIcons name="clipboard-pulse-outline" size={42} color={theme.muted} />
            <Text style={s.emptyTitle}>No records yet</Text>
            <Text style={s.emptyBody}>Add a vaccine, preventative, or wellness entry to start tracking due dates.</Text>
          </View>
        )}

        {history.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <TouchableOpacity onPress={() => setHistoryOpen((v) => !v)} style={s.historyHd} activeOpacity={0.7}>
              <Text style={s.sectionTitle}>HISTORY</Text>
              <Text style={s.historyHint}>{historyOpen ? "Hide" : `Show (${history.length})`}</Text>
            </TouchableOpacity>
            {historyOpen && history.map((r) => (
              <RecordRow key={r.id} record={r} pet={pet} navigation={navigation} muted />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity onPress={startAdd} style={[s.fab, { bottom: insets.bottom + 24 }]} activeOpacity={0.85}>
        <MaterialCommunityIcons name={atLimit ? "lock-outline" : "plus"} size={22} color="#fff" />
        <Text style={s.fabText}>{atLimit ? "Add entry · Premium" : "Add entry"}</Text>
      </TouchableOpacity>

      <PetSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
        pets={pets}
        activeId={pet?.id}
        onPick={handlePickPet}
      />

      {/* First-run disclaimer modal — required dismissal */}
      <Modal visible={showDisclaimer} animationType="fade" transparent>
        <View style={s.modalScrim}>
          <View style={s.modalCard}>
            <MaterialCommunityIcons name="shield-alert-outline" size={36} color={theme.accent} />
            <Text style={s.modalTitle}>Before you log anything</Text>
            <Text style={s.modalBody}>
              FloofLife's Health Tracker is a personal log — not medical advice. Schedules differ
              by region, lifestyle, and your vet's protocol. Always confirm cadences and due dates
              with the clinic that knows {pet.name}.
            </Text>
            <Text style={s.modalBody}>
              Attachments stay on this device. We don't read or upload them.
            </Text>
            <TouchableOpacity onPress={ackDisclaimer} style={s.modalBtn} activeOpacity={0.85}>
              <Text style={s.modalBtnText}>I understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, tint, children }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={[s.sectionTitle, tint && { color: tint }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function RecordRow({ record, pet, navigation, muted }) {
  const type = findType(record.type);
  const cat = CATEGORIES[type?.category || "custom"];
  const status = statusFor(record);
  const tone = statusStyle(status);
  const label = record.customLabel || type?.label || record.type;
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("AddHealthRecord", { petId: pet.id, recordId: record.id })}
      style={[s.row, muted && { opacity: 0.7 }]}
      activeOpacity={0.7}
    >
      <View style={[s.rowIcon, { backgroundColor: theme.accent + "1f" }]}>
        <MaterialCommunityIcons name={cat?.icon || "plus-circle"} size={22} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{label}</Text>
        <Text style={s.rowMeta}>
          Given {fmtDate(record.dateGiven)} · {durationLabel(record.durationMonths)}
        </Text>
        {!!record.notes && <Text style={s.rowNotes} numberOfLines={2}>{record.notes}</Text>}
        {!!record.attachmentUri && (
          <Text style={s.rowAttachment} numberOfLines={1}>
            📎 {record.attachmentFilename || "Attachment"}
          </Text>
        )}
      </View>
      {!muted && (
        <View style={[s.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          <Text style={[s.statusText, { color: tone.fg }]}>{dueLabel(record)}</Text>
        </View>
      )}
      {muted && <Text style={s.rowDate}>{fmtDate(record.dateGiven)}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  banner:        { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, backgroundColor: theme.accentSoft, borderRadius: 10, marginTop: 8 },
  bannerText:    { flex: 1, fontSize: 12, color: theme.fg, lineHeight: 17 },
  headerRow:     { flexDirection: "row", alignItems: "center", marginTop: 14 },
  h1:            { fontSize: 22, fontWeight: "800", color: theme.fg },
  subtitle:      { fontSize: 12, color: theme.muted, marginTop: 2 },
  exportBtn:     { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.accent + "55", backgroundColor: theme.accentSoft },
  exportBtnText: { color: theme.accent, fontWeight: "700", fontSize: 13 },
  sectionTitle:  { fontSize: 11, fontWeight: "700", color: theme.muted, letterSpacing: 1.2, marginBottom: 8 },
  row:           { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 8 },
  rowIcon:       { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  rowTitle:      { fontSize: 14, fontWeight: "700", color: theme.fg },
  rowMeta:       { fontSize: 11, color: theme.muted, marginTop: 2 },
  rowNotes:      { fontSize: 12, color: theme.fg, marginTop: 4, lineHeight: 17 },
  rowAttachment: { fontSize: 11, color: theme.accent, marginTop: 4, fontWeight: "600" },
  rowDate:       { fontSize: 11, color: theme.muted },
  statusBadge:   { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  statusText:    { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
  historyHd:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 6 },
  historyHint:   { fontSize: 12, color: theme.accent, fontWeight: "700" },
  empty:         { alignItems: "center", padding: 36, marginTop: 20, borderRadius: 14, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card },
  emptyTitle:    { fontSize: 16, fontWeight: "700", color: theme.fg, marginTop: 10 },
  emptyBody:     { fontSize: 13, color: theme.muted, marginTop: 6, textAlign: "center", lineHeight: 18 },
  fab:           { position: "absolute", right: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, backgroundColor: theme.accent, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  fabText:       { color: "#fff", fontWeight: "800", fontSize: 14, letterSpacing: 0.4 },
  modalScrim:    { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 22 },
  modalCard:     { backgroundColor: theme.bg, borderRadius: 16, padding: 22, alignItems: "center", maxWidth: 380, width: "100%" },
  modalTitle:    { fontSize: 20, fontWeight: "800", color: theme.fg, marginTop: 12, textAlign: "center" },
  modalBody:     { fontSize: 13, color: theme.fg, lineHeight: 19, marginTop: 12, textAlign: "center" },
  modalBtn:      { backgroundColor: theme.accent, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginTop: 18, alignSelf: "stretch", alignItems: "center" },
  modalBtnText:  { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.4 },
});

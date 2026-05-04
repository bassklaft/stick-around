// Home hub — pet-photo hero with greeting + 5 destination cards.
// The hero is the emotional anchor: a big photo of the pet behind a
// gentle dark gradient, name + breed overlaid. FloofLife exists to
// keep that face around for more years.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, RefreshControl, Linking, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pet, Pets, ChecklistState } from "../lib/storage";
import { generateChecklist } from "../lib/checklist";
import { breedFacts } from "../data/breeds";
import { getPrimaryBreed, mixedBreedLabel, isMixedBreed, shortBreedName } from "../lib/petBreeds";
import { findType, statusFor, daysUntilDue } from "../lib/healthRecordTypes";
import { openMapsSearch } from "../lib/maps";
import { theme } from "../theme";

const titleCase = s => s.split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState(null);
  const [items, setItems] = useState([]);
  const [state, setState] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [healthRecords, setHealthRecords] = useState([]);

  const load = useCallback(async () => {
    const p = await Pet.get();
    setPet(p);
    setItems(generateChecklist(p));
    setState(await ChecklistState.get());
    if (p?.id) {
      setHealthRecords(await Pets.listHealthRecords(p.id));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openVetsNearMe() {
    openMapsSearch("veterinarian");
  }

  if (!pet) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  const primaryBreed = getPrimaryBreed(pet);
  const breed = breedFacts[primaryBreed];
  const breedDisplay = mixedBreedLabel(pet) || titleCase(primaryBreed);
  const completed = items.filter(i => state[i.id]?.status === "done").length;
  const hasPhoto = !!pet.photoUri;

  // Health tracker preview: nearest upcoming + overdue count
  const overdueCount = healthRecords.filter((r) => statusFor(r) === "overdue").length;
  const nextUpcoming = healthRecords
    .filter((r) => r?.nextDue && statusFor(r) !== "overdue")
    .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))[0] || null;
  const healthSubtitle = (() => {
    if (healthRecords.length === 0) return "No records yet — tap to add vaccines, preventatives, more";
    if (nextUpcoming) {
      const days = daysUntilDue(nextUpcoming);
      const t = findType(nextUpcoming.type);
      const label = nextUpcoming.customLabel || t?.label || "Next";
      if (days != null && days >= 0 && days <= 365) {
        return `${label} due in ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"}`}`;
      }
    }
    return overdueCount > 0 ? `${overdueCount} overdue · tap to review` : "Up to date — review your log";
  })();

  const cards = [
    { key: "pets",     title: "Your Pets",            subtitle: `${pet.name} · ${breedDisplay}`,    icon: "paw",            tint: theme.accent, onPress: () => navigation.navigate("Main", { screen: "YourPets" }) },
    { key: "diet",     title: "Diet & Care",          subtitle: "Supplements, fresh foods, grooming products",     icon: "food-apple",     tint: "#3F8E5C",    onPress: () => navigation.navigate("Diet") },
    { key: "health",   title: "Health Tracker",       subtitle: healthSubtitle, icon: "clipboard-pulse-outline", tint: "#3F8E5C", onPress: () => navigation.navigate("HealthTracker", { petId: pet.id }), badge: overdueCount > 0 ? overdueCount : null },
    { key: "toxic",    title: "Toxic Foods & Plants", subtitle: "Quick reference — what to keep away",             icon: "leaf",           tint: theme.green,  onPress: () => navigation.navigate("Toxic") },
    { key: "age",      title: "Age Calculator",       subtitle: `${pet.name}'s human-equivalent age — multi-factor, not "1 yr = 7"`, icon: "calendar-heart", tint: "#7A4F0A", onPress: () => navigation.navigate("DogAge") },
    { key: "risk",     title: "Risk Map",             subtitle: "Hazards near you · breed-specific risks · rules of thumb", icon: "map-marker-alert", tint: "#9C2A0F", onPress: () => navigation.navigate("Risk") },
    { key: "training", title: "Training Exercises",   subtitle: "Behavioral, physical, mental — and how often",     icon: "school",         tint: "#7A4F0A",    onPress: () => navigation.navigate("Training") },
    { key: "trip",     title: "Trip Planning",        subtitle: "Packing, transit safety, tick prep",                icon: "bag-suitcase",   tint: "#3F5A30",    onPress: () => navigation.navigate("Trip") },
    { key: "recalls",  title: "Recalls & Class Actions", subtitle: "Active FDA investigations & owner concerns",  icon: "alert-octagon",  tint: "#C04A2C",    onPress: () => navigation.navigate("Recalls") },
    { key: "vets",     title: "Vets Near Me",         subtitle: "Apple or Google Maps — your choice",              icon: "hospital-marker", tint: "#3F8E5C",   onPress: openVetsNearMe },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      {/* Hero — pet photo background with darkening gradient + overlay text */}
      {hasPhoto ? (
        <ImageBackground source={{ uri: pet.photoUri }} style={s.hero} imageStyle={s.heroImage}>
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <Text style={s.heroEyebrow}>FOR</Text>
            <Text style={s.heroName}>{pet.name}</Text>
            <Text style={s.heroMeta}>
              {breedDisplay} · {pet.ageYears} yr{pet.weightLbs ? ` · ${pet.weightLbs} lb` : ""}
            </Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={s.heroFallback}>
          <Text style={s.greet}>Hi, {pet.name}'s human 👋</Text>
          <Text style={s.species}>{breedDisplay} {pet.species} · {pet.ageYears} yr{pet.weightLbs ? ` · ${pet.weightLbs} lb` : ""}</Text>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <TouchableOpacity onPress={() => navigation.navigate("Main", { screen: "Checklist" })} style={s.progress}>
          <Text style={s.progressLabel}>This week</Text>
          <Text style={s.progressCount}>{completed} of {items.length} done →</Text>
        </TouchableOpacity>

        {/* Emergency pinned at the top — needs to be findable in 2 seconds */}
        <TouchableOpacity onPress={() => navigation.navigate("Emergency")} style={s.emergencyCard} activeOpacity={0.7}>
          <View style={s.emergencyIcon}>
            <MaterialCommunityIcons name="hospital-box" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.emergencyTitle}>EMERGENCY RESOURCES</Text>
            <Text style={s.emergencySubtitle}>Poison-control hotlines · find an ER vet · pet first-aid course</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={s.sectionHd}>QUICK ACCESS</Text>
        {cards.map(c => (
          <TouchableOpacity key={c.key} onPress={c.onPress} style={s.card} activeOpacity={0.7}>
            <View style={[s.iconCircle, { backgroundColor: c.tint + "1f" }]}>
              <MaterialCommunityIcons name={c.icon} size={26} color={c.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{c.title}</Text>
              <Text style={s.cardSubtitle}>{c.subtitle}</Text>
            </View>
            {c.badge ? (
              <View style={s.cardBadge}><Text style={s.cardBadgeText}>{c.badge}</Text></View>
            ) : null}
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />
          </TouchableOpacity>
        ))}

        {Array.isArray(breed?.tips) && breed.tips.length > 0 && (
          <>
            <Text style={s.sectionHd}>INSIDER TIPS · {isMixedBreed(pet) ? shortBreedName(primaryBreed).toUpperCase() : titleCase(primaryBreed)}</Text>
            <View style={s.tipsCard}>
              <Text style={s.tipsSub}>From owner communities, breed clubs, and vet references.</Text>
              {breed.tips.slice(0, 3).map((tip, i) => (
                <View key={i} style={s.tipRow}>
                  <Text style={s.tipBullet}>›</Text>
                  <Text style={s.tipBody}>{tip}</Text>
                </View>
              ))}
              {breed.tips.length > 3 && (
                <TouchableOpacity onPress={() => navigation.navigate("Main", { screen: "YourPets" })} style={s.tipsMore}>
                  <Text style={s.tipsMoreText}>See all {breed.tips.length} tips →</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            FloofLife guidance is not a substitute for veterinary advice. When something feels wrong, call your vet.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero:         { width: "100%", height: 320, justifyContent: "flex-end" },
  heroImage:    { resizeMode: "cover" },
  heroOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  heroContent:  { padding: 22 },
  heroEyebrow:  { fontSize: 11, fontWeight: "700", color: "#FBE4DC", letterSpacing: 1.6, marginBottom: 4 },
  heroName:     { fontSize: 38, fontWeight: "800", color: "#fff", letterSpacing: -0.5, textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroMeta:     { fontSize: 14, color: "#fff", marginTop: 2, opacity: 0.95, textTransform: "capitalize" },
  heroFallback: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  greet:        { fontSize: 22, fontWeight: "700", color: theme.fg, marginTop: 4 },
  species:      { fontSize: 13, color: theme.muted, marginTop: 4, textTransform: "capitalize" },
  progress:     { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 14, paddingHorizontal: 16, backgroundColor: theme.accentSoft, borderRadius: 12 },
  progressLabel:{ color: theme.fg, fontWeight: "700", fontSize: 14, letterSpacing: 0.5 },
  progressCount:{ color: theme.accent, fontWeight: "800", fontSize: 16 },
  sectionHd:    { marginTop: 22, marginBottom: 10, fontSize: 11, fontWeight: "700", color: theme.muted, letterSpacing: 1.2 },
  emergencyCard:    { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#C04A2C", borderRadius: 14, marginTop: 18, gap: 14 },
  emergencyIcon:    { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  emergencyTitle:   { fontSize: 14, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  emergencySubtitle:{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 15 },
  card:         { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.line, marginBottom: 10, gap: 14 },
  cardBadge:    { backgroundColor: theme.red, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", marginRight: 4 },
  cardBadgeText:{ color: "#fff", fontSize: 11, fontWeight: "800" },
  iconCircle:   { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardTitle:    { fontSize: 16, fontWeight: "700", color: theme.fg },
  cardSubtitle: { fontSize: 12, color: theme.muted, marginTop: 2, lineHeight: 17 },
  tipsCard:     { padding: 14, backgroundColor: theme.accentSoft, borderRadius: 12, borderWidth: 1, borderColor: theme.accent + "44" },
  tipsSub:      { fontSize: 11, color: theme.muted, lineHeight: 16, marginBottom: 10, fontStyle: "italic" },
  tipRow:       { flexDirection: "row", marginBottom: 8 },
  tipBullet:    { color: theme.accent, fontWeight: "800", marginRight: 8, fontSize: 14, lineHeight: 19 },
  tipBody:      { flex: 1, fontSize: 13, color: theme.fg, lineHeight: 19 },
  tipsMore:     { marginTop: 4, alignSelf: "flex-start", paddingVertical: 4 },
  tipsMoreText: { color: theme.accent, fontWeight: "700", fontSize: 13 },
  disclaimer:   { marginTop: 24, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

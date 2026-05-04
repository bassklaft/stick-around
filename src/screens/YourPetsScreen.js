// Your Pets — multi-pet view sorted oldest-first. Each pet card shows
// avatar (tap to set/change photo), name, breed badge, breed summary
// + insider tips. Tap "Add another pet" to onboard a second.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Linking, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pets } from "../lib/storage";
import { usePurchases } from "../lib/purchasesContext";
import { breedFacts, breedDisplayName, breedEmoji } from "../data/breeds";
import { pickPetPhoto } from "../lib/photoPicker";
import { theme } from "../theme";

const titleCase = s => (s || "").split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");

export default function YourPetsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [pets, setPets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [healthOpen, setHealthOpen] = useState({});
  const { isPremium } = usePurchases();

  const load = useCallback(async () => {
    const list = await Pets.listSortedOldestFirst();
    setPets(list);
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function changePhoto(petId) {
    const uri = await pickPetPhoto({ petId });
    if (!uri) return;
    await Pets.update(petId, { photoUri: uri });
    load();
  }

  function addAnotherPet() {
    if (!isPremium) {
      Alert.alert(
        "Multi-floof is a Premium feature",
        "Upgrade to add a second (or third, or fifth) floof to FloofLife. Each gets their own breed-tailored checklist.",
        [
          { text: "Maybe later" },
          { text: "See Premium", onPress: () => navigation.navigate("Premium") },
        ],
      );
      return;
    }
    navigation.navigate("AddPet");
  }

  if (pets.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={{ fontSize: 48 }}>🐾</Text>
        <Text style={s.emptyTitle}>No floofs yet</Text>
        <Text style={s.emptyBody}>Reset all data and run onboarding to add your first floof.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 60, paddingHorizontal: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <Text style={s.intro}>
        💝 The pets you love, sorted oldest first — they've been around the longest, they get the spotlight.
      </Text>

      {pets.map((pet, idx) => {
        const breed = breedFacts[(pet.breed || "").toLowerCase()];
        return (
          <View key={pet.id || idx} style={s.petCard}>
            {idx === 0 && pets.length > 1 && (
              <View style={s.eldestBadge}><Text style={s.eldestBadgeText}>👑 ELDEST</Text></View>
            )}

            <View style={{ alignItems: "center", marginTop: 4 }}>
              <TouchableOpacity onPress={() => changePhoto(pet.id)} activeOpacity={0.7} style={s.avatarWrap}>
                {pet.photoUri ? (
                  <Image source={{ uri: pet.photoUri }} style={s.avatar} />
                ) : (
                  <View style={s.avatarFallback}>
                    <Text style={{ fontSize: 44 }}>{breedEmoji(pet.breed)}</Text>
                  </View>
                )}
                <View style={s.avatarBadge}>
                  <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={s.avatarHint}>{pet.photoUri ? "Tap to change photo" : "Tap to add a photo"}</Text>
            </View>

            <Text style={s.petName}>{pet.name}</Text>
            <Text style={s.petMeta}>
              {titleCase(pet.breed || "")} {pet.species} · {pet.ageYears} yr{pet.weightLbs ? ` · ${pet.weightLbs} lb` : ""}
            </Text>
            {pet.mixOf && <Text style={s.mixMeta}>Mix of: {pet.mixOf}</Text>}

            {breed?.summary && (
              <View style={s.breedCard}>
                <Text style={s.breedTitle}>About {breedDisplayName(pet.breed)}</Text>
                {breed.origin && <Text style={s.breedOrigin}>📍 {breed.origin}</Text>}
                <Text style={s.breedBody}>{breed.summary}</Text>
                {breed.originStory && (
                  <Text style={[s.breedBody, { marginTop: 10, fontStyle: "italic" }]}>
                    {breed.originStory}
                  </Text>
                )}
                {(breed.origin || breed.originStory) && (
                  <Text style={s.originNote}>
                    Origin information reflects current scholarly consensus where available, and acknowledged debate where it exists.
                  </Text>
                )}
                {Array.isArray(breed.references) && breed.references.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={s.breedRefHd}>SOURCES & DEEP DIVES</Text>
                    {breed.references.map((r, i) => (
                      <TouchableOpacity key={i} onPress={() => Linking.openURL(r.url)} style={{ paddingVertical: 4 }}>
                        <Text style={s.breedRefText}>↗ {r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {breed.brachycephalic && (
                  <View style={s.brachyWarn}>
                    <Text style={s.brachyText}>
                      ⚠ Short-snout (brachycephalic) breed. Most airlines refuse them as cargo, heat above 80°F is dangerous, and BOAS surgery is a common breed-specific intervention.
                    </Text>
                  </View>
                )}

                {Array.isArray(breed.health) && breed.health.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setHealthOpen(prev => ({ ...prev, [pet.id]: !prev[pet.id] }))}
                    style={s.healthDisclosure}
                  >
                    <View style={s.healthHeader}>
                      <Text style={s.healthHeaderText}>
                        💛 Health considerations to know
                      </Text>
                      <Text style={s.healthHeaderHint}>
                        {healthOpen[pet.id] ? "Tap to hide" : "Tap to learn more"}
                      </Text>
                    </View>
                    {healthOpen[pet.id] && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={s.healthIntro}>
                          Every breed has health patterns worth knowing — being aware lets you screen early and stay ahead of issues.
                        </Text>
                        {breed.health.map((h, i) => (
                          <View key={i} style={s.healthRow}>
                            <Text style={s.healthBullet}>›</Text>
                            <Text style={s.healthBody}>{h}</Text>
                          </View>
                        ))}
                        <Text style={s.healthFooter}>
                          Discuss screening cadence with your vet — most of these are catchable early.
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {Array.isArray(breed?.tips) && breed.tips.length > 0 && (
              <View style={s.tipsCard}>
                <Text style={s.tipsTitle}>💡 Insider tips for {breedDisplayName(pet.breed)}</Text>
                <Text style={s.tipsSub}>From owner communities, breed clubs, and vet references.</Text>
                {breed.tips.map((tip, i) => (
                  <View key={i} style={s.tipRow}>
                    <Text style={s.tipBullet}>›</Text>
                    <Text style={s.tipBody}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity onPress={addAnotherPet} style={s.addBtn} activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={theme.accent} />
        <Text style={s.addBtnText}>Add another floof</Text>
        {!isPremium && (
          <View style={s.premiumBadge}>
            <Text style={s.premiumBadgeText}>PREMIUM</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          FloofLife guidance is not a substitute for veterinary advice. When something feels wrong, call your vet.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  empty:        { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: theme.bg },
  emptyTitle:   { fontSize: 18, fontWeight: "700", color: theme.fg, marginTop: 14 },
  emptyBody:    { fontSize: 13, color: theme.muted, marginTop: 6, textAlign: "center" },
  intro:        { fontSize: 13, color: theme.muted, marginBottom: 14, lineHeight: 19 },
  petCard:      { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.line, padding: 18, marginBottom: 16, position: "relative" },
  eldestBadge:  { position: "absolute", top: 12, right: 12, backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  eldestBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  avatarWrap:    { position: "relative" },
  avatar:        { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: theme.accent + "55" },
  avatarFallback:{ width: 130, height: 130, borderRadius: 65, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  avatarBadge:   { position: "absolute", bottom: 4, right: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.card },
  avatarHint:    { fontSize: 11, color: theme.muted, marginTop: 8, fontStyle: "italic" },
  petName:       { fontSize: 26, fontWeight: "800", color: theme.fg, marginTop: 12, textAlign: "center", textTransform: "capitalize" },
  petMeta:       { fontSize: 13, color: theme.muted, marginTop: 4, textAlign: "center", textTransform: "capitalize" },
  mixMeta:       { fontSize: 12, color: theme.accent, marginTop: 4, textAlign: "center", fontStyle: "italic" },
  breedCard:     { marginTop: 16, padding: 14, backgroundColor: theme.bg, borderRadius: 12, borderWidth: 1, borderColor: theme.line },
  breedTitle:    { fontWeight: "700", color: theme.fg, fontSize: 16, marginBottom: 4 },
  breedOrigin:   { fontSize: 11, color: theme.muted, fontWeight: "600", marginBottom: 8, letterSpacing: 0.3 },
  originNote:    { fontSize: 10, color: theme.muted, fontStyle: "italic", marginTop: 8, lineHeight: 14 },
  breedBody:     { fontSize: 13, color: theme.muted, lineHeight: 19 },
  breedRefHd:    { fontSize: 10, fontWeight: "800", color: theme.muted, letterSpacing: 1, marginBottom: 6 },
  breedRefText:  { fontSize: 12, color: theme.accent, fontWeight: "600" },
  brachyWarn:    { marginTop: 12, padding: 10, backgroundColor: "#FCE9C8", borderRadius: 8, borderWidth: 1, borderColor: "#E0A82E" },
  brachyText:    { fontSize: 12, color: "#5A3F0A", lineHeight: 18 },
  healthDisclosure:{ marginTop: 12, padding: 12, backgroundColor: theme.bg, borderRadius: 10, borderWidth: 1, borderColor: theme.line },
  healthHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  healthHeaderText:{ fontSize: 13, fontWeight: "700", color: theme.fg },
  healthHeaderHint:{ fontSize: 11, color: theme.accent, fontWeight: "600" },
  healthIntro:     { fontSize: 12, color: theme.muted, lineHeight: 17, marginBottom: 8 },
  healthRow:       { flexDirection: "row", marginBottom: 6 },
  healthBullet:    { color: theme.accent, fontWeight: "800", marginRight: 8, fontSize: 14, lineHeight: 19 },
  healthBody:      { flex: 1, fontSize: 12, color: theme.fg, lineHeight: 18 },
  healthFooter:    { fontSize: 11, color: theme.muted, fontStyle: "italic", marginTop: 6, lineHeight: 16 },
  tipsCard:      { marginTop: 12, padding: 14, backgroundColor: theme.accentSoft, borderRadius: 12, borderWidth: 1, borderColor: theme.accent + "44" },
  tipsTitle:     { fontWeight: "800", color: theme.fg, fontSize: 14, marginBottom: 4 },
  tipsSub:       { fontSize: 11, color: theme.muted, lineHeight: 16, marginBottom: 10, fontStyle: "italic" },
  tipRow:        { flexDirection: "row", marginBottom: 8 },
  tipBullet:     { color: theme.accent, fontWeight: "800", marginRight: 8, fontSize: 14, lineHeight: 19 },
  tipBody:       { flex: 1, fontSize: 13, color: theme.fg, lineHeight: 19 },
  addBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: theme.accent, borderStyle: "dashed", backgroundColor: theme.bg, marginTop: 4 },
  addBtnText:    { color: theme.accent, fontWeight: "700", fontSize: 14 },
  premiumBadge:  { backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginLeft: 4 },
  premiumBadgeText:{ color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  disclaimer:    { marginTop: 16, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

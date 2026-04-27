// Risk Map — location-aware (weather + known hazards), breed-aware,
// and curated rules of thumb. Honest about what's NOT in the data:
// dog-bite stats per zip, real-time tick density, individual rescue
// locations are not included — the categories rely on county/regional
// flags rather than real-time per-block data.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Pet } from "../lib/storage";
import { breedFacts } from "../data/breeds";
import { findHazards, findRegional } from "../data/hazardSites";
import { RULES_OF_THUMB } from "../data/rulesOfThumb";
import { theme } from "../theme";

const SEV_COLOR = {
  high:     { bg: "#F9DAD0", fg: "#9C2A0F", label: "HIGH" },
  moderate: { bg: "#FCE9C8", fg: "#7A4F0A", label: "WATCH" },
  low:      { bg: "#E2EFDC", fg: "#3F5A30", label: "INFO" },
};

export default function RiskScreen() {
  const insets = useSafeAreaInsets();
  const [pet, setPet] = useState(null);
  const [coords, setCoords] = useState(null);
  const [perm, setPerm] = useState("unknown");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const p = await Pet.get();
    setPet(p);
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function requestLocation() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPerm(status);
      if (status !== "granted") { setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });
      // Open-Meteo — free, no key, current weather
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`);
        if (r.ok) {
          const d = await r.json();
          setWeather(d.current);
        }
      } catch {}
    } catch (e) {
      Alert.alert("Location error", e?.message || "Couldn't get your location.");
    }
    setLoading(false);
  }

  const breed = pet ? breedFacts[(pet.breed || "").toLowerCase()] : null;

  // Build the location-aware risk list
  const locationRisks = [];
  if (weather && pet) {
    const t = weather.temperature_2m;
    if (t >= 85) {
      locationRisks.push({
        icon: "thermometer-high", sev: t >= 95 ? "high" : "moderate",
        title: `Pavement is ${t.toFixed(0)}°F right now`,
        body: `Asphalt at this air temperature can hit 130-150°F. Skip walks 11am-5pm or use boots. ${breed?.brachycephalic ? "Your brachycephalic breed is at extra heat-stroke risk." : ""}`,
      });
    }
    if (t <= 35) {
      locationRisks.push({
        icon: "snowflake", sev: t <= 20 ? "high" : "moderate",
        title: `It's ${t.toFixed(0)}°F outside`,
        body: `Single-coated breeds (Frenchie, Pit, Boxer, Whippet, Greyhound, Doberman, Yorkie, Chihuahua) need a coat below 40°F. Salt + ice cracks paws — paw balm or boots before walks.`,
      });
    }
  }
  if (coords) {
    for (const h of findHazards(coords.lat, coords.lng)) {
      locationRisks.push({
        icon: "biohazard", sev: h.severity,
        title: `${h.name}`, body: `${h.summary} — ${h.advice}`,
        link: h.sourceUrl, linkLabel: "EPA / source",
      });
    }
    for (const r of findRegional(coords.lat, coords.lng)) {
      locationRisks.push({
        icon: r.kind === "highway" ? "road-variant"
            : r.kind === "lepto" ? "water-alert"
            : r.kind === "rats" ? "biohazard"
            : r.kind === "ticks" ? "spider"
            : r.kind === "alligator" ? "alert-octagon"
            : r.kind === "wildlife" ? "paw-off"
            : r.kind === "noise" ? "volume-high"
            : r.kind === "foxtails" ? "grass"
            : "alert",
        sev: "moderate",
        title: r.kind === "highway" ? "Heavy-traffic urban area"
              : r.kind === "lepto" ? "Lepto exposure risk"
              : r.kind === "rats" ? "Rodenticide ingestion risk"
              : r.kind === "ticks" ? "Tick-density zone"
              : r.kind === "alligator" ? "Alligator territory"
              : r.kind === "wildlife" ? "Wildlife encounters"
              : r.kind === "noise" ? "Noise / firework events"
              : r.kind === "foxtails" ? "Foxtail season"
              : "Regional risk",
        body: r.text,
      });
    }
  }

  // Breed/pet-specific risks
  const petRisks = [];
  if (breed?.brachycephalic) {
    petRisks.push({
      icon: "weather-sunny", sev: "high",
      title: "Heat is genuinely dangerous",
      body: "Short-snouted breeds can't pant efficiently and overheat fast. Keep walks under 80°F, never leave them in cars, watch for noisy/labored breathing at rest.",
    });
    petRisks.push({
      icon: "airplane-off", sev: "moderate",
      title: "Most airlines refuse cargo",
      body: "United, Delta, American, and most international carriers ban brachycephalic breeds in cargo due to in-flight death rates. In-cabin only — confirm policy before booking.",
    });
  }
  if (pet?.species === "dog" && pet?.breed) {
    const b = pet.breed.toLowerCase();
    if (b === "siberian husky") {
      petRisks.push({ icon: "fence", sev: "high", title: "Top breed for escape + lost-dog stats", body: "Huskies dig under fences, jump 6+ ft, and roam if not contained. GPS tag the collar; concrete-base fence; never trust 'reliable recall'." });
    }
    if (b === "dachshund" || b === "pembroke welsh corgi") {
      petRisks.push({ icon: "stairs-down", sev: "high", title: "Spinal injury risk", body: "Long-backed breeds: 1 in 4 Dachshunds + many Corgis have an IVDD episode. Use ramps, not stairs/jumps from couch/bed." });
    }
    if (b === "great dane" || b === "bernese mountain dog" || b === "rottweiler" || b === "doberman pinscher" || b === "german shepherd") {
      petRisks.push({ icon: "stomach", sev: "moderate", title: "Bloat (GDV) risk", body: "Deep-chested breeds: feed 2-3 small meals, no exercise within 1 hour of eating. Discuss prophylactic gastropexy with your vet at spay/neuter." });
    }
  }
  if (pet?.ageYears != null) {
    if (pet.species === "dog" && pet.ageYears >= 8) {
      petRisks.push({ icon: "head-cog-outline", sev: "moderate", title: "Senior dog — annual bloodwork", body: "Once-yearly labs catch kidney, liver, thyroid disease before symptoms. Most causes of senior dog death are findable on routine panels." });
    }
    if (pet.species === "cat" && pet.ageYears >= 10) {
      petRisks.push({ icon: "head-cog-outline", sev: "moderate", title: "Senior cat — kidney values", body: "Chronic kidney disease is the #1 senior cat killer and is silent until late. Push for SDMA + creatinine bloodwork yearly." });
    }
    if (pet.ageYears < 1) {
      petRisks.push({ icon: "school", sev: "low", title: "Socialization window is closing", body: "Before 16 weeks, expose to 100 different people, surfaces, sounds, dogs. After 16 weeks, building positive associations to new things gets 10x harder." });
    }
  }
  if (pet?.species === "cat") {
    petRisks.push({ icon: "home-heart", sev: "low", title: "Indoor cats live ~3x longer", body: "Outdoor cats average 2-5 years; indoor cats 12-18. Cars + coyotes + diseases. A catio or window perch + interactive play is the right balance for most." });
  }

  // Which rules-of-thumb to surface — filtered by species
  const species = pet?.species || "dog";
  const tips = RULES_OF_THUMB.filter(r => r.species.includes(species));

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}
    >
      <View style={s.intro}>
        <Text style={s.introBody}>
          Risks specific to your pet, your breed, your weather, and your location. Honest scope: this isn't a real-time per-block safety map — we flag known hazard sites, regional patterns, and breed-specific risks. Always check posted signs and trust your instincts.
        </Text>
      </View>

      {/* Location section */}
      <Text style={s.sectionHd}>WHERE YOU ARE</Text>
      {!coords ? (
        <View style={s.locCard}>
          <MaterialCommunityIcons name="map-marker-radius" size={36} color={theme.accent} />
          <Text style={s.locTitle}>Enable location for nearby risks</Text>
          <Text style={s.locBody}>Pavement-temp warnings, known contamination sites (Meeker Plume, Gowanus Canal, etc.), tick-zone flags, and regional patterns near you.</Text>
          <TouchableOpacity onPress={requestLocation} style={s.locBtn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.locBtnText}>Use my location</Text>}
          </TouchableOpacity>
          {perm === "denied" && (
            <Text style={s.locDenied}>Permission denied — enable in Settings → Stick Around → Location.</Text>
          )}
        </View>
      ) : (
        <>
          <View style={s.weatherRow}>
            <Text style={s.weatherTemp}>{weather ? `${weather.temperature_2m.toFixed(0)}°F` : "—"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.weatherMeta}>at your location</Text>
              <Text style={s.weatherSub}>Lat {coords.lat.toFixed(3)}, Lng {coords.lng.toFixed(3)}</Text>
            </View>
            <TouchableOpacity onPress={requestLocation}>
              <MaterialCommunityIcons name="refresh" size={22} color={theme.accent} />
            </TouchableOpacity>
          </View>
          {locationRisks.length === 0 ? (
            <View style={s.greenCard}>
              <Text style={s.greenText}>✓ No location-specific flags right now. Standard care applies.</Text>
            </View>
          ) : (
            locationRisks.map((r, i) => <RiskCard key={i} risk={r} />)
          )}
        </>
      )}

      {/* Breed / pet section */}
      {pet && petRisks.length > 0 && (
        <>
          <Text style={s.sectionHd}>FOR YOUR PET</Text>
          {petRisks.map((r, i) => <RiskCard key={i} risk={r} />)}
        </>
      )}

      {/* Rules of thumb */}
      <Text style={s.sectionHd}>RULES OF THUMB</Text>
      {tips.map((r, i) => (
        <View key={i} style={s.ruleCard}>
          <View style={s.ruleIcon}>
            <MaterialCommunityIcons name={r.icon} size={22} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.ruleTitle}>{r.title}</Text>
            <Text style={s.ruleBody}>{r.body}</Text>
          </View>
        </View>
      ))}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          Editorial summary, not a real-time safety service. Live tick density, dog-bite incident maps, and individual rescue/reactive-dog locations aren't in our data — that's a v2 feature requiring per-jurisdiction integrations.
        </Text>
      </View>
    </ScrollView>
  );
}

function RiskCard({ risk }) {
  const meta = SEV_COLOR[risk.sev] || SEV_COLOR.low;
  return (
    <View style={[rs.card, { borderColor: meta.fg + "33" }]}>
      <View style={rs.hd}>
        <View style={rs.iconCircle}>
          <MaterialCommunityIcons name={risk.icon} size={18} color={meta.fg} />
        </View>
        <Text style={rs.title}>{risk.title}</Text>
        <View style={[rs.sevBadge, { backgroundColor: meta.bg }]}>
          <Text style={[rs.sevText, { color: meta.fg }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={rs.body}>{risk.body}</Text>
      {risk.link && (
        <TouchableOpacity onPress={() => Linking.openURL(risk.link)} style={rs.linkBtn}>
          <MaterialCommunityIcons name="open-in-new" size={12} color={theme.accent} />
          <Text style={rs.linkText}>{risk.linkLabel || "Source"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  intro:        { padding: 14, backgroundColor: theme.accentSoft, borderRadius: 12, marginBottom: 12 },
  introBody:    { fontSize: 13, color: theme.fg, lineHeight: 19 },
  sectionHd:    { marginTop: 18, marginBottom: 10, fontSize: 11, fontWeight: "800", color: theme.muted, letterSpacing: 1.2 },
  locCard:      { padding: 18, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.line, alignItems: "center" },
  locTitle:     { fontSize: 16, fontWeight: "700", color: theme.fg, marginTop: 10 },
  locBody:      { fontSize: 12, color: theme.muted, marginTop: 6, textAlign: "center", lineHeight: 18 },
  locBtn:       { marginTop: 14, backgroundColor: theme.accent, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  locBtnText:   { color: "#fff", fontWeight: "700", fontSize: 14 },
  locDenied:    { color: theme.red, fontSize: 11, marginTop: 8, textAlign: "center" },
  weatherRow:   { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 10, gap: 14 },
  weatherTemp:  { fontSize: 32, fontWeight: "800", color: theme.fg },
  weatherMeta:  { fontSize: 12, fontWeight: "600", color: theme.fg },
  weatherSub:   { fontSize: 11, color: theme.muted, marginTop: 2 },
  greenCard:    { padding: 14, backgroundColor: "#E2EFDC", borderRadius: 10, borderWidth: 1, borderColor: "#3F5A30" + "33" },
  greenText:    { color: "#3F5A30", fontSize: 13, fontWeight: "600" },
  ruleCard:     { flexDirection: "row", padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 8, gap: 12 },
  ruleIcon:     { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  ruleTitle:    { fontWeight: "700", color: theme.fg, fontSize: 14 },
  ruleBody:     { fontSize: 12, color: theme.muted, marginTop: 4, lineHeight: 18 },
  disclaimer:   { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

const rs = StyleSheet.create({
  card:        { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  hd:          { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  iconCircle:  { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  title:       { flex: 1, fontSize: 14, fontWeight: "700", color: theme.fg },
  sevBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  sevText:     { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  body:        { fontSize: 13, color: theme.fg, lineHeight: 19 },
  linkBtn:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, alignSelf: "flex-start" },
  linkText:    { color: theme.accent, fontWeight: "700", fontSize: 12 },
});

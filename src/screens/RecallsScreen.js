// Recalls & Class Actions — curated list of known active concerns +
// links to authoritative sources for live data. The FDA does NOT publish
// a clean public API for pet recalls, so v1 ships a curated list and
// outbound search links. v2 should integrate the FDA RSS feed via a
// backend.
//
// Liability framing: every entry is "investigated by FDA" / "owner
// reports" / "class action filed" — never "this product is dangerous".
import React, { useState, useMemo } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const ENTRIES = [
  {
    name: "Greenies Dental Chews",
    category: "Dental treats",
    severity: "investigation",
    summary: "FDA received reports of intestinal blockages — including some fatal — between 2003 and 2006, prompting a class-action lawsuit and reformulation. Newer Greenies are designed to break down more easily, but owner concerns persist on Reddit and Facebook owner groups.",
    advice: "If you feed Greenies, supervise consumption, choose the size matched to your dog (oversized chews are riskier), and watch for vomiting or refusing food in the 24-48h after.",
    sourceUrl: "https://www.fda.gov/animal-veterinary/recalls-withdrawals",
    sourceLabel: "FDA pet food recalls",
    year: "2003-present",
  },
  {
    name: "Grain-free diets / DCM (dilated cardiomyopathy)",
    category: "Diet category",
    severity: "investigation",
    summary: "FDA opened an investigation in 2018 linking certain grain-free, legume-heavy diets to dilated cardiomyopathy in dogs, particularly breeds not genetically predisposed. Investigation ongoing — no formal recall, but vets widely advise caution with boutique BEG (boutique, exotic-protein, grain-free) diets.",
    advice: "If your dog is on a grain-free or legume-heavy diet, mention it at your next vet visit. Most vets recommend a diet from a manufacturer with veterinary nutritionists on staff (WSAVA-compliant brands).",
    sourceUrl: "https://www.fda.gov/animal-veterinary/news-events/fda-investigation-potential-link-between-certain-diets-and-canine-dilated-cardiomyopathy",
    sourceLabel: "FDA DCM investigation",
    year: "2018-present",
  },
  {
    name: "Sportmix / Midwestern Pet Foods (aflatoxin)",
    category: "Kibble",
    severity: "recall",
    summary: "Recalled in 2021 after >70 dog deaths from aflatoxin contamination. Several brands under the Midwestern Pet Foods umbrella affected. Owners should check lot numbers if they have older bags in storage.",
    advice: "Check FDA recall page for lot numbers. Aflatoxin is undetectable by smell or taste.",
    sourceUrl: "https://www.fda.gov/animal-veterinary/recalls-withdrawals",
    sourceLabel: "FDA recalls page",
    year: "2020-2021",
  },
  {
    name: "Hill's Science Diet (vitamin D toxicity)",
    category: "Wet food",
    severity: "recall",
    summary: "2019 recall of canned dog food due to elevated vitamin D causing kidney damage and several deaths. Class action settled in 2021.",
    advice: "Old recalled stock should be off shelves, but owners should check the FDA archive for affected lot numbers if they have any pre-2019 cans stored.",
    sourceUrl: "https://www.fda.gov/animal-veterinary/recalls-withdrawals",
    sourceLabel: "FDA recalls page",
    year: "2019",
  },
  {
    name: "Yak chews / cheese chews",
    category: "Hard chew treats",
    severity: "concern",
    summary: "Vets and emergency clinics report frequent broken teeth and intestinal blockages from very hard chews (yak/Himalayan cheese, antlers, cow hooves). No formal recall — these are sold as 'natural' but the hardness causes mechanical injury.",
    advice: "Use the 'thumbnail rule' — if you can't dent it with a thumbnail, it's likely too hard for your dog's teeth. Always supervise.",
    sourceUrl: "https://avdc.org/AVDCccpd/animal-veterinary-dental-college-position-statement-dental-related/",
    sourceLabel: "AVDC dental position statement",
    year: "Ongoing concern",
  },
  {
    name: "Rawhide chews",
    category: "Chew treats",
    severity: "concern",
    summary: "Choking + intestinal blockage risk widely reported. Many vets recommend skipping rawhide entirely in favor of bully sticks or single-ingredient freeze-dried.",
    advice: "If you do feed rawhide, supervise closely and remove smaller-than-walnut pieces.",
    sourceUrl: "https://www.fda.gov/animal-veterinary/recalls-withdrawals",
    sourceLabel: "FDA recalls page",
    year: "Ongoing concern",
  },
  {
    name: "Jerky treats from China (multiple brands)",
    category: "Treats",
    severity: "investigation",
    summary: "FDA investigation 2007-present into jerky treats (chicken, duck, sweet potato) sourced from China linked to thousands of pet illnesses and deaths. No single contaminant identified; advisory remains active.",
    advice: "Check the country of origin on jerky treats. Many US-made alternatives exist (Bocce's, Stella & Chewy's, etc.).",
    sourceUrl: "https://www.fda.gov/animal-veterinary/recalls-withdrawals/jerky-pet-treats",
    sourceLabel: "FDA jerky treat advisory",
    year: "2007-present",
  },
];

const SEV_META = {
  recall:        { label: "RECALL",         bg: "#F9DAD0", fg: "#9C2A0F" },
  investigation: { label: "INVESTIGATION",  bg: "#FCE9C8", fg: "#7A4F0A" },
  concern:       { label: "OWNER CONCERN",  bg: "#E9E2D2", fg: "#5A4A30" },
};

export default function RecallsScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return ENTRIES;
    const q = query.toLowerCase();
    return ENTRIES.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}
    >
      <View style={s.intro}>
        <Text style={s.introHd}>⚠ KEEP IN MIND · LAST UPDATED 2026-04-27</Text>
        <Text style={s.introBody}>
          Curated editorial summary from FDA investigations, AVMA bulletins, and publicly reported class actions. This list is not real-time. New recalls drop weekly — before acting on anything below, verify current status at the FDA pet food recall page.
        </Text>
      </View>

      <View style={s.linksRow}>
        <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL("https://www.fda.gov/animal-veterinary/recalls-withdrawals")}>
          <MaterialCommunityIcons name="open-in-new" size={14} color={theme.accent} />
          <Text style={s.linkBtnText}>FDA pet food recalls</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL("https://www.avma.org/resources-tools/pet-owners/petcare/recalls")}>
          <MaterialCommunityIcons name="open-in-new" size={14} color={theme.accent} />
          <Text style={s.linkBtnText}>AVMA pet recalls</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search products, brands, categories…"
        placeholderTextColor={theme.muted}
        style={s.search}
      />

      {filtered.map((e, i) => {
        const meta = SEV_META[e.severity] || SEV_META.concern;
        return (
          <View key={i} style={s.card}>
            <View style={s.cardHd}>
              <Text style={s.cardName}>{e.name}</Text>
              <View style={[s.sevBadge, { backgroundColor: meta.bg }]}>
                <Text style={[s.sevText, { color: meta.fg }]}>{meta.label}</Text>
              </View>
            </View>
            <Text style={s.cardMeta}>{e.category} · {e.year}</Text>
            <Text style={s.cardBody}>{e.summary}</Text>
            {e.advice && (
              <View style={s.adviceBox}>
                <Text style={s.adviceLabel}>What to do</Text>
                <Text style={s.adviceText}>{e.advice}</Text>
              </View>
            )}
            <TouchableOpacity style={s.sourceBtn} onPress={() => Linking.openURL(e.sourceUrl)}>
              <MaterialCommunityIcons name="open-in-new" size={14} color={theme.accent} />
              <Text style={s.sourceText}>{e.sourceLabel}</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {filtered.length === 0 && (
        <Text style={{ color: theme.muted, textAlign: "center", marginTop: 30 }}>No matches.</Text>
      )}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          This list is editorial summary, not legal or medical advice. Class action eligibility varies by state — see the linked sources for filing details.{"\n\n"}
          Stick Around provides general care guidance and is not a substitute for professional veterinary care. Always consult your veterinarian for medical decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  intro:       { padding: 14, backgroundColor: "#FCE9C8", borderRadius: 12, borderWidth: 1, borderColor: "#E0A82E", marginBottom: 12 },
  introHd:     { fontSize: 11, fontWeight: "800", color: "#7A4F0A", letterSpacing: 1.2, marginBottom: 4 },
  introBody:   { fontSize: 12, color: "#5A3F0A", lineHeight: 18 },
  linksRow:    { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  linkBtn:     { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.accentSoft, borderRadius: 8 },
  linkBtnText: { color: theme.accent, fontWeight: "700", fontSize: 12 },
  search:      { backgroundColor: theme.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.fg, borderWidth: 1, borderColor: theme.line, marginBottom: 10 },
  card:        { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 10 },
  cardHd:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  cardName:    { flex: 1, fontSize: 15, fontWeight: "800", color: theme.fg, lineHeight: 20 },
  sevBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  sevText:     { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  cardMeta:    { fontSize: 11, color: theme.muted, marginTop: 2, fontWeight: "600" },
  cardBody:    { fontSize: 13, color: theme.fg, marginTop: 8, lineHeight: 19 },
  adviceBox:   { marginTop: 10, padding: 10, backgroundColor: theme.accentSoft, borderRadius: 8 },
  adviceLabel: { fontSize: 10, fontWeight: "800", color: theme.accent, letterSpacing: 0.8, marginBottom: 3 },
  adviceText:  { fontSize: 12, color: theme.fg, lineHeight: 18 },
  sourceBtn:   { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, alignSelf: "flex-start" },
  sourceText:  { color: theme.accent, fontWeight: "700", fontSize: 12 },
  disclaimer:  { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText: { fontSize: 11, color: theme.fg, lineHeight: 17 },
});

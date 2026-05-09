// Diet & Supplements — universally helpful additions to the average pet
// diet. Curated based on owner-community consensus + AVMA + Tufts vet
// nutrition guidance. Everything here is general, not medical advice.
import React, { useState, useMemo } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const ITEMS = [
  // ─── Supplements ───
  {
    section: "Supplements",
    icon: "pill",
    name: "Fish oil / algae oil (omega-3)",
    blurb: "Anti-inflammatory; supports skin, coat, joints, heart. Algae oil is the vegetarian-source equivalent and avoids fishy breath.",
    species: ["dog", "cat"],
    notes: "Dose by body weight — typically 20-55 mg combined EPA+DHA per lb/day. Refrigerate after opening.",
  },
  {
    section: "Supplements",
    icon: "shield-check",
    name: "Proviable probiotics",
    blurb: "Multi-strain probiotic + prebiotic; widely recommended after antibiotics, GI upset, or for chronic loose stools.",
    species: ["dog", "cat"],
    notes: "Sold as 'Proviable-DC' (capsules) and 'Proviable-Forte' (paste). Available without prescription.",
  },
  {
    section: "Joint Supplements",
    icon: "bone",
    name: "Mobility Bites",
    blurb: "Soft chew with glucosamine, chondroitin, MSM, green-lipped mussel. Owner-favorite for early-stage stiffness.",
    species: ["dog"],
    notes: "Most owners report visible difference within 4-6 weeks of consistent daily use.",
  },
  {
    section: "Joint Supplements",
    icon: "bone",
    name: "Jope",
    blurb: "Veterinary-formulated joint chew with patented UC-II collagen. Subscription-based, tracks visible improvement.",
    species: ["dog"],
    notes: "Pricier than off-the-shelf options; many owners switch from Cosequin/Dasuquin and stick with it.",
  },
  {
    section: "Joint Supplements",
    icon: "bone",
    name: "Duralactin",
    blurb: "Microlactin (milk protein concentrate) — anti-inflammatory used in chronic joint discomfort and post-surgical recovery.",
    species: ["dog", "cat"],
    notes: "Often paired with glucosamine products rather than used alone.",
  },
  {
    section: "Joint Supplements",
    icon: "bone",
    name: "Cosequin / Dasuquin (classic glucosamine)",
    blurb: "The standard glucosamine + chondroitin chews — Cosequin for general joint support, Dasuquin (with avocado/soy unsaponifiables) for more advanced cases.",
    species: ["dog", "cat"],
    notes: "Cat-specific formulations exist; don't share dog Cosequin with cats long-term.",
  },

  // ─── Whole foods ───
  {
    section: "Whole Foods",
    icon: "fruit-cherries",
    name: "Blueberries (fresh or frozen)",
    blurb: "High in antioxidants, low in calories, dog + cat safe in small amounts. A great low-calorie training treat.",
    species: ["dog", "cat"],
    notes: "Frozen ones are great for teething puppies. ~2-3 per training session for medium dogs.",
  },
  {
    section: "Whole Foods",
    icon: "leaf",
    name: "Frozen cut green beans",
    blurb: "Low-calorie, high-fiber filler. Vets recommend the 'green bean diet' for overweight dogs — replace 10-25% of kibble with green beans.",
    species: ["dog"],
    notes: "Plain frozen is best. Avoid canned green beans with added salt.",
  },
  {
    section: "Whole Foods",
    icon: "rice",
    name: "Plain white rice (small amounts)",
    blurb: "The classic bland-diet base for upset stomach: boil white rice + boiled chicken or lean ground beef, 1:1, no seasoning.",
    species: ["dog", "cat"],
    notes: "Short-term only (3-5 days). Prolonged white rice diet lacks essential nutrients.",
  },
  {
    section: "Whole Foods",
    icon: "food",
    name: "Plain canned pumpkin (not pie filling)",
    blurb: "Fiber that helps with both diarrhea AND constipation. The vet's go-to for mild GI upset.",
    species: ["dog", "cat"],
    notes: "1 tsp/10 lb body weight, mixed into food. Plain pumpkin only — pie filling has xylitol/spices.",
  },
  {
    section: "Whole Foods",
    icon: "carrot",
    name: "Cooked plain sweet potato or carrot",
    blurb: "Nutrient-dense, low-fat, dog + cat safe. Great fresh-food rotation alongside kibble.",
    species: ["dog", "cat"],
    notes: "Steam or boil. Skip butter/salt/spices.",
  },
  {
    section: "Whole Foods",
    icon: "food-apple",
    name: "Fresh-food rotation (small portions)",
    blurb: "Adding 10-25% fresh whole foods (cooked egg, plain yogurt, sardines, blueberries) on top of kibble is widely recommended by integrative vets.",
    species: ["dog", "cat"],
    notes: "Tufts + UC Davis nutrition centers recommend fresh-food rotation as a hedge against single-source kibble issues.",
  },

  // ─── Treats ───
  {
    section: "Treats",
    icon: "cookie",
    name: "Bocce's Bakery",
    blurb: "US-made, simple ingredient lists (often 5-10 items, real food first). Owner favorite among the 'clean treat' crowd.",
    species: ["dog"],
    notes: "Look for limited-ingredient lines if your dog has allergies. Available at most pet stores.",
  },
  {
    section: "Treats",
    icon: "cookie",
    name: "Single-ingredient freeze-dried",
    blurb: "Stella & Chewy's, Vital Essentials, Primal — freeze-dried liver, beef, salmon. Single-ingredient = easy to spot allergy triggers.",
    species: ["dog", "cat"],
    notes: "High-value training treats. Crumble for small dogs.",
  },
  {
    section: "Treats",
    icon: "cookie",
    name: "Plain training treats: chicken, hot dog (small bits)",
    blurb: "Cheap, irresistible, and easy to portion. Boil chicken breast, dice tiny, freeze in bags.",
    species: ["dog"],
    notes: "Hot dogs are high-sodium — use sparingly. Avoid xylitol-containing flavored varieties.",
  },

  // ─── Care Products ───
  {
    section: "Care Products",
    icon: "ear-hearing",
    name: "Malacetic ear wash",
    blurb: "Acidic cleansing solution recommended by vets for dogs with chronic ear issues — controls yeast and bacterial buildup. Available without prescription at most pet stores.",
    species: ["dog", "cat"],
    notes: "Squirt in the canal, massage at the base, let them shake it out, wipe with cotton (not Q-tips deep). Weekly for at-risk breeds (Cocker, Springer, Poodle, Lab swimmers).",
  },
  {
    section: "Care Products",
    icon: "bottle-tonic",
    name: "Burt's Bees Oatmeal & Honey shampoo",
    blurb: "Affordable, fragrance-free, oatmeal-based dog shampoo. Owner favorite for sensitive skin and post-flare recovery. pH-balanced for canine skin.",
    species: ["dog"],
    notes: "Skip human shampoo — pH is too acidic for dog skin. Earthbath, Espree, and Vetoquinol UltraSoothe are similar gentle alternatives.",
  },
  {
    section: "Care Products",
    icon: "shoe-print",
    name: "Paw wash after walks",
    blurb: "Pollen, salt, antifreeze, herbicides, and microplastics ride home on paws. A quick rinse prevents licking + ingestion + chronic paw dermatitis.",
    species: ["dog"],
    notes: "Dexas MudBuster (paw plunger) is the cult-favorite. A damp cloth works fine for short-haired breeds.",
  },
  {
    section: "Care Products",
    icon: "shoe-formal",
    name: "Boots for hot pavement, salt, and gravel",
    blurb: "Pavement above 120°F burns paw pads in seconds. Winter salt + ice cracks pads. Boots solve both. Most owners prefer Ruffwear, Pawz disposable rubber, or Muttluks.",
    species: ["dog"],
    notes: "Acclimate over a week — most dogs walk weird at first. Practice indoors with treats.",
  },
  {
    section: "Care Products",
    icon: "content-cut",
    name: "Trim dewclaws every 4-6 weeks",
    blurb: "Dewclaws (the 'thumb' on the inside of the leg) don't wear down on walks like the others. Untrimmed, they can curl into the pad — painful and infection-prone.",
    species: ["dog"],
    notes: "Use guillotine clippers or a Dremel. Cut just past the quick. If you nick it, styptic powder stops bleeding fast — keep some on hand.",
  },
];

const FILTERS = ["All", "Supplements", "Joint Supplements", "Whole Foods", "Treats", "Care Products"];

export default function DietScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = ITEMS;
    if (filter !== "All") list = list.filter(it => it.section === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(it => it.name.toLowerCase().includes(q) || it.blurb.toLowerCase().includes(q));
    }
    return list;
  }, [filter, query]);

  // Group filtered items by section for headers
  const grouped = useMemo(() => {
    const out = {};
    for (const it of filtered) {
      out[it.section] = out[it.section] || [];
      out[it.section].push(it);
    }
    return out;
  }, [filtered]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}
    >
      <View style={s.intro}>
        <Text style={s.introBody}>
          Supplements, fresh foods, clean-ingredient treats, and grooming/skin-care products owner communities and integrative vets consistently recommend. Always verify with your veterinarian.
        </Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search supplements, foods, brands…"
        placeholderTextColor={theme.muted}
        style={s.search}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }} style={{ marginBottom: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[s.filter, filter === f && s.filterActive]}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {Object.entries(grouped).map(([section, items]) => (
        <View key={section}>
          <Text style={s.sectionHd}>{section.toUpperCase()}</Text>
          {items.map((it, i) => (
            <View key={section + i} style={s.card}>
              <View style={s.iconCircle}>
                <MaterialCommunityIcons name={it.icon} size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{it.name}</Text>
                <Text style={s.itemBlurb}>{it.blurb}</Text>
                {it.notes && <Text style={s.itemNotes}>{it.notes}</Text>}
                <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                  {it.species.map(sp => (
                    <Text key={sp} style={s.speciesTag}>{sp === "dog" ? "🐕 dog" : "🐈 cat"}</Text>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          Always introduce new supplements/foods slowly and one at a time so you can spot reactions. Talk to your vet before adding supplements if your pet is on prescription medication. Products mentioned are referenced from pet-owner communities and are not medical endorsements.{"\n\n"}
          FloofLife provides general care guidance and is not a substitute for professional veterinary care. Always consult your veterinarian for medical decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  intro:        { padding: 14, backgroundColor: theme.accentSoft, borderRadius: 12, marginBottom: 12 },
  introBody:    { fontSize: 13, color: theme.fg, lineHeight: 19 },
  search:       { backgroundColor: theme.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.fg, borderWidth: 1, borderColor: theme.line, marginBottom: 10 },
  filter:       { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card, marginRight: 8 },
  filterActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  filterText:   { color: theme.fg, fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  sectionHd:    { marginTop: 14, marginBottom: 8, fontSize: 11, fontWeight: "700", color: theme.muted, letterSpacing: 1.2 },
  card:         { flexDirection: "row", padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 8, gap: 12 },
  iconCircle:   { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  itemName:     { fontSize: 15, fontWeight: "700", color: theme.fg },
  itemBlurb:    { fontSize: 12, color: theme.muted, marginTop: 4, lineHeight: 18 },
  itemNotes:    { fontSize: 11, color: theme.fg, marginTop: 6, fontStyle: "italic", lineHeight: 17 },
  speciesTag:   { fontSize: 11, color: theme.muted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "#EDE3D2" },
  disclaimer:   { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

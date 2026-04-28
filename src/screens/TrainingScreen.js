// Training Exercises — by goal (behavioral, physical, mental,
// socialization). Each exercise has cadence + the "why". Keeps it
// universal across breeds; breed-specific tips already live on the
// Your Pets screen.
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const CATEGORIES = [
  { key: "behavioral",     label: "Behavioral",     icon: "head-cog",       color: theme.accent },
  { key: "physical",       label: "Physical",       icon: "run",            color: "#3F8E5C" },
  { key: "mental",         label: "Mental",         icon: "brain",          color: "#7A4F0A" },
  { key: "socialization",  label: "Socialization",  icon: "account-group",  color: "#3F5A30" },
];

const EXERCISES = [
  // Behavioral
  {
    cat: "behavioral",
    name: "Recall (come when called)",
    cadence: "Daily, 5-10 min",
    why: "Recall is the difference between safe-off-leash and a dog hit by a car. The single highest-value behavior to drill.",
    how: "Start indoors with a long line + high-value treat (cheese, chicken). Say their name + 'come', mark with a click or 'yes' the moment they look, treat when they reach you. Never call to do something they don't like (bath, leaving park) — undermines the cue.",
  },
  {
    cat: "behavioral",
    name: "Loose-leash walking",
    cadence: "Every walk",
    why: "Pulling on the leash damages the trachea over time (especially Yorkies, Pomeranians, Frenchies). Calm walks build a calm dog.",
    how: "Stop walking the moment leash tightens. Wait for slack — even half a step back — then continue. Boring for the first week; transformative by week three.",
  },
  {
    cat: "behavioral",
    name: "Sit / down / stay (impulse control)",
    cadence: "Daily, 3-5 min × 3",
    why: "Foundation cues. A dog that can sit-stay can also wait at the door, hold for nail trims, and avoid greeting jumps.",
    how: "Lure with treat to position, mark + treat, fade the lure within a week. Build duration before distance, build distance before distractions — never all three at once.",
  },
  {
    cat: "behavioral",
    name: "Place / mat training",
    cadence: "Daily, 5-10 min",
    why: "Gives them a job during dinner, work calls, or visitors instead of inventing one (barking, herding, jumping).",
    how: "Lure to a specific bed/mat, reward calmness on it. Build duration in 1-min increments. Use a 'release' word to end. Most owners find this the single biggest household-quality-of-life cue.",
  },

  // Physical
  {
    cat: "physical",
    name: "Sustained walk (not just sniffing)",
    cadence: "Daily, 30-60 min",
    why: "Cardiovascular health, weight management, joint stability. Sniff-walks are mental work; structured walks are physical work — your dog needs both.",
    how: "Find a route long enough to actually tire them. Pace at 3-4 mph for healthy adult dogs. Watch for early lameness signs.",
  },
  {
    cat: "physical",
    name: "Fetch with rest intervals",
    cadence: "2-3x/week, 15-20 min",
    why: "High-impact bursts build muscle, but unbroken sprinting wears joints. Interval-style is healthier than 30 minutes of nonstop chase.",
    how: "Throw, retrieve, then 30-60 sec of sniff-around or sit-stay before the next throw. Skip on hard surfaces — grass or sand only.",
  },
  {
    cat: "physical",
    name: "Hill walking / sand walking",
    cadence: "1-2x/week",
    why: "Builds rear-end strength, especially for senior dogs, IVDD-prone breeds (Dachshund, Corgi), and post-TPLO recovery.",
    how: "Find a gentle hill or beach. Slow pace, focus on form. Quality over distance.",
  },
  {
    cat: "physical",
    name: "Swimming (low-impact cardio)",
    cadence: "When weather permits",
    why: "Best joint-friendly exercise for arthritic seniors, hip-dysplasia-prone breeds (Lab, GSD, Berner), and weight-loss programs.",
    how: "Pool or quiet lake. Life jacket for breeds that can't swim well (Frenchies, Bulldogs — these breeds should NEVER swim unattended).",
  },

  // Mental
  {
    cat: "mental",
    name: "Snuffle mat / scatter feeding",
    cadence: "Daily, replace 1 meal",
    why: "Mental work tires a dog faster than physical work. A snuffle mat for breakfast = 20 minutes of foraging instead of 30 seconds of inhaling.",
    how: "Sprinkle kibble in a snuffle mat, towel, or small section of yard. Let them work. Especially good for high-energy breeds (Border Collie, Aussie, Husky, Beagle).",
  },
  {
    cat: "mental",
    name: "Frozen Kong / lick mat",
    cadence: "Daily, 15-30 min",
    why: "Licking releases endorphins. Self-soothing tool for crate time, alone time, vet anxiety, fireworks.",
    how: "Stuff Kong with peanut butter (xylitol-free), plain yogurt, or wet food. Freeze 4+ hours. Lasts 20-40 min.",
  },
  {
    cat: "mental",
    name: "Trick training (new cue/week)",
    cadence: "Weekly, learn 1 new",
    why: "Older dogs that learn new tricks score better on cognitive tests. It's literal brain exercise.",
    how: "Pick one: spin, bow, roll over, paw, high-five, hold object. 5-min sessions, 2-3x/day, mark + treat. Most healthy adult dogs learn a new trick in 3-5 days.",
  },
  {
    cat: "mental",
    name: "Nose work / scent games",
    cadence: "Weekly",
    why: "Taps into dogs' strongest sense. Even 15 min of scent work is more tiring than an hour-long walk.",
    how: "Hide treats in different rooms with increasing difficulty. 'Find it!' is the cue. Formal nose work classes exist if you want to compete.",
  },

  // Socialization
  {
    cat: "socialization",
    name: "Puppy socialization (3-16 weeks)",
    cadence: "Daily during window",
    why: "The 3-16 week window is non-negotiable. After 16 weeks, building positive associations to new things becomes 10x harder.",
    how: "Expose to: 100 different people (kids, men in hats, people with canes), 100 surfaces (grass, gravel, metal grates, stairs), 100 sounds (vacuum, traffic, fireworks at low volume). Reward calmness; never force.",
  },
  {
    cat: "socialization",
    name: "Adult novelty exposure",
    cadence: "Weekly, 1-2 new things",
    why: "Adult dogs lose social skills if they only see the same 3 people + 5 dogs. Confidence is a muscle.",
    how: "New park, new walking route, sit-and-watch at an outdoor cafe, new dog friend (not a play session — just calm coexistence at a distance).",
  },
  {
    cat: "socialization",
    name: "Handling drills (paws, ears, mouth)",
    cadence: "3-5x/week",
    why: "Dogs that hate vet visits and grooming usually weren't conditioned to handling. 5 min/week prevents 20 years of fights.",
    how: "Touch a paw, treat. Lift an ear, treat. Open the mouth, treat. Build slowly. End on a win — never push through resistance.",
  },
  {
    cat: "socialization",
    name: "Leash neutrality (passing dogs/people without reacting)",
    cadence: "Every walk",
    why: "Reactivity is the #1 reason dogs are rehomed. Neutral passing = lifetime peace.",
    how: "When you spot another dog/person, treat your dog before they fixate. Build the association: 'dog appears = chicken appears'. Distance matters — start far enough that they can ignore. A force-free trainer is worth the money if it's not progressing.",
  },
];

export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? EXERCISES : EXERCISES.filter(e => e.cat === filter);

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}>
      <View style={s.intro}>
        <Text style={s.introBody}>
          A balanced dog needs all four: behavioral training (house manners), physical exercise (body), mental enrichment (brain), and socialization (confidence with novelty). Doing only one is what creates anxious or reactive dogs.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }} style={{ marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setFilter("all")} style={[s.filter, filter === "all" && s.filterActive]}>
          <Text style={[s.filterText, filter === "all" && s.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c.key} onPress={() => setFilter(c.key)} style={[s.filter, filter === c.key && { backgroundColor: c.color, borderColor: c.color }]}>
            <MaterialCommunityIcons name={c.icon} size={14} color={filter === c.key ? "#fff" : c.color} style={{ marginRight: 6 }} />
            <Text style={[s.filterText, filter === c.key && s.filterTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {list.map((e, i) => {
        const cat = CATEGORIES.find(c => c.key === e.cat);
        return (
          <View key={i} style={s.card}>
            <View style={s.cardHd}>
              <View style={[s.catChip, { backgroundColor: cat.color + "22" }]}>
                <MaterialCommunityIcons name={cat.icon} size={12} color={cat.color} />
                <Text style={[s.catText, { color: cat.color }]}>{cat.label.toUpperCase()}</Text>
              </View>
              <Text style={s.cadence}>{e.cadence}</Text>
            </View>
            <Text style={s.exName}>{e.name}</Text>
            <Text style={s.why}>{e.why}</Text>
            <View style={s.howBox}>
              <Text style={s.howLabel}>HOW</Text>
              <Text style={s.howText}>{e.how}</Text>
            </View>
          </View>
        );
      })}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>
          Training is its own discipline. If your dog has reactivity, fear, or aggression issues, a force-free certified trainer (CCPDT or KPA-CTP credentials) is the right call.{"\n\n"}
          FloofLife provides general care guidance and is not a substitute for professional veterinary care. Always consult your veterinarian for medical decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  intro:        { padding: 14, backgroundColor: theme.accentSoft, borderRadius: 12, marginBottom: 12 },
  introBody:    { fontSize: 13, color: theme.fg, lineHeight: 19 },
  filter:       { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card, marginRight: 8 },
  filterActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  filterText:   { color: theme.fg, fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  card:         { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, marginBottom: 10 },
  cardHd:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  catChip:      { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  catText:      { fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  cadence:      { fontSize: 11, color: theme.muted, fontWeight: "600" },
  exName:       { fontSize: 16, fontWeight: "700", color: theme.fg, marginTop: 4 },
  why:          { fontSize: 13, color: theme.muted, marginTop: 4, lineHeight: 19 },
  howBox:       { marginTop: 10, padding: 10, backgroundColor: theme.accentSoft, borderRadius: 8 },
  howLabel:     { fontSize: 10, fontWeight: "800", color: theme.accent, letterSpacing: 0.8, marginBottom: 3 },
  howText:      { fontSize: 12, color: theme.fg, lineHeight: 18 },
  disclaimer:   { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: theme.accentSoft },
  disclaimerText:{ fontSize: 11, color: theme.fg, lineHeight: 17 },
});

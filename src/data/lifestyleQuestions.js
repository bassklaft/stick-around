// Lifestyle / habits questionnaire surfaced during onboarding
// (between microchip and age/weight) and as a standalone edit
// flow from My Floofs. Single source of truth so the wizard
// render and the display card stay in sync.
//
// Each question is one screen: a section eyebrow + title + sub
// + tap-to-select options. type: "radio" = pick one;
// type: "multi" = pick any (with "none" exclusive).
//
// Tone: cute, no judgment, throughput-friendly. Free-text avoided
// to keep the skip-all path under 90s.

export const LIFESTYLE_QUESTIONS = [
  // ────────────── Activity & lifestyle ──────────────
  {
    key: "activityLevel",
    type: "radio",
    section: "ACTIVITY",
    title: "How wild is {pet}?",
    sub: "Pick whatever's closest — no judgment.",
    options: [
      { value: "couch",     label: "🛋️  Couch potato",   help: "Cozy, low-key" },
      { value: "moderate",  label: "🚶  Moderate",        help: "Daily walks, occasional zoomies" },
      { value: "active",    label: "🏃  Very active",     help: "Loves a real adventure" },
      { value: "athletic",  label: "🏆  Athletic",        help: "Runs, hikes, agility — all of it" },
    ],
  },
  {
    key: "walksPerDay",
    type: "radio",
    section: "ACTIVITY",
    title: "Walks per day?",
    sub: "Counting potty breaks is fair.",
    options: [
      { value: "0-1",       label: "0–1" },
      { value: "2",         label: "2" },
      { value: "3",         label: "3" },
      { value: "4+",        label: "4 or more" },
      { value: "off-leash", label: "🌳  Mostly off-leash / yard time" },
    ],
  },

  // ────────────── Personality ──────────────
  {
    key: "personality",
    type: "multi",
    section: "PERSONALITY",
    title: "Pick the words that fit {pet} 💕",
    sub: "Tap as many as feel right.",
    options: [
      { value: "friendly",    label: "Friendly" },
      { value: "cuddly",      label: "Cuddly" },
      { value: "independent", label: "Independent" },
      { value: "anxious",     label: "Anxious" },
      { value: "confident",   label: "Confident" },
      { value: "goofy",       label: "Goofy" },
      { value: "calm",        label: "Calm" },
      { value: "playful",     label: "Playful" },
      { value: "vocal",       label: "Vocal" },
      { value: "stubborn",    label: "Stubborn" },
      { value: "velcro",      label: "Velcro 🔌" },
    ],
  },
  {
    key: "fearTriggers",
    type: "multi",
    section: "PERSONALITY",
    title: "Anything that gets them rattled?",
    sub: "Knowing the triggers means you can plan around them.",
    options: [
      { value: "thunder",     label: "⛈️  Thunder" },
      { value: "fireworks",   label: "🎆  Fireworks" },
      { value: "strangers",   label: "👤  Strangers" },
      { value: "vacuum",      label: "🌀  Vacuum" },
      { value: "cars",        label: "🚗  Car rides" },
      { value: "other-dogs",  label: "🐕  Other dogs" },
      { value: "vet",         label: "🏥  Vet visits" },
      { value: "loud-noises", label: "🔊  Loud noises in general" },
      { value: "none",        label: "Nothing yet 💪" },
    ],
  },

  // ────────────── Food ──────────────
  {
    key: "dietType",
    type: "radio",
    section: "FOOD",
    title: "What's on {pet}'s menu?",
    sub: "Their main diet most days.",
    options: [
      { value: "kibble",       label: "🥣  Dry kibble" },
      { value: "wet",          label: "🥫  Wet food" },
      { value: "raw",          label: "🥩  Raw" },
      { value: "fresh",        label: "🍲  Fresh / home-cooked" },
      { value: "mix",          label: "🥗  Mix of types" },
      { value: "prescription", label: "💊  Prescription / vet diet" },
      { value: "other",        label: "Other" },
    ],
  },
  {
    key: "treatsPerDay",
    type: "radio",
    section: "FOOD",
    title: "Treat habits?",
    sub: "Be honest — we love a treat tycoon.",
    options: [
      { value: "none",     label: "None" },
      { value: "few",      label: "Just a couple" },
      { value: "moderate", label: "3–5 a day" },
      { value: "lots",     label: "👑  Treat tycoon" },
    ],
  },
  {
    key: "foodAllergies",
    type: "multi",
    section: "FOOD",
    title: "Any food sensitivities?",
    sub: "We use this when scanning recall lists.",
    options: [
      { value: "chicken", label: "Chicken" },
      { value: "beef",    label: "Beef" },
      { value: "dairy",   label: "Dairy" },
      { value: "grain",   label: "Grain / wheat" },
      { value: "eggs",    label: "Eggs" },
      { value: "fish",    label: "Fish" },
      { value: "lamb",    label: "Lamb" },
      { value: "other",   label: "Other" },
      { value: "none",    label: "None known ✨" },
    ],
  },

  // ────────────── Tummy / GI ──────────────
  {
    key: "bathroomRegularity",
    type: "radio",
    section: "TUMMY",
    title: "Bathroom routine?",
    sub: "Every floof is different — we just want a baseline.",
    options: [
      { value: "very",         label: "⏰  Like clockwork" },
      { value: "mostly",       label: "Mostly regular" },
      { value: "inconsistent", label: "A bit irregular" },
      { value: "working",      label: "💪  Working on it" },
    ],
  },
  {
    key: "giIssues",
    type: "multi",
    section: "TUMMY",
    title: "Any tummy stuff lately?",
    sub: "Tap anything that's been showing up.",
    options: [
      { value: "loose-stool",       label: "Loose stool" },
      { value: "constipation",      label: "Constipation" },
      { value: "vomiting",          label: "Vomiting" },
      { value: "acid-reflux",       label: "Acid reflux" },
      { value: "sensitive-stomach", label: "Sensitive stomach" },
      { value: "none",              label: "None ✨" },
    ],
    cta: "tummyTracker",
  },

  // ────────────── Vet ──────────────
  {
    key: "vetFrequency",
    type: "radio",
    section: "VET",
    title: "How often does {pet} see the vet?",
    sub: "Routine visits, not just emergencies.",
    options: [
      { value: "twice-yearly", label: "Twice a year" },
      { value: "annual",       label: "Annually" },
      { value: "as-needed",    label: "As needed" },
      { value: "emergencies",  label: "Just emergencies" },
      { value: "never",        label: "Haven't been yet" },
    ],
  },
  {
    key: "spayedNeutered",
    type: "radio",
    section: "VET",
    title: "Spayed or neutered?",
    sub: "Plain medical — no judgment either way.",
    options: [
      { value: "yes",          label: "Yes" },
      { value: "no",           label: "No" },
      { value: "not-yet",      label: "Not yet" },
      { value: "not-planning", label: "Not planning to" },
    ],
  },
  {
    key: "healthConditions",
    type: "multi",
    section: "HEALTH",
    title: "Any health conditions to keep in mind?",
    sub: "We surface relevant content where it matters.",
    options: [
      { value: "allergies",       label: "Allergies" },
      { value: "joint",           label: "Joint / hip" },
      { value: "heart",           label: "Heart" },
      { value: "kidney",          label: "Kidney" },
      { value: "diabetes",        label: "Diabetes" },
      { value: "cancer-history",  label: "Cancer history" },
      { value: "skin",            label: "Skin" },
      { value: "ears",            label: "Ears" },
      { value: "eyes",            label: "Eyes" },
      { value: "dental",          label: "Dental" },
      { value: "anxiety",         label: "Anxiety" },
      { value: "other",           label: "Other" },
      { value: "none",            label: "None known ✨" },
    ],
    cta: "healthTracker",
  },
];

export const LIFESTYLE_FIELDS = LIFESTYLE_QUESTIONS.map((q) => q.key);

// Display labels for the My Floofs lifestyle card. Lookups: by question
// key, then by value. Empty entries fall back to titleCase(value).
export const LIFESTYLE_DISPLAY = LIFESTYLE_QUESTIONS.reduce((acc, q) => {
  acc[q.key] = {
    section: q.section,
    title: q.title.replace(/\{pet\}/g, "they"),
    valueToLabel: q.options.reduce((m, o) => {
      // Strip leading emoji + spaces from the option label for display.
      m[o.value] = o.label.replace(/^[^\w\s]+\s+/u, "").trim();
      return m;
    }, {}),
    type: q.type,
  };
  return acc;
}, {});

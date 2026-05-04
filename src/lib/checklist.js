// Personalized weekly checklist generator. Inputs: pet profile + current
// date. Output: a list of items each with {id, title, why, cadence,
// category, sources?}. The generator pulls a generic baseline +
// breed-specific additions (one or more breeds — see petBreeds.js) +
// age-adjusted items + season-aware items.
//
// For mixed-breed pets each contributing breed adds its own checklist
// items. Items are deduplicated by id, and `sources` records which
// breeds contributed (so the UI can label "Common in Lab, Poodle" or
// "From Labrador" appropriately).

import { breedFacts } from "../data/breeds";
import { getPetBreeds, shortBreedName } from "./petBreeds";

const SEASONS = {
  spring: [3, 4, 5], summer: [6, 7, 8], fall: [9, 10, 11], winter: [12, 1, 2],
};
function currentSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  for (const [name, months] of Object.entries(SEASONS)) {
    if (months.includes(m)) return name;
  }
  return "spring";
}

const BASE_DOG = [
  { id: "fresh-water",     title: "Top off fresh water bowls",       why: "Hydration affects kidney + joint health long-term.", cadence: "daily",  category: "care" },
  { id: "walk-mobility",   title: "Watch for limping or stiffness on walks", why: "Early mobility changes flag joint issues.",   cadence: "weekly", category: "observe" },
  { id: "ear-check",       title: "Quick ear check (smell + redness)", why: "Yeast + bacterial infections are silent until they're not.", cadence: "weekly", category: "observe" },
  { id: "weight-check",    title: "Weigh your pet (bathroom scale, hold then subtract)", why: "Sudden weight loss/gain is the #1 early warning sign.", cadence: "weekly", category: "observe" },
  { id: "teeth-brush",     title: "Brush teeth (or dental chew)",     why: "80% of dogs have periodontal disease by age 3.", cadence: "3x/week", category: "care" },
];

const BASE_CAT = [
  { id: "fresh-water",     title: "Refresh water (cats prefer flowing/cold)", why: "Cats are chronically under-hydrated — kidney disease is the #1 senior killer.", cadence: "daily",  category: "care" },
  { id: "litter-check",    title: "Check litter for changes (volume, color, blood)", why: "Urinary changes signal kidney, diabetes, UTI early.", cadence: "daily",  category: "observe" },
  { id: "weight-check",    title: "Weigh your cat (hold + subtract)",  why: "Cats hide illness; a 0.5 lb drop is significant.", cadence: "weekly", category: "observe" },
  { id: "play-15",         title: "15 min interactive play (wand toy, not laser alone)", why: "Mental stimulation reduces stress + boredom obesity.", cadence: "daily",  category: "care" },
  { id: "groom-brush",     title: "Brush coat — check for mats + lumps", why: "Hands-on contact catches lumps weeks before they're visible.", cadence: "2x/week", category: "care" },
];

const SENIOR_ADDONS = [
  { id: "senior-mobility", title: "Watch how they get up from rest",   why: "Stiffness on rising is the earliest arthritis sign.", cadence: "weekly", category: "observe" },
  { id: "senior-cognition", title: "Note any night pacing or staring at walls", why: "Cognitive decline is treatable if caught early.", cadence: "weekly", category: "observe" },
];

const PUPPY_ADDONS = [
  { id: "socialize",       title: "Expose to a new sound/surface/person",   why: "Socialization window closes around 16 weeks.", cadence: "daily", category: "care" },
  { id: "potty-log",       title: "Track potty schedule",                   why: "Predictable schedules accelerate housetraining.", cadence: "daily", category: "care" },
];

const KITTEN_ADDONS = [
  { id: "kitten-handle",   title: "Handle paws + ears + mouth gently",      why: "Builds tolerance for grooming + vet visits later.", cadence: "daily", category: "care" },
];

const SEASON_ADDONS = {
  summer: [
    { id: "heat-paws", title: "Test pavement with your hand (5-second rule)", why: "Asphalt over 120°F burns paw pads in seconds.", cadence: "before walks", category: "safety" },
    { id: "tick-check", title: "Tick check after outdoor time",                 why: "Lyme + ehrlichia + anaplasmosis are all preventable.", cadence: "after walks", category: "safety" },
  ],
  winter: [
    { id: "paw-balm", title: "Paw balm before outdoor walks",                   why: "Salt + ice cracks pads. Balm = barrier.",                cadence: "before walks", category: "care" },
    { id: "antifreeze", title: "Wipe paws + belly after snowy walks",           why: "Antifreeze (ethylene glycol) is sweet-tasting + lethal.", cadence: "after walks", category: "safety" },
  ],
  spring: [
    { id: "allergens", title: "Watch for paw licking or face rubbing", why: "Pollen allergies show up as itching, not sneezing.", cadence: "weekly", category: "observe" },
  ],
  fall: [
    { id: "mushroom-check", title: "Check yard for mushrooms before letting pet out", why: "Several wild mushroom species are fatal to dogs.", cadence: "weekly", category: "safety" },
  ],
};

export function generateChecklist(pet, date = new Date()) {
  if (!pet) return [];
  const species = (pet.species || "dog").toLowerCase();
  const ageYears = pet.ageYears != null ? pet.ageYears : (pet.ageMonths != null ? pet.ageMonths / 12 : 3);
  const isSenior = (species === "dog" && ageYears >= 7) || (species === "cat" && ageYears >= 10);
  const isYoung  = (species === "dog" && ageYears < 1) || (species === "cat" && ageYears < 1);

  const base = species === "cat" ? BASE_CAT : BASE_DOG;
  const ageAddons = isSenior ? SENIOR_ADDONS : isYoung ? (species === "cat" ? KITTEN_ADDONS : PUPPY_ADDONS) : [];
  const seasonAddons = SEASON_ADDONS[currentSeason(date)] || [];

  // Breed-specific items — blended across every breed on the pet.
  // Items keyed by id; first breed to contribute wins on title/why,
  // and `sources` accumulates every breed that includes the same id.
  const breedItems = new Map();
  const petBreeds = getPetBreeds(pet);
  for (const breedKey of petBreeds) {
    const breed = breedFacts[breedKey];
    if (!breed?.checklist) continue;
    breed.checklist.forEach((c, i) => {
      const id = c.id || `breed-${breedKey}-${i}`;
      const existing = breedItems.get(id);
      if (existing) {
        existing.sources.push(breedKey);
      } else {
        breedItems.set(id, { ...c, id, sources: [breedKey] });
      }
    });
  }
  const breedAddons = Array.from(breedItems.values());

  return [...base, ...ageAddons, ...seasonAddons, ...breedAddons];
}

// UI helper: turn an item's sources[] into a short attribution string.
// Single-breed pets get null (no need to label). Mixed-breed pets get:
//   1 source                → "From Labrador"
//   ≥2 sources, all of pet  → "Common to all breeds"
//   ≥2 sources, subset      → "Common in Lab, Poodle"
export function checklistSourceLabel(item, pet) {
  const sources = item?.sources;
  if (!Array.isArray(sources) || sources.length === 0) return null;
  const petBreeds = getPetBreeds(pet);
  if (petBreeds.length <= 1) return null;
  if (sources.length >= petBreeds.length) return "Common to all breeds";
  if (sources.length === 1) return `From ${shortBreedName(sources[0])}`;
  return "Common in " + sources.map(shortBreedName).join(", ");
}

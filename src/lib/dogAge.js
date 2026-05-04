// Pet → human age conversion. The "1 dog year = 7 human years" rule is
// a folk estimate that doesn't survive contact with actual veterinary
// data: dogs mature explosively in year 1, slow down in year 2, and
// then age at a rate that depends strongly on body size and breed
// lifespan. This module computes a more honest estimate.
//
// Sources:
//   - AAHA / AVMA life-stage guidelines (puppy/young/adult/senior brackets)
//   - Wang et al. 2020 (Cell Systems) — log-based DNA-methylation curve
//     (UC San Diego epigenetic clock): humanAge = 16 * ln(dogAge) + 31
//   - Greer et al. 2007 — body-size effect on canine aging rate
//   - AAFP / AAHA Feline Life Stage Guidelines for cat conversion
//
// We expose two complementary models and average them when both apply:
//   1) AVMA-aligned piecewise model (size + breed lifespan adjusted)
//   2) Epigenetic log-based model (dog-only, broadly applicable)
// Cats use a simpler 15/9/4 piecewise (year 1 / year 2 / each year
// after) per AAFP guidance.

import { breedFacts } from "../data/breeds";
import { getPrimaryBreed, getPetBreeds } from "./petBreeds";

// Reference avg dog lifespan used to scale the aging rate per-breed.
const REFERENCE_LIFESPAN = 12;

// Pull a numeric (lo, hi, mid) from breed.lifespan strings like "10-12 years"
// or "12-15 years (standard); 14-18 (mini/toy)". Falls back to reference.
// For mixed-breed pets, blends the lifespan ranges of every selected
// breed (mid-of-mids).
export function parseLifespan(breedKeyOrPet) {
  // Support both a raw breed key (legacy) and a full pet object (new).
  if (breedKeyOrPet && typeof breedKeyOrPet === "object") {
    const keys = getPetBreeds(breedKeyOrPet);
    if (keys.length === 0) return { lo: REFERENCE_LIFESPAN - 1, hi: REFERENCE_LIFESPAN + 1, mid: REFERENCE_LIFESPAN };
    const ranges = keys.map((k) => parseLifespan(k));
    const lo = Math.min(...ranges.map((r) => r.lo));
    const hi = Math.max(...ranges.map((r) => r.hi));
    return { lo, hi, mid: (lo + hi) / 2 };
  }
  const breed = breedFacts[(breedKeyOrPet || "").toLowerCase()];
  const raw = breed?.lifespan || "";
  const m = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return { lo: REFERENCE_LIFESPAN - 1, hi: REFERENCE_LIFESPAN + 1, mid: REFERENCE_LIFESPAN };
  const lo = parseInt(m[1], 10);
  const hi = parseInt(m[2], 10);
  return { lo, hi, mid: (lo + hi) / 2 };
}

// Size class drives most of the aging rate. We bracket by weight when
// we have it; otherwise fall back to the breed midpoint lifespan
// (small breeds live longer → infer smaller). Brackets follow the AVMA
// "small / medium / large / giant" thresholds used in life-stage
// guidelines, with a finer "toy" split for very small pets.
export function sizeClass(pet) {
  const w = pet?.weightLbs;
  if (typeof w === "number" && isFinite(w) && w > 0) {
    if (w < 10) return "toy";
    if (w < 20) return "small";    // AVMA small ≤ 20 lb
    if (w < 50) return "medium";   // AVMA medium 20–50
    if (w < 90) return "large";    // AVMA large 50–90
    return "giant";                // AVMA giant > 90
  }
  const primary = typeof pet === "string" ? pet : getPrimaryBreed(pet);
  const ls = parseLifespan(primary).mid;
  if (ls >= 14) return "small";
  if (ls >= 12) return "medium";
  if (ls >= 10) return "large";
  return "giant";
}

// Pretty label for the size class so the UI doesn't need to know the
// keys.
export const SIZE_LABELS = {
  toy:    "Toy (<10 lb)",
  small:  "Small (10–20 lb)",
  medium: "Medium (20–50 lb)",
  large:  "Large (50–90 lb)",
  giant:  "Giant (>90 lb)",
};

// Human-years per dog-year added once the dog is past age 2. Larger dogs
// burn through years faster — Greer et al. 2007 found roughly +1 human
// year per +5 kg of body mass through middle-age.
const SIZE_RATE = { toy: 4.0, small: 4.5, medium: 5.0, large: 6.0, giant: 7.0 };

// Cat conversion (AAFP/AAHA Feline Life Stage Guidelines). Year 1 → 15
// human years; year 2 → +9; each year after → +4. Independent of size.
function catHumanYears(catAge) {
  if (catAge == null || !isFinite(catAge) || catAge < 0) return 0;
  if (catAge <= 1) return Math.round(15 * catAge);
  if (catAge <= 2) return Math.round(15 + 9 * (catAge - 1));
  return Math.round(24 + (catAge - 2) * 4);
}

// Wang et al. 2020 epigenetic-clock formula for dogs. Maps dog age
// (years, > 0) to human age via methylation curve.
//   humanAge = 16 * ln(dogAge) + 31
// Excellent for general communication; doesn't account for body size.
// Unreliable below ~0.5 years.
export function epigeneticHumanAge(dogAge) {
  if (dogAge == null || !isFinite(dogAge) || dogAge <= 0) return 0;
  if (dogAge < 0.5) return Math.round(15 * dogAge); // graceful low-end fallback
  return Math.round(16 * Math.log(dogAge) + 31);
}

// Lifestyle adjustments — each is a multiplier on the aging rate for
// years 2+. Scientifically these are loose proxies, but they're aligned
// with vet-school consensus that fitness, leanness, and routine care
// extend healthspan.
const LIFESTYLE_BASELINE = {
  weightStatus: "healthy",  // "underweight" | "healthy" | "overweight" | "obese"
  diet:         "standard", // "fresh" | "mixed" | "standard" | "freefeed"
  exercise:     "regular",  // "none" | "light" | "regular" | "athletic"
  vetCheckups:  "annual",   // "annual" | "lapsed"
};

const LIFESTYLE_DELTA = {
  weightStatus: { underweight: 0.02, healthy: 0,    overweight: 0.10, obese: 0.20 },
  diet:         { fresh: -0.05,      mixed: -0.02,  standard: 0,      freefeed: 0.05 },
  exercise:     { none: 0.10,        light: 0.03,   regular: 0,       athletic: -0.05 },
  vetCheckups:  { annual: 0,         lapsed: 0.05 },
};

export function lifestyleMultiplier(lifestyle) {
  const merged = { ...LIFESTYLE_BASELINE, ...(lifestyle || {}) };
  let m = 1;
  for (const key of Object.keys(LIFESTYLE_DELTA)) {
    const delta = LIFESTYLE_DELTA[key][merged[key]] ?? 0;
    m += delta;
  }
  return Math.max(0.7, Math.min(1.5, m));
}

// Core conversion. Returns the human-equivalent age for a given pet
// age. Dispatches to the cat curve for cats; otherwise uses the
// AVMA-aligned size-adjusted piecewise model for dogs.
export function humanYearsAt(petAge, pet) {
  if (petAge == null || !isFinite(petAge) || petAge < 0) return 0;
  const species = (pet?.species || "dog").toLowerCase();
  if (species === "cat") return catHumanYears(petAge);

  const size = sizeClass(pet);
  const lifespan = parseLifespan(pet).mid;
  const rate = SIZE_RATE[size] * (REFERENCE_LIFESPAN / lifespan);
  const mult = lifestyleMultiplier(pet?.lifestyle);

  if (petAge <= 1) return Math.round(15 * petAge);
  if (petAge <= 2) return Math.round(15 + 9 * (petAge - 1));
  return Math.round(24 + (petAge - 2) * rate * mult);
}

// Compute the human-age range we display: a low/high bracket plus a
// "headline" mid value. For dogs, we average our AVMA piecewise with
// the epigenetic estimate (when both apply) and quote a ±2 year band
// to convey honest uncertainty. For cats, we just band the piecewise
// by ±1.
export function humanAgeRange(pet) {
  const dogAge = pet?.ageYears ?? null;
  const species = (pet?.species || "dog").toLowerCase();
  if (dogAge == null) return { low: null, mid: null, high: null, method: "incomplete" };

  if (species === "cat") {
    const mid = catHumanYears(dogAge);
    return { low: Math.max(0, mid - 1), mid, high: mid + 1, method: "feline-aafp" };
  }

  const piecewise = humanYearsAt(dogAge, pet);
  const epigenetic = dogAge >= 1 ? epigeneticHumanAge(dogAge) : null;
  // Average the two when both are reliable; otherwise use the piecewise.
  const blended = epigenetic != null
    ? Math.round((piecewise + epigenetic) / 2)
    : piecewise;
  // ±2 years is roughly the spread between the two methods on a typical
  // adult dog; widening it as the dog ages further into uncertainty.
  const band = Math.max(2, Math.round(dogAge / 4));
  return {
    low: Math.max(0, blended - band),
    mid: blended,
    high: blended + band,
    method: epigenetic != null ? "blended" : "avma-piecewise",
    piecewise,
    epigenetic,
  };
}

// Structured "factors considered" list. Drives the disclosure UI on
// the Age Calculator screen so the user sees real, named inputs (not
// theatre). Returns [{ key, label, value, source }].
export function ageFactorsConsidered(pet) {
  const dogAge = pet?.ageYears ?? null;
  const species = (pet?.species || "dog").toLowerCase();
  const breeds = getPetBreeds(pet);
  const factors = [];

  if (dogAge != null) {
    factors.push({ key: "age", label: "Age", value: `${dogAge} year${dogAge === 1 ? "" : "s"}` });
  }
  if (species === "cat") {
    factors.push({ key: "species", label: "Species", value: "Cat (AAFP feline curve)" });
  } else {
    factors.push({ key: "species", label: "Species", value: "Dog (AVMA size-adjusted formula)" });
    const size = sizeClass(pet);
    factors.push({ key: "size", label: "Size class", value: SIZE_LABELS[size] || size });
    if (typeof pet?.weightLbs === "number" && pet.weightLbs > 0) {
      factors.push({ key: "weight", label: "Weight", value: `${pet.weightLbs} lb (refines size class)` });
    }
    if (breeds.length > 0) {
      const ls = parseLifespan(pet);
      factors.push({
        key: "lifespan",
        label: "Breed lifespan",
        value: `${ls.lo}–${ls.hi} yr typical${breeds.length > 1 ? " (blended across breeds)" : ""}`,
      });
    }
    if (dogAge != null && dogAge >= 1) {
      factors.push({
        key: "epigenetic",
        label: "Epigenetic curve",
        value: "Wang et al. 2020 (UC San Diego methylation clock)",
      });
    }
    const ls = pet?.lifestyle || {};
    const lifestyleNotes = [];
    if (ls.weightStatus && ls.weightStatus !== "healthy") lifestyleNotes.push(`weight: ${ls.weightStatus}`);
    if (ls.diet && ls.diet !== "standard") lifestyleNotes.push(`diet: ${ls.diet}`);
    if (ls.exercise && ls.exercise !== "regular") lifestyleNotes.push(`exercise: ${ls.exercise}`);
    if (ls.vetCheckups && ls.vetCheckups !== "annual") lifestyleNotes.push(`vet checkups: ${ls.vetCheckups}`);
    if (lifestyleNotes.length) {
      factors.push({ key: "lifestyle", label: "Lifestyle adjustments", value: lifestyleNotes.join(" · ") });
    }
  }
  return factors;
}

// Friendly life-stage label given a dog's age and breed lifespan.
export function lifeStage(dogAge, pet) {
  if (dogAge == null || dogAge < 0) return "Unknown";
  const lifespan = parseLifespan(pet).mid;
  if (dogAge < 1) return "Puppy";
  if (dogAge < lifespan * 0.20) return "Young";
  if (dogAge < lifespan * 0.55) return "Adult";
  if (dogAge < lifespan * 0.80) return "Mature Adult";
  if (dogAge < lifespan * 1.00) return "Senior";
  return "Geriatric";
}

// Build a stair-step timeline of meaningful life-stage waypoints for
// this pet. Each entry is { dogAge, humanAge, stage, isCurrent }.
export function lifeStageTimeline(pet) {
  const lifespan = parseLifespan(pet).mid;
  const ageNow = pet?.ageYears ?? null;

  // Waypoints scale with breed lifespan so a Great Dane "senior" mark
  // doesn't land at 11 years like it would for a Yorkie.
  const waypoints = [
    { dogAge: 0.17, label: "2 months", stage: "Puppy" },
    { dogAge: 1,    label: "1 year",   stage: "Young" },
    { dogAge: Math.max(2, Math.round(lifespan * 0.25)), stage: "Young Adult" },
    { dogAge: Math.max(4, Math.round(lifespan * 0.45)), stage: "Adult" },
    { dogAge: Math.max(7, Math.round(lifespan * 0.65)), stage: "Mature Adult" },
    { dogAge: Math.max(9, Math.round(lifespan * 0.85)), stage: "Senior" },
    { dogAge: Math.max(12, Math.round(lifespan * 1.00)), stage: "Geriatric" },
  ];

  const points = waypoints.map(w => ({
    dogAge: w.dogAge,
    label: w.label || (w.dogAge >= 1 ? `${w.dogAge} years` : `${Math.round(w.dogAge * 12)} months`),
    stage: w.stage,
    humanAge: humanYearsAt(w.dogAge, pet),
  }));

  if (ageNow != null) {
    // Mark the closest waypoint at or before the dog's current age.
    let bestIdx = 0;
    for (let i = 0; i < points.length; i++) {
      if (points[i].dogAge <= ageNow) bestIdx = i;
    }
    points[bestIdx].isCurrent = true;
  }
  return points;
}

// Headline summary used by DogAgeScreen.
export function ageSummary(pet) {
  const dogAge = pet?.ageYears ?? null;
  const range = humanAgeRange(pet);
  if (dogAge == null) {
    return {
      dogAge: null,
      humanAge: null,
      humanAgeRange: range,
      stage: "Unknown",
      lifespan: parseLifespan(pet),
      size: sizeClass(pet),
      factors: ageFactorsConsidered(pet),
    };
  }
  return {
    dogAge,
    humanAge: range.mid,
    humanAgeRange: range,
    stage: lifeStage(dogAge, pet),
    lifespan: parseLifespan(pet),
    size: sizeClass(pet),
    factors: ageFactorsConsidered(pet),
  };
}

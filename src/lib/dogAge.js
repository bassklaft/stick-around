// Dog → human age conversion. The "1 dog year = 7 human years" rule is
// a folk estimate that doesn't survive contact with actual veterinary
// data: dogs mature explosively in year 1, slow down in year 2, and
// then age at a rate that depends strongly on body size and breed
// lifespan. This module computes a more honest estimate.
//
// Sources:
//   - AAHA / AVMA life-stage guidelines (puppy/young/adult/senior brackets)
//   - Wang et al. 2020 (Cell Systems) — log-based DNA-methylation curve
//   - Greer et al. 2007 — body-size effect on canine aging rate
//
// We use a piecewise linear model rather than the pure log curve because
// it's easier to reason about and matches the breakpoints owners care
// about (weaning, sexual maturity, prime adult, senior).

import { breedFacts } from "../data/breeds";

// Reference avg dog lifespan used to scale the aging rate per-breed.
const REFERENCE_LIFESPAN = 12;

// Pull a numeric (lo, hi, mid) from breed.lifespan strings like "10-12 years"
// or "12-15 years (standard); 14-18 (mini/toy)". Falls back to reference.
export function parseLifespan(breedKey) {
  const breed = breedFacts[(breedKey || "").toLowerCase()];
  const raw = breed?.lifespan || "";
  const m = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return { lo: REFERENCE_LIFESPAN - 1, hi: REFERENCE_LIFESPAN + 1, mid: REFERENCE_LIFESPAN };
  const lo = parseInt(m[1], 10);
  const hi = parseInt(m[2], 10);
  return { lo, hi, mid: (lo + hi) / 2 };
}

// Size class drives most of the aging rate. We bracket by weight when
// we have it; otherwise fall back to the breed midpoint lifespan
// (small breeds live longer → infer smaller).
export function sizeClass(pet) {
  const w = pet?.weightLbs;
  if (typeof w === "number" && isFinite(w) && w > 0) {
    if (w < 10) return "toy";
    if (w < 25) return "small";
    if (w < 60) return "medium";
    if (w < 100) return "large";
    return "giant";
  }
  const ls = parseLifespan(pet?.breed).mid;
  if (ls >= 14) return "small";
  if (ls >= 12) return "medium";
  if (ls >= 10) return "large";
  return "giant";
}

// Human-years per dog-year added once the dog is past age 2. Larger dogs
// burn through years faster.
const SIZE_RATE = { toy: 4.0, small: 4.5, medium: 5.0, large: 6.0, giant: 7.0 };

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

// Core conversion. Returns the human-equivalent age for a given dog age.
export function humanYearsAt(dogAge, pet) {
  if (dogAge == null || !isFinite(dogAge) || dogAge < 0) return 0;
  const size = sizeClass(pet);
  const lifespan = parseLifespan(pet?.breed).mid;
  const rate = SIZE_RATE[size] * (REFERENCE_LIFESPAN / lifespan);
  const mult = lifestyleMultiplier(pet?.lifestyle);

  if (dogAge <= 1) return Math.round(15 * dogAge);
  if (dogAge <= 2) return Math.round(15 + 9 * (dogAge - 1));
  return Math.round(24 + (dogAge - 2) * rate * mult);
}

// Friendly life-stage label given a dog's age and breed lifespan.
export function lifeStage(dogAge, pet) {
  if (dogAge == null || dogAge < 0) return "Unknown";
  const lifespan = parseLifespan(pet?.breed).mid;
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
  const lifespan = parseLifespan(pet?.breed).mid;
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
  if (dogAge == null) {
    return {
      dogAge: null,
      humanAge: null,
      stage: "Unknown",
      lifespan: parseLifespan(pet?.breed),
      size: sizeClass(pet),
    };
  }
  return {
    dogAge,
    humanAge: humanYearsAt(dogAge, pet),
    stage: lifeStage(dogAge, pet),
    lifespan: parseLifespan(pet?.breed),
    size: sizeClass(pet),
  };
}

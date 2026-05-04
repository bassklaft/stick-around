// Mixed-breed support helpers. v1.2 introduces `breeds: string[]` on the
// pet record (max 3 entries, lowercase keys, first is primary). Pre-v1.2
// pets only have `breed: string` — these helpers normalize both shapes
// so call sites don't have to care.
//
// We keep `breed` mirrored to `breeds[0]` indefinitely. Older code paths
// (and any third-party hooks) can keep reading it; v1.2+ code should
// prefer `getPetBreeds()` and `getPrimaryBreed()`.
import { breedFacts, breedDisplayName } from "../data/breeds";

export const MAX_BREEDS = 3;

// Returns the canonical lowercase breed-key list for a pet. Always an
// array; empty if the pet has nothing set.
export function getPetBreeds(pet) {
  if (!pet) return [];
  if (Array.isArray(pet.breeds) && pet.breeds.length > 0) {
    return pet.breeds.filter(Boolean).map((b) => b.toLowerCase()).slice(0, MAX_BREEDS);
  }
  if (pet.breed) return [pet.breed.toLowerCase()];
  return [];
}

// First breed = "primary" (used for hero photo, age math, etc.). Falls
// back to the legacy single-breed string. Returns "" if the pet has no
// breed at all.
export function getPrimaryBreed(pet) {
  return getPetBreeds(pet)[0] || "";
}

// Normalizes a pet record so both shapes are present. Idempotent —
// safe to run on already-migrated pets.
export function normalizePetBreeds(pet) {
  if (!pet) return pet;
  const breeds = getPetBreeds(pet);
  if (breeds.length === 0) return { ...pet };
  return { ...pet, breeds, breed: breeds[0] };
}

// Has the user opted into mixed-breed framing? (>1 breed selected)
export function isMixedBreed(pet) {
  return getPetBreeds(pet).length > 1;
}

// Display label for a multi-breed pet. Examples:
//   ["labrador retriever"]                   → "Labrador Retriever"
//   ["labrador retriever", "poodle"]         → "Labrador Retriever + Poodle mix"
//   ["lab", "poodle", "husky"]               → "Labrador + Poodle + Husky mix"
// Single-breed pets get the unmodified breed name (no "mix" suffix).
export function mixedBreedLabel(pet) {
  const keys = getPetBreeds(pet);
  if (keys.length === 0) return "";
  const names = keys.map((k) => shortBreedName(k));
  if (names.length === 1) return names[0];
  return names.join(" + ") + " mix";
}

// Uses a "shortName" if the breed entry defines one, otherwise the
// title-cased breed key. Falls back through breedDisplayName's
// pluralizer if needed (with an "s" stripped — we want the singular
// form for chip labels).
export function shortBreedName(key) {
  if (!key) return "";
  const lower = key.toLowerCase();
  const b = breedFacts[lower];
  if (b?.shortName) return b.shortName;
  // Use displayName but strip the trailing "s" since that helper
  // pluralizes for "About X" headers.
  const display = breedDisplayName(lower);
  if (display === "your pet") return titleCase(lower);
  return display.endsWith("s") && !display.endsWith("ss") ? display.slice(0, -1) : display;
}

function titleCase(s) {
  return s.split(" ").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

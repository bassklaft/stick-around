// v1.2 photo-schema migration helpers. Pure functions — no
// AsyncStorage / no React Native runtime — so the migration logic
// can be unit-tested with plain Node.
//
// Schema:
//   v1.1.x: pet.photoUri (string | null)
//   v1.2+:  pet.photos (string[])  + pet.photoUri kept as a backward-
//           compat mirror of pet.photos[0] so any existing read site
//           that uses pet.photoUri continues to work.
//
// pet.schemaVersion = 2 is set on every migrated record. The migration
// short-circuits when a record already has schemaVersion === 2 AND a
// well-formed photos[] array; otherwise it re-runs (idempotent).

export const PHOTO_SCHEMA_VERSION = 2;

// Maximum photos per pet (UI enforces this; storage layer accepts any).
export const MAX_PHOTOS_PER_PET = 10;

// Per-build-20 guardrail D: try/catch fallback. If migration ever
// throws on a corrupted record, return the record unchanged rather
// than risk losing user data.
export function normalizePetPhotos(pet) {
  if (!pet || typeof pet !== "object") return pet;
  if (pet.schemaVersion === PHOTO_SCHEMA_VERSION && Array.isArray(pet.photos)) {
    // Already migrated. Keep photoUri in sync with photos[0] in case
    // external code mutated photos directly without updating photoUri.
    const expected = pet.photos[0] || null;
    if (pet.photoUri === expected) return pet;
    return { ...pet, photoUri: expected };
  }
  try {
    const incomingPhotos = Array.isArray(pet.photos)
      ? pet.photos.filter((u) => typeof u === "string" && u.length > 0)
      : null;
    const fromUri = pet.photoUri && typeof pet.photoUri === "string" ? [pet.photoUri] : [];
    const photos = incomingPhotos && incomingPhotos.length > 0 ? incomingPhotos : fromUri;
    return {
      ...pet,
      photos,
      photoUri: photos[0] || null,
      schemaVersion: PHOTO_SCHEMA_VERSION,
    };
  } catch {
    // Defensive fallback — keep the record exactly as-is. The next
    // read attempt will retry the migration.
    return pet;
  }
}

// Apply normalizePetPhotos to a list of pets. Returns { pets, changed }.
// `changed` is true if any record was actually mutated, so callers can
// decide whether to persist back to storage.
export function migratePetPhotosArray(arr) {
  if (!Array.isArray(arr)) return { pets: [], changed: false };
  let changed = false;
  const out = arr.map((p) => {
    const next = normalizePetPhotos(p);
    if (next !== p && JSON.stringify(next) !== JSON.stringify(p)) changed = true;
    return next;
  });
  return { pets: out, changed };
}

// Pick a photo for a given display "slot" — different slots get
// different photos so the same pet doesn't show the same image in
// adjacent UI placements. Deterministic given (petId, slot, dayKey)
// so the photo stays stable across renders within a session/day.
//
// slot identifiers used across the app:
//   "hero"    — Home banner (rotates daily)
//   "card"    — My Floofs pet card (rotates per session)
//   "chip"    — nav-bar chip avatar (rotates daily)
//   "collage" — Home collage tile (rotates daily, indexed by tile)
//   "primary" — fan-out overlay circle (always photos[0])
//
// Returns the chosen URI or null if no photos exist. Falls back
// gracefully when photos[] is empty.
export function pickPhotoForSlot(pet, slot, opts = {}) {
  if (!pet) return null;
  const photos = Array.isArray(pet.photos)
    ? pet.photos.filter(Boolean)
    : (pet.photoUri ? [pet.photoUri] : []);
  if (photos.length === 0) return null;
  if (photos.length === 1) return photos[0];
  if (slot === "primary") return photos[0];

  // Deterministic index from (petId + slot + day-or-session bucket).
  // Day bucket = days since 1970-01-01 (matches Pawgress day keying).
  const now = opts.now || new Date();
  const dayBucket = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const sessionBucket = opts.sessionBucket || 0;
  // For card slot, prefer per-session rotation; everything else daily.
  const bucket = slot === "card" ? sessionBucket : dayBucket;
  const seed = `${pet.id || ""}|${slot}|${bucket}|${opts.tileIndex || 0}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % photos.length;
  return photos[idx];
}

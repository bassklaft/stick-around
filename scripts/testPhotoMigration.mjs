// Unit test for the v1.2 photo-schema migration. Pure-function tests
// against `normalizePetPhotos` from src/lib/petPhotos.js — no
// AsyncStorage, no React Native runtime needed. Run with
// `node scripts/testPhotoMigration.mjs`.
//
// Per build 20 work order item 7 + guardrail D: verify migration is
// safe (try/catch fallback), idempotent (running twice doesn't break),
// and never loses user data.

import {
  normalizePetPhotos,
  migratePetPhotosArray,
  pickPhotoForSlot,
} from "../src/lib/petPhotos.js";

let failures = 0;

// Deep, key-order-independent equality. Two records that differ only in
// JS insertion order should still pass — that's a serialization detail,
// not a semantic difference.
function deepEq(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEq(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!deepEq(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

function assertEq(label, actual, expected) {
  if (deepEq(actual, expected)) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failures += 1;
  }
}

// Test 1: v1.1.x pet with photoUri migrates to photos[]
{
  const before = { id: "p1", name: "Falafel", photoUri: "file:///path/to/falafel.jpg" };
  const after = normalizePetPhotos(before);
  assertEq("1. v1.1.x photoUri → photos[photoUri]", after, {
    id: "p1",
    name: "Falafel",
    photoUri: "file:///path/to/falafel.jpg",
    photos: ["file:///path/to/falafel.jpg"],
    schemaVersion: 2,
  });
}

// Test 2: pet with no photo migrates to empty photos[]
{
  const before = { id: "p2", name: "Bella" };
  const after = normalizePetPhotos(before);
  assertEq("2. no photo → photos: []", after, {
    id: "p2",
    name: "Bella",
    photoUri: null,
    photos: [],
    schemaVersion: 2,
  });
}

// Test 3: pet with photoUri:null explicitly
{
  const before = { id: "p3", name: "Luna", photoUri: null };
  const after = normalizePetPhotos(before);
  assertEq("3. photoUri:null → photos: []", after, {
    id: "p3",
    name: "Luna",
    photoUri: null,
    photos: [],
    schemaVersion: 2,
  });
}

// Test 4: idempotent — running twice doesn't break
{
  const before = { id: "p4", name: "Max", photoUri: "file:///max.jpg" };
  const once = normalizePetPhotos(before);
  const twice = normalizePetPhotos(once);
  assertEq("4. idempotent (twice == once)", twice, once);
}

// Test 5: already-migrated pet (schemaVersion=2, photos array) is no-op
{
  const before = {
    id: "p5",
    name: "Charlie",
    photos: ["file:///charlie1.jpg", "file:///charlie2.jpg"],
    photoUri: "file:///charlie1.jpg",
    schemaVersion: 2,
  };
  const after = normalizePetPhotos(before);
  // Should be identical reference for short-circuit
  assertEq("5. already-migrated → no-op", after, before);
  if (after === before) {
    console.log("   (also: same reference — short-circuit confirmed)");
  }
}

// Test 6: photos array exists but no schemaVersion → mark as v2
{
  const before = {
    id: "p6",
    name: "Daisy",
    photos: ["file:///daisy.jpg"],
    photoUri: "file:///daisy.jpg",
  };
  const after = normalizePetPhotos(before);
  assertEq("6. photos[] without schemaVersion → adds schemaVersion=2", after, {
    id: "p6",
    name: "Daisy",
    photos: ["file:///daisy.jpg"],
    photoUri: "file:///daisy.jpg",
    schemaVersion: 2,
  });
}

// Test 7: photoUri out of sync with photos[0] → photos wins, photoUri mirrored
{
  const before = {
    id: "p7",
    name: "Rocky",
    photos: ["file:///correct.jpg"],
    photoUri: "file:///stale.jpg",  // out of sync from external mutation
  };
  const after = normalizePetPhotos(before);
  assertEq("7. out-of-sync photoUri → mirrored from photos[0]", after, {
    id: "p7",
    name: "Rocky",
    photos: ["file:///correct.jpg"],
    photoUri: "file:///correct.jpg",
    schemaVersion: 2,
  });
}

// Test 8: schemaVersion=2 but photos missing or non-array → re-migrate
{
  const before = { id: "p8", name: "Stella", photoUri: "file:///stella.jpg", schemaVersion: 2 };
  const after = normalizePetPhotos(before);
  assertEq("8. schemaVersion=2 + photos missing → re-migrate", after, {
    id: "p8",
    name: "Stella",
    photos: ["file:///stella.jpg"],
    photoUri: "file:///stella.jpg",
    schemaVersion: 2,
  });
}

// Test 9: null pet → returns null (defensive)
{
  const after = normalizePetPhotos(null);
  assertEq("9. null pet → returns null", after, null);
}

// Test 10: pet with multiple photos in array preserved
{
  const before = {
    id: "p10",
    name: "Buddy",
    photos: [
      "file:///buddy1.jpg",
      "file:///buddy2.jpg",
      "file:///buddy3.jpg",
    ],
  };
  const after = normalizePetPhotos(before);
  assertEq("10. multi-photo array preserved + photoUri mirrored", after, {
    id: "p10",
    name: "Buddy",
    photos: [
      "file:///buddy1.jpg",
      "file:///buddy2.jpg",
      "file:///buddy3.jpg",
    ],
    photoUri: "file:///buddy1.jpg",
    schemaVersion: 2,
  });
}

// Test 11: pet with empty photos[] but photoUri set → photoUri wins (forward
// migration of inconsistent state)
{
  const before = {
    id: "p11",
    name: "Coco",
    photos: [],
    photoUri: "file:///coco.jpg",
  };
  const after = normalizePetPhotos(before);
  assertEq("11. empty photos[] with photoUri → photoUri promoted", after, {
    id: "p11",
    name: "Coco",
    photos: ["file:///coco.jpg"],
    photoUri: "file:///coco.jpg",
    schemaVersion: 2,
  });
}

// Test 12: v1.1.x pet with breeds + photoUri preserves all other fields
{
  const before = {
    id: "p12",
    name: "Falafel",
    species: "dog",
    breed: "chow chow",
    breeds: ["chow chow"],
    ageYears: 8,
    weightLbs: 78,
    photoUri: "file:///falafel.jpg",
    createdAt: 1715000000000,
    healthRecords: [{ id: "hr1", type: "rabies" }],
  };
  const after = normalizePetPhotos(before);
  assertEq("12. v1.1.x full pet record migrates without losing fields", after, {
    ...before,
    photos: ["file:///falafel.jpg"],
    schemaVersion: 2,
  });
}

// Test 13: migratePetPhotosArray returns changed=true when records mutate
{
  const arr = [
    { id: "a", name: "A", photoUri: "file:///a.jpg" },
    { id: "b", name: "B" },
  ];
  const { pets, changed } = migratePetPhotosArray(arr);
  assertEq("13. migratePetPhotosArray.changed when v1.1.x records present", changed, true);
  assertEq("    .pets[0].schemaVersion=2", pets[0].schemaVersion, 2);
  assertEq("    .pets[1].photos=[]", pets[1].photos, []);
}

// Test 14: migratePetPhotosArray returns changed=false on already-migrated input
{
  const arr = [
    { id: "a", name: "A", photos: ["file:///a.jpg"], photoUri: "file:///a.jpg", schemaVersion: 2 },
    { id: "b", name: "B", photos: [], photoUri: null, schemaVersion: 2 },
  ];
  const { pets, changed } = migratePetPhotosArray(arr);
  assertEq("14. migratePetPhotosArray.changed=false when all already v2", changed, false);
  assertEq("    pets unchanged", pets, arr);
}

// Test 15: migratePetPhotosArray on non-array → empty
{
  const { pets, changed } = migratePetPhotosArray(null);
  assertEq("15. migratePetPhotosArray(null) → empty result", { pets, changed }, { pets: [], changed: false });
}

// Test 16: pickPhotoForSlot returns null when no photos
{
  const pet = { id: "x", photos: [] };
  assertEq("16. pickPhotoForSlot empty → null", pickPhotoForSlot(pet, "hero"), null);
}

// Test 17: pickPhotoForSlot returns sole photo for any slot
{
  const pet = { id: "x", photos: ["file:///solo.jpg"] };
  assertEq("17a. single-photo hero", pickPhotoForSlot(pet, "hero"), "file:///solo.jpg");
  assertEq("17b. single-photo card", pickPhotoForSlot(pet, "card"), "file:///solo.jpg");
  assertEq("17c. single-photo primary", pickPhotoForSlot(pet, "primary"), "file:///solo.jpg");
}

// Test 18: pickPhotoForSlot primary → photos[0] always
{
  const pet = { id: "x", photos: ["a", "b", "c"] };
  assertEq("18. primary slot always photos[0]", pickPhotoForSlot(pet, "primary"), "a");
}

// Test 19: pickPhotoForSlot deterministic (same inputs → same output)
{
  const pet = { id: "rotate", photos: ["a", "b", "c", "d"] };
  const fixed = new Date("2026-05-08T12:00:00Z");
  const v1 = pickPhotoForSlot(pet, "hero", { now: fixed });
  const v2 = pickPhotoForSlot(pet, "hero", { now: fixed });
  assertEq("19. deterministic for same (pet, slot, day)", v1, v2);
}

// Test 20: pickPhotoForSlot legacy fallback (only photoUri, no photos[])
{
  const pet = { id: "legacy", photoUri: "file:///legacy.jpg" };
  assertEq("20. legacy photoUri-only → returns photoUri", pickPhotoForSlot(pet, "hero"), "file:///legacy.jpg");
}

console.log("");
if (failures === 0) {
  console.log("✅ All photo-migration tests passed.");
  process.exit(0);
} else {
  console.error(`❌ ${failures} test(s) failed.`);
  process.exit(1);
}

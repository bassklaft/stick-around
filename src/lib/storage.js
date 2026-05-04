import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizePetBreeds } from "./petBreeds";

// Multi-pet storage with auto-migration from the legacy single-pet key.
// All UI flows read through `Pets`. The legacy `Pet` object is kept so
// existing screens continue to work — it returns the active (or first)
// pet from the list.
//
// v1.2 adds an inline migration: pets that only have `breed: string`
// get a mirrored `breeds: [breed]` populated on read. We persist the
// migrated shape on first write so it sticks.

const KEY_LIST   = "pawrent_pets_v2";
const KEY_LEGACY = "pawrent_pet";

function newId() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Apply the v1.2 breeds-array migration to a list of pets. Pure — does
// not write to AsyncStorage; callers decide when to persist.
function migrateBreeds(arr) {
  let changed = false;
  const out = arr.map((p) => {
    const next = normalizePetBreeds(p);
    if (next !== p && JSON.stringify(next) !== JSON.stringify(p)) changed = true;
    return next;
  });
  return { pets: out, changed };
}

export const Pets = {
  async list() {
    // Prefer the v2 array
    const s = await AsyncStorage.getItem(KEY_LIST);
    if (s) {
      try {
        const raw = JSON.parse(s);
        const { pets, changed } = migrateBreeds(raw);
        if (changed) await AsyncStorage.setItem(KEY_LIST, JSON.stringify(pets));
        return pets;
      } catch { /* fall through */ }
    }
    // Migrate from legacy single-pet store
    const legacy = await AsyncStorage.getItem(KEY_LEGACY);
    if (legacy) {
      try {
        const pet = JSON.parse(legacy);
        const arr = [normalizePetBreeds({ ...pet, id: pet.id || newId() })];
        await AsyncStorage.setItem(KEY_LIST, JSON.stringify(arr));
        return arr;
      } catch { /* */ }
    }
    return [];
  },
  async setAll(arr) {
    await AsyncStorage.setItem(KEY_LIST, JSON.stringify(arr));
    // Mirror first pet to legacy key so older code paths keep working.
    if (arr[0]) await AsyncStorage.setItem(KEY_LEGACY, JSON.stringify(arr[0]));
    else        await AsyncStorage.removeItem(KEY_LEGACY);
  },
  async add(pet) {
    const arr = await this.list();
    const withId = normalizePetBreeds({ ...pet, id: pet.id || newId(), createdAt: pet.createdAt || Date.now() });
    arr.push(withId);
    await this.setAll(arr);
    return withId;
  },
  async update(id, updates) {
    const arr = await this.list();
    const idx = arr.findIndex(p => p.id === id);
    if (idx >= 0) {
      arr[idx] = normalizePetBreeds({ ...arr[idx], ...updates });
      await this.setAll(arr);
      return arr[idx];
    }
    return null;
  },
  async remove(id) {
    const arr = (await this.list()).filter(p => p.id !== id);
    await this.setAll(arr);
  },

  // ─────────────── Health records (v1.2) ─────────────────────────
  // Each pet carries `healthRecords: [{ id, type, dateGiven, durationMonths,
  // nextDue, notes?, attachmentUri?, attachmentFilename?, customLabel? }]`.
  // Stored inline on the pet object to keep the storage layout flat;
  // attachments themselves live on the filesystem (caller manages those).
  async listHealthRecords(petId) {
    const arr = await this.list();
    const pet = arr.find((p) => p.id === petId);
    return Array.isArray(pet?.healthRecords) ? pet.healthRecords : [];
  },
  async addHealthRecord(petId, record) {
    const arr = await this.list();
    const idx = arr.findIndex((p) => p.id === petId);
    if (idx < 0) return null;
    const existing = Array.isArray(arr[idx].healthRecords) ? arr[idx].healthRecords : [];
    const withId = {
      ...record,
      id: record.id || ("hr" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      createdAt: record.createdAt || Date.now(),
    };
    arr[idx] = { ...arr[idx], healthRecords: [...existing, withId] };
    await this.setAll(arr);
    return withId;
  },
  async updateHealthRecord(petId, recordId, patch) {
    const arr = await this.list();
    const idx = arr.findIndex((p) => p.id === petId);
    if (idx < 0) return null;
    const records = Array.isArray(arr[idx].healthRecords) ? arr[idx].healthRecords : [];
    const ridx = records.findIndex((r) => r.id === recordId);
    if (ridx < 0) return null;
    const updated = { ...records[ridx], ...patch };
    const next = records.slice();
    next[ridx] = updated;
    arr[idx] = { ...arr[idx], healthRecords: next };
    await this.setAll(arr);
    return updated;
  },
  async removeHealthRecord(petId, recordId) {
    const arr = await this.list();
    const idx = arr.findIndex((p) => p.id === petId);
    if (idx < 0) return false;
    const records = Array.isArray(arr[idx].healthRecords) ? arr[idx].healthRecords : [];
    arr[idx] = { ...arr[idx], healthRecords: records.filter((r) => r.id !== recordId) };
    await this.setAll(arr);
    return true;
  },
  // Has the user dismissed the first-run health-tracker disclaimer for
  // this pet? Stored as a flag on the pet object.
  async hasAckedHealthDisclaimer(petId) {
    const arr = await this.list();
    return !!arr.find((p) => p.id === petId)?.healthDisclaimerAcked;
  },
  async ackHealthDisclaimer(petId) {
    return this.update(petId, { healthDisclaimerAcked: true });
  },
  // Sort oldest pet first (highest age, then earliest createdAt as tiebreaker).
  // Pets without an age fall to the bottom.
  async listSortedOldestFirst() {
    const arr = await this.list();
    return arr.slice().sort((a, b) => {
      const ageA = a.ageYears ?? -1, ageB = b.ageYears ?? -1;
      if (ageA !== ageB) return ageB - ageA;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  },
};

// Backward-compat shim: existing screens that used Pet.get/set treat
// the first pet as "the" pet.
export const Pet = {
  async get() {
    const arr = await Pets.list();
    return arr[0] || null;
  },
  async set(p) {
    const arr = await Pets.list();
    if (arr.length === 0) {
      await Pets.add(p);
    } else {
      const id = arr[0].id;
      await Pets.update(id, p);
    }
  },
  async clear() {
    await AsyncStorage.removeItem(KEY_LIST);
    await AsyncStorage.removeItem(KEY_LEGACY);
    await AsyncStorage.removeItem("pawrent_checklist_state");
    await AsyncStorage.removeItem("pawrent_observations");
  },
};

export const ChecklistState = {
  async get() {
    const s = await AsyncStorage.getItem("pawrent_checklist_state");
    return s ? JSON.parse(s) : {};
  },
  async setItem(key, status) {
    const cur = await this.get();
    cur[key] = { status, ts: Date.now() };
    await AsyncStorage.setItem("pawrent_checklist_state", JSON.stringify(cur));
    return cur;
  },
};

export const Observations = {
  async list() {
    const s = await AsyncStorage.getItem("pawrent_observations");
    return s ? JSON.parse(s) : [];
  },
  async add(entry) {
    const cur = await this.list();
    cur.unshift({ ...entry, id: Date.now().toString(), ts: Date.now() });
    await AsyncStorage.setItem("pawrent_observations", JSON.stringify(cur));
    return cur;
  },
};

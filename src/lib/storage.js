import AsyncStorage from "@react-native-async-storage/async-storage";

// Multi-pet storage with auto-migration from the legacy single-pet key.
// All UI flows read through `Pets`. The legacy `Pet` object is kept so
// existing screens continue to work — it returns the active (or first)
// pet from the list.

const KEY_LIST   = "pawrent_pets_v2";
const KEY_LEGACY = "pawrent_pet";

function newId() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export const Pets = {
  async list() {
    // Prefer the v2 array
    const s = await AsyncStorage.getItem(KEY_LIST);
    if (s) {
      try { return JSON.parse(s); } catch { /* fall through */ }
    }
    // Migrate from legacy single-pet store
    const legacy = await AsyncStorage.getItem(KEY_LEGACY);
    if (legacy) {
      try {
        const pet = JSON.parse(legacy);
        const arr = [{ ...pet, id: pet.id || newId() }];
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
    const withId = { ...pet, id: pet.id || newId(), createdAt: pet.createdAt || Date.now() };
    arr.push(withId);
    await this.setAll(arr);
    return withId;
  },
  async update(id, updates) {
    const arr = await this.list();
    const idx = arr.findIndex(p => p.id === id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...updates };
      await this.setAll(arr);
      return arr[idx];
    }
    return null;
  },
  async remove(id) {
    const arr = (await this.list()).filter(p => p.id !== id);
    await this.setAll(arr);
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

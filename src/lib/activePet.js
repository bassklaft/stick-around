// useActivePet — reactive read of the current active pet id.
//
// Why not just pass `pet` props? Build-32 surfaced a class of
// bug where a modal mounts with one pet, the user swipes the
// home card stack to a different pet, and the modal's prop-based
// pet reference goes stale. Photo uploads kept writing to the
// previous pet's profile.
//
// This module gives components two paths:
//   - `useActivePet()` — reactive hook for display (re-renders
//     when active pet changes).
//   - `readActivePetId()` — async one-shot for use INSIDE event
//     handlers right before a write. Always returns the
//     authoritative id from AsyncStorage at the moment of read,
//     so a write that fires AFTER a swipe cannot land on the
//     wrong pet even if the hook hasn't yet re-rendered.
//
// Pets.setActive notifies a small set of in-process listeners so
// the hook re-fires immediately on swipe (no waiting for a focus
// event). The notification is fire-and-forget — nothing crashes
// if the listener Set is empty or a listener throws.

import { useEffect, useState } from "react";
import { Pets } from "./storage";

const listeners = new Set();

// Internal — fires after Pets.setActive resolves. Storage.js calls
// this so every consumer of useActivePet re-syncs immediately.
export function notifyActivePetChanged() {
  for (const fn of listeners) {
    try { fn(); } catch { /* swallow — never break a notification */ }
  }
}

// React hook — returns { petId, refresh }. petId updates when the
// active pet changes (via setActive) or when the component mounts.
export function useActivePet() {
  const [petId, setPetId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const id = await Pets.getActiveId();
        if (mounted) setPetId(id);
      } catch { /* swallow */ }
    }
    refresh();
    listeners.add(refresh);
    return () => {
      mounted = false;
      listeners.delete(refresh);
    };
  }, []);

  return { petId };
}

// Async one-shot for use inside event handlers (e.g., a photo
// upload's onPress). Returns the authoritative active pet id at
// the moment of read — bypasses any stale state in the calling
// component.
export async function readActivePetId() {
  try {
    return await Pets.getActiveId();
  } catch {
    return null;
  }
}

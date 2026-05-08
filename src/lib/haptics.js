// Haptic feedback wrapper. Six calibrated channels tied to the
// importance of the action — heavier feedback for transactional or
// destructive actions, lighter feedback for routine UI taps. Honors
// a user setting (Settings → Notifications → Haptic feedback) with
// three levels:
//
//   "on"     — full haptics across all channels (default)
//   "subtle" — light + success only; medium / heavy / warning /
//              error all collapse to light
//   "off"    — no haptics at all
//
// All calls are silent no-ops on platforms / devices where haptics
// aren't supported. iOS users can also disable haptics globally in
// Settings → Sounds & Haptics; Expo Haptics respects that.
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "pawrent_haptics_pref";
let cached = null; // "on" | "subtle" | "off"

export async function getHapticsPref() {
  if (cached) return cached;
  const v = await AsyncStorage.getItem(KEY);
  cached = (v === "subtle" || v === "off") ? v : "on";
  return cached;
}

export async function setHapticsPref(pref) {
  cached = pref;
  await AsyncStorage.setItem(KEY, pref);
}

function fire(fn) {
  // Read pref synchronously from cache. The cache is warmed on app
  // start by the Settings screen mount; until then we default to
  // "on" so first-launch feedback works.
  const pref = cached || "on";
  if (pref === "off") return;
  try { fn(pref); } catch { /* swallow — never crash for haptics */ }
}

// Light tap — UI navigation, card taps, settings rows, generic taps.
export function tapLight() {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

// Medium tap — checklist completion, photo upload, pet added,
// active pet switch, premium purchase initiation.
export function tapMedium() {
  fire((pref) => Haptics.impactAsync(
    pref === "subtle" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
  ));
}

// Heavy tap — premium purchase confirm, restore, reset, pet deletion.
export function tapHeavy() {
  fire((pref) => Haptics.impactAsync(
    pref === "subtle" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy
  ));
}

// Success — trial started, subscription confirmed, restore success.
export function notifySuccess() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Warning — paywall blocked an action, soft validation error.
export function notifyWarning() {
  fire((pref) => {
    if (pref === "subtle") return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  });
}

// Error — purchase failed, network error, unrecoverable failure.
export function notifyError() {
  fire((pref) => {
    if (pref === "subtle") return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  });
}

// Initialize the cache on app start. Call from the root once.
export async function initHaptics() {
  await getHapticsPref();
}

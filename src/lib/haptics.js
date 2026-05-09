// Haptic feedback wrapper. Six calibrated channels tied to the
// importance of the action — heavier feedback for transactional or
// destructive actions, lighter feedback for routine UI taps.
//
// Per build 24 smoke-test feedback the user-facing haptics toggle
// was removed: haptics are always on. The legacy pref helpers
// (getHapticsPref / setHapticsPref) remain as no-ops so any old
// import sites keep building, but `fire()` no longer reads them.
//
// All calls are silent no-ops on platforms / devices where haptics
// aren't supported. iOS users can still disable haptics globally
// from iOS Settings → Sounds & Haptics; Expo Haptics respects
// that, so we don't need an in-app override.
import * as Haptics from "expo-haptics";

// Back-compat shims — preserved so any not-yet-deleted import sites
// don't break the build. Always reports "on"; setting is a no-op.
export async function getHapticsPref() { return "on"; }
export async function setHapticsPref(_pref) { /* no-op */ }

function fire(fn) {
  try {
    const ret = fn();
    // expo-haptics returns a Promise; catch its rejection so a
    // native-side throw (e.g. iOS 26+ feedback-generator fault on
    // TurboModule queue) doesn't bubble up as an unhandled rejection
    // and abort the app.
    if (ret && typeof ret.catch === "function") ret.catch(() => {});
  } catch { /* swallow — never crash for haptics */ }
}

// Light tap — UI navigation, card taps, settings rows, generic taps.
export function tapLight() {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

// Medium tap — checklist completion, photo upload, pet added,
// active pet switch, premium purchase initiation.
export function tapMedium() {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

// Heavy tap — premium purchase confirm, restore, reset, pet deletion.
export function tapHeavy() {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

// Success — trial started, subscription confirmed, restore success.
export function notifySuccess() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Warning — paywall blocked an action, soft validation error.
export function notifyWarning() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

// Error — purchase failed, network error, unrecoverable failure.
export function notifyError() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

// Initialize the haptics module on app start. Now a no-op since
// there's no pref to warm; kept for App.js back-compat.
export async function initHaptics() { /* no-op */ }

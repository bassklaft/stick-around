// Haptic feedback wrapper. Six calibrated channels tied to the
// importance of the action — heavier feedback for transactional or
// destructive actions, lighter feedback for routine UI taps.
//
// Per build 24 smoke-test feedback the user-facing haptics toggle
// was removed: haptics are always on. The legacy pref helpers
// (getHapticsPref / setHapticsPref) remain as no-ops so any old
// import sites keep building, but the internals no longer read them.
//
// Build-41: haptics re-enabled on iOS 26.3.x. Build 36's gate
// disabled them all because we suspected expo-haptics was the
// TurboModule throwing on iOS 26.3.x. Build 40 disproved that
// hypothesis: the actual crash was the lifestyle questionnaire's
// <Pressable> + <MaterialCommunityIcons> + accessibilityState
// combo, not haptics. Build 40 cured the crash by stripping that
// screen down to bare gesture-responder Views with no MCI / no
// Pressable / no accessibilityState — and that fix worked WHILE
// haptics were still disabled. The haptics gate was a red herring
// from the start; the only reason it appeared to "help" was that
// disabling haptics also stopped the user from interacting fast
// enough to hit the lifestyle screen until later builds.
//
// The defer + double-catch + circuit-breaker remain for defense
// in depth — they cost nothing and protect against an actual
// future haptics-only failure.
//
// All calls are silent no-ops on platforms / devices where haptics
// aren't supported. iOS users can still disable haptics globally
// from iOS Settings → Sounds & Haptics; Expo Haptics respects
// that, so we don't need an in-app override.
import * as Haptics from "expo-haptics";

let consecutiveFailures = 0;
const MAX_FAILURES = 3;

// Back-compat shims — preserved so any not-yet-deleted import sites
// don't break the build. Always reports "on"; setting is a no-op.
export async function getHapticsPref() { return "on"; }
export async function setHapticsPref(_pref) { /* no-op */ }

// Defer + catch + circuit-break. The setTimeout(fn, 0) is the
// critical bit: it moves the native expo-haptics call off the
// current touch event's dispatch lane so any Obj-C exception
// thrown inside the TurboModule invocation block (iOS 26.3.1
// regression) lands on a fresh runloop tick with no serial
// drain to abort. The double catch (sync try + Promise.catch)
// is for the rare case where expo-haptics throws synchronously.
function safeFire(nativeCall) {
  if (consecutiveFailures >= MAX_FAILURES) return;
  setTimeout(() => {
    try {
      const result = nativeCall();
      if (result && typeof result.then === "function") {
        result
          .then(() => { consecutiveFailures = 0; })
          .catch(() => { consecutiveFailures++; });
      } else {
        consecutiveFailures = 0;
      }
    } catch {
      consecutiveFailures++;
    }
  }, 0);
}

// Light tap — UI navigation, card taps, settings rows, generic taps.
export function tapLight() {
  safeFire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

// Medium tap — checklist completion, photo upload, pet added,
// active pet switch, premium purchase initiation.
export function tapMedium() {
  safeFire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

// Heavy tap — premium purchase confirm, restore, reset, pet deletion.
export function tapHeavy() {
  safeFire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

// Success — trial started, subscription confirmed, restore success.
export function notifySuccess() {
  safeFire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Warning — paywall blocked an action, soft validation error.
export function notifyWarning() {
  safeFire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

// Error — purchase failed, network error, unrecoverable failure.
export function notifyError() {
  safeFire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

// Initialize the haptics module on app start. Resets the
// consecutive-failure circuit breaker so a fresh launch always
// starts willing to fire haptics again.
export async function initHaptics() {
  consecutiveFailures = 0;
}

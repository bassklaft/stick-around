// Haptic feedback wrapper. Six calibrated channels tied to the
// importance of the action — heavier feedback for transactional or
// destructive actions, lighter feedback for routine UI taps.
//
// Per build 24 smoke-test feedback the user-facing haptics toggle
// was removed: haptics are always on. The legacy pref helpers
// (getHapticsPref / setHapticsPref) remain as no-ops so any old
// import sites keep building, but the internals no longer read them.
//
// Build-36 fix for iOS 26.3.x TurboModule queue crash: hard-disable
// every native expo-haptics call on iOS 26.3.x. Build 35's defer +
// double-catch + circuit-breaker wrapper did NOT prevent the crash
// — confirmed by a fresh crash report on build 35 with the SAME
// signature: `objc_exception_rethrow` on
// `com.meta.react.turbomodulemanager.queue` → SIGABRT.
//
// Why JS-level wrapping can't fix this:
//   The Obj-C exception thrown inside UIFeedbackGenerator's
//   TurboModule invocation block unwinds the stack past the JS
//   bridge boundary. It hits `_objc_terminate` → `abort()`
//   BEFORE any Promise.catch / try/catch / circuit-breaker
//   counter can fire. The defer-by-1-tick changed when JS
//   scheduled the call but not where the native call ended up
//   (still TurboModule queue) or how the dispatch lane handled
//   the throw (still serial-drain abort). The wrapper looked
//   defensive but architecturally couldn't intercept the crash.
//
// Pragmatic fix until upstream lands a patch (Expo SDK 54 →
// 56 upgrade, or react-native-haptic-feedback as drop-in):
// detect iOS 26.3.x via Platform.Version and bail before any
// native call. Users on iOS ≤ 26.2.x and ≥ 26.4.x keep full
// haptics. iOS 26.3.x users get a silent app — slightly
// degraded UX, no crash.
//
// The defer + double-catch + circuit-breaker remain for
// defense in depth on other OS versions where a similar
// (but catchable) failure mode might arise.
//
// All calls are silent no-ops on platforms / devices where haptics
// aren't supported. iOS users can still disable haptics globally
// from iOS Settings → Sounds & Haptics; Expo Haptics respects
// that, so we don't need an in-app override.
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Hard-disable haptics on iOS 26.3.x. Platform.Version on iOS
// is a string like "26.3.1". `startsWith("26.3")` covers
// 26.3.0, 26.3.1, 26.3.2, etc. — the entire affected family.
// Re-evaluate this gate when iOS 26.4 ships (might fix the
// regression upstream) or when we upgrade Expo SDK.
const IS_IOS_26_3 =
  Platform.OS === "ios" &&
  typeof Platform.Version === "string" &&
  Platform.Version.startsWith("26.3");

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
  if (IS_IOS_26_3) return;
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

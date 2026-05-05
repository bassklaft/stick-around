// Founder / team device override for Premium entitlement.
//
// Hard-coded list of iOS Identifier-For-Vendor (IDFV) strings that get
// `isPremium = true` regardless of RevenueCat state. This is how Max
// (and any future team member or trusted tester) gets Premium on a
// personal device without having to subscribe through TestFlight or
// the App Store.
//
// IDFV is the only safe device identifier to ship in production:
//   - Stable across launches and updates
//   - Reset only on full delete-and-reinstall (or factory reset)
//   - Scoped to the app's vendor (NOT a global device fingerprint)
//   - Not subject to App Tracking Transparency permission prompt
//
// To find your IDFV:
//   1. Install a build that includes the Settings → Debug → "My Device
//      ID" row (added alongside this module)
//   2. Tap to copy
//   3. Add the string to FOUNDER_DEVICE_IDS below
//   4. Bump the build, ship via TestFlight, install on the device.
//      The override fires on next launch.
//
// Adding a teammate later: append their IDFV to the array, ship a
// build. No backend, no flags, no auth.
//
// SECURITY NOTE: An IDFV in this list bypasses the paywall. Don't
// commit a teammate's IDFV without their permission, and don't paste
// random IDFVs you don't recognize. Anyone with access to a build's
// JS bundle can read the constant; this is a friction-removal hack
// for the founder, not a real auth boundary. Don't extend this to
// "give Premium to anyone who emails support" — that's what
// RevenueCat promotional entitlements are for.

import * as Application from "expo-application";

export const FOUNDER_DEVICE_IDS = [
  // IDFV strings, one per line, with a trailing comment explaining
  // who the device belongs to. To add a teammate later: append their
  // IDFV here, ship a build, install on their device. The override
  // fires on next launch.
  "981F7B5B-46DF-4B89-AF5D-49B812EB939D", // Max — personal iPhone (founder)
];

// Cache the device ID across calls so we don't hit the native bridge
// on every render.
let cachedDeviceId = null;
let cachedPromise = null;

export async function getDeviceId() {
  if (cachedDeviceId !== null) return cachedDeviceId;
  if (cachedPromise) return cachedPromise;
  cachedPromise = (async () => {
    try {
      const id = await Application.getIosIdForVendorAsync();
      cachedDeviceId = id || "";
      return cachedDeviceId;
    } catch (e) {
      cachedDeviceId = "";
      return "";
    } finally {
      cachedPromise = null;
    }
  })();
  return cachedPromise;
}

export async function isFounderDevice() {
  const id = await getDeviceId();
  return id && FOUNDER_DEVICE_IDS.includes(id);
}

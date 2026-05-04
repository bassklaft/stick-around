// Central read of build-time env. EXPO_PUBLIC_* is inlined by Metro at
// bundle time, so empty strings here mean the key wasn't set in .env or
// in the EAS build profile — Purchases.configure will throw and we'd
// rather see that early in dev than crash for users.
import { Platform } from "react-native";

export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
export const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

export function revenueCatKey() {
  return Platform.select({
    ios: REVENUECAT_IOS_KEY,
    android: REVENUECAT_ANDROID_KEY,
    default: "",
  });
}

export const PREMIUM_ENTITLEMENT_ID = "premium";
export const DEFAULT_OFFERING_ID = "default";

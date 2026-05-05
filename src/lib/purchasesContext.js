// Single source of truth for RevenueCat state. Mounts once at the root,
// configures the SDK with the platform key, then exposes:
//   - customerInfo  : the live CustomerInfo object (entitlements, expirations)
//   - offerings     : the "default" offering's available packages (annual + monthly)
//   - isPremium     : convenience boolean derived from the "premium" entitlement
//   - ready         : true once the initial fetch completes (so screens can show
//                     a spinner instead of an empty paywall)
//   - refresh()     : force-fetch CustomerInfo (used after a manual restore)
//
// We don't surface the raw Purchases SDK from the context — screens get a
// stable shape, and we can swap the implementation (StoreKit-only fallback,
// mocks for testing) without touching every call site.
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import { revenueCatKey, PREMIUM_ENTITLEMENT_ID, DEFAULT_OFFERING_ID } from "./config";
import { getDeviceId, isFounderDevice } from "./founderOverride";

const PurchasesContext = createContext({
  customerInfo: null,
  offerings: null,
  isPremium: false,
  isFounderDevice: false,
  ready: false,
  refresh: async () => {},
});

let configured = false;

function entitled(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
}

export function PurchasesProvider({ children }) {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [ready, setReady] = useState(false);
  const [founderOverride, setFounderOverride] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      // Network blip or no key — leave previous state alone, log for triage.
      console.warn("[purchases] getCustomerInfo failed:", err?.message ?? err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (configured) {
        if (!cancelled) setReady(true);
        return;
      }

      // Resolve founder-override status as early as possible so the
      // UI can flip to Premium immediately for whitelisted devices.
      const isFounder = await isFounderDevice();
      if (!cancelled) setFounderOverride(isFounder);

      const key = revenueCatKey();
      if (!key) {
        // No API key in this build — silent skip; founder override
        // (if any) still works, RC features just won't.
        if (!cancelled) setReady(true);
        return;
      }

      try {
        Purchases.configure({ apiKey: key });
        configured = true;
      } catch (configErr) {
        // Configure failed — silent. Premium falls back to founder
        // override only.
        if (!cancelled) setReady(true);
        return;
      }

      // Flip ready=true the moment the SDK is configured. CustomerInfo +
      // offerings fetches that follow can settle in their own time.
      if (!cancelled) setReady(true);

      try {
        const info = await Purchases.getCustomerInfo();
        if (cancelled) return;
        setCustomerInfo(info);
      } catch (err) {
        // Network blip or RC outage — leave previous state, surface
        // through normal UI paths if needed.
      }
      try {
        const offers = await Purchases.getOfferings();
        if (cancelled) return;
        const allOfferings = offers?.all ?? {};
        const offering =
          allOfferings[DEFAULT_OFFERING_ID] ??
          offers?.current ??
          Object.values(allOfferings).find((o) => (o?.availablePackages?.length ?? 0) > 0) ??
          null;
        setOfferings(offering);
      } catch (err) {
        // RC offering fetch failed — silent. PremiumScreen surfaces
        // user-facing errors when the user actually taps the button.
      }
    }

    init();

    const sub = Purchases.addCustomerInfoUpdateListener((info) => {
      if (!cancelled) setCustomerInfo(info);
    });

    return () => {
      cancelled = true;
      // RN SDK returns either an EventSubscription (newer) or undefined.
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, []);

  const value = {
    customerInfo,
    offerings,
    // Premium is granted via either the RevenueCat entitlement OR a
    // matching IDFV in FOUNDER_DEVICE_IDS. The override is intentional
    // and ships in production so the founder + trusted teammates have
    // Premium without an active subscription.
    isPremium: founderOverride || entitled(customerInfo),
    isFounderDevice: founderOverride,
    ready,
    refresh,
  };

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  return useContext(PurchasesContext);
}

// Lightweight helper for screens that just want to gate features.
export function usePremium() {
  return useContext(PurchasesContext).isPremium;
}

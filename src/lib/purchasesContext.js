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

const PurchasesContext = createContext({
  customerInfo: null,
  offerings: null,
  isPremium: false,
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
      const key = revenueCatKey();
      if (!key) {
        console.warn("[purchases] no API key for this platform — skipping configure");
        if (!cancelled) setReady(true);
        return;
      }
      if (!configured) {
        Purchases.configure({ apiKey: key });
        configured = true;
      }
      // Flip ready=true the moment the SDK is configured. The
      // CustomerInfo + offerings fetches that follow can settle in their
      // own time; gating UI on them caused the v1.1 build-6 bug where
      // the trial button stayed disabled even though offerings had
      // loaded (timing race when the StrictMode double-effect ran).
      if (!cancelled) setReady(true);

      try {
        const [info, offers] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        if (cancelled) return;
        setCustomerInfo(info);
        const offering = offers?.all?.[DEFAULT_OFFERING_ID] ?? offers?.current ?? null;
        setOfferings(offering);
        console.warn("[purchases] init OK · offering=" + (offering?.identifier ?? "none") +
          " · packages=" + (offering?.availablePackages?.length ?? 0) +
          " · entitled=" + entitled(info));
      } catch (err) {
        console.warn("[purchases] init fetch failed:", err?.message ?? err);
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
    isPremium: entitled(customerInfo),
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

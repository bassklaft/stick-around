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
import { Platform, Alert } from "react-native";
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
      // Diagnostic: prove SDK init runs in production. Each step alerts
      // on-screen because Console.app filtering has been unreliable.
      // First-call protection (`configured` module-level flag) prevents
      // duplicate alerts when the provider re-mounts.
      if (configured) {
        // Already initialized in a prior provider mount this session —
        // don't re-run the diagnostics or re-call configure.
        if (!cancelled) setReady(true);
        return;
      }

      const key = revenueCatKey();
      const keyPreview = key ? key.slice(0, 14) + "…" : "(empty)";
      Alert.alert("RC INIT START", "Platform: " + Platform.OS + "\nKey prefix: " + keyPreview);

      if (!key) {
        Alert.alert("RC INIT FAILED", "No EXPO_PUBLIC_REVENUECAT_IOS_KEY in this build. Configure cannot run.");
        if (!cancelled) setReady(true);
        return;
      }

      try {
        Purchases.configure({ apiKey: key });
        configured = true;
      } catch (configErr) {
        Alert.alert("RC INIT FAILED", "Purchases.configure threw: " +
          (configErr?.message ?? String(configErr)) +
          (configErr?.code ? "\ncode=" + configErr.code : ""));
        if (!cancelled) setReady(true);
        return;
      }

      // configure() is synchronous in react-native-purchases — if we got
      // here it returned successfully. Pull the user ID right away so we
      // can confirm the SDK created (or matched) a customer record.
      let appUserId = "(unknown)";
      try {
        appUserId = await Purchases.getAppUserID();
      } catch (idErr) {
        Alert.alert("RC GET USER ID FAILED", idErr?.message ?? String(idErr));
      }
      Alert.alert("RC INIT OK", "appUserId: " + appUserId +
        "\nThis ID should appear in app.revenuecat.com → Customers within ~30 sec.");

      // Flip ready=true the moment the SDK is configured. CustomerInfo +
      // offerings fetches that follow can settle in their own time.
      if (!cancelled) setReady(true);

      try {
        const info = await Purchases.getCustomerInfo();
        if (cancelled) return;
        setCustomerInfo(info);
        const activeKeys = Object.keys(info?.entitlements?.active ?? {});
        const allKeys = Object.keys(info?.entitlements?.all ?? {});
        Alert.alert("RC GET INFO OK",
          "appUserId: " + (info?.originalAppUserId ?? appUserId) +
          "\nentitlements active: [" + activeKeys.join(", ") + "]" +
          "\nentitlements all: [" + allKeys.join(", ") + "]" +
          "\nfirstSeen: " + (info?.firstSeen ?? "?") +
          "\nlatestExpiration: " + (info?.latestExpirationDate ?? "(none)")
        );
      } catch (err) {
        Alert.alert("RC GET INFO FAILED",
          "code: " + (err?.code ?? "?") +
          "\nmessage: " + (err?.message ?? String(err)) +
          "\nunderlying: " + (err?.underlyingErrorMessage ?? "(none)")
        );
      }

      // Offerings fetch — kept silent here since it's already covered
      // by the existing PremiumScreen diagnostics + may legitimately
      // be empty if the dashboard isn't configured.
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
        // Already loud enough via PremiumScreen — silent here.
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

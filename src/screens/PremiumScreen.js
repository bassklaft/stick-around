// Premium upsell — reads RevenueCat offerings via PurchasesContext and
// drives real StoreKit purchases. Annual is selected by default since
// it's where the trial lives; the monthly card is now a real toggle
// (the v0 "monthly button non-clickable" bug is fixed here).
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Purchases from "react-native-purchases";
import { usePurchases } from "../lib/purchasesContext";
import { PREMIUM_ENTITLEMENT_ID } from "../lib/config";
import { theme } from "../theme";

const FREE = [
  "1 pet profile",
  "Generic weekly checklist",
  "Toxic foods + plants reference",
  "Recalls feed",
  "Vets Near Me search",
  "Your photo on the home screen",
];

const PREMIUM = [
  "Full breed-personalized + age + season checklist (10-15 items)",
  "Full insider-tips library for your breed",
  "Diet & care library (supplements, joint chews, grooming, treats)",
  "Trip planning + training guides",
  "Multi-pet (households with more than one)",
  "Observation log + export-to-text for vet visits",
  "iOS Home Screen + Lock Screen widgets",
  "Future: cloud sync across devices",
];

function priceMetaFor(pkg, fallback) {
  // RevenueCat returns a localized priceString; show what the user will
  // actually be charged in their currency, not the USD we hardcoded.
  return pkg?.product?.priceString ?? fallback;
}

// RevenueCat's PurchasesOffering exposes `.annual` and `.monthly`
// convenience getters, but they ONLY return a package if its
// identifier matches the canonical "$rc_annual" / "$rc_monthly"
// names. If the dashboard set up custom identifiers (e.g.
// "annual_premium" or whatever the App Store product ID is), the
// convenience getters return null — which is what made the v1.1
// build-7 trial button look enabled (fallback prices) but tap to
// nothing (selectedPkg was null and disabled gated the press).
//
// Fall back to scanning availablePackages by packageType, then by
// identifier substring, so we work no matter how the user named
// things in the RevenueCat dashboard.
function resolvePkg(offering, type) {
  if (!offering) return null;
  const direct = type === "annual" ? offering.annual : offering.monthly;
  if (direct) return direct;
  const pkgs = offering.availablePackages || [];
  if (pkgs.length === 0) return null;
  const wanted = type === "annual" ? "ANNUAL" : "MONTHLY";
  const wordRe = type === "annual" ? /annual|yearly|year/i : /monthly|month/i;
  const periodRe = type === "annual" ? /^p1?y$/i : /^p1?m$/i;
  // First pass — exact package-type / word match in identifiers.
  const named = pkgs.find((p) =>
    p.packageType === wanted ||
    wordRe.test(p.identifier || "") ||
    wordRe.test(p.product?.identifier || "")
  );
  if (named) return named;
  // Second pass — match by ISO 8601 subscription period if RevenueCat
  // exposes it on the product (P1Y / P1M).
  const byPeriod = pkgs.find((p) => periodRe.test(p.product?.subscriptionPeriod || ""));
  if (byPeriod) return byPeriod;
  // Third pass — if there are exactly two packages, assume the first
  // (often longer-term in RevenueCat's standard config) is annual and
  // the second is monthly.
  if (pkgs.length === 2) return type === "annual" ? pkgs[0] : pkgs[1];
  // Last resort for the user's specific dashboard config — single
  // package becomes the offer regardless of which type was requested.
  if (pkgs.length === 1) return pkgs[0];
  return null;
}

export default function PremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { offerings, isPremium, ready, refresh, customerInfo } = usePurchases();
  const [selected, setSelected] = useState("annual");
  const [working, setWorking] = useState(false);

  const annual = resolvePkg(offerings, "annual");
  const monthly = resolvePkg(offerings, "monthly");
  const selectedPkg = selected === "annual" ? annual : monthly;

  // Render-time diagnostic — visible in Mac Console.app when device is
  // tethered. Build 6 had a greyed button; build 7 fixed the gating
  // but the tap fired silently; this lands every render so we see the
  // exact state the next time something fires (or doesn't).
  console.warn("[premium] render ready=" + ready +
    " offering=" + (offerings?.identifier ?? "none") +
    " annual=" + (!!annual) + " monthly=" + (!!monthly) +
    " selected=" + selected + " selectedPkg=" + (selectedPkg?.identifier ?? "none") +
    " isPremium=" + isPremium + " working=" + working);

  // One-shot mount diagnostic. Alert.alert is the source of truth here
  // because Console.app has been showing zero [premium] warns despite
  // the diagnostics being in the binary. An on-screen alert cannot be
  // missed.
  useEffect(() => {
    (async () => {
      let pkgIds = "n/a";
      try {
        const offers = await Purchases.getOfferings();
        const keys = Object.keys(offers?.all ?? {});
        const current = offers?.current?.identifier ?? "none";
        const chosenId = offerings?.identifier ?? "none";
        const chosenPkgs = offerings?.availablePackages?.length ?? 0;
        pkgIds = (offerings?.availablePackages || []).map((p) => p.identifier + ":" + (p.product?.identifier ?? "?")).join(", ") || "(none)";
        Alert.alert(
          "SCREEN MOUNTED",
          "ready: " + ready +
            "\noffering keys: [" + keys.join(", ") + "]" +
            "\ncurrent: " + current +
            "\nchose: " + chosenId + " (" + chosenPkgs + " pkgs)" +
            "\npackages: " + pkgIds +
            "\ncustomerInfo: " + (customerInfo ? "loaded" : "null"),
        );
      } catch (e) {
        Alert.alert("SCREEN MOUNTED · ERROR", "getOfferings threw: " + (e?.message ?? e));
      }
    })();
    return () => { console.warn("[premium] unmount"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function purchase() {
    // FIRST line — proves the press reached JS. If this alert doesn't
    // fire when the user taps the trial button, the press isn't
    // reaching the handler and the issue is the touch surface, not
    // the SDK. console.warn kept too in case a future build can read
    // them, but the Alert is the source of truth tonight.
    Alert.alert("TAP DETECTED", "Trial button onPress fired");
    console.warn("[premium] TRIAL TAPPED " + new Date().toISOString());
    console.warn("[premium] SELECTED PKG " + (selectedPkg ? JSON.stringify({
      id: selectedPkg.identifier,
      productId: selectedPkg.product?.identifier,
      priceString: selectedPkg.product?.priceString,
      offering: selectedPkg.offeringIdentifier,
    }) : "null"));

    // Try-anyway fallback: if the resolver couldn't pin annual/monthly
    // by name or packageType, take the FIRST available package on the
    // offering rather than gating the user. Better to attempt a
    // purchase with whatever's there than silently disable the button.
    let pkg = selectedPkg;
    if (!pkg && offerings?.availablePackages?.length > 0) {
      pkg = offerings.availablePackages[0];
      Alert.alert(
        "Using fallback package",
        "annual/monthly resolver missed; falling back to: " + (pkg?.identifier ?? "unknown") +
          " (" + (pkg?.product?.identifier ?? "?") + ", " + (pkg?.product?.priceString ?? "?") + ")",
      );
    }

    if (!pkg) {
      // Last-ditch fallback: bypass offerings entirely and try to
      // purchase by raw App Store Connect product ID. This works as
      // long as the product is in "Ready to Submit" state in ASC and
      // mapped to the "premium" entitlement in RevenueCat.
      const targetProductId = selected === "monthly"
        ? "flooflife_premium_monthly"
        : "flooflife_premium_annual";
      try {
        Alert.alert("TRYING DIRECT PRODUCT", "Offering missing — falling back to getProducts(['" + targetProductId + "'])");
        const products = await Purchases.getProducts([targetProductId]);
        Alert.alert("DIRECT PRODUCT RESULT",
          "products.length=" + (products?.length ?? 0) +
            (products?.[0] ? "\nproduct=" + products[0].identifier + " " + products[0].priceString : "")
        );
        if (products && products.length > 0) {
          setWorking(true);
          try {
            const result = await Purchases.purchaseStoreProduct(products[0]);
            await refresh();
            const nowPremium = !!result?.customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
            Alert.alert(
              nowPremium ? "Welcome to Premium" : "PURCHASE OK BUT NOT ENTITLED",
              nowPremium
                ? "Thanks for supporting FloofLife. Your premium features are unlocked."
                : "Apple charged the card but the '" + PREMIUM_ENTITLEMENT_ID + "' entitlement isn't active. Check the dashboard mapping.",
              [{ text: "OK", onPress: () => nowPremium && navigation.goBack() }],
            );
          } catch (err) {
            Alert.alert("DIRECT PRODUCT ERROR",
              (err?.code ?? "?") + " - " + (err?.message ?? "?") +
                (err?.userCancelled ? " (userCancelled)" : "")
            );
          } finally {
            setWorking(false);
          }
          return;
        }
      } catch (e) {
        Alert.alert("DIRECT PRODUCT THREW", e?.message ?? String(e));
      }

      const offState = offerings
        ? "offering=" + (offerings.identifier ?? "?") + " pkgs=" + (offerings.availablePackages?.length ?? 0)
        : "offerings=null";
      Alert.alert(
        "NO PACKAGE FOUND",
        "Cannot start a purchase — " + offState +
          ". RevenueCat returned no products and no offering. Open the RevenueCat dashboard and confirm: (1) products imported from App Store Connect, (2) entitlement 'premium' exists, (3) offering 'default' has packages mapped to those products, (4) the offering is marked Current.",
        [
          { text: "Reload", onPress: async () => { await refresh(); Alert.alert("Reloaded", "Re-pull customer info"); } },
          { text: "OK" },
        ],
      );
      return;
    }
    setWorking(true);
    try {
      Alert.alert("CALLING SDK", "About to call purchasePackage. selectedPkg: " +
        JSON.stringify({ id: pkg.identifier, productId: pkg.product?.identifier, priceString: pkg.product?.priceString }));
      console.warn("[premium] CALLING Purchases.purchasePackage…");
      const result = await Purchases.purchasePackage(pkg);
      Alert.alert("RESOLVED",
        "productId=" + (result?.productIdentifier ?? "?") +
          " entitlements=" + Object.keys(result?.customerInfo?.entitlements?.active ?? {}).join(",")
      );
      console.warn("[premium] PURCHASE RESOLVED entitlements=" +
        Object.keys(result?.customerInfo?.entitlements?.active ?? {}).join(",") +
        " productId=" + result?.productIdentifier);
      await refresh();
      const nowPremium = !!result?.customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
      if (nowPremium) {
        Alert.alert(
          "Welcome to Premium",
          "Thanks for supporting FloofLife. Your premium features are unlocked.",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert(
          "PURCHASE OK BUT NOT ENTITLED",
          "Apple charged the card but the '" + PREMIUM_ENTITLEMENT_ID + "' entitlement isn't active. Check that the product is mapped to this entitlement in RevenueCat dashboard.",
        );
      }
    } catch (err) {
      Alert.alert("ERROR",
        (err?.code ?? "no-code") + " - " + (err?.message ?? "no message") +
          (err?.userCancelled ? " (userCancelled)" : "") +
          (err?.underlyingErrorMessage ? "\nunderlying: " + err.underlyingErrorMessage : "")
      );
      console.warn("[premium] PURCHASE ERROR code=" + (err?.code ?? "?") +
        " userCancelled=" + !!err?.userCancelled +
        " message=" + (err?.message ?? "?") +
        " underlyingError=" + (err?.underlyingErrorMessage ?? "?"));
      if (err?.userCancelled) return;
    } finally {
      setWorking(false);
    }
  }

  async function restore() {
    console.warn("[premium] RESTORE TAPPED " + new Date().toISOString());
    setWorking(true);
    try {
      const info = await Purchases.restorePurchases();
      console.warn("[premium] RESTORE RESOLVED entitlements=" +
        Object.keys(info?.entitlements?.active ?? {}).join(","));
      await refresh();
      const restored = !!info?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
      Alert.alert(
        restored ? "Purchases restored" : "Nothing to restore",
        restored
          ? "Your Premium subscription is active again."
          : "We couldn't find an active Premium subscription on this Apple ID.",
        [{ text: "OK", onPress: () => restored && navigation.goBack() }],
      );
    } catch (err) {
      console.warn("[premium] RESTORE ERROR code=" + (err?.code ?? "?") +
        " message=" + (err?.message ?? "?"));
      if (err?.userCancelled) return;
      Alert.alert("Restore failed", err?.message ?? "Please try again.");
    } finally {
      setWorking(false);
    }
  }

  const annualMeta = priceMetaFor(annual, "$39/yr · 7-day free trial");
  const monthlyMeta = priceMetaFor(monthly, "$4.99/mo");

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 60 }}>
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <MaterialCommunityIcons name="star-circle" size={42} color={theme.accent} />
        </View>
        <Text style={s.heroTitle}>{isPremium ? "You're Premium" : "Premium"}</Text>
        <Text style={s.heroSub}>
          {isPremium
            ? "Thanks for supporting FloofLife. All premium features are unlocked on this device."
            : "Add a few good years to the life you're already giving them."}
        </Text>
      </View>

      {!isPremium && (
        <View style={s.priceRow}>
          <TouchableOpacity
            onPress={() => setSelected("annual")}
            disabled={working}
            activeOpacity={0.85}
            style={[s.priceCard, selected === "annual" && s.priceCardActive]}
          >
            <Text style={s.priceLabel}>ANNUAL</Text>
            <Text style={s.priceAmt}>{annual?.product?.priceString ?? "$39"}<Text style={s.priceUnit}>/yr</Text></Text>
            <Text style={s.priceMeta}>$3.25/mo · 7-day free trial</Text>
            <View style={s.bestBadge}><Text style={s.bestBadgeText}>SAVE 35%</Text></View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelected("monthly")}
            disabled={working}
            activeOpacity={0.85}
            style={[s.priceCard, selected === "monthly" && s.priceCardActive]}
          >
            <Text style={s.priceLabel}>MONTHLY</Text>
            <Text style={s.priceAmt}>{monthly?.product?.priceString ?? "$4.99"}<Text style={s.priceUnit}>/mo</Text></Text>
            <Text style={s.priceMeta}>Cancel anytime</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.sectionHd}>WHAT YOU GET</Text>
      <View style={s.list}>
        {PREMIUM.map((p, i) => (
          <View key={i} style={s.row}>
            <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />
            <Text style={s.rowText}>{p}</Text>
          </View>
        ))}
      </View>

      <Text style={s.sectionHd}>FREE TIER</Text>
      <View style={s.list}>
        {FREE.map((p, i) => (
          <View key={i} style={s.row}>
            <MaterialCommunityIcons name="check" size={18} color={theme.muted} />
            <Text style={[s.rowText, { color: theme.muted }]}>{p}</Text>
          </View>
        ))}
      </View>

      {!isPremium && (
        <>
          {/* Pressable instead of TouchableOpacity — rules out a
              TouchableOpacity-specific touch-surface bug as the cause
              of the silent build-7 tap. hitSlop adds 12 px on every
              side so a near-miss still fires. The synchronous log in
              onPress fires before any state change so we can confirm
              the press reached JS even if `purchase()` errors. */}
          <Pressable
            onPress={() => {
              console.warn("[premium] CTA Pressable onPress fired " + new Date().toISOString());
              purchase().catch((e) => console.warn("[premium] purchase() rejected outside try " + (e?.message ?? e)));
            }}
            disabled={working}
            hitSlop={12}
            style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }, working && s.ctaDisabled]}
          >
            {working ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Text style={s.ctaText}>{selected === "annual" ? "Start 7-day free trial" : "Subscribe monthly"}</Text>
                <Text style={s.ctaSubText}>
                  {selected === "annual"
                    ? `Then ${annualMeta} · cancel anytime in iPhone Settings`
                    : `${monthlyMeta} · cancel anytime in iPhone Settings`}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              console.warn("[premium] RESTORE Pressable onPress fired " + new Date().toISOString());
              restore().catch((e) => console.warn("[premium] restore() rejected outside try " + (e?.message ?? e)));
            }}
            disabled={working}
            hitSlop={12}
            style={({ pressed }) => [s.restoreLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.restoreText}>Restore purchases</Text>
          </Pressable>
        </>
      )}

      {!ready && !isPremium && (
        <View style={s.loadingHint}>
          <ActivityIndicator color={theme.accent} />
          <Text style={s.loadingText}>Loading subscription options…</Text>
        </View>
      )}

      <View style={s.fineprint}>
        <Text style={s.fineText}>
          Subscriptions are processed by Apple. Your subscription auto-renews unless canceled at least 24 hours before the end of the current period. Manage or cancel in Settings → Apple ID → Subscriptions.
        </Text>
        <Text style={[s.fineText, { marginTop: 8 }]}>
          FloofLife guidance is sourced from public veterinary references. It is not a substitute for veterinary advice.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero:         { alignItems: "center", paddingVertical: 18, paddingBottom: 4 },
  heroIcon:     { width: 76, height: 76, borderRadius: 38, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle:    { fontSize: 28, fontWeight: "800", color: theme.fg, letterSpacing: -0.5 },
  heroSub:      { fontSize: 14, color: theme.muted, marginTop: 4, textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },
  priceRow:     { flexDirection: "row", gap: 10, marginTop: 18, marginBottom: 8 },
  priceCard:    { flex: 1, padding: 16, backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.line, alignItems: "center" },
  priceCardActive:{ borderColor: theme.accent, borderWidth: 2 },
  priceLabel:   { fontSize: 10, fontWeight: "800", color: theme.muted, letterSpacing: 1.2 },
  priceAmt:     { fontSize: 26, fontWeight: "800", color: theme.fg, marginTop: 6 },
  priceUnit:    { fontSize: 13, fontWeight: "600", color: theme.muted },
  priceMeta:    { fontSize: 11, color: theme.muted, marginTop: 4, textAlign: "center" },
  bestBadge:    { position: "absolute", top: -10, right: -8, backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  bestBadgeText:{ color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  sectionHd:    { marginTop: 18, marginBottom: 10, fontSize: 11, fontWeight: "700", color: theme.muted, letterSpacing: 1.2 },
  list:         { backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.line, padding: 14, gap: 10 },
  row:          { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  rowText:      { flex: 1, fontSize: 13, color: theme.fg, lineHeight: 19 },
  cta:          { marginTop: 22, backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 12, alignItems: "center", minHeight: 60, justifyContent: "center" },
  ctaDisabled:  { opacity: 0.55 },
  ctaText:      { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },
  ctaSubText:   { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 4, letterSpacing: 0.3 },
  restoreLink:  { alignSelf: "center", paddingVertical: 12, paddingHorizontal: 16, marginTop: 4 },
  restoreText:  { color: theme.accent, fontWeight: "700", fontSize: 13, letterSpacing: 0.3 },
  loadingHint:  { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 18 },
  loadingText:  { color: theme.muted, fontSize: 12 },
  fineprint:    { marginTop: 24 },
  fineText:     { fontSize: 11, color: theme.muted, lineHeight: 17 },
});

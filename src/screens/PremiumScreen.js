// Premium upsell — reads RevenueCat offerings via PurchasesContext and
// drives real StoreKit purchases. Annual is selected by default since
// it's where the trial lives; the monthly card is now a real toggle
// (the v0 "monthly button non-clickable" bug is fixed here).
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Purchases from "react-native-purchases";
import { usePurchases } from "../lib/purchasesContext";
import { PREMIUM_ENTITLEMENT_ID } from "../lib/config";
import { track } from "../lib/analytics";
import { tapMedium, tapHeavy, notifySuccess, notifyError } from "../lib/haptics";
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
  const { offerings, isPremium, ready, refresh } = usePurchases();
  const [selected, setSelected] = useState("annual");
  const [working, setWorking] = useState(false);

  const annual = resolvePkg(offerings, "annual");
  const monthly = resolvePkg(offerings, "monthly");
  const selectedPkg = selected === "annual" ? annual : monthly;

  async function purchase() {
    track("premium_purchase_initiated", { plan: selected });
    // Hard haptic on the actual payment moment per build 19 smoke-test
    // feedback — payment is the kind of action that warrants strong
    // tactile confirmation.
    tapHeavy();
    // Resolution chain (silent — no diagnostic alerts):
    //   1. selectedPkg from resolvePkg() against the offering
    //   2. fallback to first availablePackage if resolver missed
    //   3. fallback to direct-product purchase via getProducts() —
    //      bypasses offerings entirely. Works as long as the product
    //      is fetchable from App Store Connect, even if RevenueCat's
    //      offering is empty.
    let pkg = selectedPkg;
    if (!pkg && offerings?.availablePackages?.length > 0) {
      pkg = offerings.availablePackages[0];
    }

    if (!pkg) {
      const targetProductId = selected === "monthly"
        ? "flooflife_premium_monthly"
        : "flooflife_premium_annual";
      try {
        const products = await Purchases.getProducts([targetProductId]);
        if (products && products.length > 0) {
          setWorking(true);
          try {
            const result = await Purchases.purchaseStoreProduct(products[0]);
            await refresh();
            const nowPremium = !!result?.customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
            if (nowPremium) {
              track("premium_purchase_completed", { plan: selected, path: "direct_product" });
              tapHeavy();
              notifySuccess();
              Alert.alert(
                "Welcome to Premium",
                "Thanks for supporting FloofLife. Your premium features are unlocked.",
                [{ text: "OK", onPress: () => navigation.goBack() }],
              );
            }
          } catch (err) {
            if (err?.userCancelled) {
              track("premium_purchase_cancelled", { plan: selected });
            } else {
              track("premium_purchase_failed", { plan: selected, reason: err?.code || "unknown" });
      notifyError();
              Alert.alert("Purchase failed", err?.message ?? "Apple couldn't process the payment. Please try again.");
            }
          } finally {
            setWorking(false);
          }
          return;
        }
      } catch (e) {
        // Direct fetch threw — fall through to the unavailable alert below.
      }

      Alert.alert(
        "Subscriptions unavailable",
        "We couldn't load subscription options right now. Check your connection and try again, or tap Restore Purchases if you've subscribed before.",
      );
      return;
    }

    setWorking(true);
    try {
      const result = await Purchases.purchasePackage(pkg);
      await refresh();
      const nowPremium = !!result?.customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
      if (nowPremium) {
        track("premium_purchase_completed", { plan: selected, path: "package" });
        tapHeavy();
        notifySuccess();
        Alert.alert(
          "Welcome to Premium",
          "Thanks for supporting FloofLife. Your premium features are unlocked.",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      }
    } catch (err) {
      if (err?.userCancelled) {
        track("premium_purchase_cancelled", { plan: selected });
        return;
      }
      const msg = err?.message ?? "";
      track("premium_purchase_failed", { plan: selected, reason: err?.code || "unknown" });
      notifyError();
      if (/network|connection|offline/i.test(msg)) {
        Alert.alert("Network error", "Couldn't reach the App Store. Try again on a stable connection.");
      } else {
        Alert.alert("Purchase failed", msg || "Apple couldn't process the payment. Please try again.");
      }
    } finally {
      setWorking(false);
    }
  }

  async function restore() {
    track("premium_restore_initiated");
    tapHeavy();
    setWorking(true);
    try {
      const info = await Purchases.restorePurchases();
      await refresh();
      const restored = !!info?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
      track("premium_restore_result", { restored });
      if (restored) notifySuccess();
      Alert.alert(
        restored ? "Purchases restored" : "Nothing to restore",
        restored
          ? "Your Premium subscription is active again."
          : "We couldn't find an active Premium subscription on this Apple ID.",
        [{ text: "OK", onPress: () => restored && navigation.goBack() }],
      );
    } catch (err) {
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
          {/* Pressable + hitSlop=12 so the press surface is robust;
              outer try/catch in onPress catches any rejection that
              escapes purchase()'s own try/catch. */}
          <Pressable
            onPress={() => { purchase().catch(() => {}); }}
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
            onPress={() => { restore().catch(() => {}); }}
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

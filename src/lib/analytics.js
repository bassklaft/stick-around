// Product analytics via PostHog. Anonymous-by-default — the SDK
// generates a per-install distinct id (UUID) and sends only the
// events emitted from track() / screen() below.
//
// PRIVACY CONTRACT (must stay in sync with the Privacy Policy):
// We send anonymous behavioral events (which screen the user is on,
// which buttons they tap, when they finish onboarding, when they
// view / purchase / restore Premium). We DO NOT send pet names,
// photos, breeds, ages, weights, notes, location, IDFV, or any
// other identifying or pet-specific data. Events that take a
// `species` property send the literal string "dog" or "cat" only —
// never per-pet detail.
//
// Init is a no-op when EXPO_PUBLIC_POSTHOG_KEY is missing (dev
// builds without analytics, preview channels). Helper functions
// guard against an uninitialized client so call sites don't need
// null checks.
import PostHog from "posthog-react-native";
import { POSTHOG_KEY, POSTHOG_HOST } from "./config";

let client = null;
let initPromise = null;

export async function initAnalytics() {
  if (client) return client;
  if (initPromise) return initPromise;
  if (!POSTHOG_KEY) return null;

  initPromise = (async () => {
    try {
      client = new PostHog(POSTHOG_KEY, {
        host: POSTHOG_HOST,
        // Capture lifecycle (app open, app background) automatically.
        captureAppLifecycleEvents: true,
        // Don't auto-capture every Touchable in the tree — too noisy
        // and risks leaking text content. We send named events from
        // call sites instead.
        captureNativeAppLifecycleEvents: true,
      });
      return client;
    } catch (e) {
      // Network blip / missing key / package mis-init — silent.
      // Analytics is non-critical; never break the app for this.
      client = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

// Track a named event with optional properties. Properties must be
// scalar (string / number / boolean) and must NOT contain pet PII.
export function track(event, properties) {
  if (!client) return;
  try { client.capture(event, properties); } catch { /* swallow */ }
}

// Manual screen tracking. PostHog has built-in $screen events when
// call sites emit them; React Navigation listener in App.js wires
// this on every route change.
export function screen(name, properties) {
  if (!client) return;
  try { client.screen(name, properties); } catch { /* swallow */ }
}

// Set a small set of person properties without identifying the user.
// We only ever set: subscription_state ("free" | "premium"), and
// has_completed_onboarding (boolean). NEVER set name, email, pet
// name, photo, etc.
export function setPersonProperties(props) {
  if (!client) return;
  try { client.register(props); } catch { /* swallow */ }
}

// Convenience wrapper for premium subscription state changes so the
// PurchasesProvider can drop in one call.
export function setSubscriptionState(state /* "free" | "premium" */) {
  setPersonProperties({ subscription_state: state });
}

// Reset the anonymous distinct id — used if the user resets all
// data via the danger-zone Settings action, so post-reset events
// don't get attributed to the prior anonymous install.
export function resetAnalytics() {
  if (!client) return;
  try { client.reset(); } catch { /* swallow */ }
}

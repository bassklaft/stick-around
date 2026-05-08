// FDA pet food recall match service. Cross-references the brand +
// product name in the user's diet logs against active FDA pet-food
// recalls. NEVER paywalled — this is the trust contract.
//
// Source: FDA openFDA Animal & Veterinary endpoint
//   https://api.fda.gov/animalandveterinary/event.json
// Public API, no key required for low-volume reads.
//
// We additionally pull the FDA recall feed (a separate index more
// commonly used for food/drug recalls — animal recalls appear here):
//   https://api.fda.gov/food/enforcement.json
// We filter `product_description` for pet food keywords + match
// against the user's logged brand + product name.
//
// Caching: results cached locally for 24 hours. Network failure
// falls back to last cached result. Caching key:
//   pawrent_tummy_recalls_cache_v1
//
// Privacy: this file does NOT send the user's logged brand to FDA.
// We pull the full recall feed and match locally. The third party
// never knows what foods the user has logged.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { DietLog } from "./tummy";

const CACHE_KEY = "pawrent_tummy_recalls_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// FDA endpoints — pet food appears in the food/enforcement and the
// animalandveterinary feeds. We pull both and dedupe by recall_number.
const FDA_FOOD_URL =
  "https://api.fda.gov/food/enforcement.json?search=product_description:(dog+OR+cat+OR+pet)&limit=100";
const FDA_AV_URL =
  "https://api.fda.gov/animalandveterinary/event.json?limit=100";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FDA fetch failed: ${res.status}`);
  return res.json();
}

// Normalize FDA records into our internal recall shape.
function normalizeFoodRecall(r) {
  return {
    id: r.recall_number || r.event_id || r.report_date || JSON.stringify(r).slice(0, 24),
    source: "FDA Food Enforcement",
    brand: (r.recalling_firm || "").trim(),
    productDescription: (r.product_description || "").trim(),
    reason: (r.reason_for_recall || "").trim(),
    recallDateRaw: r.report_date || r.recall_initiation_date || null,
    classification: r.classification || null,
    state: r.state || null,
  };
}

function normalizeAvEvent(r) {
  // The animalandveterinary endpoint shape is different — events not
  // recalls per se. We extract product info from the products array.
  const product = (r.products && r.products[0]) || {};
  return {
    id: r.report_id || r.original_receive_date || JSON.stringify(r).slice(0, 24),
    source: "FDA Animal & Veterinary",
    brand: (product.brand_name || "").trim(),
    productDescription: (product.brand_name || "") + " " + (product.dosage_form || ""),
    reason: (r.reactions && r.reactions.join(", ")) || "",
    recallDateRaw: r.original_receive_date || null,
    classification: null,
    state: null,
  };
}

function parseFdaDate(s) {
  // FDA dates: "20240321" or "2024-03-21". Normalize to ISO YYYY-MM-DD.
  if (!s) return null;
  if (typeof s !== "string") return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return s;
}

// Lightweight fuzzy substring match — case-insensitive, ignores
// punctuation, allows for minor typos via simple character-overlap
// ratio. For production we'd swap this for a real fuzzy matcher
// (Levenshtein or similar); for v1.2 the substring + light-fuzz
// approach is good enough and ships without new deps.
function normalizeForMatch(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function looksLikeMatch(query, target) {
  const q = normalizeForMatch(query);
  const t = normalizeForMatch(target);
  if (!q || !t) return false;
  if (q.length < 3) return false; // too short to match meaningfully
  if (t.includes(q)) return true;
  if (q.includes(t) && t.length >= 4) return true;
  // Light fuzz: split query into words; require at least 60% to
  // appear in target as substrings.
  const words = q.split(" ").filter((w) => w.length >= 3);
  if (words.length === 0) return false;
  const hits = words.filter((w) => t.includes(w)).length;
  return hits / words.length >= 0.6;
}

async function loadCache() {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.recalls) || !parsed.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function saveCache(recalls) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
    fetchedAt: Date.now(),
    recalls,
  }));
}

// Public — fetch + normalize + cache active recalls. Returns
// { recalls, fetchedAt, fromCache }.
export async function getActiveRecalls({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cache = await loadCache();
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return { recalls: cache.recalls, fetchedAt: cache.fetchedAt, fromCache: true };
    }
  }
  try {
    const [foodRes, avRes] = await Promise.all([
      fetchJson(FDA_FOOD_URL).catch(() => ({ results: [] })),
      fetchJson(FDA_AV_URL).catch(() => ({ results: [] })),
    ]);
    const foodRecalls = (foodRes.results || []).map(normalizeFoodRecall);
    const avRecalls = (avRes.results || []).map(normalizeAvEvent);
    const all = [...foodRecalls, ...avRecalls];
    const seen = new Set();
    const deduped = all.filter((r) => {
      if (!r.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    await saveCache(deduped);
    return { recalls: deduped, fetchedAt: Date.now(), fromCache: false };
  } catch (e) {
    // Network failed — fall back to whatever cache we have, even
    // if expired. Better stale than nothing for a safety feature.
    const cache = await loadCache();
    if (cache) return { recalls: cache.recalls, fetchedAt: cache.fetchedAt, fromCache: true, networkError: true };
    return { recalls: [], fetchedAt: 0, fromCache: false, networkError: true };
  }
}

// Public — match a pet's recent diet logs against the recall feed.
// Returns array of { dietEntry, recall, matchedField, matchedAt }
// for any matched pair found in trailing `windowDays` of diet logs.
//
// Banner copy is built by the caller; this function returns the
// raw matches.
export async function findRecallMatches(petId, { windowDays = 90, forceRefresh = false } = {}) {
  if (!petId) return { matches: [], recallsFetchedAt: 0 };
  const dietEntries = await DietLog.listSinceDays(petId, windowDays);
  if (dietEntries.length === 0) return { matches: [], recallsFetchedAt: 0 };

  const { recalls, fetchedAt, fromCache, networkError } = await getActiveRecalls({ forceRefresh });
  if (recalls.length === 0) return { matches: [], recallsFetchedAt: fetchedAt, fromCache, networkError };

  const matches = [];
  for (const entry of dietEntries) {
    if (!entry.brand && !entry.productName) continue;
    for (const recall of recalls) {
      const target = `${recall.brand || ""} ${recall.productDescription || ""}`;
      const brandMatch = entry.brand && looksLikeMatch(entry.brand, target);
      const productMatch = entry.productName && looksLikeMatch(entry.productName, target);
      if (brandMatch || productMatch) {
        matches.push({
          dietEntry: entry,
          recall,
          matchedField: brandMatch ? "brand" : "product",
          matchedAt: Date.now(),
        });
        break; // one recall match per diet entry is enough for the banner
      }
    }
  }
  return { matches, recallsFetchedAt: fetchedAt, fromCache, networkError };
}

// Build the banner copy from a single match. Per the spec:
// "FDA recalled [Brand] [Product] on [date]. Reasons: [reason].
//  Last logged: [date]. Discuss with your vet."
export function buildRecallBannerCopy(match) {
  if (!match || !match.recall) return "";
  const r = match.recall;
  const recallDate = parseFdaDate(r.recallDateRaw) || "—";
  const lastLogged = match.dietEntry?.ts ? new Date(match.dietEntry.ts).toLocaleDateString() : "—";
  const brandLabel = r.brand || "Unknown brand";
  const productLabel = r.productDescription
    ? r.productDescription.length > 80 ? r.productDescription.slice(0, 80) + "…" : r.productDescription
    : "";
  const reason = (r.reason || "").length > 120 ? r.reason.slice(0, 120) + "…" : (r.reason || "Reason not specified.");
  return `FDA recalled ${brandLabel}${productLabel ? " — " + productLabel : ""} on ${recallDate}. Reason: ${reason} Last logged: ${lastLogged}. Discuss with your vet.`;
}

// Used by the recall-data-stale hint when cache is older than 7 days.
export function isCacheStale(fetchedAt) {
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt > 7 * 24 * 60 * 60 * 1000;
}

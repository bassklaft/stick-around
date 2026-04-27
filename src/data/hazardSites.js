// Curated list of known location-specific hazards. v1 covers a small
// set of well-documented sites near major metros; expandable. Each
// entry has a bounding box; we flag a risk when the user's lat/lng
// falls inside.
//
// Sources: EPA Superfund National Priorities List, NYC DEP Brownfield
// Cleanup Program records, USGS PFAS contamination map. All public
// data; the per-site summary is editorial.
export const HAZARD_SITES = [
  {
    id: "meeker-plume",
    name: "Meeker Avenue Plume",
    where: "Williamsburg, Brooklyn, NY",
    bbox: { minLat: 40.715, maxLat: 40.725, minLng: -73.945, maxLng: -73.928 },
    severity: "high",
    summary: "EPA-designated Superfund site (added 2022). Underground plume of chlorinated solvents (TCE, PCE) from former dry-cleaning + manufacturing operations along Meeker, Metropolitan, and Driggs Aves.",
    advice: "Don't let your dog drink from puddles or sidewalk puddles in this area. Wash paws after walks. Avoid letting them dig in dirt patches in tree pits or community gardens within the plume bbox.",
    sourceUrl: "https://www.epa.gov/superfund/meeker-avenue-plume",
  },
  {
    id: "gowanus-canal",
    name: "Gowanus Canal Superfund",
    where: "Gowanus / Park Slope, Brooklyn, NY",
    bbox: { minLat: 40.665, maxLat: 40.685, minLng: -73.998, maxLng: -73.985 },
    severity: "high",
    summary: "One of the most polluted urban water bodies in the US. Heavy metals, PCBs, coal tar from 150+ years of industrial discharge.",
    advice: "Never let your dog enter the canal or drink from it. After heavy rain, the surrounding streets can have CSO (combined sewer overflow) — wash paws and avoid puddles for 24-48h.",
    sourceUrl: "https://www.epa.gov/superfund/gowanus-canal",
  },
  {
    id: "newtown-creek",
    name: "Newtown Creek Superfund",
    where: "Greenpoint / Long Island City, NY",
    bbox: { minLat: 40.725, maxLat: 40.745, minLng: -73.952, maxLng: -73.918 },
    severity: "high",
    summary: "Long-running EPA Superfund cleanup. Petroleum, metals, PCBs in sediment from a century+ of refineries + manufacturing.",
    advice: "Avoid letting your dog enter the water or wade in the surrounding marsh. Pavement runoff after rain is the main exposure path.",
    sourceUrl: "https://www.epa.gov/superfund/newtown-creek",
  },
  {
    id: "la-river",
    name: "Los Angeles River industrial corridor",
    where: "Glendale → Long Beach, CA",
    bbox: { minLat: 33.75, maxLat: 34.20, minLng: -118.30, maxLng: -118.10 },
    severity: "moderate",
    summary: "The LA River bed and adjacent corridors carry industrial runoff, fertilizer, and heavy-metal sediment from upstream.",
    advice: "Don't let your dog drink from the river or its tributaries. Watch for blue-green algae warnings in summer.",
    sourceUrl: "https://www.lariver.org/",
  },
];

export function findHazards(lat, lng) {
  if (lat == null || lng == null) return [];
  return HAZARD_SITES.filter(h =>
    lat >= h.bbox.minLat && lat <= h.bbox.maxLat &&
    lng >= h.bbox.minLng && lng <= h.bbox.maxLng
  );
}

// Generic urban / coastal / cold-climate flags by very-rough bbox.
// These aren't exhaustive — they're heuristic warnings to surface
// region-typical concerns when the user is somewhere we recognize.
export const REGIONAL_FLAGS = [
  {
    id: "nyc-metro",
    bbox: { minLat: 40.5, maxLat: 41.0, minLng: -74.3, maxLng: -73.7 },
    risks: [
      { kind: "highway",  text: "NYC dogs are 7x more likely to dart into traffic vs suburban dogs (NYC ACC data). Always double-leash near major arteries (BQE, FDR, Northern Blvd)." },
      { kind: "noise",    text: "Fireworks: July 4 + New Year's Eve see massive runaways in NYC. Have ID + microchip up to date and consider a Thundershirt." },
      { kind: "lepto",    text: "NYC has elevated leptospirosis rates due to the rat population. Ask your vet about the lepto vaccine if your dog drinks from sidewalk puddles." },
      { kind: "rats",     text: "Rat poison ingestion is the #1 emergency-vet call in Brooklyn / Queens. Avoid letting your dog eat anything off the ground." },
    ],
  },
  {
    id: "tick-belt",
    bbox: { minLat: 38.0, maxLat: 45.0, minLng: -78.0, maxLng: -69.0 },
    risks: [
      { kind: "ticks", text: "Northeast US is in the highest tick-density zone in the country. Lyme + anaplasmosis + Powassan virus all present. Tick check after every grass/brush exposure, May-November." },
    ],
  },
  {
    id: "sf-bay",
    bbox: { minLat: 37.4, maxLat: 38.0, minLng: -122.6, maxLng: -122.0 },
    risks: [
      { kind: "foxtails", text: "Foxtail grass (May-October) is the SF Bay Area's #1 ER vet call. Spikelets lodge in paws, ears, eyes, and migrate internally. Inspect daily after grass walks." },
    ],
  },
  {
    id: "florida",
    bbox: { minLat: 24.5, maxLat: 31.0, minLng: -88.0, maxLng: -80.0 },
    risks: [
      { kind: "alligator", text: "FL has 1.3M+ alligators. Never let your dog near retention ponds, canals, or unfenced freshwater — this is the #1 dog-fatality cause statewide." },
      { kind: "heat",      text: "FL pavement hits 140°F+ in summer. Boots or pre-dawn walks only May-September." },
    ],
  },
  {
    id: "rocky-mountain",
    bbox: { minLat: 35.0, maxLat: 45.0, minLng: -115.0, maxLng: -103.0 },
    risks: [
      { kind: "wildlife", text: "Coyotes, mountain lions, rattlesnakes — all real risks in CO/UT/WY/MT. Never off-leash at dawn or dusk in semi-rural areas." },
    ],
  },
];

export function findRegional(lat, lng) {
  if (lat == null || lng == null) return [];
  return REGIONAL_FLAGS.filter(r =>
    lat >= r.bbox.minLat && lat <= r.bbox.maxLat &&
    lng >= r.bbox.minLng && lng <= r.bbox.maxLng
  ).flatMap(r => r.risks);
}

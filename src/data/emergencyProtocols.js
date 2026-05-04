// Emergency protocols — CPR + toxic ingestion. Sourced from AVMA, Red
// Cross Pet First Aid, Pet Poison Helpline, ASPCA APCC public guidance.
// Editorial summary; not medical advice.

export const POISON_HOTLINES = [
  { name: "ASPCA Animal Poison Control",  phone: "18884264435", display: "(888) 426-4435", note: "$95 consultation fee. 24/7. Most experienced for dogs + cats." },
  { name: "Pet Poison Helpline",          phone: "18557647661", display: "(855) 764-7661", note: "$85 consultation fee. 24/7. Includes case-management follow-up." },
];

// CPR by body type — chest geometry determines hand position. Always
// preceded by checking responsiveness, breathing, and clearing the
// airway. Compression rate is consistent (100-120/min) across types.
export const CPR_BY_CHESTTYPE = [
  {
    id: "small",
    label: "Small dogs + cats (under 30 lb)",
    examples: "Yorkie, Chihuahua, Pomeranian, Frenchie, Boston, Pug, Maltese, kittens, adult cats",
    handPosition: "One hand wrapping the chest from below. Thumb on one side of sternum, fingers on the other.",
    depth: "Compress to ⅓-½ the depth of the chest",
    rate: "100-120 compressions per minute",
    breathRatio: "30 compressions, then 2 rescue breaths (close mouth, breathe into nose)",
    illustration: "🐈‍⬛", // small/cat-coded
    posture: "Pet on side (right side up if possible — heart is on the left).",
  },
  {
    id: "deep",
    label: "Deep-chested medium/large dogs",
    examples: "Labrador, Golden, GSD, Doberman, Boxer, Husky, Rottweiler, Bernese",
    handPosition: "Heel of one hand on the highest point of the chest (over the heart). Other hand on top, fingers interlocked. Lock elbows.",
    depth: "Compress to ⅓-½ chest depth",
    rate: "100-120 compressions per minute",
    breathRatio: "30 compressions, then 2 rescue breaths",
    illustration: "🐕",
    posture: "Pet on RIGHT side. The heart is between the 4th-6th ribs on the left side, accessible from above when the dog lies on its right.",
  },
  {
    id: "narrow",
    label: "Narrow / keel-chested dogs",
    examples: "Greyhound, Whippet, Saluki, Borzoi, Doberman, Pharaoh Hound",
    handPosition: "Heel of hand on the narrowest part of the chest, just behind the elbow. Other hand on top.",
    depth: "Compress to ⅓-½ chest depth",
    rate: "100-120 compressions per minute",
    breathRatio: "30 compressions, then 2 rescue breaths",
    illustration: "🐕",
    posture: "Pet on right side. Aim compressions over the heart (just behind the front leg).",
  },
  {
    id: "barrel",
    label: "Barrel/wide-chested + brachycephalic",
    examples: "Bulldog, Frenchie (deep ones), Pug, Boxer, Boston Terrier, English Bulldog",
    handPosition: "Pet on BACK (sternal recumbency). Heel of one hand on the sternum (breastbone), other hand on top.",
    depth: "Compress to ⅓-½ chest depth — gentler on flat-chested breeds, they're more fragile here",
    rate: "100-120 compressions per minute",
    breathRatio: "30 compressions, then 2 rescue breaths",
    illustration: "🐶",
    posture: "Pet on back, sternal compressions. The wide chest geometry makes side compressions less effective.",
  },
];

// Universal CPR steps before chest compressions
export const CPR_STEPS = [
  { n: 1, title: "Check responsiveness", body: "Call their name. Tap. No response? Continue. (If responsive, skip CPR — assess + transport.)" },
  { n: 2, title: "Open the airway", body: "Pull the tongue forward and to the side. Look in the mouth — clear any vomit, food, foreign objects with a finger sweep. Don't push anything DEEPER." },
  { n: 3, title: "Check for breathing", body: "Watch the chest for rise and fall for 10 seconds. Feel for breath at the nose. No breathing? Continue." },
  { n: 4, title: "Check for pulse", body: "Femoral artery — inside of the back leg, where the leg meets the body. Or feel for heartbeat behind the elbow on the left side. No pulse for 10 sec = start CPR." },
  { n: 5, title: "Begin compressions", body: "See the body-type-specific section below. Rate: count out loud 'and 1, and 2…' to keep 100-120/min. Most owners go too slow — 'Stayin' Alive' is the right tempo." },
  { n: 6, title: "Rescue breaths", body: "After 30 compressions: close their mouth, blow into their NOSE for 1 second, watch chest rise. 2 breaths, then back to compressions. Don't pause longer than 10 seconds total." },
  { n: 7, title: "Get to a vet NOW", body: "Continue cycles for at least 20 minutes — many pets are revived only en route to the ER. Call ahead so the vet meets you at the door." },
];

// Toxic ingestion protocol. Order is strict — wrong sequence kills more
// pets than the toxin itself.
export const TOXIC_INGESTION_PROTOCOL = {
  callFirst: "Call ASPCA Animal Poison Control (888-426-4435) or Pet Poison Helpline (855-764-7661) BEFORE doing anything else. They'll tell you exactly what to do for THIS substance + THIS pet's weight. The $85-95 fee is paid back 1000x in saved guesswork.",
  doNotInduce: [
    "Caustic substances (bleach, drain cleaner, lye, oven cleaner) — burns the esophagus going up too",
    "Petroleum products (gasoline, kerosene, lighter fluid, motor oil) — aspiration into lungs is fatal",
    "Sharp objects (bones, glass, metal pins) — re-cutting on the way up",
    "Cats (high aspiration pneumonia risk; almost never recommended)",
    "Brachycephalic breeds (Frenchie, Bulldog, Pug, Boston) — high aspiration risk",
    "Unconscious or seizing animals",
    "Animals that already vomited",
    "Substance ingested >2 hours ago — already in the gut, vomiting won't help",
    "Animals with megaesophagus or laryngeal paralysis",
  ],
  inducingMethod: "ONLY if poison control or your vet says to: 3% hydrogen peroxide, 1 ml per pound (max 45 ml). Squirt into the mouth using a syringe. Walk the dog around for 10-15 min — most will vomit within 15 minutes. NEVER give a second dose if the first doesn't work — go to the ER.",
  activatedCharcoal: "Activated charcoal binds the toxin in the gut. Only effective if given within 1-2 hours of ingestion. Dosing varies by toxin and pet weight — vets give it via stomach tube, NOT something to attempt at home (aspiration risk + wrong dose can be fatal). Mention it as an option to the ER vet when you arrive.",
  whatToBring: [
    "The packaging / container of whatever was ingested (or a photo of it)",
    "A sample of the substance if possible (in a sealed bag)",
    "An estimate of how much was eaten and when",
    "Your pet's weight",
    "Recent feeding time + any meds they're on",
  ],
  topToxins: [
    { name: "Chocolate (esp. dark, baking)", action: "Call poison control. Theobromine dose calc by chocolate type + weight. Vomiting often induced." },
    { name: "Xylitol (sugar-free gum, peanut butter)", action: "EMERGENCY — causes hypoglycemia in 30 minutes. Get to ER immediately. Even tiny amounts." },
    { name: "Grapes / raisins", action: "Vet trip same day. No safe dose; idiosyncratic kidney injury." },
    { name: "Ibuprofen / Acetaminophen", action: "EMERGENCY — especially fatal to cats. Activated charcoal + IV fluids at ER." },
    { name: "Onion / garlic (incl. powders)", action: "Vet call. Hemolytic anemia builds over days, not hours." },
    { name: "Rodenticide (rat / mouse poison)", action: "EMERGENCY — bring the box. Different rodenticides need different antidotes (vitamin K1 for anticoagulants; nothing for bromethalin)." },
    { name: "Marijuana (esp. edibles)", action: "Vet call. THC + chocolate + xylitol combo (in edibles) is compounded toxicity." },
    { name: "Antifreeze (ethylene glycol)", action: "EMERGENCY — sweet taste, lethal dose for a cat is 1 teaspoon. Treatment window is <12 hours." },
  ],
};

// Free video resources from public veterinary organizations.
// No affiliate codes; no FloofLife endorsement implied.
export const CERTIFIED_VIDEOS = [
  { label: "Red Cross — Pet First Aid (free course)",   url: "https://www.redcross.org/take-a-class/cpr" },
  { label: "AVMA — Disaster preparedness for pets",     url: "https://www.avma.org/resources-tools/animal-health-welfare/disaster-preparedness" },
  { label: "ASPCA — Pet Poison Control",                url: "https://www.aspca.org/pet-care/animal-poison-control" },
  { label: "Cornell Veterinary College — Pet First Aid",url: "https://www.vet.cornell.edu/" },
  { label: "Pet Poison Helpline — Top 10 toxins",       url: "https://www.petpoisonhelpline.com/" },
];

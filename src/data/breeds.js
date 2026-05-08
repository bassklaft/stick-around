// Breed facts — curated from public veterinary references (AKC, ASPCA,
// Merck Vet Manual, AVMA, Cornell Feline Health, VCA Hospitals). All
// medical content is editorial summary, not veterinary advice.
// v1 catalog: top ~30 AKC dogs + top ~15 cat breeds + Chow Chow + mixed.

const dogBreedData = {
  "labrador retriever": {
    species: "dog", lifespan: "10-12 years", energy: "high",
    summary: "Friendly, even-tempered, water-loving. Famously food-motivated, which makes weight management tricky.",
    health: ["Hip and elbow dysplasia", "Obesity", "Exercise-induced collapse (rare)"],
    grooming: "Weekly brush; sheds year-round, blows coat 2x/year",
    exercise: "60+ min/day — Labs without exercise become destructive",
    checklist: [
      { title: "Weight + body-condition score", why: "Labs are the #1 obesity-prone breed.", cadence: "weekly", category: "observe" },
    ],
    tips: [
      "Slow-feeder bowl is worth the $15 — Labs inhale food and bloat.",
      "Set a hard 'no table scraps' rule with everyone in the household. Labs work the room and undo your portion control.",
      "Ear infections love Labs that swim. Dry inside the flap with cotton after every swim.",
      "If you see exercise-induced weakness or wobbling on hot days, look up EIC (genetic test exists).",
    ],
  },
  "french bulldog": {
    species: "dog", lifespan: "10-12 years", energy: "low-moderate",
    displayName: "French Bulldogs",
    origin: "England → France · 1800s",
    originStory: "Descended from English Bulldogs miniaturized by Nottingham lacemakers, then carried to France during the Industrial Revolution where they became companions of Parisian café society. Refined into the modern Frenchie in late-1800s France.",
    brachycephalic: true,
    summary: "Affectionate, low-exercise, brachycephalic. Heat is genuinely dangerous for this breed.",
    references: [
      { label: "AKC French Bulldog breed page", url: "https://www.akc.org/dog-breeds/french-bulldog/" },
      { label: "French Bull Dog Club of America", url: "https://www.frenchbulldogclub.org/" },
    ],
    health: ["Brachycephalic Obstructive Airway Syndrome (BOAS)", "IVDD (spinal disorders)", "Skin allergies"],
    grooming: "Wipe face folds 2-3x/week; minimal coat care",
    exercise: "20-40 min/day — NEVER above 80°F",
    checklist: [
      { title: "Wipe face wrinkles with damp cloth",  why: "Trapped moisture + food debris causes bacterial dermatitis.", cadence: "3x/week", category: "care" },
      { title: "Note any labored breathing at rest",   why: "BOAS worsens with weight + heat.",                         cadence: "weekly",  category: "observe" },
    ],
    tips: [
      "Frenchies CANNOT swim — their body shape sinks. Never leave one alone near a pool, hot tub, or beach.",
      "Cooling vests + cooling mats are not optional in summer. Many owners run A/C 24/7 May-September.",
      "Watch for back pain signs: reluctance to jump on the couch, hunched posture. IVDD is common; surgery is $5-10k.",
      "BOAS surgery (nares + soft palate) can transform quality of life. If your Frenchie snorts at rest, ask the vet.",
      "Skin allergies often respond to a limited-ingredient or novel protein diet. Try fish or duck if chronic itching shows up.",
    ],
  },
  "golden retriever": {
    species: "dog", lifespan: "10-12 years", energy: "high",
    summary: "Family-oriented, eager, strong retriever instinct. Like all retrievers, deserves attentive long-term care.",
    health: ["Hemangiosarcoma + lymphoma", "Hip/elbow dysplasia", "Hypothyroidism"],
    grooming: "Brush 2-3x/week; heavy shedding",
    exercise: "60-90 min/day, ideally including swimming",
    checklist: [
      { title: "Run hands over body, feel for new lumps", why: "Goldens have above-average cancer rates; early detection matters.", cadence: "weekly", category: "observe" },
    ],
  },
  "german shepherd": {
    species: "dog", lifespan: "9-13 years", energy: "high",
    summary: "Intelligent, working drive, deeply bonded. Needs structured training and a job.",
    health: ["Hip dysplasia (poorly bred lines)", "Degenerative myelopathy", "Bloat (GDV)"],
    grooming: "Brush 2-3x/week; double coat blows seasonally",
    exercise: "60-90 min/day + mental work",
    checklist: [
      { title: "Watch for hindquarter weakness or knuckling", why: "Degenerative myelopathy starts in the rear.", cadence: "weekly", category: "observe" },
    ],
  },
  "poodle": {
    species: "dog", lifespan: "12-15 years (standard); 14-18 (mini/toy)", energy: "moderate-high",
    summary: "Highly intelligent, low-shedding curly coat, three sizes.",
    health: ["Addison's disease", "Bloat in standards", "Sebaceous adenitis"],
    grooming: "Pro grooming every 4-6 weeks; daily brush at home",
    exercise: "45-60 min/day",
    checklist: [
      { title: "Check ears for moisture/odor", why: "Poodle ears trap water; otitis externa is breed-prevalent.", cadence: "weekly", category: "observe" },
    ],
  },
  "bulldog": {
    species: "dog", lifespan: "8-10 years", energy: "low",
    displayName: "Bulldogs", brachycephalic: true,
    origin: "England · 1500s",
    originStory: "Originally bred for bull-baiting (banned 1835). Refined post-ban into a companion breed but the squat, broad-skulled phenotype was retained. Modern Bulldogs are dramatically reshaped from their working ancestors.",
    summary: "Mellow, stubborn, brachycephalic. Most are C-section born; thermoregulation is poor.",
    health: ["BOAS", "Hip dysplasia", "Skin fold dermatitis", "Cherry eye"],
    grooming: "Daily face/tail-fold cleaning; minimal coat care",
    exercise: "20 min/day; AVOID heat",
    checklist: [
      { title: "Clean face folds + tail pocket", why: "Skin-fold dermatitis is the #1 vet visit reason.", cadence: "daily", category: "care" },
    ],
  },
  "rottweiler": {
    species: "dog", lifespan: "9-10 years", energy: "moderate",
    summary: "Confident, loyal, working background. Substantial training commitment.",
    health: ["Osteosarcoma (bone cancer)", "Hip + elbow dysplasia", "Bloat"],
    grooming: "Weekly brush",
    exercise: "60+ min/day",
    checklist: [
      { title: "Watch for sudden lameness on a single leg", why: "Osteosarcoma often presents as 'limping that won't go away'.", cadence: "weekly", category: "observe" },
    ],
  },
  "beagle": {
    species: "dog", lifespan: "12-15 years", energy: "high",
    summary: "Pack-bonded scenthounds, vocal, food-driven, hard to recall on a scent.",
    health: ["Obesity", "Epilepsy", "IVDD", "Hypothyroidism"],
    grooming: "Weekly brush; clean ears (prone to infections)",
    exercise: "60 min/day on-leash or fenced",
    checklist: [
      { title: "Body-condition score (Beagles overestimate hunger)", why: "Beagles are #2 obesity breed after Labs.", cadence: "weekly", category: "observe" },
    ],
  },
  "dachshund": {
    species: "dog", lifespan: "12-16 years", energy: "moderate",
    summary: "Bold, scent-driven, long-backed. Spinal anatomy is the dominant care concern.",
    health: ["IVDD (1 in 4 affected)", "Obesity", "Patellar luxation"],
    grooming: "Weekly brush",
    exercise: "30-45 min/day; AVOID jumping off furniture",
    checklist: [
      { title: "Use a ramp instead of letting them jump off the couch", why: "1 in 4 Dachshunds have an IVDD episode in life.", cadence: "daily",  category: "safety" },
      { title: "Watch for refusing stairs or arched back",              why: "Earliest IVDD signs.",                          cadence: "weekly", category: "observe" },
    ],
    tips: [
      "Pet stairs and ramps everywhere — couch, bed, car. The Dodger Doxie 'Frosty Paws' route to the floor is a back injury waiting to happen.",
      "Crate them when you're not home. Most IVDD episodes happen during unsupervised jumping.",
      "If you see your Dachshund drag a back leg or yelp when picked up, treat as a spinal emergency. Time-to-surgery is the strongest predictor of recovery.",
      "Keep them lean. Every extra pound is real stress on the spine.",
    ],
  },
  "yorkshire terrier": {
    species: "dog", lifespan: "13-16 years", energy: "moderate",
    summary: "Tiny, bold, hypoallergenic-ish coat. Hypoglycemia risk in puppies.",
    health: ["Patellar luxation", "Tracheal collapse", "Severe dental disease", "Portosystemic shunt"],
    grooming: "Daily brush if long coat; pro grooming every 4-6 weeks",
    exercise: "30 min/day",
    checklist: [
      { title: "Brush teeth daily",         why: "Yorkies lose teeth young from periodontal disease.", cadence: "daily",  category: "care" },
      { title: "Use a harness, never a collar", why: "Tracheal collapse risk is high.",               cadence: "always", category: "safety" },
    ],
    tips: [
      "Keep Karo syrup or honey on hand for Yorkie puppies. Hypoglycemic episodes can be reversed with a dab on the gums while you call the vet.",
      "Tiny Yorkies cannot regulate body temp well in winter. Sweaters/coats below 40°F.",
      "If you hear a 'goose-honk' cough when excited, that's tracheal collapse. Talk to vet about cough suppressants + harness use.",
      "Many owners feed 3-4 small meals/day in the first year to prevent low blood sugar.",
    ],
  },
  // Added in expanded catalog ─────────────────────────────────────────────
  "chow chow": {
    species: "dog", lifespan: "8-12 years", energy: "low-moderate",
    displayName: "Chow Chows",
    origin: "Northern Asia · ancient lineage (origin actively debated)",
    originStory: "Chow Chow origin is genuinely contested. Three lineages have been proposed in the literature:\n\n• Han Chinese mastiff/working-dog descent — the most common framing in popular accounts and breed-club histories.\n• Tibetan mastiff lineage — proposed by some genetic studies that show shared markers with Tibetan working dogs.\n• Siberian/Russian spitz descent — proposed by other genetic and morphological studies that group Chows closer to the spitz family of Northern Asia.\n\nModern genetic research suggests connections to multiple ancient dog populations across Northern Asia rather than a single point of origin. The breed's exact lineage remains an active area of canine genetic research. The famous purple-blue tongue is genetically linked to oral pigmentation that develops at 8-10 weeks; both Chows and Shar-Peis share this trait.",
    brachycephalic: true,
    summary: "Aloof, dignified, ancient Northern Asian breed with a famous purple-blue tongue. Reserved with strangers, deeply loyal to family. Brachycephalic snout + thick double coat = serious heat risk. Eye and skin issues are breed-specific concerns.",
    references: [
      { label: "AKC Chow Chow breed standard", url: "https://www.akc.org/dog-breeds/chow-chow/" },
      { label: "Chow Chow Club Inc. (AKC parent club)", url: "https://chowclub.org/" },
      { label: "Cornell Canine Health Information Center", url: "https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center" },
    ],
    health: ["Entropion (eyelids roll inward — surgical correction often needed)", "Ectropion (eyelids roll outward, less common)", "Hip + elbow dysplasia", "Autoimmune skin disease (pemphigus foliaceus)", "Heat stroke (thick coat + short muzzle)", "Bloat (GDV)", "Hypothyroidism"],
    grooming: "Brush 2-3x/week; rough-coat Chows need more during shedding seasons. Pro groomer every 6-8 weeks. NEVER shave the double coat — it ruins thermoregulation.",
    exercise: "30-60 min/day in cool weather only — Chows overheat fast",
    checklist: [
      { title: "Check eyelids for inward rolling or excess tearing", why: "Entropion is breed-prevalent; corneal ulcers result if untreated.", cadence: "weekly", category: "observe" },
      { title: "Run hands through coat against the grain — feel for crusts or hot spots", why: "Pemphigus and other autoimmune skin issues are over-represented in Chows.", cadence: "weekly", category: "observe" },
      { title: "Limit outdoor time when temp is above 75°F", why: "Thick double coat + short muzzle = heat stroke faster than most breeds.", cadence: "always", category: "safety" },
      { title: "Acclimate to handling — paws, mouth, ears, nail trims", why: "Chow temperament makes vet visits and grooming hard if not normalized young.", cadence: "weekly", category: "care" },
    ],
    tips: [
      "Use an elevated/raised feeder at chest height. Most experienced Chow owners switch to elevated bowls by adulthood — Chows are deep-chested and bloat is a real GDV risk.",
      "Entropion or ectropion surgery typically runs $500-1,500 per eye and is often needed by age 2-3. Get a second vet opinion before scheduling — some mild cases can be managed without surgery.",
      "Hot spots flare fast in summer humidity, especially under the mane and tail base. Keep a chlorhexidine medicated shampoo on hand and clip fur around any flare immediately.",
      "Many Chows are allergic to chicken, beef, or lamb. If you see chronic ear infections, paw licking, or recurring hot spots, ask your vet about a fish or novel-protein elimination diet.",
      "'The big malt' happens twice a year — usually spring and fall. Expect 2-3 weeks of intense undercoat shedding. Daily brushing during the malt is mandatory — undercoat rakes work better than slicker brushes.",
      "Chows are aloof, not aggressive. Don't force them to greet strangers or accept petting from people they don't know. Trust their judgment about people; this is a feature, not a flaw.",
      "Most Chows pick a 'best person' in the household and prefer that person over everyone else. This is normal Chow behavior — don't take it personally if you're not the chosen one.",
      "Train recall, leash manners, and handling early. Stubbornness sets in by 6 months. Adult Chows are notoriously hard to retrain.",
      "Most experienced owners recommend pet insurance specifically for entropion + hip dysplasia coverage. Get the policy before symptoms appear or those become pre-existing.",
      "Chow Chow Owners groups on Facebook are an underrated resource for breeder vetting, hot spot routines, and surgical recovery tips. Search 'Chow Chow Club Inc' for the AKC parent club's resources.",
    ],
  },
  "german shorthaired pointer": {
    species: "dog", lifespan: "12-14 years", energy: "very high",
    summary: "Versatile gun dog — runs, swims, points, retrieves. Will literally run themselves to exhaustion. Not a city apartment breed.",
    health: ["Hip dysplasia", "Bloat (deep chest)", "Lymphedema", "Entropion"],
    grooming: "Weekly brush; minimal coat care",
    exercise: "90+ min/day vigorous + mental work",
    checklist: [
      { title: "Mental enrichment — scent work, puzzle feeder, training session", why: "Under-stimulated GSPs become destructive.", cadence: "daily", category: "care" },
    ],
  },
  "pembroke welsh corgi": {
    species: "dog", lifespan: "12-14 years", energy: "moderate-high",
    summary: "Stocky, long-backed herder. Prone to back issues + obesity. Famously vocal.",
    health: ["IVDD (long back)", "Obesity (huge appetite)", "Degenerative myelopathy", "Hip dysplasia"],
    grooming: "Brush 2-3x/week; double coat sheds heavily",
    exercise: "60 min/day",
    checklist: [
      { title: "Body-condition check — Corgis hide weight in the coat", why: "Obesity stresses the long back + accelerates IVDD.", cadence: "weekly", category: "observe" },
      { title: "Discourage jumping off couches/beds", why: "Long back + short legs = disc disease risk.", cadence: "daily", category: "safety" },
    ],
  },
  "australian shepherd": {
    species: "dog", lifespan: "12-15 years", energy: "very high",
    summary: "Working herder. Needs a job. Without one, they herd children, cars, vacuums.",
    health: ["MDR1 gene mutation (drug sensitivity — tell your vet)", "Hip dysplasia", "Epilepsy", "Cataracts", "Collie eye anomaly"],
    grooming: "Brush 2x/week; sheds heavily",
    exercise: "90+ min/day + mental work",
    checklist: [
      { title: "Tell every vet about MDR1 gene status", why: "Common drugs (ivermectin, loperamide) can be fatal to MDR1+ Aussies. Get tested.", cadence: "always", category: "safety" },
    ],
  },
  "cavalier king charles spaniel": {
    species: "dog", lifespan: "9-14 years", energy: "moderate",
    summary: "Affectionate lap dog, gentle, loves people. Regular cardiac screening is part of responsible ownership for this breed.",
    health: ["Mitral valve disease (~50% by age 5)", "Syringomyelia (skull-too-small condition)", "Hip dysplasia", "Patellar luxation"],
    grooming: "Brush 2-3x/week; ear cleaning weekly",
    exercise: "30-60 min/day",
    checklist: [
      { title: "Listen for new coughing or exercise intolerance", why: "Mitral valve disease is breed-defining; early ACE inhibitors extend life.", cadence: "weekly", category: "observe" },
      { title: "Note any unexplained scratching of head/neck (air-scratching)", why: "Hallmark sign of syringomyelia.", cadence: "weekly", category: "observe" },
    ],
  },
  "doberman pinscher": {
    species: "dog", lifespan: "10-13 years", energy: "high",
    summary: "Loyal, alert, athletic. Cardiac screening is part of routine care for this breed.",
    health: ["Dilated cardiomyopathy (DCM)", "Bloat", "Wobbler syndrome (cervical spine)", "Von Willebrand's disease"],
    grooming: "Weekly brush; minimal",
    exercise: "60-90 min/day",
    checklist: [
      { title: "Watch for sudden weakness, fainting, or rapid breathing", why: "Dobermans need extra care due to heightened cardiac risk — annual screening matters.", cadence: "weekly", category: "observe" },
    ],
    tips: [
      "Annual cardiac echo + Holter monitor starting at age 2 is the standard recommendation from the Doberman Pinscher Club of America. Catches DCM before symptoms.",
      "Pimobendan (Vetmedin) extends life significantly when DCM is caught early. Worth asking even before symptoms.",
      "Crate-training is non-negotiable for high-drive Dobermans. Bored Dobies redecorate.",
      "Most experienced owners recommend at least 90 min/day of structured exercise + a daily training session.",
    ],
  },
  "boxer": {
    species: "dog", lifespan: "10-12 years", energy: "high",
    summary: "Playful, exuberant, brachycephalic-ish. Worth knowing the breed-specific health considerations as they age.",
    health: ["Mast cell tumors + lymphoma", "Aortic stenosis", "Hip dysplasia", "Boxer cardiomyopathy"],
    grooming: "Weekly brush; minimal",
    exercise: "60-90 min/day; AVOID heat",
    checklist: [
      { title: "Run hands over skin — mast cell tumors look like bug bites", why: "Boxers need extra care due to heightened skin tumor risk — monthly lump checks help catch issues early.", cadence: "weekly", category: "observe" },
    ],
  },
  "siberian husky": {
    species: "dog", lifespan: "12-14 years", energy: "very high",
    summary: "Pack dog, escape artist, vocal. Built for cold weather — heat is dangerous.",
    health: ["Hip dysplasia", "Hereditary cataracts + corneal dystrophy", "Hypothyroidism", "Zinc-responsive dermatosis"],
    grooming: "Brush 2-3x/week; blows coat 2x/year MASSIVELY",
    exercise: "90+ min/day; needs to RUN",
    checklist: [
      { title: "Check yard fence + gate — Huskies are master escape artists", why: "Top breed lost-dog statistic.", cadence: "weekly", category: "safety" },
    ],
    tips: [
      "Concrete-base your fence or bury chicken wire 1ft down. Huskies dig under more often than they jump over.",
      "Always GPS-tag the collar. AirTag + a Tractive subscription is what most owners settle on.",
      "Huskies CANNOT swim well — heavy double coat waterlogs. Don't trust them in pools.",
      "Coat 'blows' twice a year. Plan for a vacuum in every room and a Furminator session every few days for 2-3 weeks.",
      "Many Huskies do better with a second dog — they're pack animals, and lonely Huskies sing the song of their people.",
    ],
  },
  "great dane": {
    species: "dog", lifespan: "8-10 years", energy: "moderate",
    summary: "Gentle giant. Their size means proactive care for joints and heart matters from day one.",
    health: ["Bloat (GDV) — top concern", "Dilated cardiomyopathy", "Wobbler syndrome", "Heightened bone cancer risk — early lameness deserves attention"],
    grooming: "Weekly brush; minimal",
    exercise: "30-60 min/day moderate; growing puppies need controlled exercise",
    checklist: [
      { title: "Feed 2-3 small meals (not one large) + no exercise within 1h of eating", why: "Great Danes need extra care due to heightened bloat (GDV) risk — knowing the signs is essential.", cadence: "always", category: "safety" },
      { title: "Discuss prophylactic gastropexy with your vet", why: "Reduces bloat/torsion risk dramatically; common practice in Danes.", cadence: "once", category: "care" },
    ],
    tips: [
      "Most Dane owners get a prophylactic gastropexy done at the spay/neuter appointment. Call ahead — not every vet does it.",
      "Puppy growth needs to be SLOW. Adult-formula or large-breed-puppy food only. Free-feeding is a recipe for orthopedic problems.",
      "Great Danes have shorter lifespans than smaller breeds — make every year count with proactive joint and heart care.",
      "Their tails clear coffee tables. Plan furniture accordingly.",
    ],
  },
  "shih tzu": {
    species: "dog", lifespan: "10-16 years", energy: "low-moderate",
    summary: "Affectionate lap breed, brachycephalic. Eyes and dental health are daily concerns.",
    health: ["BOAS (mild)", "Eye ulcers (protruding eyes)", "Severe dental disease", "Patellar luxation", "IVDD"],
    grooming: "Daily brush + eye wipe; pro grooming every 4-6 weeks",
    exercise: "30 min/day; AVOID heat",
    checklist: [
      { title: "Wipe eyes daily with damp cotton", why: "Tear staining + corneal ulcer risk from protruding eyes.", cadence: "daily", category: "care" },
      { title: "Brush teeth — small mouths + crowded teeth = early periodontal disease", why: "Shih Tzus lose teeth young.", cadence: "daily", category: "care" },
    ],
  },
  "bernese mountain dog": {
    species: "dog", lifespan: "7-10 years", energy: "moderate",
    summary: "Calm giant, family-oriented. Like other large breeds, requires extra attention to long-term health.",
    health: ["Elevated cancer risk (histiocytic sarcoma + others) — talk to your vet about screening cadence", "Hip + elbow dysplasia", "Bloat"],
    grooming: "Brush 2-3x/week; heavy shedding",
    exercise: "30-60 min/day",
    checklist: [
      { title: "Lump check — feel for new masses anywhere on the body", why: "Berners need extra care due to heightened cancer risk — early screening matters most.", cadence: "weekly", category: "observe" },
    ],
    tips: [
      "The Berner-Garde Foundation tracks breed health data and is a strong resource for owners.",
      "Slow exercise growth — long walks under 1 year can damage growing joints. Stick to short bursts.",
      "Their coat doesn't insulate them from heat well. A/C in summer; baby pool in shade.",
      "Persistent lameness or lethargy past age 5 deserves prompt vet attention — early detection makes the biggest difference.",
    ],
  },
  "pomeranian": {
    species: "dog", lifespan: "12-16 years", energy: "moderate",
    summary: "Tiny puffball with a big personality. Dental and tracheal issues dominate.",
    health: ["Severe dental disease", "Tracheal collapse", "Patellar luxation", "Alopecia X (coat loss)"],
    grooming: "Brush 2-3x/week; pro grooming every 8 weeks",
    exercise: "30 min/day",
    checklist: [
      { title: "Brush teeth daily",                     why: "Tiny mouth = severe periodontal disease young.", cadence: "daily",  category: "care" },
      { title: "Use a harness, never a collar",         why: "Tracheal collapse risk.",                       cadence: "always", category: "safety" },
    ],
  },
  "boston terrier": {
    species: "dog", lifespan: "11-13 years", energy: "moderate",
    displayName: "Boston Terriers", brachycephalic: true,
    origin: "Boston, USA · 1870s",
    summary: "Friendly, mostly indoor breed, brachycephalic. Eye trauma risk from protruding eyes.",
    health: ["Brachycephalic airway", "Corneal ulcers", "Patellar luxation", "Allergies"],
    grooming: "Weekly brush; clean face fold; eye wipe daily",
    exercise: "30-60 min/day; AVOID heat",
    checklist: [
      { title: "Eye check — protruding eyes are easily scratched", why: "Boston Terriers are top of corneal-ulcer ER stats.", cadence: "weekly", category: "observe" },
    ],
  },
  "havanese": {
    species: "dog", lifespan: "14-16 years", energy: "moderate",
    summary: "Cheerful, low-shedding lap breed. Eye and joint issues are the main concerns.",
    health: ["Patellar luxation", "Cataracts", "Hip dysplasia", "Legg-Calve-Perthes disease"],
    grooming: "Daily brush if long coat; pro grooming every 6-8 weeks",
    exercise: "30 min/day",
    checklist: [],
  },
  "border collie": {
    species: "dog", lifespan: "12-15 years", energy: "very high",
    summary: "The world's smartest dog breed. Without a job, they invent stressful ones.",
    health: ["Collie eye anomaly", "Hip dysplasia", "Epilepsy", "MDR1 (less than Aussies but still possible)"],
    grooming: "Brush 2-3x/week",
    exercise: "120+ min/day + mental work — most under-exercised breed for its capability",
    checklist: [
      { title: "Mental enrichment session — training, scent work, puzzle", why: "BCs need brain work as much as body work; without it they spin obsessively.", cadence: "daily", category: "care" },
    ],
  },
  "shetland sheepdog": {
    species: "dog", lifespan: "12-14 years", energy: "high",
    summary: "Smaller, vocal cousin of the Collie. Eye and gene-sensitivity issues run in the breed.",
    health: ["Collie eye anomaly", "MDR1", "Hip dysplasia", "Dermatomyositis"],
    grooming: "Brush 2-3x/week; double coat sheds",
    exercise: "60 min/day",
    checklist: [
      { title: "Tell vets about MDR1 status", why: "Common drugs can be fatal to MDR1+ dogs.", cadence: "always", category: "safety" },
    ],
  },
  "miniature schnauzer": {
    species: "dog", lifespan: "12-15 years", energy: "moderate",
    summary: "Spunky, alert, hypoallergenic-ish wiry coat. Pancreatitis and bladder stones are breed-prevalent.",
    health: ["Hyperlipidemia → pancreatitis", "Bladder stones", "Diabetes", "Cataracts"],
    grooming: "Pro grooming every 6-8 weeks; daily face beard wipe",
    exercise: "45-60 min/day",
    checklist: [
      { title: "Avoid fatty foods + table scraps", why: "Schnauzers' lipid metabolism predisposes them to pancreatitis.", cadence: "always", category: "safety" },
    ],
  },
  "cocker spaniel": {
    species: "dog", lifespan: "12-15 years", energy: "moderate",
    summary: "Sweet, sensitive, floppy-eared. Ear care is a daily commitment.",
    health: ["Chronic ear infections", "Cataracts + glaucoma", "Hip dysplasia", "Cocker rage syndrome (rare)"],
    grooming: "Brush 2-3x/week; pro grooming every 6-8 weeks; clean ears 2x/week",
    exercise: "45-60 min/day",
    checklist: [
      { title: "Lift ears + check for odor/redness", why: "Floppy ears trap moisture; otitis externa is breed-defining.", cadence: "twice/week", category: "observe" },
    ],
  },
  "english springer spaniel": {
    species: "dog", lifespan: "12-14 years", energy: "high",
    summary: "Birdy, athletic, family-oriented. Same ear issues as the Cocker.",
    health: ["Hip dysplasia", "Ear infections", "PRA (eye)", "Phosphofructokinase deficiency"],
    grooming: "Brush 2x/week; clean ears twice weekly",
    exercise: "60-90 min/day",
    checklist: [
      { title: "Ear check (lift + smell + look)", why: "Drop ears trap moisture; chronic otitis is breed-prevalent.", cadence: "twice/week", category: "observe" },
    ],
  },
  "brittany": {
    species: "dog", lifespan: "12-14 years", energy: "very high",
    summary: "Compact, athletic gun dog. Generally healthy but needs serious daily exercise.",
    health: ["Hip dysplasia", "Epilepsy"],
    grooming: "Weekly brush",
    exercise: "90+ min/day",
    checklist: [],
  },
  "cane corso": {
    species: "dog", lifespan: "9-12 years", energy: "moderate",
    summary: "Italian mastiff, working guardian, deeply bonded. Substantial training commitment.",
    health: ["Hip + elbow dysplasia", "Bloat", "Idiopathic epilepsy", "Cherry eye"],
    grooming: "Weekly brush",
    exercise: "60-90 min/day",
    checklist: [
      { title: "Feed 2-3 small meals; no vigorous exercise within 1h of eating", why: "Bloat is a real risk in deep-chested breeds.", cadence: "always", category: "safety" },
    ],
  },

  // Designer / mixed breeds ────────────────────────────────────────────────
  // Each entry calls out the mix's lineage, the realistic coat-genetics
  // expectations (F1/F1B/F2 differences in shedding + matting), and the
  // health risks inherited from BOTH parent breeds. Hybrid vigor is real
  // but not a free pass — these are honest care plans for owners who
  // want the truth about their doodle/mix.
  "goldendoodle": {
    species: "dog", lifespan: "10-15 years", energy: "high",
    displayName: "Goldendoodles",
    origin: "United States · 1990s (designer cross)",
    summary: "Golden Retriever × Poodle. Friendly, food-motivated, social. Coat genetics vary wildly between F1, F1B, and F2 generations — shedding and matting differ accordingly. Inherits hip dysplasia and cancer risk from the Golden side, plus eye and joint issues from the Poodle side.",
    health: ["Hip + elbow dysplasia (both parents)", "Subaortic stenosis (cardiac — Golden side)", "Heightened cancer risk (Golden side)", "Patellar luxation (Poodle side)", "Progressive retinal atrophy", "Addison's disease (Poodle side)", "Severe matting if coat not maintained"],
    grooming: "Daily brushing for low-shed (F1B) coats — matting is fast and painful. Pro grooming every 6-8 weeks ($60-150/visit).",
    exercise: "60-90 min/day — Goldendoodles are working dogs at heart and get destructive when bored.",
    checklist: [
      { title: "Brush coat thoroughly down to the skin", why: "F1B / multi-gen doodle coats mat in days. Mats pull skin and cause hot spots.", cadence: "daily", category: "care" },
      { title: "Lump check — feel for new masses anywhere on the body", why: "Golden parentage means elevated cancer risk; early detection matters.", cadence: "weekly", category: "observe" },
      { title: "Watch joints — limping, stiffness on rising, reluctance to jump", why: "Hip + elbow dysplasia comes from both parent breeds.", cadence: "weekly", category: "observe" },
    ],
    tips: [
      "F1 (50/50) Goldendoodles often shed more than owners expect; F1B (75% Poodle) is the lowest-shedding cross. Ask your breeder which generation they're producing — it changes daily care substantially.",
      "Mandatory daily brushing once the puppy coat blows out (around 6-10 months). Owners who skip this end up with a fully matted dog requiring a strip-shave at the groomer's.",
      "Both parent breeds have OFA hip + elbow + cardiac + eye certifications available. Ask your breeder for the parents' OFA results before committing — reputable breeders test, backyard breeders don't.",
      "Goldendoodle Association of North America (GANA) maintains a breeder directory with health-testing requirements — far more reliable than Instagram or backyard sources.",
      "Joint supplements (glucosamine + chondroitin + omega-3) have decent evidence in Goldens; talk to your vet about starting around age 5.",
      "Food allergies are over-represented — chronic ear infections, paw licking, or recurring hot spots warrant an elimination diet trial.",
      "Goldendoodles are not hypoallergenic, despite the marketing. People with severe dog allergies should spend several hours with the actual dog before buying.",
    ],
  },
  "labradoodle": {
    species: "dog", lifespan: "12-14 years", energy: "high",
    displayName: "Labradoodles",
    origin: "Australia · 1989 (Wally Conron, Royal Guide Dogs)",
    summary: "Labrador × Poodle. Originally bred as a hypoallergenic guide dog. Friendly, water-loving, athletic. Coat unpredictability is the defining feature — straight, wavy, or curly all appear in the same litter.",
    health: ["Hip + elbow dysplasia", "Progressive retinal atrophy", "Addison's disease (Poodle side)", "Exercise-induced collapse (Lab side)", "Obesity (Lab side)", "Bloat (deep-chested)", "Severe matting if coat not maintained"],
    grooming: "Coat-type dependent — straight coats need weekly brushing, curly coats daily. Pro groom every 6-8 weeks regardless.",
    exercise: "60-90 min/day, including water work where possible.",
    checklist: [
      { title: "Body condition score — Labradoodles inherit Lab obesity risk", why: "Labs are the #1 obesity-prone breed; the Poodle side doesn't fully cancel that.", cadence: "weekly", category: "observe" },
      { title: "Brush thoroughly down to the skin (curly coats — daily; straight — 2-3x/week)", why: "Matting causes hot spots and skin infections.", cadence: "varies", category: "care" },
      { title: "Watch for limping or reluctance to jump", why: "Hip + elbow dysplasia is over-represented in both parent breeds.", cadence: "weekly", category: "observe" },
    ],
    tips: [
      "Wally Conron — the Australian breeder who created the first Labradoodle in 1989 — has publicly regretted starting the trend, citing health issues from poor breeder vetting. The lesson: the doodle itself isn't bad, the unregulated breeding boom is. Vet your breeder.",
      "Coat type is genuinely random in F1 Labradoodles. F1 = unpredictable, F1B = more curly + lower shed, multi-generational = more consistent. If shedding matters, F1B or later is the safer pick.",
      "Australian Labradoodles (a separate breed standard) include Cocker Spaniel and Irish Water Spaniel in the lineage — they're more consistent but often more expensive.",
      "Both parent breeds need OFA hip + elbow + eye clearances. Don't accept 'parents are healthy' from a breeder — ask for the OFA registration numbers.",
      "Bloat risk is moderate (deeper chest from Lab parent). Use slow-feeder bowls and avoid vigorous exercise within 1 hour of meals.",
      "Food motivation comes from the Lab side; portion control matters more than for most breeds. A 60-lb adult Labradoodle should eat substantially less than people often think.",
      "Like Goldendoodles, not hypoallergenic by default — F1B or later generations are lowest-shed. Spend time with the dog before committing if allergies are a concern.",
    ],
  },
  "bernedoodle": {
    species: "dog", lifespan: "12-15 years", energy: "moderate",
    displayName: "Bernedoodles",
    origin: "Canada · 2003 (Sherry Rupke, SwissRidge Kennels)",
    summary: "Bernese Mountain Dog × Poodle. Crossbreeds like the Bernedoodle often live longer than purebred Bernese (which average just 7-10 years), partly because they inherit a smaller frame than the larger parent and partly because outbreeding can reduce some inherited risks. The Bernese's joint and cancer concerns can still appear in Bernedoodles, just often at lower rates. Calm temperament, low-shedding coats in F1B+. Discuss specific health screening with your vet and breeder.",
    health: ["Hip + elbow dysplasia (Bernese side; outbreeding can lower the rate but does not eliminate it)", "Cancer (often lower than purebred Bernese rates but still worth proactive screening)", "Heart issues including subaortic stenosis (cardiac auscultation by a board-certified cardiologist on every puppy is the breed-club standard)", "Skin allergies", "Bloat (deep chest — discuss prophylactic gastropexy with your vet at spay/neuter)", "Severe matting if coat not maintained"],
    grooming: "Daily brushing (curly coats) or 2-3x/week (wavy). Professional grooming every 6-8 weeks.",
    exercise: "45-60 min/day. Slow exercise growth before age 2 — long walks too early can damage growing joints (especially Standard Bernedoodles >55 lb).",
    checklist: [
      { title: "Brush thoroughly down to the skin", why: "Bernedoodle coats mat fast — daily for curly, 2-3x/week for wavy.", cadence: "daily", category: "care" },
      { title: "Lump check — feel for new masses anywhere on the body", why: "Bernese parentage carries elevated cancer risk; the Poodle cross reduces but does not eliminate it.", cadence: "weekly", category: "observe" },
      { title: "Watch joints — limping or reluctance to climb stairs", why: "Hip + elbow dysplasia is the most common Bernedoodle orthopedic issue.", cadence: "weekly", category: "observe" },
    ],
    tips: [
      "Bernedoodles come in three sizes: Standard (50-90 lb), Mini (25-50 lb), and Tiny (10-24 lb). The smaller sizes use Mini and Toy Poodles in the cross — health profiles shift accordingly (smaller doodles have more dental and patellar issues; larger ones have more joint and bloat issues).",
      "F1 Bernedoodles are 50% Bernese and inherit more of the cancer risk; F1B (75% Poodle) is generally healthier and lower-shedding. F1B is the most common production cross for a reason.",
      "Lifespan extension is the real selling point: a Standard Bernedoodle commonly lives 12-15 years vs 7-10 for a purebred Bernese. The Poodle side genuinely improves longevity.",
      "Slow exercise growth before age 2. Avoid stairs, jumping off couches/beds, and long-distance running until growth plates close (around 18-24 months for larger sizes).",
      "The Berner-Garde Foundation tracks health outcomes for Bernese-related breeds and is a strong resource for owners.",
      "Both parents should be OFA hip + elbow + cardiac certified, and the Bernese parent should be screened for histiocytic sarcoma family history.",
      "Persistent lameness or lethargy past age 5 deserves prompt vet attention — early detection makes the biggest difference for the cancers Bernese-line dogs are predisposed to.",
    ],
  },
  "cockapoo": {
    species: "dog", lifespan: "12-15 years", energy: "moderate",
    displayName: "Cockapoos",
    origin: "United States · 1950s (oldest of the modern doodle crosses)",
    summary: "Cocker Spaniel × Poodle. The original 'designer dog' — the cross has been bred since the 1950s, predating the doodle boom. Affectionate, sociable, smaller than most doodles. Coat ranges from straight (Cocker side) to curly (Poodle side).",
    health: ["Eye issues (cherry eye, PRA, cataracts)", "Ear infections (long pendulous ears + curly coat traps moisture)", "Patellar luxation", "Hip dysplasia (Cocker side more than Poodle)", "Liver disease (hepatic issues run in Cocker lineage)", "Severe matting if coat not maintained"],
    grooming: "Daily brushing for curly coats; 2-3x/week for wavy. Pro grooming every 6-8 weeks ($50-100/visit).",
    exercise: "30-60 min/day. Less than Goldendoodle/Labradoodle — Cockapoos are more comfortable as companion dogs than working partners.",
    checklist: [
      { title: "Ear check — sniff and look for redness or discharge", why: "Cockapoos are over-represented in chronic ear infections (pendulous ears + curly coat).", cadence: "2-3x/week", category: "observe" },
      { title: "Brush coat thoroughly down to the skin, especially around ears + paws", why: "Matting traps moisture and worsens ear infections.", cadence: "daily", category: "care" },
      { title: "Eye check — watch for redness, cloudiness, or excessive tearing", why: "Both parent breeds have heightened eye-disease risk.", cadence: "weekly", category: "observe" },
    ],
    tips: [
      "Cockapoos predate the modern doodle craze — they've been bred since the 1950s, so genetics are more stable than newer designer crosses. The American Cockapoo Club maintains a breed standard.",
      "Ear infections are THE Cockapoo issue. Wipe ears weekly with a vet-approved ear cleaner, and trim or pluck the inner ear hair regularly (or have your groomer do it). Wet ears after baths or swimming need to be dried thoroughly.",
      "Three size variants depending on which Poodle parent: Toy (under 12 lb), Mini (13-18 lb), Standard (19+ lb). Smaller variants have more dental and patellar issues; larger have more joint issues.",
      "American Spaniel Club + the Poodle Club of America's parent-club health resources both apply — check the parents' eye certs, hip clearances, and PRA tests.",
      "Cocker rage syndrome (a rare neurological condition) appears in some lines of English and American Cocker Spaniels. It's uncommon but worth asking the breeder about the lineage.",
      "Coat color affects health — solid black or buff Cockapoos generally have fewer skin issues than parti-color or merle (which can carry the lethal merle gene if doubled).",
      "Cockapoos are easy to overfeed — they're food-motivated like Cockers but burn fewer calories than working doodles. A lean Cockapoo is a healthier Cockapoo.",
    ],
  },
  "cavapoo": {
    species: "dog", lifespan: "12-15 years", energy: "moderate",
    displayName: "Cavapoos",
    origin: "Australia · 1990s (also called Cavoodle in AU/UK)",
    summary: "Cavalier King Charles Spaniel × Poodle. Affectionate, playful, smaller than most doodles. Outbreeding can reduce the rate at which some Cavalier-line conditions appear, but the Cavalier's well-documented heart (mitral valve disease) and neurological (syringomyelia) concerns can still surface in Cavapoos — discuss screening with your vet and breeder before assuming the cross eliminates risk.",
    health: ["Mitral valve disease — the breed-defining Cavalier risk; can appear in Cavapoos at lower-but-real rates. Annual cardiac auscultation from puberty onward; echocardiogram once a murmur appears", "Syringomyelia / Chiari-like malformation — Cavalier-line skull-too-small condition; hallmark sign is air-scratching the neck/shoulder while walking", "Patellar luxation", "Eye issues (cataracts, PRA) — annual ACVO eye exam", "Hip dysplasia (less than larger doodles)", "Dental disease (small crowded mouths)", "Severe matting if coat not maintained"],
    grooming: "Daily brushing for curly coats; 2-3x/week for wavy. Pro grooming every 6-8 weeks.",
    exercise: "30-45 min/day. Cavapoos are happy with shorter walks plus indoor play.",
    checklist: [
      { title: "Listen for cough or labored breathing after exercise", why: "Mitral valve disease (heart valve regurgitation) is Cavapoos' #1 inherited risk; cough at rest or after exertion is the earliest sign.", cadence: "weekly", category: "observe" },
      { title: "Watch for unexplained yelping, scratching at the air, or head/neck tenderness", why: "Syringomyelia (a Cavalier-line neurological condition) presents as discomfort that owners often miss for months.", cadence: "weekly", category: "observe" },
      { title: "Brush teeth — small crowded mouths get periodontal disease early", why: "Cavapoos lose teeth young without daily dental care.", cadence: "daily", category: "care" },
    ],
    tips: [
      "Mitral valve disease (MVD) is THE Cavalier-lineage risk. Up to 50% of Cavaliers develop it by age 5, almost all by age 10. The Poodle cross reduces frequency but Cavapoos still need cardiac screening starting at age 5 — earlier if there's a parent-line history.",
      "Ask the breeder about the Cavalier parent's MRI status for syringomyelia. The Cavalier KCS Club's heart and SM screening protocols apply to one half of the genetics.",
      "F1B Cavapoos (75% Poodle) reduce Cavalier-side health issues meaningfully — worth the moderate price premium if you find a reputable F1B breeder.",
      "Cavapoos are velcro dogs — they don't tolerate alone time well. If you work long hours away, this is not your breed.",
      "Brachycephalic warning is mild — some Cavalier lines have shortened muzzles that can worsen heat tolerance. Less severe than a Frenchie or Pug but worth watching.",
      "Dental care is non-negotiable: small jaws + crowded teeth = periodontal disease by age 3 without daily brushing.",
      "Heart checks should be part of every annual exam from age 5 onward. Murmur grade I-II is often manageable; III+ deserves a cardiologist consult and possibly medication.",
    ],
  },
  "sheepadoodle": {
    species: "dog", lifespan: "12-15 years", energy: "high",
    displayName: "Sheepadoodles",
    origin: "United States · 2010s (designer cross)",
    summary: "Old English Sheepdog × Poodle. Large, fluffy, herding instinct. Often piebald black-and-white. Working-line energy means daily structured exercise is mandatory, not optional.",
    health: ["Hip + elbow dysplasia", "Bloat (deep chest)", "Eye issues (cataracts, PRA)", "Hypothyroidism", "Deafness in white-coated lines (rare)", "Severe matting if coat not maintained"],
    grooming: "Daily brushing — Sheepadoodle coats are dense and matt fast. Pro grooming every 4-6 weeks.",
    exercise: "60-90 min/day, ideally with structured activity (fetch, agility, herding ball games). Bored Sheepadoodles destroy things.",
    checklist: [
      { title: "Brush thoroughly down to the skin", why: "Sheepadoodle coats are notoriously matt-prone; daily is genuinely required.", cadence: "daily", category: "care" },
      { title: "Watch joints — limping, stiffness, reluctance to jump", why: "Hip + elbow dysplasia is over-represented in both parent breeds.", cadence: "weekly", category: "observe" },
      { title: "Feed 2-3 small meals; no vigorous exercise within 1h of eating", why: "Sheepadoodles are deep-chested; bloat is a real risk.", cadence: "always", category: "safety" },
    ],
    tips: [
      "Sheepadoodles are working-line dogs in cute clothing. They need a job — fetch routines, training drills, or structured play — or they invent their own (usually involving destruction).",
      "Herding instinct: many Sheepadoodles try to herd children, other pets, or running people. This is normal but needs early redirection or it becomes problematic.",
      "Coat maintenance is the single biggest commitment — far more than Goldendoodle or Labradoodle. Most owners adopt a 'puppy cut' clip every 6 weeks ($80-150) to keep maintenance manageable.",
      "Heat tolerance is poor due to dense double-coated genetics from the OES side. Avoid midday walks above 80°F; never shave (it ruins thermoregulation), use cooling vests instead.",
      "Both parents should have OFA hip + elbow clearances. The OES side adds a low risk of cerebellar ataxia worth asking about.",
      "Standard Sheepadoodles (50-80 lb) are by far the most common; Mini (24-44 lb) and Micro/Toy (10-24 lb) variants exist via Mini Poodle parents.",
      "Sheepadoodles often vocalize a lot — barking and 'arroo' yodeling are normal. If your living situation requires a quiet dog, consider a different breed.",
    ],
  },
  "aussiedoodle": {
    species: "dog", lifespan: "12-15 years", energy: "very high",
    displayName: "Aussiedoodles",
    origin: "United States · 2000s (designer cross)",
    summary: "Australian Shepherd × Poodle. Brilliant, athletic, intensely focused. Aussie-line MDR1 drug sensitivity is a critical genetic test to verify before any major medication. Not a beginner dog.",
    health: ["MDR1 drug sensitivity (Aussie side — must test before ivermectin, loperamide, others)", "Hip dysplasia", "Epilepsy (Aussie side)", "Eye issues (CEA — Collie Eye Anomaly, cataracts, PRA)", "Deafness in double-merle lines (avoid double-merle pairings entirely)", "Severe matting if coat not maintained"],
    grooming: "Daily brushing for curly coats; 2-3x/week for wavy. Pro grooming every 6-8 weeks.",
    exercise: "90-120 min/day MINIMUM. Plus mental work — Aussiedoodles are working dogs that need a job.",
    checklist: [
      { title: "MDR1 genetic test — confirm status before any new medication", why: "Aussie-line dogs can have life-threatening reactions to common drugs (ivermectin, loperamide, certain anesthetics). One-time cheek-swab test settles it forever.", cadence: "once (then verify before any new med)", category: "safety" },
      { title: "Watch for staring, twitching, or unexplained collapse episodes", why: "Epilepsy is over-represented in Aussie-line dogs; early seizure detection improves long-term management.", cadence: "weekly", category: "observe" },
      { title: "Provide 30+ minutes of mental exercise daily (training, puzzle toys, scent work)", why: "Aussiedoodles develop OCD-like behaviors (tail-chasing, light-fixation, shadow-chasing) when under-stimulated.", cadence: "daily", category: "care" },
    ],
    tips: [
      "MDR1 status is non-negotiable — get the genetic test from your vet or via Washington State University's testing program ($60). Without it, common drugs can be lethal.",
      "Aussiedoodles need WAY more exercise than the average doodle owner expects — 90+ min/day plus training is the minimum to keep them sane.",
      "Avoid any breeder doing merle × merle pairings (called 'double merle' — produces deaf and blind puppies and is widely considered unethical). Double-merle Aussiedoodles do exist; check both parents' coat colors.",
      "Aussie-line herding instinct is intense — they will herd children, joggers, cars. Need early redirection training.",
      "Mental stimulation matters as much as physical. Puzzle feeders, nose-work, and trick training prevent behavioral issues better than long walks alone.",
      "F1B Aussiedoodles (75% Poodle) tend to be slightly less intense and lower-shedding than F1.",
      "Both parents should have OFA hip + eye clearances and the MDR1 test. CEA (Collie Eye Anomaly) carrier status is also worth asking about.",
    ],
  },
  "maltipoo": {
    species: "dog", lifespan: "12-16 years", energy: "moderate",
    displayName: "Maltipoos",
    origin: "United States · 1990s (designer cross)",
    summary: "Maltese × Toy/Mini Poodle. Small, affectionate, lap-oriented. Coat is silky-to-curly depending on cross. Long-lived (small dogs generally are) but inherits dental and skeletal issues from both small parent breeds.",
    health: ["Patellar luxation (very common)", "Dental disease (small mouths, crowded teeth)", "Hypoglycemia (especially as puppies)", "White Shaker Syndrome (Maltese-line tremor disorder)", "Progressive retinal atrophy", "Tear staining", "Severe matting if coat not maintained"],
    grooming: "Daily brushing — Maltipoo coats matt very fast. Pro grooming every 4-6 weeks ($50-90/visit).",
    exercise: "20-40 min/day. Maltipoos are happy with short walks plus indoor play.",
    checklist: [
      { title: "Brush teeth — small mouths + crowded teeth = early periodontal disease", why: "Maltipoos can lose teeth before age 5 without daily dental care.", cadence: "daily", category: "care" },
      { title: "Wipe under eyes daily with a damp cloth", why: "Tear staining is universal in light-coated Maltipoos; daily wiping prevents fungal infections.", cadence: "daily", category: "care" },
      { title: "Watch for skipping or hopping on a back leg", why: "Patellar luxation (slipping kneecap) is over-represented in small designer crosses.", cadence: "weekly", category: "observe" },
    ],
    tips: [
      "Maltipoos under 5 lb are at real risk of hypoglycemia (low blood sugar) — especially as puppies. Keep meals frequent (3-4 small ones daily until 6 months) and watch for trembling, weakness, or seizure-like episodes.",
      "Tear staining is genetic, not dirty. The reddish-brown stains under the eyes come from porphyrin pigment in tears. Daily wiping with a damp cloth + grain-free diet helps; commercial 'tear stain' supplements have mixed evidence.",
      "Daily brushing or a short clip is essentially mandatory. Maltipoo coats matt overnight, especially around the face and ears.",
      "Patellar luxation grade I-II is often managed without surgery (joint supplements, weight management, controlled exercise). Grade III-IV usually needs surgical correction; ask for second opinions before scheduling.",
      "Avoid teacup or 'micro' Maltipoos under 4 lb — they're typically the runts of poorly-bred litters and have severe health issues.",
      "Both parent breeds should have OFA patella + eye certs. PRA (progressive retinal atrophy) is screenable with a DNA test.",
      "Maltipoos are one of the most apartment-friendly mixes — small, quiet (compared to Yorkies), low-exercise, and adapt well to indoor living.",
    ],
  },
  "puggle": {
    species: "dog", lifespan: "10-15 years", energy: "moderate",
    displayName: "Puggles",
    origin: "United States · 1990s (became wildly popular early-2000s)",
    summary: "Pug × Beagle. Friendly, food-motivated, vocal. The Beagle's longer muzzle reduces (but does not eliminate) the Pug's brachycephalic respiratory issues. Crossbreeds often live longer than purebred Pugs, partly because of the longer muzzle and partly because outbreeding can reduce some inherited risks — but Pug-line concerns can still appear. The breed peaked in popularity around 2005; most Puggles today come from older breeding lines or accidental crosses.",
    health: ["Brachycephalic respiratory issues (less severe than purebred Pug, still present)", "Hip dysplasia", "Cherry eye", "Patellar luxation", "Obesity (Beagle food drive + Pug low metabolism)", "Eye issues (corneal ulcers, dry eye)", "Epilepsy (Beagle side)"],
    grooming: "Weekly brush; double-coated Pug genetics means moderate seasonal shedding. Bathe monthly.",
    exercise: "30-45 min/day in cool weather. Heat tolerance is poor.",
    checklist: [
      { title: "Watch breathing during exercise — heavy panting at rest is not normal", why: "Puggles can inherit varying degrees of brachycephalic obstructive airway syndrome from the Pug side.", cadence: "weekly", category: "observe" },
      { title: "Body condition score — Puggles are obesity champions", why: "Beagle food drive + Pug low metabolism = most Puggles are overweight by middle age.", cadence: "weekly", category: "observe" },
      { title: "Wipe facial skin folds (if present) with a damp cloth", why: "Pug-side facial folds trap moisture and develop dermatitis if not cleaned.", cadence: "2-3x/week", category: "care" },
    ],
    tips: [
      "Heat tolerance is poor — Puggles can overheat at 80°F+ even on short walks. Brachycephalic-style precautions apply (avoid midday walks, no harnesses that compress the chest, never leave in cars).",
      "Most airlines refuse Puggles in cargo due to brachycephalic-related death risk. In-cabin only — confirm policy before booking.",
      "Obesity is the #1 Puggle issue. The Beagle's food motivation is intense; portion control + minimal table scraps is the only real defense.",
      "Cherry eye (prolapsed third eyelid gland) appears in many Puggles by age 1-2. Surgical replacement is usually $300-700/eye and is generally successful; never have it removed (causes lifelong dry eye).",
      "Beagle vocal genetics — Puggles bay, howl, and bark more than most owners expect. Apartment dwellers may struggle.",
      "The Puggle peak was 2005-2010; today's Puggles are mostly multi-generational or backyard-bred. Reputable breeders are rare. Rescue is often the better path.",
      "Annual eye exams matter — both parent breeds have heightened risk for corneal ulcers, cherry eye, and dry eye.",
    ],
  },
  "pomsky": {
    species: "dog", lifespan: "12-15 years", energy: "high",
    displayName: "Pomskies",
    origin: "United States · 2010s (artificial-insemination cross — natural mating is impossible due to size disparity)",
    summary: "Pomeranian × Siberian Husky. High-energy, vocal, escape-prone. Husky-line behavior in a Pomeranian-sized body. Coat is heavy double-coated and sheds substantially year-round.",
    health: ["Patellar luxation (Pom side)", "Hip dysplasia (Husky side)", "Eye issues (cataracts, PRA, juvenile cataracts)", "Dental disease (Pom small mouths)", "Hypoglycemia (Pom puppies)", "Skin allergies", "Tracheal collapse (Pom side)"],
    grooming: "2-3x/week brushing year-round; daily during seasonal blowouts (twice yearly). NEVER shave the double coat.",
    exercise: "60-90 min/day. Pomskies inherit Husky energy in a smaller frame and need real exercise.",
    checklist: [
      { title: "Secure the yard — Pomskies inherit Husky escape instinct", why: "Pomskies dig under fences, jump, and slip leashes. GPS tag the collar; never trust off-leash recall.", cadence: "always", category: "safety" },
      { title: "Watch for skipping or limping on a back leg", why: "Patellar luxation is the most common Pomsky orthopedic issue.", cadence: "weekly", category: "observe" },
      { title: "Daily brushing during shedding season; 2-3x/week otherwise", why: "Double coat sheds heavily; matting in the undercoat is uncomfortable and can hide skin issues.", cadence: "varies", category: "care" },
    ],
    tips: [
      "Pomskies are an artificial-insemination breed — natural Pom × Husky mating is physically impossible. This means most Pomskies are F2 or higher generation (Pomsky × Pomsky), which improves consistency but doesn't reduce the energy issues.",
      "Husky behavioral genetics dominate — vocal (howling, 'talking'), escape-prone, prey-drive toward small animals. If you have cats or rabbits, Pomsky may not work.",
      "Heavy shedding twice a year ('blowing the coat') — daily brushing during these 2-3 week periods is essential. NEVER shave the double coat; it doesn't grow back correctly and ruins thermoregulation.",
      "Most Pomskies fall between 15-30 lb adult weight. Pom-dominant pups stay smaller; Husky-dominant grow larger. Breeder predictions are unreliable until 6-8 weeks.",
      "Tracheal collapse is over-represented (Pom side). Use a HARNESS, never a neck collar — collar pressure can damage the trachea.",
      "Annual eye exams from age 1 — both parent breeds have heightened risk for juvenile cataracts and PRA.",
      "Pomsky Owners Association maintains a breeder ethics list and health-testing requirements. Avoid Instagram or backyard breeders entirely.",
    ],
  },
  // Generic fallbacks ─────────────────────────────────────────────────────
  "mixed": {
    species: "dog", lifespan: "12-14 years", energy: "varies",
    summary: "Mixed-breed dogs often enjoy hybrid vigor but inherit individual breed risks. Adjust based on what you suspect.",
    health: ["Highly variable"], grooming: "Match to coat type", exercise: "Match to size + observed energy", checklist: [],
  },
  "other dog": {
    species: "dog", lifespan: "varies", energy: "varies",
    summary: "Use the generic checklist + your vet's guidance.",
    health: [], grooming: "", exercise: "", checklist: [],
  },
};

const catBreedData = {
  "domestic shorthair": {
    species: "cat", lifespan: "12-18 years", energy: "moderate",
    summary: "America's most common cat — wide variation in personality, generally robust health.",
    health: ["Obesity", "Diabetes (in obese cats)", "Chronic kidney disease (senior)"],
    grooming: "Weekly brush",
    exercise: "Daily interactive play",
    checklist: [],
  },
  "domestic longhair": {
    species: "cat", lifespan: "12-18 years", energy: "moderate",
    summary: "Same robust mixed-cat genetics as DSH but with a longer coat — needs more grooming.",
    health: ["Obesity", "Hairballs", "Mat-related skin issues if neglected"],
    grooming: "Brush 3-4x/week",
    exercise: "Daily play",
    checklist: [
      { title: "Brush coat thoroughly — check for mats under armpits + belly", why: "Mats trap urine + can require shaving under sedation.", cadence: "3x/week", category: "care" },
    ],
  },
  "maine coon": {
    species: "cat", lifespan: "10-13 years", energy: "moderate",
    summary: "Largest domestic cat breed, dog-like personality, long coat. Cardiac screening recommended.",
    health: ["Hypertrophic cardiomyopathy (HCM)", "Hip dysplasia", "Spinal muscular atrophy"],
    grooming: "Brush 2-3x/week; mats easily under armpits",
    exercise: "Daily play",
    checklist: [
      { title: "Watch for fast or labored breathing at rest", why: "HCM is breed-prevalent and silent until late.", cadence: "weekly", category: "observe" },
    ],
  },
  "ragdoll": {
    species: "cat", lifespan: "12-17 years", energy: "low-moderate",
    summary: "Docile, floppy, indoor-only by temperament. Cardiac screening recommended.",
    health: ["HCM (breed-specific genetic mutation tested)", "Bladder stones"],
    grooming: "Brush 2-3x/week",
    exercise: "Gentle daily play",
    checklist: [],
  },
  "siamese": {
    species: "cat", lifespan: "12-20 years", energy: "high",
    summary: "Vocal, social, demand interaction. Long-lived but breed-specific risks exist.",
    health: ["Asthma", "Dental disease", "Amyloidosis (kidney + liver)"],
    grooming: "Weekly brush",
    exercise: "Lots of interactive play",
    checklist: [],
  },
  "persian": {
    species: "cat", lifespan: "12-17 years", energy: "low",
    summary: "Brachycephalic, long coat, mellow. Eye + face care is daily.",
    health: ["Polycystic kidney disease (PKD)", "Brachycephalic airway", "Dental disease", "Tear staining"],
    grooming: "Daily brush; daily eye wipe",
    exercise: "Light",
    checklist: [
      { title: "Wipe under eyes with damp cotton",   why: "Tear staining + skin irritation accumulate quickly.", cadence: "daily", category: "care" },
      { title: "Brush coat to prevent matting",       why: "Mats can require shaving under sedation.",            cadence: "daily", category: "care" },
    ],
  },
  "bengal": {
    species: "cat", lifespan: "12-16 years", energy: "very high",
    summary: "Wild-looking spotted/marbled coat from Asian leopard cat heritage. Athletic, loud, water-curious.",
    health: ["HCM", "Progressive retinal atrophy", "Patellar luxation", "Pyruvate kinase deficiency"],
    grooming: "Weekly brush",
    exercise: "Lots — climbing tower, food puzzles, fetch",
    checklist: [
      { title: "Provide vertical climbing space", why: "Bengals NEED to climb. Bored Bengals destroy curtains, doors, everything.", cadence: "always", category: "care" },
    ],
  },
  "british shorthair": {
    species: "cat", lifespan: "12-17 years", energy: "low",
    summary: "Plush 'teddy bear' coat, calm, undemanding. Cardiac screening recommended.",
    health: ["HCM", "Polycystic kidney disease", "Hemophilia B"],
    grooming: "Brush 2x/week",
    exercise: "Moderate play",
    checklist: [],
  },
  "scottish fold": {
    species: "cat", lifespan: "11-14 years", energy: "moderate",
    summary: "Folded ears come from a cartilage mutation that affects ALL joints, not just ears. Plan for arthritis.",
    health: ["Osteochondrodysplasia (painful joint condition — affects every Fold)", "HCM", "Polycystic kidney disease"],
    grooming: "Weekly brush",
    exercise: "Gentle play (joint pain is common)",
    checklist: [
      { title: "Watch for limping, reluctance to jump, or stiffness", why: "Osteochondrodysplasia is universal in the breed; pain management starts early.", cadence: "weekly", category: "observe" },
    ],
  },
  "russian blue": {
    species: "cat", lifespan: "15-20 years", energy: "moderate",
    summary: "Reserved with strangers, devoted to family. Generally one of the healthiest pure breeds.",
    health: ["Bladder stones", "Diabetes (if overweight)"],
    grooming: "Weekly brush",
    exercise: "Moderate play",
    checklist: [],
  },
  "abyssinian": {
    species: "cat", lifespan: "12-15 years", energy: "high",
    summary: "Active, athletic, deeply curious. Often called 'clowns of the cat world'.",
    health: ["Pyruvate kinase deficiency", "Renal amyloidosis", "Progressive retinal atrophy", "Patellar luxation"],
    grooming: "Weekly brush",
    exercise: "Lots of climbing + play",
    checklist: [],
  },
  "sphynx": {
    species: "cat", lifespan: "9-15 years", energy: "high",
    summary: "Hairless cats need MORE grooming than coated ones — skin oils have nowhere to wick to.",
    health: ["HCM", "Skin issues (oily buildup, sunburn)", "Periodontal disease"],
    grooming: "Bath weekly; clean ears + nail beds (oil buildup)",
    exercise: "Lots of play",
    checklist: [
      { title: "Bathe + clean ear canals + wipe between toes", why: "Without coat, oils accumulate; skin and ear infections are breed-prevalent.", cadence: "weekly", category: "care" },
      { title: "Keep indoor-only or apply cat-safe sunscreen outdoors", why: "No coat = sunburn + skin cancer risk.", cadence: "always", category: "safety" },
    ],
  },
  "devon rex": {
    species: "cat", lifespan: "9-15 years", energy: "high",
    summary: "Curly-coated, elf-faced, mischievous. Coat is sparse — care is similar to Sphynx but milder.",
    health: ["HCM", "Hereditary myopathy", "Patellar luxation", "Skin issues (oil)"],
    grooming: "Weekly gentle wipe; bathe monthly",
    exercise: "Lots of play",
    checklist: [],
  },
  "norwegian forest cat": {
    species: "cat", lifespan: "12-16 years", energy: "moderate",
    summary: "Big, sturdy, weather-built coat. Norwegian cousin of the Maine Coon.",
    health: ["HCM", "Hip dysplasia", "Glycogen storage disease IV", "Polycystic kidney disease"],
    grooming: "Brush 2-3x/week; heavy seasonal shedding",
    exercise: "Daily play + climbing",
    checklist: [],
  },
  "burmese": {
    species: "cat", lifespan: "16-18 years", energy: "moderate-high",
    summary: "Sociable, dog-like, vocal. Long-lived with a couple breed-specific concerns.",
    health: ["Diabetes mellitus (one of the highest-risk breeds)", "Cranial deformities (in 'contemporary' lines)", "Gangliosidosis"],
    grooming: "Weekly brush",
    exercise: "Daily play",
    checklist: [
      { title: "Watch for increased thirst + urination", why: "Burmese need extra care due to heightened diabetes risk — watch for increased thirst or urination.", cadence: "weekly", category: "observe" },
    ],
  },
  "american shorthair": {
    species: "cat", lifespan: "15-20 years", energy: "moderate",
    summary: "Working barn-cat ancestry, sturdy, healthy, easygoing. One of the most low-maintenance pure breeds.",
    health: ["HCM", "Obesity"],
    grooming: "Weekly brush",
    exercise: "Daily play",
    checklist: [],
  },
  "mixed cat": {
    species: "cat", lifespan: "12-16 years", energy: "varies", summary: "", health: [], grooming: "", exercise: "", checklist: [],
  },
  "other cat": {
    species: "cat", lifespan: "varies", energy: "varies", summary: "", health: [], grooming: "", exercise: "", checklist: [],
  },
};

export const breedFacts = { ...dogBreedData, ...catBreedData };

// Cute breed-specific emoji where one reads. Most dogs collapse to 🐕,
// most cats to 🐈, but a few have their own glyph (poodle 🐩, husky 🐺-ish).
// Mixed/other get 🐾 to feel inclusive.
const BREED_EMOJI = {
  "poodle": "🐩",
  "siberian husky": "🐺",
  "german shepherd": "🐕‍🦺",
  "chow chow": "🦊",
  "bernese mountain dog": "🐕‍🦺",
  "pomeranian": "🐶",
  "yorkshire terrier": "🐶",
  "shih tzu": "🐶",
  "havanese": "🐶",
  "french bulldog": "🐶",
  "boston terrier": "🐶",
  "bulldog": "🐶",
  "boxer": "🐶",
  "beagle": "🐶",
  "dachshund": "🌭",
  "border collie": "🐕",
  "australian shepherd": "🐕",
  "rottweiler": "🐕",
  "doberman pinscher": "🐕",
  "great dane": "🐕",
  "labrador retriever": "🐕",
  "golden retriever": "🐕",
  "german shorthaired pointer": "🐕",
  "pembroke welsh corgi": "🐶",
  "cane corso": "🐕",
  "shetland sheepdog": "🐕",
  "miniature schnauzer": "🐶",
  "cocker spaniel": "🐶",
  "english springer spaniel": "🐶",
  "brittany": "🐕",
  "cavalier king charles spaniel": "🐶",
  // Designer / mix breeds
  "goldendoodle": "🐩",
  "labradoodle": "🐩",
  "bernedoodle": "🐩",
  "cockapoo": "🐩",
  "cavapoo": "🐩",
  "sheepadoodle": "🐩",
  "aussiedoodle": "🐩",
  "maltipoo": "🐩",
  "puggle": "🐶",
  "pomsky": "🦊",
  "mixed": "🐾",
  "other dog": "🐾",
  // Cats
  "domestic shorthair": "🐈",
  "domestic longhair": "🐈‍⬛",
  "maine coon": "🦁",
  "ragdoll": "🐈",
  "siamese": "🐈",
  "persian": "😺",
  "bengal": "🐯",
  "british shorthair": "🐈",
  "scottish fold": "😸",
  "russian blue": "🐈‍⬛",
  "abyssinian": "🐈",
  "sphynx": "😼",
  "devon rex": "🐈",
  "norwegian forest cat": "🐈",
  "burmese": "🐈",
  "american shorthair": "🐈",
  "mixed cat": "🐾",
  "other cat": "🐾",
};
export function breedEmoji(key) {
  if (!key) return "🐾";
  return BREED_EMOJI[key.toLowerCase()] || (breedFacts[key.toLowerCase()]?.species === "cat" ? "🐈" : "🐕");
}

// Alphabetized breed lists. "Mixed" / "Other" pinned to the bottom so
// they don't break the alpha flow.
const alpha = (a, b) => a.localeCompare(b);
const isPinned = k => /^(mixed|other)/.test(k);
const dogAll = Object.entries(breedFacts).filter(([k, v]) => v.species === "dog").map(([k]) => k);
const catAll = Object.entries(breedFacts).filter(([k, v]) => v.species === "cat").map(([k]) => k);
export const dogBreeds = [
  ...dogAll.filter(k => !isPinned(k)).sort(alpha),
  ...dogAll.filter(isPinned).sort(alpha),
];
export const catBreeds = [
  ...catAll.filter(k => !isPinned(k)).sort(alpha),
  ...catAll.filter(isPinned).sort(alpha),
];

// Pluralize the breed name for "About X" headers. Uses an explicit
// displayName when set; otherwise appends "s" to the title-cased breed.
// Handles a few special cases (mixed/other) cleanly.
export function breedDisplayName(breedKey) {
  const b = breedFacts[(breedKey || "").toLowerCase()];
  if (b?.displayName) return b.displayName;
  if (!breedKey) return "your pet";
  if (breedKey === "mixed" || breedKey === "mixed cat") return "Mixed-breed dogs";
  if (breedKey === "other dog" || breedKey === "other cat") return "your pet";
  const titled = breedKey.split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");
  return titled.endsWith("s") ? titled : titled + "s";
}

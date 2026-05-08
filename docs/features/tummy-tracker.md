# Tummy Tracker — Feature Brief

**Target version:** v1.4
**Status:** Spec
**Last updated:** May 5, 2026

## Goal

Let pet parents log their pet's bowel movements with structured data, photos, and trend analysis. Provides vet-shareable history that improves diagnostic conversations, enables early detection of GI issues, and connects to FloofLife's recall system through diet-matching to flag potentially contaminated foods.

## User Story

> As a Floof Parent, I want to track my pet's bathroom habits so I can spot abnormal patterns early, share clear data with my vet, and get alerted if my pet's food shows up on a recall list.

## Core Concept

Two connected logs:
1. **Tummy Tracker** — per-poop log with consistency, color, volume, completeness, mucus, blood, photo, notes
2. **Diet Log** — what the pet eats daily (brand, flavor, amount, treats, supplements, table scraps)

These talk to each other. When a pet has abnormal stool entries (red, mucus, blood, irregular consistency repeatedly), Tummy Tracker:
- Always suggests "You may want to schedule a vet visit"
- Cross-references the Diet Log against the active recall list
- If a match is found, surfaces the recall as a possible cause

## Logging Flow — Stool Entry

User taps "Log a Poop" → quick-entry form:

**Required fields:**
- Date/time (defaults to now)
- Consistency (Bristol Stool Scale 1-7, pet-friendly visual icons)
- Color (normal brown, dark/black, red, yellow, green, white/gray, other)

**Optional fields:**
- Volume (smaller than usual / normal / larger than usual)
- Completeness (one full poop / multiple in one walk / incomplete)
- Mucus (yes / no)
- Blood (yes / no)
- Photo upload
- Free-text notes
- Walk context (post-meal / post-medication / morning / evening / overnight)

Quick-entry UX should let user log in under 15 seconds.

## Logging Flow — Diet Entry

User maintains a "Daily Diet" record per pet that captures:

**Required:**
- Primary food brand
- Primary food flavor / variety
- Daily amount (cups / oz / grams)
- Number of meals per day

**Optional:**
- Secondary foods (e.g. wet food alongside kibble)
- Treats (brand + frequency)
- Supplements (name + dosage)
- Table scraps / human food given
- Recent food changes (date of switch + previous food)

Diet log is set once and updated when the pet's food changes. Not a daily entry burden.

## Recall Integration

When a stool entry is logged with abnormal flags (red, blood, mucus, persistently soft, etc.):

1. **Always** surface: "You may want to schedule a vet visit. Here's what to discuss." (Includes consolidated recent stool history.)
2. **Cross-check Diet Log** against the active recall database
3. If any food in the Diet Log matches an active recall:
   - Show recall alert prominently in the abnormal-stool flow
   - Link to recall details (brand, lot codes, FDA source, advisory level)
   - Suggest: "Stop feeding [Brand Flavor] immediately and consult your vet"
4. If no match: just show the vet visit suggestion without a recall alert

**Critical:** Recall alerts only trigger from Tummy Tracker if the pet's logged diet matches. We don't false-alarm users whose pets eat unaffected foods.

The general recall list (independent of Tummy Tracker) continues to surface in its own section as today.

## Trend Analysis

Tummy Tracker shows a trend chart over time:
- Bristol scale (1-7) on Y axis, dates on X axis
- Color-coded dots for color anomalies (red for blood, yellow for atypical color, etc.)
- Streak highlights ("5 days of normal stool — keep it up!")
- Anomaly alerts ("3 abnormal entries in the last 7 days — consider scheduling a vet visit")

## Vet-Shareable Export

Premium users can export a PDF report:
- Date range selectable
- Summary statistics (most common consistency, color, frequency)
- Trend chart
- Annotated abnormal entries
- Diet history during the same window
- Photo thumbnails (if logged)
- Vet-formatted, printable

## Free vs Premium

**Free tier:**
- 7-day rolling stool history
- Diet log (full)
- Basic trend chart
- Recall cross-check (always on — safety feature, never gated)
- Vet visit suggestions (always on — safety feature, never gated)
- No photo storage
- No PDF export

**Premium tier:**
- Unlimited stool history
- Photo storage (per documentDirectory)
- PDF export
- Anomaly alerts (push notifications)
- Detailed trend analytics
- Multi-pet support

**Safety-critical features (recall match + vet visit suggestion) are NEVER paywalled.** This is non-negotiable.

## Data Model

```
StoolEntry {
  id: UUID
  petId: UUID
  loggedAt: Timestamp
  bristolScore: Int (1-7)
  color: enum (brown, dark_black, red, yellow, green, white_gray, other)
  volume: enum (smaller, normal, larger) — optional
  completeness: enum (full, multiple, incomplete) — optional
  hasMucus: Bool
  hasBlood: Bool
  photoPath: String? (documentDirectory)
  notes: String?
  walkContext: enum (post_meal, post_medication, morning, evening, overnight) — optional
}

DietLog {
  id: UUID
  petId: UUID
  primaryBrand: String
  primaryFlavor: String
  dailyAmount: Float
  amountUnit: enum (cups, oz, grams)
  mealsPerDay: Int
  secondaryFoods: [SecondaryFood]
  treats: [Treat]
  supplements: [Supplement]
  tableScraps: String?
  lastChangedAt: Timestamp
  previousFood: String?
}

SecondaryFood / Treat / Supplement {
  brand: String
  flavor: String?
  amount: String?
  frequency: String?
}

RecallMatch {
  id: UUID
  petId: UUID
  matchedAt: Timestamp
  recallId: UUID (links to recall record)
  matchedFood: String
  triggeredByStoolEntry: UUID? (which abnormal entry triggered the cross-check)
  userAcknowledged: Bool
}
```

## UI Components

- `StoolLogScreen` — list of recent entries, "Log a Poop" CTA
- `StoolEntryForm` — quick-entry form, ~15 second flow
- `DietLogScreen` — current diet, history of changes
- `BristolScalePicker` — visual icon selector for consistency (1-7)
- `ColorPicker` — swatch-based color selector
- `TrendChartView` — Bristol score over time with anomaly markers
- `AbnormalAlertModal` — vet visit suggestion + recall cross-check result
- `RecallMatchAlert` — prominent alert when diet matches active recall
- `PDFExportPreview` — Premium: previews and downloads vet-shareable report

## Branding

**Feature name:** Tummy Tracker (final). Emoji 💩 used in sub-icon, not primary label.

**Tone:** Clinical when needed (vet visits, recalls), light when not (logging, badges). Never gross-out humor.

## Anomaly Detection Rules

A stool entry is "abnormal" if any of the following:
- Bristol score outside 3-5 range
- Color is red, dark/black, white/gray, or yellow
- hasMucus = true
- hasBlood = true
- Three or more consecutive entries with same abnormal flag

When flagged, ALWAYS show:
- "You may want to schedule a vet visit"
- Diet cross-check against active recalls
- Free-form note on what to discuss with vet

## Privacy Notes

- All photos stored locally (documentDirectory), never uploaded to any server in v1.4
- PDF exports generated locally, not transmitted
- Diet log data stays on-device
- v2.0 cloud sync (when implemented) must be opt-in with clear data handling disclosure

## Disclaimers

In-feature disclaimer (always visible at top of Tummy Tracker section):
> "FloofLife is informational only and not a substitute for veterinary advice. If your pet shows abnormal symptoms, consult your veterinarian."

## Open Design Questions

1. Bristol Stool Scale visualization — pet-friendly cartoon icons vs clinical reference image?
2. Photo storage limits — free tier 0 photos, Premium unlimited or capped?
3. Diet log frequency — set-it-and-forget-it or weekly check-in prompt?
4. Should treats/scraps appear in recall cross-check or only primary food?
5. Multi-pet diet matching when households share food brands?

## Marketing Hook

> "Your vet's been asking. Now you can answer. Track your pet's tummy health, log diet, and get alerted if their food is recalled — all in one place."

App Store What's New copy:
> "🐾 Introducing the Tummy Tracker. Log your pet's bathroom habits and diet, spot patterns, and share clear reports with your vet. We also cross-check your pet's food against recall lists — so if there's a problem with what they're eating, you'll know immediately."

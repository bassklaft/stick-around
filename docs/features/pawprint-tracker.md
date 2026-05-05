# Pawprint Tracker — Feature Brief

**Target version:** v1.3
**Status:** Spec
**Last updated:** May 5, 2026

## Goal

Gamify checklist completion using a Pawprint visual that fills as users complete daily/weekly/monthly/yearly care tasks. Drives daily app opens, reinforces habit, and creates emotional reward for being a good Floof Parent.

## User Story

> As a Floof Parent, I want to see visual progress on my pet's care so I feel rewarded for showing up daily, and so I can quickly see what I've missed.

## Core Visual

A pawprint with 5 fillable segments:
- **4 toe pads** = 4 care categories (Health, Grooming, Activity, Nutrition)
- **1 main pad** = core daily must-dos

Each pad fills proportionally as items in that category complete. When all 5 pads fill, the paw "closes" with a celebration animation and a "Good Floof Parent" message.

## Time Horizons

Users can toggle between four views:
- **Daily** — today's checklist completion
- **Weekly** — rolling 7-day completion
- **Monthly** — calendar-month completion
- **Yearly** — calendar-year completion

Each view has its own paw, its own milestones, and its own badge unlocks.

## Streak Philosophy

**Soft streaks only.** Missed days do not break streaks — instead, they show as "Rest Day" with a gentle 🛌 icon. This avoids the punitive feel of Duolingo-style streaks and respects real life (sick pets, travel, busy days). Goal is celebration, not pressure.

## Mini-Awards / Badges

Unlocked at milestones:
- 7-day care streak ("Week One Wonder")
- 30-day care streak ("Month of Mastery")
- 100-day streak ("Centurion Floof Parent")
- First vaccine logged ("Health Hero")
- First grooming session logged ("Spa Day Sponsor")
- 10 walks logged ("Trail Boss")
- All 4 categories complete in one day ("Full Paw Day")
- 4-week perfect streak ("Streak Saint")
- Multi-pet care across whole household ("Pack Leader")

Badges live in a Badge Gallery accessible from the Pawprint screen. Tapping a badge shows when it was earned and how.

## Celebration Moments

When a paw closes (all 5 pads full), trigger:
- Haptic tap
- Confetti or paw print animation
- Random "Good Floof Parent" message rotation:
  - "Falafel knows you've got this. 🐾"
  - "Closed paw, full heart. Nice work today."
  - "Another perfect day for [pet name]."
  - "You're the parent your pet brags about."
- Badge unlock if milestone hit

## Free vs Premium

**Free tier:**
- Daily Pawprint view
- Basic streaks
- Badge gallery (earned badges only)
- 7-day history

**Premium tier:**
- Weekly / Monthly / Yearly views
- Multi-pet Pawprints (one per pet)
- Custom badge celebrations
- Auto-generated share cards (Instagram-ready)
- Full history and detail charts
- Streak insights ("You're 3 days from a Month of Mastery!")

## Data Model

```
PawprintEntry {
  id: UUID
  petId: UUID
  date: Date (UTC start of day)
  category: enum (Health, Grooming, Activity, Nutrition, Core)
  checklistItemId: UUID (links to existing checklist item)
  completedAt: Timestamp
}

Streak {
  id: UUID
  petId: UUID
  type: enum (daily, weekly, monthly, yearly)
  currentLength: Int
  longestLength: Int
  lastCompletionDate: Date
  startDate: Date
}

Badge {
  id: UUID
  petId: UUID
  badgeKey: String (e.g. "week_one_wonder")
  unlockedAt: Timestamp
}
```

## UI Components

- `PawprintView` — animated SVG paw, fills proportionally
- `PawprintScreen` — main feature screen, time horizon toggle
- `BadgeGallery` — grid of earned + locked badges
- `CelebrationOverlay` — confetti + message on paw close
- `ShareCardGenerator` — auto-generates Instagram square images (Premium)

## Visual Style

- Brand colors for fill states (TBD — needs design palette lock)
- Pawprint shape: stylized, slightly rounded, friendly (not clinical)
- Animation: smooth fill from bottom-up for each pad as items complete
- Empty state: outlined paw with prompt "Start caring to fill the paw 🐾"

## Notifications

Push notifications (Premium):
- "Don't break Falafel's streak — today's checklist isn't done yet"
- "Falafel is 1 task away from closing today's paw"
- "Week One Wonder is one day away!"

Notifications respect quiet hours and per-pet preferences.

## Open Design Questions

1. Single paw vs 4-toe categorized pads (lean: categorized)
2. Final brand color palette for fills
3. Rest Day visual — icon vs greyed-out pad
4. Badge unlock cadence (too frequent = devalued; too rare = boring)
5. Should yearly view show 12 small paws or 1 big paw with monthly detail?

## Marketing Hook

> "Track your good parenting. The Pawprint fills as you care for your pet. Celebrate every win with Falafel."

App Store What's New copy:
> "🐾 Introducing the Pawprint Tracker. Watch your daily care fill the paw, earn Floof Parent badges, and celebrate every win. Because being a good pet parent deserves more than a checklist."

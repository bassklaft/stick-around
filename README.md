# FloofLife — v1 scaffold

Working Expo scaffold per Pawrent_PRD_v1.md. Onboarding flow, weekly
checklist generator (breed + age + season aware), toxic foods/plants
reference, settings.

## Run it

    npm install
    npx expo start
    # press 'i' for iOS simulator (requires Xcode)
    # or scan the QR with Expo Go on your phone

## What's in v1 (this scaffold)

- Onboarding: pet name + species + breed + age + weight
- Home tab: breed-aware checklist, "this week" progress, breed summary
- Toxic tab: foods + plants with severity badges (ER / vet call /
  monitor) and per-species filtering
- Settings: pet info, reset data, contact + legal

## Not yet implemented (per PRD timeline)

- Photo upload + crop (week 1 polish)
- iOS Home Screen + Lock Screen widgets (week 3 — Swift)
- RevenueCat / subscriptions (week 4)
- Observation log timeline (week 4)
- App Store assets (week 5)

## Data model

All persistent state in AsyncStorage:
- `pawrent_pet`         → `{ name, species, breed, ageYears, weightLbs }`
- `pawrent_checklist_state` → `{ [itemId]: { status: "done"|"skipped", ts } }`
- `pawrent_observations` → `[{ id, ts, key, value, note }, ...]`

Switch to expo-sqlite when observation log lands (week 4).

## Disclaimer

FloofLife guidance is sourced from public veterinary references (AKC,
ASPCA, Merck Vet Manual, AVMA, Cornell Feline Health). It is not a
substitute for veterinary advice.

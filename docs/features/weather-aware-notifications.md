# Weather-Aware Notifications (v1.3)

## Goal

Push notifications that nudge the user at weather-meaningful moments for their pet: a "good walk window" alert when conditions are pleasant after a stretch of bad weather, a supply-prep alert before a storm or heat wave, and breed-specific heat / cold warnings (e.g., a brachycephalic-breed alert at 80°F that doesn't fire for a Husky). Built on Apple's WeatherKit API, so the data is licensed and reliable. The feature converts weather from a passive lookup into actionable pet-care prompts that live in the notification surface.

## Founder Anchor

Pet owners check the weather all the time, but the cognitive translation from "it's 82°F and humid" to "this is dangerous for my Frenchie" or "I should walk now before the heat peaks at 4 PM" is often missed. FloofLife's value is doing that translation per pet, per breed, per season, then delivering the prompt at the right moment without being annoying. The breed sensitivity tables (brachycephalic threshold, double-coat heat threshold, hairless cold threshold) come from existing FloofLife breed data — this feature is the actuation layer on top of the breed data we already maintain.

## User Flow

### First-run consent
1. After onboarding completes, on first Home tab open: "Get a heads-up about weather that matters for [pet name]?" with two CTAs — "Yes, send me alerts" and "Not now."
2. "Yes" triggers the iOS notification permission prompt (`requestPermissionsAsync`).
3. On grant: confirmation card "We'll nudge you about good walk windows, storms, and breed-sensitive heat/cold for [pet name]." Includes a "Manage in Settings" tip pointing to the FloofLife Settings tab.

### Notification types
1. **Good walk window** — fires when 3 conditions all true: (a) it's been ≥6 hours since the last "good walk window" notification, (b) current temp + feels-like + precipitation + wind are within breed-friendly thresholds, (c) the user has opened the app at least once in the last 7 days (engagement guardrail).
2. **Storm prep** — fires 4-12 hours before forecasted thunderstorm, hurricane, or heavy snow. Copy: "[Storm type] forecast for [time]. Refill [pet name]'s water + check leash + bring toys inside?"
3. **Heat warning** — breed-specific. Fires when forecast peak ≥ breed threshold for the day. Brachycephalic breeds: 80°F threshold (per AKC + AVMA brachycephalic heat-stress guidance). Double-coat breeds (Husky, Malamute, Newfoundland): 75°F threshold. Hairless breeds (Sphynx, Xolo): cold side at 60°F. Standard breeds: 90°F threshold.
4. **Cold warning** — for hairless / short-coat / small breeds: fires below breed-specific threshold (e.g., Italian Greyhound: 40°F).
5. **Air quality alert** — fires when AQI in the user's area reaches 150+ (Unhealthy). Copy: "Air quality is [AQI] · Unhealthy. [Pet name] may benefit from a shorter walk today."

### Settings panel
Settings → Notifications. Toggle each notification type on/off. Quiet hours (default 9 PM - 7 AM, configurable). Per-pet toggle (multi-pet households).

### In-notification action
Tap notification → opens the relevant in-app context:
- Good walk window → Home tab with the active notification visible as a card.
- Storm prep → a checklist view (preserve water, leash, toys, where they sleep during the storm).
- Heat / cold warning → breed-specific guidance card (existing breed data + a heat/cold-specific tip).

## Data Model

### AsyncStorage (local-only)
```
pawrent_weather_prefs_v1: {
  enabled: bool,
  perPet: { [petId]: { goodWalk: bool, stormPrep: bool, heat: bool, cold: bool, airQuality: bool } },
  quietHours: { start: "21:00", end: "07:00" },
  lastFiredAt: { [type]: timestamp },
  lastSeenLat: number, lastSeenLng: number, lastSeenAt: timestamp
}
```

### Backend (Supabase)
Notification preferences are mostly local. Backend syncs the preference object across devices for signed-in users:
```sql
create table notification_prefs (
  user_id uuid references auth.users primary key,
  prefs jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table notification_prefs enable row level security;
create policy "users own prefs" on notification_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Notification firing is **client-side only** for v1.3 — local notifications scheduled by the app based on WeatherKit data fetched in the background (BGTaskScheduler). This avoids needing APNS in v1.3. APNS via Expo / Resend webhooks for backend-triggered notifications becomes relevant in v1.4+ (when Resend handles email + APNS handles cross-device push).

### Migration
First-launch v1.3: prefs default to all-off. The first-run consent card sets them.

### Schema versioning
`v1` suffix on the AsyncStorage key. Future additions (e.g., per-pet quiet hours, per-walk-route preferences) bump to `v2`.

### Local-only fallback
WeatherKit requires network. Notifications fire from the local schedule queue. If the background fetch hasn't run (low battery, airplane mode), the notification simply doesn't fire — graceful degradation. Don't show stale forecasts.

## UI Components

### New screens
- `WeatherNotificationsSettingsScreen` — toggles + quiet hours + per-pet matrix.

### Modified screens
- `App.js` — register WeatherKit + BGTaskScheduler.
- `OnboardingScreen.js` (or post-onboarding flow) — add the first-run consent card.
- `SettingsScreen.js` — add a row linking to `WeatherNotificationsSettingsScreen`.
- `HomeScreen.js` — surface active weather card (e.g., heat warning visible) when relevant, even if the user missed the notification.

### New reusable components
- `<WeatherChip type='heat'|'cold'|'storm'|'good_walk'|'aqi' value />` — colored pill.
- `<WeatherActionCard type pet onAction />` — full home-card with weather + action.

### Background task
- `weatherCheckBackground` — registered with BGTaskScheduler. Runs ~every 4 hours when system permits. Fetches WeatherKit data → evaluates breed thresholds → schedules local notifications for the next firing window.

## Free vs Premium Gating

- **Free**: heat warnings, cold warnings, storm prep, air quality alerts. These are safety-critical and should not be paywalled.
- **Premium**: good-walk-window nudges (engagement, not safety), per-walk-route weather (Premium can pre-check a saved walk route's weather), historical weather log (when did your pet last get walked in good conditions?), multi-pet differential alerts.
- **Rationale**: same as Tummy and Tick — anything safety-critical stays free.
- **Upgrade prompt**: appears once after the user has received 5 cumulative weather notifications.
- **Grandfather**: existing v1.0/v1.1 free users get the new free tier.

## Sources & Citations

- [Apple WeatherKit](https://developer.apple.com/weatherkit/) — primary data source. Daily request quota under the Apple Developer Program (500K calls/mo free); Premium tier may need paid bumps if scaled.
- [AVMA Hot Weather Safety](https://www.avma.org/resources/pet-owners/petcare/hot-weather-safety) — breed-agnostic heat thresholds.
- [AKC Brachycephalic Health Working Group](https://www.akc.org/expert-advice/health/) — brachycephalic-specific heat sensitivity.
- [AKC Cold Weather Safety](https://www.akc.org/expert-advice/health/cold-weather-tips/) — cold thresholds.
- [EPA AirNow API](https://www.airnow.gov/) — AQI data, free for non-commercial.
- [VCA Animal Hospitals — Heatstroke in dogs](https://vcahospitals.com/) — owner-facing framing reference.
- [Cornell Riney Canine Health Center](https://www.vet.cornell.edu/) — breed-cardio research underpinning brachycephalic thresholds.
- [The Weather Channel + NOAA NWS](https://www.weather.gov/) — backup feeds if WeatherKit ever changes terms.

## Language Guardrails

**Good**:
- "Forecast peak today: 84°F. Brachycephalic breeds like Frenchies are at higher heat-stress risk above 80°F. Discuss outdoor time with your vet."
- "Thunderstorm in [city] forecast at 6 PM. Bring toys inside, refill water, plan a calm space?"
- "Air quality is 165 · Unhealthy. [Pet name] may benefit from a shorter walk today."

**Bad**:
- "It's too hot to walk your dog." (absolutism — owner's call)
- "Heat stroke is fatal." (true but inappropriate scare framing in a notification)
- "Dogs can't sweat." (oversimplified — they sweat through paws and pant)
- "Your dog will die at 85°F." (false absolute claim)
- Brand promotion ("Wear cooling vest brand X") — no brand promotion ever.

Notification copy is short — keep to <120 chars where possible. Always include the pet's name to humanize. Always frame action as a question/option, not an instruction.

## Edge Cases & Error States

- **Empty state (no notifications fired yet)**: Settings panel explains what each toggle does.
- **Offline / no network**: WeatherKit unavailable. Queued notifications still fire if pre-scheduled, but no new evaluations happen.
- **Permission denied (notifications)**: feature disabled gracefully. Settings shows a "Notifications are off — enable in iPhone Settings → FloofLife → Notifications" hint.
- **Permission denied (location)**: feature requires "When in Use" location for WeatherKit. Without it, weather features disabled. Re-prompt allowed once after explanation.
- **Multi-pet differential**: a household with a Husky AND a Frenchie may get conflicting heat alerts. Resolution: combine into one alert: "Today peaks 82°F. [Frenchie name] (brachycephalic) is at risk above 80°F; [Husky name] (double-coat) is at risk above 75°F. Plan walks early or after dusk."
- **iCloud transfer**: AsyncStorage prefs restore. Backend sync pushes prefs on first signed-in launch.
- **Auth state**: anonymous users get full feature locally. On sign-in, prefs sync.
- **Time zone change while traveling**: WeatherKit auto-detects new location. Quiet hours follow device local time.
- **Daylight Savings**: same — device local time handles it.
- **Background task quota**: iOS strictly limits BGTaskScheduler. Worst case: notifications fire less often. The app still shows the same warnings as cards in-app on next foreground.

## Analytics Events to Fire

- `weather_notification_consented` — `{ consented: bool }`. First-run consent answer.
- `weather_notification_fired` — `{ type: 'good_walk'|'storm'|'heat'|'cold'|'aqi', pet_species: 'dog'|'cat', breed_sensitivity: 'brachycephalic'|'double_coat'|'standard'|'hairless'|'small_short_coat' }`. NEVER track lat/lng or city.
- `weather_notification_tapped` — `{ type, pet_species }`. Conversion signal.
- `weather_notification_dismissed` — `{ type, pet_species }`. Negative signal.
- `weather_setting_changed` — `{ type, enabled: bool }`. Settings interaction.
- Privacy: NEVER track lat/lng, exact temperature value (only the bucket: warm/hot/cold/etc.), city, or specific weather details.

## Apple Review Risk Assessment

- **Guideline 5.1.1 (Privacy)**: location string requires explicit "to provide weather alerts for your pet" wording. Update `app.json`.
- **WeatherKit usage**: per Apple's terms, WeatherKit data must be attributed in-app — small "Weather data: Apple Weather" footer on any screen showing weather data. Required, not optional.
- **Guideline 5.4 (VPN / Push)**: notifications require a justified use case. The breed-specific framing is the justification. Document why each notification type exists in the App Privacy section.
- **Guideline 4.5.4 (Push notifications)**: cannot be required for app function (they aren't — feature degrades gracefully). Cannot be used for marketing without consent (they aren't — they're functional).
- **Guideline 1.4.1 (Safety - Medical)**: heat/cold warnings flirt with medical territory. Mitigation: every notification copy is "discuss with your vet" framed for any health-flavored claim. Don't claim certainty.
- New permission strings: NSLocationWhenInUseUsageDescription update. NSUserNotificationsUsageDescription via Info.plist.
- Privacy disclosures: declare "Approximate Location" + "User Notifications" in App Privacy.

## Implementation Estimate

- New files: ~5-7 (1 settings screen, 2-3 components, 1 background task, 1 prefs storage helper, 1 weather data adapter).
- Modified files: 4-5 (`App.js`, `HomeScreen.js`, `SettingsScreen.js`, `OnboardingScreen.js`, `app.json`).
- Build budget: fits in v1.3 build alongside Pawgress + Tick Layers 1-3. 1 build for v1.3.
- Time estimate: 8-12 hours focused autonomous-Claude-Code work. WeatherKit native integration via `expo-weather-kit` (or a custom Expo config plugin if not available) is the variable.
- Backend work: minimal — 1 prefs table. v1.4+ may add APNS for backend-triggered notifications (e.g., recall-based safety pushes from Tummy Tracker).

## Open Questions / Decisions Needed

1. **WeatherKit Expo wrapper** — `expo-weather-kit` doesn't exist as of writing. Options: (a) write a custom Expo native module / config plugin, (b) use a third-party API wrapper that proxies WeatherKit, (c) use a different weather provider (NOAA NWS for free, OpenWeather paid). Recommend (a) — write the native module — but it's a 4-6 hour subtask.
2. **Push vs. local notifications** — v1.3 uses local-only (no APNS server). v1.4+ may move to APNS for higher-precision timing. Confirm the v1.3 trade-off is acceptable.
3. **Background fetch frequency** — iOS rate-limits BGTaskScheduler. Worst case ~every 6-12 hours. Is that frequent enough for a heat warning at 80°F? Yes — daily forecasts are stable; we schedule local notifications for the day's peak hour at the morning fetch.
4. **Breed-sensitivity threshold table** — codify in `src/data/breedWeatherSensitivity.js`. Source: AKC + AVMA + breed-specific research. Need 5-10 categories. Recommend: brachycephalic, double-coat, hairless, small-short-coat, senior, standard.
5. **Multi-pet alert merging** — combined-alert framing above is correct but needs UX polish. Confirm copy direction.
6. **Quiet hours default** — 9 PM - 7 AM is reasonable. Configurable required.
7. **WeatherKit attribution surface** — required by Apple. Where? Recommend a small footer on the settings screen + on the Home weather card.
8. **AQI source** — EPA AirNow is US-only. International users need a fallback (WeatherKit covers some AQI globally; verify).

## Out of Scope (for v1.3)

- Server-triggered weather notifications via APNS (deferred to v1.4+ when backend buildout includes Resend + APNS plumbing).
- Apple Watch complication showing today's weather risk band.
- Geofenced alerts (notification when entering a tick-heavy area + weather check) — v2.0+ combo with Tick spec Layer 5.
- Walk-route auto-detection from GPS (record actual walk routes) — v2.0+, requires more careful privacy review.
- Indoor temperature monitoring via HomeKit — v2.0+ partnership.
- "Walk now" social timing (knows when other dog-owners in the user's area are walking) — never; explicit non-goal for privacy.
- Activity ring style closing (closing on a "walk goal") — separate from this feature; adjacent to Pawgress.

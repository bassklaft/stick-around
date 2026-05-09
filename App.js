import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, TouchableOpacity, View, Text, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { initAnalytics, screen as trackScreen, track } from "./src/lib/analytics";
import { initHaptics, tapLight, tapMedium, tapHeavy } from "./src/lib/haptics";
import { Pets } from "./src/lib/storage";
import FloofFanOverlay from "./src/components/FloofFanOverlay";
import MyFloofsTabButton from "./src/components/MyFloofsTabButton";
import GuidedTour from "./src/components/GuidedTour";
import { computeFanCenters, hitTestFan } from "./src/lib/fanGeometry";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Bumped from _v1 → _v2 with the v1.2.0 release so existing users
// (who already dismissed v1's text-bullet tutorial) see the new
// visual guided tour fresh once after updating. Future content
// updates that warrant a re-show should bump this again.
const TUTORIAL_SEEN_KEY = "pawrent_tutorial_seen_v2";

import Logo from "./src/components/Logo";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import HomeScreen from "./src/screens/HomeScreen";
import YourPetsScreen from "./src/screens/YourPetsScreen";
import ChecklistScreen from "./src/screens/ChecklistScreen";
import ToxicScreen from "./src/screens/ToxicScreen";
import VetsScreen from "./src/screens/VetsScreen";
import DietScreen from "./src/screens/DietScreen";
import RecallsScreen from "./src/screens/RecallsScreen";
import TripScreen from "./src/screens/TripScreen";
import TrainingScreen from "./src/screens/TrainingScreen";
import RiskScreen from "./src/screens/RiskScreen";
import EmergencyScreen from "./src/screens/EmergencyScreen";
import DogAgeScreen from "./src/screens/DogAgeScreen";
import PremiumScreen from "./src/screens/PremiumScreen";
import HealthTrackerScreen from "./src/screens/HealthTrackerScreen";
import AddHealthRecordScreen from "./src/screens/AddHealthRecordScreen";
import PawgressScreen from "./src/screens/PawgressScreen";
import TummyTrackerScreen from "./src/screens/TummyTrackerScreen";
import LogStoolScreen from "./src/screens/LogStoolScreen";
import LogDietScreen from "./src/screens/LogDietScreen";
import AboutScreen from "./src/screens/AboutScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { PurchasesProvider } from "./src/lib/purchasesContext";
import { theme } from "./src/theme";

const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

// Tiny child of SafeAreaProvider whose only job is to read the
// bottom safe-area inset and report it back to App.js (which lives
// outside the provider and can't useSafeAreaInsets directly). The
// fan-out gesture math needs the bottom inset to position circles
// correctly above the tab bar.
function FanInsetSentinel({ onBottom }) {
  const insets = useSafeAreaInsets();
  useEffect(() => { onBottom?.(insets.bottom); }, [insets.bottom, onBottom]);
  return null;
}

function HamburgerLeft({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Settings")}
      style={{ paddingHorizontal: 14, paddingVertical: 6 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MaterialCommunityIcons name="menu" size={26} color={theme.fg} />
    </TouchableOpacity>
  );
}

function tabIcon(routeName) {
  return function TabIcon({ focused, color }) {
    const isHome = routeName === "Home";
    const size = isHome ? 30 : 24;
    return (
      <MaterialCommunityIcons
        name={focused ? "paw" : "paw-outline"}
        size={size}
        color={color}
        style={isHome ? { marginTop: -4 } : null}
      />
    );
  };
}

// Three tabs: Checklist | Home (center) | Your Pets. Home is the hub
// that links out to Toxic, Vets, Diet, Recalls (each pushed from the
// root stack, not in the tab bar).
function MainTabs({
  navigation,
  onMyFloofsLongPress,
  onFanLongPressStart,
  onFanLongPressMove,
  onFanLongPressEnd,
  onFanShortTap,
  fanCenters,
}) {
  return (
    <Tabs.Navigator
      initialRouteName="Home"
      screenOptions={({ route, navigation: tabNav }) => ({
        headerStyle: { backgroundColor: theme.bg, shadowColor: "transparent" },
        headerTitleStyle: { color: theme.fg, fontWeight: "700" },
        headerTitleAlign: "center",
        headerLeft: () => <HamburgerLeft navigation={navigation} />,
        // Logo always centered in the header — tapping jumps to Home tab.
        headerTitle: () => <Logo onPress={() => tabNav.navigate("Home")} />,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.line,
          height: Platform.OS === "ios" ? 86 : 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
        tabBarIcon: tabIcon(route.name),
      })}
    >
      <Tabs.Screen name="Checklist" component={ChecklistScreen}
        options={{ title: "This Week", tabBarLabel: "Pawgress" }}
        listeners={{ tabPress: () => tapHeavy() }} />
      <Tabs.Screen name="Home"
        options={{ title: "FloofLife", tabBarLabel: "Home" }}
        listeners={{ tabPress: () => tapHeavy() }}>
        {(props) => <HomeScreen {...props} onShowFloofFan={onMyFloofsLongPress} />}
      </Tabs.Screen>
      <Tabs.Screen name="YourPets"  component={YourPetsScreen}
        options={{
          title: "My Floofs",
          tabBarLabel: "My Floofs",
          // Custom tab button so the long-press → slide → release
          // gesture is one continuous touch session (not split into
          // long-press-then-lift-then-tap). The default tab button
          // fires `tabLongPress` as a discrete event which forces a
          // touch handoff that breaks the continuous-slide UX.
          tabBarButton: (btnProps) => (
            <MyFloofsTabButton
              {...btnProps}
              onShortTap={() => tapLight()}
              onLongPressStart={() => {
                onFanLongPressStart?.();
              }}
              onLongPressMove={(x, y) => {
                onFanLongPressMove?.(x, y);
              }}
              onLongPressEnd={(x, y) => {
                onFanLongPressEnd?.(x, y);
              }}
            />
          ),
        }} />
    </Tabs.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const navRef = useRef(null);
  const lastRouteRef = useRef(null);

  useEffect(() => {
    (async () => {
      const profile = await AsyncStorage.getItem("pawrent_pet");
      setOnboarded(!!profile);
      setReady(true);
      // First-run tutorial: show once after the user has a pet but
      // hasn't yet seen the welcome card. Per build 19 smoke-test
      // feedback ("brief tutorial for new users").
      if (profile) {
        const seen = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
        if (!seen) {
          // Slight delay so the home screen is rendered before the
          // overlay appears — the user sees the app behind the modal.
          setTimeout(() => setTutorialVisible(true), 400);
        }
      }
    })();
  }, []);

  async function dismissTutorial() {
    setTutorialVisible(false);
    await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, "1");
  }

  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => { initHaptics(); }, []);

  // Floof fan-out state. Hoisted to App root so the gesture (long-
  // press → slide → release) can be one continuous touch session
  // owned by the custom My Floofs tab button. The button calls
  // these handlers in sequence; this component drives the visual
  // state of FloofFanOverlay accordingly.
  const [longPressSwitcherVisible, setLongPressSwitcherVisible] = useState(false);
  const [longPressPets, setLongPressPets] = useState([]);
  const [longPressActiveId, setLongPressActiveId] = useState(null);
  const [longPressHoveredId, setLongPressHoveredId] = useState(null);
  // Cached fan-circle centers, recomputed when pets change. Used by
  // the move/end handlers to hit-test touch coordinates.
  const fanCentersRef = useRef([]);
  const safeAreaBottomRef = useRef(0);
  // Refs so the handlers (passed as props) see latest values without
  // re-creating the closure on every render.
  const longPressVisibleRef = useRef(false);
  const longPressPetsRef = useRef([]);
  const longPressActiveIdRef = useRef(null);
  const longPressHoveredIdRef = useRef(null);
  longPressVisibleRef.current = longPressSwitcherVisible;
  longPressPetsRef.current = longPressPets;
  longPressActiveIdRef.current = longPressActiveId;
  longPressHoveredIdRef.current = longPressHoveredId;

  async function handleFanLongPressStart() {
    const list = await Pets.listSortedOldestFirst();
    if (list.length <= 1) return; // no-op for single-pet households
    let active = await Pets.getActiveId();
    if (!active || !list.find((p) => p.id === active)) {
      active = list[0]?.id || null;
    }
    setLongPressPets(list);
    setLongPressActiveId(active);
    setLongPressHoveredId(null);
    setLongPressSwitcherVisible(true);
    fanCentersRef.current = computeFanCenters(list, safeAreaBottomRef.current);
    tapMedium();
    track("active_pet_switcher_opened", { source: "tab_long_press" });
  }

  function handleFanLongPressMove(x, y) {
    if (!longPressVisibleRef.current) return;
    const hit = hitTestFan(x, y, fanCentersRef.current);
    if (hit !== longPressHoveredIdRef.current) {
      setLongPressHoveredId(hit);
      if (hit) tapLight();
    }
  }

  async function handleFanLongPressEnd(x, y) {
    if (!longPressVisibleRef.current) {
      // Long-press never opened the fan (e.g., single-pet household).
      // Nothing to commit.
      return;
    }
    const picked = hitTestFan(x, y, fanCentersRef.current);
    setLongPressSwitcherVisible(false);
    setLongPressHoveredId(null);
    if (picked && picked !== longPressActiveIdRef.current) {
      try {
        await Pets.setActive(picked);
        track("active_pet_switched", {
          source: "tab_long_press",
          pet_count: longPressPetsRef.current.length,
        });
        tapLight();
        if (navRef.current?.navigate) {
          try { navRef.current.navigate("Main", { screen: "Home" }); } catch {}
        }
      } catch { /* swallow */ }
    }
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} />
        <Text style={{ marginTop: 12, color: theme.muted }}>Loading…</Text>
      </View>
    );
  }

  // Shared push-screen options (Toxic, Vets, Diet, Recalls, Settings).
  const pushScreenOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: theme.bg },
    headerTitleStyle: { color: theme.fg, fontWeight: "700" },
    headerTintColor: theme.accent,
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <PurchasesProvider>
      <NavigationContainer
        ref={navRef}
        onReady={() => {
          const route = navRef.current?.getCurrentRoute?.();
          if (route?.name) {
            lastRouteRef.current = route.name;
            trackScreen(route.name);
          }
        }}
        onStateChange={() => {
          const route = navRef.current?.getCurrentRoute?.();
          if (route?.name && route.name !== lastRouteRef.current) {
            lastRouteRef.current = route.name;
            trackScreen(route.name);
          }
        }}
      >
        <RootStack.Navigator
          screenOptions={{ headerShown: false }}
          screenListeners={{
            transitionEnd: (e) => {
              // Haptic on back-navigation (swipe-from-left-edge OR
              // header back-button OR programmatic goBack). Native-
              // stack emits transitionEnd with data.closing=true when
              // a screen is being popped. Light tap so it confirms
              // the gesture without being noisy.
              if (e?.data?.closing) tapLight();
            },
          }}
        >
          {!onboarded ? (
            <RootStack.Screen name="Onboarding">
              {(props) => <OnboardingScreen {...props} onDone={() => {
                setOnboarded(true);
                // Show tutorial after a brief delay so Home renders
                // before the welcome modal appears.
                setTimeout(() => setTutorialVisible(true), 400);
              }} />}
            </RootStack.Screen>
          ) : (
            <>
              <RootStack.Screen name="Main">
                {(props) => (
                  <MainTabs
                    {...props}
                    // Legacy prop — kept for HomeScreen's onShowFloofFan
                    // pinch-in / hard-press shortcut (still uses the
                    // discrete-event open path, no slide).
                    onMyFloofsLongPress={handleFanLongPressStart}
                    onFanLongPressStart={handleFanLongPressStart}
                    onFanLongPressMove={handleFanLongPressMove}
                    onFanLongPressEnd={handleFanLongPressEnd}
                  />
                )}
              </RootStack.Screen>
              <RootStack.Screen name="Toxic"    component={ToxicScreen}    options={{ ...pushScreenOptions, title: "Toxic Foods & Plants" }} />
              <RootStack.Screen name="Vets"     component={VetsScreen}     options={{ ...pushScreenOptions, title: "Vets Near Me" }} />
              <RootStack.Screen name="Diet"     component={DietScreen}     options={{ ...pushScreenOptions, title: "Diet & Care" }} />
              <RootStack.Screen name="Recalls"  component={RecallsScreen}  options={{ ...pushScreenOptions, title: "Recalls & Class Actions" }} />
              <RootStack.Screen name="Trip"     component={TripScreen}     options={{ ...pushScreenOptions, title: "Trip Planning" }} />
              <RootStack.Screen name="Training" component={TrainingScreen} options={{ ...pushScreenOptions, title: "Training Exercises" }} />
              <RootStack.Screen name="Risk"     component={RiskScreen}     options={{ ...pushScreenOptions, title: "Risk Map" }} />
              <RootStack.Screen name="Emergency" component={EmergencyScreen} options={{ ...pushScreenOptions, title: "Emergency Resources" }} />
              <RootStack.Screen name="DogAge"   component={DogAgeScreen}   options={{ ...pushScreenOptions, title: "Age Calculator" }} />
              <RootStack.Screen name="HealthTracker"   component={HealthTrackerScreen}   options={{ ...pushScreenOptions, title: "Health Tracker" }} />
              <RootStack.Screen name="AddHealthRecord" component={AddHealthRecordScreen} options={{ ...pushScreenOptions, presentation: "modal", title: "Health Record" }} />
              <RootStack.Screen name="Pawgress"        component={PawgressScreen}        options={{ ...pushScreenOptions, presentation: "modal", title: "Pawgress" }} />
              <RootStack.Screen name="TummyTracker"    component={TummyTrackerScreen}    options={{ ...pushScreenOptions, title: "Tummy Tracker" }} />
              <RootStack.Screen name="LogStool"        component={LogStoolScreen}        options={{ ...pushScreenOptions, presentation: "modal", title: "Log a poop" }} />
              <RootStack.Screen name="LogDiet"         component={LogDietScreen}         options={{ ...pushScreenOptions, presentation: "modal", title: "Log a meal" }} />
              <RootStack.Screen name="About"    component={AboutScreen}    options={{ ...pushScreenOptions, title: "About FloofLife" }} />
              <RootStack.Screen name="AddPet"   options={{ ...pushScreenOptions, presentation: "modal", title: "Add a floof" }}>
                {(props) => <OnboardingScreen {...props} addMode onDone={() => props.navigation.goBack()} />}
              </RootStack.Screen>
              <RootStack.Screen name="EditPet"  options={{ ...pushScreenOptions, presentation: "modal", title: "Edit floof" }}>
                {(props) => (
                  <OnboardingScreen
                    {...props}
                    editMode
                    editPetId={props.route?.params?.petId}
                    onDone={() => props.navigation.goBack()}
                  />
                )}
              </RootStack.Screen>
              <RootStack.Screen name="Premium"  component={PremiumScreen}  options={{ ...pushScreenOptions, presentation: "modal", title: "Premium" }} />
              <RootStack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ ...pushScreenOptions, presentation: "modal", title: "Settings" }}
              />
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>
      </PurchasesProvider>
      {/* Long-press-on-My-Floofs-tab fan-out overlay. Pet profile-photo
          circles fan in an arc from above the My Floofs tab; tap a
          circle to switch active pet. Rendered at App root so it
          overlays any tab. Single-pet households never see it
          (showLongPressSwitcher early-returns). */}
      <FanInsetSentinel onBottom={(b) => { safeAreaBottomRef.current = b; }} />
      <FloofFanOverlay
        visible={longPressSwitcherVisible}
        onClose={() => setLongPressSwitcherVisible(false)}
        pets={longPressPets}
        activeId={longPressActiveId}
        hoveredId={longPressHoveredId}
        bottomInset={safeAreaBottomRef.current}
      />
      {/* First-run tutorial — shown once after onboarding completes,
          plus once for any existing user who hasn't seen it (the
          AsyncStorage flag is the gate). Tap "Got it" → flag is set
          and the overlay never re-appears. */}
      <GuidedTour
        visible={tutorialVisible}
        onClose={dismissTutorial}
      />
    </SafeAreaProvider>
  );
}

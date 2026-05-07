import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, TouchableOpacity, View, Text, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { initAnalytics, screen as trackScreen } from "./src/lib/analytics";

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
import AboutScreen from "./src/screens/AboutScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { PurchasesProvider } from "./src/lib/purchasesContext";
import { theme } from "./src/theme";

const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

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
function MainTabs({ navigation }) {
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
        options={{ title: "This Week", tabBarLabel: "Checklist" }} />
      <Tabs.Screen name="Home"      component={HomeScreen}
        options={{ title: "FloofLife", tabBarLabel: "Home" }} />
      <Tabs.Screen name="YourPets"  component={YourPetsScreen}
        options={{ title: "My Floofs", tabBarLabel: "My Floofs" }} />
    </Tabs.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const navRef = useRef(null);
  const lastRouteRef = useRef(null);

  useEffect(() => {
    (async () => {
      const profile = await AsyncStorage.getItem("pawrent_pet");
      setOnboarded(!!profile);
      setReady(true);
    })();
  }, []);

  useEffect(() => { initAnalytics(); }, []);

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
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!onboarded ? (
            <RootStack.Screen name="Onboarding">
              {(props) => <OnboardingScreen {...props} onDone={() => setOnboarded(true)} />}
            </RootStack.Screen>
          ) : (
            <>
              <RootStack.Screen name="Main" component={MainTabs} />
              <RootStack.Screen name="Toxic"    component={ToxicScreen}    options={{ ...pushScreenOptions, title: "Toxic Foods & Plants" }} />
              <RootStack.Screen name="Vets"     component={VetsScreen}     options={{ ...pushScreenOptions, title: "Vets Near Me" }} />
              <RootStack.Screen name="Diet"     component={DietScreen}     options={{ ...pushScreenOptions, title: "Diet & Care" }} />
              <RootStack.Screen name="Recalls"  component={RecallsScreen}  options={{ ...pushScreenOptions, title: "Recalls & Class Actions" }} />
              <RootStack.Screen name="Trip"     component={TripScreen}     options={{ ...pushScreenOptions, title: "Trip Planning" }} />
              <RootStack.Screen name="Training" component={TrainingScreen} options={{ ...pushScreenOptions, title: "Training Exercises" }} />
              <RootStack.Screen name="Risk"     component={RiskScreen}     options={{ ...pushScreenOptions, title: "Risk Map" }} />
              <RootStack.Screen name="Emergency" component={EmergencyScreen} options={{ ...pushScreenOptions, title: "Emergency Resources" }} />
              <RootStack.Screen name="DogAge"   component={DogAgeScreen}   options={{ ...pushScreenOptions, title: "Age in Human Years" }} />
              <RootStack.Screen name="About"    component={AboutScreen}    options={{ ...pushScreenOptions, title: "About FloofLife" }} />
              <RootStack.Screen name="AddPet"   options={{ ...pushScreenOptions, presentation: "modal", title: "Add a floof" }}>
                {(props) => <OnboardingScreen {...props} addMode onDone={() => props.navigation.goBack()} />}
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
    </SafeAreaProvider>
  );
}

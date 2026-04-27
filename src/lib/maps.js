// Maps chooser — let user pick Apple Maps or Google Maps for "near me"
// searches. iOS-only users still get the pretty Alert; Android users
// effectively only have Google Maps but seeing the choice is harmless.
import { Alert, Linking } from "react-native";

export function openMapsSearch(query) {
  const q = encodeURIComponent(query);
  const apple  = `https://maps.apple.com/?q=${q}`;
  const google = `https://www.google.com/maps/search/?api=1&query=${q}`;
  Alert.alert(
    "Open in Maps",
    `Search "${query}" near you`,
    [
      { text: "Apple Maps",  onPress: () => Linking.openURL(apple).catch(() => {}) },
      { text: "Google Maps", onPress: () => Linking.openURL(google).catch(() => {}) },
      { text: "Cancel", style: "cancel" },
    ]
  );
}

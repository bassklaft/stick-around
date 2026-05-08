// Pet-scoped screen title. Renders "${petName}'s ${screenName}" with
// a chevron-down affordance (multi-pet households only) that signals
// the title is tappable to open the pet switcher.
//
// Single-pet: plain text title.
// Multi-pet: TouchableOpacity wraps with chevron + onPress callback.
//
// Used via navigation.setOptions({ headerTitle: () => <ActivePetTitle ... /> }).
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

export default function ActivePetTitle({ pet, screenName, multiPet, onPress }) {
  if (!pet) {
    return <Text style={s.titleSolo}>{screenName}</Text>;
  }
  const label = `${pet.name}'s ${screenName}`;
  if (!multiPet) {
    return <Text style={s.titleSolo} numberOfLines={1}>{label}</Text>;
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.titleRow}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Switch active floof from ${pet.name}`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={s.titleMulti} numberOfLines={1}>{label}</Text>
      <MaterialCommunityIcons name="chevron-down" size={18} color={theme.fg} style={{ marginLeft: 2 }} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  titleSolo: { fontSize: 17, fontWeight: "700", color: theme.fg, textAlign: "center", maxWidth: 240 },
  titleRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", maxWidth: 240 },
  titleMulti:{ fontSize: 17, fontWeight: "700", color: theme.fg },
});

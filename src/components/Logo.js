// FloofLife logo — paw print with a green check overlapping, and the
// brand name appearing alongside the check. Tappable to navigate Home.
// Implemented with stacked MaterialCommunityIcons since the project
// doesn't ship react-native-svg.
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

export default function Logo({ onPress, compact = false }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} activeOpacity={0.7} style={s.row} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <View style={s.iconStack}>
        <MaterialCommunityIcons name="paw" size={compact ? 22 : 26} color={theme.accent} />
        <View style={s.checkBadge}>
          <MaterialCommunityIcons name="check-bold" size={compact ? 9 : 11} color="#fff" />
        </View>
      </View>
      {!compact && (
        <Text style={s.text}>FloofLife</Text>
      )}
    </Wrap>
  );
}

const s = StyleSheet.create({
  row:        { flexDirection: "row", alignItems: "center", gap: 6 },
  iconStack:  { width: 30, height: 28, alignItems: "center", justifyContent: "center" },
  checkBadge: {
    position: "absolute", bottom: -3, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#3F8E5C",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: theme.bg,
  },
  text:       { fontSize: 16, fontWeight: "800", color: theme.fg, letterSpacing: -0.2 },
});

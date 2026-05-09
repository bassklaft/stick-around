// FloofLife logo — paw print with a green check overlapping, and the
// brand name appearing alongside the check. Tappable to navigate Home.
//
// Uses the canonical PawIcon component (src/components/PawIcon.js)
// so the brand mark, the in-app PawgressPaw, and the asset PNGs all
// render the same vector — no drift between surfaces.
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import PawIcon from "./PawIcon";
import { theme } from "../theme";

export default function Logo({ onPress, compact = false }) {
  const Wrap = onPress ? TouchableOpacity : View;
  const pawSize = compact ? 26 : 30;
  return (
    <Wrap onPress={onPress} activeOpacity={0.7} style={s.row} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <PawIcon
        size={pawSize}
        color={theme.accent}
        withCheck
        checkBg={theme.bg}
        checkColor="#3F8E5C"
      />
      {!compact && (
        <Text style={s.text}>FloofLife</Text>
      )}
    </Wrap>
  );
}

const s = StyleSheet.create({
  row:        { flexDirection: "row", alignItems: "center", gap: 6 },
  text:       { fontSize: 16, fontWeight: "800", color: theme.fg, letterSpacing: -0.2 },
});

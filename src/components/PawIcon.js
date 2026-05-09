// src/components/PawIcon.js
import React from "react";
import { View } from "react-native";
import Svg, { G, Ellipse, Path, Circle } from "react-native-svg";

export const PAW_VIEWBOX = "0 0 100 100";

// 4 toes at top, heel pad below. Inner toes are CLOSE (2-unit gap)
// to fix the "weird gap in middle" issue with MCI's paw. Heel is
// shorter vertically (~38 units of 100) to fix the "heel too fat"
// issue. Outer toes lean outward at 22°.
export const PAW_TOES = [
  { key: "movement", cx: 22, cy: 33, rx: 8, ry: 14, rot: -22 },
  { key: "food",     cx: 41, cy: 22, rx: 8, ry: 14, rot:  -6 },
  { key: "mind",     cx: 59, cy: 22, rx: 8, ry: 14, rot:   6 },
  { key: "body",     cx: 78, cy: 33, rx: 8, ry: 14, rot:  22 },
];

// Heel: rounded "loaf" — flat top edge from x=22 to x=78, gentle
// outward bulge on the sides, rounded bottom centered at (50, 96).
export const PAW_HEEL_PATH =
  "M 22 58 C 14 58 10 70 14 80 C 18 92 32 96 50 96 C 68 96 82 92 86 80 C 90 70 86 58 78 58 L 22 58 Z";

export default function PawIcon({
  size = 24,
  color = "#C04A2C",
  withCheck = false,
  checkBg = "#FBE4DC",
  checkColor = "#3F8E5C",
  filledSegments = null,    // { movement, food, mind, body, special } booleans
  dimColor = null,          // override for unfilled segments
  segmentColors = null,     // per-segment fill overrides (Pawgress 4 themes)
  segmentDimColors = null,  // per-segment dim overrides
}) {
  const isPawgressMode = !!filledSegments;
  const dim = dimColor || (color + "33");

  function fillFor(key) {
    if (!isPawgressMode) return color;
    const filled = !!filledSegments[key];
    if (filled) return segmentColors?.[key] || color;
    return segmentDimColors?.[key] || dim;
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={PAW_VIEWBOX}>
        {PAW_TOES.map((t) => (
          <Ellipse
            key={t.key}
            cx={t.cx} cy={t.cy} rx={t.rx} ry={t.ry}
            transform={`rotate(${t.rot} ${t.cx} ${t.cy})`}
            fill={fillFor(t.key)}
          />
        ))}
        <Path d={PAW_HEEL_PATH} fill={fillFor("special")} />
        {withCheck && (
          <G transform="translate(78 80)">
            <Circle r="14" fill={checkBg} />
            <Circle r="11" fill={checkColor} />
            <Path d="M -5 0 L -1 4 L 6 -4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </G>
        )}
      </Svg>
    </View>
  );
}

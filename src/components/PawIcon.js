// Canonical PawIcon — custom 5-shape paw silhouette matching the
// user-approved reference (cartoon paw, 4 toe ellipses + 1 heel
// path). Replaces the earlier MCI-literal approach because MCI's
// heel was too fat and wide.
//
// Same vector at every size. Used by Logo header, tab bar,
// Pawgress activity ring, asset PNGs, and pet-photo placeholders.
import React from "react";
import { View } from "react-native";
import Svg, { G, Ellipse, Path, Circle } from "react-native-svg";

export const PAW_VIEWBOX = "0 0 24 24";

// 4 toes + 1 heel — direct trace of the user-approved reference
// silhouette. Geometry is LOCKED. Do not adjust without an
// explicit user-spec change.
//   Inner (food, mind): near-vertical ovals at y=6, ±6° tilt
//   Outer (movement, body): smaller ovals at y=9.5, ±25° tilt
export const PAW_TOES = [
  { key: "food",     cx: 9.2,  cy: 6,   rx: 2.3, ry: 3.4, rot:  -6 },
  { key: "mind",     cx: 14.8, cy: 6,   rx: 2.3, ry: 3.4, rot:   6 },
  { key: "movement", cx: 4.5,  cy: 9.5, rx: 2.0, ry: 2.9, rot: -25 },
  { key: "body",     cx: 19.5, cy: 9.5, rx: 2.0, ry: 2.9, rot:  25 },
];

// Heel — rounded triangle with concave-curved sides and a
// slightly-narrowed bottom. Apex at (12, 11.5), bottom anchor
// implicit between (11, 22.4) and (13, 22.4). Symmetric around
// x=12. LOCKED.
export const PAW_HEEL_PATH =
  "M 12 11.5 C 9.2 11.5 6.8 13.2 5.6 15.6 C 4.6 17.6 4.8 19.8 6 21.2 C 7.2 22.5 9.4 22.8 11 22.4 C 11.6 22.25 12.4 22.25 13 22.4 C 14.6 22.8 16.8 22.5 18 21.2 C 19.2 19.8 19.4 17.6 18.4 15.6 C 17.2 13.2 14.8 11.5 12 11.5 Z";

// Centroids in 24×24 viewBox space, used as the origin of each
// segment's per-pad scale animation in PawgressPaw.
export const PAW_CENTROIDS = {
  food:     { x: 9.2,  y: 6 },
  mind:     { x: 14.8, y: 6 },
  movement: { x: 4.5,  y: 9.5 },
  body:     { x: 19.5, y: 9.5 },
  special:  { x: 12,   y: 17 },
};

// Tap targets as fractions of `size` for Pawgress mode (the in-app
// paw whose pads can be tapped to mark progress).
export const PAW_TAP_TARGETS = {
  food:     { cx: 0.38, cy: 0.25, r: 0.13 },
  mind:     { cx: 0.62, cy: 0.25, r: 0.13 },
  movement: { cx: 0.19, cy: 0.40, r: 0.13 },
  body:     { cx: 0.81, cy: 0.40, r: 0.13 },
  special:  { cx: 0.50, cy: 0.71, r: 0.30 },
};

export const PAW_SEGMENT_KEYS = ["food", "mind", "movement", "body", "special"];

export default function PawIcon({
  size = 24,
  color = "#C04A2C",
  withCheck = false,
  checkBg = "#FBE4DC",
  checkColor = "#3F8E5C",
  filledSegments = null,    // { food, mind, movement, body, special } booleans
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
          <G transform="translate(19 20)">
            <Circle r="4" fill={checkBg} />
            <Circle r="3.2" fill={checkColor} />
            <Path
              d="M -1.5 0 L -0.3 1.2 L 1.8 -1.2"
              stroke="#fff"
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        )}
      </Svg>
    </View>
  );
}

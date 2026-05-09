// Canonical PawIcon — the literal MaterialDesignIcons "paw" glyph
// split into its 5 native sub-paths. Same vector source that
// @expo/vector-icons uses for <MaterialCommunityIcons name="paw" />.
// Using the MCI glyph directly guarantees the brand-mark Logo, the
// tab bar paws, the Pawgress activity ring, and the asset PNGs all
// render the IDENTICAL silhouette at every size — no drift between
// surfaces.
import React from "react";
import { View } from "react-native";
import Svg, { G, Path, Circle } from "react-native-svg";

export const PAW_VIEWBOX = "0 0 24 24";

// Five sub-paths of the MCI paw glyph. Mapped to the Pawgress
// segment keys (food / mind / movement / body / special) so a
// single fill/animation pass can address each pad independently.
//   food, mind     → upper-left + upper-right toes
//   movement, body → lower-left + lower-right side toes
//   special        → main heel pad
export const PAW_PATHS = {
  food:     "M8.35,3C7,2.85 5.62,4.1 5.34,5.84C5.06,7.57 5.96,9.13 7.34,9.27C8.71,9.42 10.09,8.17 10.37,6.43C10.65,4.69 9.75,3.13 8.35,3Z",
  mind:     "M15.65,3C14.25,3.13 13.35,4.69 13.63,6.43C13.91,8.17 15.29,9.42 16.66,9.27C18.04,9.13 18.94,7.57 18.66,5.84C18.38,4.1 17,2.85 15.65,3Z",
  movement: "M3.79,9.5C2.45,9.78 1.71,11.55 2.16,13.21C2.6,14.86 4.04,15.97 5.38,15.7C6.71,15.42 7.45,13.65 7,12C6.5,10.34 5.12,9.23 3.79,9.5Z",
  body:     "M20.21,9.5C18.88,9.23 17.5,10.34 17,12C16.55,13.65 17.29,15.42 18.62,15.7C19.96,15.97 21.4,14.86 21.84,13.21C22.29,11.55 21.55,9.78 20.21,9.5Z",
  special:  "M11.59,11.46C10.83,11.5 10.11,11.84 9.5,12.32C8.39,13.21 7.5,14.34 6.62,15.5C5.77,16.65 4.86,17.81 4.5,19.16C4.18,20.41 4.5,21.94 5.71,22.6C7.06,23.34 8.78,23 10.16,22.69C11.53,22.38 12.93,22.31 14.32,22.42C15.59,22.5 16.91,22.83 18.13,22.34C18.95,22 19.66,21.13 19.59,20.18C19.51,18.84 18.61,17.7 17.81,16.66C16.93,15.5 16.07,14.32 14.96,13.4C13.82,12.45 12.84,11.4 11.59,11.46Z",
};

// Centroids in 24×24 viewBox space, used as the origin of each
// segment's per-pad scale animation in PawgressPaw.
export const PAW_CENTROIDS = {
  food:     { x: 7.85,  y: 6.13 },
  mind:     { x: 16.15, y: 6.13 },
  movement: { x: 4.5,   y: 12.6 },
  body:     { x: 19.5,  y: 12.6 },
  special:  { x: 12,    y: 17.3 },
};

// Tap targets as fractions of `size` for Pawgress mode (the in-app
// paw whose pads can be tapped to mark progress). Calibrated to the
// 24-unit viewBox: divide each path's centroid by 24 to get cx/cy.
export const PAW_TAP_TARGETS = {
  food:     { cx: 0.34, cy: 0.26, r: 0.13 },
  mind:     { cx: 0.66, cy: 0.26, r: 0.13 },
  movement: { cx: 0.19, cy: 0.53, r: 0.13 },
  body:     { cx: 0.81, cy: 0.53, r: 0.13 },
  special:  { cx: 0.50, cy: 0.78, r: 0.27 },
};

const SEGMENT_KEYS = ["food", "mind", "movement", "body", "special"];

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
        {SEGMENT_KEYS.map((key) => (
          <Path key={key} d={PAW_PATHS[key]} fill={fillFor(key)} />
        ))}
        {withCheck && (
          <G transform="translate(19 20)">
            <Circle r="4" fill={checkBg} />
            <Circle r="3" fill={checkColor} />
            <Path
              d="M -1.4 0 L -0.4 1 L 1.6 -1"
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

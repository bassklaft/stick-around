// PawgressPaw — five-segment paw-print SVG. Four toe pads + one main
// pad, each independently fillable. Used across the Home card, the
// detail modal, the history grid (Premium), and share-card export.
//
// Props:
//   completion: { food, movement, body, mind, special } booleans
//   size?: number — pixel size of the bounding box (default 200)
//   colorMode?: 'today' | 'week' | 'month' | 'year' — color theme
//   onSegmentTap?: (segment: keyof typeof completion) => void
//
// Styling: each segment has a tap target (when onSegmentTap provided)
// and animates fill on completion change via the standard Animated
// API + transform: scale spring.
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Svg, { Circle, Path, G } from "react-native-svg";
import { theme } from "../theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// Per the spec, each color mode renders the filled segments in a
// distinct hue so a Premium history view (week/month/year) reads at
// a glance. Today is the brand accent.
const COLORS = {
  today: { fill: theme.accent, stroke: theme.accent, dim: theme.accent + "33" },
  week:  { fill: "#3F8E5C", stroke: "#3F8E5C", dim: "#3F8E5C33" },
  month: { fill: "#7A4F0A", stroke: "#7A4F0A", dim: "#7A4F0A33" },
  year:  { fill: "#9C2A0F", stroke: "#9C2A0F", dim: "#9C2A0F33" },
};

// Layout — 5 segments inside a 200×200 bounding box. Toe pads arranged
// in a fan above the main pad. Coordinates derived from a real paw-
// print silhouette but rounded to clean values for crisp SVG.
//
//   key           cx   cy    r       label
//   movement     50    52   18       outer-left toe (index)
//   food         84    32   20       inner-left toe (middle-left)
//   mind        116    32   20       inner-right toe (middle-right)
//   body        150    52   18       outer-right toe (ring)
//   special     100   140   ellipse  main pad (heel)
const TOE_PADS = [
  { key: "movement", cx: 50,  cy: 52, r: 18 },
  { key: "food",     cx: 84,  cy: 32, r: 20 },
  { key: "mind",     cx: 116, cy: 32, r: 20 },
  { key: "body",     cx: 150, cy: 52, r: 18 },
];
// Main pad as a rounded squircle path so it reads as a single
// "heel" element rather than a circle.
const MAIN_PAD_PATH = "M 60 110 Q 60 80 100 80 Q 140 80 140 110 Q 152 130 140 160 Q 130 178 100 178 Q 70 178 60 160 Q 48 130 60 110 Z";

function Segment({ kind, filled, color, x, y, r, isPath, onPress }) {
  const scale = useRef(new Animated.Value(filled ? 1 : 0.92)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: filled ? 1 : 0.92,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [filled, scale]);

  const fillColor = filled ? color.fill : "transparent";
  const strokeColor = filled ? color.stroke : color.dim;
  const strokeWidth = filled ? 2 : 3;

  if (isPath) {
    return (
      <AnimatedG transform={[{ scale }]} originX="100" originY="129">
        <Path
          d={MAIN_PAD_PATH}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </AnimatedG>
    );
  }
  return (
    <AnimatedG transform={[{ scale }]} originX={String(x)} originY={String(y)}>
      <Circle
        cx={x}
        cy={y}
        r={r}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </AnimatedG>
  );
}

export default function PawgressPaw({
  completion = { food: false, movement: false, body: false, mind: false, special: false },
  size = 200,
  colorMode = "today",
  onSegmentTap,
}) {
  const color = COLORS[colorMode] || COLORS.today;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {TOE_PADS.map((toe) => (
          <Segment
            key={toe.key}
            kind={toe.key}
            filled={!!completion[toe.key]}
            color={color}
            x={toe.cx}
            y={toe.cy}
            r={toe.r}
            isPath={false}
          />
        ))}
        <Segment
          kind="special"
          filled={!!completion.special}
          color={color}
          isPath
        />
      </Svg>
      {/* Tap targets layered on top of the SVG. Positioned via percent
          of the box so they scale with `size` correctly. Only renders
          when onSegmentTap is provided (display mode skips them). */}
      {onSegmentTap && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {TOE_PADS.map((toe) => {
            const left = (toe.cx - toe.r) / 200 * size;
            const top  = (toe.cy - toe.r) / 200 * size;
            const w    = (toe.r * 2) / 200 * size;
            return (
              <Animated.View
                key={toe.key}
                onTouchEnd={() => onSegmentTap(toe.key)}
                accessibilityRole="button"
                accessibilityLabel={`Toggle ${toe.key} segment`}
                style={{ position: "absolute", left, top, width: w, height: w, borderRadius: w / 2 }}
              />
            );
          })}
          {/* Main pad tap area */}
          <Animated.View
            onTouchEnd={() => onSegmentTap("special")}
            accessibilityRole="button"
            accessibilityLabel="Toggle special segment"
            style={{ position: "absolute", left: 60 / 200 * size, top: 80 / 200 * size, width: 80 / 200 * size, height: 100 / 200 * size, borderRadius: 40 / 200 * size }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});

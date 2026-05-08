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
//
// On the transition from "not all 5" → "all 5" the whole paw does a
// happy little 360° spin and a green check badge fades in at the
// bottom-right, matching the FloofLife logo's checkBadge style. This
// is in ADDITION to the parent screen's PawgressCelebration overlay
// (12 floating particles + headline + notifySuccess haptic) — the
// spin + badge are paw-internal; the celebration overlay is
// screen-level.
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Svg, { Circle, Path, G } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const PAW_SEGMENT_KEYS = ["food", "movement", "body", "mind", "special"];

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
  const isComplete = PAW_SEGMENT_KEYS.every((s) => !!completion[s]);
  const wasCompleteRef = useRef(isComplete);

  // Animated values for the completion transition:
  // - spinRotation drives a one-shot 360° rotation of the whole paw
  // - checkOpacity + checkScale fade-and-pop the green check badge in
  // Pre-initialized to "complete" values when isComplete is already true
  // on mount (e.g., user opens the app with today already finished —
  // we skip the entrance animation but still show the badge).
  const spinRotation = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(isComplete ? 1 : 0)).current;
  const checkScale   = useRef(new Animated.Value(isComplete ? 1 : 0)).current;

  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      // Just transitioned to complete — fire the spin + badge animation.
      // Spin first (700ms), then check badge fades + springs in.
      Animated.sequence([
        Animated.timing(spinRotation, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(checkOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Reset rotation so future renders aren't stuck at 360°.
        spinRotation.setValue(0);
      });
    } else if (!isComplete && wasCompleteRef.current) {
      // Reverted to not-complete (segment was un-toggled) — hide the
      // badge instantly, no animation.
      checkOpacity.setValue(0);
      checkScale.setValue(0);
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete, spinRotation, checkOpacity, checkScale]);

  const spinTransform = spinRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // The check badge mirrors the FloofLife Logo's checkBadge styling
  // exactly (green circle, white check, white border) so the completed
  // Pawgress reads as "you earned the FloofLife logo today" — a brand
  // moment, not just a bunch of filled circles.
  const badgeSize = size * 0.28;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={{ transform: [{ rotate: spinTransform }] }}>
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
            when onSegmentTap is provided (display mode skips them). The
            tap targets sit INSIDE the rotating Animated.View so they
            rotate with the paw — but since the spin only fires after
            completion (not during normal tapping), this doesn't hurt
            tap accuracy in practice. */}
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
      </Animated.View>
      {/* Green check badge — same colors + border style as Logo.js's
          checkBadge, sized proportional to the paw. Sits OUTSIDE the
          rotating Animated.View so the badge stays fixed (doesn't
          spin with the paw) and reads as a stable completion stamp. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.checkBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            bottom: size * 0.04,
            right: size * 0.04,
            opacity: checkOpacity,
            transform: [{ scale: checkScale }],
            borderWidth: Math.max(2, size * 0.012),
          },
        ]}
        accessibilityElementsHidden={!isComplete}
        accessibilityLabel={isComplete ? "All 5 paw segments completed today" : undefined}
      >
        <MaterialCommunityIcons
          name="check-bold"
          size={Math.round(badgeSize * 0.62)}
          color="#fff"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  checkBadge: {
    position: "absolute",
    backgroundColor: "#3F8E5C",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#fff",
    // Subtle drop shadow so the badge floats off the paw silhouette.
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

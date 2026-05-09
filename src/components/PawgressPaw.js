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
import Svg, { Path, G } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme";

const PAW_SEGMENT_KEYS = ["food", "movement", "body", "mind", "special"];

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

// Layout — uses the literal MaterialDesignIcons "paw" SVG path
// data (24×24 viewBox), split into its 5 native sub-paths. The
// FloofLife header Logo renders MCI's "paw" glyph via
// @expo/vector-icons, so by drawing from the SAME path data here
// we guarantee the Pawgress paw + the brand-mark Logo are
// pixel-equivalent silhouettes — no more "paw doesn't match the
// logo" iterations. They ARE the same vector path.
const PAW_VIEWBOX = "0 0 24 24";
const PAW_PATHS = {
  food:     "M8.35,3C7,2.85 5.62,4.1 5.34,5.84C5.06,7.57 5.96,9.13 7.34,9.27C8.71,9.42 10.09,8.17 10.37,6.43C10.65,4.69 9.75,3.13 8.35,3Z",
  mind:     "M15.65,3C14.25,3.13 13.35,4.69 13.63,6.43C13.91,8.17 15.29,9.42 16.66,9.27C18.04,9.13 18.94,7.57 18.66,5.84C18.38,4.1 17,2.85 15.65,3Z",
  movement: "M3.79,9.5C2.45,9.78 1.71,11.55 2.16,13.21C2.6,14.86 4.04,15.97 5.38,15.7C6.71,15.42 7.45,13.65 7,12C6.5,10.34 5.12,9.23 3.79,9.5Z",
  body:     "M20.21,9.5C18.88,9.23 17.5,10.34 17,12C16.55,13.65 17.29,15.42 18.62,15.7C19.96,15.97 21.4,14.86 21.84,13.21C22.29,11.55 21.55,9.78 20.21,9.5Z",
  special:  "M11.59,11.46C10.83,11.5 10.11,11.84 9.5,12.32C8.39,13.21 7.5,14.34 6.62,15.5C5.77,16.65 4.86,17.81 4.5,19.16C4.18,20.41 4.5,21.94 5.71,22.6C7.06,23.34 8.78,23 10.16,22.69C11.53,22.38 12.93,22.31 14.32,22.42C15.59,22.5 16.91,22.83 18.13,22.34C18.95,22 19.66,21.13 19.59,20.18C19.51,18.84 18.61,17.7 17.81,16.66C16.93,15.5 16.07,14.32 14.96,13.4C13.82,12.45 12.84,11.4 11.59,11.46Z",
};
// Approximate centroids in 24×24 viewBox space — origin for the
// per-segment scale animation so each pad pops in around its own
// center.
const PAW_CENTROIDS = {
  food:     { x: 7.85,  y: 6.13 },
  mind:     { x: 16.15, y: 6.13 },
  movement: { x: 4.5,   y: 12.6 },
  body:     { x: 19.5,  y: 12.6 },
  special:  { x: 12,    y: 17.3 },
};
// Tap targets as fractions of `size` so they scale proportionally
// regardless of paw render dimensions.
const TAP_TARGETS = {
  food:     { cx: 0.33, cy: 0.26, r: 0.13 },
  mind:     { cx: 0.67, cy: 0.26, r: 0.13 },
  movement: { cx: 0.19, cy: 0.53, r: 0.13 },
  body:     { cx: 0.81, cy: 0.53, r: 0.13 },
  special:  { cx: 0.50, cy: 0.72, r: 0.27 },
};

function Segment({ kind, filled, color }) {
  const scale = useRef(new Animated.Value(filled ? 1 : 0.92)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: filled ? 1 : 0.92,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [filled, scale]);

  // Both states use fill (no stroke). Empty: low-opacity tint of
  // the brand accent. Filled: solid accent. Same vector path —
  // identical geometry between empty and filled.
  const fillColor = filled ? color.fill : color.dim;
  const centroid = PAW_CENTROIDS[kind] || { x: 12, y: 12 };
  return (
    <AnimatedG transform={[{ scale }]} originX={String(centroid.x)} originY={String(centroid.y)}>
      <Path d={PAW_PATHS[kind]} fill={fillColor} />
    </AnimatedG>
  );
}

export default function PawgressPaw({
  completion = { food: false, movement: false, body: false, mind: false, special: false },
  size = 200,
  colorMode = "today",
  onSegmentTap,
  // Optional override controlling when the spin + green-check
  // celebration fires. Default = "all 5 pads filled". Callers can
  // pass a wider signal (e.g., 5 pads filled AND daily checklist
  // complete) so the green check only appears when the user has
  // genuinely wrapped today's care — at which point the paw +
  // check together render as the FloofLife logo.
  isComplete: isCompleteOverride,
}) {
  const color = COLORS[colorMode] || COLORS.today;
  const allFivePads = PAW_SEGMENT_KEYS.every((s) => !!completion[s]);
  const isComplete = isCompleteOverride != null
    ? !!isCompleteOverride
    : allFivePads;
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

  // Idle "wave/stretch" animation that runs every ~6-10 seconds when
  // the paw is NOT already complete. Per build 19 smoke-test feedback
  // — "make it animated like it moves every now and then in some fun
  // way like it waves hello or does a paw stretch." A quick happy
  // tilt + scale-pulse, then pause. Once isComplete=true the paw
  // settles into a "resting proud" pose with the green check badge
  // and stops idling — completion is its own signal.
  const idleRotation = useRef(new Animated.Value(0)).current;
  const idleScale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isComplete) return; // resting proud — no idle wiggle when done
    let mounted = true;
    let timer = null;
    function tick() {
      if (!mounted) return;
      Animated.parallel([
        Animated.sequence([
          Animated.timing(idleRotation, { toValue: -1,   duration: 180, useNativeDriver: true }),
          Animated.timing(idleRotation, { toValue: 1,    duration: 220, useNativeDriver: true }),
          Animated.timing(idleRotation, { toValue: -0.4, duration: 140, useNativeDriver: true }),
          Animated.timing(idleRotation, { toValue: 0,    duration: 120, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(idleScale, { toValue: 1.06, duration: 250, useNativeDriver: true }),
          Animated.timing(idleScale, { toValue: 1,    duration: 350, useNativeDriver: true }),
        ]),
      ]).start(() => {
        if (!mounted) return;
        // Random 6-10s pause until the next wave
        const next = 6000 + Math.random() * 4000;
        timer = setTimeout(tick, next);
      });
    }
    // Initial wait 3-5s after mount before the first wave
    timer = setTimeout(tick, 3000 + Math.random() * 2000);
    return () => { mounted = false; if (timer) clearTimeout(timer); };
  }, [isComplete, idleRotation, idleScale]);

  const idleRotationDeg = idleRotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

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
        <Animated.View style={{ transform: [{ rotate: idleRotationDeg }, { scale: idleScale }] }}>
        <Svg width={size} height={size} viewBox={PAW_VIEWBOX}>
          {PAW_SEGMENT_KEYS.map((key) => (
            <Segment
              key={key}
              kind={key}
              filled={!!completion[key]}
              color={color}
            />
          ))}
        </Svg>
        {/* Tap targets layered on top of the SVG. Positioned as
            fractions of `size` so they scale with the paw. */}
        {onSegmentTap && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {PAW_SEGMENT_KEYS.map((key) => {
              const t = TAP_TARGETS[key];
              const left = Math.round(size * (t.cx - t.r));
              const top  = Math.round(size * (t.cy - t.r));
              const w    = Math.round(size * t.r * 2);
              return (
                <Animated.View
                  key={key}
                  onTouchEnd={() => onSegmentTap(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${key} segment`}
                  style={{ position: "absolute", left, top, width: w, height: w, borderRadius: w / 2 }}
                />
              );
            })}
          </View>
        )}
        </Animated.View>
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

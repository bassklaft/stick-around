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
import Svg, { Ellipse, Path, G } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PAW_VIEWBOX, PAW_TOES, PAW_HEEL_PATH } from "./PawIcon";
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

// Geometry comes from the canonical PawIcon component (PAW_TOES +
// PAW_HEEL_PATH), so the Pawgress activity ring renders the SAME
// vector as the Logo header, the tab bar, and the asset PNGs. No
// drift between surfaces. Per Build-33 spec: the 100×100 viewBox
// values are LOCKED — do not adjust here.
//
// Tap targets in 100×100 user-space (fractions of `size`).
const TAP_TARGETS = {
  movement: { cx: 0.22, cy: 0.33, r: 0.13 },
  food:     { cx: 0.41, cy: 0.22, r: 0.13 },
  mind:     { cx: 0.59, cy: 0.22, r: 0.13 },
  body:     { cx: 0.78, cy: 0.33, r: 0.13 },
  special:  { cx: 0.50, cy: 0.78, r: 0.28 },
};
// Lookup by toe key for centroid (origin of the per-segment scale
// animation). Heel uses (50, 78) — the rough center of the heel-pad
// path's bounding box.
const TOE_BY_KEY = PAW_TOES.reduce((acc, t) => { acc[t.key] = t; return acc; }, {});
const HEEL_CENTROID = { x: 50, y: 78 };

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
  // the color theme. Filled: solid theme color. Same vector path
  // either way — identical geometry between empty and filled.
  const fillColor = filled ? color.fill : color.dim;

  if (kind === "special") {
    return (
      <AnimatedG
        transform={[{ scale }]}
        originX={String(HEEL_CENTROID.x)}
        originY={String(HEEL_CENTROID.y)}
      >
        <Path d={PAW_HEEL_PATH} fill={fillColor} />
      </AnimatedG>
    );
  }
  const t = TOE_BY_KEY[kind];
  if (!t) return null;
  return (
    <AnimatedG
      transform={[{ scale }]}
      originX={String(t.cx)}
      originY={String(t.cy)}
    >
      <Ellipse
        cx={t.cx}
        cy={t.cy}
        rx={t.rx}
        ry={t.ry}
        transform={`rotate(${t.rot} ${t.cx} ${t.cy})`}
        fill={fillColor}
      />
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

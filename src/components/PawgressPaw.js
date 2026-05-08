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

// Layout — 5 segments inside a 200×200 bounding box. Designed to match
// the silhouette of MaterialCommunityIcons "paw" (the icon used in the
// nav-bar tab) so the Pawgress paw and the tab paw read as the same
// brand mark. Toe pads are tilted ellipses (teardrops fanned outward)
// instead of plain circles; the heel is a heart-style pad with three
// subtle bumps along the top edge instead of a flat squircle.
//
//   key           cx   cy   rx  ry  rot°    label
//   movement     46   74   14  22   -28    outer-left toe (pinky)
//   food         78   42   15  24    -8    inner-left toe (index)
//   mind        122   42   15  24    +8    inner-right toe (middle)
//   body        154   74   14  22   +28    outer-right toe (ring)
//   special     heart-pad path                  main pad (heel)
const TOE_PADS = [
  { key: "movement", cx: 46,  cy: 74, rx: 14, ry: 22, rot: -28 },
  { key: "food",     cx: 78,  cy: 42, rx: 15, ry: 24, rot: -8 },
  { key: "mind",     cx: 122, cy: 42, rx: 15, ry: 24, rot: 8 },
  { key: "body",     cx: 154, cy: 74, rx: 14, ry: 22, rot: 28 },
];
// Heel pad — heart/trefoil silhouette mirroring the MCI paw heel.
// Three soft bumps along the top (left, middle, right) where toes
// would attach, sides taper inward to a rounded bottom point.
const MAIN_PAD_PATH = "M 55 132 C 46 106, 60 92, 76 98 C 82 88, 96 86, 100 100 C 104 86, 118 88, 124 98 C 140 92, 154 106, 145 132 C 152 158, 130 180, 100 184 C 70 180, 48 158, 55 132 Z";

function Segment({ kind, filled, color, x, y, rx, ry, rot, isPath }) {
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
      <AnimatedG transform={[{ scale }]} originX="100" originY="138">
        <Path
          d={MAIN_PAD_PATH}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </AnimatedG>
    );
  }
  // Toe pad — tilted ellipse to evoke a teardrop / soft fingertip,
  // matching the MCI paw silhouette. Rotation is applied to the
  // ellipse via the SVG transform attribute (rotate around the
  // ellipse's own center); the surrounding G handles the fill-in
  // scale animation around that same point.
  return (
    <AnimatedG transform={[{ scale }]} originX={String(x)} originY={String(y)}>
      <Ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        transform={`rotate(${rot} ${x} ${y})`}
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
        <Svg width={size} height={size} viewBox="0 0 200 200">
          {TOE_PADS.map((toe) => (
            <Segment
              key={toe.key}
              kind={toe.key}
              filled={!!completion[toe.key]}
              color={color}
              x={toe.cx}
              y={toe.cy}
              rx={toe.rx}
              ry={toe.ry}
              rot={toe.rot}
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
              // Approximate the rotated-ellipse tap region with an
              // axis-aligned rectangle that fits the ellipse's larger
              // axis — slightly generous, which is fine for tapping.
              const tapR = Math.max(toe.rx, toe.ry) + 2;
              const left = (toe.cx - tapR) / 200 * size;
              const top  = (toe.cy - tapR) / 200 * size;
              const w    = (tapR * 2) / 200 * size;
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
            {/* Main pad tap area — sized to the heel-pad path bounds */}
            <Animated.View
              onTouchEnd={() => onSegmentTap("special")}
              accessibilityRole="button"
              accessibilityLabel="Toggle special segment"
              style={{ position: "absolute", left: 46 / 200 * size, top: 86 / 200 * size, width: 108 / 200 * size, height: 100 / 200 * size, borderRadius: 40 / 200 * size }}
            />
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

// Confetti + hearts celebration overlay. Programmatic — no third-
// party confetti library. 12 floating particles (mix of 🐾 / 💛 /
// 🎉 / ✨) animate from center outward with random angles + slight
// rotation, fade out at the end.
//
// Used when the user fills all 5 paw segments for the day. Sober
// enough not to feel obnoxious; physical enough to feel like a
// reward.
import React, { useEffect, useRef } from "react";
import { Animated, View, Text, StyleSheet, Dimensions } from "react-native";

const PARTICLES = [
  { emoji: "🐾", angle:  -90, distance: 140, size: 32 },
  { emoji: "💛", angle:  -60, distance: 130, size: 28 },
  { emoji: "🎉", angle:  -30, distance: 150, size: 30 },
  { emoji: "✨", angle:    0, distance: 120, size: 24 },
  { emoji: "🐾", angle:   30, distance: 150, size: 26 },
  { emoji: "💛", angle:   60, distance: 130, size: 28 },
  { emoji: "🎉", angle:   90, distance: 140, size: 32 },
  { emoji: "✨", angle:  120, distance: 130, size: 24 },
  { emoji: "🐾", angle:  150, distance: 140, size: 28 },
  { emoji: "💛", angle: -150, distance: 130, size: 26 },
  { emoji: "🎉", angle: -120, distance: 150, size: 30 },
  { emoji: "✨", angle: -160, distance: 120, size: 24 },
];

function Particle({ emoji, angle, distance, size, progress }) {
  const radians = (angle * Math.PI) / 180;
  const tx = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(radians) * distance],
  });
  const ty = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(radians) * distance],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.4, 1.2, 0.9],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${(angle > 0 ? 1 : -1) * 90}deg`],
  });
  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          fontSize: size,
          opacity,
          transform: [
            { translateX: tx },
            { translateY: ty },
            { scale },
            { rotate },
          ],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function PawgressCelebration({ visible, onDone, headline = "All 5 today" }) {
  const progress = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    headlineOpacity.setValue(0);
    headlineScale.setValue(0.6);
    Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.spring(headlineScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(headlineOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(headlineOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start(() => {
      if (onDone) onDone();
    });
  }, [visible, progress, headlineOpacity, headlineScale, onDone]);

  if (!visible) return null;

  const { width, height } = Dimensions.get("window");
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]} pointerEvents="none">
      {PARTICLES.map((p, i) => (
        <View
          key={i}
          style={{ position: "absolute", left: centerX - 16, top: centerY - 16, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
        >
          <Particle {...p} progress={progress} />
        </View>
      ))}
      <Animated.View
        style={[
          styles.headlineCard,
          { opacity: headlineOpacity, transform: [{ scale: headlineScale }] },
        ]}
      >
        <Text style={styles.headline}>{headline}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  particle:    { textAlign: "center" },
  headlineCard:{ paddingVertical: 14, paddingHorizontal: 22, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 2, borderColor: "#E8A33B", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  headline:    { fontSize: 18, fontWeight: "800", color: "#5A3F0A", textAlign: "center" },
});

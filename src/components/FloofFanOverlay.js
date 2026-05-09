// FloofFanOverlay — appears when the user long-presses the My Floofs
// tab. Pet profile-photo circles fan out from above the tab in an
// arc.
//
// v1.2.0 build 20: supports both interaction styles in one gesture
// system, no new native deps:
//
//   - TAP: single touchdown + release on a circle → picks that pet.
//     (Discovery-friendly behavior the user already knows.)
//   - SLIDE-TO-SELECT: touch anywhere → drag finger across the arc →
//     release on a circle → picks it. The hovered circle scales up
//     and gets the active-pet ring as visual feedback.
//   - DISMISS: release outside any circle → close overlay without
//     picking. Tapping the dim scrim does the same.
//
// Implemented with a single PanResponder on the modal root. Each
// circle's on-screen center is computed once on render (originX +
// offsetX, originY + offsetY), and pointer (x, y) is matched against
// each center on every move event. No external gesture library needed.
//
// Per build 19 smoke-test feedback: "see if you can make it fan out
// some circles with icons of your pets. like a hand of cards but
// circles not rectangles and those icons are the profile pictures."
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import PetAvatar from "./PetAvatar";
import { computeFanCenters, CIRCLE_DIAMETER } from "../lib/fanGeometry";
import { theme } from "../theme";

// FloofFanOverlay is now PURE PRESENTATION — the gesture is owned
// by the custom My Floofs tab button (MyFloofsTabButton). The tab
// button captures the touch from the long-press through the slide
// to the release, computes the hovered pet via hitTestFan, and
// passes hoveredId in here for visual feedback. Release commits
// the pick at the App level, not inside this component.
export default function FloofFanOverlay({
  visible,
  pets,
  activeId,
  hoveredId,
  bottomInset = 0,
  onClose,
}) {
  const { height } = Dimensions.get("window");
  const [mounted, setMounted] = useState(visible);
  const animProgress = useRef(new Animated.Value(visible ? 0 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(animProgress, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(animProgress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, animProgress, mounted]);

  const n = pets.length;
  const centers = computeFanCenters(pets, bottomInset);

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* No PanResponder here anymore — the gesture lives on the
          custom My Floofs tab button so the long-press → slide can
          be a single continuous touch session. The modal is purely
          a visual layer rendered based on hoveredId from above. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.45)", opacity: animProgress },
          ]}
        />
        {/* Hero title — updates as the finger slides. Positioned at
            vertical mid-screen so the user reading the name is close
            to where their finger is hovering. Falls back to the
            active pet's name when nothing is hovered. */}
        <Animated.View
          style={[
            styles.titleHero,
            { top: height * 0.34, opacity: animProgress },
          ]}
        >
          {(() => {
            const hovered = hoveredId ? pets.find((p) => p.id === hoveredId) : null;
            const fallbackActive = pets.find((p) => p.id === activeId);
            const target = hovered || fallbackActive;
            const targetName = (target?.name || "").split(" ")[0] || target?.name || "";
            return (
              <>
                {targetName ? (
                  <Text style={styles.titleHeroName} numberOfLines={1}>{targetName}</Text>
                ) : null}
                <Text style={styles.titleHeroHint}>
                  {hoveredId
                    ? "Release to switch"
                    : "Slide to a floof · release to switch"}
                </Text>
              </>
            );
          })()}
        </Animated.View>

        {pets.map((p, i) => {
          const center = centers[i];
          if (!center) return null;
          const isHovered = p.id === hoveredId;
          const isActive = p.id === activeId;
          const baseScale = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          return (
            <Animated.View
              key={p.id || i}
              style={[
                styles.circleAnchor,
                {
                  left: center.cx - CIRCLE_DIAMETER / 2,
                  top: center.cy - CIRCLE_DIAMETER / 2,
                  transform: [
                    { scale: baseScale },
                    { scale: isHovered ? 1.18 : 1 },
                  ],
                  opacity: animProgress,
                },
              ]}
            >
              <View
                style={[
                  styles.circle,
                  isActive && styles.circleActive,
                  isHovered && styles.circleHovered,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${p.name}`}
                accessibilityState={{ selected: isActive }}
              >
                <PetAvatar pet={p} size={CIRCLE_DIAMETER - 6} slot="primary" />
                {isActive && (
                  <View style={styles.activeDot}>
                    <View style={styles.activeDotInner} />
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  titleHero: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  titleHeroName: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -0.6,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    textTransform: "capitalize",
  },
  titleHeroHint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginTop: 6,
    textAlign: "center",
  },
  circleAnchor: {
    position: "absolute",
    width: CIRCLE_DIAMETER,
    alignItems: "center",
  },
  circle: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: CIRCLE_DIAMETER / 2,
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: theme.accentSoft,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  circleActive: {
    borderColor: theme.accent,
    borderWidth: 4,
  },
  circleHovered: {
    borderColor: theme.accent,
    borderWidth: 4,
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  circleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  circlePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.accentSoft,
  },
  activeDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#3F8E5C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    textTransform: "capitalize",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  labelHovered: {
    color: theme.accent,
    fontSize: 13,
  },
});

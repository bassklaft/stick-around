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
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { breedEmoji } from "../data/breeds";
import { getPrimaryBreed } from "../lib/petBreeds";
import { pickPhotoForSlot } from "../lib/petPhotos";
import { tapLight } from "../lib/haptics";
import { theme } from "../theme";

const CIRCLE_DIAMETER = 76;
const ARC_RADIUS = 170;
// A touch within this radius of a circle's center is considered "over"
// it. Slightly larger than the circle itself so the user doesn't have
// to be pixel-perfect during a slide.
const HOVER_RADIUS = CIRCLE_DIAMETER / 2 + 18;

export default function FloofFanOverlay({
  visible,
  pets,
  activeId,
  onPick,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");
  const tabBarHeight = 86;
  const originX = width - 60;
  const originY = height - insets.bottom - tabBarHeight + 22;

  const [mounted, setMounted] = useState(visible);
  const animProgress = useRef(new Animated.Value(visible ? 0 : 0)).current;

  // Currently-hovered pet id (during slide / press). null = no hover.
  const [hoveredId, setHoveredId] = useState(null);
  // Refs so the PanResponder closures see the latest values without
  // re-creating the responder on every render.
  const hoveredIdRef = useRef(null);
  const petsRef = useRef(pets);
  petsRef.current = pets;
  const isAnimatingInRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      isAnimatingInRef.current = true;
      Animated.spring(animProgress, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start(() => { isAnimatingInRef.current = false; });
    } else if (mounted) {
      Animated.timing(animProgress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
        setHoveredId(null);
        hoveredIdRef.current = null;
      });
    }
  }, [visible, animProgress, mounted]);

  const n = pets.length;
  const angleStart = Math.PI;
  const angleEnd = Math.PI * 1.5;

  // Compute on-screen centers for each pet circle. Memoized against
  // pets/dimensions so PanResponder hit-testing is cheap.
  const centers = useMemo(() => {
    return pets.map((p, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const angle = angleStart + t * (angleEnd - angleStart);
      return {
        id: p.id,
        cx: originX + ARC_RADIUS * Math.cos(angle),
        cy: originY + ARC_RADIUS * Math.sin(angle),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets, originX, originY, n]);
  const centersRef = useRef(centers);
  centersRef.current = centers;

  // Find which circle (if any) the touch is currently over. Returns
  // the pet id or null.
  function hitTest(x, y) {
    let bestId = null;
    let bestDistSq = HOVER_RADIUS * HOVER_RADIUS;
    for (const c of centersRef.current) {
      const dx = x - c.cx;
      const dy = y - c.cy;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestId = c.id;
      }
    }
    return bestId;
  }

  function updateHover(x, y) {
    const next = hitTest(x, y);
    if (next !== hoveredIdRef.current) {
      hoveredIdRef.current = next;
      setHoveredId(next);
      if (next) tapLight();
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        // Don't accept input until the entrance animation is finished
        // — prevents accidental pick on a still-flying-out circle.
        if (isAnimatingInRef.current) return;
        updateHover(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderMove: (e) => {
        updateHover(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderRelease: () => {
        const picked = hoveredIdRef.current;
        hoveredIdRef.current = null;
        setHoveredId(null);
        if (picked) {
          onPick?.(picked);
        } else {
          onClose?.();
        }
      },
      onPanResponderTerminate: () => {
        hoveredIdRef.current = null;
        setHoveredId(null);
      },
    }),
  ).current;

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.45)", opacity: animProgress },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.hint,
            { top: insets.top + 24, opacity: animProgress },
          ]}
        >
          <Text style={styles.hintText}>
            Tap a floof — or slide to one and release
          </Text>
        </Animated.View>

        {pets.map((p, i) => {
          const t = n === 1 ? 0.5 : i / (n - 1);
          const angle = angleStart + t * (angleEnd - angleStart);
          const offsetX = ARC_RADIUS * Math.cos(angle);
          const offsetY = ARC_RADIUS * Math.sin(angle);

          const translateX = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, offsetX],
          });
          const translateY = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, offsetY],
          });
          // Hovered circle scales up; others stay at 1. Use a separate
          // Animated value that reacts to hover state.
          const isHovered = p.id === hoveredId;
          const baseScale = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const isActive = p.id === activeId;
          const primary = getPrimaryBreed(p);
          const firstName = (p.name || "").split(" ")[0] || p.name;
          const fanUri = pickPhotoForSlot(p, "primary");

          return (
            <Animated.View
              key={p.id || i}
              pointerEvents="none"
              style={[
                styles.circleAnchor,
                {
                  left: originX - CIRCLE_DIAMETER / 2,
                  top: originY - CIRCLE_DIAMETER / 2,
                  transform: [
                    { translateX },
                    { translateY },
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
                {fanUri ? (
                  <Image source={{ uri: fanUri }} style={styles.circleImage} />
                ) : (
                  <View style={styles.circlePlaceholder}>
                    <Text style={{ fontSize: 32 }}>{breedEmoji(primary)}</Text>
                  </View>
                )}
                {isActive && (
                  <View style={styles.activeDot}>
                    <View style={styles.activeDotInner} />
                  </View>
                )}
              </View>
              <Text
                style={[styles.label, isHovered && styles.labelHovered]}
                numberOfLines={1}
              >
                {firstName}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    overflow: "hidden",
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

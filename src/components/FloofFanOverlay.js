// FloofFanOverlay — appears when the user long-presses the My Floofs
// tab. Pet profile-photo circles fan out from above the tab in an
// arc; tap a circle to switch active pet. Tap the dark scrim to
// dismiss without picking.
//
// v1.2.0 ships TAP-to-select for simplicity. The continuous slide-
// to-select gesture (long-press + drag finger to a circle + release
// to pick) is a v1.3 polish item — needs react-native-gesture-handler
// infrastructure that adds dep weight + complexity. The tap version
// covers the same intent ("show me a fan of my floofs from the
// long-press, let me pick one").
//
// Per build 19 smoke-test feedback: "see if you can make it fan out
// some circles with icons of your pets. like a hand of cards but
// circles not rectangles and those icons are the profile pictures."
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { breedEmoji } from "../data/breeds";
import { getPrimaryBreed } from "../lib/petBreeds";
import { theme } from "../theme";

const CIRCLE_DIAMETER = 76;
const ARC_RADIUS = 170;

export default function FloofFanOverlay({
  visible,
  pets,
  activeId,
  onPick,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");
  // My Floofs tab sits at the bottom-right of the tab bar; tab bar
  // height is ~86 on iOS in this app's config. Anchor the fan origin
  // there so the circles look like they're flying out of the icon.
  const tabBarHeight = 86;
  const originX = width - 60;
  const originY = height - insets.bottom - tabBarHeight + 22;

  // Render lifecycle: keep the Modal mounted while fading out so the
  // dismiss animation can play. `mounted` controls whether <Modal> is
  // rendered at all; `visible` from prop controls the in/out anim.
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

  if (!mounted) return null;

  const n = pets.length;
  // Quarter arc from "left of tab" (180°) to "straight up" (270°).
  // For 1 pet (degenerate case — overlay shouldn't render anyway in
  // single-pet households), centers them at 225°. For 2+ pets,
  // distributes evenly across the arc.
  const angleStart = Math.PI;
  const angleEnd = Math.PI * 1.5;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.45)", opacity: animProgress },
          ]}
        />
        {/* "Tap a floof to switch" hint near the top of the screen */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.hint,
            { top: insets.top + 24, opacity: animProgress },
          ]}
        >
          <Text style={styles.hintText}>Tap a floof to switch active</Text>
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
          const scale = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const isActive = p.id === activeId;
          const primary = getPrimaryBreed(p);
          const firstName = (p.name || "").split(" ")[0] || p.name;

          return (
            <Animated.View
              key={p.id || i}
              style={[
                styles.circleAnchor,
                {
                  left: originX - CIRCLE_DIAMETER / 2,
                  top: originY - CIRCLE_DIAMETER / 2,
                  transform: [{ translateX }, { translateY }, { scale }],
                  opacity: animProgress,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => onPick(p.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${p.name}`}
                accessibilityState={{ selected: isActive }}
              >
                <View style={[styles.circle, isActive && styles.circleActive]}>
                  {p.photoUri ? (
                    <Image source={{ uri: p.photoUri }} style={styles.circleImage} />
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
                <Text style={styles.label} numberOfLines={1}>
                  {firstName}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Pressable>
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
});

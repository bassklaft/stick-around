// MyFloofsTabButton — replaces React Navigation's default tab-bar
// button for the My Floofs tab so we can OWN the touch from
// touchdown through long-press → slide → release. The default
// React Nav tab button fires `tabLongPress` as a discrete event,
// which means by the time the FloofFanOverlay mounts the user's
// finger has already lifted (the touch session ended on the tab
// button). With this custom button, the touch session continues:
// the same PanResponder that detected the long-press also tracks
// finger movement during the fan-out and commits the pick on
// release — no re-touch needed.
//
// Behavior contract (the tab button calls these props in sequence):
//   - SHORT TAP (release before LONG_PRESS_MS, no movement) →
//     props.onShortTap() — caller should navigate to YourPets.
//   - LONG PRESS fires → props.onLongPressStart() — caller opens
//     the FloofFanOverlay.
//   - During slide → props.onLongPressMove(pageX, pageY) — caller
//     hit-tests against fan circle centers and updates hoveredId.
//   - On release after long-press → props.onLongPressEnd(pageX, pageY)
//     — caller commits the pick if a circle was hovered, dismisses
//     the fan otherwise.
//
// The button itself renders a standard tab-bar layout (paw icon +
// "My Floofs" label) using accessibilityState.selected to mirror
// React Navigation's focused state.
import React, { useRef } from "react";
import { View, Text, PanResponder, StyleSheet } from "react-native";
import PawIcon from "./PawIcon";
import { theme } from "../theme";

const LONG_PRESS_MS = 450;
const TAP_THRESHOLD = 10;

export default function MyFloofsTabButton(props) {
  const {
    accessibilityState,
    onPress,
    onShortTap,
    onLongPressStart,
    onLongPressMove,
    onLongPressEnd,
  } = props;

  const focused = !!accessibilityState?.selected;

  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        movedRef.current = false;
        longPressFiredRef.current = false;
        startXRef.current = e.nativeEvent.pageX;
        startYRef.current = e.nativeEvent.pageY;
        clearLongPressTimer();
        longPressTimerRef.current = setTimeout(() => {
          if (!movedRef.current) {
            longPressFiredRef.current = true;
            onLongPressStart?.();
            // Seed the hover with the touch's current position so
            // the fan can show the active pet highlighted before
            // the user moves.
            onLongPressMove?.(startXRef.current, startYRef.current);
          }
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (e, g) => {
        const { pageX, pageY } = e.nativeEvent;
        const dx = pageX - startXRef.current;
        const dy = pageY - startYRef.current;
        if (!longPressFiredRef.current && (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD)) {
          // Significant movement BEFORE long-press fired — user is
          // panning, cancel the long-press timer; this still counts
          // as a "tap that moved" rather than a long-press session.
          movedRef.current = true;
          clearLongPressTimer();
        }
        if (longPressFiredRef.current) {
          onLongPressMove?.(pageX, pageY);
        }
      },
      onPanResponderRelease: (e) => {
        clearLongPressTimer();
        if (longPressFiredRef.current) {
          longPressFiredRef.current = false;
          onLongPressEnd?.(e.nativeEvent.pageX, e.nativeEvent.pageY);
          return;
        }
        if (!movedRef.current) {
          // Short tap → caller's "navigate to My Floofs" path. We
          // pass through to props.onPress (React Nav's default
          // navigate handler) AND fire onShortTap for any extra
          // haptic / analytics the parent wants.
          onShortTap?.();
          onPress?.();
        }
      },
      onPanResponderTerminate: () => {
        // The gesture was taken over by another responder (system
        // gesture, multitasking, edge swipe, etc.). If a long-press
        // had fired, fire onLongPressEnd with off-screen coords so
        // the parent always closes the fan-out — otherwise the
        // overlay stays on screen with no way to dismiss and the
        // app appears frozen. This was the build 40/41 freeze bug
        // surfaced via the slide-to-select on the My Floofs tab.
        clearLongPressTimer();
        if (longPressFiredRef.current) {
          longPressFiredRef.current = false;
          onLongPressEnd?.(-1, -1);
        }
      },
    }),
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="My Floofs · long-press for the floof fan"
      accessibilityState={{ selected: focused }}
    >
      <PawIcon size={24} color={focused ? theme.accent : theme.muted} />
      <Text style={[styles.label, { color: focused ? theme.accent : theme.muted }]}>
        My Floofs
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 4,
  },
  label: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

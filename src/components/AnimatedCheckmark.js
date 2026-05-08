// Drawn-in checkmark — for inline use next to completed Pawgress
// segments + checklist items. Uses the SVG strokeDasharray /
// strokeDashoffset animation pattern to give the line a "drawing in"
// effect when the `visible` prop transitions to true.
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Path length for a 24×24 viewbox checkmark — measured in SVG units.
const CHECKMARK_LENGTH = 26;

export default function AnimatedCheckmark({
  size = 24,
  color = "#fff",
  strokeWidth = 3,
  visible = true,
  duration = 350,
}) {
  const dashOffset = useRef(new Animated.Value(visible ? 0 : CHECKMARK_LENGTH)).current;

  useEffect(() => {
    Animated.timing(dashOffset, {
      toValue: visible ? 0 : CHECKMARK_LENGTH,
      duration,
      useNativeDriver: false, // strokeDashoffset is a non-transform prop
    }).start();
  }, [visible, dashOffset, duration]);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <AnimatedPath
        d="M 5 12 L 10 17 L 19 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={CHECKMARK_LENGTH}
        strokeDashoffset={dashOffset}
      />
    </Svg>
  );
}

// BristolIcon — line-art SVG representation of the Bristol Stool Scale
// 1-7. Deliberately ABSTRACT — small shapes that suggest texture +
// consistency without graphic photographic visuals (per the spec's
// Apple-review guideline: "use friendly illustrated icons, NOT graphic
// photographic visuals"). These are placeholders — the spec flags
// commissioned illustrations as v1.3 design polish.
//
// Each level renders a single 48×48 viewBox icon styled as a small
// container of "shapes" suggesting consistency. Color is themable.
import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export default function BristolIcon({ scale = 4, size = 48, color = "#7A4F0A" }) {
  const stroke = color;
  const fillSoft = color + "33";
  const fillStrong = color + "AA";
  switch (scale) {
    case 1: // pebbles — separate hard lumps
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx="14" cy="20" r="5" fill={fillStrong} stroke={stroke} strokeWidth="1.5" />
          <Circle cx="26" cy="14" r="4.5" fill={fillStrong} stroke={stroke} strokeWidth="1.5" />
          <Circle cx="34" cy="24" r="5" fill={fillStrong} stroke={stroke} strokeWidth="1.5" />
          <Circle cx="20" cy="32" r="4" fill={fillStrong} stroke={stroke} strokeWidth="1.5" />
          <Circle cx="32" cy="36" r="4.5" fill={fillStrong} stroke={stroke} strokeWidth="1.5" />
        </Svg>
      );
    case 2: // lumpy log — sausage-shaped but bumpy
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Path d="M 6 24 Q 10 18 16 22 Q 22 16 28 22 Q 34 18 42 24 Q 38 30 30 26 Q 22 32 14 26 Q 10 30 6 24 Z" fill={fillStrong} stroke={stroke} strokeWidth="1.5" />
        </Svg>
      );
    case 3: // cracked log — sausage with cracks
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Rect x="6" y="20" width="36" height="10" rx="5" fill={fillStrong} stroke={stroke} strokeWidth="1.5" />
          <Path d="M 14 20 L 14 30 M 22 20 L 22 30 M 30 20 L 30 30" stroke={stroke} strokeWidth="1" />
        </Svg>
      );
    case 4: // smooth log — soft snake-like (ideal)
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Rect x="4" y="20" width="40" height="10" rx="5" fill={fillStrong} stroke={stroke} strokeWidth="1.5" />
          <Path d="M 10 25 Q 24 22 38 25" stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" />
        </Svg>
      );
    case 5: // soft blobs — distinct soft lumps
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Path d="M 8 22 Q 12 16 18 20 Q 16 28 10 26 Q 6 28 8 22 Z" fill={fillSoft} stroke={stroke} strokeWidth="1.2" />
          <Path d="M 22 16 Q 28 14 30 22 Q 28 28 22 26 Q 18 22 22 16 Z" fill={fillSoft} stroke={stroke} strokeWidth="1.2" />
          <Path d="M 34 18 Q 42 18 40 28 Q 36 30 32 26 Q 30 22 34 18 Z" fill={fillSoft} stroke={stroke} strokeWidth="1.2" />
          <Path d="M 16 30 Q 24 30 26 36 Q 18 38 14 34 Z" fill={fillSoft} stroke={stroke} strokeWidth="1.2" />
        </Svg>
      );
    case 6: // mushy — fluffy pieces, ragged edges
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Path d="M 6 18 Q 8 14 12 16 Q 18 12 24 16 Q 30 12 36 18 Q 42 16 42 22 Q 44 28 38 30 Q 36 34 30 32 Q 24 36 18 32 Q 12 34 8 30 Q 4 26 6 18 Z" fill={fillSoft} stroke={stroke} strokeWidth="1.2" />
        </Svg>
      );
    case 7: // liquid — entirely liquid
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Path d="M 4 28 Q 12 24 24 28 Q 36 32 44 28 Q 44 36 4 36 Z" fill={fillSoft} stroke={stroke} strokeWidth="1.2" />
          <Path d="M 8 22 Q 14 20 20 22" stroke={stroke} strokeWidth="1" fill="none" opacity="0.6" />
          <Path d="M 28 18 Q 34 16 40 18" stroke={stroke} strokeWidth="1" fill="none" opacity="0.6" />
        </Svg>
      );
    default:
      return <Svg width={size} height={size} viewBox="0 0 48 48" />;
  }
}

// Shared geometry for the My Floofs long-press fan-out. Used by both
// the FloofFanOverlay (to render circle positions) and the custom
// MyFloofsTabButton (to hit-test the user's finger position during
// the continuous long-press → slide gesture).
//
// Origin is anchored near the bottom-right of the screen, just above
// the My Floofs tab. Pets fan out along a quarter arc from "left of
// tab" (180°) to "straight up" (270°).
import { Dimensions, Platform } from "react-native";

export const CIRCLE_DIAMETER = 76;
export const ARC_RADIUS = 170;
// Touch within this radius of a circle's center counts as "over" it.
// Slightly larger than the circle so the user doesn't have to be
// pixel-perfect during a slide.
export const HOVER_RADIUS = CIRCLE_DIAMETER / 2 + 18;

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 86 : 64;

// Compute (x, y) screen-space centers for each pet circle in the arc.
// `bottomInset` is the safe-area-inset from useSafeAreaInsets().bottom.
export function computeFanCenters(pets, bottomInset = 0) {
  const { width, height } = Dimensions.get("window");
  const originX = width - 60;
  const originY = height - bottomInset - TAB_BAR_HEIGHT + 22;
  const n = pets.length;
  const angleStart = Math.PI;
  const angleEnd = Math.PI * 1.5;
  return pets.map((p, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angle = angleStart + t * (angleEnd - angleStart);
    return {
      id: p.id,
      cx: originX + ARC_RADIUS * Math.cos(angle),
      cy: originY + ARC_RADIUS * Math.sin(angle),
    };
  });
}

// Hit-test: which pet circle (if any) is the touch (x, y) over?
// Returns the pet id, or null if none.
export function hitTestFan(x, y, centers) {
  let bestId = null;
  let bestDistSq = HOVER_RADIUS * HOVER_RADIUS;
  for (const c of centers) {
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

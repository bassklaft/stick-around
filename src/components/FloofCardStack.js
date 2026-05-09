// FloofCardStack — multi-pet hero replacement. Each pet is a full-
// bleed card; horizontal swipes flip through the deck like a stack
// of polaroids. Settling on a card sets that pet active.
//
// Gestures (single PanResponder owns all three):
//   - SWIPE  (horizontal drag past threshold) → commit to next/prev
//     pet, animate active state through onActivate(petId).
//   - TAP    (release with negligible movement) → onTapFront(pet)
//     so the caller can open that pet's photo manager.
//   - HOLD   (~450ms touchdown without movement) → onLongPress()
//     so the caller can show the FloofFanOverlay for "see all
//     floofs at once" picking.
//
// The active pet's card is drawn with the brand accent ring; the
// previous and next cards peek in from off-screen at -W and +W so
// the swipe motion has visible content sliding into view. No card
// is rendered for households with a single pet — caller renders
// the standard single-pet hero in that case.
//
// Per build 21 smoke-test feedback: "I think it would be best if
// these were stacked like cards where you can flip through them
// with your finger and that way the photos take over more space on
// the page and you see your pet larger and then if you hard press,
// they'll fan out and you can see them all at the same time."
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  Animated,
  PanResponder,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { pickPhotoForSlot } from "../lib/petPhotos";
import { getPrimaryBreed, mixedBreedLabel } from "../lib/petBreeds";
import { tapLight, tapMedium } from "../lib/haptics";
import { theme } from "../theme";

const SWIPE_THRESHOLD = 60;        // px — beyond this, commit a flip
const TAP_THRESHOLD = 8;           // px — below this on release, treat as tap
const LONG_PRESS_MS = 450;
const SWIPE_OUT_MS = 200;          // animate-off duration on commit
// Pinch-in threshold — when the user puts two fingers on the deck
// and squeezes them ≥30% closer, fire the fan-out. Detected via
// PanResponder's nativeEvent.touches without adding a native
// gesture-handler dependency.
const PINCH_IN_RATIO = 0.7;
// Distance helper for the two-touch pinch detection.
function touchDistance(touches) {
  if (!touches || touches.length < 2) return 0;
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

const titleCase = (s) => (s || "").split(" ").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

function PetCardFace({ pet, width, height }) {
  // Cycle through candidate URIs (slot pick → photos[] → photoUri),
  // skipping any that have errored, so a broken file doesn't hang
  // the card on a black square. Same pattern used in PetAvatar.
  const [errored, setErrored] = useState(() => new Set());
  const candidates = useMemo(() => {
    if (!pet) return [];
    const list = [];
    const add = (u) => { if (typeof u === "string" && u.length > 0 && !list.includes(u)) list.push(u); };
    add(pickPhotoForSlot(pet, "hero"));
    if (Array.isArray(pet.photos)) for (const u of pet.photos) add(u);
    add(pet.photoUri);
    return list;
  }, [pet]);
  const heroUri = useMemo(() => {
    for (const c of candidates) if (!errored.has(c)) return c;
    return null;
  }, [candidates, errored]);
  const onImgError = () => {
    if (!heroUri) return;
    setErrored((prev) => {
      if (prev.has(heroUri)) return prev;
      const next = new Set(prev);
      next.add(heroUri);
      return next;
    });
  };

  const breed = mixedBreedLabel(pet) || titleCase(getPrimaryBreed(pet));
  const placeholderName = (pet?.name && pet.name.trim()) || "FloofLife";

  return (
    <View style={[styles.cardFace, { width, height }]}>
      {heroUri ? (
        <ImageBackground
          key={heroUri}
          source={{ uri: heroUri }}
          style={styles.cardImage}
          imageStyle={styles.cardImageInner}
          onError={onImgError}
        >
          <View style={styles.cardScrim} />
          <View style={styles.cardContent}>
            <Text style={styles.cardEyebrow}>FOR</Text>
            <Text style={styles.cardName} numberOfLines={1}>{pet.name}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {breed}{pet.ageYears != null ? ` · ${pet.ageYears} yr` : ""}{pet.weightLbs ? ` · ${pet.weightLbs} lb` : ""}
            </Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.cardFallback}>
          <View style={styles.placeholderIconStack}>
            <MaterialCommunityIcons name="paw" size={64} color={theme.accent} />
            <View style={styles.placeholderCheckBadge}>
              <MaterialCommunityIcons name="check-bold" size={14} color="#fff" />
            </View>
          </View>
          <Text style={styles.placeholderName} numberOfLines={1}>{placeholderName}</Text>
          {breed && pet?.name && (
            <Text style={styles.placeholderMeta} numberOfLines={1}>
              {breed}{pet.ageYears != null ? ` · ${pet.ageYears} yr` : ""}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function FloofCardStack({
  pets,
  activeId,
  width,
  height,
  onActivate,
  onTapFront,
  onLongPress,
}) {
  const startIdx = useMemo(() => {
    const i = pets.findIndex((p) => p.id === activeId);
    return i >= 0 ? i : 0;
  }, [pets, activeId]);
  const [index, setIndex] = useState(startIdx);

  // If the parent's activeId changes (user activates a pet from
  // elsewhere — fan-out picker, My Floofs tap), re-center the deck.
  useEffect(() => {
    if (pets[index]?.id !== activeId) {
      const i = pets.findIndex((p) => p.id === activeId);
      if (i >= 0 && i !== index) setIndex(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const dragX = useRef(new Animated.Value(0)).current;
  const longPressTimerRef = useRef(null);
  const movedRef = useRef(false);
  const isCommittingRef = useRef(false);
  // Pinch state — captured on the first 2-touch frame. Reset on
  // touchdown / release. When the live distance drops below
  // initialDistance * PINCH_IN_RATIO, we fire onLongPress (the
  // fan-out trigger) and lock the gesture so swipe/tap don't also
  // run on release.
  const pinchInitialRef = useRef(0);
  const pinchFiredRef = useRef(false);

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (isCommittingRef.current) return;
        movedRef.current = false;
        pinchInitialRef.current = 0;
        pinchFiredRef.current = false;
        clearLongPressTimer();
        longPressTimerRef.current = setTimeout(() => {
          if (!movedRef.current && !pinchFiredRef.current) {
            tapMedium();
            onLongPress?.();
          }
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (e, g) => {
        if (isCommittingRef.current) return;
        const touches = e?.nativeEvent?.touches;
        // 2-finger pinch detection: capture initial spread on first
        // 2-touch frame, then watch for ≥30% squeeze to trigger fan.
        if (touches && touches.length >= 2) {
          movedRef.current = true;
          clearLongPressTimer();
          const dist = touchDistance(touches);
          if (!pinchInitialRef.current) {
            pinchInitialRef.current = dist;
          } else if (
            !pinchFiredRef.current
            && dist > 0
            && pinchInitialRef.current > 0
            && dist / pinchInitialRef.current < PINCH_IN_RATIO
          ) {
            pinchFiredRef.current = true;
            tapMedium();
            onLongPress?.();
            // Snap the deck back to rest so the fan-out doesn't open
            // over a half-translated card.
            Animated.spring(dragX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
          }
          return;
        }
        // Single-finger drag — normal swipe path.
        if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) {
          movedRef.current = true;
          clearLongPressTimer();
        }
        dragX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        clearLongPressTimer();
        if (isCommittingRef.current) return;
        // Pinch already fired — don't also commit a swipe/tap on release.
        if (pinchFiredRef.current) {
          pinchFiredRef.current = false;
          pinchInitialRef.current = 0;
          Animated.spring(dragX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
          return;
        }
        const dx = g.dx;

        // Tap path: little to no movement, no long-press fired.
        if (Math.abs(dx) < TAP_THRESHOLD && !movedRef.current) {
          Animated.spring(dragX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
          tapLight();
          onTapFront?.(petsRef.current[indexRef.current]);
          return;
        }

        // Swipe-commit path: crossed threshold → flip to neighbor.
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          const direction = dx > 0 ? -1 : 1; // drag right → previous pet
          const len = petsRef.current.length;
          const newIdx = (indexRef.current + direction + len) % len;
          isCommittingRef.current = true;
          Animated.timing(dragX, {
            toValue: dx > 0 ? width : -width,
            duration: SWIPE_OUT_MS,
            useNativeDriver: true,
          }).start(() => {
            setIndex(newIdx);
            dragX.setValue(0);
            isCommittingRef.current = false;
            tapLight();
            onActivate?.(petsRef.current[newIdx]?.id);
          });
          return;
        }

        // Snap back — drag wasn't far enough.
        Animated.spring(dragX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        clearLongPressTimer();
        Animated.spring(dragX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // Keep the responder closures pointed at the latest index/pets
  // without re-creating the responder on every render.
  const indexRef = useRef(index);
  const petsRef = useRef(pets);
  indexRef.current = index;
  petsRef.current = pets;

  const len = pets.length;
  if (len === 0) return null;

  const prevPet = pets[(index - 1 + len) % len];
  const currentPet = pets[index];
  const nextPet = pets[(index + 1) % len];

  const prevX = Animated.add(dragX, -width);
  const nextX = Animated.add(dragX, width);

  // Page-dot indicator at top: compact for small N, two-row wrap
  // beyond ~10. Active dot is wider + accent-colored.
  const dots = pets.map((p, i) => (
    <View key={p.id || i} style={[styles.dot, i === index && styles.dotActive]} />
  ));

  return (
    <View style={[styles.container, { width, height }]} {...panResponder.panHandlers}>
      <Animated.View style={[styles.cardLayer, { transform: [{ translateX: prevX }] }]}>
        <PetCardFace pet={prevPet} width={width} height={height} />
      </Animated.View>
      <Animated.View style={[styles.cardLayer, { transform: [{ translateX: dragX }] }]}>
        <View style={styles.activeRing}>
          <PetCardFace pet={currentPet} width={width} height={height} />
        </View>
      </Animated.View>
      <Animated.View style={[styles.cardLayer, { transform: [{ translateX: nextX }] }]}>
        <PetCardFace pet={nextPet} width={width} height={height} />
      </Animated.View>

      {/* Page dots + tap hint */}
      <View pointerEvents="none" style={styles.topOverlay}>
        <View style={styles.dotsRow}>{dots}</View>
      </View>
      <View pointerEvents="none" style={styles.bottomHintRow}>
        <Text style={styles.hint}>← swipe · pinch in or hold to fan out</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: theme.accentSoft,
  },
  cardLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  cardFace: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: theme.accentSoft,
  },
  activeRing: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: theme.accent,
  },
  cardImage:    { flex: 1, justifyContent: "flex-end" },
  cardImageInner: { resizeMode: "cover", borderRadius: 22 },
  cardScrim:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.32)" },
  cardContent:  { padding: 22 },
  cardEyebrow:  { fontSize: 11, fontWeight: "800", color: "#FBE4DC", letterSpacing: 1.6, marginBottom: 4 },
  cardName:     { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -0.5, textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cardMeta:     { fontSize: 14, color: "#fff", marginTop: 2, opacity: 0.95, textTransform: "capitalize" },
  cardFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 14, gap: 8, backgroundColor: theme.accentSoft },
  placeholderIconStack: { width: 72, height: 70, alignItems: "center", justifyContent: "center" },
  placeholderCheckBadge:{ position: "absolute", bottom: 0, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: "#3F8E5C", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.bg },
  placeholderName:{ fontSize: 22, fontWeight: "800", color: theme.fg, letterSpacing: -0.4, textTransform: "capitalize" },
  placeholderMeta:{ fontSize: 13, color: theme.muted, textTransform: "capitalize" },
  topOverlay:   { position: "absolute", top: 14, left: 0, right: 0, alignItems: "center" },
  dotsRow:      { flexDirection: "row", gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.32)" },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.55)" },
  dotActive:    { width: 18, backgroundColor: "#fff" },
  bottomHintRow:{ position: "absolute", bottom: 8, left: 0, right: 0, alignItems: "center" },
  hint:         { fontSize: 10, color: "#fff", fontWeight: "700", letterSpacing: 0.6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.32)" },
});

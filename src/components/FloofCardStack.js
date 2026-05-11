// FloofCardStack — multi-pet hero replacement. Each pet is a full-
// bleed card; horizontal swipes flip through the deck like a stack
// of polaroids. Settling on a card sets that pet active.
//
// Gestures (single PanResponder owns three actions):
//   - SWIPE (horizontal drag past threshold) → commit to next/prev
//     pet, animate active state through onActivate(petId).
//   - TAP   (release with negligible movement) → onTapFront(pet)
//     so the caller can open that pet's photo manager.
//   - HOLD  (~450ms touchdown without movement) → onLongPress()
//     for callers that want a hold-on-stack alternative entry to
//     the floof fan. (Long-press on the My Floofs tab button is
//     the primary path — see MyFloofsTabButton.)
//
// Pinch-in to open the fan-out was REMOVED in build 33 — the two-
// touch detection caused a recurring TurboModule queue crash that
// surfaced in builds 28-32 (`com.meta.react.turbomodulemanager.queue`
// SIGABRT during multi-touch tracking). Long-press on the My
// Floofs tab is the canonical opener.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  Animated,
  PanResponder,
  StyleSheet,
} from "react-native";
import { pickPhotoForSlot } from "../lib/petPhotos";
import { getPrimaryBreed, mixedBreedLabel } from "../lib/petBreeds";
import { tapLight, tapMedium } from "../lib/haptics";
import PawIcon from "./PawIcon";
import { theme } from "../theme";

const SWIPE_THRESHOLD = 60;        // px — beyond this, commit a flip
const TAP_THRESHOLD = 8;           // px — below this on release, treat as tap
const LONG_PRESS_MS = 450;
const SWIPE_OUT_MS = 200;          // animate-off duration on commit

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
          <PawIcon size={76} withCheck color={theme.accent} checkBg={theme.bg} />
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

  // Refs keep the PanResponder closures pointed at the LATEST values
  // for index, pets, and the parent callbacks. Build ≤44 only ref'd
  // index + pets; onActivate / onTapFront / onLongPress were captured
  // by the PanResponder.create closure at FIRST render and never
  // updated.
  //
  // That was the root cause of the build-44 carousel-wraparound bug
  // ("hero on Cricket, Pawgress card on Elliot" — issue #44b in the
  // 2026-05-11 11:23 recording): the captured first-render onActivate
  // closure had a stale `pet` value (whatever was active at app
  // launch). Its `if (petId === pet.id) return` bail check compared
  // against that stale launch-time pet, so any swipe back to the
  // launch-time pet bailed entirely — setPet didn't fire, Pets.setActive
  // didn't fire, useActivePet didn't notify, load() didn't refresh.
  // Hero advanced via internal setIndex, everything else stayed on
  // the previous pet. The gen-counter in load() can't help when
  // load() is never invoked.
  //
  // Holding the parent callbacks in refs + reading via ref inside the
  // PanResponder makes every swipe invoke the LATEST inline arrow,
  // which captures the LATEST pet / pets from the parent's most
  // recent render. The bail check is then accurate.
  const indexRef = useRef(index);
  const petsRef = useRef(pets);
  const onActivateRef = useRef(onActivate);
  const onTapFrontRef = useRef(onTapFront);
  const onLongPressRef = useRef(onLongPress);
  indexRef.current = index;
  petsRef.current = pets;
  onActivateRef.current = onActivate;
  onTapFrontRef.current = onTapFront;
  onLongPressRef.current = onLongPress;

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
        clearLongPressTimer();
        longPressTimerRef.current = setTimeout(() => {
          if (!movedRef.current) {
            tapMedium();
            onLongPressRef.current?.();
          }
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (e, g) => {
        if (isCommittingRef.current) return;
        // Single-finger drag — swipe path. Multi-touch pinch
        // detection was removed in build 33: it caused a recurring
        // TurboModule crash, and the long-press on the My Floofs
        // tab is the canonical way to open the floof fan.
        if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) {
          movedRef.current = true;
          clearLongPressTimer();
        }
        dragX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        clearLongPressTimer();
        if (isCommittingRef.current) return;
        const dx = g.dx;

        // Tap path: little to no movement, no long-press fired.
        if (Math.abs(dx) < TAP_THRESHOLD && !movedRef.current) {
          Animated.spring(dragX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
          tapLight();
          onTapFrontRef.current?.(petsRef.current[indexRef.current]);
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
            onActivateRef.current?.(petsRef.current[newIdx]?.id);
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
        <Text style={styles.hint}>← swipe · long-press My Floofs to switch</Text>
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
  placeholderName:{ fontSize: 22, fontWeight: "800", color: theme.fg, letterSpacing: -0.4, textTransform: "capitalize" },
  placeholderMeta:{ fontSize: 13, color: theme.muted, textTransform: "capitalize" },
  topOverlay:   { position: "absolute", top: 14, left: 0, right: 0, alignItems: "center" },
  dotsRow:      { flexDirection: "row", gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.32)" },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.55)" },
  dotActive:    { width: 18, backgroundColor: "#fff" },
  bottomHintRow:{ position: "absolute", bottom: 8, left: 0, right: 0, alignItems: "center" },
  hint:         { fontSize: 10, color: "#fff", fontWeight: "700", letterSpacing: 0.6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.32)" },
});

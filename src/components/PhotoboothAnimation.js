// PhotoboothAnimation — final reveal at the end of the 5-photo onboarding.
// Photos slide down from the top of the screen one by one, like a strip
// printing out of a photobooth, then settle into a stack with a gentle
// bounce. Total runtime ≤ 3.5s. A visible "Skip" button is always
// present (Apple Guideline 4.0 + build 20 guardrail C).
//
// If no photos are present (user skipped them all), the component renders
// nothing and immediately calls onDone — there's nothing to show.
import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { theme } from "../theme";
import { tapLight, notifySuccess } from "../lib/haptics";

const SCREEN_W = Dimensions.get("window").width;
const STRIP_W = Math.min(SCREEN_W - 64, 240);
const PHOTO_SIZE = STRIP_W - 24;

// Per-photo entrance: 350ms slide + 250ms settle. Stagger 200ms.
// 5 photos: 200*4 + 600 = 1400ms entrance, +900ms hold, +500ms exit ≈ 2.8s.
const ENTRANCE_MS = 350;
const SETTLE_MS = 250;
const STAGGER_MS = 200;
const HOLD_MS = 900;
const EXIT_MS = 500;

export default function PhotoboothAnimation({ visible, photos = [], onDone }) {
  const list = (photos || []).filter(Boolean).slice(0, 5);

  // One Animated.Value per photo for translateY + scale.
  const translates = useRef(list.map(() => new Animated.Value(-400))).current;
  const scales = useRef(list.map(() => new Animated.Value(0.85))).current;
  const stripFade = useRef(new Animated.Value(0)).current;
  const labelFade = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone?.();
  }

  function handleSkip() {
    tapLight();
    finish();
  }

  useEffect(() => {
    if (!visible) return;
    if (list.length === 0) {
      // Nothing to animate — return immediately so we don't block the
      // user when they've skipped all 5 prompts.
      finish();
      return;
    }
    finishedRef.current = false;

    // Reset values in case the modal is re-shown.
    translates.forEach((v) => v.setValue(-400));
    scales.forEach((v) => v.setValue(0.85));
    stripFade.setValue(0);
    labelFade.setValue(0);

    const seq = [];
    seq.push(
      Animated.timing(stripFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    );
    list.forEach((_, i) => {
      seq.push(
        Animated.parallel([
          Animated.timing(translates[i], {
            toValue: 0,
            duration: ENTRANCE_MS,
            delay: i === 0 ? 0 : STAGGER_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(scales[i], {
            toValue: 1,
            friction: 6,
            tension: 80,
            delay: i === 0 ? 0 : STAGGER_MS,
            useNativeDriver: true,
          }),
        ]),
      );
    });
    seq.push(
      Animated.timing(labelFade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    );

    const anim = Animated.sequence(seq);
    anim.start(({ finished }) => {
      if (!finished) return;
      notifySuccess();
      // Hold the strip for a beat, then auto-advance.
      const holdTimer = setTimeout(() => {
        Animated.timing(stripFade, {
          toValue: 0,
          duration: EXIT_MS,
          useNativeDriver: true,
        }).start(() => finish());
      }, HOLD_MS);
      // If skip is hit during hold, the timeout still fires but finish()
      // is idempotent.
      return () => clearTimeout(holdTimer);
    });

    // Cleanup if the modal is dismissed mid-animation.
    return () => {
      anim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={finish}
    >
      <View style={styles.scrim}>
        <Animated.View style={[styles.strip, { opacity: stripFade }]}>
          {list.map((uri, i) => (
            <Animated.View
              key={`${i}-${uri}`}
              style={[
                styles.photoWrap,
                {
                  transform: [
                    { translateY: translates[i] },
                    { scale: scales[i] },
                  ],
                },
              ]}
            >
              <Image source={{ uri }} style={styles.photo} onError={() => {}} />
            </Animated.View>
          ))}
          <Animated.Text style={[styles.label, { opacity: labelFade }]}>
            FloofLife · {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </Animated.Text>
        </Animated.View>

        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.85}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(20,18,32,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  strip: {
    width: STRIP_W,
    backgroundColor: "#FFFCF6",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  photoWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#5C4F3C",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontStyle: "italic",
  },
  skipBtn: {
    position: "absolute",
    top: 60,
    right: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  skipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});

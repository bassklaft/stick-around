// AppHeader — custom React Native header for all pushed + modal
// screens. Replaces React Navigation native-stack's iOS-native
// header so we don't inherit iOS 26's auto-applied "Liquid Glass"
// capsule background behind every nav-bar button (back chevron,
// headerRight chip, etc.).
//
// iOS 26 introduced a default `UINavigationBar.buttonAppearance`
// that draws a white/tinted capsule behind every button-shaped
// element in the nav bar. React Navigation's native-stack renders
// the header via `UINavigationBar`, so even custom `headerRight`
// React Native components inherit that capsule. The user kept
// circling it ("white border around the floof icon") in builds
// 43-45 even after the chip's own border was removed — the visible
// white wasn't ours, it was iOS's.
//
// By providing a `header: (props) => <AppHeader {...props} />` on
// the screen options, native-stack renders this JS component
// INSTEAD of its UINavigationBar. iOS 26's button-capsule styling
// doesn't apply to plain React Native Views, so the result is a
// clean header where the only visible nav-bar elements are the
// ones we explicitly draw.
//
// Reads from native-stack's standard header options:
//   - options.title — plain text title (used when headerTitle is
//     not a function)
//   - options.headerTitle — render-function for a custom title
//     component (used by HealthTracker / Checklist for the
//     ActivePetTitle dropdown)
//   - options.headerLeft — render-function for the left slot. When
//     not provided AND `back` is truthy, we render a custom back
//     button (chevron + label).
//   - options.headerRight — render-function for the right slot
//     (typically <ActivePetChip />).
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tapLight } from "../lib/haptics";
import { theme } from "../theme";

export default function AppHeader({ navigation, route, options, back }) {
  const insets = useSafeAreaInsets();

  const HeaderTitleFn = typeof options.headerTitle === "function" ? options.headerTitle : null;
  const HeaderRightFn = typeof options.headerRight === "function" ? options.headerRight : null;
  const HeaderLeftFn = typeof options.headerLeft === "function" ? options.headerLeft : null;
  const titleText = options.title || route?.name || "";
  const backLabel = back?.title || "Main";

  return (
    <View style={[s.wrap, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      <View style={s.row}>
        <View style={s.leftSlot}>
          {HeaderLeftFn ? (
            HeaderLeftFn({ tintColor: theme.accent, canGoBack: !!back })
          ) : back ? (
            <TouchableOpacity
              onPress={() => { tapLight(); navigation.goBack(); }}
              style={s.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Back to ${backLabel}`}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={theme.accent} />
              <Text style={s.backText} numberOfLines={1}>{backLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={s.titleSlot}>
          {HeaderTitleFn ? (
            HeaderTitleFn({ children: titleText, tintColor: theme.fg })
          ) : (
            <Text style={s.title} numberOfLines={1}>{titleText}</Text>
          )}
        </View>
        <View style={s.rightSlot}>
          {HeaderRightFn ? HeaderRightFn({ tintColor: theme.accent, canGoBack: !!back }) : null}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    // Subtle hairline at the bottom matches the visual weight of
    // the iOS-native nav bar separator. Border instead of shadow
    // for predictable rendering on iOS 26.
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 8,
  },
  leftSlot: {
    minWidth: 60,
    maxWidth: 120,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  titleSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  rightSlot: {
    minWidth: 60,
    maxWidth: 140,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: -2,
  },
  title: {
    color: theme.fg,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});

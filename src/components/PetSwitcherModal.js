// Pet switcher — modal list of all pets in the household with the
// active pet marked. Tap a pet → the parent's onPick handler runs
// (typically calls Pets.setActive(petId) and reloads). Used by both
// the nav-bar pet chip and the title-tap on pet-scoped screens.
//
// Stays presentational — fetching the pet list and wiring to active
// storage is the parent's responsibility.
import React from "react";
import { Modal, View, Text, TouchableOpacity, Image, FlatList, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { breedEmoji } from "../data/breeds";
import { getPrimaryBreed } from "../lib/petBreeds";
import { pickPhotoForSlot } from "../lib/petPhotos";
import { theme } from "../theme";

export default function PetSwitcherModal({ visible, onClose, pets, activeId, onPick }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.container, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerRow}>
          <Text style={s.heading}>Switch active floof</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="close" size={26} color={theme.fg} />
          </TouchableOpacity>
        </View>
        <Text style={s.subhead}>
          The active floof is the one whose checklist, health tracker, and home hero you're working with.
        </Text>
        <FlatList
          data={pets}
          keyExtractor={(p) => p.id || p.name}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => {
            const isActive = item.id === activeId;
            const primary = getPrimaryBreed(item);
            // Switcher always uses photos[0] — same canonical face every
            // time so the user can recognize "this is X" at a glance.
            const switcherUri = pickPhotoForSlot(item, "primary");
            return (
              <Pressable
                onPress={() => onPick(item.id)}
                style={({ pressed }) => [
                  s.row,
                  isActive && s.rowActive,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${item.name}`}
                accessibilityState={{ selected: isActive }}
              >
                {switcherUri ? (
                  <Image source={{ uri: switcherUri }} style={s.avatar} />
                ) : (
                  <View style={s.avatarFallback}>
                    <Text style={{ fontSize: 22 }}>{breedEmoji(primary)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.meta} numberOfLines={1}>
                    {item.species === "cat" ? "Cat" : "Dog"}
                    {item.ageYears != null ? ` · ${item.ageYears} yr` : ""}
                  </Text>
                </View>
                {isActive ? (
                  <View style={s.activePill}>
                    <Text style={s.activePillText}>ACTIVE</Text>
                  </View>
                ) : (
                  <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.bg },
  headerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 6 },
  heading:      { fontSize: 22, fontWeight: "800", color: theme.fg, letterSpacing: -0.4 },
  subhead:      { fontSize: 13, color: theme.muted, paddingHorizontal: 20, paddingBottom: 14, lineHeight: 19 },
  row:          { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card, marginBottom: 10 },
  rowActive:    { borderColor: theme.accent, borderWidth: 2, backgroundColor: theme.accentSoft },
  avatar:       { width: 48, height: 48, borderRadius: 24 },
  avatarFallback:{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.accentSoft, alignItems: "center", justifyContent: "center" },
  name:         { fontSize: 16, fontWeight: "700", color: theme.fg, textTransform: "capitalize" },
  meta:         { fontSize: 12, color: theme.muted, marginTop: 2 },
  activePill:   { backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activePillText:{ color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
});

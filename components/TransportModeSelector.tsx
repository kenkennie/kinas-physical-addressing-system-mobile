import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMapStore } from "../stores/map.store";

type TransportMode = "driving" | "walking" | "cycling" | "motorcycle";

const TRANSPORT_MODES: Array<{
  mode: TransportMode;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}> = [
  { mode: "driving", icon: "car", label: "Drive" },
  { mode: "walking", icon: "walk", label: "Walk" },
  { mode: "cycling", icon: "bicycle", label: "Bike" },
  { mode: "motorcycle", icon: "bicycle", label: "Moto" },
];

export const TransportModeSelector: React.FC = () => {
  const { transportMode, setTransportMode } = useMapStore();

  return (
    <View style={styles.container}>
      {TRANSPORT_MODES.map(({ mode, icon, label }) => {
        const isSelected = transportMode === mode;
        return (
          <TouchableOpacity
            key={mode}
            style={[styles.modeButton, isSelected && styles.modeButtonSelected]}
            onPress={() => setTransportMode(mode)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={icon}
              size={18}
              color={isSelected ? "#1A73E8" : "#5F6368"}
            />
            <Text
              style={[styles.modeLabel, isSelected && styles.modeLabelSelected]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
  },
  modeButtonSelected: {
    backgroundColor: "#E8F0FE",
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#5F6368",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  modeLabelSelected: {
    color: "#1A73E8",
    fontWeight: "600",
  },
});

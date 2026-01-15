import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMapStore } from "../stores/map.store";
import { TransportMode } from "../types/address.types";

const TRANSPORT_MODES: { mode: TransportMode; icon: string; label: string }[] =
  [
    { mode: "driving", icon: "car", label: "Drive" },
    { mode: "motorcycle", icon: "bicycle", label: "Bike" },
    { mode: "cycling", icon: "bicycle-outline", label: "Cycle" },
    { mode: "walking", icon: "walk", label: "Walk" },
  ];

export const TransportModeSelector: React.FC = () => {
  const { transportMode, setTransportMode } = useMapStore();

  return (
    <View style={styles.container}>
      {TRANSPORT_MODES.map(({ mode, icon, label }) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.modeButton,
            transportMode === mode && styles.modeButtonActive,
          ]}
          onPress={() => setTransportMode(mode)}
        >
          <Ionicons
            name={icon as any}
            size={24}
            color={transportMode === mode ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.modeLabel,
              transportMode === mode && styles.modeLabelActive,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 200,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modeButton: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  modeButtonActive: {
    backgroundColor: "#3B82F6",
  },
  modeLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  modeLabelActive: {
    color: "#FFFFFF",
  },
});

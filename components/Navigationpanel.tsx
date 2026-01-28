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
import { TransportModeSelector } from "./TransportModeSelector";

export const NavigationPanel: React.FC = () => {
  const { activeRoute, setActiveRoute, isSelectingRoute } = useMapStore();

  // Don't show if no active route or if selecting routes
  if (!activeRoute || isSelectingRoute) return null;

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const totalDistance = formatDistance(activeRoute.route.total_distance);
  const currentInstruction = activeRoute.instructions[0];

  return (
    <View style={styles.container}>
      {/* Top info bar */}
      <View style={styles.topBar}>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{totalDistance}</Text>
        </View>

        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => setActiveRoute(null)}
        >
          <Ionicons
            name="close"
            size={20}
            color="#5F6368"
          />
        </TouchableOpacity>
      </View>

      {/* Current instruction */}
      {currentInstruction && (
        <View style={styles.instructionContainer}>
          <View style={styles.instructionIcon}>
            <Ionicons
              name="arrow-up"
              size={24}
              color="#202124"
            />
          </View>
          <Text
            style={styles.instructionText}
            numberOfLines={2}
          >
            {currentInstruction.instruction}
          </Text>
        </View>
      )}

      {/* Transport mode selector */}
      <View style={styles.modeContainer}>
        <TransportModeSelector />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    left: 12,
    right: 12,
    zIndex: 90,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
  distanceBadge: {
    backgroundColor: "#1A73E8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  distanceText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  exitButton: {
    padding: 8,
    backgroundColor: "#F1F3F4",
    borderRadius: 20,
  },
  instructionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F3F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  modeContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
});

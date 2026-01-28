import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMapStore } from "../stores/map.store";
import { TransportModeSelector } from "./TransportModeSelector";

const { height } = Dimensions.get("window");

export const DirectionsSheet: React.FC = () => {
  const {
    activeRoute,
    setActiveRoute,
    selectedParcel,
    setSelectedParcel,
    isSelectingRoute,
  } = useMapStore();

  // Only show when there's an active route and not selecting between routes
  if (!activeRoute || isSelectingRoute) return null;

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const totalDistance = formatDistance(activeRoute.route.total_distance);

  const handleExit = () => {
    setActiveRoute(null);
    // Keep parcel selected when exiting navigation
  };

  return (
    <View style={styles.container}>
      <View style={styles.dragHandle} />

      {/* Header with destination info */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.distanceRow}>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{totalDistance}</Text>
            </View>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExit}
            >
              <Ionicons
                name="close"
                size={20}
                color="#5F6368"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.destinationText}>
            {activeRoute.destination.physical_address ||
              selectedParcel?.parcel.lr_no}
          </Text>
          <Text style={styles.entryPointText}>
            Via Entry Point {activeRoute.destination.entry_point.label}
          </Text>
        </View>
      </View>

      {/* Transport mode selector */}
      <View style={styles.modeSection}>
        <TransportModeSelector />
      </View>

      <View style={styles.divider} />

      {/* Turn-by-turn instructions */}
      <ScrollView
        style={styles.instructions}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructionsTitle}>Directions</Text>

        {activeRoute.instructions.map((instruction, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === activeRoute.instructions.length - 1;

          return (
            <View
              key={instruction.step}
              style={styles.instructionItem}
            >
              <View style={styles.stepIndicator}>
                {isFirst && (
                  <View style={styles.startDot}>
                    <View style={styles.startDotInner} />
                  </View>
                )}
                {!isFirst && !isLast && <View style={styles.middleDot} />}
                {isLast && (
                  <Ionicons
                    name="location"
                    size={20}
                    color="#EA4335"
                  />
                )}
                {!isLast && <View style={styles.stepLine} />}
              </View>

              <View style={styles.instructionContent}>
                <Text style={styles.instructionText}>
                  {typeof instruction.instruction === "string"
                    ? instruction.instruction
                    : "Continue"}
                </Text>
                {instruction.distance && (
                  <Text style={styles.instructionDistance}>
                    {formatDistance(instruction.distance)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Start navigation button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: height * 0.75,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#DADCE0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    gap: 8,
  },
  distanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  distanceBadge: {
    backgroundColor: "#1A73E8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  distanceText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  exitButton: {
    padding: 8,
    backgroundColor: "#F1F3F4",
    borderRadius: 20,
  },
  destinationText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#202124",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  entryPointText: {
    fontSize: 14,
    color: "#5F6368",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  modeSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EAED",
  },
  instructions: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
    marginBottom: 16,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepIndicator: {
    width: 32,
    alignItems: "center",
    marginRight: 16,
  },
  startDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1A73E8",
    justifyContent: "center",
    alignItems: "center",
  },
  startDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  middleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DADCE0",
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E8EAED",
    marginTop: 4,
  },
  instructionContent: {
    flex: 1,
    paddingBottom: 8,
  },
  instructionText: {
    fontSize: 15,
    color: "#202124",
    lineHeight: 22,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  instructionDistance: {
    fontSize: 13,
    color: "#5F6368",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8EAED",
  },
  startButton: {
    backgroundColor: "#1A73E8",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#1A73E8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
});

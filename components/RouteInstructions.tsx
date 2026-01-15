import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMapStore } from "../stores/map.store";

const { height } = Dimensions.get("window");

export const RouteInstructions: React.FC = () => {
  const { activeRoute, setActiveRoute } = useMapStore();

  if (!activeRoute) return null;

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Navigation Active</Text>
          <Text style={styles.distance}>
            {formatDistance(activeRoute.route.total_distance)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setActiveRoute(null)}>
          <Ionicons
            name="close-circle"
            size={28}
            color="#EF4444"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.destination}>
        <View style={styles.destinationIcon}>
          <Ionicons
            name="flag"
            size={20}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationTitle}>
            {activeRoute.destination.physical_address}
          </Text>
          <Text style={styles.destinationSubtitle}>
            Entry Point {activeRoute.destination.entry_point.label}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.instructions}
        showsVerticalScrollIndicator={false}
      >
        {activeRoute.instructions.map((instruction) => (
          <View
            key={instruction.step}
            style={styles.instruction}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{instruction.step}</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionText}>
                {instruction.instruction}
              </Text>
              {instruction.distance && (
                <Text style={styles.instructionDistance}>
                  {formatDistance(instruction.distance)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  distance: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3B82F6",
  },
  destination: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  destinationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  destinationSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  instructions: {
    flex: 1,
    padding: 16,
  },
  instruction: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
    marginBottom: 4,
  },
  instructionDistance: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});

// components/RouteSelectionSheet.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMapStore } from "../stores/map.store";

const { height } = Dimensions.get("window");

export const RouteSelectionSheet: React.FC = () => {
  const {
    alternativeRoutes,
    selectedRouteIndex,
    setSelectedRouteIndex,
    setActiveRoute,
    setIsSelectingRoute,
  } = useMapStore();

  const handleSelectRoute = (index: number) => {
    setSelectedRouteIndex(index);
    setActiveRoute(alternativeRoutes[index]);
  };

  const handleConfirm = () => {
    setIsSelectingRoute(false);
  };

  if (alternativeRoutes.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Route</Text>
        <Text style={styles.subtitle}>
          {alternativeRoutes.length} route
          {alternativeRoutes.length > 1 ? "s" : ""} available
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {alternativeRoutes.map((route, index) => {
          const isSelected = index === selectedRouteIndex;
          const entryPoint = route.destination.entry_point;
          const accessRoad = route.destination.access_road;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.routeCard, isSelected && styles.routeCardSelected]}
              onPress={() => handleSelectRoute(index)}
            >
              <View style={styles.routeHeader}>
                <View style={styles.routeBadge}>
                  <Text style={styles.routeBadgeText}>Route {index + 1}</Text>
                </View>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#10B981"
                  />
                )}
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="navigate"
                    size={16}
                    color="#6B7280"
                  />
                  <Text style={styles.infoLabel}>Distance:</Text>
                  <Text style={styles.infoValue}>
                    {(route.route.total_distance / 1000).toFixed(2)} km
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="location"
                    size={16}
                    color="#6B7280"
                  />
                  <Text style={styles.infoLabel}>Entry Point:</Text>
                  <Text style={styles.infoValue}>EP {entryPoint.label}</Text>
                </View>

                {accessRoad && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="trail-sign"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.infoLabel}>Via:</Text>
                    <Text
                      style={styles.infoValue}
                      numberOfLines={1}
                    >
                      {accessRoad.name}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="footsteps"
                    size={16}
                    color="#6B7280"
                  />
                  <Text style={styles.infoLabel}>From Road:</Text>
                  <Text style={styles.infoValue}>
                    {entryPoint.distance_to_parcel_meters.toFixed(0)}m walk
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>Start Navigation</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
          />
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.65,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  routeCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  routeCardSelected: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routeBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  routeBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  routeInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  confirmButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});

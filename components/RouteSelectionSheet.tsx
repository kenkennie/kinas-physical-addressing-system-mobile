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

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.dragHandle} />

      <View style={styles.header}>
        <Text style={styles.title}>Choose a route</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsSelectingRoute(false)}
        >
          <Ionicons
            name="close"
            size={24}
            color="#5F6368"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {alternativeRoutes.map((route, index) => {
          const isSelected = index === selectedRouteIndex;
          const entryPoint = route.destination.entry_point;
          const accessRoad = route.destination.access_road;
          const distance = formatDistance(route.route.total_distance);

          return (
            <TouchableOpacity
              key={index}
              style={[styles.routeCard, isSelected && styles.routeCardSelected]}
              onPress={() => handleSelectRoute(index)}
              activeOpacity={0.7}
            >
              {/* Route header with distance and time */}
              <View style={styles.routeHeader}>
                <View style={styles.routeMainInfo}>
                  <Text style={styles.routeDistance}>{distance}</Text>
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#1A73E8"
                      />
                      <Text style={styles.selectedText}>Best route</Text>
                    </View>
                  )}
                </View>
                {isSelected && (
                  <View style={styles.radioSelected}>
                    <View style={styles.radioDot} />
                  </View>
                )}
                {!isSelected && <View style={styles.radioUnselected} />}
              </View>

              {/* Route details */}
              <View style={styles.routeDetails}>
                {/* Via information */}
                {accessRoad && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Via</Text>
                    <Text
                      style={styles.detailValue}
                      numberOfLines={1}
                    >
                      {accessRoad.name}
                    </Text>
                  </View>
                )}

                {/* Entry point */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Entry point</Text>
                  <Text style={styles.detailValue}>EP {entryPoint.label}</Text>
                </View>

                {/* Walking distance from road */}
                <View style={styles.detailRow}>
                  <Ionicons
                    name="walk"
                    size={14}
                    color="#5F6368"
                  />
                  <Text style={styles.detailValue}>
                    {entryPoint.distance_to_parcel_meters.toFixed(0)}m walk from
                    road
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer with start button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
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
    maxHeight: height * 0.65,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  routeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8EAED",
    padding: 16,
    marginBottom: 12,
  },
  routeCardSelected: {
    borderColor: "#1A73E8",
    borderWidth: 2,
    backgroundColor: "#F8FBFF",
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routeMainInfo: {
    flex: 1,
    gap: 4,
  },
  routeDistance: {
    fontSize: 18,
    fontWeight: "500",
    color: "#202124",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectedText: {
    fontSize: 12,
    color: "#1A73E8",
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1A73E8",
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1A73E8",
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DADCE0",
  },
  routeDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#5F6368",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  detailValue: {
    fontSize: 13,
    color: "#202124",
    flex: 1,
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

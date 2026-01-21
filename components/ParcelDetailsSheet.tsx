import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";

const { height } = Dimensions.get("window");

export const ParcelDetailsSheet: React.FC = () => {
  const {
    selectedParcel,
    setSelectedParcel,
    userLocation,
    setUserLocation,
    transportMode,
    setAlternativeRoutes,
    setActiveRoute,
    setIsSelectingRoute,
    setLoading,
    setError,
  } = useMapStore();
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  if (!selectedParcel) return null;

  // const handleNavigate = async () => {
  //   try {
  //     setLoading(true);
  //     const data = await apiService.calculateRoute({
  //       origin: userLocation,
  //       destination_lr_no: selectedParcel.parcel.lr_no,
  //       mode: transportMode,
  //     });

  //     setActiveRoute(data);
  //     setRouteGeoJSON(formatRouteGeoJSON(data.route.segments));
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleNavigate = async () => {
    try {
      setLoading(true);
      setError(null);

      let origin = userLocation;

      // Get current location if user prefers
      if (useCurrentLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Location permission is needed for navigation",
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        origin = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setUserLocation(origin);
      }

      if (!origin) {
        Alert.alert("Error", "Please set your starting location");
        return;
      }

      // If parcel has multiple entry points, get alternative routes
      if (selectedParcel.entry_points.length > 1) {
        const alternatives = await apiService.getAlternativeRoutes({
          gid: selectedParcel.parcel.gid,
          origin,
          destination_lr_no: selectedParcel.parcel.lr_no,
          mode: transportMode,
        });

        setAlternativeRoutes(alternatives);
        setActiveRoute(alternatives[0]); // Set first as default
        setIsSelectingRoute(true); // Show route selection
      } else {
        // Single entry point - direct navigation
        const route = await apiService.calculateRoute({
          gid: selectedParcel.parcel.gid,
          origin,
          destination_lr_no: selectedParcel.parcel.lr_no,
          mode: transportMode,
        });

        setActiveRoute(route);
        setIsSelectingRoute(false);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to calculate route");
      Alert.alert("Error", "Could not calculate route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>NBO-{selectedParcel.parcel.lr_no}</Text>
          <Text style={styles.subtitle}>
            {selectedParcel.administrative_block?.name}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setSelectedParcel(null)}>
          <Ionicons
            name="close"
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Starting Point</Text>
          <TouchableOpacity
            style={styles.locationToggle}
            onPress={() => setUseCurrentLocation(!useCurrentLocation)}
          >
            <Ionicons
              name={useCurrentLocation ? "locate" : "pin"}
              size={20}
              color={useCurrentLocation ? "#10B981" : "#6B7280"}
            />
            <Text style={styles.locationToggleText}>
              {useCurrentLocation ? "My Current Location" : "Custom Location"}
            </Text>
            <Ionicons
              name={useCurrentLocation ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={useCurrentLocation ? "#10B981" : "#D1D5DB"}
            />
          </TouchableOpacity>
        </View>

        {/* Admin Block */}
        {selectedParcel.administrative_block && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administrative Area</Text>
            <View style={styles.adminCard}>
              <View style={styles.adminRow}>
                <Ionicons
                  name="location"
                  size={16}
                  color="#6B7280"
                />
                <Text style={styles.adminText}>
                  {selectedParcel.administrative_block.name}
                </Text>
              </View>
              <View style={styles.adminRow}>
                <Ionicons
                  name="business"
                  size={16}
                  color="#6B7280"
                />
                <Text style={styles.adminText}>
                  {selectedParcel.administrative_block.constituen}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Entry Points */}
        {selectedParcel.entry_points &&
          selectedParcel.entry_points.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Entry Points ({selectedParcel.entry_points.length})
              </Text>
              {selectedParcel.entry_points.map((entry: any) => (
                <View
                  key={entry.gid}
                  style={styles.entryPointCard}
                >
                  <View style={styles.entryRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>EP {entry.label}</Text>
                    </View>
                    <Text style={styles.coordText}>
                      {entry.distance_to_parcel_meters.toFixed(0)}m from parcel
                    </Text>
                  </View>

                  {entry.nearest_roads && entry.nearest_roads.length > 0 && (
                    <>
                      <Text style={styles.roadsTitle}>Access Roads</Text>
                      {entry.nearest_roads.slice(0, 2).map((road: any) => (
                        <View
                          key={road.gid}
                          style={styles.roadLinkRow}
                        >
                          <Ionicons
                            name="navigate"
                            size={16}
                            color="#6B7280"
                          />
                          <Text
                            style={styles.roadText}
                            numberOfLines={1}
                          >
                            {road.name || "Unnamed Road"}
                          </Text>
                          <Text style={styles.distText}>
                            {road.distance_meters.toFixed(0)}m
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={handleNavigate}
        >
          <Ionicons
            name="navigate"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.navigateText}>
            {selectedParcel.entry_points.length > 1
              ? "View Routes"
              : "Start Navigation"}
          </Text>
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
    maxHeight: height * 0.75,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  entryPoint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryPointIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  entryPointNumber: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 17,
  },
  entryPointInfo: {
    flex: 1,
  },
  entryPointTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 3,
  },
  entryPointCoords: {
    fontSize: 13,
    color: "#6B7280",
  },
  entryPointCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  locationToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  locationToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },
  roadsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 8,
  },
  coordText: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  roadLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 8,
  },
  roadText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 10,
    flex: 1,
  },
  distText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginLeft: 6,
  },
  road: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  roadInfo: {
    marginLeft: 14,
    flex: 1,
  },
  roadName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  roadDistance: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },
  roadCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  adminCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  adminRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  adminText: {
    fontSize: 15,
    color: "#1F2937",
    marginLeft: 10,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  navigateButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  navigateText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 10,
  },
});

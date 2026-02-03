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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";
import { Share } from "react-native";

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
    activeRoute,
  } = useMapStore();
  const [sheetCollapsed, setSheetCollapsed] = useState(false);

  // Don't show if there's an active route - show direction sheet instead
  if (!selectedParcel || activeRoute) return null;

  const handleDirections = async () => {
    try {
      setLoading(true);
      setError(null);

      let origin = userLocation;

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Access",
          "Please enable location access for navigation",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      origin = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setUserLocation(origin);

      if (!origin) {
        Alert.alert("Error", "Please set your starting location");
        return;
      }

      // Check for multiple entry points
      if (selectedParcel.entry_points.length > 1) {
        const alternatives = await apiService.getAlternativeRoutes({
          gid: selectedParcel.parcel.gid,
          origin,
          destination_lr_no: selectedParcel.parcel.lr_no,
          mode: transportMode,
        });

        setAlternativeRoutes(alternatives);
        setActiveRoute(alternatives[0]);
        setIsSelectingRoute(true);
      } else {
        const route = await apiService.calculateRoute({
          gid: selectedParcel.parcel.gid,
          origin,
          destination_lr_no: selectedParcel.parcel.lr_no,
          mode: transportMode,
        });

        setActiveRoute(route);
        setIsSelectingRoute(false);
      }

      // Keep parcel selected - don't clear it
    } catch (error) {
      console.error(error);
      setError("Failed to calculate route");
      Alert.alert("Error", "Could not calculate route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Share function
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Parcel: ${selectedParcel.administrative_block?.short_name || "N/A"}/${selectedParcel.parcel.lr_no.split("/")[1] || selectedParcel.parcel.lr_no}\nArea: ${selectedParcel.parcel.area} hectares`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    Alert.alert("Save", "Save functionality coming soon");
  };

  return (
    <Animated.View
      style={[styles.container, sheetCollapsed && styles.containerCollapsed]}
    >
      <TouchableOpacity onPress={() => setSheetCollapsed(!sheetCollapsed)}>
        <View style={styles.dragHandle} />
      </TouchableOpacity>

      {/* Header section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {selectedParcel.administrative_block?.short_name || "N/A"}/
            {selectedParcel.parcel.lr_no.split("/")[1] ||
              selectedParcel.parcel.lr_no}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleShare}
          >
            <Ionicons
              name="share-outline"
              size={24}
              color="#5F6368"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setSheetCollapsed(true)}
          >
            <Ionicons
              name="close"
              size={24}
              color="#5F6368"
            />
          </TouchableOpacity>
        </View>
      </View>
      {!sheetCollapsed && (
        <>
          <View style={styles.divider} />

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Parcel Information */}
            <View style={styles.section}>
              {selectedParcel.administrative_block && (
                <>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#5F6368"
                    />
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>
                      {selectedParcel.administrative_block.name}
                    </Text>
                  </View>

                  {selectedParcel.administrative_block.constituen && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="business-outline"
                        size={18}
                        color="#5F6368"
                      />
                      <Text style={styles.infoLabel}>Constituency</Text>
                      <Text style={styles.infoValue}>
                        {selectedParcel.administrative_block.constituen}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Entry Points */}
            {selectedParcel.entry_points &&
              selectedParcel.entry_points.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Access Points ({selectedParcel.entry_points.length})
                    </Text>

                    {selectedParcel.entry_points.map((entry: any) => (
                      <View
                        key={entry.gid}
                        style={styles.entryCard}
                      >
                        <View style={styles.entryHeader}>
                          <View style={styles.entryBadge}>
                            <Text style={styles.entryBadgeText}>
                              EP {entry.label}
                            </Text>
                          </View>
                          <Text style={styles.entryDistance}>
                            {entry.distance_to_parcel_meters}m from parcel
                          </Text>
                        </View>

                        {entry.nearest_roads &&
                          entry.nearest_roads.length > 0 && (
                            <View style={styles.roadsContainer}>
                              <Text style={styles.roadsLabel}>
                                Nearby Roads
                              </Text>
                              {entry.nearest_roads
                                .slice(0, 2)
                                .map((road: any) => (
                                  <View
                                    key={road.gid}
                                    style={styles.roadRow}
                                  >
                                    <Ionicons
                                      name="navigate-outline"
                                      size={14}
                                      color="#5F6368"
                                    />
                                    <Text
                                      style={styles.roadName}
                                      numberOfLines={1}
                                    >
                                      {road.name || "Unnamed Road"}
                                    </Text>
                                    <Text style={styles.roadDistance}>
                                      {road.distance_meters}m
                                    </Text>
                                  </View>
                                ))}
                            </View>
                          )}
                      </View>
                    ))}
                  </View>
                </>
              )}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={handleDirections}
              >
                <Ionicons
                  name="navigate"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}
    </Animated.View>
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
  containerCollapsed: {
    maxHeight: 80, // Just show header when collapsed
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
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    marginTop: -8,
  },
  title: {
    fontSize: 22,
    fontWeight: "500",
    color: "#202124",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  subtitle: {
    fontSize: 14,
    color: "#5F6368",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EAED",
    marginHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  bottomActions: {
    padding: 20,
    paddingBottom: 32,
  },
  directionsButton: {
    backgroundColor: "#1A73E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  directionsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#202124",
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#5F6368",
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  infoValue: {
    fontSize: 14,
    color: "#202124",
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  entryCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entryBadge: {
    backgroundColor: "#1A73E8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entryBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  entryDistance: {
    fontSize: 12,
    color: "#5F6368",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  roadsContainer: {
    gap: 8,
  },
  roadsLabel: {
    fontSize: 12,
    color: "#5F6368",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  roadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  roadName: {
    flex: 1,
    fontSize: 13,
    color: "#202124",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  roadDistance: {
    fontSize: 12,
    color: "#5F6368",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
});

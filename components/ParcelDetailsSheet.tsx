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
import { apiService } from "../services/api.service";

const { height } = Dimensions.get("window");

export const ParcelDetailsSheet: React.FC = () => {
  const {
    selectedParcel,
    setSelectedParcel,
    userLocation,
    transportMode,
    setActiveRoute,
    setRouteGeoJSON,
    setLoading,
    setError,
  } = useMapStore();

  if (!selectedParcel) return null;

  // Helper function to format the backend response for Mapbox
  const formatRouteGeoJSON = (segments: any[]) => {
    return {
      type: "FeatureCollection",
      features: segments.map((seg: any) => ({
        type: "Feature",
        properties: {
          name: seg.name,
          road_type: seg.road_type,
        },
        geometry: JSON.parse(seg.geometry), // Convert string from ST_AsGeoJSON to Object
      })),
    };
  };

  const handleNavigate = async () => {
    try {
      setLoading(true);
      const data = await apiService.calculateRoute({
        origin: userLocation,
        destination_lr_no: selectedParcel.parcel.lr_no,
        mode: transportMode,
      });

      setActiveRoute(data);
      setRouteGeoJSON(formatRouteGeoJSON(data.route.segments));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}> NBO-{selectedParcel.parcel.lr_no}</Text>
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
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>LR Number</Text>
            <Text style={styles.detailValue}>
              {selectedParcel.parcel.lr_no}
            </Text>
          </View>
        </View> */}

        {/* {selectedParcel.nearest_road && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Road</Text>
            <View style={styles.roadCard}>
              <View style={styles.road}>
                <Ionicons
                  name="navigate"
                  size={18}
                  color="#6B7280"
                />
                <View style={styles.roadInfo}>
                  <Text style={styles.roadName}>
                    {selectedParcel.nearest_road.name || "Unnamed Road"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )} */}

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
              {/* <View style={styles.adminRow}>
                <Ionicons
                  name="flag"
                  size={16}
                  color="#6B7280"
                />
                <Text style={styles.adminText}>
                  {selectedParcel.administrative_block.county_nam}
                </Text>
              </View> */}
            </View>
          </View>
        )}

        {selectedParcel.entry_points &&
          selectedParcel.entry_points.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entry Points</Text>
              {(() => {
                return null;
              })()}
              {selectedParcel.entry_points.map((entry: any, index: number) => (
                <View
                  key={entry.gid}
                  style={styles.entryPointCard}
                >
                  <View style={styles.entryRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{entry.label}</Text>
                    </View>
                    <Text style={styles.coordText}>{entry.label}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Distance to Parcel</Text>
                    <Text style={styles.detailValue}>
                      {entry.distance_to_parcel_meters} m
                    </Text>
                  </View>
                  <Text style={styles.sectionTitle}>Nearest Roads</Text>
                  {entry.nearest_roads.map((road: any, idx: number) => (
                    <View
                      key={road.gid}
                      style={styles.roadLinkRow}
                    >
                      <Ionicons
                        name="navigate"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.roadText}>
                        {road.name} ({road.ref})
                      </Text>
                      <Text style={styles.distText}>
                        {road.distance_meters} m
                      </Text>
                    </View>
                  ))}
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
          <Text style={styles.navigateText}>Start Navigation</Text>
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

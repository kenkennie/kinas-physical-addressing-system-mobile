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
  const formatRouteGeoJSON = (segments) => {
    return {
      type: "FeatureCollection",
      features: segments.map((seg) => ({
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
          <Text style={styles.title}>{selectedParcel.parcel.lr_no}</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>LR Number</Text>
            <Text style={styles.detailValue}>
              {selectedParcel.parcel.lr_no}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>FR Number</Text>
            <Text style={styles.detailValue}>
              {selectedParcel.parcel.fr_no}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Area</Text>
            <Text style={styles.detailValue}>
              {selectedParcel.parcel.area.toFixed(2)} Ha
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Entry Points ({selectedParcel.entry_points.length})
          </Text>
          {selectedParcel.entry_points.map((ep) => (
            <View
              key={ep.gid}
              style={styles.entryPoint}
            >
              <View style={styles.entryPointIcon}>
                <Text style={styles.entryPointNumber}>{ep.label}</Text>
              </View>
              <View style={styles.entryPointInfo}>
                <Text style={styles.entryPointTitle}>
                  Entry Point {ep.label}
                </Text>
                <Text style={styles.entryPointCoords}>
                  {/* y is Latitude, x is Longitude */}
                  {ep.y.toFixed(6)}, {ep.x.toFixed(6)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {selectedParcel.nearby_roads.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Roads</Text>
            {selectedParcel.nearby_roads.map((road) => (
              <View
                key={road.gid}
                style={styles.road}
              >
                <Ionicons
                  name="navigate"
                  size={16}
                  color="#6B7280"
                />
                <View style={styles.roadInfo}>
                  <Text style={styles.roadName}>{road.name}</Text>
                  {road.distance && (
                    <Text style={styles.roadDistance}>
                      {road.distance.toFixed(0)}m away
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

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
              <View style={styles.adminRow}>
                <Ionicons
                  name="flag"
                  size={16}
                  color="#6B7280"
                />
                <Text style={styles.adminText}>
                  {selectedParcel.administrative_block.county_nam}
                </Text>
              </View>
            </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  entryPoint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  entryPointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  entryPointNumber: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  entryPointInfo: {
    flex: 1,
  },
  entryPointTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  entryPointCoords: {
    fontSize: 12,
    color: "#6B7280",
  },
  road: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  roadInfo: {
    marginLeft: 12,
    flex: 1,
  },
  roadName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  roadDistance: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  adminCard: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  adminRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  adminText: {
    fontSize: 14,
    color: "#111827",
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  navigateButton: {
    flexDirection: "row",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  navigateText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

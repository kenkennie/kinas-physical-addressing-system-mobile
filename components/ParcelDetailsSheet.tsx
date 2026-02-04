import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";
import { ParcelDetails } from "../types/address.types";

// ---------------------------------------------------------------------------
// Types (for local components that need extended types)
// ---------------------------------------------------------------------------
interface Road {
  gid: string | number;
  name?: string | null;
  distance_meters: number;
}

interface EntryPoint {
  gid: string | number;
  label: string;
  distance_to_parcel_meters: number;
  nearest_roads?: Road[];
}

interface AdministrativeBlock {
  name: string;
  short_name?: string;
  constituen?: string;
}

interface Parcel {
  gid: string;
  lr_no: string;
}

interface SelectedParcelData {
  parcel: Parcel;
  administrative_block?: AdministrativeBlock;
  entry_points: EntryPoint[];
}

// ---------------------------------------------------------------------------
// Helper: derive display title
// ---------------------------------------------------------------------------
function displayTitle(data: ParcelDetails): string {
  const block = data.administrative_block?.short_name || "N/A";
  const lrSuffix = data.parcel.lr_no.split("/")[1] || data.parcel.lr_no;
  return `${block}/${lrSuffix}`;
}

// ---------------------------------------------------------------------------
// Small reusable sub-components
// ---------------------------------------------------------------------------
const SectionDivider = () => <View style={styles.divider} />;

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <Ionicons
      name={icon as any}
      size={18}
      color="#5F6368"
    />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={styles.infoValue}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

const RoadItem: React.FC<{ road: Road }> = ({ road }) => (
  <View style={styles.roadRow}>
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
    <Text style={styles.roadDistance}>{road.distance_meters}m</Text>
  </View>
);

const EntryPointCard: React.FC<{ entry: EntryPoint }> = ({ entry }) => (
  <View style={styles.entryCard}>
    <View style={styles.entryHeader}>
      <View style={styles.entryBadge}>
        <Text style={styles.entryBadgeText}>EP {entry.label}</Text>
      </View>
      <Text style={styles.entryDistance}>
        {entry.distance_to_parcel_meters}m from parcel
      </Text>
    </View>

    {entry.nearest_roads && entry.nearest_roads.length > 0 && (
      <View style={styles.roadsContainer}>
        <Text style={styles.roadsLabel}>Nearby Roads</Text>
        {entry.nearest_roads.slice(0, 2).map((road: Road) => (
          <RoadItem
            key={road.gid}
            road={road}
          />
        ))}
      </View>
    )}
  </View>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const ParcelDetailsSheet: React.FC = () => {
  const {
    selectedParcel,
    setSelectedParcel,
    setUserLocation,
    transportMode,
    setAlternativeRoutes,
    setActiveRoute,
    setIsSelectingRoute,
    setLoading,
    setError,
    activeRoute,
  } = useMapStore();

  const [collapsed, setCollapsed] = useState(false);

  // All hooks must be called unconditionally at the top level
  // before any conditional returns
  const handleDirections = useCallback(async () => {
    if (!selectedParcel) return;

    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Access",
          "Please enable location access for navigation",
        );
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({});
      const origin = { lat: coords.latitude, lng: coords.longitude };
      setUserLocation(origin);

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
    } catch (error) {
      console.error(error);
      setError("Failed to calculate route");
      Alert.alert("Error", "Could not calculate route. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedParcel, transportMode]);

  const handleShare = useCallback(async () => {
    if (!selectedParcel) return;

    try {
      await Share.share({
        message:
          `Parcel: ${displayTitle(selectedParcel)}\n` +
          `Constituency: ${selectedParcel.administrative_block?.constituen}` +
          `\nLocation: ${selectedParcel.administrative_block?.name}\n`,
      });
    } catch (error) {
      console.error(error);
    }
  }, [selectedParcel]);

  useEffect(() => {
    if (selectedParcel) {
      setCollapsed(false);
    }
  }, [selectedParcel]);

  // Hide when nothing is selected, or when a route is active
  // (RouteInstructions takes over at that point).
  if (!selectedParcel || activeRoute) return null;

  return (
    <Animated.View
      style={[styles.container, collapsed && styles.containerCollapsed]}
    >
      {/* Drag handle — toggles collapse */}
      <TouchableOpacity
        onPress={() => setCollapsed((prev) => !prev)}
        hitSlop={{ top: 8, bottom: 8, left: 24, right: 24 }}
      >
        <View style={styles.dragHandle} />
      </TouchableOpacity>

      {/* Header — always visible */}
      <View style={styles.header}>
        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {displayTitle(selectedParcel)}
        </Text>

        {/* Share button */}
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

          {/* Expand when collapsed, dismiss when expanded */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={
              collapsed
                ? () => setCollapsed(false)
                : () => setSelectedParcel(null)
            }
          >
            <Ionicons
              name={collapsed ? "chevron-up" : "close"}
              size={24}
              color="#5F6368"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body — hidden when collapsed */}
      {!collapsed && (
        <>
          <SectionDivider />

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Location / Constituency  */}
            <View style={styles.section}>
              {selectedParcel.administrative_block && (
                <>
                  <InfoRow
                    icon="location-outline"
                    label="Location"
                    value={selectedParcel.administrative_block.name}
                  />
                  {selectedParcel.administrative_block.constituen && (
                    <InfoRow
                      icon="business-outline"
                      label="Constituency"
                      value={selectedParcel.administrative_block.constituen}
                    />
                  )}
                </>
              )}
            </View>

            {/* Access / Entry points */}
            {selectedParcel.entry_points.length > 0 && (
              <>
                <SectionDivider />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Access Points ({selectedParcel.entry_points.length})
                  </Text>
                  {selectedParcel.entry_points.map((entry) => (
                    <EntryPointCard
                      key={entry.gid}
                      entry={entry}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Get Directions CTA */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={handleDirections}
                activeOpacity={0.75}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "65%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  containerCollapsed: {
    maxHeight: undefined,
  },

  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DADCE0",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#202124",
    marginRight: 8,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
  },

  divider: {
    height: 1,
    backgroundColor: "#E8EAED",
    marginHorizontal: 16,
  },

  content: {
    paddingBottom: 24,
  },

  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5F6368",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    width: 90,
    fontSize: 14,
    color: "#5F6368",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#202124",
  },

  entryCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryBadge: {
    backgroundColor: "#E8F0FE",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  entryBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A73E8",
  },
  entryDistance: {
    fontSize: 12,
    color: "#5F6368",
  },

  roadsContainer: { gap: 4 },
  roadsLabel: {
    fontSize: 12,
    color: "#80868B",
    marginBottom: 2,
  },
  roadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roadName: {
    flex: 1,
    fontSize: 13,
    color: "#3C4043",
  },
  roadDistance: {
    fontSize: 12,
    color: "#80868B",
  },

  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A73E8",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  directionsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

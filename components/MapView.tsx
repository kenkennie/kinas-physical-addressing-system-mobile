import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { API_CONFIG, MAPBOX_CONFIG } from "../config/mapbox.config";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";

MapboxGL.setAccessToken(MAPBOX_CONFIG.ACCESS_TOKEN);

export const MapView: React.FC = () => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const { selectedParcel, setSelectedParcel, setLoading, activeRoute } =
    useMapStore();

  const entryPoint = activeRoute?.destination?.entry_point;

  const handleMapPress = async (event: any) => {
    const { geometry } = event;
    const [lng, lat] = geometry.coordinates;

    try {
      setLoading(true);
      // 1. Clear previous selection immediately for better UX
      setSelectedParcel(null);

      // 2. API Call
      const data = await apiService.identifyParcel(lat, lng);
      setSelectedParcel(data);
    } catch (error) {
      console.log("No parcel found");
      setSelectedParcel(null);
    } finally {
      setLoading(false);
    }
  };

  // 1. Process Route Segments into a single GeoJSON for the Map
  const routeFeatureCollection = useMemo(() => {
    if (!activeRoute?.route?.segments) return null;
    return {
      type: "FeatureCollection" as const,
      features: activeRoute.route.segments.map((seg: any) => ({
        type: "Feature" as const,
        geometry:
          typeof seg.geometry === "string"
            ? JSON.parse(seg.geometry)
            : seg.geometry,
        properties: { name: seg.name },
      })),
    };
  }, [activeRoute]);

  // Auto-zoom to route when activeRoute is set
  // 2. Auto-zoom to fit the route or entry point
  useEffect(() => {
    if (activeRoute && entryPoint) {
      cameraRef.current?.setCamera({
        centerCoordinate: [entryPoint.x, entryPoint.y],
        zoomLevel: 16,
        animationDuration: 1500,
      });
    }
  }, [activeRoute, entryPoint]);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        onPress={handleMapPress} // Add click handler
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={MAPBOX_CONFIG.NAIROBI_CENTER.zoom}
          centerCoordinate={[
            MAPBOX_CONFIG.NAIROBI_CENTER.longitude,
            MAPBOX_CONFIG.NAIROBI_CENTER.latitude,
          ]}
          // followUserLocation={!activeRoute}
        />
        <MapboxGL.UserLocation visible={true} />

        {/* --- ROUTE LAYER --- */}
        {routeFeatureCollection && (
          <MapboxGL.ShapeSource
            id="routeSource"
            shape={routeFeatureCollection}
          >
            <MapboxGL.LineLayer
              id="routeLine"
              style={{
                lineColor: "#3182ce", // Bright Blue
                lineWidth: 5,
                lineCap: "round",
                lineJoin: "round",
                lineOpacity: 0.8,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* --- DESTINATION MARKER --- */}
        {entryPoint && (
          <MapboxGL.PointAnnotation
            id="destinationMarker"
            coordinate={[entryPoint.x, entryPoint.y]}
          >
            <View style={styles.destinationMarker}>
              <Text style={styles.markerText}>EP {entryPoint.label}</Text>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Vector Tile Source - Parcels from your backend */}
        <MapboxGL.VectorSource
          id="parcels-source"
          tileUrlTemplates={[
            `${API_CONFIG.BASE_URL}/land-parcel/tiles/{z}/{x}/{y}.mvt`,
          ]}
        >
          {/* Fill layer - parcel polygons */}
          <MapboxGL.FillLayer
            id="parcels-fill"
            sourceLayerID="parcels"
            minZoomLevel={5}
            style={{
              fillColor: "#dcf4dc",
              fillOpacity: 0.5,
              fillOutlineColor: "#3d3d3d",
            }}
          />

          <MapboxGL.LineLayer
            id="parcel-highlight"
            sourceLayerID="parcels"
            filter={[
              "==",
              ["get", "lr_no"],
              selectedParcel?.parcel?.lr_no || "INVALID_ID",
            ]}
            style={{
              lineColor: "#FFD700", // Gold/Yellow highlight
              lineWidth: 4,
              lineOpacity: 1,
            }}
          />

          <MapboxGL.SymbolLayer
            id="parcels-label"
            sourceLayerID="parcels"
            minZoomLevel={14} // Only show text when zoomed in closer
            style={{
              textField: ["get", "lr_no"], // Get the 'lr_no' field from the DB
              textSize: 12,
              textColor: "#000000",
              textHaloWidth: 2,
            }}
          />
        </MapboxGL.VectorSource>

        {/* Rest of your markers */}
      </MapboxGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    top: 3,
    left: 3,
  },
  entryPointMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  entryPointInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  entryPointLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  destinationMarker: {
    backgroundColor: "#e53e3e", // Red
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
});

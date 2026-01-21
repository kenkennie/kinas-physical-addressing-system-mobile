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
  const {
    selectedParcel,
    setSelectedParcel,
    setLoading,
    activeRoute,
    alternativeRoutes,
    selectedRouteIndex,
    isSelectingRoute,
  } = useMapStore();

  const entryPoint = activeRoute?.destination?.entry_point;

  const handleParcelPress = async (event: any) => {
    const { coordinates } = event;

    if (!coordinates) {
      console.log("No coordinates in event");
      return;
    }
    const { latitude: lat, longitude: lng } = coordinates;

    try {
      setLoading(true);
      setSelectedParcel(null); // Clear previous selection

      // Fetch parcel details using clicked coordinates
      const data = await apiService.getParcelByGid(lat, lng);
      setSelectedParcel(data);
    } catch (error) {
      console.log("Error fetching parcel:", error);
      setSelectedParcel(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { geometry } = event;
    const [lng, lat] = geometry.coordinates;

    try {
      setLoading(true);
      setSelectedParcel(null);

      // Find parcel at this point, returns GID
      const data = await apiService.identifyParcel(lat, lng);
      // Then fetch full details
      setSelectedParcel(data);
    } catch (error) {
      console.log("No parcel found at this location");
      setSelectedParcel(null);
    } finally {
      setLoading(false);
    }
  };

  // Render all alternative routes when selecting
  const renderRoutes = () => {
    if (!isSelectingRoute || alternativeRoutes.length === 0) {
      return activeRoute ? renderSingleRoute(activeRoute) : null;
    }

    return alternativeRoutes.map((route, index) => {
      const isSelected = index === selectedRouteIndex;
      const routeGeoJSON = {
        type: "FeatureCollection" as const,
        features: route.route.segments.map((seg: any) => ({
          type: "Feature" as const,
          geometry:
            typeof seg.geometry === "string"
              ? JSON.parse(seg.geometry)
              : seg.geometry,
          properties: { name: seg.name },
        })),
      };

      return (
        <MapboxGL.ShapeSource
          key={`route-${index}`}
          id={`routeSource-${index}`}
          shape={routeGeoJSON}
        >
          <MapboxGL.LineLayer
            id={`routeLine-${index}`}
            style={{
              lineColor: isSelected ? "#3182ce" : "#9CA3AF",
              lineWidth: isSelected ? 5 : 3,
              lineCap: "round",
              lineJoin: "round",
              lineOpacity: isSelected ? 0.9 : 0.5,
            }}
          />
        </MapboxGL.ShapeSource>
      );
    });
  };

  const renderSingleRoute = (route: any) => {
    const routeGeoJSON = {
      type: "FeatureCollection" as const,
      features: route.route.segments.map((seg: any) => ({
        type: "Feature" as const,
        geometry:
          typeof seg.geometry === "string"
            ? JSON.parse(seg.geometry)
            : seg.geometry,
        properties: { name: seg.name },
      })),
    };

    return (
      <MapboxGL.ShapeSource
        id="routeSource"
        shape={routeGeoJSON}
      >
        <MapboxGL.LineLayer
          id="routeLine"
          style={{
            lineColor: "#3182ce",
            lineWidth: 5,
            lineCap: "round",
            lineJoin: "round",
            lineOpacity: 0.8,
          }}
        />
      </MapboxGL.ShapeSource>
    );
  };

  // 2. Auto-zoom to fit the route or entry point
  // Auto-zoom to route when active
  useEffect(() => {
    if (activeRoute && entryPoint) {
      cameraRef.current?.setCamera({
        centerCoordinate: [
          entryPoint.coordinates.lng,
          entryPoint.coordinates.lat,
        ],
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
        onPress={handleMapPress} // Fallback for empty areas
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={MAPBOX_CONFIG.NAIROBI_CENTER.zoom}
          centerCoordinate={[
            MAPBOX_CONFIG.NAIROBI_CENTER.longitude,
            MAPBOX_CONFIG.NAIROBI_CENTER.latitude,
          ]}
        />
        <MapboxGL.UserLocation visible={true} />

        {/* Render routes */}
        {renderRoutes()}

        {/* --- DESTINATION MARKER --- */}
        {entryPoint && (
          <MapboxGL.PointAnnotation
            id="destinationMarker"
            coordinate={[
              entryPoint.coordinates.lng,
              entryPoint.coordinates.lat,
            ]}
          >
            <View style={styles.destinationMarker}>
              <Text style={styles.markerText}>EP {entryPoint.label}</Text>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Vector Tile Source - Parcels */}
        <MapboxGL.VectorSource
          id="parcels-source"
          tileUrlTemplates={[
            `${API_CONFIG.BASE_URL}/land-parcel/tiles/{z}/{x}/{y}.mvt`,
          ]}
          minZoomLevel={12} // Optimize: don't load at low zoom
          maxZoomLevel={20}
          onPress={handleParcelPress} // Handle clicks on parcels
        >
          {/* Fill layer - parcel polygons */}
          <MapboxGL.FillLayer
            id="parcels-fill"
            sourceLayerID="parcels"
            minZoomLevel={12}
            style={{
              fillColor: "#dcf4dc",
              fillOpacity: 0.5,
            }}
          />

          {/* Outline layer */}
          <MapboxGL.LineLayer
            id="parcels-outline"
            sourceLayerID="parcels"
            minZoomLevel={12}
            style={{
              lineColor: "#3d3d3d",
              lineWidth: 1,
              lineOpacity: 0.6,
            }}
          />

          {/* Highlight selected parcel */}
          <MapboxGL.LineLayer
            id="parcel-highlight"
            sourceLayerID="parcels"
            filter={[
              "==",
              ["get", "gid"], // Use GID for filtering
              selectedParcel?.parcel?.gid || -1,
            ]}
            style={{
              lineColor: "#ff6a0099",
              lineWidth: 4,
              lineOpacity: 1,
            }}
          />

          {/* Labels */}
          <MapboxGL.SymbolLayer
            id="parcels-label"
            sourceLayerID="parcels"
            minZoomLevel={14}
            style={{
              textField: ["get", "lr_no"],
              textSize: 12,
              textColor: "#000000",
              textHaloColor: "#FFFFFF",
              textHaloWidth: 2,
            }}
          />
        </MapboxGL.VectorSource>
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

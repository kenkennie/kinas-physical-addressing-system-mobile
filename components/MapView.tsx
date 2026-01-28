import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { API_CONFIG, MAPBOX_CONFIG } from "../config/mapbox.config";
import { useMapStore } from "../stores/map.store";
import { apiService } from "../services/api.service";

MapboxGL.setAccessToken(MAPBOX_CONFIG.ACCESS_TOKEN);

export const MapView: React.FC = () => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [initialLocationSet, setInitialLocationSet] = useState(false);

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
    userLocation,
    setUserLocation,
  } = useMapStore();

  const entryPoint = activeRoute?.destination?.entry_point;

  // Get user location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission not granted");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const userLoc = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };

        setUserLocation(userLoc);

        // Zoom to user location on first load
        if (!initialLocationSet) {
          cameraRef.current?.setCamera({
            centerCoordinate: [userLoc.lng, userLoc.lat],
            zoomLevel: 15,
            animationDuration: 1000,
          });
          setInitialLocationSet(true);
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    initializeLocation();
  }, []);

  const handleParcelPress = async (event: any) => {
    const { coordinates } = event;
    if (!coordinates) return;

    const { latitude: lat, longitude: lng } = coordinates;

    try {
      setLoading(true);
      const data = await apiService.getParcelByGid(lat, lng);
      setSelectedParcel(data);

      // Zoom to parcel
      if (data.centroid) {
        cameraRef.current?.setCamera({
          centerCoordinate: [data.centroid.lng, data.centroid.lat],
          zoomLevel: 17,
          animationDuration: 800,
        });
      }
    } catch (error) {
      console.log("Error fetching parcel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { geometry } = event;
    const [lng, lat] = geometry.coordinates;

    try {
      setLoading(true);
      const data = await apiService.identifyParcel(lat, lng);
      setSelectedParcel(data);
    } catch (error) {
      console.log("No parcel found at this location");
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
              lineColor: isSelected ? "#1A73E8" : "#BDC1C6",
              lineWidth: isSelected ? 6 : 4,
              lineCap: "round",
              lineJoin: "round",
              lineOpacity: isSelected ? 1 : 0.6,
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
            lineColor: "#1A73E8",
            lineWidth: 6,
            lineCap: "round",
            lineJoin: "round",
            lineOpacity: 1,
          }}
        />
      </MapboxGL.ShapeSource>
    );
  };

  // Auto-zoom to route when active
  useEffect(() => {
    if (activeRoute && entryPoint && userLocation) {
      // Calculate bounds to show both user location and destination
      const minLng = Math.min(userLocation.lng, entryPoint.coordinates.lng);
      const minLat = Math.min(userLocation.lat, entryPoint.coordinates.lat);
      const maxLng = Math.max(userLocation.lng, entryPoint.coordinates.lng);
      const maxLat = Math.max(userLocation.lat, entryPoint.coordinates.lat);
      const bounds = [minLng, minLat, maxLng, maxLat];

      cameraRef.current?.setCamera({
        bounds: {
          ne: [maxLng, maxLat],
          sw: [minLng, minLat],
        },
        animationDuration: 800,
      });
    }
  }, [activeRoute, entryPoint, userLocation]);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        onPress={handleMapPress}
        styleURL={MAPBOX_CONFIG.STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={true}
        compassViewPosition={3} // Top right
        compassViewMargins={{ x: 16, y: Platform.OS === "ios" ? 140 : 100 }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={MAPBOX_CONFIG.NAIROBI_CENTER.zoom}
          centerCoordinate={[
            MAPBOX_CONFIG.NAIROBI_CENTER.longitude,
            MAPBOX_CONFIG.NAIROBI_CENTER.latitude,
          ]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* User Location with Google Maps style */}
        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          androidRenderMode="compass"
          minDisplacement={10}
        />

        {/* Render routes */}
        {renderRoutes()}

        {/* Destination Marker - Google Maps style */}
        {entryPoint && (
          <MapboxGL.PointAnnotation
            id="destinationMarker"
            coordinate={[
              entryPoint.coordinates.lng,
              entryPoint.coordinates.lat,
            ]}
          >
            <View style={styles.destinationMarker}>
              <View style={styles.markerPin} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Vector Tile Source - Parcels */}
        <MapboxGL.VectorSource
          id="parcels-source"
          tileUrlTemplates={[
            `${API_CONFIG.BASE_URL}/land-parcel/tiles/{z}/{x}/{y}.mvt`,
          ]}
          minZoomLevel={12}
          maxZoomLevel={20}
          onPress={handleParcelPress}
        >
          {/* Fill layer - parcel polygons */}
          <MapboxGL.FillLayer
            id="parcels-fill"
            sourceLayerID="parcels"
            minZoomLevel={12}
            style={{
              fillColor: "#E8F5E9",
              fillOpacity: 0.4,
            }}
          />

          {/* Outline layer */}
          <MapboxGL.LineLayer
            id="parcels-outline"
            sourceLayerID="parcels"
            minZoomLevel={12}
            style={{
              lineColor: "#66BB6A",
              lineWidth: 1,
              lineOpacity: 0.5,
            }}
          />

          {/* Highlight selected parcel - ALWAYS show if selected */}
          {selectedParcel && (
            <MapboxGL.LineLayer
              id="parcel-highlight"
              sourceLayerID="parcels"
              filter={["==", ["get", "gid"], selectedParcel.parcel.gid]}
              style={{
                lineColor: "#1A73E8",
                lineWidth: 3,
                lineOpacity: 1,
              }}
            />
          )}

          {/* Labels */}
          <MapboxGL.SymbolLayer
            id="parcels-label"
            sourceLayerID="parcels"
            minZoomLevel={14}
            style={{
              textField: ["get", "lr_no"],
              textSize: 11,
              textColor: "#202124",
              textHaloColor: "#FFFFFF",
              textHaloWidth: 1.5,
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
  destinationMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerPin: {
    width: 24,
    height: 24,
    backgroundColor: "#EA4335",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

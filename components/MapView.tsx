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

  // Kenya bounds - prevents panning outside Kenya
  const KENYA_BOUNDS = {
    ne: [46.899578, 6.019978],
    sw: [33.908859, -4.678047],
  };

  // Zoom level constraints
  const ZOOM_CONSTRAINTS = {
    MIN_ZOOM: 6,
    MAX_ZOOM: 20,
    PARCEL_LABELS_MIN_ZOOM: 15,
  };

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

  // ── initial location ──────────────────────────────────────────────────
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

  // ── FIX 2: zoom to parcel whenever selectedParcel changes ─────────────
  // Previously zoom only happened inside handleParcelPress (vector-tile tap).
  // When SearchBar sets selectedParcel via the store, MapView never saw it.
  // This effect covers BOTH paths: map tap and search.
  useEffect(() => {
    if (selectedParcel?.centroid) {
      cameraRef.current?.setCamera({
        centerCoordinate: [
          selectedParcel.centroid.lng,
          selectedParcel.centroid.lat,
        ],
        zoomLevel: Math.min(18, ZOOM_CONSTRAINTS.MAX_ZOOM),
        animationDuration: 800,
      });
    }
  }, [selectedParcel]);

  // ── tap handlers ──────────────────────────────────────────────────────
  const handleParcelPress = async (event: any) => {
    const { coordinates } = event;
    if (!coordinates) return;

    const { latitude: lat, longitude: lng } = coordinates;

    try {
      setLoading(true);
      const data = await apiService.getParcelByByLatLong(lat, lng);
      setSelectedParcel(data);
      // Zoom is now handled by the useEffect above — no need to call
      // setCamera here anymore.  Kept setSelectedParcel so the effect fires.
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
      // Zoom handled by the useEffect above.
    } catch (error) {
      console.log("No parcel found at this location");
    } finally {
      setLoading(false);
    }
  };

  // ── route rendering ───────────────────────────────────────────────────
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

  // ── auto-zoom to fit route ────────────────────────────────────────────
  useEffect(() => {
    if (activeRoute && entryPoint && userLocation) {
      const minLng = Math.min(userLocation.lng, entryPoint.coordinates.lng);
      const minLat = Math.min(userLocation.lat, entryPoint.coordinates.lat);
      const maxLng = Math.max(userLocation.lng, entryPoint.coordinates.lng);
      const maxLat = Math.max(userLocation.lat, entryPoint.coordinates.lat);

      cameraRef.current?.setCamera({
        bounds: {
          ne: [maxLng, maxLat],
          sw: [minLng, minLat],
        },
        animationDuration: 800,
      });
    }
  }, [activeRoute, entryPoint, userLocation]);

  // ── render ────────────────────────────────────────────────────────────
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
        compassViewPosition={3}
        compassViewMargins={{ x: 16, y: Platform.OS === "ios" ? 140 : 100 }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={MAPBOX_CONFIG.NAIROBI_CENTER.zoom}
          centerCoordinate={[
            MAPBOX_CONFIG.NAIROBI_CENTER.longitude,
            MAPBOX_CONFIG.NAIROBI_CENTER.latitude,
          ]}
          minZoomLevel={ZOOM_CONSTRAINTS.MIN_ZOOM}
          maxZoomLevel={ZOOM_CONSTRAINTS.MAX_ZOOM}
          maxBounds={KENYA_BOUNDS}
          animationMode="easeTo"
          animationDuration={1000}
        />

        {/* User location */}
        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          androidRenderMode="compass"
          minDisplacement={10}
        />

        {/* Routes */}
        {renderRoutes()}

        {/* Destination marker */}
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

        {/* Parcel vector tiles */}
        <MapboxGL.VectorSource
          id="parcels-source"
          tileUrlTemplates={[
            `${API_CONFIG.BASE_URL}/land-parcel/tiles/{z}/{x}/{y}.mvt`,
          ]}
          minZoomLevel={12}
          maxZoomLevel={20}
          onPress={handleParcelPress}
        >
          <MapboxGL.FillLayer
            id="parcels-fill"
            sourceLayerID="parcels"
            minZoomLevel={12}
            style={{
              fillColor: "#E8F5E9",
              fillOpacity: 0.7,
            }}
          />

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

          {/* Highlight — shown for both map-tap and search selections */}
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

          <MapboxGL.SymbolLayer
            id="parcels-label"
            sourceLayerID="parcels"
            minZoomLevel={14}
            style={{
              textField: ["get", "display_label"],
              textSize: 11,
              textColor: "#202124",
              textHaloColor: "#FFFFFF",
              textHaloWidth: 1.5,
              textOpacity: ["case", ["has", "display_label"], 1, 0],
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

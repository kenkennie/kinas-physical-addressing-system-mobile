import React, { useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import { useMapStore } from "@/stores/map.store";
import { MapView } from "@/components/MapView";

import { SearchResultsList } from "@/components/SearchResultsList";
import { TransportModeSelector } from "@/components/TransportModeSelector";
import { ParcelDetailsSheet } from "@/components/ParcelDetailsSheet";
import { RouteInstructions } from "@/components/RouteInstructions";
import { SearchBar } from "@/components/SearchBar";

export const HomeScreen: React.FC = () => {
  const { setUserLocation, error, setError } = useMapStore();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is required for navigation features"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      // Watch location updates
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLocation) => {
          setUserLocation({
            lat: newLocation.coords.latitude,
            lng: newLocation.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error("Location error:", error);
      setError("Failed to get location");
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [
        { text: "OK", onPress: () => setError(null) },
      ]);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <MapView />
      <SearchBar />
      <SearchResultsList />
      <TransportModeSelector />
      <ParcelDetailsSheet />
      <RouteInstructions />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
});

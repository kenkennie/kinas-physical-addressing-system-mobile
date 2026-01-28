import React from "react";
import { TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMapStore } from "../stores/map.store";

interface CurrentLocationButtonProps {
  cameraRef?: any;
}

export const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  cameraRef,
}) => {
  const { setUserLocation } = useMapStore();

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Access",
          "Please enable location access in your device settings",
        );
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

      // Zoom to user location
      if (cameraRef?.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [userLoc.lng, userLoc.lat],
          zoomLevel: 15,
          animationDuration: 800,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Could not get your current location");
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGetCurrentLocation}
      activeOpacity={0.8}
    >
      <Ionicons
        name="locate"
        size={24}
        color="#5F6368"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    bottom: 200, // Above the bottom sheet
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
  },
});

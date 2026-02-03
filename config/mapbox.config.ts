export const MAPBOX_CONFIG = {
  ACCESS_TOKEN:
    "pk.eyJ1Ijoia2VubmllMjUyNSIsImEiOiJjbWs2bzEwNXUwbmZjM2VzaHQ1OWs3cjdzIn0.hOjIiVZZdyTV1RyP8ZXG_w",
  STYLE_URL: "mapbox://styles/mapbox/navigation-day-v1",
  // styleURL="mapbox://styles/mapbox/streets-v12",
  //styles/mapbox/outdoors-v12
  //styles/mapbox/light-v11
  //styles/mapbox/dark-v11
  //styles/mapbox/satellite-v9
  //styles/mapbox/satellite-streets-v12
  //styles/mapbox/navigation-day-v1

  NAIROBI_CENTER: {
    latitude: -1.2921,
    longitude: 36.8219,
    zoom: 11,
  },

  CITIES: {
    NAIROBI: { lat: -1.2921, lng: 36.8219 },
    MOMBASA: { lat: -4.0435, lng: 39.6682 },
    KISUMU: { lat: -0.0917, lng: 34.768 },
    NAKURU: { lat: -0.3031, lng: 36.08 },
    ELDORET: { lat: 0.5143, lng: 35.2698 },
  },
};

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.100:3000/api",
};

// Map styling constants
export const MAP_STYLES = {
  PARCEL: {
    FILL_COLOR: "#E8F5E9", // Light green
    FILL_OPACITY: 0.7,
    OUTLINE_COLOR: "#66BB6A", // Medium green
    OUTLINE_WIDTH: 1,
    OUTLINE_OPACITY: 0.5,
    SELECTED_COLOR: "#1A73E8", // Google blue
    SELECTED_WIDTH: 3,
  },
  LABEL: {
    COLOR: "#202124", // Dark gray (Google style)
    HALO_COLOR: "#FFFFFF",
    HALO_WIDTH: 1.5,
    MIN_SIZE: 9,
    MAX_SIZE: 13,
  },
  ROUTE: {
    ACTIVE_COLOR: "#1A73E8", // Google blue
    INACTIVE_COLOR: "#BDC1C6", // Gray
    ACTIVE_WIDTH: 6,
    INACTIVE_WIDTH: 4,
  },
};

// Kenya geographical bounds
export const KENYA_BOUNDS = {
  ne: [41.899578, 5.019978], // Northeast: Somalia/Ethiopia border
  sw: [33.908859, -4.678047], // Southwest: Lake Victoria/Tanzania border
};
// Zoom level constraints
export const ZOOM_CONSTRAINTS = {
  MIN_ZOOM: 6, // Shows all of Kenya
  MAX_ZOOM: 20, // Prevents over-zooming and rendering issues
  PARCEL_LABELS_MIN_ZOOM: 15, // Only show parcel labels when zoomed in
  PARCEL_FILL_MIN_ZOOM: 12, // Start showing parcel polygons
};

export default {
  MAPBOX_CONFIG,
  API_CONFIG,
  KENYA_BOUNDS,
  ZOOM_CONSTRAINTS,
  MAP_STYLES,
};

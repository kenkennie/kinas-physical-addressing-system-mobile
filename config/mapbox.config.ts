export const MAPBOX_CONFIG = {
  ACCESS_TOKEN:
    "pk.eyJ1Ijoia2VubmllMjUyNSIsImEiOiJjbWs2bzEwNXUwbmZjM2VzaHQ1OWs3cjdzIn0.hOjIiVZZdyTV1RyP8ZXG_w",
  STYLE_URL: "mapbox://styles/mapbox/navigation-day-v1",
  // styleURL="mapbox://styles/mapbox/streets-v12",
  NAIROBI_CENTER: {
    latitude: -1.2921,
    longitude: 36.8219,
    zoom: 11,
  },
};

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.100:3000/api",
};

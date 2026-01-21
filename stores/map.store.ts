import { create } from "zustand";
import {
  Coordinate,
  ParcelDetails,
  RouteResponse,
  TransportMode,
} from "../types/address.types";

interface MapState {
  userLocation: Coordinate | null;
  selectedParcel: ParcelDetails | null;
  activeRoute: RouteResponse | null;
  alternativeRoutes: RouteResponse[];
  selectedRouteIndex: number;
  isSelectingRoute: boolean;
  transportMode: TransportMode;
  isLoading: boolean;
  error: string | null;
  searchResults: ParcelDetails[];

  setUserLocation: (location: Coordinate) => void;
  setSelectedParcel: (parcel: ParcelDetails | null) => void;
  setActiveRoute: (route: RouteResponse | null) => void;
  setAlternativeRoutes: (routes: RouteResponse[]) => void;
  setSelectedRouteIndex: (index: number) => void;
  setIsSelectingRoute: (isSelecting: boolean) => void;
  setTransportMode: (mode: TransportMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchResults: (results: ParcelDetails[]) => void;
  clearAll: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  selectedParcel: null,
  activeRoute: null,
  alternativeRoutes: [],
  selectedRouteIndex: 0,
  isSelectingRoute: false,
  transportMode: "driving",
  isLoading: false,
  error: null,
  searchResults: [],

  setUserLocation: (location) => set({ userLocation: location }),
  setSelectedParcel: (parcel) => set({ selectedParcel: parcel }),
  setActiveRoute: (route) => set({ activeRoute: route }),
  setSelectedRouteIndex: (index) => set({ selectedRouteIndex: index }),
  setAlternativeRoutes: (routes) => set({ alternativeRoutes: routes }),
  setIsSelectingRoute: (isSelecting) => set({ isSelectingRoute: isSelecting }),
  setTransportMode: (mode) => set({ transportMode: mode }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchResults: (results) => set({ searchResults: results }),
  clearAll: () =>
    set({
      selectedParcel: null,
      activeRoute: null,
      alternativeRoutes: [],
      selectedRouteIndex: 0,
      error: null,
      searchResults: [],
    }),
}));

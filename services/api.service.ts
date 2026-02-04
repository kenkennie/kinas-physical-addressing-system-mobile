import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ParcelDetailsSchema,
  RouteResponseSchema,
  TransportMode,
  Coordinate,
  RouteResponse,
  ParcelDetails,
  SuggestionItemSchema,
} from "@/types/address.types";
import { SuggestionItem } from "@/stores/search.store";
import z from "zod";
import { API_CONFIG } from "@/config/mapbox.config";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem("auth_token");
        }
        return Promise.reject(error);
      },
    );
  }

  async getParcelByByLatLong(lat: number, lng: number) {
    const response = await this.client.post("land-parcel/identify", {
      lat,
      lng,
    });

    if (!response) throw new Error("Parcel not found");
    return ParcelDetailsSchema.parse(response.data);
  }

  async getParcelByGid(gid: number): Promise<ParcelDetails> {
    const response = await this.client.get(`/land-parcel/${gid}`); // ← FIXED
    return ParcelDetailsSchema.parse(response.data);
  }

  async searchAddress(params: {
    lr_no?: string;
    physical_address?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }) {
    const response = await this.client.post("/land-parcel/search", params);
    return z.array(ParcelDetailsSchema).parse(response.data);
  }

  async getSuggestions(query: string): Promise<SuggestionItem> {
    try {
      const response = await this.client.get("/land-parcel/suggestions", {
        params: { q: query, limit: 5 },
      });
      return z.array(SuggestionItemSchema).parse(response.data);
    } catch (error) {
      console.log("Suggestions not available:", error);
      return [];
    }
  }

  // Alias for backwards compatibility if needed
  async getParcelDetails(gid: number): Promise<ParcelDetails> {
    return this.getParcelByGid(gid);
  }

  async identifyParcel(lat: number, lng: number) {
    const response = await this.client.post("land-parcel/identify", {
      lat,
      lng,
    });
    return ParcelDetailsSchema.parse(response.data);
  }

  async getParcelsInViewport(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    limit?: number;
  }) {
    const response = await this.client.post("/parcels/viewport", bounds);
    return z
      .array(
        z.object({
          gid: z.number(),
          lr_no: z.string(),
          fr_no: z.string(),
          area: z.number(),
          geometry: z.any(),
          lat: z.number(),
          lng: z.number(),
        }),
      )
      .parse(response.data);
  }

  async calculateRoute(params: {
    gid: number;
    origin: Coordinate;
    destination_lr_no: string;
    mode: TransportMode;
    preferred_entry_point?: string;
  }): Promise<RouteResponse> {
    const response = await this.client.post("/routing/calculate", params);
    if (!response) throw new Error("Route calculation failed");
    return RouteResponseSchema.parse(response.data);
  }

  async getAlternativeRoutes(params: {
    gid: number;
    origin: Coordinate;
    destination_lr_no: string;
    mode: TransportMode;
  }): Promise<RouteResponse[]> {
    const response = await this.client.post("/routing/alternatives", params);
    if (!response) throw new Error("Failed to get alternatives");
    return response.data.map((route: any) => RouteResponseSchema.parse(route));
  }
}

export const apiService = new ApiService();

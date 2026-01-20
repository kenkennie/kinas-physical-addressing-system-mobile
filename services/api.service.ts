import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ParcelDetailsSchema,
  RouteRequest,
  RouteRequestSchema,
  RouteResponseSchema,
} from "@/types/address.types";
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

  async findParcelAtPoint(lat: number, lng: number) {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/land-parcel/at-point?lat=${lat}&lng=${lng}`,
    );
    if (!response.ok) {
      throw new Error("No parcel at this location");
    }
    return response.json(); // Returns { gid: number }
  }

  async getParcelByGid(lat: number, lng: number) {
    const response = await this.client.post("land-parcel/identify", {
      lat,
      lng,
    });
    return ParcelDetailsSchema.parse(response.data);
  }

  async searchAddress(params: {
    lr_no?: string;
    fr_no?: string;
    physical_address?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }) {
    const response = await this.client.post("/address/search", params);
    return z.array(ParcelDetailsSchema).parse(response.data);
  }

  async getParcelDetails(lr_no: string) {
    const response = await this.client.get(`/address/parcel/${lr_no}`);
    return ParcelDetailsSchema.parse(response.data);
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

  async calculateRoute(request: RouteRequest) {
    // If no origin, backend uses user's real-time location
    const payload = {
      ...request,
      origin: request.origin || "current",
    };

    return this.client.post("/route/calculate", payload);
  }

  // Get routes for all entry points at once
  async getRouteOptions(lr_no: string, origin?: Location) {
    return this.client.post("/route/options", {
      lr_no,
      origin: origin || "current",
    });
  }
}

export const apiService = new ApiService();

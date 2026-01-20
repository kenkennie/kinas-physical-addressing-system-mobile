import { z } from "zod";

// 1. Improved Coordinate Schema (Uses coerce to handle strings from DB)
export const CoordinateSchema = z
  .object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
  })
  .optional()
  .nullable();

const EntryPointSchema = z.object({
  gid: z.number().or(z.string()),
  label: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  distance_to_parcel_meters: z.number(),
  nearest_roads: z.array(
    z.object({
      gid: z.number(),
      name: z.string().nullable(),
      fclass: z.string().nullable(),
      ref: z.string().nullable(),
      distance_meters: z.number(),
    }),
  ),
});

export const ParcelSchema = z.object({
  gid: z.number(),
  lr_no: z.string(),
  fr_no: z.string().nullable().optional(), // Made optional/nullable
  area: z.coerce.number(), // VERY IMPORTANT: DB returns numeric as string
  entity: z.string().nullable().optional(),
  physical_address: z.string().nullable().optional(),
  objectid: z.number().optional().nullable(), // DB has 'gid', alias 'objectid' might be missing
});

export const RoadSchema = z.object({
  gid: z.number(),
  name: z.string().default("Unnamed Road"), // Fallback for roads without names
  ref: z.string().nullable().optional(),
  fclass: z.string().optional().nullable(),
  distance_meters: z.coerce.number().optional(),
});

export const ParcelDetailsSchema = z.object({
  parcel: ParcelSchema,
  entry_points: z.array(EntryPointSchema).default([]),
  nearby_roads: z.array(RoadSchema).default([]),
  administrative_block: z
    .object({
      name: z.string(),
      constituen: z.string().optional().nullable(),
      county_nam: z.string().optional().nullable(),
    })
    .nullable(),
  centroid: CoordinateSchema, // Now handles the json_build_object from backend
});

// --- REST OF THE SCHEMAS ---

export const TransportModeSchema = z.enum([
  "walking",
  "driving",
  "cycling",
  "motorcycle",
]);

export const RouteRequestSchema = z.object({
  origin: CoordinateSchema,
  destination_lr_no: z.string(),
  mode: TransportModeSchema,
  preferred_entry_point: z.number().optional(),
});

export const RouteResponseSchema = z.object({
  destination: z.object({
    parcel: ParcelSchema,
    entry_point: EntryPointSchema,
    access_road: RoadSchema.nullable(),
    physical_address: z.string().optional().default("N/A"),
  }),
  route: z.object({
    segments: z.array(z.any()),
    total_distance: z.coerce.number(),
    mode: TransportModeSchema,
    entry_point: z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      label: z.union([z.string(), z.number()]),
    }),
  }),
  instructions: z.array(
    z.object({
      step: z.number(),
      instruction: z.string(),
      distance: z.coerce.number().optional(),
      type: z.string().optional(),
      coordinates: CoordinateSchema.optional(),
    }),
  ),
});

export type Coordinate = z.infer<typeof CoordinateSchema>;
export type EntryPoint = z.infer<typeof EntryPointSchema>;
export type Parcel = z.infer<typeof ParcelSchema>;
export type ParcelDetails = z.infer<typeof ParcelDetailsSchema>;
export type TransportMode = z.infer<typeof TransportModeSchema>;
export type RouteRequest = z.infer<typeof RouteRequestSchema>;
export type RouteResponse = z.infer<typeof RouteResponseSchema>;

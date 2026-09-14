import { z } from "zod";

/**
 * Nested district / service refs returned with an artist
 */
export const ArtistDistrictRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const ArtistServiceRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type ArtistDistrictRef = z.infer<typeof ArtistDistrictRefSchema>;
export type ArtistServiceRef = z.infer<typeof ArtistServiceRefSchema>;

/**
 * Zod Schema for Artist Validation
 */
export const ArtistSchema = z.object({
  id: z.string().uuid(),
  auth_id: z.string().uuid().nullable().optional(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().nullable().optional().transform((v) => v || ""),
  email: z
    .string()
    .regex(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      "Invalid email address",
    ),
  username: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username may only contain letters, numbers, dots, underscores, and hyphens",
    ),
  notes: z.string().optional().default(""),
  is_active: z.boolean().default(true),
  districts: z.array(ArtistDistrictRefSchema).optional().default([]),
  services: z.array(ArtistServiceRefSchema).optional().default([]),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export type Artist = z.infer<typeof ArtistSchema>;

export const ArtistCreateSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z
    .string()
    .min(8, "Phone is required")
    .transform((v) => v.trim()),
  email: z.string().email(),
  username: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(6, "Password must be at least 6 characters"),
  notes: z.string().optional().default(""),
  is_active: z.boolean().optional().default(true),
  district_ids: z.array(z.string().uuid()).optional().default([]),
  service_ids: z.array(z.string().uuid()).optional().default([]),
});

export type ArtistCreate = z.infer<typeof ArtistCreateSchema>;

export const ArtistUpdateSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional(),
  username: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
  district_ids: z.array(z.string().uuid()).optional(),
  service_ids: z.array(z.string().uuid()).optional(),
});

export type ArtistUpdate = z.infer<typeof ArtistUpdateSchema>;

export const validateArtist = (data: unknown): Artist => {
  return ArtistSchema.parse(data);
};

export const validateArtistCreate = (data: unknown): ArtistCreate => {
  return ArtistCreateSchema.parse(data);
};

export const validateArtistUpdate = (data: unknown): ArtistUpdate => {
  return ArtistUpdateSchema.parse(data);
};

import { z } from "zod";

/**
 * Zod Schema for District Validation
 */
export const DistrictSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, "District name must be at least 2 characters")
    .max(100),
  // postcode_prefix: z.string().min(2).max(5),
  is_active: z.boolean().default(true),
  is_coming_soon: z.boolean().default(false),
  // surcharge: z.number().min(0).default(0),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

/**
 * TypeScript Interface (derived from Zod schema)
 */
export type District = z.infer<typeof DistrictSchema>;

/**
 * District Create Input
 */
export const DistrictCreateSchema = DistrictSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type DistrictCreate = z.infer<
  typeof DistrictCreateSchema
>;

/**
 * District Update Input
 */
export const DistrictUpdateSchema =
  DistrictSchema.partial().required({
    id: true,
  });

export type DistrictUpdate = z.infer<
  typeof DistrictUpdateSchema
>;

/**
 * Business Rules
 */
export const DISTRICT_BUSINESS_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_POSTCODE_PREFIX_LENGTH: 2,
  MAX_POSTCODE_PREFIX_LENGTH: 5,
  // MAX_SURCHARGE: 50,
} as const;

/**
 * Helper Functions
 */
export const validateDistrict = (data: unknown): District => {
  return DistrictSchema.parse(data);
};

export const validateDistrictCreate = (
  data: unknown,
): DistrictCreate => {
  return DistrictCreateSchema.parse(data);
};

export const validateDistrictUpdate = (
  data: unknown,
): DistrictUpdate => {
  return DistrictUpdateSchema.parse(data);
};
import { z } from "zod";

/**
 * Zod Schema for District Postcode (service-area prefixes)
 */
export const DistrictPostcodeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, "District name must be at least 2 characters")
    .max(100),
  postcode_prefixes: z.array(z.string().min(2).max(5)).default([]),
  is_active: z.boolean().default(true),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

/**
 * TypeScript Interface (derived from Zod schema)
 */
export type DistrictPostcode = z.infer<typeof DistrictPostcodeSchema>;

/**
 * Helper Functions
 */
export const validateDistrictPostcode = (
  data: unknown,
): DistrictPostcode => {
  return DistrictPostcodeSchema.parse(data);
};

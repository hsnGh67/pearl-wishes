import { z } from "zod";

/**
 * Service Category Enum
 * Defines the main types of services offered
 */
export enum ServiceCategory {
  MANICURE = "manicure",
  EXTENSIONS = "extensions",
  ADD_ON = "add_on",
  PEDICURE = "pedicure",
  FULL_SET = "full_set",
}

/**
 * Service Category Display Names
 */
export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  manicure: "Manicure",
  extensions: "Extensions",
  add_on: "Add-on",
  pedicure: "Pedicure",
  full_set: "Full Set",
};

/**
 * Service Status Enum
 */
export enum ServiceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DRAFT = "draft",
}

/**
 * Zod Schema for Service Validation
 */
export const ServiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, "Service name must be at least 2 characters")
    .max(100),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(500),
  duration: z
    .number()
    .min(5, "Duration must be at least 5 minutes")
    .max(300, "Duration cannot exceed 5 hours"),
  price: z
    .number()
    .min(0, "Price must be positive")
    .max(1000, "Price cannot exceed £1000"),
  category_id: z.string(), // Temporarily accept any string to see what values we're getting
  is_active: z.boolean().default(true),
  is_add_on: z.boolean().default(false).optional(),
  display_order: z.number().int().min(0).optional(),
  image_url: z
    .union([z.string().url(), z.literal("")])
    .nullable()
    .optional()
    .transform((val) => val || ""),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(3, "Service name must be at least 3 characters")
    .max(100),
  is_active: z.boolean().default(true),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

/**
 * TypeScript Interface (derived from Zod schema)
 */
export type Service = z.infer<typeof ServiceSchema>;

export type Category = z.infer<typeof CategorySchema>;

export const CategoryCreateSchema = CategorySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CategoryCreate = z.infer<
  typeof CategoryCreateSchema
>;

export const CategoryUpdateSchema =
  CategorySchema.partial().required({
    id: true,
  });
/**
 * Service Create Input (without auto-generated fields)
 */
export const ServiceCreateSchema = ServiceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ServiceCreate = z.infer<typeof ServiceCreateSchema>;

/**
 * Service Update Input (partial fields)
 */
export const ServiceUpdateSchema =
  ServiceSchema.partial().required({
    id: true,
  });

export type ServiceUpdate = z.infer<typeof ServiceUpdateSchema>;

/**
 * Service Display Model (for UI rendering)
 */
export interface ServiceDisplay extends Service {
  categoryLabel: string;
  statusLabel: string;
  formattedPrice: string;
  formattedDuration: string;
}

/**
 * Business Rules
 */
export const SERVICE_BUSINESS_RULES = {
  MIN_DURATION: 5,
  MAX_DURATION: 300,
  MIN_PRICE: 0,
  MAX_PRICE: 1000,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 5,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

/**
 * Helper Functions
 */
export const formatServiceForDisplay = (
  service: Service,
): ServiceDisplay => ({
  ...service,
  categoryLabel: SERVICE_CATEGORY_LABELS[service.category],
  statusLabel: service.is_active ? "Active" : "Inactive",
  formattedPrice: `£${service.price.toFixed(2)}`,
  formattedDuration: `${service.duration} min`,
});

export const validateCategory = (data: unknown): Category => {
  return CategorySchema.parse(data);
};

export const validateService = (data: unknown): Service => {
  return ServiceSchema.parse(data);
};

export const validateCreateCategory = (
  data: unknown,
): Category => {
  return CategoryCreateSchema.parse(data);
};

export const validateServiceCreate = (
  data: unknown,
): ServiceCreate => {
  return ServiceCreateSchema.parse(data);
};

export const validateServiceUpdate = (
  data: unknown,
): ServiceUpdate => {
  return ServiceUpdateSchema.parse(data);
};
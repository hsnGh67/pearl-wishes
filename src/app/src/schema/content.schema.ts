import { z } from "zod";

/**
 * Content Section Types Enum
 */
export enum ContentSectionType {
  HERO = "hero",
  ABOUT = "about",
  SERVICES = "services",
  TESTIMONIALS = "testimonials",
  INSTAGRAM = "instagram",
  CONTACT = "contact",
  FAQ = "faq",
}

/**
 * Zod Schema for Content Section Validation
 */
export const ContentSectionSchema = z.object({
  id: z.string().uuid().optional(),
  section_name: z.nativeEnum(ContentSectionType),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
  cta_text: z.string().max(50).optional(),
  cta_link: z.string().max(500).optional(),
  content_url: z.string().url().optional().or(z.literal("")),
  content_type: z.string().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

/**
 * TypeScript Interface (derived from Zod schema)
 */
export type ContentSection = z.infer<
  typeof ContentSectionSchema
>;

/**
 * Content Section Create Input
 */
export const ContentSectionCreateSchema =
  ContentSectionSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  });

export type ContentSectionCreate = z.infer<
  typeof ContentSectionCreateSchema
>;

/**
 * Content Section Update Input
 */
export const ContentSectionUpdateSchema =
  ContentSectionSchema.partial().required({
    section_name: true,
  });

export type ContentSectionUpdate = z.infer<
  typeof ContentSectionUpdateSchema
>;

/**
 * Business Rules
 */
export const CONTENT_BUSINESS_RULES = {
  MIN_TITLE_LENGTH: 2,
  MAX_TITLE_LENGTH: 200,
  MAX_SUBTITLE_LENGTH: 300,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_CTA_TEXT_LENGTH: 50,
} as const;

/**
 * Helper Functions
 */
export const validateContentSection = (
  data: unknown,
): ContentSection => {
  return ContentSectionSchema.parse(data);
};

export const validateContentSectionCreate = (
  data: unknown,
): ContentSectionCreate => {
  return ContentSectionCreateSchema.parse(data);
};

export const validateContentSectionUpdate = (
  data: unknown,
): ContentSectionUpdate => {
  return ContentSectionUpdateSchema.parse(data);
};
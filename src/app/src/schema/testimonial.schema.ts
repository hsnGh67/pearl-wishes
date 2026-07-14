import { z } from 'zod';

/**
 * Testimonial Rating Enum
 */
export enum TestimonialRating {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

/**
 * Zod Schema for Testimonial Validation
 */
export const TestimonialSchema = z.object({
  id: z.string().uuid().optional(),
  client_name: z.string().min(2, 'Client name must be at least 2 characters').max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
  service_type: z.string().min(2).max(100),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

/**
 * TypeScript Interface (derived from Zod schema)
 */
export type Testimonial = z.infer<typeof TestimonialSchema>;

/**
 * Testimonial Create Input
 */
export const TestimonialCreateSchema = TestimonialSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type TestimonialCreate = z.infer<typeof TestimonialCreateSchema>;

/**
 * Testimonial Update Input
 */
export const TestimonialUpdateSchema = TestimonialSchema.partial().required({ id: true });

export type TestimonialUpdate = z.infer<typeof TestimonialUpdateSchema>;

/**
 * Testimonial Display Model
 */
export interface TestimonialDisplay extends Testimonial {
  formattedDate: string;
  statusLabel: string;
}

/**
 * Business Rules
 */
export const TESTIMONIAL_BUSINESS_RULES = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_COMMENT_LENGTH: 10,
  MAX_COMMENT_LENGTH: 1000,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
} as const;

/**
 * Helper Functions
 */
export const formatTestimonialForDisplay = (testimonial: Testimonial): TestimonialDisplay => ({
  ...testimonial,
  formattedDate: testimonial.created_at 
    ? new Date(testimonial.created_at).toLocaleDateString('en-GB') 
    : '',
  statusLabel: testimonial.is_published ? 'Published' : 'Draft',
});

export const validateTestimonial = (data: unknown): Testimonial => {
  return TestimonialSchema.parse(data);
};

export const validateTestimonialCreate = (data: unknown): TestimonialCreate => {
  return TestimonialCreateSchema.parse(data);
};

export const validateTestimonialUpdate = (data: unknown): TestimonialUpdate => {
  return TestimonialUpdateSchema.parse(data);
};

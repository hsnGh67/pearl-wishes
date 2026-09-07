import { z } from "zod";

export const ContactMessageSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
  is_read: z.boolean().default(false),
  created_at: z.string().optional(),
});

export const ContactMessageCreateSchema = ContactMessageSchema.omit(
  {
    id: true,
    is_read: true,
    created_at: true,
  },
);

export type ContactMessage = z.infer<typeof ContactMessageSchema>;
export type ContactMessageCreateInput = z.infer<
  typeof ContactMessageCreateSchema
>;

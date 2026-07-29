import { z } from "zod";

/**
 * Note Schema (user_notes table)
 */
export const NoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string(),
  author: z.string().default("Admin"),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export type Note = z.infer<typeof NoteSchema>;

/**
 * User Role Enum
 */
export enum UserRole {
  ADMIN = "admin",
  CLIENT = "client",
  TECHNICIAN = "technician",
}

/**
 * User Role Display Names
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrator",
  [UserRole.CLIENT]: "Client",
  [UserRole.TECHNICIAN]: "Technician",
};

/**
 * Zod Schema for User Validation
 */
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z
    .string()
    .regex(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$|^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)?local$/,
      "Invalid email address",
    )
    .nullable()
    .optional(),
  full_name: z.string().max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number")
    .optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CLIENT),
  address: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .transform((val) => val || ""),
  postcode: z
    .string()
    .max(10)
    .nullable()
    .optional()
    .transform((val) => val || ""),
  district: z
    .string()
    .max(100)
    .nullable()
    .optional()
    .transform((val) => val || ""),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
  notes: z.array(NoteSchema).optional().default([]),
});

/**
 * TypeScript Interface (derived from Zod schema)
 */
export type User = z.infer<typeof UserSchema>;

/**
 * User Create Input
 */
export const UserCreateSchema = UserSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type UserCreate = z.infer<typeof UserCreateSchema>;

/**
 * User Update Input
 */
export const UserUpdateSchema = UserSchema.partial().required({
  id: true,
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

/**
 * User Display Model
 */
export interface UserDisplay extends User {
  roleLabel: string;
  statusLabel: string;
  formattedPhone: string;
}

/**
 * Business Rules
 */
export const USER_BUSINESS_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  EMAIL_REGEX:
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$|^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)?local$/,
  PHONE_REGEX: /^\+?[0-9\s\-()]+$/,
} as const;

/**
 * Helper Functions
 */
export const formatUserForDisplay = (
  user: User,
): UserDisplay => ({
  ...user,
  roleLabel: USER_ROLE_LABELS[user.role],
  statusLabel: "Active", // Default status label
  formattedPhone: user.phone || "N/A",
});

export const validateUser = (data: unknown): User => {
  try {
    const validated = UserSchema.parse(data);
    return validated;
  } catch (error) {
    console.error("❌ User validation failed:", {
      data,
      error,
      issues: (error as any)?.issues,
    });
    throw error;
  }
};

export const validateUserCreate = (
  data: unknown,
): UserCreate => {
  return UserCreateSchema.parse(data);
};

export const validateUserUpdate = (
  data: unknown,
): UserUpdate => {
  return UserUpdateSchema.parse(data);
};
import { ZodError } from 'zod';

/**
 * Validation Error Interface
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation Result Interface
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Convert Zod errors to friendly format
 */
export const formatZodErrors = (error: ZodError): ValidationError[] => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Safe validation wrapper
 */
export const safeValidate = <T>(
  validator: (data: unknown) => T,
  data: unknown
): ValidationResult<T> => {
  try {
    const validatedData = validator(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: formatZodErrors(error),
      };
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }],
    };
  }
};

/**
 * Schema version for database migrations
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Last updated timestamp
 */
export const SCHEMA_LAST_UPDATED = '2026-02-23T00:00:00Z';

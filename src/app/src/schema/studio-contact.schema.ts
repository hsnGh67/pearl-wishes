import { z } from "zod";

/**
 * Zod Schema for studio contact (singleton row)
 */
export const StudioContactSchema = z.object({
  id: z.string().uuid().optional(),
  phone: z.string().max(50),
  email: z.string().max(200),
  address: z.string().max(500),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export type StudioContact = z.infer<typeof StudioContactSchema>;

export const StudioContactCreateSchema = StudioContactSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type StudioContactCreate = z.infer<typeof StudioContactCreateSchema>;

export const StudioContactUpdateSchema = StudioContactSchema.partial().required({
  id: true,
});

export type StudioContactUpdate = z.infer<typeof StudioContactUpdateSchema>;

/**
 * Zod Schema for a business-hours display row
 */
export const BusinessHourSchema = z.object({
  id: z.string().uuid().optional(),
  day: z.string().min(1).max(50),
  time_label: z.string().max(100),
  sort_order: z.number().int().min(0).optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export type BusinessHour = z.infer<typeof BusinessHourSchema>;

export const BusinessHourCreateSchema = BusinessHourSchema.omit({
  created_at: true,
  updated_at: true,
});

export type BusinessHourCreate = z.infer<typeof BusinessHourCreateSchema>;

export interface HourRow {
  id: string;
  day: string;
  time: string;
}

export const DEFAULT_HOUR_ROWS: HourRow[] = [
  { id: "bh1", day: "Monday", time: "9:00 AM – 7:00 PM" },
  { id: "bh2", day: "Tuesday", time: "9:00 AM – 7:00 PM" },
  { id: "bh3", day: "Wednesday", time: "9:00 AM – 7:00 PM" },
  { id: "bh4", day: "Thursday", time: "9:00 AM – 8:00 PM" },
  { id: "bh5", day: "Friday", time: "9:00 AM – 8:00 PM" },
  { id: "bh6", day: "Saturday", time: "10:00 AM – 6:00 PM" },
  { id: "bh7", day: "Sunday", time: "Closed" },
];

export const mapBusinessHourToHourRow = (
  hour: BusinessHour,
): HourRow => ({
  id: hour.id ?? crypto.randomUUID(),
  day: hour.day,
  time: hour.time_label,
});

export const validateStudioContact = (
  data: unknown,
): StudioContact => {
  return StudioContactSchema.parse(data);
};

export const validateStudioContactCreate = (
  data: unknown,
): StudioContactCreate => {
  return StudioContactCreateSchema.parse(data);
};

export const validateStudioContactUpdate = (
  data: unknown,
): StudioContactUpdate => {
  return StudioContactUpdateSchema.parse(data);
};

export const validateBusinessHour = (
  data: unknown,
): BusinessHour => {
  return BusinessHourSchema.parse(data);
};

export const validateBusinessHourCreate = (
  data: unknown,
): BusinessHourCreate => {
  return BusinessHourCreateSchema.parse(data);
};

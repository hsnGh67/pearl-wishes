import { z } from "zod";

const TimeHmSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM");

export const DayStatusSchema = z.enum(["working", "off"]);
export type DayStatus = z.infer<typeof DayStatusSchema>;

export const MonthSubmissionStatusSchema = z.enum([
  "draft",
  "submitted",
]);
export type MonthSubmissionStatus = z.infer<
  typeof MonthSubmissionStatusSchema
>;

export const WeeklyRhythmDaySchema = z.object({
  dow: z.number().int().min(0).max(6),
  is_working: z.boolean(),
  start_time: TimeHmSchema,
  end_time: TimeHmSchema,
});
export type WeeklyRhythmDay = z.infer<typeof WeeklyRhythmDaySchema>;

export const DayOverrideSchema = z.object({
  work_date: z.string(),
  status: DayStatusSchema,
  start_time: TimeHmSchema.nullable().optional(),
  end_time: TimeHmSchema.nullable().optional(),
});
export type DayOverride = z.infer<typeof DayOverrideSchema>;

export const MonthSubmissionSchema = z.object({
  artist_id: z.string().uuid(),
  year_month: z.string(),
  status: MonthSubmissionStatusSchema,
  submitted_at: z.string().nullable().optional(),
});
export type MonthSubmission = z.infer<typeof MonthSubmissionSchema>;

export const ArtistAvailabilityBundleSchema = z.object({
  artist_id: z.string().uuid(),
  year_month: z.string(),
  month: MonthSubmissionSchema,
  /** Global default Mon–Sun template. */
  rhythm: z.array(WeeklyRhythmDaySchema),
  /** Month-scoped weekly override; empty when using defaults. */
  month_rhythm: z.array(WeeklyRhythmDaySchema).optional().default([]),
  has_month_rhythm: z.boolean().optional().default(false),
  overrides: z.array(DayOverrideSchema),
});
export type ArtistAvailabilityBundle = z.infer<
  typeof ArtistAvailabilityBundleSchema
>;

export const validateArtistAvailabilityBundle = (
  data: unknown,
): ArtistAvailabilityBundle => {
  return ArtistAvailabilityBundleSchema.parse(data);
};

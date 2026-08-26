/**
 * Workshop Schema
 * Source of truth for all workshop-related data structures
 */

import { z } from "zod";

export enum WorkshopLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  INTERMEDIATE_TO_ADVANCED = "intermediate_to_advanced",
  ALL_LEVELS = "all_levels",
}

export const WORKSHOP_LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  intermediate_to_advanced: "Intermediate to Advanced",
  all_levels: "All Levels",
};

// ─── Zod runtime schemas ───────────────────────────────────────────────────────

export const WorkshopSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  session_count: z.number().int().min(1, "Session count must be at least 1"),
  session_duration_hours: z.number().min(0),
  level: z.nativeEnum(WorkshopLevel),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  class_type: z.string(),
  highlights: z.array(z.string()),
  price: z.number().min(0).optional(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean(),
  display_order: z.number().int().min(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const WorkshopCreateSchema = WorkshopSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const WorkshopUpdateSchema = WorkshopCreateSchema.partial();

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Workshop = z.infer<typeof WorkshopSchema>;
export type WorkshopCreateInput = z.infer<typeof WorkshopCreateSchema>;
export type WorkshopUpdateInput = z.infer<typeof WorkshopUpdateSchema>;

/** Backward-compat alias — existing code imports WorkshopInput */
export type WorkshopInput = WorkshopCreateInput;

// ─── Display model (UI only — no Zod needed) ──────────────────────────────────

export interface WorkshopDisplay {
  id: string;
  title: string;
  description: string;
  sessionCount: number;
  sessionDurationHours: number;
  level: string;
  levelValue: WorkshopLevel;
  capacity: number;
  classType: string;
  highlights: string[];
  price?: number;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns hours as a compact string: 4 → "4h", 1.5 → "1.5h" */
function fmtHours(minutes: number): string {
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
}

/** "3 sessions × 4h (12 hrs total)" */
export function formatDurationLabel(
  sessionCount: number,
  sessionDurationHours: number,
): string {
  if (!sessionCount || !sessionDurationHours) return "–";
  const perSession = sessionDurationHours;
  const totalH = sessionCount * sessionDurationHours;
  const total = Number.isInteger(totalH) ? `${totalH}` : totalH.toFixed(1);
  const sessWord = sessionCount === 1 ? "session" : "sessions";
  return `${sessionCount} ${sessWord} × ${perSession} (${total} hrs total)`;
}

/** Compact version for tight spaces: "3 sess. × 4h" */
export function formatDurationCompact(
  sessionCount: number,
  sessionDurationHours: number,
): string {
  if (!sessionCount || !sessionDurationHours) return "–";
  const perSession = sessionDurationHours;
  const sessWord = sessionCount === 1 ? "sess." : "sess.";
  return `${sessionCount} ${sessWord} × ${perSession}`;
}

export function formatWorkshopForDisplay(
  workshop: Workshop,
): WorkshopDisplay {
  return {
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    sessionCount: workshop.session_count ?? 1,
    sessionDurationHours: workshop.session_duration_hours ?? 0,
    level: WORKSHOP_LEVEL_LABELS[workshop.level] || workshop.level,
    levelValue: workshop.level,
    capacity: workshop.capacity,
    classType: workshop.class_type,
    highlights: workshop.highlights,
    price: workshop.price,
    image_url: workshop.image_url,
    is_active: workshop.is_active,
    display_order: workshop.display_order,
  };
}

export function formatWorkshopForDatabase(
  input: WorkshopInput,
): Omit<Workshop, "id" | "created_at" | "updated_at"> {
  return {
    title: input.title,
    description: input.description,
    session_count: input.session_count,
    session_duration_hours: input.session_duration_hours,
    capacity: input.capacity,
    level: input.level,
    class_type: input.class_type,
    highlights: input.highlights,
    price: input.price,
    image_url: input.image_url,
    is_active: input.is_active,
    display_order: input.display_order,
  };
}

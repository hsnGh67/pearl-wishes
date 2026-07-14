/**
 * Workshop Schema
 * Source of truth for all workshop-related data structures
 */

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

/**
 * Workshop Database Model
 */
export interface Workshop {
  id: string;
  title: string;
  description: string;
  /** Legacy free-text field — derived from session_count + session_duration_hours on new records */
  session_count: number; // e.g. 3
  session_duration_hours: number; // e.g. 240 (= 4 hours)
  level: WorkshopLevel;
  class_type: string;
  highlights: string[];
  price?: number;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Workshop Display Model (UI)
 */
export interface WorkshopDisplay {
  id: string;
  title: string;
  description: string;
  sessionCount: number;
  sessionDurationHours: number;
  level: string;
  levelValue: WorkshopLevel;
  classType: string;
  highlights: string[];
  price?: number;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

/**
 * Workshop Create/Update Input
 */
export interface WorkshopInput {
  title: string;
  description: string;
  session_count: number;
  session_duration_hours: number;
  level: WorkshopLevel;
  class_type: string;
  highlights: string[];
  price?: number;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

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
  const total = Number.isInteger(totalH)
    ? `${totalH}`
    : totalH.toFixed(1);
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
    level:
      WORKSHOP_LEVEL_LABELS[workshop.level] || workshop.level,
    levelValue: workshop.level,
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
    level: input.level,
    class_type: input.class_type,
    highlights: input.highlights,
    price: input.price,
    image_url: input.image_url,
    is_active: input.is_active,
    display_order: input.display_order,
  };
}
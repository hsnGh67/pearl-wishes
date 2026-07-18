import type { BookedTimeSlot } from "../lib/db/bookings";

/** Buffer applied to both ranges so adjacent slots still conflict (matches BookingFlow). */
export const GAP_MINUTES = 30;

export interface SessionConflictCandidate {
  index: number;
  date: string;
  startsAt: string;
  endsAt: string;
  id?: string;
}

export function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function doesTimeRangeOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

export function durationMinutes(startsAt: string, endsAt: string): number {
  return minutesFromTime(endsAt) - minutesFromTime(startsAt);
}

function normalizeClock(time: string): string {
  if (!time) return "";
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function rangeWithGap(startsAt: string, endsAt: string): {
  start: number;
  end: number;
} {
  const start = minutesFromTime(startsAt);
  const end = minutesFromTime(endsAt) + GAP_MINUTES;
  return { start, end };
}

function occupiedRangeWithGap(slot: BookedTimeSlot): {
  start: number;
  end: number;
} {
  const start = minutesFromTime(slot.appointment_time);
  const end = start + slot.duration + GAP_MINUTES;
  return { start, end };
}

/**
 * Finds invalid ranges, draft-vs-draft overlaps, and draft-vs-occupied overlaps.
 * Returns human-readable conflict messages (empty if none).
 */
export function findSessionConflicts(
  candidates: SessionConflictCandidate[],
  occupiedByDate: Map<string, BookedTimeSlot[]>,
): string[] {
  const conflicts: string[] = [];

  for (const candidate of candidates) {
    if (
      minutesFromTime(candidate.endsAt) <=
      minutesFromTime(candidate.startsAt)
    ) {
      conflicts.push(
        `Session ${candidate.index} (${candidate.date} ${normalizeClock(candidate.startsAt)}–${normalizeClock(candidate.endsAt)}) has an invalid time range.`,
      );
    }
  }

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      if (a.date !== b.date) continue;

      const rangeA = rangeWithGap(a.startsAt, a.endsAt);
      const rangeB = rangeWithGap(b.startsAt, b.endsAt);

      if (
        doesTimeRangeOverlap(
          rangeA.start,
          rangeA.end,
          rangeB.start,
          rangeB.end,
        )
      ) {
        conflicts.push(
          `Session ${a.index} (${a.date} ${normalizeClock(a.startsAt)}–${normalizeClock(a.endsAt)}) overlaps Session ${b.index} (${normalizeClock(b.startsAt)}–${normalizeClock(b.endsAt)}).`,
        );
      }
    }
  }

  for (const candidate of candidates) {
    const slots = occupiedByDate.get(candidate.date) ?? [];
    const range = rangeWithGap(candidate.startsAt, candidate.endsAt);

    for (const slot of slots) {
      const occupied = occupiedRangeWithGap(slot);
      if (
        doesTimeRangeOverlap(
          range.start,
          range.end,
          occupied.start,
          occupied.end,
        )
      ) {
        conflicts.push(
          `Session ${candidate.index} (${candidate.date} ${normalizeClock(candidate.startsAt)}–${normalizeClock(candidate.endsAt)}) overlaps an existing booking or workshop at ${normalizeClock(slot.appointment_time)} (${slot.duration} min).`,
        );
      }
    }
  }

  return conflicts;
}

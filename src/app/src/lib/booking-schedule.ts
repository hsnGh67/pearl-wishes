/**
 * Shared booking schedule helpers for client + admin wizards.
 */

export const GAP_MINUTES = 30;
export const GAP_MINUTES_PER_PEOPLE = 10;
export const GAP_MINUTES_PER_SERVICE = 5;

export type SchedulePreference = "artist" | "date";

/** Resolve district UUID from a loaded districts list by display name. */
export function resolveDistrictIdByName(
  districts: Array<{ id?: string; name: string }>,
  districtName: string,
): string | undefined {
  if (!districtName) return undefined;
  return districts.find((d) => d.name === districtName)?.id;
}

export function resolveActiveBuffer(params: {
  selectedDate?: Date | null;
  bufferMinutes: number;
  previousBufferMinutes: number;
  bufferEffectiveFrom: string | null;
}): number {
  const {
    selectedDate,
    bufferMinutes,
    previousBufferMinutes,
    bufferEffectiveFrom,
  } = params;

  if (!selectedDate || !bufferEffectiveFrom) {
    return bufferMinutes;
  }

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  return dateStr >= bufferEffectiveFrom
    ? bufferMinutes
    : previousBufferMinutes;
}

/** Buffer for date-range queries when no single day is selected yet. */
export function resolveBufferForRange(params: {
  rangeStart: Date;
  bufferMinutes: number;
  previousBufferMinutes: number;
  bufferEffectiveFrom: string | null;
}): number {
  return resolveActiveBuffer({
    selectedDate: params.rangeStart,
    bufferMinutes: params.bufferMinutes,
    previousBufferMinutes: params.previousBufferMinutes,
    bufferEffectiveFrom: params.bufferEffectiveFrom,
  });
}

export function toDateKeySet(dates: Date[]): Set<string> {
  const keys = new Set<string>();
  for (const date of dates) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    keys.add(`${y}-${m}-${d}`);
  }
  return keys;
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);
  return compare < today;
}

export function isDateDisabledByBookableSet(
  date: Date,
  bookableKeys: Set<string> | null,
): boolean {
  if (isPastDate(date)) return true;
  if (!bookableKeys) return true;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return !bookableKeys.has(`${y}-${m}-${d}`);
}

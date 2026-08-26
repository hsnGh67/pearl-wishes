/**
 * sessionStorage helpers for multi-step booking wizard drafts.
 * Survives refresh / soft dialog dismiss; cleared on successful booking.
 */

export const BOOKING_DRAFT_VERSION = 1;

export const BookingDraftKeys = {
  appointment: "pws:booking-draft:appointment",
  workshop: (workshopId: string) =>
    `pws:booking-draft:workshop:${workshopId}`,
  adminCreate: "pws:booking-draft:admin:create",
} as const;

type DateMarker = { __type: "Date"; value: string };

function isDateMarker(value: unknown): value is DateMarker {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as DateMarker).__type === "Date" &&
    typeof (value as DateMarker).value === "string"
  );
}

/** Convert Date instances before JSON.stringify (Date.toJSON bypasses replacers). */
function encodeDates(value: unknown): unknown {
  if (value instanceof Date) {
    return {
      __type: "Date",
      value: value.toISOString(),
    } satisfies DateMarker;
  }
  if (Array.isArray(value)) {
    return value.map(encodeDates);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = encodeDates(child);
    }
    return out;
  }
  return value;
}

function reviver(_key: string, value: unknown): unknown {
  if (isDateMarker(value)) {
    const date = new Date(value.value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return value;
}

export type VersionedDraft<T> = T & { v: number };

export function loadDraft<T extends object>(
  key: string,
): VersionedDraft<T> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw, reviver) as VersionedDraft<T>;
    if (!parsed || parsed.v !== BOOKING_DRAFT_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, data: object): void {
  try {
    const payload = encodeDates({
      ...data,
      v: BOOKING_DRAFT_VERSION,
    });
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota / private-mode errors
  }
}

export function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

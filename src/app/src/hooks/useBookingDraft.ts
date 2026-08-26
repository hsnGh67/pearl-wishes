import { useEffect, useRef, useState } from "react";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  type VersionedDraft,
} from "../lib/booking-draft";

const SAVE_DEBOUNCE_MS = 300;

type UseBookingDraftOptions<T extends object> = {
  /** sessionStorage key */
  storageKey: string;
  /** When false, no hydrate/save (e.g. dialog closed or reschedule mode) */
  enabled: boolean;
  /** Current wizard snapshot to persist */
  snapshot: T;
  /** Apply a loaded draft into component state. Return false to ignore. */
  onHydrate: (draft: VersionedDraft<T>) => boolean;
  /** Skip saving (e.g. terminal success step) */
  shouldPersist?: (snapshot: T) => boolean;
};

/**
 * Hydrates a booking wizard from sessionStorage when enabled becomes true,
 * then debounces saves of `snapshot`. Call `clear()` after successful booking.
 */
export function useBookingDraft<T extends object>({
  storageKey,
  enabled,
  snapshot,
  onHydrate,
  shouldPersist = () => true,
}: UseBookingDraftOptions<T>) {
  const [ready, setReady] = useState(false);
  const onHydrateRef = useRef(onHydrate);
  const shouldPersistRef = useRef(shouldPersist);
  const clearedRef = useRef(false);
  onHydrateRef.current = onHydrate;
  shouldPersistRef.current = shouldPersist;

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    clearedRef.current = false;
    const draft = loadDraft<T>(storageKey);
    if (draft) {
      const applied = onHydrateRef.current(draft);
      if (!applied) {
        clearDraft(storageKey);
      }
    }
    setReady(true);
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !ready) return;
    if (clearedRef.current) return;
    if (!shouldPersistRef.current(snapshot)) return;

    const timer = window.setTimeout(() => {
      if (clearedRef.current) return;
      if (!shouldPersistRef.current(snapshot)) return;
      saveDraft(storageKey, snapshot);
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, ready, snapshot, storageKey]);

  const clear = () => {
    clearedRef.current = true;
    clearDraft(storageKey);
  };

  return { ready, clear };
}

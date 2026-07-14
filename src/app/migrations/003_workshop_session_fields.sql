-- Migration: 003_workshop_session_fields
-- Replaces the free-text `duration` field with structured
-- session_count (int) and session_duration_minutes (int).

-- 1. Add new columns (nullable so existing rows don't fail)
ALTER TABLE workshops
  ADD COLUMN IF NOT EXISTS session_count INTEGER,
  ADD COLUMN IF NOT EXISTS session_duration_minutes INTEGER;

-- 2. Migrate legacy records
--    Rows that have no session_count yet: default to 1 session,
--    and attempt to parse hours from the old `duration` text.
--    Common legacy formats handled:
--      "3 hours" / "2.5 hours"  → minutes = hours * 60
--      "3 sessions · 4 hours each" → session_count=3, minutes=4*60
--      Anything else             → session_count=1, minutes=60 (1h default)
UPDATE workshops
SET
  session_count = CASE
    WHEN duration ~ '(\d+)\s*session'
      THEN (regexp_matches(duration, '(\d+)\s*session'))[1]::integer
    ELSE 1
  END,
  session_duration_minutes = CASE
    WHEN duration ~ '(\d+(?:\.\d+)?)\s*hour'
      THEN round(
             (regexp_matches(duration, '(\d+(?:\.\d+)?)\s*hour'))[1]::numeric * 60
           )::integer
    ELSE 60
  END
WHERE session_count IS NULL;

-- 3. Make the columns NOT NULL with safe defaults
ALTER TABLE workshops
  ALTER COLUMN session_count SET DEFAULT 1,
  ALTER COLUMN session_duration_minutes SET DEFAULT 60,
  ALTER COLUMN session_count SET NOT NULL,
  ALTER COLUMN session_duration_minutes SET NOT NULL;

-- 4. Keep `duration` column for backwards compatibility (now derived/display-only).
--    Refresh it from the new structured fields on existing rows.
UPDATE workshops
SET duration = session_count || ' ' ||
               CASE WHEN session_count = 1 THEN 'session' ELSE 'sessions' END ||
               ' × ' ||
               CASE
                 WHEN session_duration_minutes % 60 = 0
                   THEN (session_duration_minutes / 60)::text || 'h'
                 ELSE round(session_duration_minutes::numeric / 60, 1)::text || 'h'
               END ||
               ' (' ||
               CASE
                 WHEN (session_count * session_duration_minutes) % 60 = 0
                   THEN (session_count * session_duration_minutes / 60)::text
                 ELSE round((session_count * session_duration_minutes)::numeric / 60, 1)::text
               END ||
               ' hrs total)';

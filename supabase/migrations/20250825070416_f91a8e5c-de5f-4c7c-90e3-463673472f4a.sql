
-- Revert to permissive anonymous realtime read access for whiteboard operations

-- 1) Drop the restrictive policy added recently (if present)
DROP POLICY IF EXISTS "Anonymous users can read session whiteboard data" ON public.whiteboard_data;

-- 2) Ensure any prior permissive policy is removed first (idempotency)
DROP POLICY IF EXISTS "Anonymous users can read whiteboard data for realtime" ON public.whiteboard_data;

-- 3) Re-create the permissive policy that allows anonymous realtime reads
--    This restores live updates for anonymous clients but reintroduces
--    the security risk that any anonymous client can subscribe to this table’s events.
CREATE POLICY "Anonymous users can read whiteboard data for realtime"
ON public.whiteboard_data
FOR SELECT
USING (true);


-- 1) Public read function for anonymous students to fetch operations
CREATE OR REPLACE FUNCTION public.public_get_whiteboard_operations(
  p_session_id uuid,
  p_board_id text,
  p_limit int DEFAULT 200
)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  board_id text,
  action_type text,
  object_data jsonb,
  user_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    w.id,
    w.created_at,
    w.board_id,
    w.action_type,
    w.object_data,
    w.user_id
  FROM public.whiteboard_data w
  WHERE w.session_id = p_session_id
    AND w.board_id = p_board_id
  ORDER BY w.created_at ASC
  LIMIT p_limit;
$$;

-- 2) Ensure reliable realtime payloads for updates/inserts
ALTER TABLE public.whiteboard_data REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'whiteboard_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_data;
  END IF;
END $$;

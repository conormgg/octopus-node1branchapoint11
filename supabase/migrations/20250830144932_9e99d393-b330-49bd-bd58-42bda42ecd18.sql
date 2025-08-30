-- Update the public_get_whiteboard_operations function to handle larger operation counts
-- This fixes the issue where recent delete operations are missed due to the 200 operation limit

DROP FUNCTION IF EXISTS public.public_get_whiteboard_operations(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.public_get_whiteboard_operations(
  p_session_id uuid, 
  p_board_id text, 
  p_limit integer DEFAULT 5000  -- Increased from 200 to 5000
)
RETURNS TABLE(
  id uuid, 
  created_at timestamp with time zone, 
  board_id text, 
  action_type text, 
  object_data jsonb, 
  user_id text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  ORDER BY w.created_at ASC  -- Ensure we get operations in chronological order
  LIMIT p_limit;
$function$;
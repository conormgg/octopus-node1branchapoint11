-- Fix ambiguous column reference in public_save_whiteboard_operation
-- Drop and recreate function with void return type to eliminate column ambiguity

DROP FUNCTION IF EXISTS public.public_save_whiteboard_operation(uuid, text, text, jsonb, text);

CREATE OR REPLACE FUNCTION public.public_save_whiteboard_operation(
  p_session_id uuid, 
  p_board_id text, 
  p_action_type text, 
  p_object_data jsonb, 
  p_user_id text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_status text;
  v_object_id text;
BEGIN
  -- Verify session exists and is active
  SELECT s.status INTO v_session_status
  FROM public.sessions s
  WHERE s.id = p_session_id;

  IF v_session_status IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session_status != 'active' THEN
    RAISE EXCEPTION 'Session is not active';
  END IF;

  -- Generate object ID
  v_object_id := p_action_type || '_' || extract(epoch from now())::bigint || '_' || floor(random() * 1000000)::text;

  -- Insert whiteboard operation
  INSERT INTO public.whiteboard_data (
    session_id,
    board_id,
    action_type,
    object_data,
    object_id,
    user_id
  ) VALUES (
    p_session_id,
    p_board_id,
    p_action_type,
    p_object_data,
    v_object_id,
    COALESCE(p_user_id, 'anonymous_student')
  );

  -- Update session activity
  UPDATE public.sessions 
  SET last_activity_at = NOW() 
  WHERE id = p_session_id;
END;
$function$;
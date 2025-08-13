-- Drop the problematic policy that still exposes emails
DROP POLICY IF EXISTS "Students can view session participants with email privacy" ON public.session_participants;

-- Create a security definer function that properly masks emails for students
CREATE OR REPLACE FUNCTION public.get_session_participants_with_privacy(session_uuid uuid)
RETURNS TABLE (
  id bigint,
  session_id uuid,
  student_name text,
  student_email text,
  assigned_board_suffix text,
  joined_at timestamp with time zone,
  last_ping_at timestamp with time zone,
  sync_direction character varying
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.session_id,
    sp.student_name,
    -- Mask email addresses: only show if it's the current user's email or if current user is the teacher
    CASE 
      WHEN sp.student_email = auth.email() THEN sp.student_email
      WHEN EXISTS (
        SELECT 1 FROM public.sessions s 
        WHERE s.id = session_uuid AND s.teacher_id = auth.uid()
      ) THEN sp.student_email
      ELSE NULL
    END as student_email,
    sp.assigned_board_suffix,
    sp.joined_at,
    sp.last_ping_at,
    sp.sync_direction
  FROM public.session_participants sp
  WHERE sp.session_id = session_uuid
    AND (
      -- User is a participant in this session
      sp.student_email = auth.email()
      OR EXISTS (
        SELECT 1 FROM public.session_participants sp2 
        WHERE sp2.session_id = session_uuid AND sp2.student_email = auth.email()
      )
      -- OR user is the teacher
      OR EXISTS (
        SELECT 1 FROM public.sessions s 
        WHERE s.id = session_uuid AND s.teacher_id = auth.uid()
      )
    )
  ORDER BY sp.assigned_board_suffix;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_session_participants_with_privacy TO authenticated;
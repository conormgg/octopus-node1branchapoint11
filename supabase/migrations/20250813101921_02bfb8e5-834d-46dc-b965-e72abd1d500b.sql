-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Participants can view their session" ON public.sessions;

-- Create a security definer function to safely check if user is a participant
CREATE OR REPLACE FUNCTION public.is_session_participant(session_uuid uuid, user_email text)
RETURNS boolean 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.session_participants sp 
    WHERE sp.session_id = session_uuid 
      AND sp.student_email = user_email
  );
$$;

-- Create a new policy using the security definer function to avoid recursion
CREATE POLICY "Participants can view their session via function"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  public.is_session_participant(sessions.id, auth.email())
);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_session_participant TO authenticated;
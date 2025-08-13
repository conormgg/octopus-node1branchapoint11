-- Remove the overly permissive public policy that exposes all sessions
DROP POLICY IF EXISTS "Public can view sessions by URL slug" ON public.sessions;

-- Create a security definer function for safe public session access by URL slug
CREATE OR REPLACE FUNCTION public.get_session_by_slug(slug text)
RETURNS TABLE (
  id uuid,
  title text,
  unique_url_slug text,
  status text,
  created_at timestamp with time zone,
  duration_minutes integer
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT s.id, s.title, s.unique_url_slug, s.status, s.created_at, s.duration_minutes
  FROM public.sessions s
  WHERE s.unique_url_slug = slug
    AND s.status = 'active'
  LIMIT 1;
$$;

-- Create a policy for session participants to view their sessions
CREATE POLICY "Participants can view their session"
ON public.sessions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.session_participants sp 
    WHERE sp.session_id = sessions.id 
      AND sp.student_email = auth.email()
  )
);

-- Grant execute permission on the function to public (for unauthenticated student access)
GRANT EXECUTE ON FUNCTION public.get_session_by_slug TO public, anon;
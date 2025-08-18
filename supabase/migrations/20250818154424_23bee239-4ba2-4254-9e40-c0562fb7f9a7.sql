-- Create a public function to fetch minimal session data by ID for unauthenticated clients
CREATE OR REPLACE FUNCTION public.get_public_session_status(session_uuid uuid)
RETURNS TABLE(created_at timestamptz, duration_minutes integer, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT s.created_at, s.duration_minutes, s.status
  FROM public.sessions s
  WHERE s.id = session_uuid
  LIMIT 1;
$function$;
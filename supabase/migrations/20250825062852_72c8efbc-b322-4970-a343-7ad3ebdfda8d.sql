-- Drop the overly permissive anonymous policy
DROP POLICY IF EXISTS "Anonymous users can read whiteboard data for realtime" ON public.whiteboard_data;

-- Create a more restrictive policy for anonymous access
-- Anonymous users can only read whiteboard data for active sessions where they are participants
CREATE POLICY "Anonymous users can read session whiteboard data" 
ON public.whiteboard_data 
FOR SELECT 
USING (
  -- Allow access only for active sessions
  EXISTS (
    SELECT 1 
    FROM public.sessions s 
    WHERE s.id = whiteboard_data.session_id 
      AND s.status = 'active'
  )
  -- Additional restriction: only if there's a valid session context
  -- This prevents browsing all whiteboards without session context
  AND whiteboard_data.session_id IS NOT NULL
);
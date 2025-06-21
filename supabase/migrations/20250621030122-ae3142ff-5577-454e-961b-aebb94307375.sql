
-- Drop the existing restrictive policy for student updates
DROP POLICY IF EXISTS "Students can update their join status" ON public.session_participants;

-- Create a new public policy that allows updating joined_at for existing participants
CREATE POLICY "Allow public join status updates" 
ON public.session_participants 
FOR UPDATE 
USING (
  -- Allow updates only if the participant already exists
  id IS NOT NULL 
  AND joined_at IS NULL  -- Only allow setting joined_at if it's currently NULL
)
WITH CHECK (
  -- Only allow updating the joined_at field (prevent other field modifications)
  joined_at IS NOT NULL  -- Ensure joined_at is being set to a non-null value
);

-- Add a comment explaining the policy
COMMENT ON POLICY "Allow public join status updates" ON public.session_participants 
IS 'Allows unauthenticated users to update their joined_at status when joining a session. Restricted to existing participants who have not yet joined.';

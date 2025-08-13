-- Remove the overly permissive public update policy
DROP POLICY IF EXISTS "Allow public join status updates" ON public.session_participants;

-- Create a secure policy that only allows authenticated users to update their own participant record
CREATE POLICY "Authenticated participants can update their own join status"
ON public.session_participants
FOR UPDATE
TO authenticated
USING (
  student_email = auth.email() 
  AND joined_at IS NULL
)
WITH CHECK (
  student_email = auth.email() 
  AND joined_at IS NOT NULL
);
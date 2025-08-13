-- Remove the overly permissive public read policy that exposes all student data
DROP POLICY IF EXISTS "Public can view session participants" ON public.session_participants;

-- Create a policy for students to view participants only in sessions they are part of
CREATE POLICY "Students can view participants in their sessions"
ON public.session_participants
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.session_participants sp2 
    WHERE sp2.session_id = session_participants.session_id 
      AND sp2.student_email = auth.email()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.sessions s 
    WHERE s.id = session_participants.session_id 
      AND s.teacher_id = auth.uid()
  )
);
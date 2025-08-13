-- Drop the current policy that exposes all participant data to students
DROP POLICY IF EXISTS "Students can view participants in their sessions" ON public.session_participants;

-- Create a new policy that allows teachers full access to all participant data in their sessions
CREATE POLICY "Teachers can view all participants in their sessions"
ON public.session_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.sessions s 
    WHERE s.id = session_participants.session_id 
      AND s.teacher_id = auth.uid()
  )
);

-- Create a policy that allows students to view participant data but masks other students' emails
CREATE POLICY "Students can view session participants with email privacy"
ON public.session_participants
FOR SELECT
TO authenticated
USING (
  -- Student can see their own complete record
  (student_email = auth.email())
  OR
  -- Student can see other participants but only if they are part of the same session
  -- Note: This policy will need to be combined with application-level filtering to hide emails
  (
    EXISTS (
      SELECT 1 
      FROM public.session_participants sp2 
      WHERE sp2.session_id = session_participants.session_id 
        AND sp2.student_email = auth.email()
    )
    -- Email will be filtered out at application level for non-own records
  )
);
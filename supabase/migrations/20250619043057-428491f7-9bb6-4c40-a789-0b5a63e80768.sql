
-- Enable RLS on session_participants table if not already enabled
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow teachers to view participants in their own sessions
CREATE POLICY "Teachers can view participants in their own sessions" 
ON public.session_participants 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.sessions 
    WHERE sessions.id = session_participants.session_id 
    AND sessions.teacher_id = auth.uid()
  )
);

-- Policy 2: Allow teachers to modify participants in their own sessions
CREATE POLICY "Teachers can modify participants in their own sessions" 
ON public.session_participants 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.sessions 
    WHERE sessions.id = session_participants.session_id 
    AND sessions.teacher_id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.sessions 
    WHERE sessions.id = session_participants.session_id 
    AND sessions.teacher_id = auth.uid()
  )
);

-- Also ensure students can update their own join status when they join a session
CREATE POLICY "Students can update their join status" 
ON public.session_participants 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (joined_at IS NOT NULL);

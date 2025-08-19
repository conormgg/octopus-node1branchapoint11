-- Enable real-time for whiteboard operations and sync direction changes

-- 1. Add RLS policy for anonymous reads on whiteboard_data (needed for real-time streaming)
CREATE POLICY "Anonymous users can read whiteboard data for realtime"
ON public.whiteboard_data
FOR SELECT
USING (true);

-- 2. Enable real-time replication for session_participants table
ALTER TABLE public.session_participants REPLICA IDENTITY FULL;

-- 3. Enable real-time replication for whiteboard_data table (if not already enabled)
ALTER TABLE public.whiteboard_data REPLICA IDENTITY FULL;

-- 4. Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_data;
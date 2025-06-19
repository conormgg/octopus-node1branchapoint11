
-- First, drop the foreign key constraint that's preventing the column type change
ALTER TABLE public.whiteboard_data 
DROP CONSTRAINT IF EXISTS whiteboard_data_user_id_fkey;

-- Now alter the user_id column to be of type TEXT
ALTER TABLE public.whiteboard_data
ALTER COLUMN user_id TYPE TEXT;

-- Add a comment to the column for future reference
COMMENT ON COLUMN public.whiteboard_data.user_id IS 'Identifier for the user or student performing the action. Can be a UUID for authenticated users or a text identifier (e.g., name) for students.';

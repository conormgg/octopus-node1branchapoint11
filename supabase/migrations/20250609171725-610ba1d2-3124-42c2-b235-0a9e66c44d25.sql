
-- First, let's check the current constraint on action_type
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'whiteboard_data'::regclass 
AND contype = 'c';

-- Add 'transform_objects' to the allowed action types
ALTER TABLE whiteboard_data 
DROP CONSTRAINT IF EXISTS whiteboard_data_action_type_check;

ALTER TABLE whiteboard_data 
ADD CONSTRAINT whiteboard_data_action_type_check 
CHECK (action_type IN ('draw', 'erase', 'add_image', 'update_image', 'delete_image', 'update_line', 'transform_objects', 'delete_objects'));


-- Add last_ping_at column to track student heartbeat
ALTER TABLE session_participants 
ADD COLUMN last_ping_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_session_participants_last_ping 
ON session_participants(session_id, last_ping_at) 
WHERE joined_at IS NOT NULL;

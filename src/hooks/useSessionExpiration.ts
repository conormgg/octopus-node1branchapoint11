import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

interface SessionExpirationProps {
  sessionId: string;
  onSessionExpired?: () => void;
}

interface SessionExpirationResult {
  isExpired: boolean;
  expiresAt: Date | null;
  timeRemaining: number | null; // in milliseconds
}

export const useSessionExpiration = ({
  sessionId,
  onSessionExpired
}: SessionExpirationProps): SessionExpirationResult => {
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { clearWhiteboardState } = useWhiteboardStateContext();

  // Function to check if session has expired
  const checkSessionExpiration = useCallback(async () => {
    try {
      // Fetch session details
      const { data, error } = await supabase
        .from('sessions')
        .select('created_at, duration_minutes, status')
        .eq('id', sessionId)
        .single();

      if (error) {
        throw new Error(`Error fetching session: ${error.message}`);
      }

      if (data.status !== 'active') {
        setIsExpired(true);
        setExpiresAt(null);
        setTimeRemaining(0);
        if (onSessionExpired) onSessionExpired();
        return;
      }

      // Calculate expiration time
      const createdAt = new Date(data.created_at);
      const durationMs = (data.duration_minutes + 10) * 60 * 1000; // Add 10 minutes buffer
      const expirationTime = new Date(createdAt.getTime() + durationMs);
      
      setExpiresAt(expirationTime);
      
      // Check if session has expired
      const now = new Date();
      const remaining = expirationTime.getTime() - now.getTime();
      setTimeRemaining(remaining > 0 ? remaining : 0);
      
      if (remaining <= 0) {
        setIsExpired(true);
        if (onSessionExpired) onSessionExpired();
        
        // Update session status to 'expired'
        await supabase
          .from('sessions')
          .update({ status: 'expired' })
          .eq('id', sessionId);
          
        // Clear whiteboard state from memory for all boards related to this session
        // This ensures that if the user refreshes, they won't see the old data
        const { data: whiteboardData } = await supabase
          .from('whiteboard_data')
          .select('board_id')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
          
        if (whiteboardData) {
          // Get unique board IDs
          const boardIds = [...new Set(whiteboardData.map(item => item.board_id))];
          
          // Clear each board from memory
          boardIds.forEach(boardId => {
            clearWhiteboardState(boardId);
          });
        }
      } else {
        setIsExpired(false);
      }
    } catch (err) {
      console.error('Error checking session expiration:', err);
    }
  }, [sessionId, onSessionExpired]);

  // Check session expiration on mount and every minute
  useEffect(() => {
    if (!sessionId) return;

    // Initial check
    checkSessionExpiration();

    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkSessionExpiration();
    }, 60000); // Check every minute

    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId, checkSessionExpiration]);

  return {
    isExpired,
    expiresAt,
    timeRemaining
  };
};

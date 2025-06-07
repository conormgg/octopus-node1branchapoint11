
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

interface SessionExpirationContextType {
  isExpired: boolean;
  expiresAt: Date | null;
  timeRemaining: number | null;
  sessionEndReason: 'expired' | 'ended_by_teacher' | null;
}

const SessionExpirationContext = createContext<SessionExpirationContextType | undefined>(undefined);

interface SessionExpirationProviderProps {
  children: React.ReactNode;
  sessionId: string | null;
  onSessionExpired?: () => void;
}

export const SessionExpirationProvider: React.FC<SessionExpirationProviderProps> = ({
  children,
  sessionId,
  onSessionExpired
}) => {
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [sessionEndReason, setSessionEndReason] = useState<'expired' | 'ended_by_teacher' | null>(null);
  const [hasShownExpiredToast, setHasShownExpiredToast] = useState(false);
  const { toast } = useToast();
  const { clearWhiteboardState } = useWhiteboardStateContext();

  const checkSessionExpiration = useCallback(async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('created_at, duration_minutes, status')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error(`Error fetching session: ${error.message}`);
        return;
      }

      // Handle different session statuses
      if (data.status === 'ended_by_teacher') {
        setIsExpired(true);
        setExpiresAt(null);
        setTimeRemaining(0);
        setSessionEndReason('ended_by_teacher');
        // Don't show toast for teacher-ended sessions
        if (onSessionExpired) onSessionExpired();
        return;
      }

      if (data.status === 'expired') {
        setIsExpired(true);
        setExpiresAt(null);
        setTimeRemaining(0);
        setSessionEndReason('expired');
        
        // Only show toast once for expired sessions
        if (!hasShownExpiredToast) {
          setHasShownExpiredToast(true);
          toast({
            title: "Session Expired",
            description: "This session has expired. Your whiteboard data will no longer be saved.",
            variant: "destructive",
          });
        }
        
        if (onSessionExpired) onSessionExpired();
        return;
      }

      if (data.status !== 'active') {
        setIsExpired(true);
        setExpiresAt(null);
        setTimeRemaining(0);
        if (onSessionExpired) onSessionExpired();
        return;
      }

      // Calculate expiration time for active sessions
      const createdAt = new Date(data.created_at);
      const durationMs = (data.duration_minutes + 10) * 60 * 1000; // Add 10 minutes buffer
      const expirationTime = new Date(createdAt.getTime() + durationMs);
      
      setExpiresAt(expirationTime);
      
      const now = new Date();
      const remaining = expirationTime.getTime() - now.getTime();
      setTimeRemaining(remaining > 0 ? remaining : 0);
      
      if (remaining <= 0) {
        setIsExpired(true);
        setSessionEndReason('expired');
        
        // Only show toast once for natural expiration
        if (!hasShownExpiredToast) {
          setHasShownExpiredToast(true);
          toast({
            title: "Session Expired",
            description: "This session has expired. Your whiteboard data will no longer be saved.",
            variant: "destructive",
          });
        }
        
        if (onSessionExpired) onSessionExpired();
        
        // Update session status to 'expired'
        await supabase
          .from('sessions')
          .update({ status: 'expired' })
          .eq('id', sessionId);
          
        // Clear whiteboard state from memory
        const { data: whiteboardData } = await supabase
          .from('whiteboard_data')
          .select('board_id')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
          
        if (whiteboardData) {
          const boardIds = [...new Set(whiteboardData.map(item => item.board_id))];
          boardIds.forEach(boardId => {
            clearWhiteboardState(boardId);
          });
        }
      } else {
        setIsExpired(false);
        setSessionEndReason(null);
      }
    } catch (err) {
      console.error('Error checking session expiration:', err);
    }
  }, [sessionId, onSessionExpired, toast, clearWhiteboardState, hasShownExpiredToast]);

  useEffect(() => {
    if (!sessionId) return;

    // Reset state when sessionId changes
    setHasShownExpiredToast(false);
    setIsExpired(false);
    setSessionEndReason(null);

    // Initial check
    checkSessionExpiration();

    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkSessionExpiration();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId, checkSessionExpiration]);

  const contextValue: SessionExpirationContextType = {
    isExpired,
    expiresAt,
    timeRemaining,
    sessionEndReason
  };

  return (
    <SessionExpirationContext.Provider value={contextValue}>
      {children}
    </SessionExpirationContext.Provider>
  );
};

export const useSessionExpirationContext = () => {
  const context = useContext(SessionExpirationContext);
  if (context === undefined) {
    throw new Error('useSessionExpirationContext must be used within a SessionExpirationProvider');
  }
  return context;
};

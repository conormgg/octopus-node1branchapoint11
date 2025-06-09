
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { useSessionStatusChecker } from './useSessionStatusChecker';
import { supabase } from '@/integrations/supabase/client';

interface UseSessionExpirationProps {
  sessionId: string | null;
  onSessionExpired?: () => void;
}

export const useSessionExpiration = ({ sessionId, onSessionExpired }: UseSessionExpirationProps) => {
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [sessionEndReason, setSessionEndReason] = useState<'expired' | 'ended_by_teacher' | null>(null);
  const [hasShownToast, setHasShownToast] = useState(false);
  const [lastKnownStatus, setLastKnownStatus] = useState<string | null>(null);
  const [hasProcessedEndState, setHasProcessedEndState] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [toastShownForSession, setToastShownForSession] = useState<string | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [sessionData, setSessionData] = useState<any>(null);
  
  const { toast } = useToast();
  const { clearWhiteboardState } = useWhiteboardStateContext();
  const { fetchSessionData, updateSessionToExpired } = useSessionStatusChecker();

  const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes of idle time
  const SESSION_BUFFER_MS = 10 * 60 * 1000; // 10 minutes buffer after session duration

  // Track user activity to reset idle timer
  const updateActivity = useCallback(() => {
    setLastActivityTime(new Date());
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity]);

  const clearWhiteboardData = useCallback(async (sessionId: string) => {
    try {
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
    } catch (err) {
      console.error('Error clearing whiteboard data:', err);
    }
  }, [clearWhiteboardState]);

  const showExpirationToast = useCallback((reason: 'expired' | 'ended_by_teacher', sessionId: string) => {
    if (!hasShownToast && toastShownForSession !== sessionId) {
      setHasShownToast(true);
      setToastShownForSession(sessionId);
      
      const message = reason === 'ended_by_teacher'
        ? "This session has been ended by the teacher. You will be redirected to the home page."
        : "This session has expired due to inactivity. You will be redirected to the home page.";
      
      toast({
        title: reason === 'ended_by_teacher' ? "Session Ended" : "Session Expired",
        description: message,
        variant: "destructive",
      });
    }
  }, [hasShownToast, toastShownForSession, toast]);

  const handleSessionEnd = useCallback(async (reason: 'expired' | 'ended_by_teacher', sessionId: string) => {
    if (hasProcessedEndState) return;

    setIsExpired(true);
    setExpiresAt(null);
    setTimeRemaining(0);
    setSessionEndReason(reason);
    setHasProcessedEndState(true);
    setIsRedirecting(true);
    
    showExpirationToast(reason, sessionId);
    
    if (onSessionExpired) onSessionExpired();
    
    if (reason === 'expired') {
      await updateSessionToExpired(sessionId);
    }
    
    await clearWhiteboardData(sessionId);
  }, [hasProcessedEndState, showExpirationToast, onSessionExpired, updateSessionToExpired, clearWhiteboardData]);

  const checkSessionExpiration = useCallback(async () => {
    if (!sessionId) return;

    const data = await fetchSessionData(sessionId);
    if (!data) return;

    // Store session data for calculations
    setSessionData(data);

    // If we've already processed an end state or we're in the process of redirecting, don't process again
    if ((hasProcessedEndState && (data.status === 'ended_by_teacher' || data.status === 'expired')) || isRedirecting) {
      return;
    }

    // Handle different session statuses
    if (data.status === 'ended_by_teacher') {
      await handleSessionEnd('ended_by_teacher', sessionId);
      setLastKnownStatus(data.status);
      return;
    }

    if (data.status === 'expired') {
      await handleSessionEnd('expired', sessionId);
      setLastKnownStatus(data.status);
      return;
    }

    if (data.status !== 'active') {
      if (!hasProcessedEndState) {
        setIsExpired(true);
        setExpiresAt(null);
        setTimeRemaining(0);
        setHasProcessedEndState(true);
        setIsRedirecting(true);
        if (onSessionExpired) onSessionExpired();
      }
      setLastKnownStatus(data.status);
      return;
    }

    // Update last known status
    setLastKnownStatus(data.status);

    // Calculate session limits
    const createdAt = new Date(data.created_at);
    const sessionDurationMs = data.duration_minutes * 60 * 1000;
    const maxSessionTime = new Date(createdAt.getTime() + sessionDurationMs + SESSION_BUFFER_MS);
    
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - lastActivityTime.getTime();
    const timeUntilMaxSession = maxSessionTime.getTime() - now.getTime();
    
    // Check if session should expire due to idle time OR max session time
    const shouldExpireIdle = timeSinceLastActivity >= IDLE_TIMEOUT_MS;
    const shouldExpireMaxTime = timeUntilMaxSession <= 0;
    
    if ((shouldExpireIdle || shouldExpireMaxTime) && !hasProcessedEndState) {
      console.log('Session expiring:', { 
        shouldExpireIdle, 
        shouldExpireMaxTime, 
        timeSinceLastActivity: timeSinceLastActivity / 1000 / 60,
        timeUntilMaxSession: timeUntilMaxSession / 1000 / 60 
      });
      await handleSessionEnd('expired', sessionId);
    } else {
      // Update expiration time based on the earliest expiry condition
      const idleExpiryTime = new Date(lastActivityTime.getTime() + IDLE_TIMEOUT_MS);
      const earliestExpiry = idleExpiryTime < maxSessionTime ? idleExpiryTime : maxSessionTime;
      
      setExpiresAt(earliestExpiry);
      setIsExpired(false);
      setSessionEndReason(null);
      
      const remaining = earliestExpiry.getTime() - now.getTime();
      setTimeRemaining(remaining > 0 ? remaining : 0);
    }
  }, [sessionId, fetchSessionData, hasProcessedEndState, isRedirecting, handleSessionEnd, onSessionExpired, lastActivityTime]);

  // Reset state when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    setHasShownToast(false);
    setIsExpired(false);
    setSessionEndReason(null);
    setLastKnownStatus(null);
    setHasProcessedEndState(false);
    setIsRedirecting(false);
    setToastShownForSession(null);
    setLastActivityTime(new Date());
    setSessionData(null);
  }, [sessionId]);

  // Set up session checking interval
  useEffect(() => {
    if (!sessionId) return;

    // Initial check
    checkSessionExpiration();

    // Set up interval to check every 30 seconds (less frequent since we're tracking activity)
    const intervalId = setInterval(() => {
      checkSessionExpiration();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId, checkSessionExpiration]);

  return {
    isExpired,
    expiresAt,
    timeRemaining,
    sessionEndReason,
    isRedirecting,
  };
};

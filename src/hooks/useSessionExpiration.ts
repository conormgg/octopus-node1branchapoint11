
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
  
  const { toast } = useToast();
  const { clearWhiteboardState } = useWhiteboardStateContext();
  const { fetchSessionData, updateSessionToExpired } = useSessionStatusChecker();

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
        : "This session has expired. Your whiteboard data will no longer be saved. You will be redirected to the home page.";
      
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

    // Calculate expiration time for active sessions
    const createdAt = new Date(data.created_at);
    const durationMs = (data.duration_minutes + 10) * 60 * 1000; // Add 10 minutes buffer
    const expirationTime = new Date(createdAt.getTime() + durationMs);
    
    setExpiresAt(expirationTime);
    
    const now = new Date();
    const remaining = expirationTime.getTime() - now.getTime();
    setTimeRemaining(remaining > 0 ? remaining : 0);
    
    if (remaining <= 0 && !hasProcessedEndState) {
      await handleSessionEnd('expired', sessionId);
    } else {
      setIsExpired(false);
      setSessionEndReason(null);
    }
  }, [sessionId, fetchSessionData, hasProcessedEndState, isRedirecting, handleSessionEnd, onSessionExpired]);

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
  }, [sessionId]);

  // Set up session checking interval
  useEffect(() => {
    if (!sessionId) return;

    // Initial check
    checkSessionExpiration();

    // Set up interval to check every 5 seconds for faster detection
    const intervalId = setInterval(() => {
      checkSessionExpiration();
    }, 5000);

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

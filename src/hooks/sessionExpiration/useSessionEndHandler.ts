
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSessionStatusChecker } from '@/hooks/useSessionStatusChecker';
import { useWhiteboardCleanup } from './useWhiteboardCleanup';

interface UseSessionEndHandlerProps {
  hasProcessedEndState: boolean;
  hasShownToast: boolean;
  toastShownForSession: string | null;
  onSessionExpired?: () => void;
  setIsExpired: (value: boolean) => void;
  setExpiresAt: (value: Date | null) => void;
  setTimeRemaining: (value: number | null) => void;
  setSessionEndReason: (value: 'expired' | 'ended_by_teacher' | null) => void;
  setHasProcessedEndState: (value: boolean) => void;
  setIsRedirecting: (value: boolean) => void;
  setHasShownToast: (value: boolean) => void;
  setToastShownForSession: (value: string | null) => void;
}

export const useSessionEndHandler = ({
  hasProcessedEndState,
  hasShownToast,
  toastShownForSession,
  onSessionExpired,
  setIsExpired,
  setExpiresAt,
  setTimeRemaining,
  setSessionEndReason,
  setHasProcessedEndState,
  setIsRedirecting,
  setHasShownToast,
  setToastShownForSession,
}: UseSessionEndHandlerProps) => {
  const { toast } = useToast();
  const { updateSessionToExpired } = useSessionStatusChecker();
  const { clearWhiteboardData } = useWhiteboardCleanup();

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
  }, [hasShownToast, toastShownForSession, toast, setHasShownToast, setToastShownForSession]);

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
  }, [
    hasProcessedEndState,
    showExpirationToast,
    onSessionExpired,
    updateSessionToExpired,
    clearWhiteboardData,
    setIsExpired,
    setExpiresAt,
    setTimeRemaining,
    setSessionEndReason,
    setHasProcessedEndState,
    setIsRedirecting,
  ]);

  return {
    handleSessionEnd,
    showExpirationToast,
  };
};


import { useState, useEffect, useCallback } from 'react';
import { UseSessionExpirationProps, SessionExpirationReturn, SessionExpirationState } from './types';
import { useActivityTracker } from './useActivityTracker';
import { useSessionEndHandler } from './useSessionEndHandler';
import { useSessionChecker } from './useSessionChecker';

export const useSessionExpiration = ({ sessionId, onSessionExpired }: UseSessionExpirationProps): SessionExpirationReturn => {
  const [state, setState] = useState<SessionExpirationState>({
    isExpired: false,
    expiresAt: null,
    timeRemaining: null,
    sessionEndReason: null,
    hasShownToast: false,
    lastKnownStatus: null,
    hasProcessedEndState: false,
    isRedirecting: false,
    toastShownForSession: null,
    sessionData: null,
  });

  const { lastActivityTime, resetActivity } = useActivityTracker();

  const updateState = useCallback((updates: Partial<SessionExpirationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const { handleSessionEnd } = useSessionEndHandler({
    hasProcessedEndState: state.hasProcessedEndState,
    hasShownToast: state.hasShownToast,
    toastShownForSession: state.toastShownForSession,
    onSessionExpired,
    setIsExpired: (value) => updateState({ isExpired: value }),
    setExpiresAt: (value) => updateState({ expiresAt: value }),
    setTimeRemaining: (value) => updateState({ timeRemaining: value }),
    setSessionEndReason: (value) => updateState({ sessionEndReason: value }),
    setHasProcessedEndState: (value) => updateState({ hasProcessedEndState: value }),
    setIsRedirecting: (value) => updateState({ isRedirecting: value }),
    setHasShownToast: (value) => updateState({ hasShownToast: value }),
    setToastShownForSession: (value) => updateState({ toastShownForSession: value }),
  });

  const { checkSessionExpiration } = useSessionChecker({
    sessionId,
    lastActivityTime,
    state,
    setState: updateState,
    handleSessionEnd,
    onSessionExpired,
  });

  // Reset state when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      // Clear all state when no session
      setState({
        hasShownToast: false,
        isExpired: false,
        sessionEndReason: null,
        lastKnownStatus: null,
        hasProcessedEndState: false,
        isRedirecting: false,
        toastShownForSession: null,
        sessionData: null,
        expiresAt: null,
        timeRemaining: null,
      });
      return;
    }

    // Reset state for new session
    setState({
      hasShownToast: false,
      isExpired: false,
      sessionEndReason: null,
      lastKnownStatus: null,
      hasProcessedEndState: false,
      isRedirecting: false,
      toastShownForSession: null,
      sessionData: null,
      expiresAt: null,
      timeRemaining: null,
    });
    resetActivity();
  }, [sessionId, resetActivity]);

  // Set up session checking interval
  useEffect(() => {
    if (!sessionId) return;

    // Initial check after a short delay to allow state to settle
    const initialCheckTimeout = setTimeout(() => {
      checkSessionExpiration();
    }, 1000);

    // Set up interval to check every 30 seconds
    const intervalId = setInterval(() => {
      checkSessionExpiration();
    }, 30000);

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, [sessionId, checkSessionExpiration]);

  return {
    isExpired: state.isExpired,
    expiresAt: state.expiresAt,
    timeRemaining: state.timeRemaining,
    sessionEndReason: state.sessionEndReason,
    isRedirecting: state.isRedirecting,
  };
};

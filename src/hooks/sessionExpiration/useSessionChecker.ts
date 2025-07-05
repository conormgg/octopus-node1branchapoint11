
import { useCallback } from 'react';
import { useSessionStatusChecker } from '@/hooks/useSessionStatusChecker';
import { SessionExpirationState } from './types';

interface UseSessionCheckerProps {
  sessionId: string | null;
  lastActivityTime: Date;
  state: SessionExpirationState;
  setState: (updates: Partial<SessionExpirationState>) => void;
  handleSessionEnd: (reason: 'expired' | 'ended_by_teacher', sessionId: string) => Promise<void>;
  onSessionExpired?: () => void;
}

export const useSessionChecker = ({
  sessionId,
  lastActivityTime,
  state,
  setState,
  handleSessionEnd,
  onSessionExpired,
}: UseSessionCheckerProps) => {
  const { fetchSessionData } = useSessionStatusChecker();

  const IDLE_TIMEOUT_MS = 40 * 60 * 1000; // 40 minutes of idle time
  const SESSION_BUFFER_MS = 10 * 60 * 1000; // 10 minutes buffer after session duration

  const checkSessionExpiration = useCallback(async () => {
    if (!sessionId) return;

    const data = await fetchSessionData(sessionId);
    if (!data) return;

    // Store session data for calculations
    setState({ sessionData: data });

    // If we've already processed an end state or we're in the process of redirecting, don't process again
    if ((state.hasProcessedEndState && (data.status === 'ended_by_teacher' || data.status === 'expired')) || state.isRedirecting) {
      return;
    }

    // Handle different session statuses
    if (data.status === 'ended_by_teacher') {
      await handleSessionEnd('ended_by_teacher', sessionId);
      setState({ lastKnownStatus: data.status });
      return;
    }

    if (data.status === 'expired') {
      await handleSessionEnd('expired', sessionId);
      setState({ lastKnownStatus: data.status });
      return;
    }

    if (data.status !== 'active') {
      if (!state.hasProcessedEndState) {
        setState({
          isExpired: true,
          expiresAt: null,
          timeRemaining: 0,
          hasProcessedEndState: true,
          isRedirecting: true,
        });
        if (onSessionExpired) onSessionExpired();
      }
      setState({ lastKnownStatus: data.status });
      return;
    }

    // Update last known status
    setState({ lastKnownStatus: data.status });

    // Only check expiration if session has a duration set
    if (!data.duration_minutes) {
      // Session has no duration limit, so it won't expire
      setState({
        expiresAt: null,
        isExpired: false,
        sessionEndReason: null,
        timeRemaining: null,
      });
      return;
    }

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
    
    if ((shouldExpireIdle || shouldExpireMaxTime) && !state.hasProcessedEndState) {
      console.log('Session expiring:', { 
        shouldExpireIdle, 
        shouldExpireMaxTime, 
        timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000 / 60 * 100) / 100,
        timeUntilMaxSession: Math.round(timeUntilMaxSession / 1000 / 60 * 100) / 100 
      });
      await handleSessionEnd('expired', sessionId);
    } else {
      // Update expiration time based on the earliest expiry condition
      const idleExpiryTime = new Date(lastActivityTime.getTime() + IDLE_TIMEOUT_MS);
      const earliestExpiry = idleExpiryTime < maxSessionTime ? idleExpiryTime : maxSessionTime;
      
      setState({
        expiresAt: earliestExpiry,
        isExpired: false,
        sessionEndReason: null,
      });
      
      const remaining = earliestExpiry.getTime() - now.getTime();
      setState({ timeRemaining: remaining > 0 ? remaining : 0 });
    }
  }, [sessionId, fetchSessionData, state, setState, handleSessionEnd, onSessionExpired, lastActivityTime]);

  return {
    checkSessionExpiration,
  };
};


import { useEffect, useRef } from 'react';
import { useSessionState } from '@/hooks/session/useSessionState';
import { useSessionCrud } from '@/hooks/session/useSessionCrud';
import { useSessionCleanup } from '@/hooks/session/useSessionCleanup';

export const useSessionManagement = (user: any) => {
  // Add timeout mechanism to prevent hanging
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    activeSession,
    setActiveSession,
    recentSessions,
    setRecentSessions,
    showUrlModal,
    setShowUrlModal,
    endingSession,
    setEndingSession,
    handleCloseUrlModal,
    resumeSession,
  } = useSessionState();

  const { fetchRecentSessions: fetchSessions, fetchSessionById } = useSessionCrud(user);
  const { endSessionAndCleanup } = useSessionCleanup();

  const fetchRecentSessions = async () => {
    try {
      console.log('[SessionManagement] Starting to fetch recent sessions');
      const sessions = await fetchSessions();
      console.log('[SessionManagement] Fetched sessions:', sessions?.length || 0);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('[SessionManagement] Failed to fetch recent sessions:', error);
      setRecentSessions([]);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('[SessionManagement] User detected, fetching recent sessions');
      
      // Clear any existing timeout
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      
      // Set timeout to prevent hanging during initialization
      initializationTimeoutRef.current = setTimeout(() => {
        console.error('[SessionManagement] Session initialization timeout - forcing continuation');
      }, 10000); // 10 second timeout
      
      fetchRecentSessions().finally(() => {
        if (initializationTimeoutRef.current) {
          clearTimeout(initializationTimeoutRef.current);
          initializationTimeoutRef.current = null;
        }
      });
    }
    
    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
    };
  }, [user]);

  const handleSessionCreated = async (sessionId: string) => {
    try {
      console.log('[SessionManagement] Session created, fetching details:', sessionId);
      const session = await fetchSessionById(sessionId);
      if (session) {
        console.log('[SessionManagement] Setting active session:', session.id);
        setActiveSession(session);
        setShowUrlModal(true);
        await fetchRecentSessions();
      } else {
        console.error('[SessionManagement] Failed to fetch created session');
      }
    } catch (error) {
      console.error('[SessionManagement] Failed to handle session creation:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      console.log('[SessionManagement] Ending session');
      await endSessionAndCleanup(
        activeSession,
        endingSession,
        setEndingSession,
        setActiveSession,
        fetchRecentSessions
      );
      console.log('[SessionManagement] Session ended successfully');
    } catch (error) {
      console.error('[SessionManagement] Failed to end session:', error);
    }
  };

  return {
    activeSession,
    recentSessions,
    showUrlModal,
    handleSessionCreated,
    handleEndSession,
    resumeSession,
    handleCloseUrlModal,
  };
};

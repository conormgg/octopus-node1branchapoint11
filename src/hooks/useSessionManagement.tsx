
import { useEffect } from 'react';
import { useSessionState } from '@/hooks/session/useSessionState';
import { useSessionCrud } from '@/hooks/session/useSessionCrud';
import { useSessionCleanup } from '@/hooks/session/useSessionCleanup';

export const useSessionManagement = (user: any) => {
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
    const sessions = await fetchSessions();
    setRecentSessions(sessions);
  };

  useEffect(() => {
    if (user) {
      fetchRecentSessions();
    }
  }, [user]);

  const handleSessionCreated = async (sessionId: string) => {
    const session = await fetchSessionById(sessionId);
    if (session) {
      setActiveSession(session);
      setShowUrlModal(true);
      fetchRecentSessions();
    }
  };

  const handleEndSession = async () => {
    await endSessionAndCleanup(
      activeSession,
      endingSession,
      setEndingSession,
      setActiveSession,
      fetchRecentSessions
    );
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

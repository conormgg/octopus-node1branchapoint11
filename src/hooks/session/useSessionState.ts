
import { useState } from 'react';
import { Session } from '@/types/session';

export const useSessionState = () => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  const handleCloseUrlModal = () => {
    setShowUrlModal(false);
  };

  const resumeSession = (session: Session) => {
    if (session.status === 'active') {
      setActiveSession(session);
    }
  };

  return {
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
  };
};

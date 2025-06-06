
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/useAuth';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useSessionStudents } from '@/hooks/useSessionStudents';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
}

interface SessionStudent {
  id: number;
  student_name: string;
  student_email?: string;
  assigned_board_suffix: string;
}

interface UnifiedSessionContextType {
  // Session identifiers
  sessionId: string;
  userId: string;
  
  // Authentication
  user: any;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  signOut: () => Promise<void>;
  
  // Active session management
  activeSession: Session | null;
  sessionStudents: SessionStudent[];
  recentSessions: Session[];
  showUrlModal: boolean;
  
  // Session actions
  generateNewSession: () => void;
  handleSessionCreated: (sessionId: string) => Promise<void>;
  handleEndSession: () => Promise<void>;
  resumeSession: (session: Session) => void;
  handleCloseUrlModal: () => void;
  handleStudentCountChange: (count: number) => void;
}

const UnifiedSessionContext = createContext<UnifiedSessionContextType | undefined>(undefined);

export const UnifiedSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Basic session identifiers
  const [sessionId, setSessionId] = useState<string>(() => {
    const existing = localStorage.getItem('whiteboard-session-id');
    return existing || uuidv4();
  });

  const [userId, setUserId] = useState<string>(() => {
    const existing = localStorage.getItem('whiteboard-user-id');
    return existing || uuidv4();
  });

  // Authentication
  const { user, isAuthenticated, isDemoMode, signOut } = useAuth();

  // Session management
  const {
    activeSession,
    recentSessions,
    showUrlModal,
    handleSessionCreated,
    handleEndSession,
    resumeSession,
    handleCloseUrlModal,
  } = useSessionManagement(user, isDemoMode);

  // Student management
  const {
    sessionStudents,
    handleStudentCountChange,
  } = useSessionStudents(activeSession);

  // Persist session and user IDs
  useEffect(() => {
    localStorage.setItem('whiteboard-session-id', sessionId);
    localStorage.setItem('whiteboard-user-id', userId);
  }, [sessionId, userId]);

  const generateNewSession = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem('whiteboard-session-id', newSessionId);
  };

  return (
    <UnifiedSessionContext.Provider value={{
      sessionId,
      userId,
      user,
      isAuthenticated,
      isDemoMode,
      signOut,
      activeSession,
      sessionStudents,
      recentSessions,
      showUrlModal,
      generateNewSession,
      handleSessionCreated,
      handleEndSession,
      resumeSession,
      handleCloseUrlModal,
      handleStudentCountChange,
    }}>
      {children}
    </UnifiedSessionContext.Provider>
  );
};

export const useUnifiedSession = () => {
  const context = useContext(UnifiedSessionContext);
  if (context === undefined) {
    throw new Error('useUnifiedSession must be used within a UnifiedSessionProvider');
  }
  return context;
};

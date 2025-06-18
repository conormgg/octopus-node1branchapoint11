
import { useMemo } from 'react';
import { SyncConfig } from '@/types/sync';

export const useSyncConfiguration = (
  id: string,
  sessionId?: string,
  senderId?: string
) => {
  // Memoize sync config to prevent recreating it on every render
  const syncConfig = useMemo(() => {
    // Guard against invalid id parameter
    if (!id || typeof id !== 'string') {
      console.warn('[useSyncConfiguration] Invalid id provided:', id);
      return undefined;
    }

    if (!sessionId) return undefined;

    // Teacher's main board -> broadcasts to students
    if (id === "teacher-main") {
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-main`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
    }
    
    // Student's view of teacher's board -> receives only
    if (id === "student-shared-teacher") {
      return {
        whiteboardId: `session-${sessionId}-main`,
        senderId: `student-listener-${sessionId}`,
        sessionId: sessionId,
        isReceiveOnly: true,
      };
    }

    // Teacher's view of Student A's student2 board -> receives only
    if (id === "teacherA") {
      return {
        whiteboardId: `session-${sessionId}-student-A-board2`,
        senderId: `teacher-observer-A-${sessionId}`,
        sessionId: sessionId,
        isReceiveOnly: true,
      };
    }

    // Student A's second board -> broadcasts to teacherA
    if (id === "student2" && senderId?.includes('A')) {
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-student-A-board2`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
    }

    // Individual student boards (existing functionality)
    if (id.startsWith('student-board-')) {
      const studentNumber = id.replace('student-board-', '');
      if (!senderId) return undefined;
      
      return {
        whiteboardId: `session-${sessionId}-student-${studentNumber}`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
    }

    return undefined;
  }, [id, sessionId, senderId]);

  return syncConfig;
};

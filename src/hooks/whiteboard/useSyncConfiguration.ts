
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

    // NEW LOGIC FOR TEACHER 'A' AND STUDENT 'A'
    if (id === "teacherA") {
      // The teacher's view of Student A's board
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-student-A`, // Must match Student A's boardId
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: true, // Teacher can only watch
      };
    }

    if (id === "student2") {
      // This will be used for Student A
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-student-A`, // Must match teacherA's boardId
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false, // Student can draw
      };
    }

    // Placeholders for future implementation (B, C, etc.)
    if (id === "teacherB") {
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-student-B`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: true,
      };
    }

    // Individual student boards (existing logic)
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

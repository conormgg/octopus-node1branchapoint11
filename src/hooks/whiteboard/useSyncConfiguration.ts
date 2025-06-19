
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

    // Student's personal board (student2) is now the source of truth
    if (id.startsWith("student-personal-view-")) {
      const studentSuffix = id.replace("student-personal-view-", "");
      if (!senderId) return undefined;
      return {
        whiteboardId: `session-${sessionId}-student-${studentSuffix}`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false, // Student can write to this board
      };
    }

    // Teacher's view of a student board is now read-only
    if (id.startsWith('student-board-')) {
      const studentNumber = id.replace('student-board-', '');
      if (!senderId) return undefined;
      
      return {
        whiteboardId: `session-${sessionId}-student-${studentNumber}`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: true, // Teacher's view is now receive-only
      };
    }

    return undefined;
  }, [id, sessionId, senderId]);

  return syncConfig;
};

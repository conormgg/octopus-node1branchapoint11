
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

    if (!sessionId) {
      console.warn('[useSyncConfiguration] No sessionId provided for board:', id);
      return undefined;
    }

    // Add debug logging to track board IDs and configurations
    console.log('[useSyncConfiguration] Processing board ID:', id, 'sessionId:', sessionId, 'senderId:', senderId);

    // Teacher's main board -> broadcasts to students
    if (id === "teacher-main") {
      if (!senderId) {
        console.warn('[useSyncConfiguration] No senderId provided for teacher main board');
        return undefined;
      }
      const config = {
        whiteboardId: `session-${sessionId}-main`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false,
      };
      console.log('[useSyncConfiguration] Teacher main config:', config);
      return config;
    }
    
    // Student's view of teacher's board -> receives only
    if (id === "student-shared-teacher") {
      const config = {
        whiteboardId: `session-${sessionId}-main`,
        senderId: `student-listener-${sessionId}`,
        sessionId: sessionId,
        isReceiveOnly: true,
      };
      console.log('[useSyncConfiguration] Student shared teacher config:', config);
      return config;
    }

    // Student's personal board (student writes to this)
    if (id.startsWith("student-personal-view-")) {
      const studentSuffix = id.replace("student-personal-view-", "").toLowerCase();
      if (!senderId) {
        console.warn('[useSyncConfiguration] No senderId provided for student personal board:', id);
        return undefined;
      }
      const config = {
        whiteboardId: `session-${sessionId}-student-${studentSuffix}`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: false, // Student can write to their personal board
      };
      console.log('[useSyncConfiguration] Student personal config:', config);
      return config;
    }

    // Teacher's view of a student board (now matches the correct ID format from studentBoardGenerator)
    if (id.startsWith('student-board-')) {
      const studentSuffix = id.replace('student-board-', '').toLowerCase();
      if (!senderId) {
        console.warn('[useSyncConfiguration] No senderId provided for teacher view of student board:', id);
        return undefined;
      }
      
      const config = {
        whiteboardId: `session-${sessionId}-student-${studentSuffix}`,
        senderId: senderId,
        sessionId: sessionId,
        isReceiveOnly: true, // Teacher's view is read-only
      };
      console.log('[useSyncConfiguration] Teacher view of student board config:', config);
      return config;
    }

    console.warn('[useSyncConfiguration] No matching configuration for board ID:', id);
    return undefined;
  }, [id, sessionId, senderId]);

  return syncConfig;
};

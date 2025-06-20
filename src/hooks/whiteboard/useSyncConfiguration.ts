
import { useMemo } from 'react';
import { SyncConfig } from '@/types/sync';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('sync-config');

export const useSyncConfiguration = (
  whiteboardId: string,
  sessionId: string | undefined,
  senderId: string,
  participant?: SessionParticipant | null,
  currentUserRole: 'teacher' | 'student' = 'teacher'
) => {
  const syncConfig: SyncConfig | null = useMemo(() => {
    if (!sessionId) {
      debugLog('config', 'No session ID provided, sync disabled');
      return null;
    }

    let sharedWhiteboardId: string;
    let isReceiveOnly: boolean;

    debugLog('config', `Configuring sync for board: ${whiteboardId}, role: ${currentUserRole}`);
    
    // Map component IDs to shared sync channels
    if (whiteboardId === 'teacher-main') {
      // Teacher's main board
      sharedWhiteboardId = `session-${sessionId}-main`;
      isReceiveOnly = false; // Teacher can always edit their main board
      debugLog('config', `Teacher main board - interactive mode`);
      
    } else if (whiteboardId === 'student-shared-teacher') {
      // Student's view of teacher board - shares same channel as teacher-main
      sharedWhiteboardId = `session-${sessionId}-main`;
      isReceiveOnly = true; // Student's view is always read-only
      debugLog('config', `Student viewing teacher board - read-only mode`);
      
    } else if (whiteboardId.startsWith('student-personal-view-')) {
      // Student's personal board
      const studentSuffix = whiteboardId.replace('student-personal-view-', '').toLowerCase();
      sharedWhiteboardId = `session-${sessionId}-student-${studentSuffix}`;
      
      // Student can edit unless teacher has taken control
      const syncDirection = participant?.sync_direction || 'student_active';
      isReceiveOnly = syncDirection === 'teacher_active';
      
      debugLog('config', `Student personal board ${studentSuffix} - sync direction: ${syncDirection}, receive-only: ${isReceiveOnly}`);
      
    } else if (whiteboardId.startsWith('student-board-')) {
      // Teacher's view of student board - shares same channel as student's personal board
      const studentSuffix = whiteboardId.replace('student-board-', '').toLowerCase();
      sharedWhiteboardId = `session-${sessionId}-student-${studentSuffix}`;
      
      // Teacher can edit only when they have taken control
      const syncDirection = participant?.sync_direction || 'student_active';
      isReceiveOnly = syncDirection !== 'teacher_active';
      
      debugLog('config', `Teacher viewing student board ${studentSuffix} - sync direction: ${syncDirection}, receive-only: ${isReceiveOnly}`);
      
    } else {
      debugLog('config', `Unknown board type: ${whiteboardId}, defaulting to interactive mode`);
      sharedWhiteboardId = whiteboardId;
      isReceiveOnly = false;
    }

    const config: SyncConfig = {
      whiteboardId: sharedWhiteboardId,
      sessionId,
      senderId,
      isReceiveOnly
    };

    debugLog('config', 'Generated sync config:', config);
    return config;
  }, [whiteboardId, sessionId, senderId, participant?.sync_direction, currentUserRole]); // More specific dependency on sync_direction

  return syncConfig;
};

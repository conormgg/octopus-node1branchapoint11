
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

    // Determine if this should be receive-only based on sync direction and user role
    let isReceiveOnly = false;
    
    if (currentUserRole === 'teacher') {
      // Teacher viewing student boards - always receive-only
      isReceiveOnly = true;
      debugLog('config', `Teacher viewing ${whiteboardId} - receive-only mode`);
    } else if (currentUserRole === 'student') {
      // Student on their personal board - check sync direction from participant data
      const syncDirection = participant?.sync_direction || 'student_active';
      isReceiveOnly = syncDirection === 'teacher_active';
      
      debugLog('config', `Student on ${whiteboardId} - sync direction: ${syncDirection}, receive-only: ${isReceiveOnly}`);
      
      // Additional logging for sync direction changes
      if (syncDirection === 'teacher_active') {
        debugLog('config', `Student board ${whiteboardId} is under teacher control - read-only mode`);
      } else {
        debugLog('config', `Student board ${whiteboardId} is under student control - interactive mode`);
      }
    }

    const config: SyncConfig = {
      whiteboardId,
      sessionId,
      senderId,
      isReceiveOnly
    };

    debugLog('config', 'Generated sync config:', config);
    return config;
  }, [whiteboardId, sessionId, senderId, participant?.sync_direction, currentUserRole]);

  return syncConfig;
};

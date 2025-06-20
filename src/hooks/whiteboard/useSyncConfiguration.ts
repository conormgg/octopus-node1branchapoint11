
import { useMemo } from 'react';
import { SyncConfig } from '@/types/sync';
import { SessionParticipant, SyncDirection } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('sync-config');

export const useSyncConfiguration = (
  whiteboardId: string,
  sessionId: string | undefined,
  senderId: string,
  participant?: SessionParticipant | null,
  currentUserRole: 'teacher' | 'student' = 'teacher',
  overrideSyncDirection?: SyncDirection, // Override parameter for optimistic updates
  lastSyncDirectionUpdate?: number // NEW: Force recalculation when sync direction changes
) => {
  const syncConfig: SyncConfig | null = useMemo(() => {
    if (!sessionId) {
      debugLog('config', 'No session ID provided, sync disabled');
      return null;
    }

    let sharedWhiteboardId: string;
    let isReceiveOnly: boolean;
    let finalSenderId = senderId;

    // Use override sync direction if provided, otherwise fall back to participant data
    const effectiveSyncDirection = overrideSyncDirection || participant?.sync_direction || 'student_active';
    
    debugLog('config', `Configuring sync for board: ${whiteboardId}, role: ${currentUserRole}, participant sync direction: ${participant?.sync_direction}, override: ${overrideSyncDirection}, effective: ${effectiveSyncDirection}, update timestamp: ${lastSyncDirectionUpdate}`);
    
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
      isReceiveOnly = effectiveSyncDirection === 'teacher_active';
      
      // Use consistent student sender ID for student's own view
      if (participant) {
        finalSenderId = `student-${participant.id}`;
      }
      
      debugLog('config', `Student personal board ${studentSuffix} - sync direction: ${effectiveSyncDirection}, receive-only: ${isReceiveOnly}, sender: ${finalSenderId}`);
      
    } else if (whiteboardId.startsWith('student-board-')) {
      // Teacher's view of student board - shares same channel as student's personal board
      const studentSuffix = whiteboardId.replace('student-board-', '').toLowerCase();
      sharedWhiteboardId = `session-${sessionId}-student-${studentSuffix}`;
      
      // Teacher can edit only when they have taken control
      isReceiveOnly = effectiveSyncDirection !== 'teacher_active';
      
      // CRITICAL FIX: Use different sender ID for teacher viewing student board
      // This prevents operations from being filtered out due to sender ID conflicts
      if (participant) {
        finalSenderId = `teacher-viewing-student-${participant.id}`;
      }
      
      debugLog('config', `Teacher viewing student board ${studentSuffix} - sync direction: ${effectiveSyncDirection}, receive-only: ${isReceiveOnly}, sender: ${finalSenderId}`);
      
    } else {
      debugLog('config', `Unknown board type: ${whiteboardId}, defaulting to interactive mode`);
      sharedWhiteboardId = whiteboardId;
      isReceiveOnly = false;
    }

    const config: SyncConfig = {
      whiteboardId: sharedWhiteboardId,
      sessionId,
      senderId: finalSenderId,
      isReceiveOnly
    };

    debugLog('config', 'Generated sync config:', config);
    debugLog('config', `Sync config recalculated due to effective sync direction: ${effectiveSyncDirection} (timestamp: ${lastSyncDirectionUpdate})`);
    return config;
  }, [
    whiteboardId, 
    sessionId, 
    senderId, 
    participant?.sync_direction,
    participant?.id, // NEW: Include participant ID for sender consistency
    overrideSyncDirection,
    currentUserRole,
    lastSyncDirectionUpdate // CRITICAL: Include update timestamp to force recalculation
  ]);

  return syncConfig;
};

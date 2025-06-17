
import { useMemo } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSessionParticipants } from '@/hooks/useSessionParticipants';

export const useSyncConfiguration = (
  whiteboardId?: string,
  sessionId?: string,
  senderId?: string
): SyncConfig | undefined => {
  const { participants } = useSessionParticipants(sessionId);

  return useMemo(() => {
    if (!whiteboardId || !sessionId || !senderId) {
      return undefined;
    }

    // Check if this is a teacher's main board (doesn't need participant lookup)
    if (whiteboardId === 'teacher-main' || whiteboardId.startsWith('teacher-')) {
      console.log(`[SyncConfig] Teacher board detected: ${whiteboardId}, setting as send-only`);
      return {
        whiteboardId,
        sessionId,
        senderId,
        isReceiveOnly: false // Teacher always has full control of their own boards
      };
    }

    // For student boards, find the participant and check sync direction
    const boardSuffix = whiteboardId.split('-').pop();
    const participant = participants.find(p => p.assigned_board_suffix === boardSuffix);

    // Determine if this client should be receive-only based on sync direction
    // teacher_to_student: teacher controls the board (student is receive-only)
    // student_to_teacher: student controls the board (teacher is receive-only for that board)
    const isReceiveOnly = participant?.sync_direction === 'student_to_teacher';

    console.log(`[SyncConfig] Student board ${whiteboardId} (suffix: ${boardSuffix}): participant found = ${!!participant}, sync_direction = ${participant?.sync_direction}, isReceiveOnly = ${isReceiveOnly}`);

    return {
      whiteboardId,
      sessionId,
      senderId,
      isReceiveOnly
    };
  }, [whiteboardId, sessionId, senderId, participants]);
};


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

    // For teacher view, we need to determine sync direction based on the specific board
    // Extract board suffix from whiteboardId (e.g., "session-123-board-A" -> "A")
    const boardSuffix = whiteboardId.split('-').pop();
    
    // Find the participant for this specific board
    const participant = participants.find(p => p.assigned_board_suffix === boardSuffix);

    // Determine if this client should be receive-only based on sync direction
    // teacher_to_student: teacher controls the board (student is receive-only)
    // student_to_teacher: student controls the board (teacher is receive-only for that board)
    const isReceiveOnly = participant?.sync_direction === 'student_to_teacher';

    console.log(`[SyncConfig] Board ${whiteboardId} (suffix: ${boardSuffix}): participant found = ${!!participant}, sync_direction = ${participant?.sync_direction}, isReceiveOnly = ${isReceiveOnly}`);

    return {
      whiteboardId,
      sessionId,
      senderId,
      isReceiveOnly
    };
  }, [whiteboardId, sessionId, senderId, participants]);
};

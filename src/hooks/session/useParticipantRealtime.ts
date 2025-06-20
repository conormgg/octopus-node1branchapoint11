
import { useCallback, useRef } from 'react';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('session-students');

export const useParticipantRealtime = () => {
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incremental updates with debouncing to prevent rapid re-renders
  const handleParticipantChange = useCallback((
    payload: any,
    setSessionStudents: React.Dispatch<React.SetStateAction<SessionParticipant[]>>
  ) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    debugLog('participantChange', `Received ${eventType} event for participant:`, newRecord || oldRecord);
    
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce state updates to prevent flickering during rapid changes
    updateTimeoutRef.current = setTimeout(() => {
      setSessionStudents(prevStudents => {
        switch (eventType) {
          case 'INSERT':
            // Check if already exists to prevent duplicates
            const exists = prevStudents.some(s => s.id === newRecord.id);
            if (exists) {
              debugLog('participantChange', `Participant ${newRecord.id} already exists, skipping insert`);
              return prevStudents;
            }
            
            // Cast newRecord to SessionParticipant and insert in correct position
            const newStudents = [...prevStudents, newRecord as SessionParticipant];
            const sortedStudents = newStudents.sort((a, b) => 
              a.assigned_board_suffix.localeCompare(b.assigned_board_suffix)
            );
            debugLog('participantChange', `Added participant ${newRecord.id}`);
            return sortedStudents;
            
          case 'UPDATE':
            // Only update the specific student that changed, cast to SessionParticipant
            const updatedStudents = prevStudents.map(student => 
              student.id === newRecord.id ? { ...student, ...newRecord as SessionParticipant } : student
            );
            debugLog('participantChange', `Updated participant ${newRecord.id}`);
            return updatedStudents;
            
          case 'DELETE':
            // Remove only the deleted student
            const filteredStudents = prevStudents.filter(student => student.id !== oldRecord.id);
            debugLog('participantChange', `Removed participant ${oldRecord.id}`);
            return filteredStudents;
            
          default:
            debugLog('participantChange', `Unknown event type: ${eventType}`);
            return prevStudents;
        }
      });
      updateTimeoutRef.current = null;
    }, 50); // 50ms debounce to prevent rapid updates
  }, []);

  return {
    handleParticipantChange
  };
};


import { useCallback } from 'react';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('session-students');

export const useParticipantRealtime = () => {
  // Stabilize the participant change handler with useCallback to prevent re-subscriptions
  const handleParticipantChange = useCallback((
    payload: any,
    setSessionStudents: React.Dispatch<React.SetStateAction<SessionParticipant[]>>
  ) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    debugLog('participantChange', `Processing ${eventType} event for participant:`, newRecord || oldRecord);
    
    setSessionStudents(prevStudents => {
      switch (eventType) {
        case 'INSERT':
          // Check if already exists to prevent duplicates
          const exists = prevStudents.some(s => s.id === newRecord.id);
          if (exists) {
            debugLog('participantChange', 'Participant already exists, skipping insert');
            return prevStudents;
          }
          
          // Cast newRecord to SessionParticipant and insert in correct position
          const newStudents = [...prevStudents, newRecord as SessionParticipant];
          const sortedStudents = newStudents.sort((a, b) => 
            a.assigned_board_suffix.localeCompare(b.assigned_board_suffix)
          );
          debugLog('participantChange', `Added participant ${newRecord.id}, total: ${sortedStudents.length}`);
          return sortedStudents;
          
        case 'UPDATE':
          // Only update the specific student that changed
          const updatedStudents = prevStudents.map(student => 
            student.id === newRecord.id ? { ...student, ...newRecord as SessionParticipant } : student
          );
          debugLog('participantChange', `Updated participant ${newRecord.id}`);
          return updatedStudents;
          
        case 'DELETE':
          // Remove only the deleted student
          const filteredStudents = prevStudents.filter(student => student.id !== oldRecord.id);
          debugLog('participantChange', `Removed participant ${oldRecord.id}, remaining: ${filteredStudents.length}`);
          return filteredStudents;
          
        default:
          debugLog('participantChange', `Unknown event type: ${eventType}`);
          return prevStudents;
      }
    });
  }, []); // Empty dependency array since this function doesn't depend on external state

  return {
    handleParticipantChange
  };
};

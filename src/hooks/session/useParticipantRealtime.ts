
import { useCallback } from 'react';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('session-students');

export const useParticipantRealtime = () => {
  // Handle incremental updates to prevent full re-renders
  const handleParticipantChange = useCallback((
    payload: any,
    setSessionStudents: React.Dispatch<React.SetStateAction<SessionParticipant[]>>
  ) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    debugLog('participantChange', `Received ${eventType} event for participant:`, newRecord || oldRecord);
    
    setSessionStudents(prevStudents => {
      switch (eventType) {
        case 'INSERT':
          // Check if already exists to prevent duplicates
          const exists = prevStudents.some(s => s.id === newRecord.id);
          if (exists) return prevStudents;
          
          // Cast newRecord to SessionParticipant and insert in correct position
          const newStudents = [...prevStudents, newRecord as SessionParticipant];
          return newStudents.sort((a, b) => a.assigned_board_suffix.localeCompare(b.assigned_board_suffix));
          
        case 'UPDATE':
          // Only update the specific student that changed, cast to SessionParticipant
          return prevStudents.map(student => 
            student.id === newRecord.id ? { ...student, ...newRecord as SessionParticipant } : student
          );
          
        case 'DELETE':
          // Remove only the deleted student
          return prevStudents.filter(student => student.id !== oldRecord.id);
          
        default:
          return prevStudents;
      }
    });
  }, []);

  return {
    handleParticipantChange
  };
};

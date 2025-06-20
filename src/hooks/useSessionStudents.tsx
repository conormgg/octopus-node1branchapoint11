
import { useMemo, useRef } from 'react';
import { Session } from '@/types/session';
import { useFetchSessionStudents } from '@/hooks/session/useFetchSessionStudents';
import { useParticipantRealtime } from '@/hooks/session/useParticipantRealtime';
import { useStudentManagement } from '@/hooks/session/useStudentManagement';
import { useSessionStudentsRealtime } from '@/hooks/session/useSessionStudentsRealtime';

export const useSessionStudents = (activeSession: Session | null | undefined) => {
  const {
    sessionStudents,
    setSessionStudents,
    fetchSessionStudents,
    isLoading
  } = useFetchSessionStudents();

  const { handleParticipantChange } = useParticipantRealtime();

  const {
    handleAddIndividualStudent,
    handleRemoveIndividualStudent
  } = useStudentManagement(activeSession, sessionStudents);

  // Use stable function references to prevent subscription recreation
  const stableFetchRef = useRef<() => void>();
  stableFetchRef.current = () => fetchSessionStudents(activeSession);

  // Set up real-time subscriptions with stable references
  useSessionStudentsRealtime(
    activeSession,
    stableFetchRef.current,
    handleParticipantChange,
    setSessionStudents
  );

  // Memoize students with status to maintain stable object references
  // Use a more stable dependency array to prevent unnecessary recalculations
  const studentsWithStatus = useMemo(() => {
    return sessionStudents.map(student => {
      const boardId = `student-board-${student.assigned_board_suffix.toLowerCase()}`;
      const hasJoined = student.joined_at !== null;
      const status = hasJoined ? 'active' : 'pending' as 'active' | 'pending';
      
      return {
        ...student,
        hasJoined,
        boardId,
        status
      };
    });
  }, [sessionStudents]);

  // Count active students (who have actually joined) - memoized for stability
  const activeStudentCount = useMemo(() => 
    sessionStudents.filter(s => s.joined_at !== null).length,
    [sessionStudents]
  );
  
  // Total registered students - memoized for stability
  const totalStudentCount = useMemo(() => 
    sessionStudents.length,
    [sessionStudents]
  );

  return {
    sessionStudents,
    studentsWithStatus,
    activeStudentCount,
    totalStudentCount,
    handleAddIndividualStudent,
    handleRemoveIndividualStudent,
    isLoading,
  };
};

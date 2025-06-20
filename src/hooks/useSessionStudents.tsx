
import { useMemo, useCallback } from 'react';
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

  // FIX: Stabilize the fetch function with useCallback
  const memoizedFetch = useCallback(() => {
    if (activeSession) {
      fetchSessionStudents(activeSession);
    }
  }, [fetchSessionStudents, activeSession]);

  // Set up real-time subscriptions with the stabilized function
  useSessionStudentsRealtime(
    activeSession,
    memoizedFetch, // Use the memoized function here
    handleParticipantChange,
    setSessionStudents
  );

  // Memoize students with status to maintain stable object references
  const studentsWithStatus = useMemo(() => {
    return sessionStudents.map(student => ({
      ...student,
      hasJoined: student.joined_at !== null,
      boardId: `student-board-${student.assigned_board_suffix.toLowerCase()}`,
      status: student.joined_at ? 'active' : 'pending' as 'active' | 'pending'
    }));
  }, [sessionStudents]);

  // Count active students (who have actually joined)
  const activeStudentCount = useMemo(() => 
    sessionStudents.filter(s => s.joined_at !== null).length,
    [sessionStudents]
  );
  
  // Total registered students
  const totalStudentCount = sessionStudents.length;

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

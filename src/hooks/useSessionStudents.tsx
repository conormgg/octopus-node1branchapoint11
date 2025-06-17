
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';

export const useSessionStudents = (activeSession: Session | null | undefined) => {
  const [sessionStudents, setSessionStudents] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeSession) {
      fetchSessionStudents();
      // Set up real-time subscription for participant changes
      const channel = supabase
        .channel(`session-participants-${activeSession.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          () => {
            fetchSessionStudents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeSession]);

  const fetchSessionStudents = async () => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('assigned_board_suffix');

      if (error) throw error;
      setSessionStudents(data || []);
    } catch (error) {
      console.error('Error fetching session students:', error);
      setSessionStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get students with their join status
  const getStudentsWithStatus = () => {
    return sessionStudents.map(student => ({
      ...student,
      hasJoined: student.joined_at !== null,
      boardId: `student-${student.assigned_board_suffix.toLowerCase()}`, // Maps A -> student-a, B -> student-b, etc.
      status: student.joined_at ? 'active' : 'pending' as 'active' | 'pending'
    }));
  };

  // Count active students (who have actually joined)
  const activeStudentCount = sessionStudents.filter(s => s.joined_at !== null).length;
  
  // Total registered students
  const totalStudentCount = sessionStudents.length;

  // Remove this mock implementation and replace with real database operations
  const handleStudentCountChange = async (newCount: number) => {
    if (!activeSession) return;
    
    const clampedCount = Math.max(1, Math.min(8, newCount));
    const currentCount = sessionStudents.length;
    
    if (clampedCount > currentCount) {
      // Add new students
      const studentsToAdd = clampedCount - currentCount;
      for (let i = 0; i < studentsToAdd; i++) {
        const nextSuffix = String.fromCharCode(65 + currentCount + i); // A, B, C, etc.
        
        try {
          await supabase
            .from('session_participants')
            .insert({
              session_id: activeSession.id,
              student_name: `Student ${nextSuffix}`,
              assigned_board_suffix: nextSuffix,
              student_email: null,
              joined_at: null // Initially pending
            });
        } catch (error) {
          console.error('Error adding student:', error);
        }
      }
    } else if (clampedCount < currentCount) {
      // Remove students (remove from the end)
      const studentsToRemove = currentCount - clampedCount;
      const studentsToDelete = sessionStudents
        .slice(-studentsToRemove)
        .map(s => s.id);
        
      try {
        await supabase
          .from('session_participants')
          .delete()
          .in('id', studentsToDelete);
      } catch (error) {
        console.error('Error removing students:', error);
      }
    }
  };

  return {
    sessionStudents,
    studentsWithStatus: getStudentsWithStatus(),
    activeStudentCount,
    totalStudentCount,
    handleStudentCountChange,
    isLoading,
    studentCount: totalStudentCount, // Keep for backward compatibility
  };
};

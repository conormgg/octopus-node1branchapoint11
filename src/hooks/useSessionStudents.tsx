
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

  // Get next available board suffix - handles gaps when students are removed
  const getNextAvailableSuffix = () => {
    const usedSuffixes = new Set(sessionStudents.map(s => s.assigned_board_suffix));
    const alphabet = 'ABCDEFGH';
    
    for (let i = 0; i < alphabet.length; i++) {
      const suffix = alphabet[i];
      if (!usedSuffixes.has(suffix)) {
        return suffix;
      }
    }
    
    // If all A-H are taken, return null (max capacity reached)
    return null;
  };

  // Add a single student - handles late joiners and fills gaps
  const addStudent = async (studentName?: string) => {
    if (!activeSession) return false;
    
    const nextSuffix = getNextAvailableSuffix();
    if (!nextSuffix) {
      console.warn('Maximum student capacity (8) reached');
      return false;
    }

    const defaultName = studentName || `Student ${nextSuffix}`;
    
    try {
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: activeSession.id,
          student_name: defaultName,
          assigned_board_suffix: nextSuffix,
          student_email: null,
          joined_at: null // Start as pending
        });

      if (error) {
        console.error('Error adding student:', error);
        return false;
      }

      console.log(`Added student: ${defaultName} with suffix ${nextSuffix}`);
      return true;
    } catch (error) {
      console.error('Exception adding student:', error);
      return false;
    }
  };

  // Remove a specific student by ID
  const removeStudent = async (studentId: number) => {
    if (!activeSession) return false;

    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('id', studentId);

      if (error) {
        console.error('Error removing student:', error);
        return false;
      }

      console.log(`Removed student with ID: ${studentId}`);
      return true;
    } catch (error) {
      console.error('Exception removing student:', error);
      return false;
    }
  };

  // Legacy method for backward compatibility - now uses add/remove methods
  const handleStudentCountChange = async (newCount: number) => {
    if (!activeSession) return;
    
    const clampedCount = Math.max(1, Math.min(8, newCount));
    const currentCount = sessionStudents.length;
    
    if (clampedCount > currentCount) {
      // Add students one by one
      const studentsToAdd = clampedCount - currentCount;
      for (let i = 0; i < studentsToAdd; i++) {
        const success = await addStudent();
        if (!success) {
          console.warn(`Failed to add student ${i + 1} of ${studentsToAdd}`);
          break;
        }
      }
    } else if (clampedCount < currentCount) {
      // Remove students from the end (highest suffix)
      const studentsToRemove = currentCount - clampedCount;
      const sortedStudents = [...sessionStudents].sort((a, b) => 
        b.assigned_board_suffix.localeCompare(a.assigned_board_suffix)
      );
      
      for (let i = 0; i < studentsToRemove; i++) {
        const student = sortedStudents[i];
        if (student) {
          const success = await removeStudent(student.id);
          if (!success) {
            console.warn(`Failed to remove student ${student.student_name}`);
            break;
          }
        }
      }
    }
  };

  return {
    sessionStudents,
    studentsWithStatus: getStudentsWithStatus(),
    activeStudentCount,
    totalStudentCount,
    handleStudentCountChange,
    addStudent,
    removeStudent,
    getNextAvailableSuffix,
    isLoading,
    studentCount: totalStudentCount, // Keep for backward compatibility
  };
};

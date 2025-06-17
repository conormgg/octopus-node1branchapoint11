
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';

export const useSessionStudents = (activeSession: Session | null | undefined) => {
  const [sessionStudents, setSessionStudents] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized students with status to prevent unnecessary re-renders
  const studentsWithStatus = useMemo(() => {
    return sessionStudents.map(student => ({
      ...student,
      hasJoined: student.joined_at !== null,
      boardId: `student-${student.assigned_board_suffix.toLowerCase()}`,
      status: student.joined_at ? 'active' : 'pending' as 'active' | 'pending'
    }));
  }, [sessionStudents]);

  const activeStudentCount = useMemo(() => {
    return sessionStudents.filter(s => s.joined_at !== null).length;
  }, [sessionStudents]);

  const totalStudentCount = sessionStudents.length;

  // Optimized fetch function
  const fetchSessionStudents = useCallback(async () => {
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
  }, [activeSession]);

  // Incremental update handlers
  const handleParticipantInsert = useCallback((payload: any) => {
    const newParticipant = payload.new as SessionParticipant;
    console.log('Adding new participant:', newParticipant);
    
    setSessionStudents(prev => {
      // Check if participant already exists to prevent duplicates
      if (prev.find(p => p.id === newParticipant.id)) {
        return prev;
      }
      
      // Insert in the correct position based on assigned_board_suffix
      const newList = [...prev, newParticipant];
      return newList.sort((a, b) => a.assigned_board_suffix.localeCompare(b.assigned_board_suffix));
    });
  }, []);

  const handleParticipantUpdate = useCallback((payload: any) => {
    const updatedParticipant = payload.new as SessionParticipant;
    console.log('Updating participant:', updatedParticipant);
    
    setSessionStudents(prev => 
      prev.map(student => 
        student.id === updatedParticipant.id 
          ? { ...student, ...updatedParticipant }
          : student
      )
    );
  }, []);

  const handleParticipantDelete = useCallback((payload: any) => {
    const deletedParticipant = payload.old as SessionParticipant;
    console.log('Removing participant:', deletedParticipant);
    
    setSessionStudents(prev => 
      prev.filter(student => student.id !== deletedParticipant.id)
    );
  }, []);

  useEffect(() => {
    if (activeSession) {
      // Initial fetch
      fetchSessionStudents();
      
      // Set up optimized real-time subscription with specific event handlers
      const channel = supabase
        .channel(`session-participants-${activeSession.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          handleParticipantInsert
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          handleParticipantUpdate
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          handleParticipantDelete
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeSession, fetchSessionStudents, handleParticipantInsert, handleParticipantUpdate, handleParticipantDelete]);

  // Get next available board suffix
  const getNextAvailableSuffix = useCallback(() => {
    const usedSuffixes = new Set(sessionStudents.map(s => s.assigned_board_suffix));
    const alphabet = 'ABCDEFGH';
    
    for (let i = 0; i < alphabet.length; i++) {
      const suffix = alphabet[i];
      if (!usedSuffixes.has(suffix)) {
        return suffix;
      }
    }
    return null;
  }, [sessionStudents]);

  // Add student function
  const addStudent = useCallback(async (studentName: string, studentEmail?: string) => {
    if (!activeSession) return false;
    
    const nextSuffix = getNextAvailableSuffix();
    if (!nextSuffix) {
      console.warn('Maximum student capacity (8) reached');
      return false;
    }

    try {
      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: activeSession.id,
          student_name: studentName,
          assigned_board_suffix: nextSuffix,
          student_email: studentEmail || null,
          joined_at: null
        });

      if (error) {
        console.error('Error adding student:', error);
        return false;
      }

      console.log(`Added student: ${studentName} with suffix ${nextSuffix}`);
      return true;
    } catch (error) {
      console.error('Exception adding student:', error);
      return false;
    }
  }, [activeSession, getNextAvailableSuffix]);

  // Remove student function
  const removeStudent = useCallback(async (studentId: number) => {
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
  }, [activeSession]);

  // Legacy method for backward compatibility
  const handleStudentCountChange = useCallback(async (newCount: number) => {
    if (!activeSession) return;
    
    const clampedCount = Math.max(1, Math.min(8, newCount));
    const currentCount = sessionStudents.length;
    
    if (clampedCount > currentCount) {
      const studentsToAdd = clampedCount - currentCount;
      for (let i = 0; i < studentsToAdd; i++) {
        const nextSuffix = getNextAvailableSuffix();
        if (!nextSuffix) break;
        
        const defaultName = `Student ${nextSuffix}`;
        const success = await addStudent(defaultName);
        if (!success) {
          console.warn(`Failed to add student ${i + 1} of ${studentsToAdd}`);
          break;
        }
      }
    } else if (clampedCount < currentCount) {
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
  }, [activeSession, sessionStudents, getNextAvailableSuffix, addStudent, removeStudent]);

  return {
    sessionStudents,
    studentsWithStatus,
    activeStudentCount,
    totalStudentCount,
    handleStudentCountChange,
    addStudent,
    removeStudent,
    getNextAvailableSuffix,
    isLoading,
    studentCount: totalStudentCount,
  };
};

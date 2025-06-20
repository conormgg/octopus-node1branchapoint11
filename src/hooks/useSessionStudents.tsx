
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';
import { useToast } from '@/hooks/use-toast';

export const useSessionStudents = (activeSession: Session | null | undefined) => {
  const [sessionStudents, setSessionStudents] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  // Handle incremental updates to prevent full re-renders
  const handleParticipantChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setSessionStudents(prevStudents => {
      switch (eventType) {
        case 'INSERT':
          // Check if already exists to prevent duplicates
          const exists = prevStudents.some(s => s.id === newRecord.id);
          if (exists) return prevStudents;
          
          // Insert in correct position based on assigned_board_suffix
          const newStudents = [...prevStudents, newRecord];
          return newStudents.sort((a, b) => a.assigned_board_suffix.localeCompare(b.assigned_board_suffix));
          
        case 'UPDATE':
          // Only update the specific student that changed
          return prevStudents.map(student => 
            student.id === newRecord.id ? { ...student, ...newRecord } : student
          );
          
        case 'DELETE':
          // Remove only the deleted student
          return prevStudents.filter(student => student.id !== oldRecord.id);
          
        default:
          return prevStudents;
      }
    });
  }, []);

  useEffect(() => {
    if (activeSession) {
      fetchSessionStudents();
      
      // Set up real-time subscription with specific event handlers
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
          (payload) => handleParticipantChange({ ...payload, eventType: 'INSERT' })
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          (payload) => handleParticipantChange({ ...payload, eventType: 'UPDATE' })
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          (payload) => handleParticipantChange({ ...payload, eventType: 'DELETE' })
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeSession, fetchSessionStudents, handleParticipantChange]);

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

  // Add individual student with name and email
  const handleAddIndividualStudent = async (name: string, email: string) => {
    if (!activeSession) {
      toast({
        title: "Error",
        description: "No active session found.",
        variant: "destructive",
      });
      return;
    }

    if (sessionStudents.length >= 8) {
      toast({
        title: "Maximum Students Reached",
        description: "Cannot add more than 8 students to a session.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the next available board suffix
      const usedSuffixes = sessionStudents.map(s => s.assigned_board_suffix);
      const availableSuffixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const nextSuffix = availableSuffixes.find(suffix => !usedSuffixes.includes(suffix));

      if (!nextSuffix) {
        toast({
          title: "Error",
          description: "No available board positions.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: activeSession.id,
          student_name: name,
          student_email: email || null,
          assigned_board_suffix: nextSuffix,
          joined_at: null // Start as pending
        });

      if (error) throw error;

      toast({
        title: "Student Added",
        description: `${name} has been added to the session.`,
      });
    } catch (error) {
      console.error('Error adding individual student:', error);
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Remove individual student by participant ID
  const handleRemoveIndividualStudent = async (participantId: number) => {
    if (!activeSession) {
      toast({
        title: "Error",
        description: "No active session found.",
        variant: "destructive",
      });
      return;
    }

    const student = sessionStudents.find(s => s.id === participantId);
    if (!student) {
      toast({
        title: "Error",
        description: "Student not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      toast({
        title: "Student Removed",
        description: `${student.student_name} has been removed from the session.`,
      });
    } catch (error) {
      console.error('Error removing individual student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student. Please try again.",
        variant: "destructive",
      });
    }
  };

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

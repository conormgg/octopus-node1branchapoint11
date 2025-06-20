
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';
import { useToast } from '@/hooks/use-toast';

export const useStudentManagement = (
  activeSession: Session | null | undefined,
  sessionStudents: SessionParticipant[]
) => {
  const { toast } = useToast();

  // Add individual student with name and email
  const handleAddIndividualStudent = useCallback(async (name: string, email: string) => {
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
  }, [activeSession, sessionStudents, toast]);

  // Remove individual student by participant ID
  const handleRemoveIndividualStudent = useCallback(async (participantId: number) => {
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
  }, [activeSession, sessionStudents, toast]);

  return {
    handleAddIndividualStudent,
    handleRemoveIndividualStudent
  };
};

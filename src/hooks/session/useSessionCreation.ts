
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Student } from '@/types/student';
import { logError } from '@/utils/debug/debugConfig';

interface UseSessionCreationProps {
  title: string;
  duration: number | '';
  students: Student[];
  setIsLoading: (loading: boolean) => void;
}

interface SessionCreationError {
  message: string;
}

export const useSessionCreation = ({
  title,
  duration,
  students,
  setIsLoading,
}: UseSessionCreationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent, onSessionCreated: (sessionId: string) => void) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a session.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate unique slug
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_unique_slug');
      
      if (slugError) throw slugError;

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          teacher_id: user.id,
          title: title || 'Untitled Session',
          duration_minutes: duration || null,
          unique_url_slug: slugData,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add students to session - ensure they start as pending
      const validStudents = students.filter(student => student.name.trim());
      if (validStudents.length > 0) {
        const participantsToInsert = validStudents.map((student, index) => ({
          session_id: sessionData.id,
          student_name: student.name.trim(),
          student_email: student.email.trim() || null,
          assigned_board_suffix: String.fromCharCode(65 + index), // A, B, C, etc.
          joined_at: null, // CRITICAL: Start as null (pending state)
        }));

        const { error: participantsError } = await supabase
          .from('session_participants')
          .insert(participantsToInsert);

        if (participantsError) throw participantsError;
      }

      toast({
        title: "Session Created!",
        description: `Session "${sessionData.title}" has been created successfully.`,
      });

      onSessionCreated(sessionData.id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      logError('SessionCreation', 'Failed to create session', error as SessionCreationError);
      toast({
        title: "Error Creating Session",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
  };
};


import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { useAuth } from '@/hooks/useAuth';

const debugLog = createDebugLogger('session-students');

export const useFetchSessionStudents = () => {
  const [sessionStudents, setSessionStudents] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchSessionStudents = useCallback(async (activeSession: Session | null | undefined) => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('assigned_board_suffix');

      if (error) throw error;
      debugLog('fetchStudents', `Fetched ${data?.length || 0} students`);
      
      // Cast the data to SessionParticipant[] to handle sync_direction type
      let participants = (data || []) as SessionParticipant[];
      
      // Check if current user is the teacher of this session
      const isTeacher = activeSession.teacher_id === user?.id;
      
      // If user is not the teacher, mask email addresses of other students
      if (!isTeacher && user?.email) {
        participants = participants.map(participant => ({
          ...participant,
          student_email: participant.student_email === user.email 
            ? participant.student_email // Show own email
            : null // Hide other students' emails
        }));
      }
      
      setSessionStudents(participants);
    } catch (error) {
      console.error('Error fetching session students:', error);
      setSessionStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    sessionStudents,
    setSessionStudents,
    fetchSessionStudents,
    isLoading
  };
};

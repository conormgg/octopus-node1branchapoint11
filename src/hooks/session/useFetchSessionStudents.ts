
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('session-students');

export const useFetchSessionStudents = () => {
  const [sessionStudents, setSessionStudents] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      setSessionStudents((data || []) as SessionParticipant[]);
    } catch (error) {
      console.error('Error fetching session students:', error);
      setSessionStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sessionStudents,
    setSessionStudents,
    fetchSessionStudents,
    isLoading
  };
};

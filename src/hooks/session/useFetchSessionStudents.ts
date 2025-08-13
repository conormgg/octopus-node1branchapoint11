
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
      // Use secure function that handles email masking at database level
      const { data, error } = await supabase
        .rpc('get_session_participants_with_privacy', { session_uuid: activeSession.id });

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
  }, [user]);

  return {
    sessionStudents,
    setSessionStudents,
    fetchSessionStudents,
    isLoading
  };
};

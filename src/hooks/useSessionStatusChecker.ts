
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionData } from '@/contexts/sessionExpiration/types';

export const useSessionStatusChecker = () => {
  const fetchSessionData = useCallback(async (sessionId: string): Promise<SessionData | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_session_status', { session_uuid: sessionId });

      if (error) {
        console.error(`Error fetching session (RPC): ${error.message}`);
        return null;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!result) return null;

      return result as SessionData;

    } catch (err) {
      console.error('Error checking session:', err);
      return null;
    }
  }, []);

  const updateSessionToExpired = useCallback(async (sessionId: string) => {
    try {
      await supabase
        .from('sessions')
        .update({ status: 'expired' })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Error updating session status:', err);
    }
  }, []);

  return {
    fetchSessionData,
    updateSessionToExpired,
  };
};

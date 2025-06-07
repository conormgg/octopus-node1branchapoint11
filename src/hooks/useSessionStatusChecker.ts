
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionData } from '@/contexts/sessionExpiration/types';

export const useSessionStatusChecker = () => {
  const fetchSessionData = useCallback(async (sessionId: string): Promise<SessionData | null> => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('created_at, duration_minutes, status')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error(`Error fetching session: ${error.message}`);
        return null;
      }

      return data;
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

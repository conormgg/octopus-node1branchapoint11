
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
  teacher_id: string;
}

export const useSessionData = (sessionId: string | undefined) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        setSession(data);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Set document title
  useEffect(() => {
    document.title = `Student Boards Monitor - ${session?.title || sessionId || 'Session'}`;
    return () => {
      document.title = 'Octopus Whiteboard';
    };
  }, [session, sessionId]);

  return { session, loading };
};

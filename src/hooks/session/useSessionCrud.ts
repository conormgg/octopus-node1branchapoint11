
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types/session';

export const useSessionCrud = (user: any) => {
  const { toast } = useToast();

  const fetchRecentSessions = async (): Promise<Session[]> => {
    if (!user) {
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  };

  const fetchSessionById = async (sessionId: string): Promise<Session | null> => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Error Loading Session",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    fetchRecentSessions,
    fetchSessionById,
  };
};

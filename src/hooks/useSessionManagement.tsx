
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
}

export const useSessionManagement = (user: any, isDemoMode: boolean) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRecentSessions();
    }
  }, [user]);

  const fetchRecentSessions = async () => {
    // Skip fetching for demo mode since we don't have real data
    if (isDemoMode) {
      setRecentSessions([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleSessionCreated = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      
      setActiveSession(data);
      setShowUrlModal(true); // Show the URL modal for newly created sessions
      fetchRecentSessions();
    } catch (error: any) {
      toast({
        title: "Error Loading Session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'ended_by_teacher' })
        .eq('id', activeSession.id);

      if (error) throw error;

      toast({
        title: "Session Ended",
        description: "The session has been ended successfully.",
      });

      setActiveSession(null);
      fetchRecentSessions();
    } catch (error: any) {
      toast({
        title: "Error Ending Session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resumeSession = (session: Session) => {
    if (session.status === 'active') {
      setActiveSession(session);
    }
  };

  const handleCloseUrlModal = () => {
    setShowUrlModal(false);
  };

  return {
    activeSession,
    recentSessions,
    showUrlModal,
    handleSessionCreated,
    handleEndSession,
    resumeSession,
    handleCloseUrlModal,
  };
};

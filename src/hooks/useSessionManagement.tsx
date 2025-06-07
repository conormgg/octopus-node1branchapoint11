
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
  teacher_id: string;
}

export const useSessionManagement = (user: any, isDemoMode: boolean) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const { toast } = useToast();
  const { clearWhiteboardState } = useWhiteboardStateContext();

  useEffect(() => {
    if (user) {
      fetchRecentSessions();
    }
  }, [user]);

  const fetchRecentSessions = async () => {
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
      setShowUrlModal(true);
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
      // First, get all whiteboard IDs associated with this session
      const { data: whiteboardData, error: fetchError } = await supabase
        .from('whiteboard_data')
        .select('board_id')
        .eq('session_id', activeSession.id);
        
      if (fetchError) throw fetchError;
      
      // Update session status to 'ended_by_teacher' instead of 'expired'
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'ended_by_teacher' })
        .eq('id', activeSession.id);

      if (error) throw error;

      // Clear whiteboard state from memory
      if (whiteboardData) {
        const boardIds = [...new Set(whiteboardData.map(item => item.board_id))];
        boardIds.forEach(boardId => {
          clearWhiteboardState(boardId);
        });
      }

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

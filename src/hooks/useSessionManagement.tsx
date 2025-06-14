import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { Session } from '@/types/session';

export const useSessionManagement = (user: any) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const { toast } = useToast();
  const { clearWhiteboardState } = useWhiteboardStateContext();

  useEffect(() => {
    if (user) {
      fetchRecentSessions();
    }
  }, [user]);

  const fetchRecentSessions = async () => {
    if (!user) {
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
    if (!activeSession || endingSession) return;

    setEndingSession(true);
    
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

      // Show toast only on teacher's side (not duplicated on student side)
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
    } finally {
      setEndingSession(false);
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

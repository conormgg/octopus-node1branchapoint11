
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { Session } from '@/types/session';

export const useSessionCleanup = () => {
  const { toast } = useToast();
  const { clearWhiteboardState } = useWhiteboardStateContext();

  const endSessionAndCleanup = async (
    activeSession: Session | null,
    endingSession: boolean,
    setEndingSession: (ending: boolean) => void,
    setActiveSession: (session: Session | null) => void,
    fetchRecentSessions: () => Promise<void>
  ) => {
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
      await fetchRecentSessions();
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

  return {
    endSessionAndCleanup,
  };
};

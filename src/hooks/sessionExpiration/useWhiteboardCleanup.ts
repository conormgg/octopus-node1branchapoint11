
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

export const useWhiteboardCleanup = () => {
  const { clearWhiteboardState } = useWhiteboardStateContext();

  const clearWhiteboardData = useCallback(async (sessionId: string) => {
    try {
      const { data: whiteboardData } = await supabase
        .from('whiteboard_data')
        .select('board_id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
        
      if (whiteboardData) {
        const boardIds = [...new Set(whiteboardData.map(item => item.board_id))];
        boardIds.forEach(boardId => {
          clearWhiteboardState(boardId);
        });
      }
    } catch (err) {
      console.error('Error clearing whiteboard data:', err);
    }
  }, [clearWhiteboardState]);

  return {
    clearWhiteboardData,
  };
};

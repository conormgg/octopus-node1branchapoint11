
import { useEffect } from 'react';
import { SyncConfig } from '@/types/sync';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardPersistence } from '../useWhiteboardPersistence';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

export const useSharedPersistenceIntegration = (
  state: WhiteboardState,
  setState: (updater: (prev: WhiteboardState) => WhiteboardState) => void,
  syncConfig?: SyncConfig,
  whiteboardId?: string
) => {
  const { updateWhiteboardState } = useWhiteboardStateContext();
  
  // Load persisted whiteboard data if available
  const persistence = syncConfig && whiteboardId ? useWhiteboardPersistence({
    whiteboardId,
    sessionId: syncConfig.sessionId
  }) : { isLoading: false, error: null, lines: [], images: [] };

  // Update state when persisted data is loaded
  useEffect(() => {
    if (!persistence.isLoading && persistence.lines.length > 0) {
      setState(prevState => ({
        ...prevState,
        lines: persistence.lines,
        images: persistence.images,
        history: [{ lines: persistence.lines, images: persistence.images }, ...prevState.history],
        historyIndex: 0
      }));
      
      // Also update the shared state context
      if (whiteboardId) {
        updateWhiteboardState(whiteboardId, persistence.lines);
      }
    }
  }, [persistence.isLoading, persistence.lines, persistence.images, whiteboardId, updateWhiteboardState, setState]);

  // Update shared state whenever lines change
  useEffect(() => {
    if (whiteboardId) {
      updateWhiteboardState(whiteboardId, state.lines);
    }
  }, [state.lines, whiteboardId, updateWhiteboardState]);

  return { persistence };
};

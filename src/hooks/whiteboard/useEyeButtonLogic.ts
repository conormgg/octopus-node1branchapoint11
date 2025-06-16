
import { useState, useCallback } from 'react';
import { ActivityMetadata } from '@/types/whiteboard';

// Constants for configuration
const ACTIVITY_TIMEOUT_MS = 30000; // 30 seconds
const TARGET_WHITEBOARDS = ['teacher-main', 'student-shared-teacher'] as const;

type TargetWhiteboard = typeof TARGET_WHITEBOARDS[number];

interface EyeButtonState {
  lastActivity: ActivityMetadata | null;
  centerOnActivityCallback: ((bounds: any) => void) | null;
}

export const useEyeButtonLogic = (id: string) => {
  const [state, setState] = useState<EyeButtonState>({
    lastActivity: null,
    centerOnActivityCallback: null
  });

  // Check if this whiteboard should show the eye button
  const shouldShowEyeButton = TARGET_WHITEBOARDS.includes(id as TargetWhiteboard);

  // Enhanced eye button click handler with proper error handling
  const handleEyeClick = useCallback(() => {
    console.log('[EyeButton] Eye button clicked for whiteboard:', id);
    
    if (!state.lastActivity) {
      console.warn('[EyeButton] No last activity available');
      return;
    }
    
    if (!state.centerOnActivityCallback) {
      console.warn('[EyeButton] No center callback available');
      return;
    }

    if (!state.lastActivity.bounds) {
      console.warn('[EyeButton] Activity missing bounds data');
      return;
    }
    
    try {
      console.log('[EyeButton] Centering on activity:', state.lastActivity);
      state.centerOnActivityCallback(state.lastActivity.bounds);
    } catch (error) {
      console.error('[EyeButton] Failed to center on activity:', error);
    }
  }, [id, state.lastActivity, state.centerOnActivityCallback]);

  // Stable callback to receive last activity updates
  const handleLastActivityUpdate = useCallback((activity: ActivityMetadata | null) => {
    console.log('[EyeButton] Received activity update for whiteboard:', id, activity);
    
    setState(prev => ({
      ...prev,
      lastActivity: activity
    }));
  }, [id]);

  // Stable callback to receive the center function
  const handleCenterCallbackUpdate = useCallback((callback: (bounds: any) => void) => {
    console.log('[EyeButton] Received center callback for whiteboard:', id);
    
    setState(prev => ({
      ...prev,
      centerOnActivityCallback: callback
    }));
  }, [id]);

  // Check if we have recent activity within the timeout window
  const hasLastActivity = state.lastActivity && 
    (Date.now() - state.lastActivity.timestamp < ACTIVITY_TIMEOUT_MS);

  return {
    shouldShowEyeButton,
    handleEyeClick,
    handleLastActivityUpdate,
    handleCenterCallbackUpdate,
    hasLastActivity,
    lastActivity: state.lastActivity
  };
};

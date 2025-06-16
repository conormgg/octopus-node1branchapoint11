
import { useState, useCallback } from 'react';

export const useEyeButtonLogic = (id: string) => {
  const [lastActivity, setLastActivity] = useState<any>(null);
  const [centerOnActivityCallback, setCenterOnActivityCallback] = useState<((bounds: any) => void) | null>(null);

  // Check if this whiteboard should show the eye button (teacher-main or student-shared-teacher)
  const shouldShowEyeButton = id === "teacher-main" || id === "student-shared-teacher";

  // Enhanced eye button click handler with actual centering logic
  const handleEyeClick = () => {
    console.log('[WhiteboardPlaceholder] Eye button clicked');
    console.log('[WhiteboardPlaceholder] Last activity:', lastActivity);
    
    if (!lastActivity || !centerOnActivityCallback) {
      console.log('[WhiteboardPlaceholder] No activity or callback available');
      return;
    }
    
    // Call the center function provided by the whiteboard content
    centerOnActivityCallback(lastActivity.bounds);
  };

  // Stable callback to receive last activity updates from whiteboard content
  const handleLastActivityUpdate = useCallback((activity: any) => {
    console.log('[WhiteboardPlaceholder] Received last activity update:', activity);
    setLastActivity(activity);
  }, []);

  // Stable callback to receive the center function from whiteboard content
  const handleCenterCallbackUpdate = useCallback((callback: (bounds: any) => void) => {
    console.log('[WhiteboardPlaceholder] Received center callback');
    setCenterOnActivityCallback(() => callback);
  }, []);

  // Check if we have recent activity (within the last 30 seconds for better UX)
  const hasLastActivity = lastActivity && (Date.now() - lastActivity.timestamp < 30000);

  return {
    shouldShowEyeButton,
    handleEyeClick,
    handleLastActivityUpdate,
    handleCenterCallbackUpdate,
    hasLastActivity
  };
};


import { useState, useEffect, useCallback } from 'react';

export const useActivityTracker = () => {
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());

  const updateActivity = useCallback(() => {
    setLastActivityTime(new Date());
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity]);

  const resetActivity = useCallback(() => {
    setLastActivityTime(new Date());
  }, []);

  return {
    lastActivityTime,
    updateActivity,
    resetActivity
  };
};

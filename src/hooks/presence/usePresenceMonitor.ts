
import { useEffect, useRef } from 'react';
import { updateThrottler } from '@/utils/presence/updateThrottler';

interface UsePresenceMonitorProps {
  participantId?: number;
  studentName: string;
  enabled?: boolean;
}

export const usePresenceMonitor = ({ 
  participantId, 
  studentName, 
  enabled = true 
}: UsePresenceMonitorProps) => {
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !participantId) {
      return;
    }

    console.log(`[PresenceMonitor:${studentName}] Starting monitoring for participant ${participantId}`);

    // Monitor every 30 seconds
    monitorIntervalRef.current = setInterval(() => {
      const stats = updateThrottler.getStats(participantId);
      
      if (stats.updateCount > 0 || stats.isBlocked) {
        console.log(`[PresenceMonitor:${studentName}] Participant ${participantId} stats:`, {
          ...stats,
          formattedLastUpdate: stats.lastUpdate ? new Date(stats.lastUpdate).toISOString() : 'never'
        });
      }
    }, 30000);

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      console.log(`[PresenceMonitor:${studentName}] Stopped monitoring for participant ${participantId}`);
    };
  }, [participantId, studentName, enabled]);

  return {
    getStats: () => participantId ? updateThrottler.getStats(participantId) : null
  };
};

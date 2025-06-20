
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionParticipant, SyncDirection } from '@/types/student';
import { updateParticipantSyncDirection } from '@/utils/syncDirection';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('sync-direction-manager');

interface SyncDirectionState {
  [participantId: number]: SyncDirection;
}

export const useSyncDirectionManager = (
  sessionId: string | undefined,
  currentUserRole: 'teacher' | 'student' = 'teacher'
) => {
  const [syncDirections, setSyncDirections] = useState<SyncDirectionState>({});
  const [isUpdating, setIsUpdating] = useState<{ [participantId: number]: boolean }>({});
  const subscriptionRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Stable function references using useRef to prevent dependency loops
  const handleSyncDirectionChangeRef = useRef<(payload: any) => void>();
  const initializeSyncDirectionsRef = useRef<() => Promise<void>>();

  // Initialize sync directions from session participants
  initializeSyncDirectionsRef.current = useCallback(async () => {
    if (!sessionId || isInitializedRef.current) return;

    try {
      debugLog('initialize', `Fetching sync directions for session ${sessionId}`);
      const { data, error } = await supabase
        .from('session_participants')
        .select('id, sync_direction')
        .eq('session_id', sessionId);

      if (error) {
        debugLog('initialize', `Error fetching sync directions: ${error.message}`);
        return;
      }

      const directions: SyncDirectionState = {};
      data.forEach(participant => {
        directions[participant.id] = participant.sync_direction as SyncDirection;
      });

      setSyncDirections(directions);
      isInitializedRef.current = true;
      debugLog('initialize', `Initialized sync directions for ${Object.keys(directions).length} participants`);
    } catch (error) {
      debugLog('initialize', `Exception initializing sync directions: ${error}`);
    }
  }, [sessionId]);

  // Handle real-time sync direction changes with stable reference
  handleSyncDirectionChangeRef.current = useCallback((payload: any) => {
    const { new: newRecord, old: oldRecord } = payload;
    
    if (newRecord && oldRecord) {
      const participantId = newRecord.id;
      const oldDirection = oldRecord.sync_direction as SyncDirection;
      const newDirection = newRecord.sync_direction as SyncDirection;
      
      if (oldDirection !== newDirection) {
        debugLog('realtimeChange', `Participant ${participantId}: ${oldDirection} → ${newDirection}`);
        
        setSyncDirections(prev => ({
          ...prev,
          [participantId]: newDirection
        }));
      }
    }
  }, []);

  // Set up real-time subscription only when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      // Reset state when no session
      setSyncDirections({});
      isInitializedRef.current = false;
      return;
    }

    // Initialize sync directions
    initializeSyncDirectionsRef.current?.();

    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Set up new subscription with stable channel name
    const channelName = `sync-direction-${sessionId}`;
    debugLog('subscription', `Setting up subscription for ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => handleSyncDirectionChangeRef.current?.(payload)
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      debugLog('subscription', `Cleaning up subscription for ${channelName}`);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [sessionId]); // Only depend on sessionId to prevent subscription recreation

  // Toggle sync direction for a participant
  const toggleSyncDirection = useCallback(async (participantId: number): Promise<boolean> => {
    if (currentUserRole !== 'teacher') {
      debugLog('toggle', 'Only teachers can toggle sync direction');
      return false;
    }

    const currentDirection = syncDirections[participantId] || 'student_active';
    const newDirection: SyncDirection = currentDirection === 'student_active' 
      ? 'teacher_active' 
      : 'student_active';

    debugLog('toggle', `Toggling participant ${participantId}: ${currentDirection} → ${newDirection}`);

    setIsUpdating(prev => ({ ...prev, [participantId]: true }));

    try {
      const result = await updateParticipantSyncDirection(participantId, newDirection);
      
      if (result.success) {
        debugLog('toggle', `Successfully toggled participant ${participantId} to ${newDirection}`);
        return true;
      } else {
        debugLog('toggle', `Failed to toggle participant ${participantId}: ${result.error}`);
        return false;
      }
    } catch (error) {
      debugLog('toggle', `Exception toggling participant ${participantId}: ${error}`);
      return false;
    } finally {
      setIsUpdating(prev => ({ ...prev, [participantId]: false }));
    }
  }, [syncDirections, currentUserRole]);

  // Get sync direction for a specific participant
  const getSyncDirection = useCallback((participantId: number): SyncDirection => {
    return syncDirections[participantId] || 'student_active';
  }, [syncDirections]);

  // Check if teacher is currently controlling a specific participant
  const isTeacherControlling = useCallback((participantId: number): boolean => {
    return getSyncDirection(participantId) === 'teacher_active';
  }, [getSyncDirection]);

  // Check if participant is being updated
  const isParticipantUpdating = useCallback((participantId: number): boolean => {
    return isUpdating[participantId] || false;
  }, [isUpdating]);

  return {
    syncDirections,
    getSyncDirection,
    toggleSyncDirection,
    isTeacherControlling,
    isParticipantUpdating,
    initializeSyncDirections: initializeSyncDirectionsRef.current
  };
};

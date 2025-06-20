
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
  const [optimisticUpdates, setOptimisticUpdates] = useState<SyncDirectionState>({});
  const subscriptionRef = useRef<any>(null);

  // Initialize sync directions from session participants
  const initializeSyncDirections = useCallback(async () => {
    if (!sessionId) return;

    try {
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
      debugLog('initialize', `Initialized sync directions for ${Object.keys(directions).length} participants`);
    } catch (error) {
      debugLog('initialize', `Exception initializing sync directions: ${error}`);
    }
  }, [sessionId]);

  // Handle real-time sync direction changes
  const handleSyncDirectionChange = useCallback((payload: any) => {
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
        
        // Clear optimistic update once real update arrives
        setOptimisticUpdates(prev => {
          const updated = { ...prev };
          delete updated[participantId];
          return updated;
        });
      }
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!sessionId) return;

    initializeSyncDirections();

    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Set up new subscription
    const channel = supabase
      .channel(`sync-direction-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        handleSyncDirectionChange
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [sessionId, initializeSyncDirections, handleSyncDirectionChange]);

  // Toggle sync direction for a participant
  const toggleSyncDirection = useCallback(async (participantId: number): Promise<boolean> => {
    if (currentUserRole !== 'teacher') {
      debugLog('toggle', 'Only teachers can toggle sync direction');
      return false;
    }

    // Prevent rapid clicks
    if (isUpdating[participantId]) {
      debugLog('toggle', `Participant ${participantId} already updating, ignoring click`);
      return false;
    }

    try {
      setIsUpdating(prev => ({ ...prev, [participantId]: true }));

      // Fetch fresh participant data to get current sync direction
      const { data: participantData, error: fetchError } = await supabase
        .from('session_participants')
        .select('sync_direction')
        .eq('id', participantId)
        .single();

      if (fetchError) {
        debugLog('toggle', `Error fetching participant ${participantId}: ${fetchError.message}`);
        return false;
      }

      const currentDirection = participantData.sync_direction as SyncDirection;
      const newDirection: SyncDirection = currentDirection === 'student_active' 
        ? 'teacher_active' 
        : 'student_active';

      debugLog('toggle', `Toggling participant ${participantId}: ${currentDirection} → ${newDirection}`);

      // Apply optimistic update immediately
      setOptimisticUpdates(prev => ({
        ...prev,
        [participantId]: newDirection
      }));

      // Update database
      const result = await updateParticipantSyncDirection(participantId, newDirection);
      
      if (result.success) {
        debugLog('toggle', `Successfully toggled participant ${participantId} to ${newDirection}`);
        return true;
      } else {
        debugLog('toggle', `Failed to toggle participant ${participantId}: ${result.error}`);
        
        // Remove optimistic update on failure
        setOptimisticUpdates(prev => {
          const updated = { ...prev };
          delete updated[participantId];
          return updated;
        });
        return false;
      }
    } catch (error) {
      debugLog('toggle', `Exception toggling participant ${participantId}: ${error}`);
      
      // Remove optimistic update on failure
      setOptimisticUpdates(prev => {
        const updated = { ...prev };
        delete updated[participantId];
        return updated;
      });
      return false;
    } finally {
      setIsUpdating(prev => ({ ...prev, [participantId]: false }));
    }
  }, [currentUserRole, isUpdating]);

  // Get sync direction for a specific participant (including optimistic updates)
  const getSyncDirection = useCallback((participantId: number): SyncDirection => {
    // Check optimistic updates first, then actual state
    return optimisticUpdates[participantId] || syncDirections[participantId] || 'student_active';
  }, [syncDirections, optimisticUpdates]);

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
    initializeSyncDirections
  };
};

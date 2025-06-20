import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionParticipant, SyncDirection } from '@/types/student';
import { updateParticipantSyncDirection } from '@/utils/syncDirection';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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

  // Enhanced toggle with optimistic updates and error handling
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

    // Step 1: Set loading state immediately to prevent rapid clicks
    setIsUpdating(prev => ({ ...prev, [participantId]: true }));

    // Step 2: Optimistic update - immediately update local state for instant UI feedback
    setSyncDirections(prev => ({
      ...prev,
      [participantId]: newDirection
    }));

    try {
      // Step 3: Make async database call
      const result = await updateParticipantSyncDirection(participantId, newDirection);
      
      if (result.success) {
        debugLog('toggle', `Successfully toggled participant ${participantId} to ${newDirection}`);
        // Success - the real-time listener will confirm the state, no need to update again
        return true;
      } else {
        debugLog('toggle', `Failed to toggle participant ${participantId}: ${result.error}`);
        
        // Step 4: Rollback optimistic update on failure
        setSyncDirections(prev => ({
          ...prev,
          [participantId]: currentDirection
        }));
        
        // Show error toast
        toast({
          title: "Sync Direction Update Failed",
          description: result.error || "Unable to update sync direction. Please try again.",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error) {
      debugLog('toggle', `Exception toggling participant ${participantId}: ${error}`);
      
      // Step 4: Rollback optimistic update on exception
      setSyncDirections(prev => ({
        ...prev,
        [participantId]: currentDirection
      }));
      
      // Show error toast
      toast({
        title: "Sync Direction Update Failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      // Step 5: Always clear loading state
      setIsUpdating(prev => ({ ...prev, [participantId]: false }));
    }
  }, [syncDirections, currentUserRole, toast]);

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
    initializeSyncDirections
  };
};

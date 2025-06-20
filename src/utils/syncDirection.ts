
import { supabase } from '@/integrations/supabase/client';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { SyncDirection } from '@/types/student';

const debugLog = createDebugLogger('sync-direction');

/**
 * Update sync direction for a specific session participant with timeout protection
 */
export const updateParticipantSyncDirection = async (
  participantId: number,
  newDirection: SyncDirection,
  timeoutMs: number = 10000 // 10 second timeout
): Promise<{ success: boolean; error?: string }> => {
  try {
    debugLog('updateSyncDirection', `Updating participant ${participantId} to ${newDirection}`);
    
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    
    // Race the update against the timeout
    const updatePromise = supabase
      .from('session_participants')
      .update({ sync_direction: newDirection })
      .eq('id', participantId);
    
    const { error } = await Promise.race([updatePromise, timeoutPromise]);

    if (error) {
      debugLog('updateSyncDirection', `Error updating sync direction: ${error.message}`);
      return { success: false, error: error.message };
    }

    debugLog('updateSyncDirection', `Successfully updated participant ${participantId} sync direction`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    debugLog('updateSyncDirection', `Exception updating sync direction: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get current sync direction for a participant
 */
export const getParticipantSyncDirection = async (
  participantId: number
): Promise<{ direction?: SyncDirection; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .select('sync_direction')
      .eq('id', participantId)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { direction: data.sync_direction as SyncDirection };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage };
  }
};

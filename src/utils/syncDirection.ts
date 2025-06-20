
import { supabase } from '@/integrations/supabase/client';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { SyncDirection } from '@/types/student';

const debugLog = createDebugLogger('sync-direction');

/**
 * Update sync direction for a specific session participant
 */
export const updateParticipantSyncDirection = async (
  participantId: number,
  newDirection: SyncDirection
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate inputs
    if (!participantId || typeof participantId !== 'number') {
      const error = `Invalid participant ID: ${participantId}`;
      debugLog('updateSyncDirection', error);
      return { success: false, error };
    }

    if (!newDirection || !['student_active', 'teacher_active'].includes(newDirection)) {
      const error = `Invalid sync direction: ${newDirection}`;
      debugLog('updateSyncDirection', error);
      return { success: false, error };
    }

    debugLog('updateSyncDirection', `Updating participant ${participantId} to ${newDirection}`);
    
    const { data, error } = await supabase
      .from('session_participants')
      .update({ sync_direction: newDirection })
      .eq('id', participantId)
      .select('id, sync_direction');

    if (error) {
      debugLog('updateSyncDirection', `Database error updating sync direction: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      const error = `No participant found with ID ${participantId}`;
      debugLog('updateSyncDirection', error);
      return { success: false, error };
    }

    debugLog('updateSyncDirection', `Successfully updated participant ${participantId} sync direction to ${newDirection}`, data[0]);
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
    // Validate input
    if (!participantId || typeof participantId !== 'number') {
      return { error: `Invalid participant ID: ${participantId}` };
    }

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

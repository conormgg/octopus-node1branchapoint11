
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SessionParticipant {
  id: number;
  session_id: string;
  student_name: string;
  student_email?: string;
  assigned_board_suffix: string;
  sync_direction: 'teacher_to_student' | 'student_to_teacher';
  joined_at: string;
}

export const useSessionParticipants = (sessionId?: string) => {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const cleanupCalledRef = useRef(false);

  // Fetch initial participants
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId)
          .order('joined_at', { ascending: true });

        if (error) throw error;
        setParticipants((data || []) as SessionParticipant[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch participants'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [sessionId]);

  // Set up real-time subscription with proper cleanup
  useEffect(() => {
    if (!sessionId) return;

    // Generate unique channel name to prevent conflicts
    const channelName = `session-participants-${sessionId}-${Date.now()}`;
    
    // Clean up any existing channel first
    if (channelRef.current && !cleanupCalledRef.current) {
      console.log('[SessionParticipants] Cleaning up existing channel before creating new one');
      supabase.removeChannel(channelRef.current);
      isSubscribedRef.current = false;
    }

    // Reset cleanup flag
    cleanupCalledRef.current = false;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[SessionParticipants] Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setParticipants(prev => [...prev, payload.new as SessionParticipant]);
          } else if (payload.eventType === 'UPDATE') {
            setParticipants(prev => 
              prev.map(p => p.id === payload.new.id ? payload.new as SessionParticipant : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      );

    // Store channel reference
    channelRef.current = channel;

    // Subscribe only if not already subscribed
    if (!isSubscribedRef.current) {
      channel.subscribe((status) => {
        console.log(`[SessionParticipants] Subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CLOSED') {
          isSubscribedRef.current = false;
        }
      });
    }

    return () => {
      if (!cleanupCalledRef.current) {
        console.log('[SessionParticipants] Cleaning up subscription');
        cleanupCalledRef.current = true;
        isSubscribedRef.current = false;
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    };
  }, [sessionId]);

  // Update sync direction for a participant
  const updateSyncDirection = async (participantId: number, syncDirection: 'teacher_to_student' | 'student_to_teacher') => {
    try {
      const { error } = await supabase
        .from('session_participants')
        .update({ sync_direction: syncDirection })
        .eq('id', participantId);

      if (error) throw error;
      
      console.log(`[SessionParticipants] Updated sync direction for participant ${participantId} to ${syncDirection}`);
    } catch (err) {
      console.error('[SessionParticipants] Failed to update sync direction:', err);
      throw err;
    }
  };

  return {
    participants,
    isLoading,
    error,
    updateSyncDirection
  };
};

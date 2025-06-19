import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';
import { useToast } from '@/hooks/use-toast';

export const useSessionStudents = (activeSession: Session | null | undefined) => {
  const [sessionStudents, setSessionStudents] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Refs for retry mechanism and polling
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>();
  const maxRetries = 3;
  const baseRetryDelay = 1000; // 1 second

  const fetchSessionStudents = useCallback(async () => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      console.log(`[useSessionStudents] Fetching students for session: ${activeSession.id}`);
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('assigned_board_suffix');

      if (error) throw error;
      console.log(`[useSessionStudents] Found ${data?.length || 0} students:`, data);
      setSessionStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching session students:', error);
      toast({
        title: "Error fetching students",
        description: error.message || "Failed to load session participants",
        variant: "destructive"
      });
      setSessionStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, toast]);

  // Start fallback polling when real-time fails
  const startFallbackPolling = useCallback(() => {
    console.log('[useSessionStudents] Starting fallback polling every 5 seconds');
    pollingIntervalRef.current = setInterval(() => {
      fetchSessionStudents();
    }, 5000);
    
    toast({
      title: "Real-time updates unavailable",
      description: "Using polling for updates - some delays may occur",
      variant: "destructive"
    });
  }, [fetchSessionStudents, toast]);

  // Stop fallback polling
  const stopFallbackPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('[useSessionStudents] Stopping fallback polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = undefined;
    }
  }, []);

  // Retry subscription with exponential backoff
  const retrySubscription = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      console.log('[useSessionStudents] Max retries reached, starting fallback polling');
      startFallbackPolling();
      return;
    }

    const delay = baseRetryDelay * Math.pow(2, retryCountRef.current);
    console.log(`[useSessionStudents] Retrying subscription in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
    
    retryTimeoutRef.current = setTimeout(() => {
      retryCountRef.current++;
      setupRealtimeSubscription();
    }, delay);
  }, [startFallbackPolling]);

  // Setup real-time subscription with robust error handling
  const setupRealtimeSubscription = useCallback(() => {
    if (!activeSession) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log(`[useSessionStudents] Setting up real-time subscription for session: ${activeSession.id}`);
    
    channelRef.current = supabase
      .channel(`session-participants-${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${activeSession.id}`
        },
        (payload) => {
          console.log('[useSessionStudents] Real-time change received from session_participants:', payload);
          fetchSessionStudents();
        }
      )
      .subscribe((status) => {
        console.log(`[useSessionStudents] Subscription status: ${status} for session ${activeSession.id}`);
        
        if (status === 'SUBSCRIBED') {
          console.log(`[useSessionStudents] Successfully subscribed to participant updates for session ${activeSession.id}`);
          // Reset retry count on successful subscription
          retryCountRef.current = 0;
          // Stop fallback polling if it was running
          stopFallbackPolling();
        } else if (status === 'TIMED_OUT') {
          console.error(`[useSessionStudents] Subscription timed out for session ${activeSession.id}`);
          retrySubscription();
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[useSessionStudents] Channel error for session ${activeSession.id}`);
          retrySubscription();
        } else if (status === 'CLOSED') {
          console.log(`[useSessionStudents] Channel closed for session ${activeSession.id}`);
        }
      });
  }, [activeSession, fetchSessionStudents, retrySubscription, stopFallbackPolling]);

  useEffect(() => {
    if (activeSession) {
      // Reset retry count for new session
      retryCountRef.current = 0;
      
      // Fetch initial data
      fetchSessionStudents();
      
      // Setup real-time subscription
      setupRealtimeSubscription();

      return () => {
        console.log(`[useSessionStudents] Cleaning up subscription for session: ${activeSession.id}`);
        
        // Clear retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        // Stop polling
        stopFallbackPolling();
        
        // Remove channel
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      };
    }
  }, [activeSession, fetchSessionStudents, setupRealtimeSubscription, stopFallbackPolling]);

  // Get students with their join status
  const getStudentsWithStatus = () => {
    return sessionStudents.map(student => ({
      ...student,
      hasJoined: student.joined_at !== null,
      boardId: `student-${student.assigned_board_suffix.toLowerCase()}`,
      status: student.joined_at ? 'active' : 'pending' as 'active' | 'pending'
    }));
  };

  // Count active students (who have actually joined)
  const activeStudentCount = sessionStudents.filter(s => s.joined_at !== null).length;
  const totalStudentCount = sessionStudents.length;

  // Add individual student with name and email
  const handleAddIndividualStudent = async (name: string, email: string) => {
    if (!activeSession) {
      toast({
        title: "Error",
        description: "No active session found.",
        variant: "destructive",
      });
      return;
    }

    if (sessionStudents.length >= 8) {
      toast({
        title: "Maximum Students Reached",
        description: "Cannot add more than 8 students to a session.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the next available board suffix
      const usedSuffixes = sessionStudents.map(s => s.assigned_board_suffix);
      const availableSuffixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const nextSuffix = availableSuffixes.find(suffix => !usedSuffixes.includes(suffix));

      if (!nextSuffix) {
        toast({
          title: "Error",
          description: "No available board positions.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: activeSession.id,
          student_name: name,
          student_email: email || null,
          assigned_board_suffix: nextSuffix,
          joined_at: null // Start as pending
        });

      if (error) throw error;

      toast({
        title: "Student Added",
        description: `${name} has been added to the session.`,
      });
    } catch (error) {
      console.error('Error adding individual student:', error);
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Remove individual student by participant ID
  const handleRemoveIndividualStudent = async (participantId: number) => {
    if (!activeSession) {
      toast({
        title: "Error",
        description: "No active session found.",
        variant: "destructive",
      });
      return;
    }

    const student = sessionStudents.find(s => s.id === participantId);
    if (!student) {
      toast({
        title: "Error",
        description: "Student not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      toast({
        title: "Student Removed",
        description: `${student.student_name} has been removed from the session.`,
      });
    } catch (error) {
      console.error('Error removing individual student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    sessionStudents,
    studentsWithStatus: getStudentsWithStatus(),
    activeStudentCount,
    totalStudentCount,
    handleAddIndividualStudent,
    handleRemoveIndividualStudent,
    isLoading,
  };
};

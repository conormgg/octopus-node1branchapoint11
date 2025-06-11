
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionStudent {
  id: number;
  student_name: string;
  student_email?: string;
  assigned_board_suffix: string;
}

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
}

export const useSessionStudents = (activeSession: Session | null | undefined) => {
  const [sessionStudents, setSessionStudents] = useState<SessionStudent[]>([]);

  useEffect(() => {
    if (activeSession) {
      fetchSessionStudents();
      
      // Set up real-time subscription for session participants
      const channel = supabase
        .channel(`session-participants-${activeSession.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${activeSession.id}`
          },
          () => {
            // Refetch when participants change
            fetchSessionStudents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeSession]);

  const fetchSessionStudents = async () => {
    if (!activeSession) return;

    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('assigned_board_suffix');

      if (error) throw error;
      setSessionStudents(data || []);
    } catch (error) {
      console.error('Error fetching session students:', error);
      setSessionStudents([]);
    }
  };

  const handleStudentCountChange = async (newCount: number) => {
    if (!activeSession) return;
    
    const clampedCount = Math.max(1, Math.min(8, newCount));
    const currentCount = sessionStudents.length;
    
    try {
      if (clampedCount > currentCount) {
        // Add new students
        const studentsToAdd = clampedCount - currentCount;
        const newStudents = [];
        
        for (let i = 0; i < studentsToAdd; i++) {
          const suffix = String.fromCharCode(65 + currentCount + i); // A, B, C, etc.
          newStudents.push({
            session_id: activeSession.id,
            student_name: `Student ${suffix}`,
            assigned_board_suffix: suffix,
          });
        }
        
        const { error } = await supabase
          .from('session_participants')
          .insert(newStudents);
          
        if (error) throw error;
      } else if (clampedCount < currentCount) {
        // Remove students (remove from the end)
        const studentsToRemove = currentCount - clampedCount;
        const idsToRemove = sessionStudents
          .slice(-studentsToRemove)
          .map(student => student.id);
          
        const { error } = await supabase
          .from('session_participants')
          .delete()
          .in('id', idsToRemove);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating session students:', error);
    }
  };

  return {
    sessionStudents,
    handleStudentCountChange,
    studentCount: sessionStudents.length,
  };
};

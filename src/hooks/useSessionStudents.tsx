
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

  const handleStudentCountChange = (newCount: number) => {
    // For now, this creates a simulation of students for UI testing
    // In real implementation, this would add/remove students from the session
    const clampedCount = Math.max(1, Math.min(8, newCount));
    
    // Create mock student data for UI testing
    const mockStudents: SessionStudent[] = Array.from({ length: clampedCount }, (_, i) => ({
      id: i + 1,
      student_name: `Student ${String.fromCharCode(65 + i)}`,
      assigned_board_suffix: String.fromCharCode(65 + i),
    }));
    
    setSessionStudents(mockStudents);
  };

  return {
    sessionStudents,
    handleStudentCountChange,
    studentCount: sessionStudents.length,
  };
};

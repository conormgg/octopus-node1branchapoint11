
import { useMemo } from 'react';
import { Student } from '@/types/student';
import { OriginalTemplateData } from '@/types/templates';

interface UseTemplateChangeDetectionProps {
  title: string;
  duration: number | '';
  students: Student[];
  originalTemplateData: OriginalTemplateData | null;
}

export const useTemplateChangeDetection = ({
  title,
  duration,
  students,
  originalTemplateData,
}: UseTemplateChangeDetectionProps) => {
  const hasUnsavedChanges = useMemo(() => {
    if (!originalTemplateData) return false;

    // Check if title changed
    if (title !== originalTemplateData.title) return true;

    // Check if duration changed
    if (duration !== originalTemplateData.duration) return true;

    // Check if students changed (length)
    if (students.length !== originalTemplateData.students.length) return true;

    // Check if any student data changed
    for (let i = 0; i < students.length; i++) {
      const current = students[i];
      const original = originalTemplateData.students[i];
      
      if (!original) return true;
      if (current.name !== original.name || current.email !== original.email) {
        return true;
      }
    }

    return false;
  }, [title, duration, students, originalTemplateData]);

  return { hasUnsavedChanges };
};

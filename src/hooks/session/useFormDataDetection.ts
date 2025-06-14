
import { Student } from '@/types/student';

interface UseFormDataDetectionProps {
  title: string;
  duration: number | '';
  students: Student[];
  selectedTemplateId: string;
}

export const useFormDataDetection = ({
  title,
  duration,
  students,
  selectedTemplateId,
}: UseFormDataDetectionProps) => {
  const hasFormData = () => {
    // Check if title has content
    if (title.trim()) return true;
    
    // Check if duration has content
    if (duration !== '') return true;
    
    // Check if any student has a name filled in
    if (students.some(student => student.name.trim() || student.email.trim())) return true;
    
    // Check if a template is selected
    if (selectedTemplateId) return true;
    
    return false;
  };

  return {
    shouldShowResetButton: hasFormData(),
  };
};

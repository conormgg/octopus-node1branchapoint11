
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Student, OriginalTemplateData } from './types';

interface ClassTemplate {
  id: number;
  class_name: string;
  duration_minutes: number | null;
  students: Array<{
    student_name: string;
    student_email: string | null;
  }>;
}

interface UseTemplateSelectionProps {
  templates: ClassTemplate[];
  setTitle: (title: string) => void;
  setDuration: (duration: number | '') => void;
  setStudents: (students: Student[]) => void;
  resetForm: () => void;
}

export const useTemplateSelection = ({
  templates,
  setTitle,
  setDuration,
  setStudents,
  resetForm,
}: UseTemplateSelectionProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [originalTemplateData, setOriginalTemplateData] = useState<OriginalTemplateData | null>(null);
  const { toast } = useToast();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === parseInt(templateId));
      if (template) {
        const templateTitle = template.class_name;
        const templateDuration = template.duration_minutes || '';
        const templateStudents: Student[] = template.students.length > 0 
          ? template.students.map(student => ({
              name: student.student_name,
              email: student.student_email || '',
            }))
          : [{ name: '', email: '' }];

        // Set form data
        setTitle(templateTitle);
        setDuration(templateDuration);
        setStudents(templateStudents);

        // Store original template data for change detection
        setOriginalTemplateData({
          id: template.id,
          title: templateTitle,
          duration: templateDuration,
          students: templateStudents,
        });

        toast({
          title: "Template Loaded",
          description: `Loaded "${template.class_name}"${template.students.length > 0 ? ` with ${template.students.length} students` : ''}.`,
        });
      } else {
        // If template not found (e.g., after deletion), clear state
        setOriginalTemplateData(null);
        if (selectedTemplateId === templateId) {
          resetForm();
        }
      }
    } else {
      // Clear template data when no template is selected
      setOriginalTemplateData(null);
    }
  };

  const clearSelection = () => {
    setSelectedTemplateId('');
    setOriginalTemplateData(null);
  };

  return {
    selectedTemplateId,
    originalTemplateData,
    setOriginalTemplateData,
    handleTemplateSelect,
    clearSelection,
  };
};

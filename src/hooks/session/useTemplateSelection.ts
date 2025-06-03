
import { useState, useCallback } from 'react';
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
  setOriginalTemplateData: (data: OriginalTemplateData | null) => void;
  setIsClearedTemplate: (cleared: boolean) => void;
}

export const useTemplateSelection = ({
  templates,
  setTitle,
  setDuration,
  setStudents,
  setOriginalTemplateData,
  setIsClearedTemplate,
}: UseTemplateSelectionProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const { toast } = useToast();

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsClearedTemplate(false);
    
    if (templateId) {
      const template = templates.find(t => t.id === parseInt(templateId));
      if (template) {
        const templateTitle = template.class_name;
        const templateDuration = template.duration_minutes || '';
        const templateStudents = template.students.length > 0 
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
      }
    } else {
      // Clear template data when no template is selected
      setOriginalTemplateData(null);
      setIsClearedTemplate(false);
    }
  }, [templates, setTitle, setDuration, setStudents, setOriginalTemplateData, setIsClearedTemplate, toast]);

  const loadedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);

  return {
    selectedTemplateId,
    loadedTemplate,
    handleTemplateSelect,
    setSelectedTemplateId,
  };
};

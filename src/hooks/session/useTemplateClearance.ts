import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Student, OriginalTemplateData } from './types';

interface UseTemplateClearanceProps {
  title: string;
  duration: number | '';
  students: Student[];
  originalTemplateData: OriginalTemplateData | null;
  setSelectedTemplateId: (id: string) => void;
  setOriginalTemplateData: (data: OriginalTemplateData | null) => void;
  setIsClearedTemplate: (cleared: boolean) => void;
  openClearTemplateDialog: (templateName: string) => void;
}

export const useTemplateClearance = ({
  title,
  duration,
  students,
  originalTemplateData,
  setSelectedTemplateId,
  setOriginalTemplateData,
  setIsClearedTemplate,
  openClearTemplateDialog,
}: UseTemplateClearanceProps) => {
  const { toast } = useToast();

  // Check if form has significant data worth confirming before clearing
  const hasSignificantData = useCallback(() => {
    const validStudents = students.filter(student => student.name.trim()).length;
    const hasTitle = title.trim().length > 0;
    const hasDuration = duration !== '';
    
    return validStudents > 1 || hasTitle || hasDuration;
  }, [title, duration, students]);

  const handleClearTemplate = useCallback(() => {
    if (!originalTemplateData) return;

    // If there are unsaved changes and significant data, show confirmation dialog
    if (hasSignificantData()) {
      openClearTemplateDialog(originalTemplateData.title);
      return;
    }

    // Otherwise, clear immediately
    confirmClearTemplate();
  }, [originalTemplateData, hasSignificantData, openClearTemplateDialog]);

  const confirmClearTemplate = useCallback(() => {
    setSelectedTemplateId('');
    setOriginalTemplateData(null);
    setIsClearedTemplate(true);
    
    toast({
      title: "Template Cleared",
      description: "Working with a copy of the template data. You can now save this as a new template.",
      variant: "default",
    });
  }, [setSelectedTemplateId, setOriginalTemplateData, setIsClearedTemplate, toast]);

  return {
    handleClearTemplate,
    confirmClearTemplate,
    hasSignificantData,
  };
};

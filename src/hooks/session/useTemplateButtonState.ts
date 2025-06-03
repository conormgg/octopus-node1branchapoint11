
import { useMemo } from 'react';
import { Student, OriginalTemplateData, TemplateButtonState } from './types';

interface UseTemplateButtonStateProps {
  students: Student[];
  originalTemplateData: OriginalTemplateData | null;
  hasUnsavedChanges: boolean;
  isClearedTemplate: boolean;
}

export const useTemplateButtonState = ({
  students,
  originalTemplateData,
  hasUnsavedChanges,
  isClearedTemplate,
}: UseTemplateButtonStateProps) => {
  const isTemplateLoaded = Boolean(originalTemplateData);

  const templateButtonState = useMemo((): TemplateButtonState => {
    const hasValidStudents = students.some(student => student.name.trim());
    
    if (isClearedTemplate) {
      // Template was cleared - show save button if there are valid students
      return hasValidStudents ? 'save' : 'none';
    }
    
    if (!isTemplateLoaded) {
      // No template loaded - show save button if there are valid students
      return hasValidStudents ? 'save' : 'none';
    }

    if (hasUnsavedChanges) {
      // Template loaded with changes - show update button and save as new option
      return 'update';
    }

    // Template loaded without changes - hide buttons
    return 'none';
  }, [isTemplateLoaded, hasUnsavedChanges, students, isClearedTemplate]);

  // Show "Save as New" option when template is loaded and has changes, or when template is cleared
  const showSaveAsNewOption = (isTemplateLoaded && hasUnsavedChanges) || isClearedTemplate;

  return {
    templateButtonState,
    showSaveAsNewOption,
    isTemplateLoaded,
    isClearedTemplate,
  };
};

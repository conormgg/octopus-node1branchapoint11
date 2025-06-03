
import { useMemo } from 'react';
import { Student, OriginalTemplateData, TemplateButtonState } from './types';

interface UseTemplateButtonStateProps {
  students: Student[];
  originalTemplateData: OriginalTemplateData | null;
  hasUnsavedChanges: boolean;
}

export const useTemplateButtonState = ({
  students,
  originalTemplateData,
  hasUnsavedChanges,
}: UseTemplateButtonStateProps) => {
  const isTemplateLoaded = Boolean(originalTemplateData);

  const templateButtonState = useMemo((): TemplateButtonState => {
    const hasValidStudents = students.some(student => student.name.trim());
    
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
  }, [isTemplateLoaded, hasUnsavedChanges, students]);

  // Show "Save as New" option when template is loaded and has changes
  const showSaveAsNewOption = isTemplateLoaded && hasUnsavedChanges;

  return {
    templateButtonState,
    showSaveAsNewOption,
    isTemplateLoaded,
  };
};

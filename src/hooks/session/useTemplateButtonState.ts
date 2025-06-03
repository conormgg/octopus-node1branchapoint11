
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
  const hasValidStudents = students.some(student => student.name.trim());

  const templateButtonState = useMemo((): TemplateButtonState => {
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
  }, [isTemplateLoaded, hasUnsavedChanges, hasValidStudents]);

  // Show "Save as New" option when template is loaded and has changes
  const showSaveAsNewOption = isTemplateLoaded && hasUnsavedChanges;

  // Determine if we should show a confirmation dialog when clearing
  const shouldConfirmClear = hasValidStudents && (students.length > 2 || students.some(s => s.email.trim()));

  return {
    templateButtonState,
    showSaveAsNewOption,
    isTemplateLoaded,
    shouldConfirmClear,
  };
};

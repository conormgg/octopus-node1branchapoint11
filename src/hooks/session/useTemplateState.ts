
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useTemplateChangeDetection } from './useTemplateChangeDetection';
import { useTemplateButtonState } from './useTemplateButtonState';
import { useFormDataDetection } from './useFormDataDetection';
import { useCompleteReset } from './useCompleteReset';
import { useTemplateSelection } from './useTemplateSelection';
import { useTemplateOperationHandlers } from './useTemplateOperationHandlers';
import { Student } from './types';

interface UseTemplateStateProps {
  title: string;
  duration: number | '';
  students: Student[];
  setTitle: (title: string) => void;
  setDuration: (duration: number | '') => void;
  setStudents: (students: Student[]) => void;
  resetForm: () => void;
}

export const useTemplateState = ({
  title,
  duration,
  students,
  setTitle,
  setDuration,
  setStudents,
  resetForm,
}: UseTemplateStateProps) => {
  const { templates, isLoading } = useClassTemplates();

  // Template selection logic
  const {
    selectedTemplateId,
    originalTemplateData,
    setOriginalTemplateData,
    handleTemplateSelect,
    clearSelection,
  } = useTemplateSelection({
    templates,
    setTitle,
    setDuration,
    setStudents,
    resetForm,
  });

  // Template state tracking
  const loadedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);

  // Change detection
  const { hasUnsavedChanges } = useTemplateChangeDetection({
    title,
    duration,
    students,
    originalTemplateData,
  });

  // Button state logic
  const { templateButtonState, showSaveAsNewOption, isTemplateLoaded } = useTemplateButtonState({
    students,
    originalTemplateData,
    hasUnsavedChanges,
  });

  // Form data detection for reset button
  const { shouldShowResetButton } = useFormDataDetection({
    title,
    duration,
    students,
    selectedTemplateId,
  });

  // Complete reset functionality
  const { handleCompleteReset } = useCompleteReset({
    setSelectedTemplateId: (id: string) => {
      clearSelection();
      if (id) handleTemplateSelect(id);
    },
    setOriginalTemplateData,
    resetForm,
  });

  // Template operation handlers
  const {
    templateActions,
    handleDeleteTemplate,
    handleSaveTemplate,
    handleUpdateTemplate,
    handleSaveAsNew,
    handleConfirmAction,
  } = useTemplateOperationHandlers({
    title,
    duration,
    students,
    originalTemplateData,
    selectedTemplateId,
    setOriginalTemplateData,
    handleTemplateSelect,
    clearSelection,
    resetForm,
  });

  return {
    templates,
    isLoading,
    selectedTemplateId,
    templateButtonState,
    loadedTemplate,
    hasUnsavedChanges,
    showSaveAsNewOption,
    shouldShowResetButton,
    templateActions,
    handleTemplateSelect,
    handleDeleteTemplate,
    handleSaveTemplate,
    handleUpdateTemplate,
    handleSaveAsNew,
    handleConfirmAction,
    handleCompleteReset,
  };
};

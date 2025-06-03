
import { useState } from 'react';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useToast } from '@/hooks/use-toast';
import { useTemplateActions } from './useTemplateActions';
import { useTemplateChangeDetection } from './useTemplateChangeDetection';
import { useTemplateButtonState } from './useTemplateButtonState';
import { useTemplateOperations } from './useTemplateOperations';
import { useTemplateSelection } from './useTemplateSelection';
import { useTemplateClearance } from './useTemplateClearance';
import { useTemplateKeyboardShortcuts } from './useTemplateKeyboardShortcuts';
import { Student, OriginalTemplateData } from './types';

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
  const { templates, deleteTemplate, isLoading } = useClassTemplates();
  const [originalTemplateData, setOriginalTemplateData] = useState<OriginalTemplateData | null>(null);
  const [isClearedTemplate, setIsClearedTemplate] = useState(false);
  const { toast } = useToast();
  const templateActions = useTemplateActions();

  // Template selection hook
  const {
    selectedTemplateId,
    loadedTemplate,
    handleTemplateSelect,
    setSelectedTemplateId,
  } = useTemplateSelection({
    templates,
    setTitle,
    setDuration,
    setStudents,
    setOriginalTemplateData,
    setIsClearedTemplate,
  });

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
    isClearedTemplate,
  });

  // Template operations
  const { handleSaveTemplate, confirmUpdateTemplate, confirmSaveAsNew } = useTemplateOperations({
    originalTemplateData,
    title,
    duration,
    students,
    setOriginalTemplateData,
  });

  // Template clearance hook
  const { handleClearTemplate, confirmClearTemplate } = useTemplateClearance({
    title,
    duration,
    students,
    originalTemplateData,
    setSelectedTemplateId,
    setOriginalTemplateData,
    setIsClearedTemplate,
    openClearTemplateDialog: templateActions.openClearTemplateDialog,
  });

  // Keyboard shortcuts
  useTemplateKeyboardShortcuts({
    originalTemplateData,
    isClearedTemplate,
    handleClearTemplate,
  });

  const handleEditTemplate = (template: any) => {
    toast({
      title: "Edit Template",
      description: `Editing functionality for "${template.class_name}" will be implemented soon.`,
    });
  };

  const handleDeleteTemplate = async (template: any) => {
    templateActions.openDeleteDialog(template.id, template.class_name);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateActions.actionState.templateId) return;
    
    const success = await deleteTemplate(
      templateActions.actionState.templateId, 
      templateActions.actionState.templateName || ''
    );
    
    // If the deleted template was currently selected, clear the selection and reset form
    if (success && selectedTemplateId === templateActions.actionState.templateId.toString()) {
      setSelectedTemplateId('');
      setOriginalTemplateData(null);
      setIsClearedTemplate(false);
      resetForm();
    }
  };

  const handleUpdateTemplate = async () => {
    if (!originalTemplateData) return;
    
    templateActions.openUpdateDialog(originalTemplateData.id, originalTemplateData.title);
  };

  const handleSaveAsNew = () => {
    templateActions.openSaveAsNewDialog(title);
  };

  const handleConfirmAction = () => {
    switch (templateActions.actionState.type) {
      case 'delete':
        confirmDeleteTemplate();
        break;
      case 'update':
        confirmUpdateTemplate();
        break;
      case 'saveAsNew':
        confirmSaveAsNew();
        break;
      case 'clearTemplate':
        confirmClearTemplate();
        break;
    }
  };

  return {
    templates,
    isLoading,
    selectedTemplateId,
    templateButtonState,
    loadedTemplate,
    hasUnsavedChanges,
    showSaveAsNewOption,
    isClearedTemplate,
    templateActions,
    handleTemplateSelect,
    handleClearTemplate,
    handleEditTemplate,
    handleDeleteTemplate,
    handleSaveTemplate,
    handleUpdateTemplate,
    handleSaveAsNew,
    handleConfirmAction,
  };
};


import { useFormState } from './session/useFormState';
import { useTemplateState } from './session/useTemplateState';
import { useSessionCreation } from './session/useSessionCreation';

export const useCreateSessionForm = (onSessionCreated: (sessionId: string) => void) => {
  const formState = useFormState();
  const templateState = useTemplateState(formState);
  const sessionCreation = useSessionCreation({
    title: formState.title,
    duration: formState.duration,
    students: formState.students,
    setIsLoading: formState.setIsLoading,
  });

  const handleSubmit = (e: React.FormEvent) => {
    sessionCreation.handleSubmit(e, onSessionCreated);
  };

  return {
    // Form state
    title: formState.title,
    duration: formState.duration,
    students: formState.students,
    isLoading: formState.isLoading,
    setTitle: formState.setTitle,
    setDuration: formState.setDuration,
    
    // Form actions
    addStudent: formState.addStudent,
    removeStudent: formState.removeStudent,
    updateStudent: formState.updateStudent,
    
    // Template state
    selectedTemplateId: templateState.selectedTemplateId,
    templates: templateState.templates,
    templateButtonState: templateState.templateButtonState,
    loadedTemplate: templateState.loadedTemplate,
    hasUnsavedChanges: templateState.hasUnsavedChanges,
    showSaveAsNewOption: templateState.showSaveAsNewOption,
    shouldShowResetButton: templateState.shouldShowResetButton,
    templatesLoading: templateState.templates.length === 0,
    templateActions: templateState.templateActions,
    
    // Template actions
    handleTemplateSelect: templateState.handleTemplateSelect,
    handleDeleteTemplate: templateState.handleDeleteTemplate,
    handleSaveTemplate: templateState.handleSaveTemplate,
    handleUpdateTemplate: templateState.handleUpdateTemplate,
    handleSaveAsNew: templateState.handleSaveAsNew,
    handleConfirmAction: templateState.handleConfirmAction,
    handleCompleteReset: templateState.handleCompleteReset,
    
    // Session creation
    handleSubmit,
  };
};

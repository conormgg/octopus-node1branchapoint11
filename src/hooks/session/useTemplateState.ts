
import { useState } from 'react';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useToast } from '@/hooks/use-toast';
import { useTemplateActions } from './useTemplateActions';
import { useTemplateChangeDetection } from './useTemplateChangeDetection';
import { useTemplateButtonState } from './useTemplateButtonState';
import { useTemplateOperations } from './useTemplateOperations';
import { useFormDataDetection } from './useFormDataDetection';
import { useCompleteReset } from './useCompleteReset';
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [originalTemplateData, setOriginalTemplateData] = useState<OriginalTemplateData | null>(null);
  const { toast } = useToast();
  const templateActions = useTemplateActions();

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
    setSelectedTemplateId,
    setOriginalTemplateData,
    resetForm,
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
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

  // Template operations
  const { 
    handleSaveTemplate: performSaveTemplate, 
    confirmUpdateTemplate: performUpdateTemplate, 
    confirmSaveAsNew: performSaveAsNew 
  } = useTemplateOperations({
    originalTemplateData,
    title,
    duration,
    students,
    setOriginalTemplateData,
  });

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

  const handleConfirmAction = async () => {
    const actionType = templateActions.actionState.type;
    const currentSelectedTemplateId = selectedTemplateId;

    switch (actionType) {
      case 'delete':
        await confirmDeleteTemplate();
        break;
      case 'update':
        const updateSuccess = await performUpdateTemplate();
        if (updateSuccess && currentSelectedTemplateId) {
          // Re-select to refresh form and originalTemplateData with fresh data from the list
          handleTemplateSelect(currentSelectedTemplateId);
        }
        break;
      case 'saveAsNew':
        const newTemplateId = await performSaveAsNew();
        if (newTemplateId) {
          // After saving as new, select this new template
          handleTemplateSelect(newTemplateId.toString());
        }
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
    shouldShowResetButton,
    templateActions,
    handleTemplateSelect,
    handleDeleteTemplate,
    handleSaveTemplate: performSaveTemplate,
    handleUpdateTemplate,
    handleSaveAsNew,
    handleConfirmAction,
    handleCompleteReset,
  };
};

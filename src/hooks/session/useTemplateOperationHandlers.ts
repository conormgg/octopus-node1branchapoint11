
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useTemplateOperations } from './useTemplateOperations';
import { useTemplateActions } from './useTemplateActions';
import { Student, OriginalTemplateData } from './types';

interface UseTemplateOperationHandlersProps {
  title: string;
  duration: number | '';
  students: Student[];
  originalTemplateData: OriginalTemplateData | null;
  selectedTemplateId: string;
  setOriginalTemplateData: (data: OriginalTemplateData | null) => void;
  handleTemplateSelect: (templateId: string) => void;
  clearSelection: () => void;
  resetForm: () => void;
}

export const useTemplateOperationHandlers = ({
  title,
  duration,
  students,
  originalTemplateData,
  selectedTemplateId,
  setOriginalTemplateData,
  handleTemplateSelect,
  clearSelection,
  resetForm,
}: UseTemplateOperationHandlersProps) => {
  const { deleteTemplate } = useClassTemplates();
  const templateActions = useTemplateActions();

  // Template operations
  const { 
    handleSaveTemplate: performSaveTemplateOperation, 
    confirmUpdateTemplate: performUpdateTemplateOperation, 
    confirmSaveAsNew: performSaveAsNewOperation 
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

  const handleSaveTemplate = async () => {
    const newTemplate = await performSaveTemplateOperation();
    if (newTemplate) {
      handleTemplateSelect(newTemplate.id.toString());
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!templateActions.actionState.templateId) return;
    
    const success = await deleteTemplate(
      templateActions.actionState.templateId, 
      templateActions.actionState.templateName || ''
    );
    
    // If the deleted template was currently selected, clear the selection and reset form
    if (success && selectedTemplateId === templateActions.actionState.templateId.toString()) {
      clearSelection();
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
    const templateIdToActOn = templateActions.actionState.templateId;
    const currentSelectedTemplateIdState = selectedTemplateId;

    templateActions.closeDialog();

    switch (actionType) {
      case 'delete':
        if (templateIdToActOn) {
          await confirmDeleteTemplate();
        }
        break;
      case 'update':
        const { success: updateSuccess, updatedTemplate } = await performUpdateTemplateOperation();
        if (updateSuccess && updatedTemplate) {
          handleTemplateSelect(updatedTemplate.id.toString());
        } else if (updateSuccess && currentSelectedTemplateIdState) {
          handleTemplateSelect(currentSelectedTemplateIdState);
        }
        break;
      case 'saveAsNew':
        const newTemplate = await performSaveAsNewOperation();
        if (newTemplate) {
          handleTemplateSelect(newTemplate.id.toString());
        }
        break;
    }
  };

  return {
    templateActions,
    handleDeleteTemplate,
    handleSaveTemplate,
    handleUpdateTemplate,
    handleSaveAsNew,
    handleConfirmAction,
  };
};

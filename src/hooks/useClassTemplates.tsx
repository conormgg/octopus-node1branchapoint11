
import { useAuth } from '@/hooks/useAuth';
import { useTemplateData } from './templates/useTemplateData';
import { useTemplateOperations } from './templates/useTemplateOperations';
import { Student } from './templates/types';

export const useClassTemplates = () => {
  const { user, isDemoMode } = useAuth();
  const { templates, isLoading, loadTemplate, refreshTemplates } = useTemplateData(user, isDemoMode);
  const { saveTemplate: saveTemplateOperation, updateTemplate: updateTemplateOperation, deleteTemplate: deleteTemplateOperation } = useTemplateOperations();

  const saveTemplate = async (templateName: string, students: Student[], duration?: number | '') => {
    const result = await saveTemplateOperation(user, isDemoMode, templateName, students, duration);
    if (result) {
      await refreshTemplates();
    }
    return result;
  };

  const updateTemplate = async (templateId: number, templateName: string, students: Student[], duration?: number | '') => {
    const success = await updateTemplateOperation(user, isDemoMode, templateId, templateName, students, duration);
    if (success) {
      await refreshTemplates(); // Wait for refresh to complete
    }
    return success;
  };

  const deleteTemplate = async (templateId: number, templateName: string) => {
    const success = await deleteTemplateOperation(user, isDemoMode, templateId, templateName);
    if (success) {
      await refreshTemplates();
    }
    return success;
  };

  return {
    templates,
    isLoading,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    loadTemplate,
    refreshTemplates,
  };
};

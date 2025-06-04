
import { useAuth } from '@/hooks/useAuth';
import { useTemplateData } from './templates/useTemplateData';
import { useTemplateOperations } from './templates/useTemplateOperations';
import { ClassTemplate, Student } from './templates/types';

export const useClassTemplates = () => {
  const { user, isDemoMode } = useAuth();
  const { templates, isLoading, loadTemplate, refreshTemplates } = useTemplateData(user, isDemoMode);
  const { saveTemplate: saveTemplateOperation, updateTemplate: updateTemplateOperation, deleteTemplate: deleteTemplateOperation } = useTemplateOperations();

  const saveTemplate = async (templateName: string, students: Student[], duration?: number | '') => {
    const newTemplateId = await saveTemplateOperation(user, isDemoMode, templateName, students, duration);
    let newTemplateData: ClassTemplate | undefined = undefined;
    if (newTemplateId) {
      const refreshedTemplatesList = await refreshTemplates();
      newTemplateData = refreshedTemplatesList.find(t => t.id === newTemplateId);
    }
    return newTemplateData;
  };

  const updateTemplate = async (templateId: number, templateName: string, students: Student[], duration?: number | '') => {
    const success = await updateTemplateOperation(user, isDemoMode, templateId, templateName, students, duration);
    let updatedTemplateData: ClassTemplate | undefined = undefined;
    if (success) {
      const refreshedTemplatesList = await refreshTemplates();
      updatedTemplateData = refreshedTemplatesList.find(t => t.id === templateId);
    }
    return { success, updatedTemplate: updatedTemplateData };
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

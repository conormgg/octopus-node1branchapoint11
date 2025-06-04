import { useState, useEffect } from 'react';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useTemplateChangeDetection } from './useTemplateChangeDetection';
import { useTemplateButtonState } from './useTemplateButtonState';
import { useFormDataDetection } from './useFormDataDetection';
import { useCompleteReset } from './useCompleteReset';
import { useTemplateOperations } from './useTemplateOperations';
import { useTemplateActions } from './useTemplateActions';
import { useToast } from '@/hooks/use-toast';
import { Student, OriginalTemplateData, ClassTemplate } from './types';

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
  const { 
    templates: initialTemplatesFromHook,
    deleteTemplate, 
    isLoading: templatesLoadingFromHook,
    refreshTemplates: refreshTemplatesViaClassHook
  } = useClassTemplates();
  
  const [currentTemplates, setCurrentTemplates] = useState<ClassTemplate[]>(initialTemplatesFromHook);
  const [isLoading, setIsLoading] = useState(templatesLoadingFromHook);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [originalTemplateData, setOriginalTemplateData] = useState<OriginalTemplateData | null>(null);
  const { toast } = useToast();
  const templateActions = useTemplateActions();

  // Keep currentTemplates in sync with the hook's templates
  useEffect(() => {
    setCurrentTemplates(initialTemplatesFromHook);
  }, [initialTemplatesFromHook]);
  
  useEffect(() => {
    setIsLoading(templatesLoadingFromHook);
  }, [templatesLoadingFromHook]);

  // Template selection logic
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (templateId) {
      const template = currentTemplates.find(t => t.id === parseInt(templateId));
      if (template) {
        const templateTitle = template.class_name;
        const templateDuration = template.duration_minutes || '';
        const templateStudentsForm: Student[] = template.students.length > 0 
          ? template.students.map(student => ({
              name: student.student_name,
              email: student.student_email || '',
            }))
          : [{ name: '', email: '' }];

        setTitle(templateTitle);
        setDuration(templateDuration);
        setStudents(templateStudentsForm);

        setOriginalTemplateData({
          id: template.id,
          title: templateTitle,
          duration: templateDuration,
          students: templateStudentsForm,
        });

        toast({
          title: "Template Loaded",
          description: `Loaded "${template.class_name}"${template.students.length > 0 ? ` with ${template.students.length} students` : ''}.`,
        });
      } else {
        setOriginalTemplateData(null);
        if (selectedTemplateId === templateId) resetForm();
      }
    } else {
      setOriginalTemplateData(null);
    }
  };

  const clearSelection = () => {
    setSelectedTemplateId('');
    setOriginalTemplateData(null);
  };

  // Template state tracking
  const loadedTemplate = currentTemplates.find(t => t.id.toString() === selectedTemplateId);

  // Change detection
  const { hasUnsavedChanges } = useTemplateChangeDetection({
    title,
    duration,
    students,
    originalTemplateData,
  });

  // Button state logic
  const { templateButtonState, showSaveAsNewOption } = useTemplateButtonState({
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
    setSelectedTemplateId: clearSelection,
    setOriginalTemplateData,
    resetForm,
  });

  // Template operations
  const { 
    saveTemplate: performSaveTemplate,
    updateTemplate: performUpdateTemplate, 
    saveAsNew: performSaveAsNew 
  } = useTemplateOperations({
    originalTemplateData,
    title,
    duration,
    students,
    setOriginalTemplateData,
  });

  // Delete action setup
  const handleDeleteTemplate = (template: ClassTemplate) => {
    templateActions.openDeleteDialog(template.id, template.class_name);
  };
  
  // Update and Save As New Dialog Openers
  const handleUpdateTemplate = () => {
    if (!originalTemplateData) return;
    templateActions.openUpdateDialog(originalTemplateData.id, originalTemplateData.title);
  };

  const handleSaveAsNew = () => {
    templateActions.openSaveAsNewDialog(title);
  };

  // Main confirmation logic
  const handleConfirmAction = async () => {
    const actionType = templateActions.actionState.type;
    const templateIdToActOn = templateActions.actionState.templateId;

    templateActions.closeDialog();

    switch (actionType) {
      case 'delete':
        if (templateIdToActOn) {
          const deleteSuccess = await deleteTemplate(
            templateIdToActOn,
            templateActions.actionState.templateName || ''
          );
          if (deleteSuccess) {
            const refreshedAfterDelete = await refreshTemplatesViaClassHook();
            setCurrentTemplates(refreshedAfterDelete);
            if (selectedTemplateId === templateIdToActOn.toString()) {
              clearSelection();
              resetForm();
            }
          }
        }
        break;
      case 'update':
        const { success: updateSuccess, updatedTemplate, refreshedTemplates } = await performUpdateTemplate();

        if (updateSuccess && updatedTemplate && refreshedTemplates) {
          setCurrentTemplates(refreshedTemplates);

          const formStudents: Student[] = updatedTemplate.students.map(s => ({
            name: s.student_name,
            email: s.student_email || '',
          }));
          
          if (formStudents.length === 0 && updatedTemplate.students.length === 0) {
            formStudents.push({ name: '', email: '' });
          }

          setTitle(updatedTemplate.class_name);
          setDuration(updatedTemplate.duration_minutes || '');
          setStudents(formStudents);
          
          setOriginalTemplateData({
            id: updatedTemplate.id,
            title: updatedTemplate.class_name,
            duration: updatedTemplate.duration_minutes || '',
            students: formStudents,
          });
          setSelectedTemplateId(updatedTemplate.id.toString());

          toast({
            title: "Template Updated",
            description: `Template "${updatedTemplate.class_name}" successfully updated.`,
          });
        }
        break;
      case 'saveAsNew':
        const newTemplate = await performSaveAsNew();
        if (newTemplate) {
          const refreshedAfterSaveNew = await refreshTemplatesViaClassHook();
          setCurrentTemplates(refreshedAfterSaveNew);
          handleTemplateSelect(newTemplate.id.toString());
        }
        break;
    }
  };

  return {
    templates: currentTemplates,
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
    handleSaveTemplate: async () => {
      const newSavedTemplate = await performSaveTemplate();
      if (newSavedTemplate) {
        const refreshedAfterSave = await refreshTemplatesViaClassHook();
        setCurrentTemplates(refreshedAfterSave);
        handleTemplateSelect(newSavedTemplate.id.toString());
      }
    },
    handleUpdateTemplate,
    handleSaveAsNew,
    handleConfirmAction,
    handleCompleteReset,
  };
};

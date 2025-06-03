
import { useState } from 'react';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useToast } from '@/hooks/use-toast';
import { useTemplateActions } from './useTemplateActions';
import { useTemplateChangeDetection } from './useTemplateChangeDetection';
import { useTemplateButtonState } from './useTemplateButtonState';
import { useTemplateOperations } from './useTemplateOperations';
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
  const { templateButtonState, showSaveAsNewOption, isTemplateLoaded, shouldConfirmClear } = useTemplateButtonState({
    students,
    originalTemplateData,
    hasUnsavedChanges,
  });

  // Template operations
  const { handleSaveTemplate, confirmUpdateTemplate, confirmSaveAsNew } = useTemplateOperations({
    originalTemplateData,
    title,
    duration,
    students,
    setOriginalTemplateData,
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
      }
    } else {
      // Clear template data when no template is selected
      setOriginalTemplateData(null);
    }
  };

  const performClearTemplate = () => {
    setSelectedTemplateId('');
    setOriginalTemplateData(null);
    
    toast({
      title: "Template Cleared",
      description: "Working with current data. You can now save this as a new template.",
    });
  };

  const handleClearTemplate = () => {
    if (shouldConfirmClear) {
      templateActions.openClearDialog();
    } else {
      performClearTemplate();
    }
  };

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
      case 'clear':
        performClearTemplate();
        break;
    }
  };

  // Determine if we're in a "cleared template" state
  const isClearedTemplate = !originalTemplateData && (title.trim() || students.some(s => s.name.trim()));

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

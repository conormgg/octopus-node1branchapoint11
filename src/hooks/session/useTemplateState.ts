import { useState, useCallback } from 'react';
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
  const [isClearedTemplate, setIsClearedTemplate] = useState(false);
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

  // Check if form has significant data worth confirming before clearing
  const hasSignificantData = useCallback(() => {
    const validStudents = students.filter(student => student.name.trim()).length;
    const hasTitle = title.trim().length > 0;
    const hasDuration = duration !== '';
    
    return validStudents > 1 || hasTitle || hasDuration;
  }, [title, duration, students]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsClearedTemplate(false);
    
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
      setIsClearedTemplate(false);
    }
  };

  const handleClearTemplate = () => {
    if (!originalTemplateData) return;

    // If there are unsaved changes and significant data, show confirmation dialog
    if (hasUnsavedChanges && hasSignificantData()) {
      templateActions.openClearTemplateDialog(originalTemplateData.title);
      return;
    }

    // Otherwise, clear immediately
    confirmClearTemplate();
  };

  const confirmClearTemplate = () => {
    setSelectedTemplateId('');
    setOriginalTemplateData(null);
    setIsClearedTemplate(true);
    
    toast({
      title: "Template Cleared",
      description: "Working with a copy of the template data. You can now save this as a new template.",
      variant: "default",
    });
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

  // Keyboard shortcut handler
  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    // Ctrl/Cmd + Shift + C to clear template
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
      if (originalTemplateData && !isClearedTemplate) {
        event.preventDefault();
        handleClearTemplate();
      }
    }
  }, [originalTemplateData, isClearedTemplate, handleClearTemplate]);

  // Register keyboard shortcut
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [handleKeyboardShortcut]);

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

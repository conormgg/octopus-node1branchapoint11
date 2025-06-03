
import { useState, useMemo } from 'react';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useToast } from '@/hooks/use-toast';
import { useTemplateActions } from './useTemplateActions';
import { Student, OriginalTemplateData, TemplateButtonState } from './types';

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
  const { templates, saveTemplate, updateTemplate, deleteTemplate, isLoading } = useClassTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [originalTemplateData, setOriginalTemplateData] = useState<OriginalTemplateData | null>(null);
  const { toast } = useToast();
  const templateActions = useTemplateActions();

  // Template state tracking
  const isTemplateLoaded = Boolean(originalTemplateData);
  const loadedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);

  // Change detection logic
  const hasUnsavedChanges = useMemo(() => {
    if (!originalTemplateData) return false;

    // Check if title changed
    if (title !== originalTemplateData.title) return true;

    // Check if duration changed
    if (duration !== originalTemplateData.duration) return true;

    // Check if students changed (length)
    if (students.length !== originalTemplateData.students.length) return true;

    // Check if any student data changed
    for (let i = 0; i < students.length; i++) {
      const current = students[i];
      const original = originalTemplateData.students[i];
      
      if (!original) return true;
      if (current.name !== original.name || current.email !== original.email) {
        return true;
      }
    }

    return false;
  }, [title, duration, students, originalTemplateData]);

  // Enhanced button state logic with "Save as New" option
  const templateButtonState = useMemo((): TemplateButtonState => {
    const hasValidStudents = students.some(student => student.name.trim());
    
    if (!isTemplateLoaded) {
      // No template loaded - show save button if there are valid students
      return hasValidStudents ? 'save' : 'none';
    }

    if (hasUnsavedChanges) {
      // Template loaded with changes - show update button and save as new option
      return 'update';
    }

    // Template loaded without changes - hide buttons
    return 'none';
  }, [isTemplateLoaded, hasUnsavedChanges, students]);

  // Show "Save as New" option when template is loaded and has changes
  const showSaveAsNewOption = isTemplateLoaded && hasUnsavedChanges;

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

  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before saving as template.",
        variant: "destructive",
      });
      return;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before saving a template.",
        variant: "destructive",
      });
      return;
    }

    await saveTemplate(title.trim(), validStudents, duration);
  };

  const handleUpdateTemplate = async () => {
    if (!originalTemplateData) return;
    
    templateActions.openUpdateDialog(originalTemplateData.id, originalTemplateData.title);
  };

  const confirmUpdateTemplate = async () => {
    if (!originalTemplateData) return;

    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before updating template.",
        variant: "destructive",
      });
      return;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before updating template.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateTemplate(
      originalTemplateData.id,
      title.trim(),
      validStudents,
      duration
    );

    if (success) {
      // Update the original template data to reflect the new state
      setOriginalTemplateData({
        id: originalTemplateData.id,
        title: title.trim(),
        duration,
        students: validStudents,
      });
    }
  };

  const handleSaveAsNew = () => {
    templateActions.openSaveAsNewDialog(title);
  };

  const confirmSaveAsNew = async () => {
    if (!title.trim()) {
      toast({
        title: "Session Title Required",
        description: "Please enter a session title before saving as new template.",
        variant: "destructive",
      });
      return;
    }

    const validStudents = students.filter(student => student.name.trim());
    if (validStudents.length === 0) {
      toast({
        title: "No Students to Save",
        description: "Please add at least one student before saving a template.",
        variant: "destructive",
      });
      return;
    }

    // Save as new template (don't update original template data)
    await saveTemplate(title.trim(), validStudents, duration);
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
    templateActions,
    handleTemplateSelect,
    handleEditTemplate,
    handleDeleteTemplate,
    handleSaveTemplate,
    handleUpdateTemplate,
    handleSaveAsNew,
    handleConfirmAction,
  };
};

import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useToast } from '@/hooks/use-toast';

interface Student {
  name: string;
  email: string;
}

interface OriginalTemplateData {
  id: number;
  title: string;
  duration: number | '';
  students: Student[];
}

type TemplateButtonState = 'save' | 'update' | 'none';

export const useCreateSessionForm = (onSessionCreated: (sessionId: string) => void) => {
  const { user } = useAuth();
  const { templates, saveTemplate, updateTemplate, deleteTemplate } = useClassTemplates();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [students, setStudents] = useState<Student[]>([{ name: '', email: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [originalTemplateData, setOriginalTemplateData] = useState<OriginalTemplateData | null>(null);
  const { toast } = useToast();

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

  // Button state logic with proper typing
  const templateButtonState = useMemo((): TemplateButtonState => {
    if (!isTemplateLoaded) {
      // No template loaded - show save button if form is valid
      const hasValidStudents = students.some(student => student.name.trim());
      const showSaveButton = Boolean(hasValidStudents && title.trim());
      return showSaveButton ? 'save' : 'none';
    }

    if (hasUnsavedChanges) {
      // Template loaded with changes - show update button
      return 'update';
    }

    // Template loaded without changes - hide buttons
    return 'none';
  }, [isTemplateLoaded, hasUnsavedChanges, students, title]);

  const addStudent = () => {
    if (students.length < 8) {
      setStudents([...students, { name: '', email: '' }]);
    }
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: keyof Student, value: string) => {
    const updatedStudents = students.map((student, i) =>
      i === index ? { ...student, [field]: value } : student
    );
    setStudents(updatedStudents);
  };

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
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the template "${template.class_name}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      const success = await deleteTemplate(template.id, template.class_name);
      
      // If the deleted template was currently selected, clear the selection and reset form
      if (success && selectedTemplateId === template.id.toString()) {
        setSelectedTemplateId('');
        setOriginalTemplateData(null);
        setTitle('');
        setDuration('');
        setStudents([{ name: '', email: '' }]);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a session.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate unique slug
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_unique_slug');
      
      if (slugError) throw slugError;

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          teacher_id: user.id,
          title: title || 'Untitled Session',
          duration_minutes: duration || null,
          unique_url_slug: slugData,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add students to session
      const validStudents = students.filter(student => student.name.trim());
      if (validStudents.length > 0) {
        const participantsToInsert = validStudents.map((student, index) => ({
          session_id: sessionData.id,
          student_name: student.name.trim(),
          student_email: student.email.trim() || null,
          assigned_board_suffix: String.fromCharCode(65 + index), // A, B, C, etc.
        }));

        const { error: participantsError } = await supabase
          .from('session_participants')
          .insert(participantsToInsert);

        if (participantsError) throw participantsError;
      }

      toast({
        title: "Session Created!",
        description: `Session "${sessionData.title}" has been created successfully.`,
      });

      onSessionCreated(sessionData.id);
    } catch (error: any) {
      toast({
        title: "Error Creating Session",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    title,
    duration,
    students,
    isLoading,
    selectedTemplateId,
    templates,
    templateButtonState,
    loadedTemplate,
    hasUnsavedChanges,
    
    // Setters
    setTitle,
    setDuration,
    
    // Handlers
    addStudent,
    removeStudent,
    updateStudent,
    handleTemplateSelect,
    handleEditTemplate,
    handleDeleteTemplate,
    handleSaveTemplate,
    handleUpdateTemplate,
    handleSubmit,
  };
};

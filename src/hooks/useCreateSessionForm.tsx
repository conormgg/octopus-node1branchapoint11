
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useToast } from '@/hooks/use-toast';

interface Student {
  name: string;
  email: string;
}

export const useCreateSessionForm = (onSessionCreated: (sessionId: string) => void) => {
  const { user } = useAuth();
  const { templates, saveTemplate, deleteTemplate } = useClassTemplates();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [students, setStudents] = useState<Student[]>([{ name: '', email: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const { toast } = useToast();

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
        setTitle(template.class_name);
        setDuration(template.duration_minutes || '');
        
        if (template.students.length > 0) {
          const templateStudents = template.students.map(student => ({
            name: student.student_name,
            email: student.student_email || '',
          }));
          setStudents(templateStudents);
          toast({
            title: "Template Loaded",
            description: `Loaded "${template.class_name}" with ${templateStudents.length} students.`,
          });
        } else {
          toast({
            title: "Template Loaded",
            description: `Loaded "${template.class_name}".`,
          });
        }
      }
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
      
      // If the deleted template was currently selected, clear the selection
      if (success && selectedTemplateId === template.id.toString()) {
        setSelectedTemplateId('');
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

  const hasValidStudents = students.some(student => student.name.trim());
  const showSaveButton = Boolean(hasValidStudents && title.trim());

  return {
    // State
    title,
    duration,
    students,
    isLoading,
    selectedTemplateId,
    templates,
    hasValidStudents,
    showSaveButton,
    
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
    handleSubmit,
  };
};

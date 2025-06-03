
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ClassTemplate {
  id: number;
  class_name: string;
  duration_minutes: number | null;
  created_at: string;
  students: Array<{
    student_name: string;
    student_email: string | null;
  }>;
}

interface Student {
  name: string;
  email: string;
}

export const useClassTemplates = () => {
  const { user, isDemoMode } = useAuth();
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    if (isDemoMode || !user) {
      setTemplates([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data: templateData, error } = await supabase
        .from('saved_classes')
        .select(`
          id,
          class_name,
          duration_minutes,
          created_at,
          saved_class_students (
            student_name,
            student_email
          )
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTemplates = templateData?.map(template => ({
        ...template,
        students: template.saved_class_students || []
      })) || [];

      setTemplates(formattedTemplates);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error Loading Templates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async (templateName: string, students: Student[], duration?: number | '') => {
    if (isDemoMode || !user) {
      toast({
        title: "Demo Mode",
        description: "Template saving is not available in demo mode.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Create the template
      const { data: templateData, error: templateError } = await supabase
        .from('saved_classes')
        .insert({
          teacher_id: user.id,
          class_name: templateName,
          duration_minutes: duration && typeof duration === 'number' ? duration : null,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Add students to the template
      if (students.length > 0) {
        const studentsToInsert = students
          .filter(student => student.name.trim())
          .map(student => ({
            saved_class_id: templateData.id,
            student_name: student.name.trim(),
            student_email: student.email.trim() || null,
          }));

        if (studentsToInsert.length > 0) {
          const { error: studentsError } = await supabase
            .from('saved_class_students')
            .insert(studentsToInsert);

          if (studentsError) throw studentsError;
        }
      }

      toast({
        title: "Template Saved!",
        description: `Class template "${templateName}" has been saved successfully.`,
      });

      fetchTemplates(); // Refresh the templates list
      return templateData.id;
    } catch (error: any) {
      toast({
        title: "Error Saving Template",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTemplate = async (templateId: number, templateName: string) => {
    if (isDemoMode || !user) {
      toast({
        title: "Demo Mode",
        description: "Template deletion is not available in demo mode.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_classes')
        .delete()
        .eq('id', templateId)
        .eq('teacher_id', user.id); // Ensure user can only delete their own templates

      if (error) throw error;

      toast({
        title: "Template Deleted!",
        description: `Class template "${templateName}" has been deleted successfully.`,
      });

      fetchTemplates(); // Refresh the templates list
      return true;
    } catch (error: any) {
      toast({
        title: "Error Deleting Template",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const loadTemplate = (templateId: number): Student[] => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return [];

    return template.students.map(student => ({
      name: student.student_name,
      email: student.student_email || '',
    }));
  };

  useEffect(() => {
    fetchTemplates();
  }, [user, isDemoMode]);

  return {
    templates,
    isLoading,
    saveTemplate,
    deleteTemplate,
    loadTemplate,
    refreshTemplates: fetchTemplates,
  };
};

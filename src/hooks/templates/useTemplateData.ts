
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClassTemplate, Student } from './types';

export const useTemplateData = (user: any, isDemoMode: boolean) => {
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with true for initial load
  const { toast } = useToast();

  const fetchTemplates = async () => {
    if (isDemoMode || !user) {
      setTemplates([]);
      setIsLoading(false);
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
    loadTemplate,
    refreshTemplates: fetchTemplates, // Return the async function directly
  };
};

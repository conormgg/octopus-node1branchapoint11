import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Users, Clock, Save, BookOpen } from 'lucide-react';

interface Student {
  name: string;
  email: string;
}

interface CreateSessionFormProps {
  onSessionCreated: (sessionId: string) => void;
}

const CreateSessionForm: React.FC<CreateSessionFormProps> = ({ onSessionCreated }) => {
  const { user } = useAuth();
  const { templates, saveTemplate } = useClassTemplates();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [students, setStudents] = useState<Student[]>([{ name: '', email: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
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
        // Set the title to the template's class name
        setTitle(template.class_name);
        
        // Set a default duration (you can adjust this as needed)
        setDuration(60);
        
        // Populate students if any exist
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

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Template Name Required",
        description: "Please enter a name for the template.",
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

    const success = await saveTemplate(templateName.trim(), validStudents);
    if (success) {
      setTemplateName('');
      setShowSaveTemplate(false);
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

  const hasValidStudents = students.some(student => student.name.trim());

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Create New Session
        </CardTitle>
        <CardDescription>
          Set up a new collaborative whiteboard session for your class
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Saved Classes Section */}
          {templates.length > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Saved Classes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a saved class" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.class_name} ({template.students.length} students)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Session Title
            </label>
            <Input
              id="title"
              type="text"
              placeholder="Enter session title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration (minutes, optional)
            </label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g., 60"
              value={duration}
              onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : '')}
              min="1"
              max="300"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Students</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStudent}
                disabled={students.length >= 8}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Student
              </Button>
            </div>

            <div className="space-y-3">
              {students.map((student, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Student name (required)"
                      value={student.name}
                      onChange={(e) => updateStudent(index, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Email (optional)"
                      value={student.email}
                      onChange={(e) => updateStudent(index, 'email', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeStudent(index)}
                    disabled={students.length === 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Save as Template Section */}
          {hasValidStudents && (
            <Card className="border-dashed">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save as Class Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!showSaveTemplate ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveTemplate(true)}
                  >
                    Save Current Student List as Template
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Template name (e.g., Math Class Period 3)"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveTemplate}
                      disabled={!templateName.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSaveTemplate(false);
                        setTemplateName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Session...' : 'Start Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSessionForm;

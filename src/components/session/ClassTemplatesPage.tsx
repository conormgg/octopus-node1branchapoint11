
import React, { useState } from 'react';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClassTemplatesHeader from './ClassTemplatesHeader';
import ClassTemplatesEmpty from './ClassTemplatesEmpty';
import ClassTemplatesTable from './ClassTemplatesTable';
import DeleteTemplateDialog from './DeleteTemplateDialog';

interface Student {
  name: string;
  email: string;
}

interface ClassTemplatesPageProps {
  onBack: () => void;
}

const ClassTemplatesPage: React.FC<ClassTemplatesPageProps> = ({ onBack }) => {
  const { templates, isLoading, deleteTemplate, updateTemplate } = useClassTemplates();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editedName, setEditedName] = useState('');
  const [editedStudents, setEditedStudents] = useState<Student[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<any>(null);
  const { toast } = useToast();

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setEditedName(template.class_name);
    setEditedStudents(
      template.students.map((student: any) => ({
        name: student.student_name,
        email: student.student_email || '',
      }))
    );
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setEditedName('');
    setEditedStudents([]);
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate || !editedName.trim()) {
      toast({
        title: "Template Name Required",
        description: "Please enter a valid template name.",
        variant: "destructive",
      });
      return;
    }

    const validStudents = editedStudents.filter(student => student.name.trim());
    const success = await updateTemplate(editingTemplate.id, editedName.trim(), validStudents);

    if (success) {
      setEditingTemplate(null);
      setEditedName('');
      setEditedStudents([]);
    }
  };

  const addStudent = () => {
    setEditedStudents([...editedStudents, { name: '', email: '' }]);
  };

  const removeStudent = (index: number) => {
    setEditedStudents(editedStudents.filter((_, i) => i !== index));
  };

  const updateStudent = (index: number, field: 'name' | 'email', value: string) => {
    setEditedStudents(
      editedStudents.map((student, i) =>
        i === index ? { ...student, [field]: value } : student
      )
    );
  };

  const handleDeleteTemplate = async (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const success = await deleteTemplate(templateId, template.class_name);
    if (success) {
      setShowDeleteDialog(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Loading templates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ClassTemplatesHeader onBack={onBack} />

        {templates.length === 0 ? (
          <ClassTemplatesEmpty onBack={onBack} />
        ) : (
          <ClassTemplatesTable
            templates={templates}
            editingTemplate={editingTemplate}
            editedName={editedName}
            editedStudents={editedStudents}
            onEditTemplate={handleEditTemplate}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onDeleteTemplate={setShowDeleteDialog}
            onEditedNameChange={setEditedName}
            onAddStudent={addStudent}
            onRemoveStudent={removeStudent}
            onUpdateStudent={updateStudent}
          />
        )}

        <DeleteTemplateDialog
          template={showDeleteDialog}
          onClose={() => setShowDeleteDialog(null)}
          onConfirm={handleDeleteTemplate}
        />
      </div>
    </div>
  );
};

export default ClassTemplatesPage;

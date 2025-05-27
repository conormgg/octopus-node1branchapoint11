
import React, { useState } from 'react';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, Edit, Trash2, Users, Calendar, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Student {
  name: string;
  email: string;
}

interface ClassTemplatesPageProps {
  onBack: () => void;
}

const ClassTemplatesPage: React.FC<ClassTemplatesPageProps> = ({ onBack }) => {
  const { templates, isLoading, saveTemplate, loadTemplate, refreshTemplates } = useClassTemplates();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editedName, setEditedName] = useState('');
  const [editedStudents, setEditedStudents] = useState<Student[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<any>(null);
  const { toast } = useToast();

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setEditedName(template.class_name);
    const students = loadTemplate(template.id);
    setEditedStudents(students);
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

    // For now, we'll create a new template with the edited data
    // In a full implementation, you'd want an update function
    const success = await saveTemplate(editedName.trim(), editedStudents);
    if (success) {
      setEditingTemplate(null);
      setEditedName('');
      setEditedStudents([]);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    // This would need a delete function in the hook
    // For now, just show a placeholder
    toast({
      title: "Delete Functionality",
      description: "Delete functionality will be implemented in the next phase.",
    });
    setShowDeleteDialog(null);
  };

  const addStudent = () => {
    if (editedStudents.length < 8) {
      setEditedStudents([...editedStudents, { name: '', email: '' }]);
    }
  };

  const removeStudent = (index: number) => {
    if (editedStudents.length > 1) {
      setEditedStudents(editedStudents.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: keyof Student, value: string) => {
    const updated = editedStudents.map((student, i) =>
      i === index ? { ...student, [field]: value } : student
    );
    setEditedStudents(updated);
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
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                Class Templates
              </h1>
              <p className="text-gray-600">Manage your saved class templates</p>
            </div>
          </div>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first class template when setting up a new session.
              </p>
              <Button onClick={onBack}>
                Create New Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Class Templates ({templates.length})</CardTitle>
              <CardDescription>
                Manage and organize your saved class templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.class_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          {template.students.length} students
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(template.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteDialog(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit Template Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Modify the template name and student list
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Students</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStudent}
                    disabled={editedStudents.length >= 8}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Student
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {editedStudents.map((student, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Student name"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                      />
                      <Input
                        type="email"
                        placeholder="Email (optional)"
                        value={student.email}
                        onChange={(e) => updateStudent(index, 'email', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStudent(index)}
                        disabled={editedStudents.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{showDeleteDialog?.class_name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteTemplate(showDeleteDialog?.id)}
              >
                Delete Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClassTemplatesPage;

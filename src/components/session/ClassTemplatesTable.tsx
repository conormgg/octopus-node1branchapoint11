
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Users, Calendar, Edit2, Save, X, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Student {
  name: string;
  email: string;
}

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

interface ClassTemplatesTableProps {
  templates: ClassTemplate[];
  editingTemplate: ClassTemplate | null;
  editedName: string;
  editedStudents: Student[];
  onEditTemplate: (template: ClassTemplate) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDeleteTemplate: (template: ClassTemplate) => void;
  onEditedNameChange: (name: string) => void;
  onAddStudent: () => void;
  onRemoveStudent: (index: number) => void;
  onUpdateStudent: (index: number, field: 'name' | 'email', value: string) => void;
}

const ClassTemplatesTable: React.FC<ClassTemplatesTableProps> = ({
  templates,
  editingTemplate,
  editedName,
  editedStudents,
  onEditTemplate,
  onCancelEdit,
  onSaveEdit,
  onDeleteTemplate,
  onEditedNameChange,
  onAddStudent,
  onRemoveStudent,
  onUpdateStudent,
}) => {
  return (
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
              <React.Fragment key={template.id}>
                <TableRow>
                  <TableCell className="font-medium">
                    {editingTemplate?.id === template.id ? (
                      <Input
                        value={editedName}
                        onChange={(e) => onEditedNameChange(e.target.value)}
                        placeholder="Template name"
                        className="w-full"
                      />
                    ) : (
                      template.class_name
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {editingTemplate?.id === template.id
                        ? editedStudents.filter(s => s.name.trim()).length
                        : template.students.length} students
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
                      {editingTemplate?.id === template.id ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onSaveEdit}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditTemplate(template)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteTemplate(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {editingTemplate?.id === template.id && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Edit Students</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onAddStudent}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Student
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {editedStudents.map((student, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                placeholder="Student name"
                                value={student.name}
                                onChange={(e) => onUpdateStudent(index, 'name', e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Email (optional)"
                                type="email"
                                value={student.email}
                                onChange={(e) => onUpdateStudent(index, 'email', e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onRemoveStudent(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClassTemplatesTable;

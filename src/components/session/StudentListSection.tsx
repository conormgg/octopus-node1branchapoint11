
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Save, RotateCcw, Copy } from 'lucide-react';

interface Student {
  name: string;
  email: string;
}

interface StudentListSectionProps {
  students: Student[];
  onAddStudent: () => void;
  onRemoveStudent: (index: number) => void;
  onUpdateStudent: (index: number, field: keyof Student, value: string) => void;
  onSaveTemplate: () => void;
  onUpdateTemplate?: () => void;
  onSaveAsNew?: () => void;
  templateButtonState: 'save' | 'update' | 'none';
  loadedTemplateName?: string;
  showSaveAsNewOption?: boolean;
}

const StudentListSection: React.FC<StudentListSectionProps> = ({
  students,
  onAddStudent,
  onRemoveStudent,
  onUpdateStudent,
  onSaveTemplate,
  onUpdateTemplate,
  onSaveAsNew,
  templateButtonState,
  loadedTemplateName,
  showSaveAsNewOption = false,
}) => {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Students</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddStudent}
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
                  onChange={(e) => onUpdateStudent(index, 'name', e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Email (optional)"
                  value={student.email}
                  onChange={(e) => onUpdateStudent(index, 'email', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveStudent(index)}
                disabled={students.length === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Template Action Buttons */}
      {templateButtonState !== 'none' && (
        <div className="flex justify-center gap-2">
          {templateButtonState === 'save' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveTemplate}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save as Template
            </Button>
          )}

          {templateButtonState === 'update' && (
            <div className="flex gap-2">
              {onUpdateTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onUpdateTemplate}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Update {loadedTemplateName && `"${loadedTemplateName}"`}
                </Button>
              )}

              {showSaveAsNewOption && onSaveAsNew && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSaveAsNew}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Save as New
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default StudentListSection;

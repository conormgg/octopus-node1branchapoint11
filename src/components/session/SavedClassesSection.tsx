
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit, Trash2 } from 'lucide-react';

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

interface SavedClassesSectionProps {
  templates: ClassTemplate[];
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  onEditTemplate?: (template: ClassTemplate) => void;
  onDeleteTemplate?: (template: ClassTemplate) => void;
}

const SavedClassesSection: React.FC<SavedClassesSectionProps> = ({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onEditTemplate,
  onDeleteTemplate,
}) => {
  if (templates.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Saved Classes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedTemplateId} onValueChange={onTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a saved class" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span>{template.class_name} ({template.students.length} students)</span>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditTemplate?.(template);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteTemplate?.(template);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default SavedClassesSection;

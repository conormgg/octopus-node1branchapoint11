
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';

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
}

const SavedClassesSection: React.FC<SavedClassesSectionProps> = ({
  templates,
  selectedTemplateId,
  onTemplateSelect,
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
  );
};

export default SavedClassesSection;

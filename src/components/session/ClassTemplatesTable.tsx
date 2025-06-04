
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Users, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  onDeleteTemplate: (template: ClassTemplate) => void;
}

const ClassTemplatesTable: React.FC<ClassTemplatesTableProps> = ({
  templates,
  onDeleteTemplate,
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
                      onClick={() => onDeleteTemplate(template)}
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
  );
};

export default ClassTemplatesTable;

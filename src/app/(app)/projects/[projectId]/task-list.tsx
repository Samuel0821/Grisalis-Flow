
'use client';

import { Task, TaskPriority } from '@/lib/firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

const priorityIcons: Record<TaskPriority, React.ReactNode> = {
  high: <ArrowUp className="h-4 w-4 text-destructive" />,
  medium: <ArrowRight className="h-4 w-4 text-yellow-500" />,
  low: <ArrowDown className="h-4 w-4 text-green-500" />,
};

const priorityBadges: Record<TaskPriority, 'destructive' | 'secondary' | 'outline'> = {
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground px-6 pb-6">No tasks assigned to this sprint yet.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <Card key={task.id} className="mx-6 mb-2">
          <CardContent className="p-3">
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{task.status.replace('_', ' ')}</Badge>
                    <h4 className="font-medium pr-2">{task.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={priorityBadges[task.priority]} className="capitalize">{task.priority}</Badge>
                    {priorityIcons[task.priority]}
                </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

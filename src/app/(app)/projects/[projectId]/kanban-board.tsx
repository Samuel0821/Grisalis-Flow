
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Task, createTask } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const columns: { id: Task['status']; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

function KanbanColumn({ title, tasks }: { title: string; tasks: Task[] }) {
  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {tasks.map((task) => (
          <Card key={task.id} className="p-4 shadow-sm">
            <h4 className="font-medium">{task.title}</h4>
            {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
          </Card>
        ))}
        {tasks.length === 0 && (
          <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
            No tasks yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({ projectId, initialTasks, onTaskCreated }: { projectId: string; initialTasks: Task[], onTaskCreated: (task: Task) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    if (!newTaskTitle.trim()) {
      toast({ variant: 'destructive', title: 'Title is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask = await createTask({
        projectId,
        title: newTaskTitle,
        description: newTaskDescription,
        status: 'backlog',
        createdBy: user.uid,
      });
      onTaskCreated(newTask);
      toast({ title: 'Success!', description: 'Task created.' });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error creating task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateTask}>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new task.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="E.g., Implement login page"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Describe the task in more detail."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            title={column.title}
            tasks={initialTasks.filter((task) => task.status === column.id)}
          />
        ))}
      </div>
    </div>
  );
}

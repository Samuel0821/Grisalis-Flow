
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, Task, TimeLog, createTimeLog } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function TimesheetLogger({
  projects,
  tasks,
  initialTimeLogs,
  onTimeLogCreated,
}: {
  projects: Project[];
  tasks: Task[];
  initialTimeLogs: TimeLog[];
  onTimeLogCreated: (log: TimeLog) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeLogs, setTimeLogs] = useState(initialTimeLogs);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [hours, setHours] = useState('');
  const [logDescription, setLogDescription] = useState('');

  const availableTasks = useMemo(() => {
    return tasks.filter(task => task.projectId === selectedProjectId);
  }, [selectedProjectId, tasks]);

  const resetForm = () => {
    setSelectedProjectId('');
    setSelectedTaskId('');
    setHours('');
    setLogDescription('');
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    if (!selectedProjectId || !selectedTaskId || !hours) {
      toast({ variant: 'destructive', title: 'Project, Task, and Hours are required' });
      return;
    }

    const hoursNumber = parseFloat(hours);
    if (isNaN(hoursNumber) || hoursNumber <= 0) {
      toast({ variant: 'destructive', title: 'Invalid hours', description: 'Please enter a positive number for hours.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newLog = await createTimeLog({
        userId: user.uid,
        projectId: selectedProjectId,
        taskId: selectedTaskId,
        hours: hoursNumber,
        description: logDescription,
      } as Omit<TimeLog, 'id' | 'date'>);
      onTimeLogCreated(newLog);
      setTimeLogs(prev => [newLog, ...prev]);
      toast({ title: 'Success!', description: 'Your time has been logged.' });
      resetForm();
    } catch (error) {
      console.error('Error logging time:', error);
      toast({
        variant: 'destructive',
        title: 'Error logging time',
        description: 'Could not log your time. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <form onSubmit={handleLogTime}>
          <CardHeader>
            <CardTitle>Log Work Hours</CardTitle>
            <CardDescription>Select a task and enter the hours worked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select onValueChange={setSelectedProjectId} value={selectedProjectId} disabled={isSubmitting}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id!}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <Select onValueChange={setSelectedTaskId} value={selectedTaskId} disabled={!selectedProjectId || isSubmitting}>
                <SelectTrigger id="task">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                   {availableTasks.length > 0 ? availableTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id!}>
                      {t.title}
                    </SelectItem>
                  )) : <p className="text-sm text-muted-foreground p-2">No tasks in this project.</p>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                    id="hours"
                    type="number"
                    placeholder="E.g., 2.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    disabled={isSubmitting}
                    step="0.1"
                    min="0"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-description">Description (Optional)</Label>
              <Textarea
                id="log-description"
                placeholder="What did you work on?"
                value={logDescription}
                onChange={(e) => setLogDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !selectedTaskId}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                 <>
                  <Clock className="mr-2 h-4 w-4" />
                  Log Time
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
         <CardHeader>
            <CardTitle>My Time Logs</CardTitle>
            <CardDescription>A list of your recent time entries.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {timeLogs.length > 0 ? (
                    timeLogs.map((log) => {
                        const task = tasks.find((t) => t.id === log.taskId);
                        const project = projects.find((p) => p.id === log.projectId);
                        return (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium">{task?.title || 'N/A'}</TableCell>
                            <TableCell>{project?.name || 'N/A'}</TableCell>
                            <TableCell className="text-right">{log.hours}</TableCell>
                            <TableCell>{log.date?.toDate && format(log.date.toDate(), 'PPP')}</TableCell>
                        </TableRow>
                        );
                    })
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                        No time logged yet.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}

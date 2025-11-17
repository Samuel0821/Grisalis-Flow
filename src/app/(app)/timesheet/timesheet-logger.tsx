
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, Task, TimeLog, createTimeLog, getTasks } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function TimesheetLogger({
  projects,
  initialTimeLogs,
  onTimeLogCreated,
}: {
  projects: Project[];
  initialTimeLogs: TimeLog[];
  onTimeLogCreated: (log: TimeLog) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeLogs, setTimeLogs] = useState(initialTimeLogs);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [hours, setHours] = useState('');
  const [logDescription, setLogDescription] = useState('');

  useEffect(() => {
      if (selectedProjectId) {
          const fetchTasks = async () => {
              setIsLoadingTasks(true);
              setTasks([]); // Clear previous tasks
              setSelectedTaskId(''); // Reset selected task
              try {
                  const projectTasks = await getTasks(selectedProjectId);
                  setTasks(projectTasks);
              } catch (error) {
                  toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las tareas para este proyecto.' });
              } finally {
                  setIsLoadingTasks(false);
              }
          };
          fetchTasks();
      }
  }, [selectedProjectId, toast]);

  const resetForm = () => {
    setSelectedProjectId('');
    setSelectedTaskId('');
    setHours('');
    setLogDescription('');
    setTasks([]);
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'No autenticado' });
      return;
    }
    if (!selectedProjectId || !selectedTaskId || !hours) {
      toast({ variant: 'destructive', title: 'Proyecto, Tarea y Horas son campos requeridos' });
      return;
    }

    const hoursNumber = parseFloat(hours);
    if (isNaN(hoursNumber) || hoursNumber <= 0) {
      toast({ variant: 'destructive', title: 'Horas inválidas', description: 'Por favor, introduce un número positivo para las horas.' });
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
      setTimeLogs(prev => [newLog, ...prev].sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime()));
      toast({ title: '¡Éxito!', description: 'Tu tiempo ha sido registrado.' });
      resetForm();
    } catch (error) {
      console.error('Error logging time:', error);
      toast({
        variant: 'destructive',
        title: 'Error al registrar tiempo',
        description: 'No se pudo registrar tu tiempo. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getTaskTitle = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      return task?.title || initialTimeLogs.find(log => log.taskId === taskId) ? '...' : 'N/A';
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <form onSubmit={handleLogTime}>
          <CardHeader>
            <CardTitle>Registrar Horas de Trabajo</CardTitle>
            <CardDescription>Selecciona una tarea e introduce las horas trabajadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Proyecto</Label>
              <Select onValueChange={setSelectedProjectId} value={selectedProjectId} disabled={isSubmitting}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Selecciona un proyecto" />
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
              <Label htmlFor="task">Tarea</Label>
              <Select onValueChange={setSelectedTaskId} value={selectedTaskId} disabled={!selectedProjectId || isSubmitting || isLoadingTasks}>
                <SelectTrigger id="task">
                  <SelectValue placeholder={isLoadingTasks ? "Cargando tareas..." : "Selecciona una tarea"} />
                </SelectTrigger>
                <SelectContent>
                   {isLoadingTasks ? (
                       <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin"/></div>
                   ) : tasks.length > 0 ? tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id!}>
                      {t.title}
                    </SelectItem>
                  )) : <p className="text-sm text-muted-foreground p-2">No hay tareas en este proyecto.</p>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="hours">Horas</Label>
                <Input
                    id="hours"
                    type="number"
                    placeholder="Ej: 2.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    disabled={isSubmitting}
                    step="0.1"
                    min="0"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-description">Descripción (Opcional)</Label>
              <Textarea
                id="log-description"
                placeholder="¿En qué trabajaste?"
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
                  Registrando...
                </>
              ) : (
                 <>
                  <Clock className="mr-2 h-4 w-4" />
                  Registrar Tiempo
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
         <CardHeader>
            <CardTitle>Mis Registros de Tiempo</CardTitle>
            <CardDescription>Una lista de tus entradas de tiempo recientes.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead>Fecha</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialTimeLogs.length > 0 ? (
                    initialTimeLogs.map((log) => {
                        const project = projects.find((p) => p.id === log.projectId);
                        return (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium">{getTaskTitle(log.taskId)}</TableCell>
                            <TableCell>{project?.name || 'N/A'}</TableCell>
                            <TableCell className="text-right">{log.hours}</TableCell>
                            <TableCell>{log.date?.toDate && format(log.date.toDate(), 'PPP', { locale: es })}</TableCell>
                        </TableRow>
                        );
                    })
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                        Aún no se ha registrado tiempo.
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

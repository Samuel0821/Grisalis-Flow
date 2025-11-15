
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getProjects, getTasksForProjects, Project, Task, getTimeLogs, TimeLog } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TimesheetLogger } from './timesheet-logger';

export default function TimesheetPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const userProjects = await getProjects(user.uid);
          setProjects(userProjects);
          
          if (userProjects.length > 0) {
              const projectIds = userProjects.map(p => p.id!);
              const [projectTasks, userTimeLogs] = await Promise.all([
                  getTasksForProjects(projectIds),
                  getTimeLogs(user.uid)
              ]);
              setTasks(projectTasks);
              setTimeLogs(userTimeLogs);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            variant: 'destructive',
            title: 'Error al cargar datos',
            description: 'No se pudieron cargar los datos de la hoja de tiempo.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);

  const handleTimeLogCreated = (newTimeLog: TimeLog) => {
    setTimeLogs(prev => [newTimeLog, ...prev]);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Hoja de Horas</h1>
        <p className="text-muted-foreground">Registra e informa las horas de trabajo.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TimesheetLogger
          projects={projects}
          tasks={tasks}
          initialTimeLogs={timeLogs}
          onTimeLogCreated={handleTimeLogCreated}
        />
      )}
    </div>
  );
}

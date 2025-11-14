
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getProject, Project, getTasks, Task } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { KanbanBoard } from './kanban-board';

export default function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && params.projectId) {
      const fetchProjectData = async () => {
        setLoading(true);
        try {
          const projectData = await getProject(params.projectId);
          if (projectData) {
            if (projectData.createdBy !== user.uid) {
              setError('No tienes permiso para ver este proyecto.');
            } else {
              setProject(projectData);
              const taskData = await getTasks(params.projectId);
              setTasks(taskData);
            }
          } else {
            setError('Proyecto no encontrado.');
          }
        } catch (e) {
          console.error(e);
          setError('Ocurrió un error al cargar el proyecto.');
        } finally {
          setLoading(false);
        }
      };
      fetchProjectData();
    }
  }, [user, params.projectId]);

  const initialTasks = useMemo(() => tasks, [tasks]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 h-[calc(100vh-12rem)]">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>
      <KanbanBoard projectId={project.id!} initialTasks={initialTasks} />
    </div>
  );
}

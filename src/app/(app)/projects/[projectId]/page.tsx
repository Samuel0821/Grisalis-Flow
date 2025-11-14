
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getProject, Project, getTasks, Task, getSprints, Sprint } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { KanbanBoard } from './kanban-board';
import { SprintsView } from './sprints-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
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
              const [taskData, sprintData] = await Promise.all([
                  getTasks(params.projectId),
                  getSprintsForProject(params.projectId)
              ]);
              setTasks(taskData);
              setSprints(sprintData);
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
  const initialSprints = useMemo(() => sprints, [sprints]);
  
  const handleSprintCreated = (newSprint: Sprint) => {
    setSprints(prevSprints => [...prevSprints, newSprint]);
  }

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
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>
      
      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="flex-1 mt-4">
           <KanbanBoard projectId={project.id!} initialTasks={initialTasks} />
        </TabsContent>
        <TabsContent value="sprints" className="flex-1 mt-4">
            <SprintsView projectId={project.id!} initialSprints={initialSprints} onSprintCreated={handleSprintCreated} />
        </TabsContent>
        <TabsContent value="settings">
            <p className="text-muted-foreground">Manage project settings here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

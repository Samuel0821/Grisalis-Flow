
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getProjects, getTasksForProjects, getBugs, Project, Task, Bug } from '@/lib/firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Briefcase, ListTodo, Bug as BugIcon } from 'lucide-react';

function DashboardCard({ title, description, value, icon, isLoading }: { title: string, description: string, value: number, icon: React.ReactNode, isLoading: boolean }) {
    return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
             ) : (
                <div className="text-2xl font-bold">{value}</div>
             )}
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </CardContent>
        </Card>
    )
}


export default function DashboardPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [bugs, setBugs] = useState<Bug[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if(user) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const userProjects = await getProjects(user.uid);
                    setProjects(userProjects);

                    const projectIds = userProjects.map(p => p.id!);
                    if (projectIds.length > 0) {
                        const [projectTasks, allBugs] = await Promise.all([
                            getTasksForProjects(projectIds),
                            getBugs()
                        ]);
                        const openBugs = allBugs.filter(b => projectIds.includes(b.projectId) && b.status !== 'closed' && b.status !== 'resolved');
                        const dueTasks = projectTasks.filter(t => t.status !== 'done');
                        setTasks(dueTasks);
                        setBugs(openBugs);
                    } else {
                         const allBugs = await getBugs();
                         const openBugs = allBugs.filter(b => b.reportedBy === user.uid && b.status !== 'closed' && b.status !== 'resolved');
                         setBugs(openBugs);
                    }

                } catch (error) {
                    console.error("Failed to fetch dashboard data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [user]);


  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Panel Principal
        </h1>
        <p className="text-muted-foreground">
          ¡Bienvenido de nuevo! Aquí tienes un resumen de tu espacio de trabajo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <DashboardCard
            title="Proyectos Activos"
            description="Proyectos actualmente en progreso."
            value={projects.length}
            icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
        />
        <DashboardCard
            title="Tareas Pendientes"
            description="Tareas que aún no están en 'Hecho'."
            value={tasks.length}
            icon={<ListTodo className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
        />
        <DashboardCard
            title="Bugs Abiertos"
            description="Bugs que no están 'Resueltos' o 'Cerrados'."
            value={bugs.length}
            icon={<BugIcon className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoading}
        />
      </div>
    </div>
  );
}

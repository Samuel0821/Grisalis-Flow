
'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Project, Task, ProjectMember, TaskStatus, Sprint } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ListTodo, Bug, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const BurndownChart = dynamic(() => import('./project-burndown-chart').then(mod => mod.BurndownChart), {
  ssr: false,
  loading: () => <Skeleton className="md:col-span-2 h-[350px]" />,
});

const TasksByStatusChart = dynamic(() => import('./tasks-by-status-chart').then(mod => mod.TasksByStatusChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full" />,
});

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function DashboardCard({ title, value, icon }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}


export function ProjectDashboard({
  project,
  tasks,
  members,
  sprints
}: {
  project: Project;
  tasks: Task[];
  members: ProjectMember[];
  sprints: Sprint[];
}) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const taskStatusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      testing: 0,
      in_review: 0,
      done: 0,
    };
    tasks.forEach(task => {
      if (task.status in counts) {
        counts[task.status]++;
      }
    });
    return counts;
  }, [tasks]);

  const totalTasks = tasks.length;
  const doneTasks = taskStatusCounts.done;
  const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  
  const activeSprint = useMemo(() => sprints.find(s => s.status === 'active'), [sprints]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Total de Tareas" value={totalTasks} icon={<ListTodo className="h-4 w-4 text-muted-foreground" />} />
        <DashboardCard title="Miembros del Proyecto" value={members.length} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <DashboardCard title="Bugs Abiertos" value="0" icon={<Bug className="h-4 w-4 text-muted-foreground" />} />
        <DashboardCard title="Completado" value={`${completionPercentage}%`} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isClient && <BurndownChart tasks={tasks} sprint={activeSprint} />}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tareas por Estado</CardTitle>
            <CardDescription>Un desglose de las tareas en cada etapa del flujo de trabajo.</CardDescription>
          </CardHeader>
          <CardContent>
             {isClient && <TasksByStatusChart taskStatusCounts={taskStatusCounts} />}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Miembros del Proyecto</CardTitle>
                <CardDescription>Usuarios que tienen acceso a este proyecto.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Miembro</TableHead>
                        <TableHead>Rol</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map(member => (
                            <TableRow key={member.userId}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{member.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-muted-foreground capitalize bg-muted px-2 py-1 rounded-md">{member.role}</span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

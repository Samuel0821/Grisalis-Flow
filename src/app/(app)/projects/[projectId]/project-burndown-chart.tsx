
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { differenceInDays, format, isAfter } from 'date-fns';
import { Sprint, Task } from '@/lib/firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export function BurndownChart({ tasks, sprint }: { tasks: Task[]; sprint: Sprint | undefined }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = useMemo(() => {
    if (!sprint || sprint.status !== 'active') return [];

    const startDate = sprint.startDate.toDate();
    const endDate = sprint.endDate.toDate();
    const totalDays = differenceInDays(endDate, startDate);
    const sprintTasks = tasks.filter(t => t.sprintId === sprint.id);
    const totalTaskCount = sprintTasks.length;

    if (totalTaskCount === 0) return [];

    const data = [];
    const tasksPerDayIdeal = totalDays > 0 ? totalTaskCount / totalDays : totalTaskCount;

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const idealRemaining = Math.max(0, totalTaskCount - (tasksPerDayIdeal * i));

      const remainingTasks = sprintTasks.filter(task => {
        const taskCompletedAt = task.updatedAt?.toDate();
        return task.status !== 'done' || (taskCompletedAt && isAfter(taskCompletedAt, currentDate));
      }).length;

      data.push({
        date: format(currentDate, 'MMM d'),
        ideal: idealRemaining,
        actual: remainingTasks,
      });
    }

    return data;
  }, [sprint, tasks]);

  if (!isClient) {
    return <Skeleton className="md:col-span-2 h-[350px]" />;
  }

  if (!sprint || sprint.status !== 'active') {
    return (
      <Card className='md:col-span-2'>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingDown /> Burndown del Sprint Activo</CardTitle>
            <CardDescription>Progreso del sprint activo actualmente.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground">
            No hay ningún sprint activo para mostrar.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='md:col-span-2'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingDown /> {sprint.name} - Burndown</CardTitle>
        <CardDescription>
          Progreso ideal vs. real para el sprint activo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[250px] w-full">
            <ResponsiveContainer>
              <ComposedChart data={chartData}>
                 <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                 <YAxis domain={[0, 'dataMax + 2']} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="ideal" stroke="#8884d8" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Ideal" />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Actual" />
                <Area type="monotone" dataKey="actual" fill="hsl(var(--primary) / 0.1)" stroke="none" />
              </ComposedChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


'use client';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TaskStatus } from '@/lib/firebase/firestore';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface TasksByStatusChartProps {
    taskStatusCounts: Record<TaskStatus, number>;
}

export function TasksByStatusChart({ taskStatusCounts }: TasksByStatusChartProps) {
    const chartData = [
        { status: 'Backlog', count: taskStatusCounts.backlog, fill: 'var(--chart-1)' },
        { status: 'To-do', count: taskStatusCounts.todo, fill: 'var(--chart-2)' },
        { status: 'In Prog.', count: taskStatusCounts.in_progress, fill: 'var(--chart-3)' },
        { status: 'Testing', count: taskStatusCounts.testing, fill: 'var(--chart-4)' },
        { status: 'Review', count: taskStatusCounts.in_review, fill: 'var(--chart-5)' },
        { status: 'Done', count: taskStatusCounts.done, fill: 'var(--color-green-500)' },
    ];
    
    return (
        <ChartContainer config={{}} className="h-[250px] w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="count" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}


'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as ReportTableFooter } from '@/components/ui/table';
import { Project, Task, TimeLog } from '@/lib/firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export function ReportGenerator({
  projects,
  tasks,
  timeLogs,
}: {
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    if (selectedProjectId === 'all') {
      return timeLogs;
    }
    return timeLogs.filter(log => log.projectId === selectedProjectId);
  }, [selectedProjectId, timeLogs]);

  const totalHours = useMemo(() => {
    return filteredLogs.reduce((acc, log) => acc + log.hours, 0);
  }, [filteredLogs]);

  const getTaskTitle = (taskId: string) => tasks.find(t => t.id === taskId)?.title || 'N/A';
  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Log Report</CardTitle>
        <CardDescription>
          Filter and view time logs by project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
            <Select onValueChange={setSelectedProjectId} defaultValue="all">
            <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a project to filter" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                <SelectItem key={p.id} value={p.id!}>
                    {p.name}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
            <Button variant="outline">Export CSV</Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{getProjectName(log.projectId)}</TableCell>
                    <TableCell>{getTaskTitle(log.taskId)}</TableCell>
                    <TableCell className="text-muted-foreground">{log.description || '-'}</TableCell>
                    <TableCell>{log.date?.toDate && format(log.date.toDate(), 'PPP')}</TableCell>
                    <TableCell className="text-right font-mono">{log.hours.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No time logs found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
             <ReportTableFooter>
                <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold font-mono">{totalHours.toFixed(2)}</TableCell>
                </TableRow>
            </ReportTableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

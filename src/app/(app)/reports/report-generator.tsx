
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as ReportTableFooter } from '@/components/ui/table';
import { Project, Task, TimeLog, UserProfile } from '@/lib/firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function ReportGenerator({
  projects,
  tasks,
  timeLogs,
  users,
}: {
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  users: UserProfile[];
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return timeLogs.filter(log => {
        const projectMatch = selectedProjectId === 'all' || log.projectId === selectedProjectId;
        const userMatch = selectedUserId === 'all' || log.userId === selectedUserId;
        return projectMatch && userMatch;
    });
  }, [selectedProjectId, selectedUserId, timeLogs]);

  const totalHours = useMemo(() => {
    return filteredLogs.reduce((acc, log) => acc + log.hours, 0);
  }, [filteredLogs]);

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.displayName || 'N/A';
  const getTaskTitle = (taskId: string) => tasks.find(t => t.id === taskId)?.title || 'N/A';
  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';

  const handleExportCsv = () => {
    const headers = ['Project', 'Task', 'User', 'Description', 'Date', 'Hours'];
    const rows = filteredLogs.map(log => [
        `"${getProjectName(log.projectId)}"`,
        `"${getTaskTitle(log.taskId)}"`,
        `"${getUserName(log.userId)}"`,
        `"${log.description || ''}"`,
        log.date?.toDate ? format(log.date.toDate(), 'yyyy-MM-dd') : 'N/A',
        log.hours.toFixed(2)
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timesheet_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Log Report</CardTitle>
        <CardDescription>
          Filter and view time logs by project and user, then export the results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="grid grid-cols-2 gap-4 w-full">
                <Select onValueChange={setSelectedProjectId} defaultValue="all">
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by project..." />
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
                 <Select onValueChange={setSelectedUserId} defaultValue="all">
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by user..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map((u) => (
                        <SelectItem key={u.id} value={u.id!}>
                            {u.displayName || u.email}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button variant="outline" onClick={handleExportCsv} disabled={filteredLogs.length === 0}>
                <Download className="mr-2" />
                Export CSV
            </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{getUserName(log.userId)}</TableCell>
                    <TableCell>{getProjectName(log.projectId)}</TableCell>
                    <TableCell className="text-muted-foreground">{getTaskTitle(log.taskId)}</TableCell>
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

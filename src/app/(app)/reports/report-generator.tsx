
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as ReportTableFooter } from '@/components/ui/table';
import { Project, Task, TimeLog, UserProfile } from '@/lib/firebase/firestore';
import { format, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';


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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filteredLogs = useMemo(() => {
    return timeLogs.filter(log => {
        const projectMatch = selectedProjectId === 'all' || log.projectId === selectedProjectId;
        const userMatch = selectedUserId === 'all' || log.userId === selectedUserId;
        const logDate = log.date?.toDate();
        const dateMatch = !dateRange || !dateRange.from || !logDate
            ? true
            : isWithinInterval(logDate, {
                start: dateRange.from,
                end: dateRange.to || dateRange.from,
              });
        return projectMatch && userMatch && dateMatch;
    });
  }, [selectedProjectId, selectedUserId, dateRange, timeLogs]);

  const totalHours = useMemo(() => {
    return filteredLogs.reduce((acc, log) => acc + log.hours, 0);
  }, [filteredLogs]);

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.displayName || 'N/A';
  const getTaskTitle = (taskId: string) => tasks.find(t => t.id === taskId)?.title || 'N/A';
  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';

  const handleExportCsv = () => {
    const headers = ['Proyecto', 'Tarea', 'Usuario', 'Descripción', 'Fecha', 'Horas'];
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
    link.setAttribute("download", `informe_horas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Informe de Horas Registradas</CardTitle>
        <CardDescription>
          Filtra y visualiza los registros de tiempo por proyecto, usuario y fecha, luego exporta los resultados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <Select onValueChange={setSelectedProjectId} defaultValue="all">
                    <SelectTrigger>
                        <SelectValue placeholder="Filtrar por proyecto..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Proyectos</SelectItem>
                        {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id!}>
                            {p.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select onValueChange={setSelectedUserId} defaultValue="all">
                    <SelectTrigger>
                        <SelectValue placeholder="Filtrar por usuario..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Usuarios</SelectItem>
                        {users.map((u) => (
                        <SelectItem key={u.id} value={u.id!}>
                            {u.displayName || u.email}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-range"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Elige un rango de fechas</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
            </div>
            <Button variant="outline" onClick={handleExportCsv} disabled={filteredLogs.length === 0} className="shrink-0">
                <Download className="mr-2" />
                Exportar CSV
            </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Tarea</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Horas</TableHead>
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
                    No se encontraron registros de tiempo para los criterios seleccionados.
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

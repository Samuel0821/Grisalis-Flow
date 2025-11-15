
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Loader2, Calendar as CalendarIcon, Flag, MoreVertical } from 'lucide-react';
import { Sprint, createSprint, SprintStatus, Task } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TaskList } from './task-list';

const statusBadges: Record<SprintStatus, 'default' | 'secondary' | 'outline'> = {
  planning: 'secondary',
  active: 'default',
  completed: 'outline',
};

function SprintCard({ sprint, tasks, onStatusChange }: { sprint: Sprint; tasks: Task[]; onStatusChange: (sprintId: string, newStatus: SprintStatus) => void; }) {
  const sprintTasks = useMemo(() => tasks.filter(t => t.sprintId === sprint.id), [tasks, sprint.id]);
  
  return (
    <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center justify-between">
                <span>{sprint.name}</span>
                <div className="flex items-center gap-2">
                    <Badge variant={statusBadges[sprint.status]} className="capitalize">{sprint.status === 'planning' ? 'Planificación' : sprint.status === 'active' ? 'Activo' : 'Completado'}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {sprint.status === 'planning' && (
                            <DropdownMenuItem onClick={() => onStatusChange(sprint.id, 'active')}>Iniciar Sprint</DropdownMenuItem>
                        )}
                        {sprint.status === 'active' && (
                            <DropdownMenuItem onClick={() => onStatusChange(sprint.id, 'completed')}>Completar Sprint</DropdownMenuItem>
                        )}
                         <DropdownMenuItem disabled>Editar</DropdownMenuItem>
                         <DropdownMenuItem disabled className="text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardTitle>
            <CardDescription>
                {format(sprint.startDate.toDate(), 'PPP')} - {format(sprint.endDate.toDate(), 'PPP')}
            </CardDescription>
        </CardHeader>
        <CardContent>
           <TaskList tasks={sprintTasks} />
        </CardContent>
    </Card>
  )
}

export function SprintsView({
  projectId,
  initialSprints,
  tasks,
  onSprintCreated,
  onStatusChange,
}: {
  projectId: string;
  initialSprints: Sprint[];
  tasks: Task[];
  onSprintCreated: (sprint: Sprint) => void;
  onStatusChange: (sprintId: string, newStatus: SprintStatus) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [sprintName, setSprintName] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  useState(() => {
    setSprints(initialSprints)
  }, [initialSprints]);

  const resetForm = () => {
    setSprintName('');
    setDateRange(undefined);
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'No autenticado' });
      return;
    }
    if (!sprintName.trim() || !dateRange?.from || !dateRange?.to) {
      toast({ variant: 'destructive', title: 'Nombre y rango de fechas son requeridos' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newSprint = await createSprint({
        projectId,
        name: sprintName,
        startDate: dateRange.from,
        endDate: dateRange.to,
        status: 'planning',
      }, { uid: user.uid, displayName: user.displayName });
      onSprintCreated(newSprint);
      toast({ title: '¡Éxito!', description: 'Sprint creado.' });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al crear sprint' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Nuevo Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateSprint}>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Sprint</DialogTitle>
                <DialogDescription>
                  Planifica tu próximo sprint dándole un nombre y un rango de fechas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    className="col-span-3"
                    placeholder="Ej: Empuje final Q3"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date-range" className="text-right">
                    Rango de Fechas
                  </Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-range"
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
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
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting || !sprintName.trim() || !dateRange}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Sprint'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
       <div className="space-y-4">
          {sprints.length > 0 ? (
            <div className="space-y-4">
                {sprints.map((sprint) => (
                    <SprintCard 
                        key={sprint.id}
                        sprint={sprint}
                        tasks={tasks}
                        onStatusChange={onStatusChange}
                    />
                ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-center rounded-lg border border-dashed">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Flag className="h-10 w-10" />
                    <h2 className="text-lg font-semibold">Aún no hay sprints</h2>
                    <p className="text-sm">Crea tu primer sprint para empezar a organizar tus ciclos de trabajo.</p>
                </div>
            </div>
          )}
      </div>
    </div>
  );
}

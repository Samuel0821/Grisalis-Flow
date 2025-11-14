
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Loader2, Calendar as CalendarIcon, Flag } from 'lucide-react';
import { Sprint, createSprint, SprintStatus } from '@/lib/firebase/firestore';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusBadges: Record<SprintStatus, 'default' | 'secondary' | 'destructive'> = {
  planning: 'secondary',
  active: 'default',
  completed: 'outline',
};

export function SprintsView({
  projectId,
  initialSprints,
  onSprintCreated,
}: {
  projectId: string;
  initialSprints: Sprint[];
  onSprintCreated: (sprint: Sprint) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state
  const [sprintName, setSprintName] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const resetForm = () => {
    setSprintName('');
    setDateRange(undefined);
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    if (!sprintName.trim() || !dateRange?.from || !dateRange?.to) {
      toast({ variant: 'destructive', title: 'Name and date range are required' });
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
      });
      onSprintCreated(newSprint);
      setSprints((prev) => [...prev, newSprint]);
      toast({ title: 'Success!', description: 'Sprint created.' });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error creating sprint' });
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
              New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateSprint}>
              <DialogHeader>
                <DialogTitle>Create New Sprint</DialogTitle>
                <DialogDescription>
                  Plan your next sprint by giving it a name and a date range.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    className="col-span-3"
                    placeholder="E.g., Q3 Final Push"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date-range" className="text-right">
                    Date Range
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
                          <span>Pick a date range</span>
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
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting || !sprintName.trim() || !dateRange}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sprint'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
       <div className="border rounded-lg">
          {sprints.length > 0 ? (
            <div className="p-4 space-y-4">
                {sprints.map((sprint) => (
                    <Card key={sprint.id} className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{sprint.name}</span>
                                 <Badge variant={statusBadges[sprint.status]} className="capitalize">{sprint.status}</Badge>
                            </CardTitle>
                            <CardDescription>
                                {format(sprint.startDate.toDate(), 'PPP')} - {format(sprint.endDate.toDate(), 'PPP')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground">Tasks will be shown here.</p>
                        </CardContent>
                         <CardFooter>
                           <Button variant="secondary" size="sm">View Details</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Flag className="h-10 w-10" />
                    <h2 className="text-lg font-semibold">No sprints yet</h2>
                    <p className="text-sm">Create your first sprint to start organizing your work cycles.</p>
                </div>
            </div>
          )}
      </div>
    </div>
  );
}

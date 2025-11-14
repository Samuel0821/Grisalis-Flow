
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createBug, updateBugStatus, Bug, Project, BugPriority, BugStatus } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const priorityBadges: Record<BugPriority, 'destructive' | 'secondary' | 'outline' | 'default'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const statusBadges: Record<BugStatus, 'default' | 'secondary' | 'outline'> = {
    new: 'default',
    in_progress: 'secondary',
    resolved: 'outline',
    closed: 'outline',
};

export function BugTracker({
  initialBugs,
  projects,
  onBugCreated,
}: {
  initialBugs: Bug[];
  projects: Project[];
  onBugCreated: (bug: Bug) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bugs, setBugs] = useState<Bug[]>(initialBugs);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);


  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<BugPriority>('medium');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setProjectId('');
    setPriority('medium');
  };

  const handleReportBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    if (!title.trim() || !projectId) {
      toast({ variant: 'destructive', title: 'Title and Project are required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newBug = await createBug({
        title,
        description,
        projectId,
        priority,
        status: 'new',
        reportedBy: user.uid,
      });
      onBugCreated(newBug); // Update parent state
      setBugs((prev) => [newBug, ...prev]); // Update local state
      toast({ title: 'Success!', description: 'The bug has been reported.' });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error reporting bug:', error);
      toast({
        variant: 'destructive',
        title: 'Error reporting bug',
        description: 'Could not report the bug. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBugClick = (bug: Bug) => {
    setSelectedBug(bug);
    setIsDetailDialogOpen(true);
  };

  const handleStatusChange = async (newStatus: BugStatus) => {
    if (!selectedBug) return;

    // Optimistic update
    const originalBugs = bugs;
    const updatedBugs = bugs.map(b => b.id === selectedBug.id ? { ...b, status: newStatus } : b);
    setBugs(updatedBugs);
    setSelectedBug(prev => prev ? { ...prev, status: newStatus } : null);

    try {
      await updateBugStatus(selectedBug.id, newStatus);
      toast({ title: 'Success!', description: 'Bug status updated.' });
    } catch (error) {
      console.error('Error updating bug status:', error);
      setBugs(originalBugs); // Revert on error
      setSelectedBug(prev => prev ? { ...prev, status: selectedBug.status } : null);
      toast({
        variant: 'destructive',
        title: 'Error updating status',
        description: 'Could not update the bug status. Please try again.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Report New Bug
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleReportBug}>
              <DialogHeader>
                <DialogTitle>Report New Bug</DialogTitle>
                <DialogDescription>
                  Provide as much detail as possible to help us resolve the issue quickly.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="E.g., Login button not working on mobile"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Describe the steps to reproduce the bug."
                    disabled={isSubmitting}
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="project" className="text-right">
                    Project
                  </Label>
                  <Select onValueChange={setProjectId} value={projectId} disabled={isSubmitting}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id!}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select onValueChange={(v) => setPriority(v as BugPriority)} defaultValue="medium" disabled={isSubmitting}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reporting...
                    </>
                  ) : (
                    'Report Bug'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Reported</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bugs.length > 0 ? (
              bugs.map((bug) => {
                const project = projects.find((p) => p.id === bug.projectId);
                return (
                  <TableRow key={bug.id} onClick={() => handleBugClick(bug)} className="cursor-pointer">
                    <TableCell className="font-medium">{bug.title}</TableCell>
                    <TableCell>{project?.name || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge variant={statusBadges[bug.status]} className="capitalize">{bug.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityBadges[bug.priority]} className="capitalize">{bug.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {bug.createdAt?.toDate && formatDistanceToNow(bug.createdAt.toDate(), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No bugs reported yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          {selectedBug && (
            <>
              <DialogHeader>
                 <DialogTitle>{selectedBug.title}</DialogTitle>
                <DialogDescription>
                  Reported {selectedBug.createdAt?.toDate && formatDistanceToNow(selectedBug.createdAt.toDate(), { addSuffix: true })}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">Description</p>
                    <div className="text-muted-foreground p-3 bg-muted rounded-md min-h-[100px]">
                      {selectedBug.description ? (
                          <p className="whitespace-pre-wrap">{selectedBug.description}</p>
                      ) : (
                          <p>No description provided.</p>
                      )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold text-foreground mb-1">Project</Label>
                    <p className="text-sm text-muted-foreground">{projects.find(p => p.id === selectedBug.projectId)?.name || 'N/A'}</p>
                  </div>
                   <div>
                    <Label className="font-semibold text-foreground mb-1">Priority</Label>
                     <div>
                       <Badge variant={priorityBadges[selectedBug.priority]} className="capitalize text-sm">{selectedBug.priority}</Badge>
                     </div>
                  </div>
                   <div>
                    <Label htmlFor="status-select" className="font-semibold text-foreground mb-1">Status</Label>
                    <Select onValueChange={(v) => handleStatusChange(v as BugStatus)} value={selectedBug.status}>
                      <SelectTrigger id="status-select" className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

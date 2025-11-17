
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { createBug, updateBugStatus, Bug, Project, BugPriority, BugStatus, BugSeverity, ProjectMember, getProjectMembers, updateBug } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PlusCircle, Link as LinkIcon, ExternalLink, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const severityBadges: Record<BugSeverity, 'destructive' | 'secondary' | 'default' | 'outline'> = {
    critical: 'destructive',
    high: 'destructive',
    medium: 'secondary',
    low: 'default',
    enhancement: 'outline',
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
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<BugPriority>('medium');
  const [severity, setSeverity] = useState<BugSeverity>('medium');

  useEffect(() => {
    if(selectedBug) {
        const fetchMembers = async () => {
            const members = await getProjectMembers(selectedBug.projectId);
            setProjectMembers(members);
        }
        fetchMembers();
    }
  }, [selectedBug]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setReproductionSteps('');
    setEvidenceUrl('');
    setProjectId('');
    setPriority('medium');
    setSeverity('medium');
  };

  const handleReportBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'No autenticado' });
      return;
    }
    if (!title.trim() || !projectId) {
      toast({ variant: 'destructive', title: 'Título y Proyecto son requeridos' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newBug = await createBug({
        title,
        description,
        reproductionSteps,
        evidenceUrl,
        projectId,
        priority,
        severity,
        status: 'new',
        reportedBy: user.uid,
      }, { uid: user.uid, displayName: user.displayName });
      onBugCreated(newBug);
      setBugs((prev) => [newBug, ...prev]);
      toast({ title: '¡Éxito!', description: 'El bug ha sido reportado.' });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error reporting bug:', error);
      toast({
        variant: 'destructive',
        title: 'Error al reportar bug',
        description: 'No se pudo reportar el bug. Por favor, inténtalo de nuevo.',
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
    if (!selectedBug || !user) return;
    handleFieldUpdate('status', newStatus);
  };
  
  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!selectedBug || !user) return;
    const value = newAssigneeId === 'none' ? null : newAssigneeId;
    handleFieldUpdate('assigneeId', value);
  }

  const handleFieldUpdate = async (field: keyof Bug, value: any) => {
    if (!selectedBug || !user) return;

    const originalBugs = bugs;
    const oldBug = { ...selectedBug };

    const updatedBug = { ...selectedBug, [field]: value };
    const updatedBugs = bugs.map(b => b.id === selectedBug.id ? updatedBug : b);
    setBugs(updatedBugs);
    setSelectedBug(updatedBug);

    try {
        await updateBug(selectedBug.id, { [field]: value }, {uid: user.uid, displayName: user.displayName}, selectedBug.title);
        toast({ title: '¡Éxito!', description: 'El bug ha sido actualizado.' });
    } catch (error) {
        console.error(`Error updating bug field ${field}:`, error);
        setBugs(originalBugs);
        setSelectedBug(oldBug);
        toast({
            variant: 'destructive',
            title: 'Error al actualizar',
            description: `No se pudo actualizar el campo. Por favor, inténtalo de nuevo.`,
        });
    }
  };

  const getAssignee = (bug: Bug) => {
    if (!bug.assigneeId) return null;
    // We might not have members for all projects loaded, so we look in all users
    const allKnownMembers = projects.flatMap(p => p.members || []);
    return allKnownMembers.find(m => m.userId === bug.assigneeId) || projectMembers.find(m => m.userId === bug.assigneeId);
  }

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/.test(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Reportar Nuevo Bug
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleReportBug}>
              <DialogHeader>
                <DialogTitle>Reportar Nuevo Bug</DialogTitle>
                <DialogDescription>
                  Proporciona tantos detalles como sea posible para ayudarnos a resolver el problema rápidamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="Ej: El botón de login no funciona en móvil"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Describe el bug y su impacto."
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="reproduction" className="text-right pt-2">
                    Reproducción
                  </Label>
                  <Textarea
                    id="reproduction"
                    value={reproductionSteps}
                    onChange={(e) => setReproductionSteps(e.target.value)}
                    className="col-span-3"
                    placeholder="Describe los pasos para reproducir el bug."
                    disabled={isSubmitting}
                    rows={5}
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="evidence" className="text-right">
                    URL de Evidencia
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                     <LinkIcon className="h-4 w-4 text-muted-foreground" />
                     <Input
                        id="evidence"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        className="flex-1"
                        placeholder="https://ejemplo.com/captura.png"
                        disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="project" className="text-right">
                    Proyecto
                  </Label>
                  <Select onValueChange={setProjectId} value={projectId} disabled={isSubmitting}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un proyecto" />
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
                    Prioridad
                  </Label>
                  <Select onValueChange={(v) => setPriority(v as BugPriority)} defaultValue="medium" disabled={isSubmitting}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="severity" className="text-right">
                    Severidad
                  </Label>
                  <Select onValueChange={(v) => setSeverity(v as BugSeverity)} defaultValue="medium" disabled={isSubmitting}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona severidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Crítica</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="enhancement">Mejora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reportando...
                    </>
                  ) : (
                    'Reportar Bug'
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
              <TableHead>Título</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Reportado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bugs.length > 0 ? (
              bugs.map((bug) => {
                const assignee = getAssignee(bug);
                return (
                  <TableRow key={bug.id} onClick={() => handleBugClick(bug)} className="cursor-pointer">
                    <TableCell className="font-medium">{bug.title}</TableCell>
                    <TableCell>
                      {assignee ? (
                         <div className="flex items-center gap-2">
                           <Avatar className="h-6 w-6">
                             <AvatarFallback>{assignee.displayName.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <span className="text-sm">{assignee.displayName}</span>
                         </div>
                       ) : (
                         <span className="text-muted-foreground text-sm">Sin asignar</span>
                       )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityBadges[bug.priority]} className="capitalize">{bug.priority}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={statusBadges[bug.status]} className="capitalize">{bug.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      {bug.createdAt?.toDate && formatDistanceToNow(bug.createdAt.toDate(), { addSuffix: true, locale: es })}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Aún no se han reportado bugs.
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
                  Reportado {selectedBug.createdAt?.toDate && formatDistanceToNow(selectedBug.createdAt.toDate(), { addSuffix: true, locale: es })}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                 <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">Descripción</p>
                    <div className="text-muted-foreground p-3 bg-muted rounded-md min-h-[80px]">
                      {selectedBug.description ? (
                          <p className="whitespace-pre-wrap">{selectedBug.description}</p>
                      ) : (
                          <p>No se proporcionó descripción.</p>
                      )}
                    </div>
                </div>

                <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">Pasos de Reproducción</p>
                    <div className="text-muted-foreground p-3 bg-muted rounded-md min-h-[100px]">
                      {selectedBug.reproductionSteps ? (
                          <p className="whitespace-pre-wrap">{selectedBug.reproductionSteps}</p>
                      ) : (
                          <p>No se proporcionaron pasos de reproducción.</p>
                      )}
                    </div>
                </div>
                
                {selectedBug.evidenceUrl && (
                    <div className="text-sm">
                        <p className="font-semibold text-foreground mb-1">Evidencia</p>
                         {isImageUrl(selectedBug.evidenceUrl) ? (
                            <div className="p-2 border rounded-md">
                                <Image src={selectedBug.evidenceUrl} alt="Evidencia del bug" width={500} height={300} className="rounded-md object-contain" />
                            </div>
                        ) : (
                             <Link href={selectedBug.evidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                Ver Evidencia <ExternalLink className="h-4 w-4"/>
                             </Link>
                        )}
                    </div>
                )}
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold text-foreground mb-1">Severidad</Label>
                         <div>
                           <Badge variant={severityBadges[selectedBug.severity]} className="capitalize text-sm">{selectedBug.severity === 'enhancement' ? 'Mejora' : selectedBug.severity}</Badge>
                         </div>
                      </div>
                       <div>
                        <Label className="font-semibold text-foreground mb-1">Prioridad</Label>
                         <div>
                           <Badge variant={priorityBadges[selectedBug.priority]} className="capitalize text-sm">{selectedBug.priority}</Badge>
                         </div>
                      </div>
                   </div>

                    <div>
                        <Label htmlFor="assignee-select" className="font-semibold text-foreground mb-1">Asignado a</Label>
                        <Select onValueChange={handleAssigneeChange} value={selectedBug.assigneeId || 'none'}>
                        <SelectTrigger id="assignee-select" className="w-full">
                            <SelectValue placeholder="Selecciona un miembro" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin asignar</SelectItem>
                            {projectMembers.map((member) => (
                                <SelectItem key={member.userId} value={member.userId}>
                                    {member.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>

                   <div>
                    <Label htmlFor="status-select" className="font-semibold text-foreground mb-1">Estado</Label>
                    <Select onValueChange={(v) => handleStatusChange(v as BugStatus)} value={selectedBug.status}>
                      <SelectTrigger id="status-select" className="w-full">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nuevo</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="resolved">Resuelto</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
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

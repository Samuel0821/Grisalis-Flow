
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
import { createBug, updateBugStatus, Bug, Project, BugPriority, BugStatus, BugSeverity } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PlusCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

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


  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<BugPriority>('medium');
  const [severity, setSeverity] = useState<BugSeverity>('medium');

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

    const originalBugs = bugs;
    const oldStatus = selectedBug.status;
    const updatedBugs = bugs.map(b => b.id === selectedBug.id ? { ...b, status: newStatus } : b);
    setBugs(updatedBugs);
    setSelectedBug(prev => prev ? { ...prev, status: newStatus } : null);

    try {
      await updateBugStatus(selectedBug.id, selectedBug.title, newStatus, oldStatus, { uid: user.uid, displayName: user.displayName });
      toast({ title: '¡Éxito!', description: 'Estado del bug actualizado.' });
    } catch (error) {
      console.error('Error updating bug status:', error);
      setBugs(originalBugs);
      setSelectedBug(prev => prev ? { ...prev, status: selectedBug.status } : null);
      toast({
        variant: 'destructive',
        title: 'Error al actualizar estado',
        description: 'No se pudo actualizar el estado del bug. Por favor, inténtalo de nuevo.',
      });
    }
  };

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
              <TableHead>Severidad</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Reportado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bugs.length > 0 ? (
              bugs.map((bug) => {
                return (
                  <TableRow key={bug.id} onClick={() => handleBugClick(bug)} className="cursor-pointer">
                    <TableCell className="font-medium">{bug.title}</TableCell>
                    <TableCell>
                      <Badge variant={severityBadges[bug.severity]} className="capitalize">{bug.severity === 'enhancement' ? 'Mejora' : bug.severity}</Badge>
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="font-semibold text-foreground mb-1">Proyecto</Label>
                    <p className="text-sm text-muted-foreground">{projects.find(p => p.id === selectedBug.projectId)?.name || 'N/A'}</p>
                  </div>
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
                   <div className="col-span-3">
                    <Label htmlFor="status-select" className="font-semibold text-foreground mb-1">Estado</Label>
                    <Select onValueChange={(v) => handleStatusChange(v as BugStatus)} value={selectedBug.status}>
                      <SelectTrigger id="status-select" className="w-[180px]">
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

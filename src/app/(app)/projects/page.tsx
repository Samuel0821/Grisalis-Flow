
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  Project,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useUser } from '@/firebase';

export default function ProjectsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        setIsLoading(true);
        try {
          const userProjects = await getProjects(user.uid);
          setProjects(userProjects);
        } catch (error) {
          console.error('Error fetching projects:', error);
          toast({
            variant: 'destructive',
            title: 'Error al cargar proyectos',
            description: 'No se pudieron cargar los proyectos. Por favor, inténtalo de nuevo.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjects();
    }
  }, [user, toast]);
  
  const resetForm = () => {
      setProjectName('');
      setProjectDescription('');
      setCurrentProject(null);
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectName.trim()) return;

    setIsSubmitting(true);
    try {
      const newProject = await createProject({
        name: projectName,
        description: projectDescription,
        createdBy: user.uid,
      }, { uid: user.uid, displayName: user.displayName, email: user.email });
      setProjects((prev) => [...prev, newProject]);
      toast({ title: '¡Éxito!', description: `Proyecto "${projectName}" creado.` });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al crear proyecto' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !currentProject || !projectName.trim()) return;

      setIsSubmitting(true);
      try {
          await updateProject(currentProject.id!, { name: projectName, description: projectDescription }, { uid: user.uid, displayName: user.displayName });
          setProjects(prev => prev.map(p => p.id === currentProject.id ? {...p, name: projectName, description: projectDescription} : p));
          toast({ title: '¡Éxito!', description: `Proyecto "${projectName}" actualizado.` });
          resetForm();
          setIsEditDialogOpen(false);
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Error al actualizar proyecto' });
      } finally {
          setIsSubmitting(false);
      }
  }
  
  const handleDeleteProject = async () => {
      if (!user || !currentProject) return;

      try {
          await deleteProject(currentProject.id!, currentProject.name, { uid: user.uid, displayName: user.displayName });
          setProjects(prev => prev.filter(p => p.id !== currentProject.id));
          toast({ title: '¡Éxito!', description: `Proyecto "${currentProject.name}" eliminado.`});
          resetForm();
          setIsDeleteDialogOpen(false);
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Error al eliminar proyecto' });
      }
  }
  
  const openEditDialog = (project: Project) => {
      setCurrentProject(project);
      setProjectName(project.name);
      setProjectDescription(project.description || '');
      setIsEditDialogOpen(true);
  }
  
  const openDeleteDialog = (project: Project) => {
      setCurrentProject(project);
      setIsDeleteDialogOpen(true);
  }

  return (
    <>
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-headline text-3xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">Crea y gestiona tus proyectos aquí.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Crear Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateProject}>
              <DialogHeader>
                <DialogTitle>Crear nuevo proyecto</DialogTitle>
                <DialogDescription>
                  Dale a tu nuevo proyecto un nombre y una descripción.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="col-span-3"
                    placeholder="Mi increíble proyecto"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Describe de qué trata tu proyecto."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting || !projectName.trim()}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</>
                  ) : 'Crear Proyecto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="h-full flex flex-col">
                 <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>
                           <Link href={`/projects/${project.id}`} className="hover:underline">
                                {project.name}
                            </Link>
                        </CardTitle>
                        {project.description && (
                            <CardDescription className="line-clamp-2 pt-2">{project.description}</CardDescription>
                        )}
                    </div>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(project)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(project)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
              <CardContent className="flex-grow">
                 {/* Content can go here */}
              </CardContent>
              <CardFooter>
                  <p className="text-sm text-muted-foreground">Estado: <span className="font-medium text-foreground">{project.status || 'Activo'}</span></p>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <h2 className="text-lg font-semibold">Aún no hay proyectos</h2>
            <p className="text-sm">¡Crea tu primer proyecto para empezar!</p>
          </div>
        </div>
      )}
    </div>

    {/* Edit Project Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleEditProject}>
            <DialogHeader>
                <DialogTitle>Editar Proyecto</DialogTitle>
                <DialogDescription>
                Actualiza el nombre y la descripción de tu proyecto.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                    Nombre
                </Label>
                <Input
                    id="edit-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="col-span-3"
                    disabled={isSubmitting}
                />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                    Descripción
                </Label>
                <Textarea
                    id="edit-description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="col-span-3"
                    disabled={isSubmitting}
                />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting || !projectName.trim()}>
                {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                ) : 'Guardar Cambios'}
                </Button>
            </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    
    {/* Delete Project Alert Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => { setIsDeleteDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto
            <span className="font-bold"> {currentProject?.name}</span> y todas sus tareas y bugs asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

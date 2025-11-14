
'use client';

import { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createProject, getProjects, Project } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

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
            description: 'No se pudieron cargar los proyectos. Inténtalo de nuevo.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjects();
    }
  }, [user, toast]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'No autenticado',
        description: 'Debes iniciar sesión para crear un proyecto.',
      });
      return;
    }
    if (!newProjectName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nombre requerido',
        description: 'El nombre del proyecto no puede estar vacío.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = newProjectName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      const newProject = await createProject({
        name: newProjectName,
        description: newProjectDescription,
        slug,
        createdBy: user.uid,
      });
      setProjects((prevProjects) => [...prevProjects, newProject]);
      toast({
        title: '¡Éxito!',
        description: `El proyecto "${newProjectName}" ha sido creado.`,
      });
      setNewProjectName('');
      setNewProjectDescription('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear proyecto',
        description: 'No se pudo crear el proyecto. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-headline text-3xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">Crea y gestiona tus proyectos aquí.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  Dale un nombre y una descripción a tu nuevo proyecto.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
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
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Describe de qué se trata tu proyecto."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Proyecto'
                  )}
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
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Estado: <span className="font-medium text-foreground">{project.status || 'Activo'}</span></p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <h2 className="text-lg font-semibold">No hay proyectos todavía</h2>
            <p className="text-sm">¡Crea tu primer proyecto para empezar a trabajar!</p>
          </div>
        </div>
      )}
    </div>
  );
}

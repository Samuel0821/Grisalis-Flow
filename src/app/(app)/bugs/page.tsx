
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getBugs, getProjects, Bug, Project } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BugTracker } from './bug-tracker';

export default function BugsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [bugData, projectData] = await Promise.all([
            getBugs(),
            getProjects(user.uid),
          ]);
          setBugs(bugData);
          setProjects(projectData);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            variant: 'destructive',
            title: 'Error al cargar datos',
            description: 'No se pudieron cargar los bugs o proyectos.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);

  const handleBugCreated = (newBug: Bug) => {
    setBugs((prevBugs) => [newBug, ...prevBugs].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Seguimiento de Bugs</h1>
        <p className="text-muted-foreground">Monitorea, rastrea y resuelve bugs de manera eficiente.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <BugTracker
          initialBugs={bugs}
          projects={projects}
          onBugCreated={handleBugCreated}
        />
      )}
    </div>
  );
}


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
            getProjects(), // Fetches all projects for bug association
          ]);
          setBugs(bugData);
          setProjects(projectData);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            variant: 'destructive',
            title: 'Error loading data',
            description: 'Could not load bugs or projects.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);

  const handleBugCreated = (newBug: Bug) => {
    setBugs((prevBugs) => [newBug, ...prevBugs].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()));
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Bug Tracker</h1>
        <p className="text-muted-foreground">Monitor, track, and resolve bugs efficiently.</p>
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

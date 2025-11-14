
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getProjects, getTasksForProjects, Project, Task, getTimeLogs, TimeLog } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportGenerator } from './report-generator';

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch all projects for filtering, all tasks for referencing, and all time logs for reporting
          const projectData = await getProjects();
          setProjects(projectData);

          const projectIds = projectData.map(p => p.id!);
          if (projectIds.length > 0) {
              const [taskData, timeLogData] = await Promise.all([
                  getTasksForProjects(projectIds),
                  // For reports, we might want all logs, not just the user's.
                  // Assuming getTimeLogs can be adapted or a new function created.
                  // For now, it gets the current user's logs. We can expand this.
                  getTimeLogs(user.uid) 
              ]);
              setTasks(taskData);
              setTimeLogs(timeLogData);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            variant: 'destructive',
            title: 'Error loading data',
            description: 'Could not load data for reports.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and view reports for your projects.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ReportGenerator
          projects={projects}
          tasks={tasks}
          timeLogs={timeLogs}
        />
      )}
    </div>
  );
}

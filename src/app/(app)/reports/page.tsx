
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getProjects, getTasksForProjects, Project, Task, getTimeLogs, TimeLog, getAllUsers, UserProfile } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportGenerator } from './report-generator';

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch all data needed for the report generator
          const [projectData, taskData, timeLogData, userData] = await Promise.all([
            getProjects(),
            getTasksForProjects([]), // Fetch all tasks for lookups
            getTimeLogs(), // Fetch all time logs for reporting
            getAllUsers(), // Fetch all users for filtering
          ]);
          setProjects(projectData);
          setTasks(taskData);
          setTimeLogs(timeLogData);
          setUsers(userData);
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
          users={users}
        />
      )}
    </div>
  );
}

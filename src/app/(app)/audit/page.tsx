
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAuditLogs, AuditLog, getUserProfile, UserProfile } from '@/lib/firebase/firestore';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuditLogPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          if (profile && profile.role === 'admin') {
            const logData = await getAuditLogs();
            setLogs(logData);
          }
        } catch (error) {
          console.error('Error fetching audit logs:', error);
          toast({
            variant: 'destructive',
            title: 'Error loading audit logs',
            description: 'Could not load audit log data.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="mt-4">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">
                    You do not have the required permissions to view this page. Please contact an administrator if you believe this is an error.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Track important events and changes in the system. Only visible to Admins.</p>
      </div>
        <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => {
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.userName}</TableCell>
                    <TableCell className="capitalize">{log.entity}: <span className="text-muted-foreground text-xs font-mono">{log.entityId}</span></TableCell>
                    <TableCell>
                      {log.timestamp?.toDate && formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

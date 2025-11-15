
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAllUsers, getUserProfile, UserProfile } from '@/lib/firebase/firestore';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserManagement } from './user-management';


export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
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
            const usersData = await getAllUsers();
            setUsers(usersData);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          toast({
            variant: 'destructive',
            title: 'Error al cargar los usuarios',
            description: 'No se pudieron cargar los datos de los usuarios.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);
  
  const handleUserCreated = (newUser: UserProfile) => {
    setUsers(prev => [...prev, newUser].sort((a, b) => a.displayName!.localeCompare(b.displayName!)));
  };

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
                <CardTitle className="mt-4">Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">
                    No tienes los permisos necesarios para ver esta página. Por favor, contacta a un administrador si crees que esto es un error.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Crea y gestiona los usuarios del sistema. Solo visible para Administradores.</p>
      </div>
       <UserManagement initialUsers={users} onUserCreated={handleUserCreated} />
    </div>
  );
}

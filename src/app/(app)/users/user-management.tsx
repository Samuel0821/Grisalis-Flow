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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { UserProfile } from '@/lib/firebase/firestore';
import { createUserWithEmailAndPassword, deleteAllOtherUsers } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PlusCircle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const roleBadges: Record<UserProfile['role'], 'destructive' | 'secondary'> = {
  admin: 'destructive',
  member: 'secondary',
};

export function UserManagement({
  initialUsers,
  onUserCreated,
  onUsersReset,
}: {
  initialUsers: UserProfile[];
  onUserCreated: (user: UserProfile) => void;
  onUsersReset: () => void;
}) {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setRole('member');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      toast({ variant: 'destructive', title: 'Todos los campos son requeridos' });
      return;
    }
     if (password.length < 6) {
        toast({ variant: 'destructive', title: 'Contraseña débil', description: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(email, password, displayName, role);
      
      const newUserProfile: UserProfile = {
        id: userCredential.user.uid,
        email,
        displayName,
        role,
        createdAt: new Date() as any, 
      };

      onUserCreated(newUserProfile);

      toast({ title: '¡Éxito!', description: `Usuario ${displayName} creado.` });
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating user:', error);
      let description = 'No se pudo crear el usuario. Por favor, inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este correo electrónico ya está en uso.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'El formato del correo electrónico no es válido.';
      }
      toast({
        variant: 'destructive',
        title: 'Error al crear usuario',
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResetUsers = async () => {
    if (!adminUser) return;
    setIsResetting(true);
    try {
        await deleteAllOtherUsers(adminUser.uid);
        onUsersReset();
        toast({ title: "Sistema Restablecido", description: "Todos los usuarios (excepto tú) han sido eliminados." });
    } catch(error: any) {
        toast({ variant: 'destructive', title: "Error al Restablecer", description: error.message });
    } finally {
        setIsResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
              Restablecer Usuarios
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible. Se eliminarán **TODOS** los usuarios del sistema de autenticación y de la base de datos de perfiles, **excepto tu propia cuenta de administrador**. Esto es útil para limpiar usuarios "fantasma" o empezar de cero.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleResetUsers}
                disabled={isResetting}
              >
                Sí, restablecer todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Crear Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Completa los detalles para añadir un nuevo usuario al sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre Completo</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    disabled={isSubmitting}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej: juan.perez@empresa.com"
                    disabled={isSubmitting}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Debe tener al menos 6 caracteres"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select onValueChange={(v) => setRole(v as 'admin' | 'member')} value={role} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Miembro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
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
                    'Crear Usuario'
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
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fecha de Creación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length > 0 ? (
              initialUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadges[u.role]} className="capitalize">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.createdAt?.toDate && format(u.createdAt.toDate(), 'PPP', { locale: es })}
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

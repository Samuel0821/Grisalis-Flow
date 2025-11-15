
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
  DialogClose
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserProfile, deleteUserProfile, updateUserProfile } from '@/lib/firebase/firestore';
import { createUserWithEmailAndPassword } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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
}: {
  initialUsers: UserProfile[];
  onUserCreated: (user: UserProfile) => void;
  onUsersReset: () => void;
}) {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  // Create form state
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  
  const resetCreateForm = () => {
    setNewDisplayName('');
    setNewEmail('');
    setNewPassword('');
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;

    setIsSubmitting(true);
    try {
        const newUserProfile = await createUserWithEmailAndPassword(newEmail, newPassword, newDisplayName);
        onUserCreated(newUserProfile);
        toast({
            title: "Usuario Creado",
            description: `Se ha creado a ${newDisplayName}. La página se recargará para restaurar tu sesión de administrador.`,
        });
        resetCreateForm();
        setIsCreateDialogOpen(false);
        // Reload to restore admin session and avoid being logged out
        setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
         if (error.code === 'auth/email-already-in-use') {
            toast({
                variant: 'destructive',
                title: 'El correo ya existe',
                description: 'Este correo ya está registrado. Se intentará crear o actualizar su perfil en la base de datos.',
            });
            // Try to create the profile anyway
            const newUserProfile = await createUserWithEmailAndPassword(newEmail, newPassword, newDisplayName);
            onUserCreated(newUserProfile);
            setIsCreateDialogOpen(false);
            setTimeout(() => window.location.reload(), 2000);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error al crear usuario',
                description: error.message,
            });
        }
    } finally {
        setIsSubmitting(false);
    }
  }

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member');

  const handleDeleteUser = async (userToDelete: UserProfile) => {
    if (!adminUser) return;
    try {
        await deleteUserProfile(userToDelete.id);
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast({ title: "Perfil de usuario eliminado", description: `${userToDelete.displayName} ha sido eliminado de la aplicación.`});
    } catch (error) {
        console.error("Error deleting user profile:", error);
        toast({ variant: 'destructive', title: "Error", description: "No se pudo eliminar el perfil del usuario." });
    }
  }
  
  const openEditDialog = (user: UserProfile) => {
    setUserToEdit(user);
    setEditDisplayName(user.displayName || '');
    setEditRole(user.role);
    setIsEditDialogOpen(true);
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit || !adminUser) return;

    setIsSubmitting(true);
    const updateData = {
        displayName: editDisplayName,
        role: editRole
    };

    try {
        await updateUserProfile(userToEdit.id, updateData, { uid: adminUser.uid, displayName: adminUser.displayName });
        setUsers(prev => prev.map(u => u.id === userToEdit.id ? { ...u, ...updateData } : u));
        toast({ title: "Usuario actualizado", description: `Se han guardado los cambios para ${editDisplayName}.`});
        setIsEditDialogOpen(false);
        setUserToEdit(null);
    } catch (error) {
        console.error("Error updating user:", error);
        toast({ variant: 'destructive', title: "Error", description: "No se pudo actualizar el usuario." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
         <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Crear Usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleCreateUser}>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                        <DialogDescription>
                            Crea una cuenta para un nuevo miembro del equipo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-displayName">Nombre Completo</Label>
                            <Input
                            id="new-displayName"
                            value={newDisplayName}
                            onChange={(e) => setNewDisplayName(e.target.value)}
                            disabled={isSubmitting}
                            required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-email">Email</Label>
                            <Input
                            id="new-email"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            disabled={isSubmitting}
                            required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Contraseña</Label>
                            <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isSubmitting}
                            required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
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
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadges[u.role]} className="capitalize">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'PPP', { locale: es }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                       {adminUser?.uid !== u.id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(u)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción eliminará el perfil de <span className='font-bold'>{u.displayName}</span> de la aplicación. Perderá acceso a sus datos.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={() => handleDeleteUser(u)}
                                            >
                                                Sí, eliminar perfil
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                       )}
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditUser}>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica el nombre y el rol del usuario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Nombre Completo</Label>
                <Input
                  id="edit-displayName"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="edit-email">Email (solo lectura)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={userToEdit?.email || ''}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select onValueChange={(v) => setEditRole(v as 'admin' | 'member')} value={editRole} disabled={isSubmitting}>
                  <SelectTrigger id="edit-role">
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
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


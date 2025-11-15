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
import { Loader2, PlusCircle, MoreHorizontal, Edit, Trash2, RefreshCw } from 'lucide-react';
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
  onUsersReset
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

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

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

  const handleResetUsers = () => {
    onUsersReset();
    toast({
        title: "Restableciendo usuarios...",
        description: "Se están restaurando los usuarios de fábrica. La página se recargará."
    });
    setTimeout(() => {
        window.location.reload();
    }, 2000);
  }
  

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Restablecer Usuarios de Fábrica
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará a TODOS los usuarios actuales y restaurará la lista de usuarios predeterminada. 
                        Es útil si tienes usuarios duplicados o con errores que no puedes eliminar. 
                        Cualquier usuario que hayas creado se perderá.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetUsers} className="bg-destructive hover:bg-destructive/90">
                        Sí, restablecer usuarios
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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

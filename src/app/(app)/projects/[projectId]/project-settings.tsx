
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';
import {
  Project,
  UserProfile,
  ProjectMember,
  getAllUsers,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from '@/lib/firebase/firestore';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

export function ProjectSettings({ project }: { project: Project }) {
  const { user } = useUser();
  const { toast } = useToast();

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add member form
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [usersData, membersData] = await Promise.all([
          getAllUsers(),
          getProjectMembers(project.id!),
        ]);
        setAllUsers(usersData);
        setMembers(membersData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load project settings data.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [project.id, toast]);

  const nonMemberUsers = allUsers.filter(u => !members.some(m => m.userId === u.id));

  const handleAddMember = async () => {
    if (!selectedUserId || !user) return;
    const selectedUser = allUsers.find(u => u.id === selectedUserId);
    if (!selectedUser) return;

    setIsAddingMember(true);
    try {
      const newMember: Omit<ProjectMember, 'id'> = {
        userId: selectedUser.id,
        projectId: project.id!,
        role: 'member',
        displayName: selectedUser.displayName || selectedUser.email,
        email: selectedUser.email,
      };
      await addProjectMember(project.id!, newMember, {uid: user.uid, displayName: user.displayName});
      
      const newMemberWithId = { ...newMember, id: selectedUser.id };
      setMembers(prev => [...prev, newMemberWithId as ProjectMember]);
      setSelectedUserId('');
      toast({ title: 'Success', description: `${selectedUser.displayName || selectedUser.email} has been added to the project.`});

    } catch (error) {
        console.error(error)
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add member.' });
    } finally {
        setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberToRemove: ProjectMember) => {
    if (!user) return;
    try {
        await removeProjectMember(project.id!, memberToRemove.userId, memberToRemove.displayName, { uid: user.uid, displayName: user.displayName });
        setMembers(prev => prev.filter(m => m.userId !== memberToRemove.userId));
        toast({ title: 'Success', description: `${memberToRemove.displayName} has been removed from the project.`});
    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove member.' });
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin" /></div>;
  }

  const isOwner = members.some(m => m.userId === user?.uid && m.role === 'owner');

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Members</CardTitle>
          <CardDescription>Add or remove members from this project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isOwner && (
            <div className="p-4 border rounded-lg bg-background space-y-4">
                <h4 className="font-medium">Add New Member</h4>
                <div className="flex items-center gap-2">
                    <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a user to add" />
                        </SelectTrigger>
                        <SelectContent>
                            {nonMemberUsers.length > 0 ? (
                                nonMemberUsers.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.displayName || u.email}</SelectItem>
                                ))
                            ) : (
                                <p className="p-2 text-sm text-muted-foreground">All users are already in the project.</p>
                            )}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddMember} disabled={isAddingMember || !selectedUserId}>
                        {isAddingMember ? <Loader2 className="animate-spin" /> : <UserPlus />}
                        <span className="ml-2">Add Member</span>
                    </Button>
                </div>
            </div>
          )}

          <div className="space-y-4">
             <h4 className="font-medium">Current Members</h4>
             <div className="border rounded-lg">
                {members.map(member => (
                    <div key={member.userId} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{member.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{member.displayName}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-2'>
                           <span className="text-sm font-medium text-muted-foreground capitalize bg-muted px-2 py-1 rounded-md">{member.role}</span>
                           {isOwner && member.role !== 'owner' && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove <span className='font-bold'>{member.displayName}</span> from the project. They will lose access to its tasks and bugs. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveMember(member)} className="bg-destructive hover:bg-destructive/90">Remove Member</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                           )}
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Other settings cards can go here */}
    </div>
  );
}

    
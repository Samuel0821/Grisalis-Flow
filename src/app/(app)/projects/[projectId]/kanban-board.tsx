
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, ArrowUp, ArrowRight, ArrowDown, MessageSquare, Trash2, CheckSquare, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Task, createTask, updateTask, updateTaskStatus, TaskStatus, TaskPriority, Comment, addComment, getComments, Sprint, ProjectMember, TaskType, deleteTask, getProjectMembers } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser } from '@/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import Link from 'next/link';


type ColumnId = TaskStatus;

const columns: { id: ColumnId; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'Por Hacer' },
  { id: 'in_progress', title: 'En Progreso' },
  { id: 'testing', title: 'En Pruebas' },
  { id: 'in_review', title: 'En Revisión' },
  { id: 'done', title: 'Hecho' },
];

const priorityIcons: Record<TaskPriority, React.ReactNode> = {
  high: <ArrowUp className="text-destructive" />,
  medium: <ArrowRight className="text-yellow-500" />,
  low: <ArrowDown className="text-green-500" />,
};

const priorityBadges: Record<TaskPriority, 'destructive' | 'secondary' | 'outline'> = {
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
}

function KanbanColumn({ title, tasks, subtasks, columnId, onTaskClick }: { title: string; tasks: Task[]; subtasks: Task[]; columnId: ColumnId; onTaskClick: (task: Task) => void; }) {

  const getSubtasksForTask = (taskId: string) => {
    return subtasks.filter(st => st.parentId === taskId);
  }
  
  return (
    <Card className="flex-1 flex flex-col bg-muted/50 max-h-[calc(100vh-22rem)]">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">{tasks.length}</span>
        </CardTitle>
      </CardHeader>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <CardContent
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 flex flex-col gap-2 overflow-y-auto p-2 rounded-md transition-colors',
              snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-transparent'
            )}
          >
            {tasks.map((task, index) => {
              const relevantSubtasks = getSubtasksForTask(task.id);
              const completedSubtasks = relevantSubtasks.filter(st => st.status === 'done').length;

              return (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => onTaskClick(task)}
                      className="cursor-pointer"
                    >
                      <Card className={cn('p-4 shadow-sm', snapshot.isDragging && 'shadow-lg')}>
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium pr-2">{task.title}</h4>
                          {priorityIcons[task.priority]}
                        </div>
                        {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                        
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={priorityBadges[task.priority]} className="capitalize">{task.priority}</Badge>
                          {relevantSubtasks.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <CheckSquare className="h-4 w-4" />
                               <span>{completedSubtasks}/{relevantSubtasks.length}</span>
                            </div>
                          )}
                        </div>

                      </Card>
                    </div>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
            {tasks.length === 0 && (
              <div className="flex justify-center items-center h-full text-sm text-muted-foreground p-4">
                Aún no hay tareas.
              </div>
            )}
          </CardContent>
        )}
      </Droppable>
    </Card>
  );
}

function TaskDetailDialog({ task, sprints, members, subtasks, isOpen, onOpenChange, onTaskUpdated, onSubtaskCreated, onSubtaskDeleted }: { task: Task | null; sprints: Sprint[]; members: ProjectMember[]; subtasks: Task[]; isOpen: boolean; onOpenChange: (open: boolean) => void; onTaskUpdated: (updatedTask: Partial<Task> & {id: string}) => void; onSubtaskCreated: (newSubtask: Task) => void; onSubtaskDeleted: (subtaskId: string) => void; }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);

    const [assigneeId, setAssigneeId] = useState(task?.assigneeId || 'none');
    const [sprintId, setSprintId] = useState(task?.sprintId || 'none');
    const [attachmentUrl, setAttachmentUrl] = useState(task?.attachmentUrl || '');


    const relevantSubtasks = useMemo(() => {
        if (!task) return [];
        return subtasks.filter(st => st.parentId === task.id);
    }, [task, subtasks]);

    const completedSubtasksCount = useMemo(() => {
        return relevantSubtasks.filter(st => st.status === 'done').length;
    }, [relevantSubtasks]);

    const subtaskProgress = relevantSubtasks.length > 0 ? (completedSubtasksCount / relevantSubtasks.length) * 100 : 0;
    
    const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/.test(url);


    useEffect(() => {
        if (task && isOpen) {
            setAssigneeId(task.assigneeId || 'none');
            setSprintId(task.sprintId || 'none');
            setAttachmentUrl(task.attachmentUrl || '');

            const unsubscribe = getComments(task.id, (newComments) => {
                setComments(newComments);
            });
            return () => unsubscribe();
        }
    }, [task, isOpen]);
    
    const handleFieldUpdate = async (field: keyof Task, value: any) => {
        if (!task || !user) return;
        const originalValue = task[field];
        
        onTaskUpdated({ id: task.id, [field]: value });

        try {
            await updateTask(task.id, { [field]: value, title: task.title, projectId: task.projectId }, { uid: user.uid, displayName: user.displayName });
            toast({ title: 'Tarea Actualizada', description: `El campo '${field}' de la tarea ha sido actualizado.`});
        } catch (error) {
            console.error(error);
            onTaskUpdated({ id: task.id, [field]: originalValue });
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la tarea.' });
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !task || !newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            await addComment(task.id, {
                userId: user.uid,
                userName: user.displayName || 'Anónimo',
                userAvatar: user.photoURL || '',
                text: newComment,
            });
            setNewComment('');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo publicar el comentario.' });
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !task || !newSubtaskTitle.trim()) return;

        setIsAddingSubtask(true);
        try {
            const newSubtask = await createTask({
                projectId: task.projectId,
                parentId: task.id,
                title: newSubtaskTitle,
                status: 'todo',
                priority: task.priority,
                type: 'subtask',
                createdBy: user.uid,
            }, { uid: user.uid, displayName: user.displayName });
            onSubtaskCreated(newSubtask);
            setNewSubtaskTitle('');
        } catch(error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la subtarea.' });
        } finally {
            setIsAddingSubtask(false);
        }
    }

    const handleSubtaskCheckedChange = async (subtask: Task, isChecked: boolean) => {
        if (!user) return;
        const newStatus = isChecked ? 'done' : 'todo';
        const oldStatus = subtask.status;

        onTaskUpdated({ id: subtask.id, status: newStatus });

        try {
            await updateTaskStatus(subtask.id, subtask.title, newStatus, oldStatus, { uid: user.uid, displayName: user.displayName });
        } catch (error) {
            onTaskUpdated({ id: subtask.id, status: oldStatus });
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado de la subtarea.' });
        }
    };

    const handleDeleteSubtask = async (subtask: Task) => {
        if (!user) return;
        
        try {
            await deleteTask(subtask.id, subtask.title, { uid: user.uid, displayName: user.displayName });
            onSubtaskDeleted(subtask.id);
            toast({ title: 'Subtarea Eliminada' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la subtarea.' });
        }
    }


    if (!task) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {priorityIcons[task.priority]}
                        <DialogTitle>{task.title}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Estado: <Badge variant="secondary" className="capitalize">{task.status.replace('_', ' ')}</Badge>
                        <span className="mx-2">·</span>
                        Prioridad: <Badge variant={priorityBadges[task.priority]} className="capitalize">{task.priority}</Badge>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-sm">
                            <Label className="font-semibold text-foreground mb-1">Sprint</Label>
                             <Select onValueChange={(val) => { setSprintId(val); handleFieldUpdate('sprintId', val === 'none' ? null : val); }} value={sprintId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Asignar a un sprint" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin Sprint</SelectItem>
                                    {sprints.filter(s => s.status !== 'completed').map(sprint => (
                                        <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="text-sm">
                            <Label className="font-semibold text-foreground mb-1">Asignado a</Label>
                             <Select onValueChange={(val) => { setAssigneeId(val); handleFieldUpdate('assigneeId', val === 'none' ? null : val); }} value={assigneeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Asignar a un miembro" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin Asignar</SelectItem>
                                    {members.map(member => (
                                        <SelectItem key={member.userId} value={member.userId}>{member.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="text-sm">
                        <p className="font-semibold text-foreground mb-1">Descripción</p>
                        <div className="text-muted-foreground p-3 bg-muted rounded-md min-h-[60px]">
                            {task.description ? (
                                <p className="whitespace-pre-wrap">{task.description}</p>
                            ) : (
                                <p>No se proporcionó descripción.</p>
                            )}
                        </div>
                    </div>

                    <div className="text-sm">
                        <Label htmlFor="attachment" className="font-semibold text-foreground mb-1">Adjunto</Label>
                        <div className="flex items-center gap-2">
                             <LinkIcon className="h-4 w-4 text-muted-foreground" />
                             <Input
                                id="attachment"
                                value={attachmentUrl}
                                onChange={(e) => setAttachmentUrl(e.target.value)}
                                onBlur={() => handleFieldUpdate('attachmentUrl', attachmentUrl)}
                                className="flex-1"
                                placeholder="https://ejemplo.com/archivo"
                            />
                        </div>
                        {attachmentUrl && (
                            <div className="mt-2">
                                {isImageUrl(attachmentUrl) ? (
                                    <div className="p-2 border rounded-md max-w-sm">
                                        <Image src={attachmentUrl} alt="Adjunto de la tarea" width={500} height={300} className="rounded-md object-contain" />
                                    </div>
                                ) : (
                                    <Link href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                        Ver Adjunto <ExternalLink className="h-4 w-4"/>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <CheckSquare className="h-5 w-5"/>
                            Subtareas
                        </h4>
                        {relevantSubtasks.length > 0 && (
                            <div className='px-1'>
                                <Progress value={subtaskProgress} className="h-2"/>
                            </div>
                        )}
                        <div className="space-y-1 pl-2">
                            {relevantSubtasks.map(st => (
                                <div key={st.id} className="flex items-center gap-2 p-1 rounded hover:bg-muted group">
                                    <Checkbox
                                        id={`subtask-${st.id}`}
                                        checked={st.status === 'done'}
                                        onCheckedChange={(checked) => handleSubtaskCheckedChange(st, !!checked)}
                                    />
                                    <label htmlFor={`subtask-${st.id}`} className={cn("text-sm flex-1", st.status === 'done' && 'line-through text-muted-foreground')}>{st.title}</label>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   Esto eliminará permanentemente la subtarea "{st.title}". Esta acción no se puede deshacer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteSubtask(st)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                        </div>
                         <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2">
                            <Input 
                                value={newSubtaskTitle}
                                onChange={e => setNewSubtaskTitle(e.target.value)}
                                placeholder="Añadir una nueva subtarea..."
                                className="h-9"
                                disabled={isAddingSubtask}
                            />
                            <Button type="submit" size="sm" disabled={isAddingSubtask || !newSubtaskTitle.trim()}>
                                {isAddingSubtask ? <Loader2 className="animate-spin" /> : "Añadir"}
                            </Button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-5 w-5"/>
                            Comentarios
                        </h4>
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.userAvatar} />
                                        <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{comment.userName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {comment.createdAt?.toDate && formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground bg-muted p-2 rounded-md mt-1">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                             {comments.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Aún no hay comentarios. ¡Sé el primero en comentar!</p>
                            )}
                        </div>

                        <form onSubmit={handleAddComment} className="flex gap-2 items-start">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <Textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Escribe un comentario..."
                                disabled={isSubmittingComment}
                                className="flex-1"
                                rows={2}
                            />
                            <Button type="submit" disabled={isSubmittingComment || !newComment.trim()}>
                                {isSubmittingComment ? <Loader2 className="animate-spin" /> : "Publicar"}
                            </Button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


export function KanbanBoard({ projectId, initialTasks, sprints, onTaskCreated, onTaskUpdated }: { projectId: string; initialTasks: Task[]; sprints: Sprint[]; onTaskCreated: (task: Task) => void; onTaskUpdated: (updatedTask: Partial<Task> & {id: string}) => void; }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskSprintId, setNewTaskSprintId] = useState<string>('none');
  
  const [isBrowser, setIsBrowser] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

  const mainTasks = useMemo(() => tasks.filter(t => t.type === 'task'), [tasks]);
  const subtasks = useMemo(() => tasks.filter(t => t.type === 'subtask'), [tasks]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setIsBrowser(true);
    const fetchMembers = async () => {
        const members = await getProjectMembers(projectId);
        setProjectMembers(members);
    }
    fetchMembers();
  }, [projectId]);
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailDialogOpen(true);
  };
  
  const resetCreateForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskSprintId('none');
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'No autenticado' });
      return;
    }
    if (!newTaskTitle.trim()) {
      toast({ variant: 'destructive', title: 'El título es obligatorio' });
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData: Omit<Task, 'id' | 'createdAt'> = {
        projectId,
        title: newTaskTitle,
        description: newTaskDescription,
        status: 'backlog',
        priority: newTaskPriority,
        type: 'task',
        createdBy: user.uid,
      };
      
      if (newTaskSprintId && newTaskSprintId !== 'none') {
        taskData.sprintId = newTaskSprintId;
      }
      
      const newTask = await createTask(taskData, { uid: user.uid, displayName: user.displayName });
      onTaskCreated(newTask);
      toast({ title: '¡Éxito!', description: 'Tarea creada.' });
      resetCreateForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al crear tarea' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onDragEnd: OnDragEndResponder = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    const movedTask = tasks.find(t => t.id === draggableId);
    if (!movedTask || !user) return;

    const oldStatus = movedTask.status;
    const newStatus = destination.droppableId as Task['status'];
    
    onTaskUpdated({ id: draggableId, status: newStatus });
    
    try {
      await updateTaskStatus(draggableId, movedTask.title, newStatus, oldStatus, { uid: user.uid, displayName: user.displayName });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error al actualizar tarea' });
      onTaskUpdated({ id: draggableId, status: oldStatus });
    }
  };

  const handleInternalTaskUpdate = (updatedTask: Partial<Task> & {id: string}) => {
    setSelectedTask(prev => prev ? { ...prev, ...updatedTask } : null);
    onTaskUpdated(updatedTask);
  }

  const handleSubtaskCreated = (newSubtask: Task) => {
    onTaskCreated(newSubtask);
  };

  const handleSubtaskDeleted = (subtaskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== subtaskId));
  };


  if (!isBrowser) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateTask}>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Tarea</DialogTitle>
                  <DialogDescription>
                    Rellena los detalles para tu nueva tarea.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Título
                    </Label>
                    <Input
                      id="title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="col-span-3"
                      placeholder="Ej: Implementar página de login"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="col-span-3"
                      placeholder="Describe la tarea con más detalle."
                      disabled={isSubmitting}
                    />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priority" className="text-right">
                      Prioridad
                    </Label>
                    <Select onValueChange={(value) => setNewTaskPriority(value as TaskPriority)} defaultValue="medium" disabled={isSubmitting}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sprint" className="text-right">
                      Sprint
                    </Label>
                    <Select onValueChange={setNewTaskSprintId} value={newTaskSprintId} disabled={isSubmitting}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Asignar a un sprint (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin Sprint</SelectItem>
                            {sprints.filter(s => s.status !== 'completed').map(sprint => (
                                <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                            ))}
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
                      'Crear Tarea'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              columnId={column.id}
              title={column.title}
              tasks={mainTasks.filter((task) => task.status === column.id).sort((a,b) => {
                const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })}
              subtasks={subtasks}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </div>
      
      <TaskDetailDialog 
        task={selectedTask}
        sprints={sprints}
        members={projectMembers}
        subtasks={subtasks}
        isOpen={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
          }
          setIsDetailDialogOpen(open);
        }}
        onTaskUpdated={handleInternalTaskUpdate}
        onSubtaskCreated={handleSubtaskCreated}
        onSubtaskDeleted={handleSubtaskDeleted}
      />

    </DragDropContext>
  );
}

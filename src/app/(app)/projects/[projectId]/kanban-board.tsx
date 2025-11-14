
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, ArrowUp, ArrowRight, ArrowDown, MessageSquare } from 'lucide-react';
import { Task, createTask, updateTaskStatus, TaskStatus, TaskPriority, Comment, addComment, getComments } from '@/lib/firebase/firestore';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';


type ColumnId = TaskStatus;

const columns: { id: ColumnId; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To-do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'testing', title: 'Testing' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
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

function KanbanColumn({ title, tasks, columnId, onTaskClick }: { title: string; tasks: Task[]; columnId: ColumnId; onTaskClick: (task: Task) => void; }) {
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
            {tasks.map((task, index) => (
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
                       <Badge variant={priorityBadges[task.priority]} className="mt-2 capitalize">{task.priority}</Badge>
                    </Card>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && (
              <div className="flex justify-center items-center h-full text-sm text-muted-foreground p-4">
                No tasks yet.
              </div>
            )}
          </CardContent>
        )}
      </Droppable>
    </Card>
  );
}

function TaskDetailDialog({ task, isOpen, onOpenChange }: { task: Task | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        if (task && isOpen) {
            const unsubscribe = getComments(task.id, (newComments) => {
                setComments(newComments);
            });
            return () => unsubscribe();
        }
    }, [task, isOpen]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !task || !newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            await addComment(task.id, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userAvatar: user.photoURL || '',
                text: newComment,
            });
            setNewComment('');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not post comment.' });
        } finally {
            setIsSubmittingComment(false);
        }
    };

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
                        Status: <Badge variant="secondary" className="capitalize">{task.status.replace('_', ' ')}</Badge>
                        <span className="mx-2">·</span>
                        Priority: <Badge variant={priorityBadges[task.priority]} className="capitalize">{task.priority}</Badge>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="text-sm">
                        <p className="font-semibold text-foreground mb-1">Description</p>
                        <div className="text-muted-foreground p-3 bg-muted rounded-md min-h-[60px]">
                            {task.description ? (
                                <p className="whitespace-pre-wrap">{task.description}</p>
                            ) : (
                                <p>No description provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-5 w-5"/>
                            Comments
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
                                                {comment.createdAt?.toDate && formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground bg-muted p-2 rounded-md mt-1">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                             {comments.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
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
                                placeholder="Write a comment..."
                                disabled={isSubmittingComment}
                                className="flex-1"
                                rows={2}
                            />
                            <Button type="submit" disabled={isSubmittingComment || !newComment.trim()}>
                                {isSubmittingComment ? <Loader2 className="animate-spin" /> : "Post"}
                            </Button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


export function KanbanBoard({ projectId, initialTasks }: { projectId: string; initialTasks: Task[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailDialogOpen(true);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };
  
  const resetCreateForm = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    if (!newTaskTitle.trim()) {
      toast({ variant: 'destructive', title: 'Title is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask = await createTask({
        projectId,
        title: newTaskTitle,
        description: newTaskDescription,
        status: 'backlog',
        priority: newTaskPriority,
        createdBy: user.uid,
      }, { uid: user.uid, displayName: user.displayName });
      handleTaskCreated(newTask);
      toast({ title: 'Success!', description: 'Task created.' });
      resetCreateForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error creating task' });
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
    
    // Optimistic UI update
    const updatedTasks = tasks.map(t => 
      t.id === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);
    
    try {
      await updateTaskStatus(draggableId, movedTask.title, newStatus, oldStatus, { uid: user.uid, displayName: user.displayName });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error updating task' });
      // Revert UI on failure
      setTasks(tasks);
    }
  };

  if (!isBrowser) {
    return null; // Don't render DND on server
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateTask}>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new task.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="col-span-3"
                      placeholder="E.g., Implement login page"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="col-span-3"
                      placeholder="Describe the task in more detail."
                      disabled={isSubmitting}
                    />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priority" className="text-right">
                      Priority
                    </Label>
                    <Select onValueChange={(value) => setNewTaskPriority(value as TaskPriority)} defaultValue="medium" disabled={isSubmitting}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Task'
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
              tasks={tasks.filter((task) => task.status === column.id).sort((a,b) => {
                const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </div>
      
      <TaskDetailDialog 
        task={selectedTask}
        isOpen={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
          }
          setIsDetailDialogOpen(open);
        }}
      />

    </DragDropContext>
  );
}

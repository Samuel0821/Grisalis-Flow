
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  DocumentData,
  WithFieldValue,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
  writeBatch,
  onSnapshot,
  collectionGroup,
  setDoc,
  limit,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore: db, firebaseApp } = initializeFirebase();


export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'member';
  createdAt: Timestamp;
}


export interface Project extends DocumentData {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'testing' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'task' | 'subtask';

export interface Task extends DocumentData {
  id: string;
  projectId: string;
  sprintId?: string;
  parentId?: string;
  type: TaskType;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  attachmentUrl?: string;
  createdBy: string;
  createdAt: any;
}

export type BugStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type BugPriority = 'low' | 'medium' | 'high' | 'critical';
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low' | 'enhancement';

export interface Bug extends DocumentData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  reproductionSteps?: string;
  status: BugStatus;
  priority: BugPriority;
  severity: BugSeverity;
  evidenceUrl?: string;
  reportedBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface TimeLog extends DocumentData {
    id?: string;
    userId: string;
    projectId: string;
    taskId: string;
    hours: number;
    description: string;
    date: Timestamp;
}

export interface WikiPage extends DocumentData {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdBy: string;
  lastEditedBy: { uid: string, displayName: string | null };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WikiPageVersion extends Omit<WikiPage, 'id' | 'slug'> {
    versionId: string;
    pageId: string;
}

export type SprintStatus = 'planning' | 'active' | 'completed';

export interface Sprint extends DocumentData {
  id: string;
  projectId: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: SprintStatus;
}

export type NotificationType = 'task_assigned' | 'status_changed' | 'bug_critical' | 'comment';

export interface Notification extends DocumentData {
    id: string;
    userId: string;
    type: NotificationType;
    message: string;
    link: string;
    read: boolean;
    createdAt: Timestamp;
}

export interface Comment extends DocumentData {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: Timestamp;
}

export interface AuditLog extends DocumentData {
  id?: string;
  userId: string;
  userName: string;
  action: string;
  entity: 'project' | 'task' | 'bug' | 'sprint' | 'wiki' | 'user' | 'notification';
  entityId: string;
  details: any;
  timestamp: Timestamp;
}

export interface ProjectMember extends DocumentData {
    userId: string;
    projectId: string;
    role: 'owner' | 'member';
    displayName: string;
    email: string;
}


export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, 'userProfiles');
        const querySnapshot = await getDocs(usersRef);
        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() } as UserProfile);
        });
        return users;
    } catch (error) {
        console.error("Error al obtener todos los usuarios:", error);
        throw new Error('No se pudieron obtener todos los usuarios.');
    }
}


export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, 'userProfiles', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener el perfil de usuario:", error);
        throw new Error('No se pudo obtener el perfil de usuario.');
    }
}

export const updateUserProfile = async (userId: string, data: Partial<Pick<UserProfile, 'displayName' | 'role'>>, admin: { uid: string, displayName: string | null }): Promise<void> => {
    try {
        const userProfileRef = doc(db, 'userProfiles', userId);
        await updateDoc(userProfileRef, data);

        await createAuditLog({
            userId: admin.uid,
            userName: admin.displayName || 'Admin',
            action: `Actualizó el perfil del usuario ${data.displayName}`,
            entity: 'user',
            entityId: userId,
            details: data,
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw new Error("No se pudo actualizar el perfil del usuario.");
    }
};


export const deleteUserProfile = async (userId: string): Promise<void> => {
    try {
        const userProfileRef = doc(db, 'userProfiles', userId);
        
        // This operation is protected by Firestore Security Rules.
        // It will only succeed if the requesting user is an admin.
        await deleteDoc(userProfileRef);
        
    } catch (error) {
        console.error("Error deleting user profile:", error);
        throw new Error("No se pudo eliminar el usuario.");
    }
};

export const createAuditLog = async (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, 'auditLogs'), {
            ...logData,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error al crear el registro de auditoría:", error);
    }
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
    try {
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const logs: AuditLog[] = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as AuditLog);
        });
        return logs;
    } catch (error) {
        console.error('Error al obtener los registros de auditoría:', error);
        throw new Error('No se pudieron obtener los registros de auditoría.');
    }
}


export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  user: { uid: string, displayName: string | null, email: string | null }
): Promise<Project> => {
  const batch = writeBatch(db);
  const projectRef = doc(collection(db, 'projects'));

  batch.set(projectRef, {
    ...projectData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active'
  });

  const memberRef = doc(db, 'projects', projectRef.id, 'members', user.uid);
  batch.set(memberRef, {
      userId: user.uid,
      projectId: projectRef.id,
      role: 'owner',
      displayName: user.displayName || 'Propietario',
      email: user.email || 'N/A'
  });
  
  await batch.commit();

  await createAuditLog({
      userId: user.uid,
      userName: user.displayName || 'Anónimo',
      action: `Creó el proyecto "${projectData.name}"`,
      entity: 'project',
      entityId: projectRef.id,
      details: projectData
  });

  return { id: projectRef.id, ...projectData, createdAt: new Date(), updatedAt: new Date(), status: 'active' };
};

export const getProjects = async (userId?: string): Promise<Project[]> => {
  try {
    if (userId) {
        const userProfile = await getUserProfile(userId);
        if (userProfile?.role === 'admin') {
            const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
            const projectsSnapshot = await getDocs(projectsQuery);
            return projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        }
    } else {
         const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
         const projectsSnapshot = await getDocs(projectsQuery);
         return projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    }

    const memberQuerySnapshot = await getDocs(query(collectionGroup(db, 'members'), where('userId', '==', userId)));
    const projectIds = memberQuerySnapshot.docs.map(doc => doc.data().projectId);

    if (projectIds.length === 0) {
        return [];
    }

    const projectChunks: string[][] = [];
    for (let i = 0; i < projectIds.length; i += 30) {
      projectChunks.push(projectIds.slice(i, i + 30));
    }

    const projects: Project[] = [];
    for (const chunk of projectChunks) {
        const projectsQuery = query(collection(db, 'projects'), where('__name__', 'in', chunk));
        const projectsSnapshot = await getDocs(projectsQuery);
        projectsSnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() } as Project);
        });
    }

    return projects.sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

  } catch (error) {
    console.error('Error al obtener proyectos: ', error);
    throw new Error('No se pudieron obtener los proyectos.');
  }
};


export const getProject = async (projectId: string): Promise<Project | null> => {
    try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Project;
        } else {
            console.warn(`Proyecto con ID ${projectId} no encontrado.`);
            return null;
        }
    } catch (error) {
        console.error("Error al obtener el proyecto:", error);
        throw new Error("No se pudo obtener el proyecto.");
    }
};

export const updateProject = async (
  projectId: string,
  projectData: Partial<Project>,
  user: { uid: string, displayName: string | null }
): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: serverTimestamp(),
    });

    await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Actualizó el proyecto "${projectData.name}"`,
        entity: 'project',
        entityId: projectId,
        details: projectData
    });
  } catch (error) {
    console.error('Error al actualizar el proyecto: ', error);
    throw new Error('No se pudo actualizar el proyecto.');
  }
};

export const deleteProject = async (projectId: string, projectName: string, user: { uid: string, displayName: string | null }): Promise<void> => {
  try {
    const batch = writeBatch(db);

    const projectRef = doc(db, 'projects', projectId);
    batch.delete(projectRef);

    const membersQuery = query(collection(db, 'projects', projectId, 'members'));
    const membersSnapshot = await getDocs(membersQuery);
    membersSnapshot.forEach((memberDoc) => {
        batch.delete(memberDoc.ref);
    });

    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach((taskDoc) => {
      batch.delete(taskDoc.ref);
    });

    const bugsQuery = query(collection(db, 'bugs'), where('projectId', '==', projectId));
    const bugsSnapshot = await getDocs(bugsQuery);
    bugsSnapshot.forEach((bugDoc) => {
      batch.delete(bugDoc.ref);
    });
    
    const timeLogsQuery = query(collection(db, 'timeLogs'), where('projectId', '==', projectId));
    const timeLogsSnapshot = await getDocs(timeLogsQuery);
    timeLogsSnapshot.forEach((logDoc) => {
        batch.delete(logDoc.ref);
    });

    await batch.commit();

    await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Eliminó el proyecto "${projectName}"`,
        entity: 'project',
        entityId: projectId,
        details: { name: projectName }
    });

  } catch (error) {
    console.error('Error al eliminar el proyecto y sus datos asociados: ', error);
    throw new Error('No se pudo eliminar el proyecto.');
  }
};

export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    try {
        const membersRef = collection(db, 'projects', projectId, 'members');
        const querySnapshot = await getDocs(membersRef);
        const members: ProjectMember[] = [];
        querySnapshot.forEach((doc) => {
            members.push({ ...doc.data() } as ProjectMember);
        });
        return members;
    } catch (error) {
        console.error('Error al obtener los miembros del proyecto: ', error);
        throw new Error('No se pudieron obtener los miembros del proyecto.');
    }
}

export const addProjectMember = async (projectId: string, memberData: Omit<ProjectMember, 'id'>, user: { uid: string, displayName: string | null }): Promise<void> => {
    try {
        const memberRef = doc(db, 'projects', projectId, 'members', memberData.userId);
        await setDoc(memberRef, memberData);

        await createAuditLog({
            userId: user.uid,
            userName: user.displayName || 'Anónimo',
            action: `Añadió al miembro ${memberData.displayName} al proyecto`,
            entity: 'project',
            entityId: projectId,
            details: { memberId: memberData.userId, role: memberData.role }
        });
    } catch (error) {
        console.error('Error al añadir miembro al proyecto: ', error);
        throw new Error('No se pudo añadir el miembro al proyecto.');
    }
}

export const removeProjectMember = async (projectId: string, userId: string, memberName: string, user: { uid: string, displayName: string | null }): Promise<void> => {
    try {
        const memberRef = doc(db, 'projects', projectId, 'members', userId);
        await deleteDoc(memberRef);

        await createAuditLog({
            userId: user.uid,
            userName: user.displayName || 'Anónimo',
            action: `Eliminó al miembro ${memberName} del proyecto`,
            entity: 'project',
            entityId: projectId,
            details: { memberId: userId }
        });
    } catch (error) {
        console.error('Error al eliminar miembro del proyecto: ', error);
        throw new Error('No se pudo eliminar el miembro del proyecto.');
    }
}


export const getTask = async (taskId: string): Promise<Task | null> => {
    try {
        const docRef = doc(db, 'tasks', taskId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Task;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error al obtener la tarea:", error);
        throw new Error("No se pudo obtener la tarea.");
    }
};

export const createTask = async (
  taskData: Omit<Task, 'id' | 'createdAt'>,
  user: { uid: string, displayName: string | null }
): Promise<Task> => {
  try {
    const docRef = doc(collection(db, 'tasks'));
    const newTask = {
      ...taskData,
      id: docRef.id,
      createdAt: serverTimestamp(),
    }
    await setDoc(docRef, newTask);
     await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Creó la tarea "${taskData.title}"`,
        entity: 'task',
        entityId: docRef.id,
        details: { projectId: taskData.projectId, title: taskData.title }
    });
    return { ...newTask, createdAt: new Date() } as Task;
  } catch (error) {
    console.error('Error al crear la tarea: ', error);
    throw new Error('No se pudo crear la tarea.');
  }
};

export const getTasks = async (projectId: string): Promise<Task[]> => {
  try {
    const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    return tasks;
  } catch (error) {
    console.error('Error al obtener las tareas: ', error);
    throw new Error('No se pudieron obtener las tareas.');
  }
};


export const getTasksForProjects = async (projectIds: string[]): Promise<Task[]> => {
  if (!projectIds || projectIds.length === 0) {
    const q = query(collection(db, 'tasks'));
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    return tasks;
  }
  try {
    const taskChunks: Task[] = [];
    for (let i = 0; i < projectIds.length; i += 30) {
        const chunk = projectIds.slice(i, i + 30);
        const q = query(collection(db, 'tasks'), where('projectId', 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            taskChunks.push({ id: doc.id, ...doc.data() } as Task);
        });
    }
    return taskChunks;
  } catch (error) {
    console.error('Error al obtener tareas para proyectos: ', error);
    throw new Error('No se pudieron obtener las tareas.');
  }
}

export const updateTaskStatus = async (
  taskId: string,
  taskTitle: string,
  newStatus: Task['status'],
  oldStatus: Task['status'],
  user: { uid: string, displayName: string | null }
): Promise<void> => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
     await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Movió la tarea "${taskTitle}" de ${oldStatus.replace('_', ' ')} a ${newStatus.replace('_', ' ')}`,
        entity: 'task',
        entityId: taskId,
        details: { from: oldStatus, to: newStatus }
    });
     const task = await getTask(taskId);
     if (task && task.assigneeId && task.assigneeId !== user.uid) {
         await createNotification({
             userId: task.assigneeId,
             type: 'status_changed',
             message: `El estado de tu tarea "${task.title}" fue cambiado a "${newStatus.replace('_', ' ')}".`,
             link: `/projects/${task.projectId}`
         });
     }
  } catch (error) {
    console.error('Error al actualizar el estado de la tarea: ', error);
    throw new Error('No se pudo actualizar el estado de la tarea.');
  }
};

export const updateTask = async (
  taskId: string,
  taskData: Partial<Task>,
  user: { uid: string, displayName: string | null }
): Promise<void> => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...taskData,
      updatedAt: serverTimestamp(),
    });
    
    if(taskData.assigneeId) {
        const assignee = await getUserProfile(taskData.assigneeId);
         await createAuditLog({
            userId: user.uid,
            userName: user.displayName || 'Anónimo',
            action: `Asignó la tarea a ${assignee?.displayName || 'N/A'}`,
            entity: 'task',
            entityId: taskId,
            details: { assigneeId: taskData.assigneeId }
        });
        await createNotification({
            userId: taskData.assigneeId,
            type: 'task_assigned',
            message: `Se te ha asignado una nueva tarea: "${taskData.title}"`,
            link: `/projects/${taskData.projectId}`
        });
    }

  } catch (error) {
    console.error('Error al actualizar la tarea: ', error);
    throw new Error('No se pudo actualizar la tarea.');
  }
};


export const deleteTask = async (
  taskId: string,
  taskTitle: string,
  user: { uid: string, displayName: string | null }
): Promise<void> => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);

    await createAuditLog({
      userId: user.uid,
      userName: user.displayName || 'Anónimo',
      action: `Eliminó la tarea "${taskTitle}"`,
      entity: 'task',
      entityId: taskId,
      details: { title: taskTitle },
    });
  } catch (error) {
    console.error('Error al eliminar la tarea: ', error);
    throw new Error('No se pudo eliminar la tarea.');
  }
};


export const createBug = async (
  bugData: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>,
  user: { uid: string, displayName: string | null }
): Promise<Bug> => {
  try {
    const docRef = doc(collection(db, 'bugs'));
    const newBugData = {
      ...bugData,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, newBugData);

    await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Reportó el bug "${bugData.title}"`,
        entity: 'bug',
        entityId: docRef.id,
        details: { projectId: bugData.projectId, title: bugData.title }
    });

    if (bugData.severity === 'critical') {
        const project = await getProject(bugData.projectId);
        if (project) {
             const owner = (await getProjectMembers(bugData.projectId)).find(m => m.role === 'owner');
             if (owner) {
                await createNotification({
                    userId: owner.userId,
                    type: 'bug_critical',
                    message: `Un bug crítico "${bugData.title}" ha sido reportado en el proyecto ${project.name}.`,
                    link: `/bugs`
                });
             }
        }
    }
    
    return { ...newBugData, createdAt: new Date(), updatedAt: new Date() } as Bug;
  } catch (error) {
    console.error('Error al crear el bug: ', error);
    throw new Error('No se pudo reportar el bug.');
  }
};

export const getBugs = async (): Promise<Bug[]> => {
  try {
    const q = query(collection(db, 'bugs'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const bugs: Bug[] = [];
    querySnapshot.forEach((doc) => {
      bugs.push({ id: doc.id, ...doc.data() } as Bug);
    });
    return bugs;
  } catch (error) {
    console.error('Error al obtener los bugs: ', error);
    throw new Error('No se pudieron obtener los bugs.');
  }
};

export const updateBugStatus = async (
  bugId: string,
  bugTitle: string,
  newStatus: BugStatus,
  oldStatus: BugStatus,
  user: { uid: string, displayName: string | null }
): Promise<void> => {
  try {
    const bugRef = doc(db, 'bugs', bugId);
    await updateDoc(bugRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Cambió el estado del bug "${bugTitle}" de ${oldStatus.replace('_', ' ')} a ${newStatus.replace('_', ' ')}`,
        entity: 'bug',
        entityId: bugId,
        details: { from: oldStatus, to: newStatus }
    });
  } catch (error) {
    console.error('Error al actualizar el estado del bug: ', error);
    throw new Error('No se pudo actualizar el estado del bug.');
  }
};


export const createTimeLog = async (
  timeLogData: Omit<TimeLog, 'id' | 'date'>
): Promise<TimeLog> => {
  try {
    const docRef = doc(collection(db, 'timeLogs'));
    const newLog = {
        ...timeLogData,
        id: docRef.id,
        date: serverTimestamp(),
    };
    await setDoc(docRef, newLog);
    return { ...newLog, date: new Timestamp(Date.now() / 1000, 0) } as TimeLog;
  } catch (error) {
    console.error('Error al crear el registro de tiempo: ', error);
    throw new Error('No se pudo crear el registro de tiempo.');
  }
};

export const getTimeLogs = async (userId?: string): Promise<TimeLog[]> => {
  try {
    const timeLogsRef = collection(db, 'timeLogs');
    const q = userId
      ? query(timeLogsRef, where('userId', '==', userId), orderBy('date', 'desc'))
      : query(timeLogsRef, orderBy('date', 'desc'));
      
    const querySnapshot = await getDocs(q);
    const timeLogs: TimeLog[] = [];
    querySnapshot.forEach((doc) => {
      timeLogs.push({ id: doc.id, ...doc.data() } as TimeLog);
    });
    return timeLogs;
  } catch (error) {
    console.error('Error al obtener los registros de tiempo: ', error);
    throw new Error('No se pudieron obtener los registros de tiempo.');
  }
};


export const createWikiPage = async (
  pageData: Omit<WikiPage, 'id' | 'createdAt' | 'updatedAt' | 'slug' | 'lastEditedBy'>,
  user: { uid: string, displayName: string | null }
): Promise<WikiPage> => {
  try {
    const slug = pageData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const docRef = doc(collection(db, 'wiki'));
    
    const newPageData: Omit<WikiPage, 'id'> = {
      ...pageData,
      slug,
      lastEditedBy: { uid: user.uid, displayName: user.displayName },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    await setDoc(docRef, newPageData);
    
    await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Creó el artículo de wiki "${pageData.title}"`,
        entity: 'wiki',
        entityId: docRef.id,
        details: {}
    });

    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as WikiPage;
  } catch (error) {
    console.error('Error al crear la página de wiki: ', error);
    throw new Error('No se pudo crear la página de wiki.');
  }
};

export const getWikiPages = async (): Promise<WikiPage[]> => {
  try {
    const q = query(collection(db, 'wiki'), orderBy('title', 'asc'));
    const querySnapshot = await getDocs(q);
    const pages: WikiPage[] = [];
    querySnapshot.forEach((doc) => {
      pages.push({ id: doc.id, ...doc.data() } as WikiPage);
    });
    return pages;
  } catch (error) {
    console.error('Error al obtener las páginas de wiki: ', error);
    throw new Error('No se pudieron obtener las páginas de wiki.');
  }
};

export const getWikiPageBySlug = async (slug: string): Promise<WikiPage | null> => {
    try {
        const q = query(collection(db, 'wiki'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const docSnap = querySnapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as WikiPage;
    } catch (error) {
        console.error('Error al obtener la página de wiki por slug: ', error);
        throw new Error('No se pudo obtener la página de wiki.');
    }
}

export const getWikiPageById = async (id: string): Promise<WikiPage | null> => {
    try {
        const docRef = doc(db, 'wiki', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as WikiPage;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener la página de wiki por ID:", error);
        throw new Error('No se pudo obtener la página de wiki.');
    }
}

export const updateWikiPage = async (
  pageId: string,
  pageData: Pick<WikiPage, 'title' | 'content'>,
  user: { uid: string, displayName: string | null }
): Promise<WikiPage> => {
    const batch = writeBatch(db);
    const pageRef = doc(db, 'wiki', pageId);
    
    const currentPageSnap = await getDoc(pageRef);
    if (!currentPageSnap.exists()) {
        throw new Error("La página de wiki a actualizar no existe.");
    }
    const currentPageData = currentPageSnap.data() as WikiPage;

    const versionRef = doc(collection(db, 'wiki', pageId, 'versions'));
    const versionData: Omit<WikiPageVersion, 'versionId'> = {
        pageId: pageId,
        title: currentPageData.title,
        content: currentPageData.content,
        createdBy: currentPageData.createdBy,
        lastEditedBy: currentPageData.lastEditedBy,
        createdAt: currentPageData.createdAt,
        updatedAt: currentPageData.updatedAt,
    };
    batch.set(versionRef, versionData);

    const newSlug = pageData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const updateData = {
        ...pageData,
        slug: newSlug,
        lastEditedBy: { uid: user.uid, displayName: user.displayName },
        updatedAt: serverTimestamp(),
    };
    batch.update(pageRef, updateData);

    await batch.commit();

    await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Actualizó el artículo de wiki "${pageData.title}"`,
        entity: 'wiki',
        entityId: pageId,
        details: { oldTitle: currentPageData.title, newTitle: pageData.title }
    });

    const updatedDoc = await getDoc(pageRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as WikiPage;
}

export const getWikiPageVersions = async (pageId: string): Promise<WikiPageVersion[]> => {
    try {
        const versionsRef = collection(db, 'wiki', pageId, 'versions');
        const q = query(versionsRef, orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ versionId: doc.id, ...doc.data() } as WikiPageVersion));
    } catch (error) {
        console.error('Error al obtener las versiones de la página de wiki:', error);
        throw new Error('No se pudo recuperar el historial de la página.');
    }
}


export const createSprint = async (
  sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>,
  user: { uid: string, displayName: string | null }
): Promise<Sprint> => {
  try {
    const docRef = doc(collection(db, 'sprints'));
    const newSprintData = {
        ...sprintData,
        id: docRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, newSprintData);

     await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        action: `Creó el sprint "${sprintData.name}"`,
        entity: 'sprint',
        entityId: docRef.id,
        details: { projectId: sprintData.projectId }
    });
    const docSnap = await getDoc(docRef);
    return { ...docSnap.data() } as Sprint;
  } catch (error) {
    console.error('Error al crear el sprint: ', error);
    throw new Error('No se pudo crear el sprint.');
  }
};

export const getSprintsForProject = async (projectId: string): Promise<Sprint[]> => {
  try {
    const q = query(collection(db, 'sprints'), where('projectId', '==', projectId));
    const querySnapshot = await getDocs(q);
    const sprints: Sprint[] = [];
    querySnapshot.forEach((doc) => {
      sprints.push({ id: doc.id, ...doc.data() } as Sprint);
    });
    return sprints.sort((a, b) => b.startDate.toDate().getTime() - a.startDate.toDate().getTime());
  } catch (error) {
    console.error('Error al obtener sprints: ', error);
    throw new Error('No se pudieron obtener los sprints.');
  }
};

export const updateSprintStatus = async (
  sprintId: string,
  sprintName: string,
  newStatus: SprintStatus,
  oldStatus: SprintStatus,
  user: { uid: string, displayName: string | null }
): Promise<void> => {
    try {
        const sprintRef = doc(db, 'sprints', sprintId);
        await updateDoc(sprintRef, { 
            status: newStatus,
            updatedAt: serverTimestamp(),
        });
        await createAuditLog({
            userId: user.uid,
            userName: user.displayName || 'Anónimo',
            action: `Cambió el estado del sprint "${sprintName}" de ${oldStatus} a ${newStatus}`,
            entity: 'sprint',
            entityId: sprintId,
            details: { from: oldStatus, to: newStatus }
        });
    } catch (error) {
        console.error('Error al actualizar el estado del sprint: ', error);
        throw new Error('No se pudo actualizar el estado del sprint.');
    }
};


export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> => {
    try {
        await addDoc(collection(db, 'notifications'), {
            ...notificationData,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error al crear la notificación:", error);
    }
};

export const getNotifications = (userId: string, callback: (notifications: Notification[]) => void): () => void => {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications: Notification[] = [];
        querySnapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() } as Notification);
        });
        callback(notifications);
    }, (error) => {
        console.error("Error al obtener notificaciones en tiempo real:", error);
    });

    return unsubscribe;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
    } catch (error) {
        console.error("Error al marcar la notificación como leída:", error);
        throw new Error("No se pudo actualizar la notificación.");
    }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false));
    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error al marcar todas las notificaciones como leídas:", error);
        throw new Error("No se pudieron actualizar todas las notificaciones.");
    }
}


export const addComment = async (taskId: string, commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> => {
    try {
        const task = await getTask(taskId);
        if (!task) {
            throw new Error("Tarea no encontrada para añadir comentario.");
        }

        const commentsRef = collection(db, 'tasks', taskId, 'comments');
        const docRef = doc(commentsRef);
        const newComment = {
            ...commentData,
            id: docRef.id,
            createdAt: serverTimestamp(),
        };
        await setDoc(docRef, newComment);

        if (task.assigneeId && task.assigneeId !== commentData.userId) {
            await createNotification({
                userId: task.assigneeId,
                type: 'comment',
                message: `${commentData.userName} comentó en la tarea: "${task.title}"`,
                link: `/projects/${task.projectId}`
            });
        }

        return { ...newComment, createdAt: new Timestamp(Date.now() / 1000, 0) } as Comment;
    } catch (error) {
        console.error("Error al añadir comentario:", error);
        throw new Error("No se pudo añadir el comentario.");
    }
}

export const getComments = (taskId: string, callback: (comments: Comment[]) => void): () => void => {
    const commentsRef = collection(db, 'tasks', taskId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const comments: Comment[] = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as Comment);
        });
        callback(comments);
    }, (error) => {
        console.error("Error al obtener comentarios en tiempo real:", error);
    });

    return unsubscribe;
}

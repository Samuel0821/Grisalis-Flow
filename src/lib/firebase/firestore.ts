
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
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore: db } = initializeFirebase();


export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'member';
  createdAt: Timestamp;
}


// Tipos de datos
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

export interface Task extends DocumentData {
  id: string;
  projectId: string;
  sprintId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
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
  id?: string;
  title: string;
  slug: string;
  content: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
    userId: string; // The user who receives the notification
    type: NotificationType;
    message: string;
    link: string; // e.g., /projects/pid/tasks/tid
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
  entity: 'project' | 'task' | 'bug' | 'sprint' | 'wiki' | 'user';
  entityId: string;
  details: any;
  timestamp: Timestamp;
}

export interface ProjectMember extends DocumentData {
    id: string;
    userId: string;
    projectId: string;
    role: 'owner' | 'member';
    displayName: string;
    email: string;
}


// ---- User Profile Functions ----
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
        console.error("Error getting all users:", error);
        throw new Error('Could not get all users.');
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
        console.error("Error getting user profile:", error);
        throw new Error('Could not get user profile.');
    }
}

// ---- Funciones de Auditoría ----
export const createAuditLog = async (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
    try {
        await addDoc(collection(db, 'auditLogs'), {
            ...logData,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating audit log:", error);
        // Fail silently so we don't block user actions
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
        console.error('Error getting audit logs:', error);
        throw new Error('Could not get audit logs.');
    }
}


// ---- Funciones para Proyectos ----

/**
 * Crea un nuevo proyecto en Firestore y asigna al creador como 'owner'.
 */
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
      displayName: user.displayName || 'Owner',
      email: user.email || 'N/A'
  });
  
  await batch.commit();

  await createAuditLog({
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      action: `Created project "${projectData.name}"`,
      entity: 'project',
      entityId: projectRef.id,
      details: projectData
  });

  return { id: projectRef.id, ...projectData, createdAt: new Date(), updatedAt: new Date(), status: 'active' };
};

/**
 * Obtiene los proyectos en los que un usuario es miembro.
 */
export const getProjects = async (userId?: string): Promise<Project[]> => {
  try {
    if (!userId) {
        // If no user ID, get all projects (for admin/reporting purposes)
        const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const projectsSnapshot = await getDocs(projectsQuery);
        const projects: Project[] = [];
        projectsSnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() } as Project);
        });
        return projects;
    }

    const memberQuerySnapshot = await getDocs(query(collectionGroup(db, 'members'), where('userId', '==', userId)));
    const projectIds = memberQuerySnapshot.docs.map(doc => doc.data().projectId);

    if (projectIds.length === 0) {
        return [];
    }

    // Firestore 'in' queries are limited to 30 elements. If more projects, split into chunks.
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
    console.error('Error getting projects: ', error);
    throw new Error('Could not get projects.');
  }
};

/**
 * Obtiene un único proyecto por su ID.
 */
export const getProject = async (projectId: string): Promise<Project | null> => {
    try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Project;
        } else {
            console.warn(`Project with ID ${projectId} not found.`);
            return null;
        }
    } catch (error) {
        console.error("Error getting project:", error);
        throw new Error("Could not get the project.");
    }
};

/**
 * Actualiza un proyecto en Firestore.
 */
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
        userName: user.displayName || 'Anonymous',
        action: `Updated project "${projectData.name}"`,
        entity: 'project',
        entityId: projectId,
        details: projectData
    });
  } catch (error) {
    console.error('Error updating project: ', error);
    throw new Error('Could not update the project.');
  }
};

/**
 * Elimina un proyecto y todas sus subcolecciones asociadas.
 */
export const deleteProject = async (projectId: string, projectName: string, user: { uid: string, displayName: string | null }): Promise<void> => {
  try {
    const batch = writeBatch(db);

    const projectRef = doc(db, 'projects', projectId);
    batch.delete(projectRef);

    // Delete members subcollection
    const membersQuery = query(collection(db, 'projects', projectId, 'members'));
    const membersSnapshot = await getDocs(membersQuery);
    membersSnapshot.forEach((memberDoc) => {
        batch.delete(memberDoc.ref);
    });

    // Find and delete associated tasks
    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach((taskDoc) => {
      batch.delete(taskDoc.ref);
    });

    // Find and delete associated bugs
    const bugsQuery = query(collection(db, 'bugs'), where('projectId', '==', projectId));
    const bugsSnapshot = await getDocs(bugsQuery);
    bugsSnapshot.forEach((bugDoc) => {
      batch.delete(bugDoc.ref);
    });
    
    // Find and delete associated time logs
    const timeLogsQuery = query(collection(db, 'timeLogs'), where('projectId', '==', projectId));
    const timeLogsSnapshot = await getDocs(timeLogsQuery);
    timeLogsSnapshot.forEach((logDoc) => {
        batch.delete(logDoc.ref);
    });

    await batch.commit();

    await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        action: `Deleted project "${projectName}"`,
        entity: 'project',
        entityId: projectId,
        details: { name: projectName }
    });

  } catch (error) {
    console.error('Error deleting project and associated data: ', error);
    throw new Error('Could not delete the project.');
  }
};

// ---- Funciones para Miembros del Proyecto ----
export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    try {
        const membersRef = collection(db, 'projects', projectId, 'members');
        const querySnapshot = await getDocs(membersRef);
        const members: ProjectMember[] = [];
        querySnapshot.forEach((doc) => {
            members.push({ id: doc.id, ...doc.data() } as ProjectMember);
        });
        return members;
    } catch (error) {
        console.error('Error getting project members: ', error);
        throw new Error('Could not get project members.');
    }
}

export const addProjectMember = async (projectId: string, memberData: Omit<ProjectMember, 'id'>, user: { uid: string, displayName: string | null }): Promise<void> => {
    try {
        const memberRef = doc(db, 'projects', projectId, 'members', memberData.userId);
        await setDoc(memberRef, memberData);

        await createAuditLog({
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            action: `Added member ${memberData.displayName} to project`,
            entity: 'project',
            entityId: projectId,
            details: { memberId: memberData.userId, role: memberData.role }
        });
    } catch (error) {
        console.error('Error adding project member: ', error);
        throw new Error('Could not add project member.');
    }
}

export const removeProjectMember = async (projectId: string, userId: string, memberName: string, user: { uid: string, displayName: string | null }): Promise<void> => {
    try {
        const memberRef = doc(db, 'projects', projectId, 'members', userId);
        await deleteDoc(memberRef);

        await createAuditLog({
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            action: `Removed member ${memberName} from project`,
            entity: 'project',
            entityId: projectId,
            details: { memberId: userId }
        });
    } catch (error) {
        console.error('Error removing project member: ', error);
        throw new Error('Could not remove project member.');
    }
}


// ---- Funciones para Tareas ----

/**
 * Crea una nueva tarea en Firestore.
 */
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
        userName: user.displayName || 'Anonymous',
        action: `Created task "${taskData.title}"`,
        entity: 'task',
        entityId: docRef.id,
        details: { projectId: taskData.projectId, title: taskData.title }
    });
    return { ...newTask, createdAt: new Date() } as Task;
  } catch (error) {
    console.error('Error creating task: ', error);
    throw new Error('Could not create the task.');
  }
};

/**
 * Obtiene todas las tareas para un proyecto específico.
 */
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
    console.error('Error getting tasks: ', error);
    throw new Error('Could not get tasks.');
  }
};


/**
 * Obtiene todas las tareas para multiples proyectos.
 */
export const getTasksForProjects = async (projectIds: string[]): Promise<Task[]> => {
  if (projectIds.length === 0) {
    return [];
  }
  try {
    // Firestore 'in' query limited to 30 elements per query.
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
    console.error('Error getting tasks for projects: ', error);
    throw new Error('Could not get tasks.');
  }
}

/**
 * Actualiza el estado de una tarea.
 * @param taskId - El ID de la tarea a actualizar.
 * @param status - El nuevo estado de la tarea.
 */
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
        userName: user.displayName || 'Anonymous',
        action: `Moved task "${taskTitle}" from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
        entity: 'task',
        entityId: taskId,
        details: { from: oldStatus, to: newStatus }
    });
  } catch (error) {
    console.error('Error updating task status: ', error);
    throw new Error('Could not update the task status.');
  }
};

/**
 * Actualiza el sprint de una tarea.
 */
export const updateTaskSprint = async (
  taskId: string,
  sprintId: string | null,
  user: { uid: string, displayName: string | null }
): Promise<void> => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { sprintId: sprintId || null, updatedAt: serverTimestamp() });
    
    // We can consider adding an audit log here if needed
  } catch (error) {
    console.error('Error updating task sprint: ', error);
    throw new Error('Could not update the task sprint.');
  }
};


// ---- Funciones para Bugs ----

/**
 * Crea un nuevo bug en Firestore.
 */
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
        userName: user.displayName || 'Anonymous',
        action: `Reported bug "${bugData.title}"`,
        entity: 'bug',
        entityId: docRef.id,
        details: { projectId: bugData.projectId, title: bugData.title }
    });
    return { ...newBugData, createdAt: new Date(), updatedAt: new Date() } as Bug;
  } catch (error) {
    console.error('Error creating bug: ', error);
    throw new Error('Could not report the bug.');
  }
};

/**
 * Obtiene todos los bugs. Se podría filtrar por usuario si fuera necesario.
 */
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
    console.error('Error getting bugs: ', error);
    throw new Error('Could not get bugs.');
  }
};

/**
 * Actualiza el estado de un bug.
 */
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
        userName: user.displayName || 'Anonymous',
        action: `Changed status of bug "${bugTitle}" from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
        entity: 'bug',
        entityId: bugId,
        details: { from: oldStatus, to: newStatus }
    });
  } catch (error) {
    console.error('Error updating bug status: ', error);
    throw new Error('Could not update the bug status.');
  }
};


// ---- Funciones para Timesheet ----

/**
 * Crea un nuevo registro de tiempo en Firestore.
 */
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
    console.error('Error creating time log: ', error);
    throw new Error('Could not create the time log.');
  }
};

/**
 * Obtiene todos los registros de tiempo para un usuario específico.
 */
export const getTimeLogs = async (userId: string): Promise<TimeLog[]> => {
  try {
    const q = query(collection(db, 'timeLogs'), where('userId', '==', userId), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const timeLogs: TimeLog[] = [];
    querySnapshot.forEach((doc) => {
      timeLogs.push({ id: doc.id, ...doc.data() } as TimeLog);
    });
    return timeLogs;
  } catch (error) {
    console.error('Error getting time logs: ', error);
    throw new Error('Could not get time logs.');
  }
};


// ---- Funciones para Wiki ----

/**
 * Crea una nueva página de Wiki.
 */
export const createWikiPage = async (
  pageData: Omit<WikiPage, 'id' | 'createdAt' | 'updatedAt' | 'slug'>,
  user: { uid: string, displayName: string | null }
): Promise<WikiPage> => {
  try {
    const slug = pageData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const docRef = doc(collection(db, 'wiki'));
    
    const newPageData = {
      ...pageData,
      id: docRef.id,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(docRef, newPageData);
    
    await createAuditLog({
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        action: `Created wiki article "${pageData.title}"`,
        entity: 'wiki',
        entityId: docRef.id,
        details: {}
    });

    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as WikiPage;
  } catch (error) {
    console.error('Error creating wiki page: ', error);
    throw new Error('Could not create wiki page.');
  }
};

/**
 * Obtiene todas las páginas de Wiki.
 */
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
    console.error('Error getting wiki pages: ', error);
    throw new Error('Could not get wiki pages.');
  }
};

/**
 * Obtiene una página de Wiki por su slug.
 */
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
        console.error('Error getting wiki page by slug: ', error);
        throw new Error('Could not get wiki page.');
    }
}


// ---- Funciones para Sprints ----

/**
 * Crea un nuevo sprint.
 */
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
        userName: user.displayName || 'Anonymous',
        action: `Created sprint "${sprintData.name}"`,
        entity: 'sprint',
        entityId: docRef.id,
        details: { projectId: sprintData.projectId }
    });
    const docSnap = await getDoc(docRef);
    return { ...docSnap.data() } as Sprint;
  } catch (error) {
    console.error('Error creating sprint: ', error);
    throw new Error('Could not create the sprint.');
  }
};

/**
 * Obtiene todos los sprints para un proyecto específico.
 */
export const getSprintsForProject = async (projectId: string): Promise<Sprint[]> => {
  try {
    const q = query(collection(db, 'sprints'), where('projectId', '==', projectId), orderBy('startDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const sprints: Sprint[] = [];
    querySnapshot.forEach((doc) => {
      sprints.push({ id: doc.id, ...doc.data() } as Sprint);
    });
    return sprints;
  } catch (error) {
    console.error('Error getting sprints: ', error);
    throw new Error('Could not get sprints.');
  }
};

/**
 * Actualiza el estado de un sprint.
 */
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
            userName: user.displayName || 'Anonymous',
            action: `Changed status of sprint "${sprintName}" from ${oldStatus} to ${newStatus}`,
            entity: 'sprint',
            entityId: sprintId,
            details: { from: oldStatus, to: newStatus }
        });
    } catch (error) {
        console.error('Error updating sprint status: ', error);
        throw new Error('Could not update sprint status.');
    }
};


// ---- Funciones para Notificaciones ----

/**
 * Obtiene las notificaciones para un usuario específico.
 */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });
    return notifications;
  } catch (error) {
    console.error('Error getting notifications: ', error);
    throw new Error('Could not get notifications.');
  }
};


// ---- Funciones para Comentarios ----

/**
 * Añade un nuevo comentario a una tarea.
 */
export const addComment = async (taskId: string, commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> => {
    try {
        const commentsRef = collection(db, 'tasks', taskId, 'comments');
        const docRef = doc(commentsRef);
        const newComment = {
            ...commentData,
            id: docRef.id,
            createdAt: serverTimestamp(),
        };
        await setDoc(docRef, newComment);
        return { ...newComment, createdAt: new Timestamp(Date.now() / 1000, 0) } as Comment;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw new Error("Could not add comment.");
    }
}

/**
 * Escucha los comentarios de una tarea en tiempo real.
 */
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
        console.error("Error getting comments in real-time:", error);
    });

    return unsubscribe;
}


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
  writeBatch
} from 'firebase/firestore';
import { getFirebaseApp } from './get-firebase-app';

const app = getFirebaseApp();
const db = getFirestore(app);

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


// ---- Funciones para Proyectos ----

/**
 * Crea un nuevo proyecto en Firestore.
 * @param projectData - Los datos del proyecto a crear.
 * @returns El objeto del proyecto con su ID.
 */
export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'slug'>
): Promise<Project> => {
  try {
    const slug = projectData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });
    return { id: docRef.id, ...projectData, slug, createdAt: new Date(), updatedAt: new Date(), status: 'active' };
  } catch (error) {
    console.error('Error creating project: ', error);
    throw new Error('Could not create the project.');
  }
};

/**
 * Obtiene todos los proyectos.
 * @returns Un array de proyectos.
 */
export const getProjects = async (userId?: string): Promise<Project[]> => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = userId ? query(projectsRef, where('createdBy', '==', userId), orderBy('createdAt', 'desc')) : query(projectsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });
    return projects;
  } catch (error) {
    console.error('Error getting projects: ', error);
    throw new Error('Could not get projects.');
  }
};

/**
 * Obtiene un único proyecto por su ID.
 * @param projectId - El ID del proyecto.
 * @returns El objeto del proyecto.
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
  projectData: Partial<Project>
): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating project: ', error);
    throw new Error('Could not update the project.');
  }
};

/**
 * Elimina un proyecto y todas sus tareas y bugs asociados.
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Delete project
    const projectRef = doc(db, 'projects', projectId);
    batch.delete(projectRef);

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
  } catch (error) {
    console.error('Error deleting project and associated data: ', error);
    throw new Error('Could not delete the project.');
  }
};



// ---- Funciones para Tareas ----

/**
 * Crea una nueva tarea en Firestore.
 */
export const createTask = async (
  taskData: Omit<Task, 'id' | 'createdAt'>
): Promise<Task> => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...taskData, createdAt: new Date() };
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
    const q = query(collection(db, 'tasks'), where('projectId', 'in', projectIds));
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    return tasks;
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
  status: Task['status']
): Promise<void> => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status });
  } catch (error) {
    console.error('Error updating task status: ', error);
    throw new Error('Could not update the task status.');
  }
};


// ---- Funciones para Bugs ----

/**
 * Crea un nuevo bug en Firestore.
 */
export const createBug = async (
  bugData: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Bug> => {
  try {
    const docRef = await addDoc(collection(db, 'bugs'), {
      ...bugData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newBug = { id: docRef.id, ...bugData, createdAt: new Date(), updatedAt: new Date() };
    return newBug as Bug;
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
  status: BugStatus
): Promise<void> => {
  try {
    const bugRef = doc(db, 'bugs', bugId);
    await updateDoc(bugRef, {
      status,
      updatedAt: serverTimestamp(),
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
  timeLogData: Omit<TimeLog, 'id'>
): Promise<TimeLog> => {
  try {
    const docRef = await addDoc(collection(db, 'timeLogs'), {
      ...timeLogData,
      date: serverTimestamp(),
    });
    return { id: docRef.id, ...timeLogData, date: new Timestamp(Date.now() / 1000, 0) };
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
  pageData: Omit<WikiPage, 'id' | 'createdAt' | 'updatedAt' | 'slug'>
): Promise<WikiPage> => {
  try {
    const slug = pageData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const docRef = await addDoc(collection(db, 'wiki'), {
      ...pageData,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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

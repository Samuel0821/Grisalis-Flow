
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
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseApp } from './get-firebase-app';

const app = getFirebaseApp();
const db = getFirestore(app);

// Tipos de datos
export interface Project extends DocumentData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  status?: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
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

export interface Bug extends DocumentData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: BugStatus;
  priority: BugPriority;
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


// ---- Funciones para Proyectos ----

/**
 * Crea un nuevo proyecto en Firestore.
 * @param projectData - Los datos del proyecto a crear.
 * @returns El objeto del proyecto con su ID.
 */
export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Project> => {
  try {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });
    return { id: docRef.id, ...projectData, createdAt: new Date(), updatedAt: new Date(), status: 'active' };
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
    const q = userId ? query(projectsRef, where('createdBy', '==', userId)) : query(projectsRef);
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
    const q = query(collection(db, 'bugs'));
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

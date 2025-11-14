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
    throw new Error('No se pudo crear el proyecto.');
  }
};

/**
 * Obtiene todos los proyectos creados por un usuario específico.
 * @param userId - El ID del usuario.
 * @returns Un array de proyectos.
 */
export const getProjects = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(collection(db, 'projects'), where('createdBy', '==', userId));
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });
    return projects;
  } catch (error) {
    console.error('Error getting projects: ', error);
    throw new Error('No se pudieron obtener los proyectos.');
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
        throw new Error("No se pudo obtener el proyecto.");
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
    throw new Error('No se pudo crear la tarea.');
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
    throw new Error('No se pudieron obtener las tareas.');
  }
};

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
    throw new Error('No se pudo actualizar el estado de la tarea.');
  }
};

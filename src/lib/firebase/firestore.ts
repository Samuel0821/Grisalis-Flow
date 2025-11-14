
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

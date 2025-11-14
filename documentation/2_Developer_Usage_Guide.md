
# Guía de Uso para Desarrolladores de Grisalis Flow

**Versión 1.0**

Este documento es una guía práctica para que el equipo de desarrollo comience a trabajar con la base de código de Grisalis Flow, entienda los flujos de trabajo comunes y aprenda cómo extender la aplicación.

---

## 1. Primeros Pasos

### 1.1. Configuración del Entorno

El proyecto está diseñado para funcionar dentro del entorno de **Firebase Studio**, que gestiona la configuración de Firebase y las dependencias automáticamente.

1.  **Instalación de Dependencias:** Al iniciar el entorno, las dependencias listadas en `package.json` se instalan automáticamente. No es necesario ejecutar `npm install` manualmente.
2.  **Variables de Entorno:** La configuración de Firebase (`firebaseConfig`) se inyecta dinámicamente en el entorno. No necesitas crear un archivo `.env` para las credenciales de Firebase.

### 1.2. Ejecutar el Proyecto

Para iniciar la aplicación en modo de desarrollo, utiliza el siguiente comando desde la terminal del entorno:

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo de Next.js, generalmente accesible en el puerto `9002`.

---

## 2. Flujo de Trabajo de Desarrollo

Entender cómo se estructura la lógica es clave para contribuir al proyecto.

### 2.1. Añadir una Nueva Funcionalidad (Ejemplo: Añadir "Etiquetas" a una Tarea)

Supongamos que queremos añadir la capacidad de agregar etiquetas (tags) a las tareas. El proceso sería el siguiente:

**Paso 1: Actualizar el Modelo de Datos (`docs/backend.json`)**

Define el nuevo campo en la entidad `Task`.

```json
// In docs/backend.json, inside entities.Task.properties
"tags": {
  "type": "array",
  "description": "A list of tags associated with the task.",
  "items": {
    "type": "string"
  }
}
```

**Paso 2: Actualizar las Funciones de Firestore (`src/lib/firebase/firestore.ts`)**

Modifica la interfaz `Task` y las funciones `createTask` y `updateTask` para manejar el nuevo campo.

```typescript
// In /src/lib/firebase/firestore.ts

export interface Task extends DocumentData {
  // ... existing fields
  tags?: string[];
}

// Modify createTask to accept optional tags
export const createTask = async (
  taskData: Omit<Task, 'id' | 'createdAt'>,
  user: { uid: string, displayName: string | null }
): Promise<Task> => {
  // ... existing logic
  const newTask = {
    ...taskData,
    tags: taskData.tags || [], // Ensure it's an array
    // ...
  }
  // ...
};

// updateTask already supports partial updates, so no changes might be needed unless
// you want specific logic for tag updates.
```

**Paso 3: Modificar la Interfaz de Usuario**

-   **Diálogo de Creación de Tarea (`kanban-board.tsx`):** Añade un campo de entrada para las etiquetas.
-   **Diálogo de Detalles de Tarea (`kanban-board.tsx`):** Muestra las etiquetas existentes y permite editarlas.
-   **Tarjeta de Tarea (`kanban-board.tsx`):** Muestra las etiquetas en la tarjeta del tablero Kanban.

**Paso 4: Actualizar las Reglas de Seguridad (`firestore.rules`)**

Asegúrate de que el nuevo campo `tags` pueda ser escrito. Puedes añadir una validación para asegurarte de que sea un `list` (array).

```
// In firestore.rules, inside match /tasks/{taskId}
allow write: if isProjectMember(getTaskProjectId())
             && request.resource.data.tags is list;
```

Este flujo de trabajo (Modelo -> Lógica -> UI -> Seguridad) es el patrón a seguir para la mayoría de las modificaciones.

### 2.2. Interactuando con Firestore

-   **NUNCA** escribas directamente `firebase/firestore` en un componente de UI para operaciones de escritura.
-   **SIEMPRE** centraliza la lógica de negocio en las funciones de `src/lib/firebase/firestore.ts`. Esto mantiene el código organizado y facilita la adición de lógica secundaria como la creación de logs de auditoría o notificaciones.
-   **Para Lecturas en Tiempo Real**, utiliza los hooks `useCollection` y `useDoc` que se encuentran en `src/firebase/`. **Importante:** Asegúrate de memoizar la consulta (query) o la referencia (ref) que le pasas al hook usando `useMemo`, para evitar re-renderizados infinitos.

---

## 3. Guía de Estilo y Componentes

### 3.1. Componentes de UI

-   **Reutiliza Componentes Existentes:** Antes de crear un nuevo componente, revisa si ya existe algo similar en `src/components/ui` o `src/components/layout`.
-   **Uso de ShadCN:** La mayoría de los componentes base (Botones, Diálogos, Inputs) provienen de ShadCN. Utilízalos para mantener la consistencia visual.

### 3.2. Estilos con TailwindCSS

-   Utiliza las variables de tema definidas en `src/app/globals.css` y `tailwind.config.ts`. Por ejemplo, usa `bg-primary` en lugar de `bg-blue-500`.
-   Mantén la consistencia en espaciados y tamaños usando las clases de utilidad de Tailwind (`p-4`, `m-2`, `text-lg`, etc.).

### 3.3. Manejo de Estado

-   **Estado Local del Componente:** Para estados simples que no necesitan ser compartidos (como el estado de un formulario o si un diálogo está abierto), usa `useState`.
-   **Estado Global/Compartido:** No hay una librería de estado global como Zustand. La "fuente única de verdad" es **Firestore**. Si múltiples componentes necesitan acceder a los mismos datos, deben suscribirse a la misma colección o documento de Firestore usando los hooks `useCollection` o `useDoc`. El estado se sincronizará automáticamente.

---

## 4. Seguridad: Un Recordatorio Crítico

**Las reglas de seguridad de Firestore son tu backend.** Nunca confíes en que el cliente enviará datos válidos o que solo accederá a la información permitida.

-   Cada vez que añadas una nueva colección o modifiques un modelo de datos, **debes** revisar y actualizar `firestore.rules`.
-   Piensa en los casos borde: ¿Puede un usuario editar el `role` de otro usuario? ¿Puede un usuario ver las tareas de un proyecto al que no pertenece? Las reglas deben prohibir explícitamente estas acciones.

---

## 5. Extender la Aplicación con AI (Genkit)

Si necesitas añadir nuevas funcionalidades de IA:

1.  Crea un nuevo flow en `src/ai/flows/`.
2.  Define los esquemas de entrada y salida (`inputSchema`, `outputSchema`) usando `zod`.
3.  Escribe el prompt y la lógica del flow.
4.  Exporta una función asíncrona que llame al flow, la cual será consumida por el frontend.
5.  Importa y llama a esta función desde tu componente de React.

Consulta el archivo `src/ai/flows/ai-smart-summarization-tool.ts` como ejemplo.

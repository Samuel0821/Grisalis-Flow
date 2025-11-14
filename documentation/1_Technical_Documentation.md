
# Documentación Técnica de Grisalis Flow

**Versión 1.0**

Este documento proporciona una descripción técnica detallada del sistema Grisalis Flow, su arquitectura, stack tecnológico y decisiones de diseño clave. Está dirigido al equipo de desarrollo para el mantenimiento y futuras extensiones de la aplicación.

---

## 1. Visión General y Arquitectura

**Grisalis Flow** es una plataforma interna de gestión de flujos de trabajo construida sobre una arquitectura moderna, serverless y de cliente pesado (client-heavy). A diferencia de una arquitectura tradicional con un backend monolítico, Grisalis Flow aprovecha los servicios gestionados de **Firebase (Backend-as-a-Service)** para manejar la base de datos, la autenticación y la lógica en tiempo real.

El frontend, construido con **Next.js (App Router)**, se comunica directamente con los servicios de Firebase, lo que simplifica enormemente el desarrollo y el despliegue, al tiempo que proporciona una experiencia de usuario altamente reactiva.

### Diagrama de Arquitectura Adaptada

```
[         Cliente (Navegador)          ]
[--------------------------------------]
|      Next.js / React Frontend        |
|  (Componentes, Hooks, Lógica de UI)  |
[--------------------------------------]
             |      ^
             |      | (Lecturas/Escrituras/Suscripciones en tiempo real)
             v      |
[------- Firebase Platform (BaaS) -------]
|                 |                      |
|  Firestore DB   |  Firebase Auth       |
| (Base de Datos) | (Autenticación)      |
|                 |                      |
|-----------------|----------------------|
|     Reglas de Seguridad Firestore      |
|   (Lógica de Permisos y Roles)       |
[------------------------------------------]
```

---

## 2. Stack Tecnológico

El stack fue seleccionado para optimizar la velocidad de desarrollo y aprovechar las capacidades nativas del entorno de **Firebase Studio**.

- **Framework Frontend:** **Next.js 14+ (App Router)**
  - Se utiliza para la renderización de componentes en el servidor y en el cliente, el enrutamiento y la estructura general de la aplicación.

- **Librería de UI:** **React**
  - Para la construcción de la interfaz de usuario a través de una arquitectura basada en componentes.

- **Estilos y Componentes de UI:**
  - **TailwindCSS:** Framework CSS utility-first para un diseño rápido y consistente.
  - **ShadCN/UI:** Colección de componentes de UI reutilizables, accesibles y personalizables construidos sobre TailwindCSS.
  - **Lucide React:** Para la iconografía del sistema.

- **Backend y Base de Datos:** **Firebase**
  - **Firestore:** Base de datos NoSQL, orientada a documentos y en tiempo real. Es el corazón del sistema, almacenando toda la información de proyectos, tareas, usuarios, etc.
  - **Firebase Authentication:** Servicio gestionado para la autenticación de usuarios por correo y contraseña. Maneja de forma segura la sesión, tokens y la identidad del usuario.

- **Lenguaje:** **TypeScript**
  - Se utiliza en todo el proyecto para garantizar la seguridad de tipos, mejorar el autocompletado y reducir errores en tiempo de ejecución.

- **Integración AI:** **Genkit**
  - Se utiliza para la funcionalidad del "AI Smart Summarizer", orquestando la llamada al modelo de lenguaje (Gemini).

- **Gestión de Estado:**
  - Se utiliza una combinación de **hooks nativos de React (`useState`, `useEffect`, `useMemo`)** y la **gestión de estado en tiempo real de Firebase**. Esto elimina la necesidad de librerías de estado global como Zustand o Redux, ya que Firestore actúa como la fuente única de verdad sincronizada.

---

## 3. Estructura del Proyecto

La estructura de carpetas está organizada para promover la modularidad y la fácil localización del código.

- **/src/app/(app)/**: Contiene todas las páginas principales de la aplicación que requieren autenticación. Utiliza el App Router de Next.js.
- **/src/components/**: Alberga componentes de React reutilizables, divididos en:
  - `/ui`: Componentes base de ShadCN.
  - `/layout`: Componentes estructurales como el Header y la Sidebar.
- **/src/lib/firebase/**: Centraliza toda la interacción con Firebase.
  - `firestore.ts`: Contiene todas las funciones CRUD y de lógica de negocio que interactúan con Firestore (ej: `createProject`, `getTasks`, `addComment`).
  - `auth.ts`: Funciones relacionadas con la autenticación.
- **/src/hooks/**: Contiene hooks personalizados, como `use-auth.tsx` para la protección de rutas.
- **/src/firebase/**: Contiene la configuración y los providers de Firebase, así como los hooks de tiempo real (`useCollection`, `useDoc`).
- **/docs/**:
  - `backend.json`: **Archivo Crítico**. Define el esquema de todas las entidades de datos y la estructura de las colecciones de Firestore. Sirve como un "contrato" para el código.
- **/documentation/**: Contiene la documentación del proyecto (este archivo, manual de usuario, etc.).
- **/firestore.rules**: **Archivo Crítico**. Define las reglas de seguridad de la base de datos, controlando quién puede leer, escribir o borrar datos basándose en su rol y propiedad de los documentos.

---

## 4. Modelos de Datos y Firestore

La fuente de verdad para los modelos de datos es el archivo `docs/backend.json`. Este archivo define cada "entidad" (como `Project`, `Task`, `Bug`) usando JSON Schema.

### Colecciones Principales en Firestore

- `/userProfiles/{userId}`: Almacena datos adicionales del usuario, como su rol.
- `/projects/{projectId}`: Almacena los proyectos.
- `/tasks/{taskId}`: Colección global para todas las tareas. Se vinculan a proyectos mediante `projectId`.
- `/bugs/{bugId}`: Colección global para todos los bugs.
- `/sprints/{sprintId}`: Colección global para todos los sprints.
- `/wiki/{wikiPageId}`: Almacena las páginas de la wiki.
- `/notifications/{notificationId}`: Almacena notificaciones para usuarios específicos.
- `/auditLogs/{logId}`: Almacena los registros de auditoría del sistema.

### Subcolecciones

- `/projects/{projectId}/members/{userId}`: Gestiona los miembros de un proyecto y su rol.
- `/tasks/{taskId}/comments/{commentId}`: Almacena los comentarios de una tarea.
- `/wiki/{wikiPageId}/versions/{versionId}`: Guarda el historial de cambios de una página de la wiki.

Esta estructura permite consultas eficientes y reglas de seguridad granulares.

---

## 5. Flujo de Datos y Lógica de Negocio

A diferencia de una arquitectura con un backend propio, **la lógica de negocio se ejecuta en dos lugares principales**:

1.  **Funciones del Cliente (`/lib/firebase/firestore.ts`):** El código que se ejecuta en el navegador del usuario es responsable de realizar las operaciones de escritura (crear, actualizar, eliminar). Por ejemplo, al crear una tarea, la función `createTask` no solo crea el documento `task`, sino que también crea una entrada en `auditLogs`.

2.  **Reglas de Seguridad de Firestore (`firestore.rules`):** Son la capa de autorización y validación de datos. Antes de que cualquier operación de escritura se confirme, las reglas de Firestore la validan. Por ejemplo, verifican que un usuario que intenta actualizar un proyecto sea realmente el "owner" de ese proyecto. **Esta es la parte más crítica de la seguridad del sistema.**

### Ejemplo: Flujo al Mover una Tarea

1.  **Usuario (UI):** Arrastra una tarjeta de tarea de "In Progress" a "Done" en el tablero Kanban.
2.  **Componente React (`kanban-board.tsx`):** El evento `onDragEnd` se dispara.
3.  **Lógica de Cliente:** El componente llama a la función `updateTaskStatus(taskId, 'done')`.
4.  **Firestore SDK:** El SDK envía una solicitud de actualización al servidor de Firestore.
5.  **Reglas de Seguridad:** El servidor de Firestore evalúa las reglas en `firestore.rules`.
    - Verifica si el usuario está autenticado (`isSignedIn()`).
    - Verifica si el usuario es miembro del proyecto al que pertenece la tarea (`isProjectMember()`).
6.  **Actualización de Datos:** Si las reglas se cumplen, el campo `status` de la tarea se actualiza en la base de datos.
7.  **Sincronización en Tiempo Real:** Firestore propaga este cambio a todos los demás usuarios que están viendo el mismo tablero Kanban, y sus interfaces de usuario se actualizan automáticamente.

---

## 6. Seguridad

La seguridad de Grisalis Flow se basa en tres pilares:

1.  **Autenticación (Firebase Auth):** Se asegura de que solo los usuarios registrados puedan acceder a la aplicación.
2.  **Autorización (Reglas de Seguridad de Firestore):** Es la defensa principal. Define con precisión qué datos puede ver o modificar cada usuario. Impide que un usuario acceda a los proyectos de otro, o que un "miembro" elimine un proyecto.
3.  **Lógica del Lado del Cliente:** El frontend está diseñado para mostrar solo los datos a los que el usuario tiene acceso, pero nunca se confía en el cliente para la seguridad. La validación final siempre ocurre en el backend de Firebase a través de las reglas.

---

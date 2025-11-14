
# Manual de Usuario de Grisalis Flow

**Versión 1.0**

¡Bienvenido a Grisalis Flow! Esta guía te ayudará a entender y utilizar todas las funcionalidades de la plataforma para gestionar tus proyectos de manera eficiente.

---

## 1. Primeros Pasos

### 1.1. Iniciar Sesión

Para acceder a Grisalis Flow, necesitarás credenciales (correo y contraseña) proporcionadas por un administrador.

1.  Navega a la página de inicio.
2.  Introduce tu correo electrónico y contraseña.
3.  Haz clic en **"Iniciar sesión"**.

Una vez dentro, serás dirigido al **Dashboard Principal**.

---

## 2. Navegación Principal

La interfaz se divide en dos áreas principales:

-   **Barra Lateral (Izquierda):** Tu centro de navegación principal para acceder a todos los módulos (Proyectos, Bugs, Wiki, etc.).
-   **Cabecera (Superior):** Contiene un buscador, el panel de notificaciones y el menú de tu perfil.

---

## 3. Módulos y Funcionalidades

### 3.1. Dashboard Principal

Esta es tu página de inicio. Te ofrece una vista rápida de:
-   **Proyectos Activos:** El número de proyectos en los que eres miembro.
-   **Tareas Pendientes:** El total de tareas que no han sido marcadas como "Done".
-   **Bugs Abiertos:** El número de bugs que no han sido resueltos o cerrados.

### 3.2. Gestión de Proyectos

Desde el módulo **Projects**, puedes ver todos los proyectos a los que tienes acceso.

-   **Crear un Proyecto:** Haz clic en el botón **"Create Project"**. Dale un nombre y una descripción. Automáticamente te convertirás en el "owner" del proyecto.
-   **Ver un Proyecto:** Haz clic en el nombre de cualquier proyecto de la lista para acceder a su espacio de trabajo detallado.
-   **Editar/Eliminar un Proyecto:** Haz clic en el menú de tres puntos en la tarjeta de un proyecto para editar sus detalles o eliminarlo (solo si eres el "owner").

### 3.3. Dentro de un Proyecto

Al entrar a un proyecto, verás varias pestañas:

#### a) Dashboard del Proyecto
Vista general con métricas específicas del proyecto: total de tareas, miembros, y un **Burn-down chart** del sprint activo.

#### b) Kanban (Tablero de Tareas)
Tu principal espacio de trabajo para la gestión de tareas.
-   **Crear una Tarea:** Usa el botón **"New Task"**.
-   **Mover Tareas:** Arrastra y suelta las tarjetas de tareas entre las columnas (`Backlog`, `To-do`, `In Progress`, `Testing`, `In Review`, `Done`) para actualizar su estado.
-   **Ver Detalles de una Tarea:** Haz clic en cualquier tarjeta de tarea para abrir un diálogo con todos sus detalles.

#### c) Detalles de una Tarea
Dentro del diálogo de detalles, puedes:
-   **Asignar la Tarea:** Elige un miembro del proyecto como responsable.
-   **Asignar a un Sprint:** Vincula la tarea a un sprint planificado o activo.
-   **Añadir Adjuntos:** Pega una URL (a un diseño, documento, etc.) en el campo "Attachment".
-   **Gestionar Subtareas:** Crea una lista de subtareas más pequeñas. Puedes marcarlas como completadas y ver el progreso.
-   **Dejar Comentarios:** Comunícate con tu equipo en la sección de comentarios. La conversación queda registrada dentro de la tarea.

#### d) Sprints
-   **Crear un Sprint:** Planifica ciclos de trabajo usando el botón **"New Sprint"**. Define un nombre y un rango de fechas.
-   **Iniciar/Completar un Sprint:** Usa el menú de tres puntos en una tarjeta de sprint para cambiar su estado de "Planning" a "Active" o de "Active" a "Completed".
-   **Ver Tareas del Sprint:** Cada tarjeta de sprint muestra una lista de todas las tareas asociadas a él.

#### e) Settings (Configuración)
-   **Gestionar Miembros:** Si eres el "owner" del proyecto, aquí puedes añadir nuevos miembros (seleccionándolos de una lista de usuarios del sistema) o eliminar miembros existentes.

### 3.4. Bug Tracker
Módulo para el seguimiento de errores.
-   **Reportar un Bug:** Haz clic en **"Report New Bug"**. Rellena campos clave como el título, los pasos para reproducir el error, la severidad, la prioridad y adjunta una URL como evidencia.
-   **Actualizar Estado:** Haz clic en un bug de la lista para ver sus detalles y cambiar su estado (`New`, `In Progress`, `Resolved`, `Closed`).

### 3.5. Timesheet
Registra las horas trabajadas en tareas específicas.
1.  **Selecciona Proyecto y Tarea:** Elige el proyecto y la tarea en la que trabajaste.
2.  **Ingresa Horas:** Anota el número de horas (puedes usar decimales, ej: 1.5).
3.  **Añade una Descripción (Opcional):** Detalla el trabajo realizado.
4.  Haz clic en **"Log Time"**. Tu entrada aparecerá en la lista de "My Time Logs".

### 3.6. Reports
Genera informes de tiempo.
-   Usa los menús desplegables para **filtrar los registros** por Proyecto, Usuario o un Rango de Fechas específico.
-   La tabla se actualizará automáticamente con los resultados.
-   Haz clic en **"Export CSV"** para descargar un archivo CSV con los datos filtrados, listo para ser usado en hojas de cálculo.

### 3.7. Internal Wiki
Base de conocimiento del equipo.
-   **Crear un Artículo:** Haz clic en **"Create Article"**. Usa la sintaxis Markdown para formatear tu texto.
-   **Ver un Artículo:** Navega por la lista y haz clic en cualquier artículo para leerlo.
-   **Editar un Artículo:** Dentro de un artículo, usa el botón **"Edit Article"**.
-   **Ver Historial:** Haz clic en **"View History"** para abrir un diálogo que te permitirá ver versiones anteriores del artículo.

### 3.8. Notificaciones
El icono de la campana en la cabecera te mantiene informado.
-   Un punto rojo indica que tienes notificaciones nuevas.
-   Haz clic en la campana para ver una lista de tus notificaciones (tareas asignadas, comentarios, etc.).
-   Puedes marcar notificaciones como leídas una por una o todas a la vez.

---

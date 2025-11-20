# Guía de Configuración del Proyecto: Grisalis-Flow

¡Bienvenido al proyecto! Esta guía te ayudará a configurar el entorno de desarrollo en tu máquina local.

### 1. Tecnologías Utilizadas

Este proyecto está construido con un stack de tecnologías moderno. Las principales son:

*   **Framework:** Next.js (versión 16+) con React 19.
*   **Lenguaje:** TypeScript.
*   **Backend y Base de Datos:** Firebase (específicamente Firestore para la base de datos y Firebase Authentication).
*   **Estilos:** Tailwind CSS para el diseño de la interfaz.
*   **Componentes UI:** shadcn/ui, que utiliza Radix UI para componentes accesibles y personalizables.
*   **Gestión de Formularios:** React Hook Form con Zod para la validación de esquemas.
*   **Gestor de Paquetes:** npm.

### 2. Prerrequisitos

Antes de empezar, asegúrate de tener instalado lo siguiente en tu equipo:

*   **Git:** Para clonar y gestionar el código fuente. Descargar Git.
*   **Node.js:** Se recomienda la versión **20.9.0 o superior**. Puedes descargar la última versión LTS desde nodejs.org.
*   **Un editor de código:** Se recomienda Visual Studio Code.
*   **Una cuenta de GitHub:** Para poder clonar el repositorio.

### 3. Pasos para la Configuración

Sigue estos pasos en orden para configurar el proyecto.

#### Paso 3.1: Clonar el Repositorio

Una vez que hayas aceptado la invitación de colaborador, abre una terminal o línea de comandos y clona el repositorio en tu máquina:

```bash
git clone https://github.com/Samuel0821/Grisalis-Flow.git
```

Luego, navega a la carpeta del proyecto:

```bash
cd Grisalis-Flow
```

#### Paso 3.2: Instalar Dependencias

Dentro de la carpeta del proyecto, ejecuta el siguiente comando para instalar todas las librerías y paquetes necesarios:

```bash
npm install
```

Este proceso puede tardar unos minutos.

#### Paso 3.3: Configurar las Variables de Entorno

El proyecto necesita conectarse a los servicios de Firebase. Para ello, debes configurar tus credenciales en un archivo de entorno local.

1.  En la raíz del proyecto, crea un nuevo archivo llamado `.env.local`.
2.  Pide a tu compañero que te comparta el contenido de su archivo `.env.local`. Debería tener un formato similar a este:

    ```
    # Firebase Client Config
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
    NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ
    ```

3.  Copia y pega ese contenido en tu archivo `.env.local` que acabas de crear.

> **Importante:** Este archivo es local y no debe ser subido a GitHub por seguridad.

#### Paso 3.4: Ejecutar el Proyecto

¡Ya está todo listo! Ahora puedes iniciar el servidor de desarrollo con el siguiente comando:

```bash
npm run dev
```

El proyecto se ejecutará en el puerto `9002`. Abre tu navegador y ve a la siguiente dirección:

http://localhost:9002

Deberías ver la aplicación funcionando. 
Cuando estés en este punto, comunícate con tu compañero y pide que te coparta usuario y contraseña para ingresar a la plataforma, allí podras explorar cada módulo. 
¡Feliz codificación!


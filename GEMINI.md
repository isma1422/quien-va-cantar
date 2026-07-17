# Quién Va Cantar - Reglas y Contexto del Proyecto 🎤

Este archivo (`GEMINI.md`) contiene el contexto arquitectónico, de base de datos y flujos críticos de la aplicación. Antigravity lo cargará automáticamente en cada sesión de trabajo en este repositorio.

---

## 🏗️ Arquitectura y Tecnologías
* **Framework**: [Expo](https://expo.dev/) (SDK 54) con [React Native](https://reactnative.dev/).
* **Enrutamiento**: `expo-router` con navegación basada en archivos (`/app`).
* **Base de Datos & Auth**: [Firebase v12](https://firebase.google.com/docs) (Firestore + Authentication).
* **Pruebas**: Jest + React Native Testing Library.
* **Plataformas**: iOS, Android y Web.

---

## 📂 Estructura del Proyecto

```text
/
├── app/                      # Rutas de la aplicación (Expo Router)
│   ├── (tabs)/               # Pestañas principales
│   │   ├── _layout.tsx       # Navegador de pestañas e inicialización de notificaciones
│   │   ├── index.tsx         # Cartelera de shows (Explorar eventos, buscar, guardar)
│   │   ├── saved.tsx         # Shows guardados (favoritos del usuario)
│   │   ├── submit.tsx        # Proponer un show / Carga de eventos
│   │   └── profile.tsx       # Gestión de perfil (Login, registro, modo Admin)
│   ├── _layout.tsx           # Layout raíz de la app (Navegación principal)
│   └── modal.tsx             # Modal genérico / de pruebas
├── components/               # Componentes reutilizables
│   ├── ui/                   # Componentes de interfaz (Button, Card, SearchBar, AlertModal, etc.)
│   └── NotificationsModal.tsx # Panel de notificaciones en tiempo real (In-app)
├── constants/                # Estilos globales y colores (Colors.ts)
├── hooks/                    # Hooks personalizados (useAuth, useThemeColor, useHasMounted)
├── services/                 # Lógica de negocio y conectores de Firebase
│   ├── firebase.ts           # Inicialización y credenciales de Firebase
│   ├── api.ts                # Operaciones CRUD sobre eventos, usuarios y favoritos
│   ├── notifications.ts      # Gestión de notificaciones in-app
│   └── pushNotifications.ts  # Registro y guardado de Expo Push Tokens
├── firestore.rules           # Reglas de seguridad de Firestore
└── metro.config.js           # Configuración de Metro (con polyfill para Node.js < 20)
```

---

## 🗃️ Base de Datos y Reglas (Firestore)

### 1. `users` (Usuarios)
* **Propósito**: Almacena el perfil del usuario, rol y token para notificaciones push.
* **Esquema**: `{ email, role: 'admin' | 'user', expoPushToken? }`

### 2. `events` (Eventos)
* **Propósito**: Shows de música cargados en el sistema.
* **Esquema**: `{ title, description, date (ISO), place, ticket_link, status: 'pending' | 'approved', created_by (UID), image_url? }`

### 3. `saved_events` (Favoritos)
* **Propósito**: Vinculación de shows guardados por los usuarios.
* **Esquema**: `{ user_id, event_id }`

### 4. `notifications` (Notificaciones In-App)
* **Propósito**: Alertas enviadas en tiempo real a la campana del usuario.
* **Esquema**: `{ user_id, title, body, createdAt (Timestamp), read, type: 'info' | 'success' | 'warning', eventId? }`

---

## 🔔 Flujo de Notificaciones

* **Favoritos (`info`)**: Notifica al usuario cuando guarda un show en su cartelera.
* **Aprobación de Show (`success`)**: Notifica al creador cuando el admin aprueba su show.
* **Rechazo de Show (`warning`)**: Notifica al creador cuando el admin rechaza su show.
* **Propuesta Pendiente (`info`)**: Notifica a todos los administradores cuando se crea o edita una propuesta de show.

---

## ⚙️ Comandos Útiles

* **Iniciar en modo web**: `npm run web`
* **Iniciar suite de pruebas**: `npm test`
* **Compilar para producción**: `npm run build`

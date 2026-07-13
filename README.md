# Quién Va Cantar 🎤

Quién Va Cantar es una aplicación web y mobile diseñada para descubrir shows de música en vivo y cantores locales. Permite a los usuarios explorar eventos por fecha, guardar sus shows preferidos y enviar propuestas para sumar eventos a la cartelera.

---

## 🚀 Comenzando

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### 1. Requisitos Previos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) y npm en tu máquina.

### 2. Instalar Dependencias
Instala los paquetes necesarios definidos en el proyecto:
```bash
npm install
```

### 3. Configuración de Firebase
El proyecto utiliza Firebase Firestore y Firebase Authentication. La configuración base se encuentra en `services/firebase.ts`. Si deseas conectar tu propio entorno:
1. Crea un proyecto en la consola de Firebase.
2. Crea una base de datos Firestore y activa las reglas en `firestore.rules`.
3. Actualiza las credenciales en [services/firebase.ts](file:///home/ismael/repos/quien-va-cantar/quien-va-cantar/services/api.ts).

---

## 💻 Desarrollo

### Iniciar Servidor de Desarrollo
Para lanzar la aplicación en modo desarrollo en tu navegador:
```bash
npm run web
```
*También puedes utilizar `npx expo start` para escanear el código QR y probarlo en dispositivos móviles físicos vía Expo Go.*

---

## 🧪 Pruebas Unitarias

Utilizamos **Jest** y **React Native Testing Library** para asegurar que los flujos críticos de la interfaz no sufran regresiones.

### Ejecutar Suite de Tests
Ejecuta todas las pruebas unitarias del proyecto con:
```bash
npm test
```

### Estructura de Pruebas
* **Hooks**: `hooks/__tests__/useHasMounted.test.ts`
* **Servicios**: `services/__tests__/notifications.test.ts`
* **Componentes**: 
  * `components/ui/__tests__/WebContainer.test.tsx`
  * `components/ui/__tests__/Button.test.tsx`

---

## 🔔 Sistema de Notificaciones

El proyecto cuenta con un sistema híbrido de **notificaciones In-App** (persistencia en tiempo real en Firestore) y **notificaciones Push** (mediante tokens de Expo) diseñado para mantener al usuario informado sobre el estado de sus eventos.

### Registro de Tokens Push
Cuando un usuario inicia sesión, la aplicación solicita permisos nativos de notificaciones y almacena el token único de Expo en su perfil dentro del documento `/users/{uid}`.

### Eventos que Disparan Notificaciones
1. **Guardar en Favoritos**: Al presionar *"Guardar"* en la cartelera, el usuario recibe una alerta informativa (`info`) sobre el seguimiento del show.
2. **Aprobación de Show**: Al presionar *"Aprobar"* en la pantalla de moderación, el administrador registra una alerta de éxito (`success`) destinada al creador del show.
3. **Rechazo de Show**: Al presionar *"Rechazar"* en la pantalla de moderación, el administrador genera una alerta de aviso (`warning`) destinada al creador del show.
4. **Propuesta Pendiente de Moderación**: Al enviar una propuesta o editar un show existente (desde la pantalla de carga), el sistema crea una notificación de información (`info`) destinada a todos los usuarios con rol `admin` indicando que hay un show esperando aprobación.

---

## 📦 Producción y Despliegue

### Compilar para Producción
Para compilar la aplicación como un sitio web estático optimizado para producción:
```bash
npm run build
```
Esto generará los archivos finales en la carpeta `/dist`.

### Configuración Vercel
El proyecto está configurado para alojarse de forma estática en Vercel mediante [vercel.json](file:///home/ismael/repos/quien-va-cantar/quien-va-cantar/vercel.json).

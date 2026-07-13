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

## 📦 Producción y Despliegue

### Compilar para Producción
Para compilar la aplicación como un sitio web estático optimizado para producción:
```bash
npm run build
```
Esto generará los archivos finales en la carpeta `/dist`.

### Configuración Vercel
El proyecto está configurado para alojarse de forma estática en Vercel mediante [vercel.json](file:///home/ismael/repos/quien-va-cantar/quien-va-cantar/vercel.json).

# Quién Va Cantar - Propuesta de Mejoras 🚀

Este documento detalla las ideas de mejora para la aplicación "Quién Va Cantar", divididas por áreas temáticas, con un enfoque detallado en la **Exploración Interactiva de Eventos (UI/UX)** que incluye un diseño visual propuesto.

---

## 🎨 1. Exploración Interactiva de Eventos (UI/UX) - Opción B (Seleccionada)

Esta mejora optimiza la forma en que los usuarios descubren y filtran shows en la cartelera, adaptándose a la lógica de exploración mensual pero ofreciendo atajos temporales rápidos.

### Componentes de la Propuesta:
1. **Tira de Filtros Rápidos**: Una barra horizontal deslizante con atajos relativos: `[ Todo el Mes ]`, `[ Este Finde ]`, `[ Esta Semana ]` y `[ Hoy ]`. Esto permite segmentar el feed del mes de forma instantánea.
2. **Botón de Calendario y Vista Desplegable**: Un botón de calendario discreto al lado de los filtros. Al tocarlo, se despliega una cuadrícula mensual flotante para seleccionar un día específico.
3. **Etiquetas y Filtros de Géneros**: Agregar píldoras/badges que indiquen el género musical de cada concierto (*Rock, Indie, Jazz, Folklore, Blues, etc.*).
4. **Integración con Mapas (Ver en Mapa)**: Agregar un botón link que interactúa con la geolocalización y abre la ubicación del local en Google Maps o Apple Maps nativo.

### Comportamiento de la Interfaz:
* **Sin fecha seleccionada**: Muestra el nombre del mes/filtro activo arriba (ej. `"Octubre 2026"`, `"Este Fin de Semana"`) y la tira de filtros rápidos abajo.
* **Fecha seleccionada**: Muestra el texto `"Filtrando: DD de [Mes]"` con un botón de limpiar ("X") para volver al filtro mensual, y oculta temporalmente la tira de atajos.
* **Calendario Abierto**: Muestra el mes completo en cuadrícula sobre el feed.

---

## 👥 2. Funciones Sociales y Compartir

* **Compartir de forma Nativa**: Integrar la API `Share` de React Native para enviar detalles formateados del show (título, lugar, fecha y enlace de entradas) a WhatsApp, Instagram o Telegram.
* **Agregar al Calendario del Dispositivo**: Utilizar `expo-calendar` para que cuando un usuario guarde un show en favoritos, tenga la opción de agendarlo automáticamente en su Google Calendar o Apple Calendar personal.
* **Contador de Guardados ("Quiénes Van")**: Mostrar en la tarjeta del show un contador que indique cuántas personas han guardado el evento para generar prueba social y mayor interés.

---

## ✍️ 3. Mejoras en la Carga de Eventos (Submit)

* **Subida Directa de Imágenes (Flyers)**: Integrar `expo-image-picker` y Firebase Storage para que los creadores de shows puedan subir el afiche directamente desde su galería o cámara en lugar de pegar una URL.
* **Selector de Hora Nativo**: Reemplazar la caja de texto de hora actual por un selector nativo (`@react-native-community/datetimepicker`) para evitar errores de formato (ej. usar `21:00` en vez de texto plano libre).

---

## ⚙️ 4. Rendimiento y Backend

* **Paginación en Firestore**: Limitar las consultas iniciales a 10 o 15 eventos y cargar más a medida que el usuario realiza scroll (Infinite Scroll), reduciendo tiempos de carga iniciales y consumo de datos.
* **Soporte Offline y Caché**: Habilitar persistencia offline en Firestore o guardar la última cartelera en `AsyncStorage` para permitir a los usuarios consultar sus shows guardados dentro de los locales donde hay mala señal de red.
* **Deep Links (Enlaces Profundos)**: Configurar enlaces profundos en Expo Router para abrir la aplicación directamente en la vista de un show específico a partir de un enlace compartido.

import { db, auth } from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  writeBatch, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
  eventId?: string;
}

// Check if running in a Jest/Test environment to use local in-memory fallback
const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

let mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'mock-user',
    title: '¡Show Aprobado!',
    body: 'Tu propuesta "Tarde de Jazz & Blues" ha sido aprobada por el administrador y ya está visible en la cartelera.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
    type: 'success',
  },
  {
    id: '2',
    user_id: 'mock-user',
    title: 'Actualización de Horario',
    body: 'El evento "Festival de Rock Local" que tienes guardado cambió su horario de inicio a las 21:30 hs.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    read: false,
    type: 'warning',
  },
  {
    id: '3',
    user_id: 'mock-user',
    title: 'Nuevo Show de Folklore',
    body: 'Se ha publicado un nuevo show de "Peña y Tradición" en el Club de Música.',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hours ago
    read: true,
    type: 'info',
  }
];

// Subscribe to real-time notification changes
export function subscribeToNotifications(callback: (list: Notification[]) => void): () => void {
  const currentUser = auth.currentUser;

  if (isTestEnv) {
    // In test environment, immediately trigger with mock data
    callback([...mockNotifications]);
    return () => {};
  }

  if (!currentUser) {
    // Unauthenticated users see empty notification list
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'notifications'),
    where('user_id', '==', currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const list: Notification[] = snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      let createdAtStr = new Date().toISOString();
      if (data.createdAt) {
        // Handle Firestore Timestamp conversion
        createdAtStr = typeof data.createdAt.toDate === 'function' 
          ? data.createdAt.toDate().toISOString() 
          : new Date(data.createdAt).toISOString();
      }
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: createdAtStr,
      } as Notification;
    });
    callback(list);
  }, (error) => {
    console.error('Error fetching notifications from Firestore:', error);
  });
}

// Mark a single notification as read
export async function markNotificationAsRead(id: string): Promise<Notification[]> {
  const currentUser = auth.currentUser;

  if (isTestEnv || !currentUser) {
    mockNotifications = mockNotifications.map(item =>
      item.id === id ? { ...item, read: true } : item
    );
    return [...mockNotifications];
  }

  const docRef = doc(db, 'notifications', id);
  await updateDoc(docRef, { read: true });
  return [];
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(notifications: Notification[]): Promise<Notification[]> {
  const currentUser = auth.currentUser;

  if (isTestEnv || !currentUser) {
    mockNotifications = mockNotifications.map(item => ({ ...item, read: true }));
    return [...mockNotifications];
  }

  const batch = writeBatch(db);
  notifications.forEach(notification => {
    if (!notification.read) {
      const docRef = doc(db, 'notifications', notification.id);
      batch.update(docRef, { read: true });
    }
  });
  await batch.commit();
  return [];
}

// Delete notification document
export async function deleteNotification(id: string): Promise<Notification[]> {
  const currentUser = auth.currentUser;

  if (isTestEnv || !currentUser) {
    mockNotifications = mockNotifications.filter(item => item.id !== id);
    return [...mockNotifications];
  }

  const docRef = doc(db, 'notifications', id);
  await deleteDoc(docRef);
  return [];
}

// Add a new notification
export async function addNotification(
  title: string, 
  body: string, 
  type: 'info' | 'success' | 'warning', 
  eventId?: string,
  targetUserId?: string
): Promise<Notification[]> {
  const currentUser = auth.currentUser;
  const userId = targetUserId || (currentUser ? currentUser.uid : 'mock-user');

  if (isTestEnv || !currentUser) {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      title,
      body,
      createdAt: new Date().toISOString(),
      read: false,
      type,
      eventId,
    };
    mockNotifications = [newNotification, ...mockNotifications];
    return [...mockNotifications];
  }

  const newDocRef = await addDoc(collection(db, 'notifications'), {
    user_id: userId,
    title,
    body,
    createdAt: serverTimestamp(),
    read: false,
    type,
    eventId,
  });

  return [];
}
export async function getNotifications(): Promise<Notification[]> {
  return new Promise((resolve) => {
    if (isTestEnv) {
      resolve([...mockNotifications]);
    } else {
      resolve([]);
    }
  });
}

// Notify all administrators about a newly submitted event proposal waiting for approval
export async function notifyAdminsOfNewEvent(
  eventId: string,
  eventTitle: string,
  eventPlace: string
): Promise<void> {
  if (isTestEnv) {
    return;
  }
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snapshot = await getDocs(q);
    const adminIds = snapshot.docs.map(docSnapshot => docSnapshot.id);

    for (const adminId of adminIds) {
      await addNotification(
        'Propuesta Pendiente',
        `Se ha recibido una propuesta para el show "${eventTitle}" en "${eventPlace}".`,
        'info',
        eventId,
        adminId
      ).catch(err => console.error("Error notifying admin:", err));
    }
  } catch (err) {
    console.error("Error in notifyAdminsOfNewEvent:", err);
  }
}

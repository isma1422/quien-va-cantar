import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  place: string;
  ticket_link: string;
  status: 'pending' | 'approved';
  created_by: string;
  image_url?: string;
}

export interface SavedEvent {
  id: string;
  user_id: string;
  event_id: string;
}

const EVENTS_COL = 'events';
const SAVED_EVENTS_COL = 'saved_events';
const USERS_COL = 'users';

// Real logic connected to Firestore:
export const getCurrentUserRole = async (uid: string): Promise<string> => {
   const userDoc = await getDoc(doc(db, USERS_COL, uid));
   if (userDoc.exists()) {
      return userDoc.data().role || 'user';
   }
   return 'user';
}

export const getEvents = async (): Promise<Event[]> => {
  const q = query(collection(db, EVENTS_COL), where('status', '==', 'approved'));
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Event));
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getPendingEvents = async (): Promise<Event[]> => {
  const q = query(collection(db, EVENTS_COL), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Event));
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getMyEvents = async (): Promise<Event[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No has iniciado sesión');
  const q = query(collection(db, EVENTS_COL), where('created_by', '==', currentUser.uid));
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Event));
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getEventById = async (id: string): Promise<Event> => {
  const eventDoc = await getDoc(doc(db, EVENTS_COL, id));
  if (!eventDoc.exists()) throw new Error('Evento no encontrado');
  return { id: eventDoc.id, ...eventDoc.data() } as Event;
};

export const saveEvent = async (event_id: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No has iniciado sesión');
  
  // check if already saved
  const q = query(collection(db, SAVED_EVENTS_COL), 
     where('user_id', '==', currentUser.uid),
     where('event_id', '==', event_id)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return; 

  await addDoc(collection(db, SAVED_EVENTS_COL), {
    user_id: currentUser.uid,
    event_id
  });
};

export const unsaveEvent = async (event_id: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No has iniciado sesión');
  const q = query(collection(db, SAVED_EVENTS_COL), 
     where('user_id', '==', currentUser.uid),
     where('event_id', '==', event_id)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
     for (const document of snap.docs) {
         await deleteDoc(doc(db, SAVED_EVENTS_COL, document.id));
     }
  }
};

export const getSavedEvents = async (): Promise<Event[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];
  const q = query(collection(db, SAVED_EVENTS_COL), where('user_id', '==', currentUser.uid));
  const snap = await getDocs(q);
  if (snap.empty) return [];

  const savedIds = snap.docs.map((d: any) => d.data().event_id);
  
  const allApproved = await getEvents();
  return allApproved.filter(e => savedIds.includes(e.id));
};

export const createEvent = async (
  eventData: Omit<Event, 'id' | 'status' | 'created_by'>
): Promise<Event> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No has iniciado sesión');
  
  const newRef = await addDoc(collection(db, EVENTS_COL), {
    ...eventData,
    status: 'pending',
    created_by: currentUser.uid
  });
  
  return { id: newRef.id, ...eventData, status: 'pending', created_by: currentUser.uid };
};

export const updateEventStatus = async (
  id: string,
  status: 'pending' | 'approved'
): Promise<void> => {
  await updateDoc(doc(db, EVENTS_COL, id), { status });
};

export const updateEventData = async (
  id: string,
  eventData: Partial<Event>
): Promise<void> => {
  await updateDoc(doc(db, EVENTS_COL, id), {
    ...eventData,
    status: 'pending',
  });
};

export const deleteEvent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, EVENTS_COL, id));
};

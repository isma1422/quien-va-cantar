import {
  Event,
  SavedEvent,
  User,
  currentEvents,
  currentSavedEvents,
  currentUser,
} from './mockData';

// Delay helper to mock network requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getEvents = async (): Promise<Event[]> => {
  await delay(500);
  return currentEvents.filter((e) => e.status === 'approved');
};

export const getPendingEvents = async (): Promise<Event[]> => {
  await delay(500);
  return currentEvents.filter((e) => e.status === 'pending');
};

export const getEventById = async (id: string): Promise<Event | undefined> => {
  await delay(200);
  return currentEvents.find((e) => e.id === id);
};

export const saveEvent = async (event_id: string): Promise<void> => {
  await delay(300);
  if (!currentUser) throw new Error('Not logged in');
  if (currentSavedEvents.some((s) => s.user_id === currentUser?.uid && s.event_id === event_id)) {
    return; // Already saved
  }
  currentSavedEvents.push({
    id: `s${Date.now()}`,
    user_id: currentUser.uid,
    event_id,
  });
};

export const unsaveEvent = async (event_id: string): Promise<void> => {
  await delay(300);
  if (!currentUser) throw new Error('Not logged in');
  const index = currentSavedEvents.findIndex(
    (s) => s.user_id === currentUser?.uid && s.event_id === event_id
  );
  if (index !== -1) {
    currentSavedEvents.splice(index, 1);
  }
};

export const getSavedEvents = async (): Promise<Event[]> => {
  await delay(400);
  if (!currentUser) return [];
  const savedIds = currentSavedEvents
    .filter((s) => s.user_id === currentUser?.uid)
    .map((s) => s.event_id);
  return currentEvents.filter((e) => savedIds.includes(e.id));
};

export const createEvent = async (
  eventData: Omit<Event, 'id' | 'status' | 'created_by'>
): Promise<Event> => {
  await delay(600);
  if (!currentUser) throw new Error('Not logged in');
  const newEvent: Event = {
    ...eventData,
    id: `e${Date.now()}`,
    status: 'pending',
    created_by: currentUser.uid,
  };
  currentEvents.push(newEvent);
  return newEvent;
};

export const updateEventStatus = async (
  id: string,
  status: 'pending' | 'approved'
): Promise<Event> => {
  await delay(500);
  if (currentUser?.role !== 'admin') throw new Error('Unauthorized');
  const event = currentEvents.find((e) => e.id === id);
  if (!event) throw new Error('Not found');
  event.status = status;
  return event;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await delay(500);
  if (currentUser?.role !== 'admin') throw new Error('Unauthorized');
  const index = currentEvents.findIndex((e) => e.id === id);
  if (index !== -1) {
    currentEvents.splice(index, 1);
  }
};

// Expose current user for UI logic
export const getCurrentUser = () => currentUser;

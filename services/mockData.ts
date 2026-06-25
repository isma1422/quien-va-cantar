export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format
  place: string;
  ticket_link: string;
  status: 'pending' | 'approved';
  created_by: string; // uid
  imageUrl?: string;
}

export interface SavedEvent {
  id: string;
  user_id: string;
  event_id: string;
}

export const mockUsers: User[] = [
  { uid: 'u1', email: 'admin@quienvacantar.com', role: 'admin' },
  { uid: 'u2', email: 'user@example.com', role: 'user' },
];

export const mockEvents: Event[] = [
  {
    id: 'e1',
    title: 'Indie Rock Night',
    description: 'Local indie bands playing their best hits.',
    date: '2026-05-20T20:00:00Z',
    place: 'The Basement Club',
    ticket_link: 'https://tickets.example.com/e1',
    status: 'approved',
    created_by: 'u2',
  },
  {
    id: 'e2',
    title: 'Acoustic Sunday',
    description: 'Relaxing acoustic music in the park.',
    date: '2026-05-25T15:00:00Z',
    place: 'Central Park Amphitheater',
    ticket_link: 'contact@acousticsunday.com',
    status: 'pending',
    created_by: 'u2',
  },
];

export let mockSavedEvents: SavedEvent[] = [
  { id: 's1', user_id: 'u2', event_id: 'e1' },
];

// Mock API state to simulate DB
export let currentEvents = [...mockEvents];
export let currentSavedEvents = [...mockSavedEvents];
export let currentUser: User | null = mockUsers[1]; // default logged in as user

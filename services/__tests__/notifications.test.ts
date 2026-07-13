jest.mock('../firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'mock-user' }
  }
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  addNotification 
} from '../notifications';

describe('notifications service', () => {
  it('fetches initial mock notifications', async () => {
    const list = await getNotifications();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('title');
    expect(list[0]).toHaveProperty('body');
  });

  it('adds a new notification', async () => {
    const initialList = await getNotifications();
    const initialLength = initialList.length;

    const updatedList = await addNotification('Test Notification', 'Test Body', 'info');
    expect(updatedList.length).toBe(initialLength + 1);
    expect(updatedList[0].title).toBe('Test Notification');
    expect(updatedList[0].read).toBe(false);
  });

  it('marks a notification as read', async () => {
    const list = await getNotifications();
    const unreadId = list.find(n => !n.read)?.id;
    
    if (unreadId) {
      const updated = await markNotificationAsRead(unreadId);
      const target = updated.find(n => n.id === unreadId);
      expect(target?.read).toBe(true);
    }
  });

  it('marks all notifications as read', async () => {
    const list = await getNotifications();
    const updated = await markAllNotificationsAsRead(list);
    expect(updated.every(n => n.read)).toBe(true);
  });

  it('deletes a notification', async () => {
    const list = await getNotifications();
    const initialLength = list.length;
    const targetId = list[0].id;

    const updated = await deleteNotification(targetId);
    expect(updated.length).toBe(initialLength - 1);
    expect(updated.find(n => n.id === targetId)).toBeUndefined();
  });
});

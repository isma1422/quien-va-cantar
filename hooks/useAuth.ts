import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { getCurrentUserRole } from '@/services/api';
import { registerForPushNotificationsAsync, saveUserPushToken } from '@/services/pushNotifications';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const r = await getCurrentUserRole(u.uid);
        setRole(r);
        
        // Attempt to register and save push token in the background
        registerForPushNotificationsAsync().then(token => {
          if (token) {
            saveUserPushToken(u.uid, token);
          }
        });
      } else {
        setRole('user');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, role, loading };
}

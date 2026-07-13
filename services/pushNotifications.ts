import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Configure notification behavior for when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications do not work on web or inside simulators/emulators without custom configuration
  if (Platform.OS === 'web' || !Device.isDevice) {
    console.log('Push notifications are only supported on physical iOS/Android devices.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync() as any;
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync() as any;
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notifications!');
      return null;
    }

    // Retrieve the Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('Expo Push Token generated successfully:', tokenData.data);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return tokenData.data;
  } catch (error) {
    console.error('Error during push notification registration:', error);
    return null;
  }
}

export async function saveUserPushToken(uid: string, token: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      expoPushToken: token,
    });
    console.log('Saved push token to Firestore user document:', uid);
  } catch (error) {
    console.error('Failed to save push token to Firestore:', error);
  }
}

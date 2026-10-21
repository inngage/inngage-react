import { Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

export const ANDROID_CHANNEL_ID = 'inngage_default_channel';

const app = getApp();
export const messagingInstance = getMessaging(app);

let androidChannelCreated = false;

export const ensureAndroidChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  if (androidChannelCreated) {
    return;
  }

  try {
    await notifee.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'Inngage Notifications',
      importance: AndroidImportance.HIGH,
    });

    androidChannelCreated = true;
  } catch (error) {
    console.error('[Inngage SDK] Erro ao criar canal do Notifee:', error);
  }
};
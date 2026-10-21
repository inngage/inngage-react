import { useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setBackgroundMessageHandler,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';

type RemoteMessage = {
  messageId?: string;
  data?: Record<string, string | object>;
  notification?: { title?: string; body?: string } & Record<string, any>;
  [key: string]: any;
};

import InAppBrowser from 'react-native-inappbrowser-reborn';

import notifee, { EventType } from '@notifee/react-native';

import { InngageProperties } from '../models/inngage_properties';
import * as ApiService from '../services/api_services';

import { toStringValue } from '../utils';
import {
  ANDROID_CHANNEL_ID,
  messagingInstance,
  ensureAndroidChannel,
} from './notifications_config';

const KEY_INAPP = 'inapp';
const KEY_PENDING_REMOTE_MESSAGES = 'PENDING_REMOTE_MESSAGES_QUEUE';
const KEY_LAST_DELIVERED_MESSAGE_ID = 'LAST_DELIVERED_MESSAGE_ID';
const KEY_LAST_CLICK_HANDLED_MESSAGE_ID = 'LAST_CLICK_HANDLED_MESSAGE_ID';
const KEY_LAST_INITIAL_HANDLED_ID = 'LAST_INITIAL_HANDLED_ID';
const KEY_LAST_CALLBACK_DELIVERED_ID = 'LAST_CALLBACK_DELIVERED_ID';

let currentBlockDeepLink = false;

type ListenCallback = (data: Record<string, string>) => void;

type PendingMessage = {
  messageId?: string;
  data: Record<string, string>;
  ts: number;
};

let currentFirebaseListenCallback: ListenCallback | undefined;

let currentImageNotification: string | undefined;
let currentColorNotification: string | undefined;

let foregroundUnsubscribe: (() => void) | null = null;
let openedAppUnsubscribe: (() => void) | null = null;
let initialNotificationHandled = false;

let notifeeForegroundUnsubscribe: (() => void) | null = null;
let appStateSubscription: { remove: () => void } | null = null;

const safeJsonParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const deliverToCallbackOnce = async (
  msg: { messageId?: string; data?: Record<string, any> },
) => {
  if (!currentFirebaseListenCallback) return;

  const id = msg.messageId ?? (msg.data?.notId as string | undefined) ?? '';
  if (id) {
    const last = await AsyncStorage.getItem(KEY_LAST_CALLBACK_DELIVERED_ID);
    if (last === id) return;
    await AsyncStorage.setItem(KEY_LAST_CALLBACK_DELIVERED_ID, id);
  }

  currentFirebaseListenCallback((msg.data ?? {}) as Record<string, string>);
};

const normalizeAndroidImageResource = (res?: string): string | undefined => {
  if (!res) return undefined;

  if (res.startsWith('@drawable/')) {
    return res.replace('@drawable/', '');
  }
  if (res.startsWith('@mipmap/')) {
    return res.replace('@mipmap/', '');
  }
  return res;
};

const enqueuePendingMessage = async (
  msg: PendingMessage,
  maxItems = 20,
) => {
  try {
    const raw = await AsyncStorage.getItem(KEY_PENDING_REMOTE_MESSAGES);
    const queue = safeJsonParse<PendingMessage[]>(raw) ?? [];

    queue.push(msg);

    const trimmed =
      queue.length > maxItems ? queue.slice(queue.length - maxItems) : queue;

    await AsyncStorage.setItem(
      KEY_PENDING_REMOTE_MESSAGES,
      JSON.stringify(trimmed),
    );
  } catch (e) {
    console.error(e);
  }
};

const dequeueAllPendingMessages = async (): Promise<PendingMessage[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY_PENDING_REMOTE_MESSAGES);
    const queue = safeJsonParse<PendingMessage[]>(raw) ?? [];
    if (queue.length > 0) {
      await AsyncStorage.removeItem(KEY_PENDING_REMOTE_MESSAGES);
    }
    return queue;
  } catch (e) {
    console.error(e);
    return [];
  }
};

const flushPendingQueue = async () => {
  try {
    if (!currentFirebaseListenCallback) return;

    const queue = await dequeueAllPendingMessages();
    if (queue.length === 0) return;

    const lastDeliveredId = await AsyncStorage.getItem(KEY_LAST_DELIVERED_MESSAGE_ID);

    for (const item of queue) {
      if (item.messageId && item.messageId === lastDeliveredId) continue;

      if (item.messageId) {
        await AsyncStorage.setItem(KEY_LAST_DELIVERED_MESSAGE_ID, item.messageId);
      }

      await deliverToCallbackOnce({ messageId: item.messageId, data: item.data });
    }
  } catch (e) {
    console.error(e);
  }
};

const handleNotification = async (
  remoteMessage: RemoteMessage | any,
) => {
  const data = remoteMessage?.data ?? {};
  const notId = data?.notId;

  const request = {
    notificationRequest: {
      app_token: InngageProperties.appToken,
      id: notId,
      notId: notId,
    },
  };

  const url = data?.url;
  const type = data?.type;

  if (url) {
    if (currentBlockDeepLink) {
      if (InngageProperties.getDebugMode()) {
        console.log('[SDK] blockDeepLink ativo; ignorando abertura de url:', { url, type });
      }
    } else {
      if (type === 'inapp') {
        try {
          if (await InAppBrowser.isAvailable()) {
            await InAppBrowser.open(url, {
              dismissButtonStyle: 'close',
              preferredBarTintColor: '#453AA4',
              preferredControlTintColor: 'white',
              enableDefaultShare: true,
              enableBarCollapsing: true,
            });
          } else {
            Linking.openURL(url);
          }
        } catch (error) {
          console.error(error);
        }
      } else if (type === 'deep') {
        Linking.openURL(url).catch((err) =>
          console.error('Erro ao abrir o link:', err),
        );
      }
    }
  }

  await ApiService.sendNotification(request);
}


const handleUniqueRemoteMessage = async (
  remoteMessage: { messageId?: string } & Partial<RemoteMessage>,
) => {
  try {
    const newId = remoteMessage?.messageId;
    const lastClickId = await AsyncStorage.getItem(KEY_LAST_CLICK_HANDLED_MESSAGE_ID);

    await deliverToCallbackOnce({ messageId: remoteMessage.messageId, data: remoteMessage.data });

    if (!newId) {
      await handleNotification(remoteMessage as RemoteMessage);
      return;
    }

    if (lastClickId === newId) return;

    await AsyncStorage.setItem(KEY_LAST_CLICK_HANDLED_MESSAGE_ID, newId);

    await handleNotification(remoteMessage as RemoteMessage);
  } catch (e) {
    console.error(e);
  }
};

export const messagingHeadlessTask = () => {
  return setBackgroundMessageHandler(
    messagingInstance,
    async (remoteMessage: RemoteMessage) => {
      if (InngageProperties.getDebugMode()) {
        console.log('INNGAGE BACKGROUND AND CLOSED DATA: ', remoteMessage);
      }

      const additional = remoteMessage?.data?.additional_data;
      if (additional != null) {
        await AsyncStorage.setItem(KEY_INAPP, toStringValue(additional));
      }

      const data = (remoteMessage?.data ?? {}) as Record<string, string>;

      await enqueuePendingMessage({
        messageId: remoteMessage?.messageId,
        data,
        ts: Date.now(),
      });

      return Promise.resolve();
    },
  );
};

export const useInAppHandler = () => {
  const [showInApp, setShowInApp] = useState(false);

  useEffect(() => {
    const checkInAppData = async () => {
      const inAppData = await AsyncStorage.getItem(KEY_INAPP);
      if (inAppData) setShowInApp(true);
    };

    checkInAppData();

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') checkInAppData();
    });

    return () => subscription.remove();
  }, []);

  return { showInApp, setShowInApp };
};

export const InngageNotificationMessage = (
  firebaseListenCallback?: ListenCallback,
  imageNotification?: string,
  colorNotification?: string,
  options?: { blockDeepLink?: boolean }
) => {
  currentFirebaseListenCallback = firebaseListenCallback;
  currentImageNotification = imageNotification;
  currentColorNotification = colorNotification;
  currentBlockDeepLink = options?.blockDeepLink ?? false;

  ensureAndroidChannel().catch(() => { });

  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        flushPendingQueue().catch(() => { });
      }
    });
  }

  if (!foregroundUnsubscribe) {
    const handleMessage = async (remoteMessage: any) => {
      const notificationData = remoteMessage.data ?? {};

      if (notificationData.additional_data != null) {
        await AsyncStorage.setItem(
          KEY_INAPP,
          toStringValue(notificationData.additional_data),
        );
      }

      if (notifee) {
        const title =
          remoteMessage.notification?.title ??
          (notificationData.title as string) ??
          '';
        const body =
          remoteMessage.notification?.body ??
          (notificationData.body as string) ??
          '';

        const normalizedImage = normalizeAndroidImageResource(
          currentImageNotification,
        );
        const resolvedColor = currentColorNotification;

        await notifee.displayNotification({
          title,
          body,
          android:
            Platform.OS === 'android'
              ? {
                channelId: ANDROID_CHANNEL_ID,
                ...(normalizedImage ? { smallIcon: normalizedImage } : {}),
                ...(resolvedColor ? { color: resolvedColor } : {}),
              }
              : undefined,
          ios:
            Platform.OS === 'ios'
              ? {
                foregroundPresentationOptions: {
                  banner: true,
                  list: true,
                  sound: true,
                },
              }
              : undefined,
        });

        if (!notifeeForegroundUnsubscribe) {
          notifeeForegroundUnsubscribe = notifee.onForegroundEvent(
            ({ type, detail }) => {
              switch (type) {
                case EventType.DISMISSED:
                  if (InngageProperties.getDebugMode()) {
                    console.log(
                      'User dismissed notification',
                      detail.notification,
                    );
                  }
                  break;

                case EventType.PRESS:
                  currentFirebaseListenCallback?.(notificationData);
                  handleNotification(remoteMessage as RemoteMessage);
                  break;
              }
            },
          );
        }
      } else if (InngageProperties.getDebugMode()) {
        console.log(
          '[SDK] Notifee não instalado; mensagem em foreground: ',
          remoteMessage,
        );
      }

      if (InngageProperties.getDebugMode()) {
        console.log('Remote message received in foreground: ', remoteMessage);
      }
    };

    foregroundUnsubscribe = onMessage(messagingInstance, handleMessage);
  }

  if (!openedAppUnsubscribe) {
    openedAppUnsubscribe = onNotificationOpenedApp(
      messagingInstance,
      async (remoteMessage: any) => {
        if (!remoteMessage) return;
        await handleUniqueRemoteMessage(remoteMessage);
      },
    );
  }

  if (!initialNotificationHandled) {
    initialNotificationHandled = true;

    getInitialNotification(messagingInstance)
      .then(async (value) => {
        if (!value) return;

        const id =
          value.messageId ??
          value.data?.notId ??
          '';

        if (id) {
          const last = await AsyncStorage.getItem(KEY_LAST_INITIAL_HANDLED_ID);
          if (last === id) return;

          await AsyncStorage.setItem(KEY_LAST_INITIAL_HANDLED_ID, id as string);
        }

        await handleUniqueRemoteMessage(value);
      })
      .catch((e) => console.error(e));
  }

  return {
    unsubscribe: () => {
      foregroundUnsubscribe?.();
      openedAppUnsubscribe?.();
      notifeeForegroundUnsubscribe?.();
      appStateSubscription?.remove();

      foregroundUnsubscribe = null;
      openedAppUnsubscribe = null;
      notifeeForegroundUnsubscribe = null;
      appStateSubscription = null;

      initialNotificationHandled = false;
    },
  };
};
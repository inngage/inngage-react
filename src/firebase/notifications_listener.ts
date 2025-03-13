import { useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import messaging from '@react-native-firebase/messaging';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import PushNotification, { Importance } from 'react-native-push-notification'

import { InngageProperties } from '../models/inngage_properties';
import * as ApiService from '../services/api_services'
import { AppState, Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';

export const messagingHeadlessTask = () => {
  return messaging().setBackgroundMessageHandler(async remoteMessage => {
    if (InngageProperties.getDebugMode())
      console.log('INNGAGE BACKGROUND AND CLOSED DATA: ', remoteMessage)

    if (remoteMessage?.data?.additional_data != null) {
      await AsyncStorage.setItem('inapp', remoteMessage?.data?.additional_data);
    }

    return Promise.resolve();
  });
}

export const useInAppHandler = () => {
  const [showInApp, setShowInApp] = useState(false);

  useEffect(() => {
    const checkInAppData = async () => {
      const inAppData = await AsyncStorage.getItem('inapp');
      if (inAppData) {
        setShowInApp(true);
      }
    };

    checkInAppData();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkInAppData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { showInApp, setShowInApp };
}

export const InngageNotificationMessage = (firebaseListenCallback?: any) => {
  const [notificationMessage, setNotificationMessage] = useState(null);

  useEffect(() => {
    PushNotification.configure({
      onAction: function (data: any) {
        console.log(data)
      },
      onNotification: function (data: any) {
        if (data.foreground) {
          if (notificationMessage) {
            handleNotification(notificationMessage)
          }
        }
        data.finish(PushNotificationIOS.FetchResult.NoData);
      },
      popInitialNotification: true,
      requestPermissions: true
    })
    PushNotification.createChannel({
      channelId: 'channel_id',
      channelName: 'default',
      importance: Importance.HIGH,
      playSound: true,
      soundName: 'default',
      vibrate: true
    }, (created: any) => {
      if (created) {
        console.log('Channel created');
      }
    });
  })
  useEffect(() => {
    const handleMessage = async (remoteMessage: any) => {
      const notificationData = remoteMessage.data;

      if (notificationData.additional_data != null)
        await AsyncStorage.setItem('inapp', notificationData.additional_data);

      if (InngageProperties.getDebugMode())
        console.log('Remote message received in foreground: ', remoteMessage);

      if (firebaseListenCallback != null && remoteMessage != null)
        firebaseListenCallback(notificationData)

      setNotificationMessage(remoteMessage);

      PushNotification.localNotification({
        autoCancel: true,
        bigPictureUrl: remoteMessage.notification?.android?.imageUrl,
        largeIconUrl: remoteMessage.notification?.android?.imageUrl,
        title: notificationData?.title,
        message: notificationData?.body,
        vibration: 300,
        channelId: "channel_id",
      });
    };

    return messaging().onMessage(handleMessage);
  }, []);

  useEffect(() => {
    messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage != null)
        firebaseListenCallback(remoteMessage.data)

      handleNotification(remoteMessage)
    })
  }, []);

  useEffect(() => {
    messaging().getInitialNotification().then(async (value) => {
      if (value !== null)
        handleUniqueRemoteMessage(value);
    });
  }, [])

  const handleUniqueRemoteMessage = async (
    remoteMessage: { messageId?: string }) => {
    try {
      console.log('oi')
      const lastRemoteMessageId = await AsyncStorage.getItem('LAST_REMOTE_MESSAGE_ID');
      const newRemoteMessageId = remoteMessage?.messageId;

      if (newRemoteMessageId && lastRemoteMessageId !== newRemoteMessageId) {
        await AsyncStorage.setItem('LAST_REMOTE_MESSAGE_ID', newRemoteMessageId);
        handleNotification(remoteMessage)
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function handleNotification(remoteMessage) {
    const notId = remoteMessage.data?.notId;
    const request = {
      notificationRequest: {
        id: notId,
        app_token: InngageProperties.appToken,
      }
    };

    if (remoteMessage.data?.url) {
      if (remoteMessage.data?.type === 'inapp') {
        try {
          if (await InAppBrowser.isAvailable()) {
            await InAppBrowser.open(remoteMessage.data?.url, {
              dismissButtonStyle: 'close',
              preferredBarTintColor: '#453AA4',
              preferredControlTintColor: 'white',
              enableDefaultShare: true,
              enableBarCollapsing: true,
            });
          } else {
            Linking.openURL(remoteMessage.data?.url);
          }
        } catch (error) {
          console.error(error);
        }
      } else if (remoteMessage.data?.type === 'deep') {
        Linking.openURL(remoteMessage.data?.url).catch((err) =>
          console.error('Erro ao abrir o link:', err)
        );
      }
    }

    await ApiService.sendNotification(request);
  }
}

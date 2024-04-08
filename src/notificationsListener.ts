import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import messaging from '@react-native-firebase/messaging';
import { showAlert } from './utils'
import { notificationApi } from './services/inngage'
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification, { Importance } from 'react-native-push-notification'

export const linkInApp = (link: string) => {
  InAppBrowser.open(link, {
    dismissButtonStyle: 'cancel',
    preferredBarTintColor: 'gray',
    preferredControlTintColor: 'white',
    readerMode: false,
    showTitle: true,
    toolbarColor: '#6200EE',
    secondaryToolbarColor: 'black',
    enableUrlBarHiding: true,
    enableDefaultShare: true,
    forceCloseOnRedirection: false,
    animations: {
      startEnter: 'slide_in_right',
      startExit: 'slide_out_left',
      endEnter: 'slide_in_right',
      endExit: 'slide_out_left',
    },
  })
}

const openLinkByType = (type: string, url: string) => {
  const linkTypeHandlers: Record<string, () => void> = {
    deep: () => Linking.openURL(url),
    // inapp: () => linkInApp(url),
  };

  const handler = linkTypeHandlers[type];
  if (handler) {
    handler();
  }
};

const openCommonNotification = ({ appToken, dev, remoteMessage, enableAlert, state }) => {
  console.log("Notification Opened from", state)

  if (!remoteMessage)
    return

  const { data } = remoteMessage
  console.log("Data:", data)
  if (!data || (data && !Object.keys(data).length))
    return

  const { notId, title, body, type, url } = data
  const request = {
    notificationRequest: {
      id: notId,
      app_token: appToken,
    }
  }

  if (url) {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        supported && openLinkByType(type, url)
      }
    }).catch(console.error)
  }

  return notificationApi(request, dev)
}

const handleUniqueRemoteMessage = async (
  remoteMessage: { messageId?: string },
  handleInitialNotification: (value: { messageId?: string }) => void
) => {
  try {
    const lastRemoteMessageId = await AsyncStorage.getItem('LAST_REMOTE_MESSAGE_ID');
    const newRemoteMessageId = remoteMessage?.messageId;

    if (newRemoteMessageId && lastRemoteMessageId !== newRemoteMessageId) {
      await AsyncStorage.setItem('LAST_REMOTE_MESSAGE_ID', newRemoteMessageId);
      handleInitialNotification(remoteMessage);
    }
  } catch (e) {
    console.log(e);
  }
};

export interface notificationsListenerProps {
  appToken: string,
  dev?: boolean,
  enableAlert: boolean,
  onNotificationOpenedApp?: any,
}
export default async ({ appToken, dev, enableAlert, onNotificationOpenedApp }: notificationsListenerProps) => {
  var messageArray: any = [];

  if (typeof onNotificationOpenedApp == 'function') {
    messaging().getInitialNotification().then(async (value) => {
      onNotificationOpenedApp(value?.data);
      // console.log("Remote message ID:", value?.messageId)
      if (value !== null)
        handleUniqueRemoteMessage(value, async (value) => {
          await handleInitialNotification(value);
        });
    });
  }

  const handleBackgroundMessage = async (remoteMessage: any) => {
    console.log('Message handled in the background!', remoteMessage);
  }

  const handleNotificationOpenedApp = async (remoteMessage: any) => {
    await openCommonNotification({ appToken, dev, remoteMessage, enableAlert, state: 'Background' })
  }

  const handleInitialNotification = async (remoteMessage: any) => {
    await openCommonNotification({ appToken, dev, remoteMessage, enableAlert, state: 'Closed' })
  }

  const handleForegroundMessage = async (remoteMessage: any) => {
    try {
      PushNotification.configure({
        onNotification: function (notification) {
          console.log('LOCAL NOTIFICATION ==>', notification)

          openCommonNotification({ appToken, dev, remoteMessage, enableAlert, state: 'Foreground' })
        },
        popInitialNotification: true,
        requestPermissions: true
      })

      PushNotification.createChannel({
        channelId: 'high_importance_channel',
        channelName: 'default',
        importance: Importance.HIGH,
        playSound: true,
        soundName: 'default',
        vibrate: true
      }, (created) => console.log(`createChannel returned '${created}'`));

    } catch (e) {
      console.error(e)
    }
    try {
      PushNotification.localNotification({
        autoCancel: true,
        title: remoteMessage.data!.title,
        message: remoteMessage.data!.body,
        vibration: 300,
        channelId: "high_importance_channel"
      });

      console.log('LOCAL NOTIFICATION : ')
      console.log(remoteMessage)
    } catch (e) {
      console.error('LOCAL NOTIFICATION ERROR: ')
      console.error(e)
    }

    if (remoteMessage != null && remoteMessage.data!.additional_data) {
      let msg = JSON.parse(remoteMessage.data!.additional_data)
      if (msg.inapp_message == true) {
        const currentMessages = await AsyncStorage.getItem('inngage');
        if (currentMessages !== null) {
          messageArray = JSON.parse(currentMessages);
        }
        messageArray.push(remoteMessage);
        await AsyncStorage.setItem('inngage', JSON.stringify(messageArray));
      }
    } else if (remoteMessage != null && !remoteMessage.data!.additional_data) {
      console.log(remoteMessage.data!.title)
      if (enableAlert) {
        showAlert(remoteMessage.data!.title, remoteMessage.data!.body)
      }
    }
  }

  messaging().setBackgroundMessageHandler(handleBackgroundMessage)
  messaging().onNotificationOpenedApp(handleNotificationOpenedApp)
  messaging().getInitialNotification().then(async (remoteMessage) => {
    // console.log("Remote message ID:", remoteMessage?.messageId)
    if (remoteMessage !== null)
      handleUniqueRemoteMessage(remoteMessage, async (value) => {
        await handleInitialNotification(value);
      });
  })
  messaging().onMessage(handleForegroundMessage)
}

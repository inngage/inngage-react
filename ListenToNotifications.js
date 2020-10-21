import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import { firebase } from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info'
import { showAlert, showAlertLink } from './utils'
import { notificationApi } from './inngageApi'
import AsyncStorage from '@react-native-community/async-storage';

export const linkInApp = (link) => {
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

const openLinkByType = (type, url) => (type === 'deep' ? Linking.openURL(url) : linkInApp(url))

export const openCommonNotification = (notificationData) => {
  const { appToken, dev, remoteMessage } = notificationData
  if (!remoteMessage) {
    return
  }
  const { data } = remoteMessage
  if (!data || (data && !Object.keys(data).length)) {
    return
  }
  const { notId, title, body, type, url, picture } = data
  if (picture) {
    return openRichNotification(notificationData)
  }
  const request = {
    notificationRequest: {
      id: notId,
      app_token: appToken,
    },
  }
  if (!url) {
    return notificationApi(request, dev).then(() => showAlert(title, body)).catch(console.log)
  }
  return Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      showAlertLink(
        title,
        body,
        `${DeviceInfo.getApplicationName()}`,
        `Acessar ${url} ?`,
      ).then((response) => { supported && openLinkByType(type, url) })
    }
    notificationApi(request, dev)
  }).catch(console.log)
}
export const openRichNotification = (notificationData) => {
  //console.log("Rich push", notificationData)
  //Rich push code
}



export default async ({ appToken, dev }) => {
  var messageArray = [];

  // firebase.messaging().onNotificationOpenedApp(async (remoteMessage) => {
  //   console.log('Push received: Quiet')
  //   console.log(remoteMessage)

  //   if (remoteMessage.additional_data.inapp_message == true) {
  //     const currentMessages = await AsyncStorage.getItem('inngage');
  //     if (currentMessages !== null) {
  //       messageArray = JSON.parse(currentMessages);
  //     }
  //     messageArray.push(remoteMessage);
  //     await AsyncStorage.setItem('inngage', JSON.stringify(messageArray));
  //   }
  //   openCommonNotification({ appToken, dev, remoteMessage, state: 'Quit' })
  // })
  // firebase.messaging().getInitialNotification().then(async remoteMessage => {
  //   console.log('Push received: Background')
  //   console.log(remoteMessage)

  //   if (remoteMessage != null && remoteMessage.data.additional_data) {
  //     if (remoteMessage.data.additional_data.inapp_message == true) {
  //       const currentMessages = await AsyncStorage.getItem('inngage');
  //       if (currentMessages !== null) {
  //         messageArray = JSON.parse(currentMessages);
  //       }
  //       messageArray.push(remoteMessage);
  //       await AsyncStorage.setItem('inngage', JSON.stringify(messageArray));
  //     }
  //   }
  //   openCommonNotification({ appToken, dev, remoteMessage, state: 'Background' })
  // });

  firebase.messaging().onNotificationOpenedApp(async (remoteMessage) => {
    openCommonNotification({ appToken, dev, remoteMessage, state: 'Background' })
  });

  firebase.messaging().onMessage(async (remoteMessage) => {    console.log('Push received: Foreground')

  if (remoteMessage != null && remoteMessage.data.additional_data) {  
    let msg = JSON.parse(remoteMessage.data.additional_data)
      if (msg.inapp_message == true) {
        const currentMessages = await AsyncStorage.getItem('inngage');
        if (currentMessages !== null) {
          messageArray = JSON.parse(currentMessages);
        }
        messageArray.push(remoteMessage);
        await AsyncStorage.setItem('inngage', JSON.stringify(messageArray));
      }
    } else if (remoteMessage != null && !remoteMessage.data.additional_data) {
      console.log(remoteMessage.data.title)
        showAlert(remoteMessage.data.title, remoteMessage.data.body)
    }
    openCommonNotification({ appToken, dev, remoteMessage, state: 'foreground' })
  });

  firebase.messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Push received: Background')
    let msg = JSON.parse(remoteMessage.data.additional_data)
    if (remoteMessage != null && remoteMessage.data.additional_data) {  
      console.log('first step')
      if (msg.inapp_message == true) {
        console.log('second step')
        const currentMessages = await AsyncStorage.getItem('inngage');
        if (currentMessages !== null) {
          messageArray = JSON.parse(currentMessages);
        }
        messageArray.push(remoteMessage);
        await AsyncStorage.setItem('inngage', JSON.stringify(messageArray));
      }
    }
    openCommonNotification({ appToken, dev, remoteMessage, state: 'Background' })
  });
}

import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import { firebase } from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info'
import { showAlert, showAlertLink } from './utils'
import { notificationApi } from './inngageApi'

const linkInApp = (link) => {
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
  console.log({notificationData})
  const { appToken, dev, remoteNotification } = notificationData
    if(!remoteNotification) {
    return
  }
  const { data } = remoteNotification
  if(!data || (data && !Object.keys(data).length)) {
    return
  }
  const { notId, title, body, type, url, picture } = data
  if(picture) {
    return openRichNotification(notificationData)
  }
  const request = {
    notificationRequest: {
      id: notId,
      app_token: appToken,
    },
  }
  if(!url) {
    return notificationApi(request, dev).then(() => showAlert(title, body)).catch(console.log)
  }
  return Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      showAlertLink(
        title,
        body,
        `${DeviceInfo.getApplicationName()}`,
        `Acessar ${url} ?`,
      ).then((response) => { supported && openLinkByType(type, url)})
    }
    notificationApi(request, dev)
    return showAlert(title, body)
  }).catch(console.log)
}
export const openRichNotification = (notificationData) => {
    console.log("Rich push", notificationData)
  //Rich push code
}
export default async ({ appToken, dev }) => {
  firebase.messaging().onMessage(async (remoteNotification) => {
    // É necessário retornar o unsubscribe
    openCommonNotification({appToken, dev, remoteNotification, state: 'Foreground'})
  })
  firebase.messaging().onNotificationOpenedApp(async (remoteNotification) => {
    openCommonNotification({appToken, dev, remoteNotification, state: 'Background/Quit'})
  })
  firebase.messaging().getInitialNotification().then(remoteNotification => {
    openCommonNotification({appToken, dev, remoteNotification, state: 'Background/Quit'})
  });
}

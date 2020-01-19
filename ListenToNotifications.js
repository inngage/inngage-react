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

export default async ({ appToken, dev }) => {
  firebase.messaging().onMessage(async (notification) => {
    const { title, body, type, url, notId } = notification.data
    const urlTreated = url || 'null'
    const request = {
      notificationRequest: {
        id: notId,
        app_token: appToken,
      },
    }
    Linking.canOpenURL(urlTreated).then((supported) => {
      if (supported) {
        showAlertLink(
          title,
          body,
          `${DeviceInfo.getApplicationName()}`,
          `Can we redirect to ${url} ?`,
        ).then((response) => {
          response
            && notificationApi(request, dev)
              .then(() => openLinkByType(type, url))
              .catch(console.log)
        })
      } else {
        notificationApi(request, dev)
          .then(() => showAlert(title, body))
          .catch(console.log)
      }
    }).catch(console.log)
  })
}

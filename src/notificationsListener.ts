import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import messaging, { firebase } from '@react-native-firebase/messaging';
import { showAlert } from './utils'
import { notificationApi } from './services/inngage'
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification'

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

const openLinkByType = (type: string, url: string) => (type === 'deep' ? Linking.openURL(url) : linkInApp(url))

export const openCommonNotification = (notificationData) => {
  const { appToken, dev, remoteMessage, enableAlert, state } = notificationData
  if (!remoteMessage) {
    return
  }
  const { data } = remoteMessage
  if (!data || (data && !Object.keys(data).length)) {
    return
  }
  const { notId, title, body, type, url } = data
  const request = {
    notificationRequest: {
      id: notId,
      app_token: appToken,
    },
  }
  if (!url) {
    
    return notificationApi(request, dev).then(() => {
       
    }).catch(console.error)

  }
  return Linking.canOpenURL(url).then((supported) => {
    if (supported) {
     
        supported && openLinkByType(type, url)
      
    }
  }).catch(console.error)
}
export const openRichNotification = (notificationData) => {
}


export interface notificationsListenerProps {
  appToken: string, 
  dev?: boolean, 
  enableAlert: boolean,
  onNotificationOpenedApp?: any,
}
export default async ({ appToken, dev, enableAlert, onNotificationOpenedApp }: notificationsListenerProps) => {
  var messageArray: any = [];
  
  
  firebase.messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Push received: Background')

    const request = {
      notificationRequest: {
        id: remoteMessage.data!.notId,
        app_token: appToken,
      },
    }
    if (remoteMessage != null && remoteMessage.data!.additional_data) {
      let msg = JSON.parse(remoteMessage.data!.additional_data)
      console.log('first step')
      if (msg.inapp_message == true) {
        console.log('second step')
        const currentMessages = await AsyncStorage.getItem('inngage');
        if (currentMessages !== null) {
          messageArray = JSON.parse(currentMessages);
        }
        messageArray.push(remoteMessage);
        await AsyncStorage.setItem('inngage', JSON.stringify(messageArray));
        setTimeout(() => {
          messaging().getInitialNotification().then(notification => {
            notificationApi(request, dev)
          })
        }, 3000)
      }
    } else if (remoteMessage != null && !remoteMessage.data!.additional_data) {
      setTimeout(() => {
        messaging().getInitialNotification().then(notification => {
          if (!remoteMessage.data!.url) {
            notificationApi(request, dev) // TODO, responsible for triggering the notification api multiple times
          } else {
            notificationApi(request, dev)
            Linking.canOpenURL(remoteMessage.data!.url).then((supported) => {
              if (supported) {
               
                  supported && openLinkByType(remoteMessage.data!.type, remoteMessage.data!.url)
                
              }
            }).catch(error => console.error(error))
          }
        })
      }, 3000)
    }
  })

  firebase.messaging().onNotificationOpenedApp(async (remoteMessage) => {
    console.log("Notification Oppened")
    openCommonNotification({ appToken, dev, remoteMessage, enableAlert, state: 'Background' })
  });

  if(typeof onNotificationOpenedApp == 'function') {
    const remoteMessage = await messaging().getInitialNotification();
    onNotificationOpenedApp(remoteMessage);  
  }

  firebase.messaging().onMessage(async (remoteMessage) => {
    console.log('Push received: Foreground')

    try {
      PushNotification.configure({
        onNotification: function(notification) {
          console.log('LOCAL NOTIFICATION ==>', notification)

          openCommonNotification({ appToken, dev, remoteMessage, enableAlert, state: 'foreground' })

        },
         channelId: "high_importance_channel",
        priority: "high",
        popInitialNotification: true,
        requestPermissions: true
      })
      
    } catch (e) { 
      console.error(e)

    }
    try{
     
      PushNotification.presentLocalNotification({
        autoCancel: true,
        bigText:remoteMessage.data!.body,
        title: remoteMessage.data!.title,
        message: '',
        vibrate: true,
        vibration: 300,
        playSound: true,
        soundName: 'default',
        
      })
       console.log('LOCAL NOTIFICATION : ')
       console.log(remoteMessage)
    }catch(e){
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
  });

 
}

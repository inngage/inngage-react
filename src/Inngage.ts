import {
  Platform,
  LogBox,
  AppRegistry,
} from "react-native";

import { firebase } from '@react-native-firebase/messaging';
import DeviceInfo from "react-native-device-info";
import * as RNLocalize from "react-native-localize";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatDate, subscriptionRequestAdapter } from "./utils";
import notificationsListener, { notificationsListenerProps } from "./notificationsListener";
import { subscriptionApi, eventsApi } from "./services/inngage";

// --- handle background message ------/
const backgroundNotificationHandler = async remoteMessage => {
  var messageArray: any = [];
  console.log("Remote message:", JSON.stringify(remoteMessage));
  
  console.log('Called backgroundNotificationHandler');
  
  const currentMessages = await AsyncStorage.getItem('messages');
  if (currentMessages !== null) {
    messageArray = JSON.parse(currentMessages);
  }
  messageArray.push(remoteMessage);

  await AsyncStorage.setItem('messages', JSON.stringify(messageArray));
};

// --- Get Firebase Access ------/
const getFirebaseAccess = () => {
  let firebaseToken = 'W7SAl94Jk6l3w95W9wCgmv3zZ99V5FReNUytdgJUFUvpvZoqXf72'
  return new Promise(async (resolve) => {
    DeviceInfo.isEmulator().then(isEmulator => {
      if (isEmulator && Platform.OS === "ios") {
        return resolve(firebaseToken)
      }
    })
    try {
      await firebase.messaging().registerDeviceForRemoteMessages()
      const permission = await firebase.messaging().hasPermission()
      if (!permission) {
        try {
          await firebase.messaging().requestPermission()
        } catch (e) {
          console.error(e)
          return resolve(firebaseToken)
        }
      }
      try {
        firebaseToken = await firebase.messaging().getToken()
      } catch (error) {
        console.error(error)
        return resolve(firebaseToken)
      }
      return resolve(firebaseToken)
    } catch (err) {
      console.error(err)
      return resolve(firebaseToken)
    }
  });
};


interface SubscriptionProps {
  appToken: string,
  enableAlert: boolean,
  authKey: string,
  dev?: boolean,
  friendlyIdentifier?: string,
  customFields?: any,
  customData?: any,
  phoneNumber?: string
}

interface SendEventProps {
  newEventRequest: {
    app_token: string,
    identifier: string,
    event_name: string,
    conversion_event: boolean,
    conversion_value: number,
    conversion_notid: string,
    event_values: {
      nome_promo: string,
      categoria: string,
      foto_promo: string,
      redirect_link: string
    }
  },
  authKey: string
}
const Inngage = {
  // ------------  Register Notification Listener ------------//
  RegisterNotificationListener: async (props: notificationsListenerProps) => {

    try {
      LogBox.ignoreLogs(['registerHeadlessTask'])
    } catch (e) { }
    try {
      console.ignoredYellowBox = ['registerHeadlessTask'];
    } catch (e) { }
    try {
      AppRegistry.registerHeadlessTask('ReactNativeFirebaseMessagingHeadlessTask', () => backgroundNotificationHandler)
      notificationsListener({ ...props });
    } catch (e) {
      console.error(e);
      return { subscribed: false };
    }
  },
  Subscribe: async ({
    appToken,
    dev,
    friendlyIdentifier,
    customFields,
    customData,
    phoneNumber,
    authKey
  }: SubscriptionProps) => {
    try {
      const respToken = await getFirebaseAccess()

      const locales = RNLocalize.getLocales();

      const os_language = locales && locales.length ? locales[0].languageCode : ''
      const device_manufacturer = await DeviceInfo.getManufacturer();
      const installTime = await DeviceInfo.getFirstInstallTime();
      const lastUpdateTime = await DeviceInfo.getLastUpdateTime();
      const app_installed_in = formatDate(installTime);
      const app_updated_in = formatDate(lastUpdateTime);

      const rawRequest = {
        registerSubscriberRequest: {
          app_token: appToken,
          identifier: friendlyIdentifier,
          registration: respToken,
          phone_Number: phoneNumber,
          platform: DeviceInfo.getSystemName(),
          sdk: DeviceInfo.getBuildNumber(),
          device_model: DeviceInfo.getModel(),
          device_manufacturer,
          os_locale: RNLocalize.getCountry(),
          os_language,
          os_version: DeviceInfo.getReadableVersion(),
          app_version: DeviceInfo.getBuildNumber(),
          app_installed_in,
          app_updated_in,
          uuid: DeviceInfo.getUniqueId(),
          authKey
        }
      };

      const request = subscriptionRequestAdapter(rawRequest, customData, customFields)
      const subscribe = await subscriptionApi(request, dev);
      console.log(await subscribe.json())
      return subscribe;
    } catch (e) {
      console.error(e);
      return { subscribed: false };
    }
  },
  SendEvent: async (props: SendEventProps) => {
    const { authKey, newEventRequest } = props
    const rawRequest = {
      registerSubscriberRequest: {
        authKey
      },
      newEventRequest
    }
    const subscribe = await eventsApi(rawRequest);
    return subscribe
  }
}

export default Inngage;

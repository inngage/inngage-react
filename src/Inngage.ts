import {
  Platform,
  PermissionsAndroid,
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
const getFirebaseAccess = async (): Promise<string | null> => {
  try {
    const apiLevel = await DeviceInfo.getApiLevel();

    if (apiLevel >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }

    const authStatus = await firebase.messaging().requestPermission();

    const enabled =
      authStatus === firebase.messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === firebase.messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      console.log('Old token: ', fcmToken);

      if (!fcmToken) {
        if (!firebase.messaging().isDeviceRegisteredForRemoteMessages) {
          await firebase.messaging().registerDeviceForRemoteMessages();
        }

        const newFcmToken = await firebase.messaging().getToken();

        if (newFcmToken) {
          await AsyncStorage.setItem('fcmToken', newFcmToken);
          console.log('New token: ', newFcmToken);
          return newFcmToken;
        }
      }

      console.log('Authorization status:', authStatus);
      return fcmToken;
    }

    return null;
  } catch (error) {
    console.log('Erro no getFirebaseAccess: ', error);
    throw error;
  }
};

interface SubscriptionProps {
  appToken: string,
  enableAlert: boolean,
  dev?: boolean,
  friendlyIdentifier?: string,
  customFields?: any,
  customData?: any,
  phoneNumber?: string,
  email?: string
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
    email,
  }: SubscriptionProps) => {
    try {
      const respToken = await getFirebaseAccess()

      const locales = RNLocalize.getLocales();

      const os_locale = locales ? locales[0].countryCode : ''
      const os_language = locales && locales.length ? locales[0].languageCode : ''
      const device_manufacturer = await DeviceInfo.getManufacturer();
      const installTime = await DeviceInfo.getFirstInstallTime();
      const lastUpdateTime = await DeviceInfo.getLastUpdateTime();
      const uuid = await DeviceInfo.getUniqueId();
      const app_installed_in = formatDate(installTime);
      const app_updated_in = formatDate(lastUpdateTime);

      const rawRequest = {
        registerSubscriberRequest: {
          app_token: appToken,
          identifier: friendlyIdentifier,
          registration: respToken,
          platform: DeviceInfo.getSystemName(),
          sdk: DeviceInfo.getBuildNumber(),
          device_model: DeviceInfo.getModel(),
          device_manufacturer,
          os_locale,
          os_language,
          os_version: DeviceInfo.getReadableVersion(),
          app_version: DeviceInfo.getBuildNumber(),
          app_installed_in,
          app_updated_in,
          uuid,
          phone_Number: phoneNumber,
          email: email,
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
    try {
      return await eventsApi(props);
    } catch (e) {
      console.error(e)
      return { subscribed: false };
    }

  }
}

export default Inngage;

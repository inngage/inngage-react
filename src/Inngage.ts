import { firebase } from '@react-native-firebase/messaging';
import DeviceInfo from "react-native-device-info";
import * as RNLocalize from "react-native-localize";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { addUserDataRequest, eventRequest, formatDate, subscriptionRequestAdapter } from "./utils";
import notificationsListener, { notificationsListenerProps } from "./notificationsListener";
import { subscriptionApi, eventsApi, addUserDataApi } from "./services/inngage";
import { InngageProperties } from './models/inngage_properties';

import RNPermissions, { NotificationOption, RESULTS } from 'react-native-permissions';

// --- Get Firebase Access ------/
const getFirebaseAccess = async (): Promise<string | null> => {
  try {
    return await handleNotificationsPermission();
  } catch (error) {
    console.error('Erro no getFirebaseAccess: ', error);
    throw error;
  }
};

const handleNotificationsPermission = async () => {
  try {
    const options: NotificationOption[] = ['alert', 'badge', 'sound'];
    const apiLevel = await DeviceInfo.getApiLevel();
    const isPermissionGranted =
      apiLevel >= 33
        ? ((await RNPermissions.requestNotifications(options)).status) === RESULTS.GRANTED
        : (await firebase.messaging().requestPermission()) ===
        firebase.messaging.AuthorizationStatus.AUTHORIZED ||
        firebase.messaging.AuthorizationStatus.PROVISIONAL;

    return isPermissionGranted ? await getFirebaseToken() : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getFirebaseToken = async (): Promise<string | null> => {
  try {
    let fcmToken = await AsyncStorage.getItem('fcmToken');

    if (!fcmToken) {
      if (!firebase.messaging().isDeviceRegisteredForRemoteMessages) {
        await firebase.messaging().registerDeviceForRemoteMessages?.();
      }

      const newFcmToken = await firebase.messaging().getToken?.();

      if (newFcmToken) {
        await AsyncStorage.setItem('fcmToken', newFcmToken);
        return newFcmToken;
      }
    }
    return fcmToken || null;
  } catch (error) {
    console.error(error);
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
  appToken: string,
  eventName: string,
  identifier?: string,
  registration?: string,
  conversionEvent?: boolean,
  conversionValue?: number,
  conversionNotId?: string,
  eventValues?: any
}

const Inngage = {
  // ------------  Register Notification Listener ------------//
  RegisterNotificationListener: async (props: notificationsListenerProps) => {
    try {
      await notificationsListener({ ...props });
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
    InngageProperties.appToken = appToken;
    InngageProperties.identifier = friendlyIdentifier!;

    try {
      const respToken = await getFirebaseAccess()

      const { countryCode: osLocale, languageCode: osLanguage } = RNLocalize.getLocales()[0] || {};
      const deviceManufacturer = await DeviceInfo.getManufacturer();
      const installTime = await DeviceInfo.getFirstInstallTime();
      const lastUpdateTime = await DeviceInfo.getLastUpdateTime();
      const uuid = await DeviceInfo.getUniqueId();
      const appInstalledIn = formatDate(installTime);
      const appUpdatedIn = formatDate(lastUpdateTime);

      const rawRequest = {
        registerSubscriberRequest: {
          app_token: appToken,
          identifier: friendlyIdentifier,
          registration: respToken,
          platform: DeviceInfo.getSystemName(),
          sdk: "3.3.2",
          device_model: DeviceInfo.getModel(),
          device_manufacturer: deviceManufacturer,
          os_locale: osLanguage + "_" + osLocale,
          os_language: osLanguage + "_" + osLocale,
          os_version: DeviceInfo.getSystemVersion(),
          app_version: DeviceInfo.getReadableVersion(),
          app_installed_in: appInstalledIn,
          app_updated_in: appUpdatedIn,
          uuid,
          phone_number: phoneNumber ?? "",
          email: email ?? "",
        }
      };

      const request = subscriptionRequestAdapter(rawRequest, customData, customFields)
      const subscribe = await subscriptionApi(request, dev);
      return subscribe;
    } catch (e) {
      console.error(e);
      return { subscribed: false };
    }
  },

  SendEvent: async ({
    appToken,
    eventName,
    identifier,
    registration,
    conversionEvent,
    conversionValue,
    conversionNotId,
    eventValues,
  }: SendEventProps) => {

    const rawRequest = {
      newEventRequest: {
        app_token: appToken,
        identifier: identifier,
        registration: registration,
        event_name: eventName,
        conversion_event: conversionEvent ?? false,
        conversion_value: conversionValue ?? 0,
        conversion_notid: conversionNotId ?? '',
        event_values: eventValues ?? {}
      }
    };

    const request = eventRequest(rawRequest)
    try {
      return await eventsApi(request);
    } catch (e) {
      console.error(e)
      return { subscribed: false };
    }
  },

  async addUserData(customFields: any): Promise<any> {
    const rawRequest = {
      fieldsRequest: {
        app_token: InngageProperties.appToken,
        identifier: InngageProperties.identifier,
        custom_field: customFields ?? {}
      }
    };

    const request = addUserDataRequest(rawRequest);
    try {
      return await addUserDataApi(request);
    } catch (e) {
      console.error(e);
    }
  },

  setDebugMode(value: boolean) {
    InngageProperties.debugMode = value
  }
}

export default Inngage;

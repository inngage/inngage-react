import { Platform } from 'react-native';
import {
  getMessaging,
  getToken as getFcmTokenFromMessaging,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatDate } from './utils';
import { InngageNotificationMessage } from './firebase/notifications_listener';
import { InngageProperties } from './models/inngage_properties';

import RNPermissions, { NotificationOption, RESULTS } from 'react-native-permissions';

import ApiService from './services/api_services';

import notifee from '@notifee/react-native';

const API_LEVEL_33 = 33;

const messagingInstance = getMessaging();
// Values are stable across RNFirebase versions (FirebaseMessagingTypes.AuthorizationStatus)
const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2, EPHEMERAL: 3 } as const;
const getFirebaseAccess = async () => {
  return handleNotificationsPermission();
};

const handleNotificationsPermission = async () => {
  const options: NotificationOption[] = ['alert', 'badge', 'sound'];
  const isAndroid = Platform.OS === 'android';
  const apiLevel = Platform.OS === 'android' ? await DeviceInfo.getApiLevel() : 0;

  let permissionGranted = false;

  if (isAndroid) {
    if (apiLevel >= API_LEVEL_33) {
      const result = await RNPermissions.requestNotifications(options);
      permissionGranted = result.status === RESULTS.GRANTED;

      if (!permissionGranted) {
        console.log('[INNGAGE] Notification permission denied by user on Android (API >= 33)');
      }
    } else {
      permissionGranted = true;
    }
  } else {
    const status = await requestPermission(messagingInstance);

    permissionGranted =
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL;

    if (!permissionGranted) {
      console.log('[INNGAGE] Notification permission denied by user on iOS');
    }

    if (notifee) {
      try {
        await notifee.requestPermission();
      } catch {
        // silenciosamente ignora erro do notifee
      }
    }
  }

  // if (!permissionGranted) {
  //   return null;
  // }

  return getFirebaseToken();
};

const getFirebaseToken = async () => {
  let fcmToken = await AsyncStorage.getItem('fcmToken');

  if (fcmToken) {
    return fcmToken;
  }

  const isRegistered = isDeviceRegisteredForRemoteMessages(messagingInstance) ?? false;

  if (!isRegistered) {
    await registerDeviceForRemoteMessages(messagingInstance);
  }

  const newFcmToken = (await getFcmTokenFromMessaging(messagingInstance)) ?? null;

  if (!newFcmToken) {
    console.log('[INNGAGE] Failed to obtain FCM token');
    return null;
  }

  await AsyncStorage.setItem('fcmToken', newFcmToken);
  console.log('[INNGAGE] FCM token obtained:', newFcmToken);

  return newFcmToken;
};

interface SubscriptionProps {
  appToken: string;
  dev?: boolean;
  friendlyIdentifier?: string;
  customFields?: any;
  customData?: any;
  phoneNumber?: string;
  email?: string;
}

interface SendEventProps {
  eventName: string;
  conversionEvent?: boolean;
  conversionValue?: number;
  conversionNotId?: string;
  eventValues?: any;
}

interface AddUserDataProps {
  identifier?: string;
  customFields?: Record<string, any>;
  email?: string;
  phoneNumber?: string;
}

class Inngage {
  private static instance: Inngage;
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  static getInstance(): Inngage {
    if (!Inngage.instance) {
      Inngage.instance = new Inngage();
    }
    return Inngage.instance;
  }

  static notificationListener(
    firebaseListenCallback?: (data: Record<string, string>) => void,
    imageNotification?: string,
    colorNotification?: string,
    blockDeepLink?: boolean,
  ) {
    try {
      InngageNotificationMessage(
        firebaseListenCallback,
        imageNotification,
        colorNotification,
        { blockDeepLink },
      );
    } catch (e) {
      console.log(e);
    }
  }

  static async subscribe({
    appToken,
    friendlyIdentifier,
    customFields,
    phoneNumber,
    email,
  }: SubscriptionProps) {
    const inngage = Inngage.getInstance();

    InngageProperties.appToken = appToken;
    InngageProperties.identifier = friendlyIdentifier!;

    const respToken = await getFirebaseAccess();

    const { countryCode: osLocale, languageCode: osLanguage } = RNLocalize.getLocales()[0] || ({} as any);
    const deviceManufacturer = await DeviceInfo.getManufacturer();
    const installTime = await DeviceInfo.getFirstInstallTime();
    const lastUpdateTime = await DeviceInfo.getLastUpdateTime();
    const uuid = await DeviceInfo.getUniqueId();
    const appInstalledIn = formatDate(installTime);
    const appUpdatedIn = formatDate(lastUpdateTime);

    const subscription = {
      registerSubscriberRequest: {
        app_token: appToken,
        identifier: friendlyIdentifier ?? uuid,
        registration: respToken,
        platform: DeviceInfo.getSystemName(),
        sdk: DeviceInfo.getBuildNumber(),
        device_model: DeviceInfo.getModel(),
        device_manufacturer: deviceManufacturer,
        os_locale: osLocale,
        os_language: osLanguage,
        os_version: DeviceInfo.getReadableVersion(),
        app_version: DeviceInfo.getBuildNumber(),
        app_installed_in: appInstalledIn,
        app_updated_in: appUpdatedIn,
        uuid,
        phone_Number: phoneNumber ?? '',
        email: email ?? '',
        custom_field: customFields ?? {},
      },
    };

    return inngage.apiService.subscribe(subscription);
  }

  static async sendEvent({
    eventName,
    conversionEvent = false,
    conversionValue = 0,
    conversionNotId = '',
    eventValues,
  }: SendEventProps) {
    const inngage = Inngage.getInstance();

    const registration = await getFirebaseAccess();

    const request = {
      newEventRequest: {
        app_token: InngageProperties.appToken,
        identifier: InngageProperties.identifier,
        registration,
        event_name: eventName,
        conversion_event: conversionEvent,
        conversion_value: conversionValue,
        conversion_notid: conversionNotId,
        event_values: eventValues,
      },
    };

    return inngage.apiService.sendEvent(request);
  }

  static async addUserData({
    identifier,
    customFields,
    email,
    phoneNumber
  }: AddUserDataProps) {
    const inngage = Inngage.getInstance();

    const request = {
      fieldsRequest: {
        appToken: InngageProperties.appToken,
        identifier: identifier,
        custom_field: customFields,
        email: email,
        phone_number: phoneNumber
      },
    };

    return inngage.apiService.addUserData(request);
  }

  static setDebugMode(value: boolean) {
    InngageProperties.debugMode = value;
  }
}

export default Inngage;
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

import { compactPayload, formatDate } from './utils';
import { InngageNotificationMessage } from './firebase/notifications_listener';
import { InngageProperties } from './models/inngage_properties';
import { getOrCreateInngageUuid } from './services/identity';
import { SDK_VERSION } from './version';

import RNPermissions, { NotificationOption, RESULTS } from 'react-native-permissions';

import ApiService from './services/api_services';

import notifee from '@notifee/react-native';

const API_LEVEL_33 = 33;

const messagingInstance = getMessaging();
// Values are stable across RNFirebase versions (FirebaseMessagingTypes.AuthorizationStatus)
const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2, EPHEMERAL: 3 } as const;

interface PushAccess {
  token: string | null;
  optIn: boolean;
}

const getFirebaseAccess = async () => {
  const { token } = await getPushAccess();
  return token;
};

const getPushAccess = async (): Promise<PushAccess> => {
  const optIn = await handleNotificationsPermission();
  const token = await getFirebaseToken();
  return { token, optIn };
};

const handleNotificationsPermission = async (): Promise<boolean> => {
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

  // The device is registered even when permission is denied; `opt_in` carries the real state.
  return permissionGranted;
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

const getCachedFirebaseToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('fcmToken');
  } catch {
    return null;
  }
};

const normalizeIdentifier = (value?: string): string => (value ?? '').trim();

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

  /**
   * Registers or updates the subscriber and device on `POST /v4/subscription/`.
   * Without `friendlyIdentifier` the device is registered under a stable UUID generated
   * by the SDK (technical identifier). Rejects when the FCM token cannot be obtained:
   * `registration` is mandatory and nothing is sent in that case.
   */
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

    const { token: registration, optIn } = await getPushAccess();

    if (!registration) {
      const message =
        '[INNGAGE] subscribe aborted: FCM token unavailable. Check the Firebase configuration ' +
        '(google-services.json / GoogleService-Info.plist) and the notification permission.';
      console.error(message);
      throw new Error(message);
    }

    const { countryCode: osLocale, languageCode: osLanguage } = RNLocalize.getLocales()[0] || ({} as any);
    const deviceManufacturer = await DeviceInfo.getManufacturer();
    const installTime = await DeviceInfo.getFirstInstallTime();
    const lastUpdateTime = await DeviceInfo.getLastUpdateTime();
    const uuid = await getOrCreateInngageUuid();
    const androidId = Platform.OS === 'android' ? await DeviceInfo.getAndroidId() : undefined;
    const appInstalledIn = formatDate(installTime);
    const appUpdatedIn = formatDate(lastUpdateTime);

    const identifier = normalizeIdentifier(friendlyIdentifier) || uuid;

    const subscription = {
      registerSubscriberRequest: compactPayload({
        app_token: appToken,
        identifier,
        registration,
        platform: Platform.OS,
        sdk: SDK_VERSION,
        app_version: DeviceInfo.getVersion(),
        device_model: DeviceInfo.getModel(),
        device_manufacturer: deviceManufacturer,
        os_name: DeviceInfo.getSystemName(),
        os_version: DeviceInfo.getSystemVersion(),
        os_language: osLanguage,
        os_locale: osLocale,
        app_installed_in: appInstalledIn,
        app_updated_in: appUpdatedIn,
        uuid,
        opt_in: optIn ? '1' : '0',
        android_id: androidId,
        phone_number: phoneNumber,
        email,
        custom_field: customFields,
      }),
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

  /**
   * Updates custom fields and contact data on `POST /v4/subscription/addCustomField`
   * without session side effects. `identifier` falls back to the `friendlyIdentifier`
   * given to `subscribe`; `customFields` must be a non-empty object (API requirement).
   * The cached FCM token is sent as `registration` so an anonymous subscriber can be claimed.
   */
  static async addUserData({
    identifier,
    customFields,
    email,
    phoneNumber
  }: AddUserDataProps) {
    const inngage = Inngage.getInstance();

    const resolvedIdentifier = normalizeIdentifier(identifier) || normalizeIdentifier(InngageProperties.identifier);

    if (!resolvedIdentifier) {
      const message =
        '[INNGAGE] addUserData aborted: identifier is required. Pass `identifier` or call ' +
        'subscribe with `friendlyIdentifier` first.';
      console.error(message);
      throw new Error(message);
    }

    if (!customFields || typeof customFields !== 'object' || Object.keys(customFields).length === 0) {
      const message = '[INNGAGE] addUserData aborted: customFields must be a non-empty object.';
      console.error(message);
      throw new Error(message);
    }

    const registration = await getCachedFirebaseToken();

    const request = {
      fieldsRequest: compactPayload({
        app_token: InngageProperties.appToken,
        identifier: resolvedIdentifier,
        custom_field: customFields,
        email,
        phone_number: phoneNumber,
        registration,
      }),
    };

    return inngage.apiService.addUserData(request);
  }

  static setDebugMode(value: boolean) {
    InngageProperties.debugMode = value;
  }
}

export default Inngage;

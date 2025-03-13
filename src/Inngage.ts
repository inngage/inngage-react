import { firebase } from '@react-native-firebase/messaging';
import DeviceInfo from "react-native-device-info";
import * as RNLocalize from "react-native-localize";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatDate } from "./utils";
import { InngageNotificationMessage, messagingHeadlessTask } from "./firebase/notifications_listener";
import { InngageProperties } from './models/inngage_properties';

import RNPermissions, { NotificationOption, RESULTS } from 'react-native-permissions';

import ApiService from './services/api_services';

const API_LEVEL_33 = 33;

// --- Get Firebase Access ------/
const getFirebaseAccess = async () => {
  return await handleNotificationsPermission();
};

const handleNotificationsPermission = async () => {
  const options: NotificationOption[] = ['alert', 'badge', 'sound'];
  const apiLevel = await DeviceInfo.getApiLevel();

  const permissionGranted =
    apiLevel >= API_LEVEL_33
      ? (await RNPermissions.requestNotifications(options)).status === RESULTS.GRANTED
      : (await firebase.messaging().requestPermission()) ===
      firebase.messaging.AuthorizationStatus.AUTHORIZED ||
      firebase.messaging.AuthorizationStatus.PROVISIONAL;

  if (permissionGranted) {
    return await getFirebaseToken();
  }

  throw new Error('Notification permission not granted');
};

const getFirebaseToken = async () => {
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
};

interface SubscriptionProps {
  appToken: string,
  dev?: boolean,
  friendlyIdentifier?: string,
  customFields?: any,
  customData?: any,
  phoneNumber?: string,
  email?: string
}

interface SendEventProps {
  eventName: string,
  conversionEvent?: boolean,
  conversionValue?: number,
  conversionNotId?: string,
  eventValues?: any
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

  static notificationListener(firebaseListenCallback?: any) {
    try {
      InngageNotificationMessage(firebaseListenCallback)
    } catch (e) {
      console.log(e)
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

    const { countryCode: osLocale, languageCode: osLanguage } = RNLocalize.getLocales()[0] || {};
    const deviceManufacturer = await DeviceInfo.getManufacturer();
    const installTime = await DeviceInfo.getFirstInstallTime();
    const lastUpdateTime = await DeviceInfo.getLastUpdateTime();
    const uuid = await DeviceInfo.getUniqueId();
    const appInstalledIn = formatDate(installTime);
    const appUpdatedIn = formatDate(lastUpdateTime);

    const subscription = {
      registerSubscriberRequest: {
        app_token: appToken,
        identifier: friendlyIdentifier,
        registration: respToken,
        platform: DeviceInfo.getSystemName(),
        sdk: DeviceInfo.getBuildNumber(),
        deviceModel: DeviceInfo.getModel(),
        deviceManufacturer,
        osLocale,
        osLanguage,
        os_version: DeviceInfo.getReadableVersion(),
        app_version: DeviceInfo.getBuildNumber(),
        appInstalledIn,
        appUpdatedIn,
        uuid,
        phone_Number: phoneNumber,
        email: email,
        customFields: customFields,
      }
    }

    return inngage.apiService.subscribe(subscription);
  }

  static async sendEvent({
    eventName,
    conversionEvent = false,
    conversionValue = 0,
    conversionNotId = "",
    eventValues,
  }: SendEventProps) {
    const inngage = Inngage.getInstance();

    const registration = await getFirebaseAccess();

    const request = {
      newEventRequest: {
        appToken: InngageProperties.appToken,
        identifier: InngageProperties.identifier,
        registration,
        eventName,
        conversionEvent,
        conversionValue,
        conversionNotId,
        eventValues,
      },
    };

    return inngage.apiService.sendEvent(request);
  }

  static async addUserData(customFields: any): Promise<any> {
    const inngage = Inngage.getInstance();

    const request = {
      fieldsRequest: {
        appToken: InngageProperties.appToken,
        identifier: InngageProperties.identifier,
        customField: customFields,
      },
    };

    return inngage.apiService.addUserData(request);
  }

  static setDebugMode(value: boolean) {
    InngageProperties.debugMode = value;
  }
}

export default Inngage;
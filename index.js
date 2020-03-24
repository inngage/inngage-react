import { PermissionsAndroid, Platform } from "react-native";
import { firebase } from '@react-native-firebase/messaging';
import DeviceInfo from "react-native-device-info";
import * as RNLocalize from "react-native-localize";
import Geolocation from '@react-native-community/geolocation';
import { formatDate, subscriptionRequestAdapter } from "./utils";
import ListenToNotifications from "./ListenToNotifications";
import { subscription } from "./inngageApi";

// fetch logger
global._fetch = fetch;
global.fetch = function(uri, options, ...args) {
  return global._fetch(uri, options, ...args).then(response => {
    console.log("Fetch", { request: { uri, options, ...args }, response });
    return response;
  });
};

const getFirebaseAccess = () => {
  let firebaseToken = 'W7SAl94Jk6l3w95W9wCgmv3zZ99V5FReNUytdgJUFUvpvZoqXf72'
  return new Promise(async (resolve, reject) => {
    DeviceInfo.isEmulator().then(isEmulator => {
      if(isEmulator) {
        return resolve(firebaseToken)
      }
    })
    try {
      await firebase.messaging().registerForRemoteNotifications()
      const permission = await firebase.messaging().hasPermission()
      if(!permission) {
        try {
        await firebase.messaging().requestPermission()
        } catch (e) {
          console.log(e)
          return resolve(firebaseToken)
        }
      }
      try {
        firebaseToken = await firebase.messaging().getToken()
      } catch (error) {
        console.log(error)
        return resolve(firebaseToken)
      }
      return resolve(firebaseToken)
    } catch (err) {
      console.log(err)
      return resolve(firebaseToken)
    }
  });
};

const watch = (geofenceWatch = false) => {
  return new Promise(async resolve => {
    let granted = false
    if(Platform.OS === 'android') {
      granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Localização",
          message:
            "Permitir localização",
          buttonNeutral: "Perguntar depois",
          buttonNegative: "Não",
          buttonPositive: "Sim"
        }
      ) 
    }
    if (granted === PermissionsAndroid.RESULTS.GRANTED || Platform.OS === 'ios') {
      return Geolocation.getCurrentPosition(coords => {
        if (geofenceWatch) {
          Geolocation.watchPosition(position => {
            return resolve(position)
          }, () => resolve({}));
        }
        return resolve(coords)
      }, () => resolve({}));
    }
    return resolve({})
  });
};

const geoFence = (geofenceWatch) => {
  return watch(geofenceWatch);
};

export const GetPermission = async props => {
  try {
    ListenToNotifications(props);

    const {
      appToken,
      dev,
      friendlyIdentifier,
      customFields,
      customData,
      geofenceWatch
    } = props;
    const respToken = await getFirebaseAccess()
    const location = await geoFence(geofenceWatch)
    const { coords } = location; 

    const locales = RNLocalize.getLocales();

    const os_language = locales && locales.length ? locales[0].languageCode : ''
    const device_manufacturer = await DeviceInfo.getManufacturer();
    const installTime = await DeviceInfo.getFirstInstallTime();
    const lastUpdateTime = await DeviceInfo.getLastUpdateTime();
    const app_installed_in = formatDate(installTime);
    app_updated_in = formatDate(lastUpdateTime);

    const rawRequest = {
      registerSubscriberRequest: {
        app_token: appToken,
        identifier: friendlyIdentifier,
        registration: respToken,
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
        lat: (coords && coords.latitude) ? coords.latitude : null,
        long: (coords && coords.longitude) ? coords.longitude : null
      }
    };

    const request = subscriptionRequestAdapter(rawRequest, customData, customFields) 
    return subscription(request, dev);
  } catch (e) {
    console.error(e);

    return { subscribed: false };
  }
};

import { PermissionsAndroid } from "react-native";
import firebase from "react-native-firebase";
import DeviceInfo from "react-native-device-info";
import { formatDate } from "./utils";
import ListenToNotifications from "./ListenToNotifications";
import { subscription, geolocation } from "./inngageApi";

// fetch logger
global._fetch = fetch;
global.fetch = function(uri, options, ...args) {
  return global._fetch(uri, options, ...args).then(response => {
    console.log("Fetch", { request: { uri, options, ...args }, response });

    return response;
  });
};

const getFirebaseAccess = () => {
  return new Promise((resolve, reject) => {
    firebase
      .messaging()
      .hasPermission()
      .then(enabled => {
        if (enabled) {
          firebase
            .messaging()
            .getToken()
            .then(resolve)
            .catch(reject);
        } else {
          firebase
            .messaging()
            .requestPermission()
            .then(() => {
              firebase
                .messaging()
                .getToken()
                .then(resolve)
                .catch(reject);
            })
            .catch(reject);
        }
      });
  });
};

const watch = (appToken, dev, geofenceWatch = false) => {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(coords => {

      if (geofenceWatch) {
        navigator.geolocation.watchPosition(position => {
          const request = {
            registerGeolocationRequest: {
              uuid: DeviceInfo.getUniqueID(),
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              app_token: appToken
            }
          };

          geolocation(request, dev)
            .then(() => resolve(position))
            .catch(console.error);
        }, console.log);
      } else {
        const request = {
          registerGeolocationRequest: {
            uuid: DeviceInfo.getUniqueID(),
            lat: coords.coords.latitude,
            lon: coords.coords.longitude,
            app_token: appToken
          }
        };

        geolocation(request, dev)
          .then(() => resolve(coords))
          .catch(console.error);
      }
    }, console.log);
  });
};

const getCurrentPosition = () => {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(coords => {
      resolve(coords);
    }, console.log);
  });
};

const geoFence = (appToken, dev, geofenceWatch) => {
  return watch(appToken, dev, geofenceWatch);
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
    const [location, respToken] = await Promise.all([
      geoFence(appToken, dev, geofenceWatch),
      getFirebaseAccess()
    ]);
    const { latitude, longitude } = location.coords;

    if(!latitude && !longitude) return { subscribed: false }

    const rawRequest = {
      registerSubscriberRequest: {
        app_token: appToken,
        identifier: friendlyIdentifier,
        registration: respToken,
        platform: DeviceInfo.getSystemName(),
        sdk: DeviceInfo.getBuildNumber(),
        device_model: DeviceInfo.getModel(),
        device_manufacturer: DeviceInfo.getManufacturer(),
        os_locale: DeviceInfo.getDeviceCountry(),
        os_language: DeviceInfo.getDeviceLocale(),
        os_version: DeviceInfo.getReadableVersion(),
        app_version: DeviceInfo.getBuildNumber(),
        app_installed_in: formatDate(DeviceInfo.getFirstInstallTime()),
        app_updated_in: formatDate(DeviceInfo.getLastUpdateTime()),
        uuid: DeviceInfo.getUniqueID(),
        lat: latitude,
        long: longitude
      }
    };

    const request = customData
      ? {
          registerSubscriberRequest: {
            ...rawRequest.registerSubscriberRequest,
            custom_field: customFields
          }
        }
      : {
          registerSubscriberRequest: {
            ...rawRequest.registerSubscriberRequest
          }
        };

    return subscription(request, dev);
  } catch (e) {
    console.error(e);

    return { subscribed: false };
  }
};

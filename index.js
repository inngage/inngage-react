import messaging, { firebase } from '@react-native-firebase/messaging';
import DeviceInfo from "react-native-device-info";
import * as RNLocalize from "react-native-localize";
import Geolocation from '@react-native-community/geolocation';
import { formatDate, subscriptionRequestAdapter } from "./utils";
import ListenToNotifications from "./ListenToNotifications";
import { subscription } from "./inngageApi";
import AsyncStorage from '@react-native-community/async-storage';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import {
  PermissionsAndroid,
  Platform,
  Modal,
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  LogBox,
  AppRegistry,
  ScrollView,
  ImageBackground
} from "react-native";


//-------------- In-APP Component -------------//


const SLIDER_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = Math.round(SLIDER_WIDTH * 0.7);
const ITEM_HEIGHT = Math.round(ITEM_WIDTH * 3 / 4);

export const Inapp = (props) => {
  const [data, setData] = useState([])
  const [ind, setInd] = useState(0)
  const [visible, setVisible] = useState(true)

  pagination = () => {
    return (
      <Pagination
        dotsLength={data.length}
        activeDotIndex={ind}
        dotStyle={{
          width: 5,
          height: 5,
          borderRadius: 5,
          marginHorizontal: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.92)'
        }}
        inactiveDotStyle={{
          // Define styles for inactive dots here
        }}
        inactiveDotOpacity={0.4}
        inactiveDotScale={0.6}
      />
    );
  }

  _renderItem = ({ item, index }) => {
    console.log(item)
    return (
      <ScrollView contentContainerStyle={[props.itemStyle, styles.itemContainer]}>
        <Text style={[styles.itemTitle, props.titleStyle]}>{item.notification.title}</Text>
        <Image style={[props.mediaStyle, { width: 200, height: 200 }]} source={{ uri: 'https://cdn.jpegmini.com/user/images/slider_puffin_jpegmini.jpg' }} />
        <Text style={[styles.itemBody, props.bodyStyle]}>Corpo da mensagem</Text>
        <Text style={[styles.counter, props.counterStyle]}>
          {ind + 1} de {data.length} Mensagens
        </Text>
        {/* {pagination()} */}
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity style={{ height: 40, flex: 1, backgroundColor: 'green', alignItems: 'center', justifyContent: 'center' }}>
            <View>
              <Text>{props.leftButtonTitle}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{ height: 40, flex: 1, backgroundColor: 'red', alignItems: 'center', justifyContent: 'center' }}>
            <View>
              <Text>{props.rightButtonTitle}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const CarouselRef = useRef();

  useEffect(() => {
    onLoad();
  }, [])

  onLoad = async () => {
    let temp = []
    const messages = JSON.parse(await AsyncStorage.getItem('messages'))
    if (messages !== null) {
      messages.forEach((el, index) => {
        if (!isEmpty(el)) {
          temp.push(el)
        }
      })
      setData(messages)
    }
    console.log(data)
  }

  handleClose = async () => {
    if (props.onClose) {
      console.log('hand')
      if (props.onClose.toLowerCase() === 'clear') {
        console.log('clear')
        await AsyncStorage.removeItem('messages');
      }
    }
    setVisible(false)
  }

  if (data.length > 0) {
    return (
      <Modal
        animationType='slide'
        visible={visible}
        transparent={true}
        style={{ flex: 1 }}
      >
        <View style={[styles.styleContainer, props.styleContainer]}>
          <TouchableHighlight
            onPress={() => handleClose()}
            underlayColor='#cccccc'
            style={styles.closeButton}
          >
            <View>
              <Text style={{ fontWeight: 'bold' }}>
                X
                </Text>
            </View>
          </TouchableHighlight>
          <Carousel
            ref={CarouselRef}
            layout={'tinder'}
            layoutCardOffset={10}
            data={data}
            containerCustomStyle={styles.carouselContainer}
            inactiveSlideShift={0}
            onSnapToItem={(index) => setInd(index)}
            renderItem={_renderItem}
            sliderWidth={SLIDER_WIDTH}
            itemWidth={ITEM_WIDTH}
          />
        </View>
      </Modal>
    );
  } else {
    return null
  }
};

const styles = StyleSheet.create({
  carouselContainer: {
    width: "100%",
    marginTop: 10
  },
  styleContainer: {
    backgroundColor: 'white',
    margin: 20,
    alignItems: 'center',
    elevation: 10,
    borderRadius: 5
  },
  itemContainer: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white'
  },
  itemLabel: {
    color: 'white',
    fontSize: 24
  },
  counter: {
    alignSelf: 'center',
    marginVertical: 10
  },
  closeButton: {
    elevation: 10,
    alignSelf: 'flex-end',
    margin: 10,
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemTitle: {
    fontWeight: 'bold',
    marginBottom: 10
  }
});


Inapp.propTypes = {
  onClose: PropTypes.string,
  leftButtonTitle: PropTypes.string.isRequired,
  rightButtonTitle: PropTypes.string.isRequired,
};


function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

// fetch logger'
global._fetch = fetch;
global.fetch = function (uri, options, ...args) {
  return global._fetch(uri, options, ...args).then(response => {
    console.log("Fetch", { request: { uri, options, ...args }, response });
    return response;
  });
};

// --- handle background message ------/
const backgroundNotificationHandler = async remoteMessage => {
  var messageArray = [];
  console.log('Called')
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
  return new Promise(async (resolve, reject) => {
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

// ------------  GeoFence ------------------//
const geoFence = (geofenceWatch) => {
  return watch(geofenceWatch);
};

// ------------  Watch ------------------//
const watch = (geofenceWatch = false) => {
  return new Promise(async resolve => {
    let granted = false
    if (Platform.OS === 'android') {
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

const Inngage = {
  // ------------  Init Firebase Message Handle ------------------//
  init: () => {
    AppRegistry.registerHeadlessTask('ReactNativeFirebaseMessagingHeadlessTask', () => backgroundNotificationHandler)
    LogBox.ignoreLogs(['registerHeadlessTask'])
    var messageArray = [];

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Push received')

      const currentMessages = await AsyncStorage.getItem('messages');
      if (currentMessages !== null) {
        messageArray = JSON.parse(currentMessages);
      }
      messageArray.push(remoteMessage);
      await AsyncStorage.setItem('messages', JSON.stringify(messageArray));
    });

    messaging().onMessage(async (remoteMessage) => {
      console.log('Push received')

      const currentMessages = await AsyncStorage.getItem('messages');
      if (currentMessages !== null) {
        messageArray = JSON.parse(currentMessages);
      }
      messageArray.push(remoteMessage);
      await AsyncStorage.setItem('messages', JSON.stringify(messageArray));
    });
  },

  // ------------  Get Permission ------------------//
  GetPermission: async (props) => {
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
  },  
}


export default Inngage;

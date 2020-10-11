import { firebase } from '@react-native-firebase/messaging';
import InAppBrowser from 'react-native-inappbrowser-reborn'
import DeviceInfo from "react-native-device-info";
import * as RNLocalize from "react-native-localize";
import { formatDate, subscriptionRequestAdapter, showAlertLink } from "./utils";
import ListenToNotifications, { linkInApp } from "./ListenToNotifications";
import { subscription,notificationApi } from "./inngageApi";
import AsyncStorage from '@react-native-community/async-storage';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import React, { useState, useEffect, useRef } from 'react';
import {
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
  ImageBackground,
  Linking
} from "react-native";


//-------------- In-APP Component -------------//


const SLIDER_WIDTH = Dimensions.get('window').width;
const SLIDER_HEIGHT = Dimensions.get('window').height;
const ITEM_WIDTH = Math.round(SLIDER_WIDTH * 0.8);
const ITEM_HEIGHT = Math.round(SLIDER_HEIGHT * 0.8);

export const Inapp = (props) => {
  const [data, setData] = useState([])
  const [ind, setInd] = useState(0)
  const [visible, setVisible] = useState(true)
  const [bgImage, setbgImage] = useState(undefined)

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
    let msg = JSON.parse(item.data.additional_data)
    let arrayImgs = []

    const handleButton = (title,body,url,type) => {
      if (type === '' || url ==='') {
        return
      }
      console.log(title,body,url,type)
      const openLinkByType = (type, url) => (type === 'deep' ? Linking.openURL(url) : linkInApp(url))
      
      return Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          showAlertLink(
            title,
            body,
            `${DeviceInfo.getApplicationName()}`,
            `Acessar ${url} ?`,
          ).then((response) => { supported && openLinkByType(type, url) })
        }
      }).catch(console.log)
    }

    const imgCarosel = () => {
      if (msg.rich_content.carousel == true) {
        if (msg.rich_content.img1 != '') {
          arrayImgs.push({ url: msg.rich_content.img1 })
        }
        if (msg.rich_content.img2 != '') {
          arrayImgs.push({ url: msg.rich_content.img2 })
        }
        if (msg.rich_content.img3 != '') {
          arrayImgs.push({ url: msg.rich_content.img3 })
        }
        let arrayElements = arrayImgs.map((item,index )=> (
          <Image key={index.toString()} style={[props.mediaStyle, { width: 200, height: 200, marginBottom: 10 }]} source={{ uri: item.url }} />
        ));
        return arrayElements
      } else if (arrayImgs.length <= 0) {
        return (
          <Image style={[props.mediaStyle, { width: 200, height: 200 }]} source={{ uri: item.data.picture }} />
        )
      }
      else {
        return (
          <Image style={[props.mediaStyle, { width: 200, height: 200 }]} source={{ uri: item.data.picture }} />
        )
      }
    }
    const checkBG = () => {
      if (msg.background_img != '') {
        return null
      } else {
        return msg.background_color
      }
    }
    const itemStyles = StyleSheet.create({
      btn_left: {
        backgroundColor: msg.btn_left_bg_color,
        height: 40,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
      },
      btn_right: {
        backgroundColor: msg.btn_right_bg_color,
        height: 40,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
      },
      btn_left_title: {
        color: msg.btn_left_txt_color
      },
      btn_right_title: {
        color: msg.btn_right_txt_color
      },
      body: {
        backgroundColor: checkBG(),
        width: '100%',
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
      },
      bodyText: {
        color: msg.body_font_color,
        textAlign: 'justify',
        marginTop: 10,
        fontSize: 15,
      },
      title: {
        color: msg.title_font_color,
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 10
      }
    });
    return (
      <View style={[itemStyles.body]}>
        <Text style={[itemStyles.title, props.titleStyle]}>{msg.title}</Text>
        <ScrollView style={{ height: 200 }}>
          {imgCarosel()}
        </ScrollView>
        <Text style={[itemStyles.bodyText, props.bodyStyle]}>{msg.body}</Text>
        <Text style={[styles.counter, props.counterStyle]}>
          {ind + 1} de {data.length} Mensagens
            </Text>
        {/* {pagination()} */}
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <TouchableOpacity onPress={()=> handleButton(msg.title, msg.body,msg.btn_left_action_link,msg.btn_left_action_type)} style={[itemStyles.btn_left, props.buttonTitleRightStyle]}>
            <View>
              <Text style={[itemStyles.btn_left_title, props.buttonTitleLeftStyle]}>{msg.btn_left_txt}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=> handleButton(msg.title, msg.body,msg.btn_right_action_link,msg.btn_right_action_type)} style={[itemStyles.btn_right, props.button_right]}>
            <View>
              <Text style={[itemStyles.btn_right_title, props.buttonTitleRightStyle]}>{msg.btn_right_txt}</Text>
            </View>
          </TouchableOpacity>
        </View>

      </View>
    );
  }

  const CarouselRef = useRef();

  useEffect(() => {
    onLoad();
  }, [])

  onLoad = async () => {
    let temp = []
    const messages = JSON.parse(await AsyncStorage.getItem('inngage'))
    if (messages !== null) {
      messages.forEach((el, index) => {
        if (!isEmpty(el)) {
          temp.push(el)
        }
      })
      let msg = JSON.parse(temp[0].data.additional_data)
      if (msg.background_img != '') {
        setbgImage({ uri: msg.background_img })
      } else {
        setbgImage(undefined)
      }
      setData(temp)
    }
  }

  handleClose = async () => {
    if (props.onClose) {
      if (props.onClose.toLowerCase() === 'clear') {
        await AsyncStorage.removeItem('inngage');
      }
    }
    setVisible(false)
  }

  handleBg = index => {
    let msg = JSON.parse(data[index].data.additional_data)
    if (msg.background_img != '') {
      setbgImage({ uri: msg.background_img })
    } else {
      setbgImage(undefined)
    }
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
          <ImageBackground style={{ widht: '100%', alignItems: 'center' }} imageStyle={{borderRadius:10}} source={bgImage}>
            <TouchableHighlight
              onPress={() => handleClose()}
              underlayColor='#cccccc'
              style={styles.closeButton}
            >
              <Text style={{ fontWeight: 'bold' }}>
                X
            </Text>
            </TouchableHighlight>
            <Carousel
              style={{ alignSelf: 'stretch' }}
              ref={CarouselRef}
              layout={'default'}
              layoutCardOffset={10}
              data={data}
              inactiveSlideOpacity={0}
              containerCustomStyle={styles.carouselContainer}
              inactiveSlideShift={0}
              onSnapToItem={(index) => {
                setInd(index);
                handleBg(index)
              }}
              renderItem={_renderItem}
              sliderWidth={SLIDER_WIDTH}
              itemWidth={ITEM_WIDTH}
            />
          </ImageBackground>
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
    marginTop: 10,
  },
  styleContainer: {
    backgroundColor: 'white',
    elevation: 10,
    borderRadius: 10,
    margin: 20
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
    alignItems: 'center',
    zIndex: 9999
  },
});


// Inapp.propTypes = {
//   onClose: PropTypes.string,
//   leftButtonTitle: PropTypes.string.isRequired,
//   rightButtonTitle: PropTypes.string.isRequired,
// };


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


const Inngage = {
  // ------------  Get Permission ------------------//
  GetPermission: async (props) => {
    try {
      AppRegistry.registerHeadlessTask('ReactNativeFirebaseMessagingHeadlessTask', () => backgroundNotificationHandler)
      LogBox.ignoreLogs(['registerHeadlessTask'])
      ListenToNotifications(props);

      const {
        appToken,
        dev,
        friendlyIdentifier,
        customFields,
        customData,
      } = props;
      const respToken = await getFirebaseAccess()

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

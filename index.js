import { firebase } from '@react-native-firebase/messaging';
import InAppBrowser from 'react-native-inappbrowser-reborn'
import DeviceInfo from "react-native-device-info";
import * as RNLocalize from "react-native-localize";
import { formatDate, subscriptionRequestAdapter, showAlertLink } from "./utils";
import ListenToNotifications, { linkInApp } from "./ListenToNotifications";
import { subscription, notificationApi } from "./inngageApi";
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
  const [indIm, setIndImg] = useState(0)
  const [visible, setVisible] = useState(true)
  const [modalImage, setModalImage] = useState(false)
  const [bgImage, setbgImage] = useState(undefined)

  const CarouselRef = useRef(null);
  const ScrollRef1 = useRef(null);
  const ScrollRef2 = useRef(null);
  const ScrollRef3 = useRef(null);


  _renderItem = ({ item, index }) => {
    let msg = JSON.parse(item.data.additional_data)
    let arrayImgs = []
    let indImg = 0

    const checkBG = () => {
      if (msg.background_img != '') {
        return null
      } else {
        return msg.background_color
      }
    }

    const itemStyles = StyleSheet.create({
      btn_left: {
        backgroundColor: msg.btn_left_bg_color || "#FFFFFF",
        height: 40,
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
        marginLeft: 10,
        flex: 1
      },
      btn_right: {
        backgroundColor: msg.btn_right_bg_color || "#FFFFFF",
        height: 40,
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        flex: 1
      },
      btn_left_title: {
        color: msg.btn_left_txt_color || "#000000"
      },
      btn_right_title: {
        color: msg.btn_right_txt_color || "#000000"
      },
      body: {
        backgroundColor: checkBG(),
        width: '100%',
        height: 450,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
      },
      bodyText: {
        color: msg.body_font_color || "#000000",
        textAlign: 'justify',
        marginBottom: 10,
        fontSize: 15,
        marginHorizontal: 10
      },
      title: {
        color: msg.title_font_color || "#000000",
        fontWeight: "bold",
        fontSize: 18,
        marginTop: 40
      },
      dot: {
        backgroundColor: msg.dot_color || "#FFFFFF",
        borderRadius: 100,
        width: 8,
        height: 8,
        marginLeft: 5,
        elevation: 5,
      }
    });

    chooseRef = () => {
      if (index == 0) {
        return ScrollRef1
      }
      if (index == 1) {
        return ScrollRef2
      }
      if (index == 2) {
        return ScrollRef3
      }
    }


    pagination = ref => {
      return (
        <Pagination
          dotsLength={arrayImgs.length}
          activeDotIndex={indIm}
          containerStyle={{ height: 2, padding: 0, margin: 0 }}
          renderDots={(activeIndex, total, context) => {
            let dots = []
            var size = 0
            for (let i = 0; i < total; i++) {
              if (activeIndex == i) {
                size = 13
              } else {
                size = 8
              }
              dots.push(
                <TouchableOpacity
                  onPress={() => {
                    ref.current.scrollTo({ x: i * 220, y: 0, animated: true })
                    if (i * 220 === 0) {
                      setIndImg(0)
                    } else if (i * 220 === 220) {
                      setIndImg(1)
                    } else if (i * 220 === 440) {
                      setIndImg(2)
                    }
                  }}
                  key={i.toString()}
                  style={[itemStyles.dot, {width: size, height: size}]}
                />
              )
            }
            return (
              dots
            )
          }
          }
        />
      );
    }

    const handleButton = (title, body, url, type) => {
      if (type === '' || url === '') {
        return
      }
      console.log(title, body, url, type)
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
        let arrayElements = arrayImgs.map((item, index) => (
          <Image key={index.toString()} style={[props.mediaStyle, { width: 200, height: 200, marginRight: 10 }]} source={{ uri: item.url }} />
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
    return (
      <View style={[itemStyles.body]}>
        <Text style={[itemStyles.title, props.titleStyle]}>{msg.title}</Text>
        <ScrollView
          ref={chooseRef()}
          horizontal
          snapToInterval={220}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          style={{ width: 200, height: 240 }}
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
          onMomentumScrollEnd={(e) => {
            if (Math.round(e.nativeEvent.contentOffset.x) === 0
            ) {
              indImg = 0
              setIndImg(indImg)
            }
            if (Math.round(e.nativeEvent.contentOffset.x) === 220
            ) {
              indImg = 1
              setIndImg(indImg)
            }
            if (Math.round(e.nativeEvent.contentOffset.x) === 430
            ) {
              indImg = 2
              setIndImg(indImg)
            }
          }}
        >
          {imgCarosel()}
        </ScrollView>
        {
          msg.rich_content.carousel == true ?
            pagination(chooseRef()) : null

        }
        <Text style={[itemStyles.bodyText, props.bodyStyle]}>{msg.body}</Text>
        {/* <Text style={[styles.counter, props.counterStyle]}>
          {ind + 1} de {data.length} Mensagens
        </Text> */}
        <View style={{ flexDirection: "row", marginBottom: 0, justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => handleButton(msg.title, msg.body, msg.btn_left_action_link, msg.btn_left_action_type)} style={[itemStyles.btn_left, props.buttonLeftStyle]}>
            <View>
              <Text style={[itemStyles.btn_left_title, props.buttonTitleLeftStyle]}>{msg.btn_left_txt}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleButton(msg.title, msg.body, msg.btn_right_action_link, msg.btn_right_action_type)} style={[itemStyles.btn_right, props.buttonRightStyle]}>
            <View>
              <Text style={[itemStyles.btn_right_title, props.buttonTitleRightStyle]}>{msg.btn_right_txt}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Modal
          animationType='slide'
          visible={visible}
          transparent={true}
          style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'blue' }}
        ><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={[styles.styleContainer, props.styleContainer]}>
              <ImageBackground style={{ widht: '100%', alignItems: 'center', justifyContent: 'center' }} resizeMode='cover' imageStyle={{ borderRadius: 10, alignSelf: 'stretch', height: 480 }} source={bgImage}>
                <TouchableHighlight
                  onPress={() => handleClose()}
                  underlayColor='#cccccc'
                  style={styles.closeButton}
                >
                  <Text style={{ fontWeight: 'bold', color:'#ffffff' }}>
                    X
                  </Text>
                </TouchableHighlight>
                <Carousel
                  vertical
                  ref={CarouselRef}
                  layout={'default'}
                  layoutCardOffset={10}
                  data={data}
                  inactiveSlideOpacity={0}
                  containerCustomStyle={styles.carouselContainer}
                  contentContainerCustomStyle={{ justifyContent: 'center' }}
                  inactiveSlideShift={0}
                  onSnapToItem={(index) => {
                    setInd(index);
                    handleBg(index)
                  }}
                  renderItem={(item, index) => _renderItem(item, index, CarouselRef)}
                  sliderHeight={500}
                  itemHeight={500}
                />
              </ImageBackground>
            </View>
          </View>
        </Modal>
      </View>
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
    width: SLIDER_WIDTH * 0.8,
    height: 480,
  },
  counter: {
    alignSelf: 'center',
    marginVertical: 10
  },
  closeButton: {
    position: 'absolute',
    alignSelf: 'flex-end',
    right: 20,
    top: 20,
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#00000020',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex:90,
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
// global._fetch = fetch;
// global.fetch = function (uri, options, ...args) {
//   return global._fetch(uri, options, ...args).then(response => {
//     console.log("Fetch", { request: { uri, options, ...args }, response });
//     return response;
//   });
// };

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
    try{
      LogBox.ignoreLogs(['registerHeadlessTask'])
    } catch(e){}
    try{
      console.ignoredYellowBox = ['registerHeadlessTask'];
    } catch(e){}
    try {
      AppRegistry.registerHeadlessTask('ReactNativeFirebaseMessagingHeadlessTask', () => backgroundNotificationHandler)
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

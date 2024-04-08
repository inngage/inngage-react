import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
  Linking,
  Dimensions,
} from "react-native";
import DeviceInfo from "react-native-device-info";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Carousel, { Pagination } from 'react-native-snap-carousel';

import { showAlertLink, isEmpty } from "../utils";
import { linkInApp } from "../notificationsListener";
import { styleInapp, styleItem } from './styles';

const SLIDER_WIDTH = Dimensions.get('window').width;
const SLIDER_HEIGHT = Dimensions.get('window').height;
const ITEM_WIDTH = Math.round(SLIDER_WIDTH * 0.8);
const ITEM_HEIGHT = Math.round(SLIDER_HEIGHT * 0.8);

export interface InappProps {
  mediaStyle?: any;
  titleStyle?: any;
  bodyStyle?: any;
  buttonLeftStyle?: any;
  buttonRightStyle?: any;
  buttonTitleLeftStyle?: any;
  buttonTitleRightStyle?: any;
  styleContainer?: any;
  onClose?: 'clear';
}
export const Inapp = (props: InappProps) => {
  const [data, setData] = useState<any>([])
  const [indIm, setIndImg] = useState(0)
  const [visible, setVisible] = useState(true)
  const [bgImage, setbgImage] = useState<any>(undefined) // TODO, need a placeholder

  const CarouselRef = useRef<Carousel<any>>(null);
  const ScrollRef1 = useRef<ScrollView>(null);
  const ScrollRef2 = useRef<ScrollView>(null);
  const ScrollRef3 = useRef<ScrollView>(null);


  interface _renderItemProps {
    item: any;
    index: number;
  }
  const _renderItem = ({ item, index }: _renderItemProps) => {
    let msg = JSON.parse(item.data.additional_data)
    let arrayImgs: any = []
    let indImg = 0

    const checkBG = () => {
      if (msg.background_img != '') {
        return null
      } else {
        return msg.background_color
      }
    }

    const itemStyles = styleItem({ msg, checkBG })

    const chooseRef = () => {
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


    const pagination = ref => {
      return (
        <Pagination
          dotsLength={arrayImgs.length}
          activeDotIndex={indIm}
          containerStyle={{ height: 2, padding: 0, margin: 0 }}
          renderDots={(activeIndex, total, context) => {
            let dots: any = []
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
                  style={[itemStyles.dot, { width: size, height: size }]}
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

    const handleButton = (title: string, body: string, url: string, type: string) => {
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
          ).then(() => { supported && openLinkByType(type, url) })
        }
      }).catch(console.error)
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

  const onLoad = async () => {
    let temp: any = []
    const messages = JSON.parse(await AsyncStorage.getItem('inngage') ?? '[]')

    console.log("Messages saved on AsyncStorage: ", JSON.stringify(messages))

    if (messages !== null) {
      messages.forEach((el) => {
        if (!isEmpty(el)) {
          temp.push(el)
        }
      })

      let msg: any = {}
      if (temp.length > 0 && temp[0]?.data?.additional_data) {
        msg = JSON.parse(temp[0].data.additional_data)
      }

      if (msg.background_img != '') {
        setbgImage({ uri: msg.background_img })
      } else {
        setbgImage(undefined)
      }
      setData(temp)
    }
  }

  const handleClose = async () => {
    if (props.onClose) {
      if (props.onClose.toLowerCase() === 'clear') {
        await AsyncStorage.removeItem('inngage');
      }
    }
    setVisible(false)
  }

  const handleBg = index => {
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
              <ImageBackground style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }} resizeMode='cover' imageStyle={{ borderRadius: 10, alignSelf: 'stretch', height: 480 }} source={bgImage}>
                <TouchableHighlight
                  onPress={() => handleClose()}
                  underlayColor='#cccccc'
                  style={styles.closeButton}
                >
                  <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>
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
                  containerCustomStyle={{
                    backgroundColor: 'white',
                    elevation: 10,
                    borderRadius: 10,
                    width: SLIDER_WIDTH * 0.8,
                    height: 480,
                  }}
                  contentContainerCustomStyle={{ justifyContent: 'center' }}
                  inactiveSlideShift={0}
                  onSnapToItem={(index) => {
                    handleBg(index)
                  }}
                  renderItem={({ item, index }) => _renderItem({ item, index })}
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

const styles = styleInapp({ SLIDER_WIDTH })
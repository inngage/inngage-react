import * as React from "react";
import {
    StyleSheet,
    Image,
    View,
    Text,
    TouchableOpacity,
    ImageBackground,
    Dimensions,
    Linking,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Carousel from 'react-native-snap-carousel';

import { buildStyles } from "./styles";
import { Modal } from "../components/modal";
import { InngageProperties } from "../models/inngage_properties";

import InAppBrowser from 'react-native-inappbrowser-reborn';

interface InAppData {
    inapp_message: boolean
    title: string
    body: string
    title_font_color: string
    body_font_color: string
    background_color: string
    btn_left_txt_color: string
    btn_left_bg_color: string
    btn_right_txt_color: string
    btn_right_bg_color: string
    background_image: string
    btn_left_txt: string
    btn_left_action_type: string
    btn_left_action_link: string
    btn_right_txt: string
    btn_right_action_type: string
    btn_right_action_link: string
    rich_content: string
    inpression: string
    bg_img_action_type: string
    bg_img_action_link: string
    dot_color: string
}

interface InAppRichContent {
    carousel: boolean
    img1: string
    img2: string
    img3: string
    img4: string
    img5: string
}

interface InAppProps {
    onDismiss: () => void;
}

export function InApp({ onDismiss }: InAppProps): JSX.Element {
    const { width: screenWidth } = Dimensions.get('window');

    const sliderWidth = screenWidth;
    const itemWidth = screenWidth * 0.9;

    const [data, setData] = React.useState<InAppData>();
    const [richContent, setRichContent] = React.useState<InAppRichContent>();
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        const fetchAdditionalData = async () => {
            try {
                console.log('in app message')
                const data = await AsyncStorage.getItem('inapp');
                console.log(data)
                if (data) {
                    const parsedData = JSON.parse(data);
                    const richContentData = parsedData.rich_content;

                    setVisible(true);
                    setData(parsedData);
                    setRichContent(richContentData);
                }
            } catch (error) {
                console.error('Error retrieving additionalData from AsyncStorage:', error);
            }
        };

        fetchAdditionalData();
    }, []);

    const styles = buildStyles(data, screenWidth * 0.9);

    const handleDismissInApp = async () => {
        await AsyncStorage.removeItem('inapp');
        setVisible(false);
        onDismiss();
    }

    const handleClick = async (link, type) => {
        if (type === 'inapp') {
            try {
                if (await InAppBrowser.isAvailable()) {
                    await InAppBrowser.open(link, {
                        dismissButtonStyle: 'close',
                        preferredBarTintColor: '#453AA4',
                        preferredControlTintColor: 'white',
                        enableDefaultShare: true,
                        enableBarCollapsing: true,
                    });
                } else {
                    Linking.openURL(link);
                }
            } catch (error) {
                console.error(error);
            }
        } else if (type === 'deep') {
            Linking.openURL(link).catch((err) =>
                console.error('Erro ao abrir o link:', err)
            );
        }
    };

    const imageUrls: string[] = [
        richContent?.img1 ?? '',
        richContent?.img2 ?? '',
        richContent?.img3 ?? '',
        richContent?.img4 ?? '',
        richContent?.img5 ?? ''
    ];

    const stylesCarousel = StyleSheet.create({
        itemContainer: {
            justifyContent: 'center',
            height: 250
        },
        itemImg: {
            height: 250,
        },
    });

    const _renderItem = ({ item, index }) => {
        return (
            <View style={stylesCarousel.itemContainer}>
                <Image style={[stylesCarousel.itemImg]} source={{ uri: item }} />
            </View>
        )
    }

    if (InngageProperties.getDebugMode() && data != null) {
        console.log('INNGAGE - Data In App:', data)
        console.log('INNGAGE - Data Rich Content:', richContent)
    }

    return (
        <Modal
            onBackdropPress={handleDismissInApp}
            renderToHardwareTextureAndroid={true}
            transparent={true}
            visible={visible}>
            <ImageBackground style={styles.content} source={{ uri: data?.background_image }}>
                {richContent?.carousel ? <Carousel
                    layout={"default"}
                    data={imageUrls}
                    sliderWidth={sliderWidth}
                    itemWidth={itemWidth}
                    renderItem={_renderItem} /> : null}
                <TouchableOpacity style={styles.closeButton} onPress={handleDismissInApp}>
                    <Text style={styles.textButton}>X</Text>
                </TouchableOpacity>
                <View style={styles.messageData}>
                    <Text style={styles.title}>{data?.title}</Text>
                    <Text style={styles.body}>{data?.body}</Text>
                </View>
                <View style={styles.footer}>
                    {data?.btn_left_txt != null ?
                        <TouchableOpacity
                            style={styles.buttonLeft}
                            onPress={() => handleClick(data?.btn_left_action_link, data?.btn_left_action_type)}>
                            <Text style={styles.textButtonLeft}>{data?.btn_left_txt}</Text>
                        </TouchableOpacity> : null}
                    {data?.btn_right_txt != null ?
                        <TouchableOpacity
                            style={styles.buttonRight}
                            onPress={() => handleClick(data?.btn_right_action_link, data?.btn_right_action_type)}>
                            <Text style={styles.textButtonRight}>{data?.btn_right_txt}</Text>
                        </TouchableOpacity> : null}
                </View>
            </ImageBackground>
        </Modal>
    )
}
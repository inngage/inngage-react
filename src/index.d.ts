import React from 'react';
import { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';

interface notificationsListenerProps {
    appToken: string;
    dev?: boolean;
    enableAlert: boolean;
    onNotificationOpenedApp?: any;
}

interface SubscriptionProps {
    appToken: string;
    enableAlert: boolean;
    dev?: boolean;
    friendlyIdentifier?: string;
    customFields?: any;
    customData?: any;
    phoneNumber?: string;
    email?: string;
}

interface SendEventProps {
    appToken: string;
    eventName: string;
    identifier?: string;
    registration?: string;
    conversionEvent?: boolean;
    conversionValue?: number;
    conversionNotId?: string;
    eventValues?: any;
}

declare const Inngage: {
    RegisterNotificationListener: (props: notificationsListenerProps) => Promise<any>;
    Subscribe: (props: SubscriptionProps) => Promise<any>;
    SendEvent: (props: SendEventProps) => Promise<any>;
};

interface InappProps {
    mediaStyle?: StyleProp<ImageStyle>;
    titleStyle?: StyleProp<TextStyle>;
    bodyStyle?: StyleProp<TextStyle>;
    buttonLeftStyle?: StyleProp<ViewStyle>;
    buttonRightStyle?: StyleProp<ViewStyle>;
    buttonTitleLeftStyle?: StyleProp<TextStyle>;
    buttonTitleRightStyle?: StyleProp<TextStyle>;
    styleContainer?: StyleProp<ViewStyle>;
    onClose?: 'clear';
}

export const Inapp: React.FC<InappProps>;

export default Inngage;

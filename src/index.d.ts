interface notificationsListenerProps {
    appToken: string,
    dev?: boolean,
    enableAlert: boolean,
    onNotificationOpenedApp?: any,
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
    appToken: string,
    identifier: string,
    eventName: string,
    conversionEvent?: boolean,
    conversionValue?: number,
    conversionNotId?: string,
    eventValues?: any
}

declare const Inngage: {
    RegisterNotificationListener: (props: notificationsListenerProps) => Promise<any>;
    Subscribe: (props: SubscriptionProps) => Promise<any>;
    SendEvent: (props: SendEventProps) => Promise<any>;
};

export default Inngage;
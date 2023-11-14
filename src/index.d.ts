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
    newEventRequest: {
        app_token: string;
        identifier: string;
        event_name: string;
        conversion_event: boolean;
        conversion_value: number;
        conversion_notid: string;
        event_values: {
            nome_promo: string;
            categoria: string;
            foto_promo: string;
            redirect_link: string;
        };
    };
}

declare const Inngage: {
    RegisterNotificationListener: (props: notificationsListenerProps) => Promise<any>;
    Subscribe: (props: SubscriptionProps) => Promise<any>;
    SendEvent: (props: SendEventProps) => Promise<any>;
};

export default Inngage;
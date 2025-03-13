export const SUBSCRIBE_REQUEST = {
    registerSubscriberRequest: {
        appToken: '',
        identifier: '',
        registration: '',
        platform: '',
        sdk: '',
        deviceModel: '',
        deviceManufacturer: '',
        osLocale: '',
        osLanguage: '',
        osVersion: '',
        appVersion: '',
        appInstalledIn: '',
        appUpdatedIn: '',
        uuid: '',
        phoneNumber: '',
        email: '',
        customFields: {},
    },
};

export const EVENT_REQUEST = {
    newEventRequest: {
        appToken: '',
        identifier: '',
        registration: '',
        eventName: '',
        conversionEvent: false,
        conversionValue: 0,
        conversionNotId: '',
        eventValues: {},
    },
};

export const USER_DATA_REQUEST = {
    fieldsRequest: {
        appToken: '',
        identifier: '',
        customField: {},
    },
};
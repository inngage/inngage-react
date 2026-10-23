import { fetchClient } from './handler'

// Each path carries its own API version: subscription endpoints use v4,
// notification and events remain on v1 until their v4 contracts are documented.
const apiEndpoints = {
    subscription: '/v4/subscription/',
    notification: '/v1/notification/',
    events: '/v1/events/newEvent/',
    addUserData: '/v4/subscription/addCustomField',
};

const makeApiCall = (method: string, request: any, endpoint: string) => {
    return fetchClient(method, request, endpoint);
};

export const subscriptionApi = (request: any) => {
    return makeApiCall('POST', request, apiEndpoints.subscription);
};

export const notificationApi = (request: any) => {
    return makeApiCall('POST', request, apiEndpoints.notification);
};

export const eventsApi = (request: any) => {
    return makeApiCall('POST', request, apiEndpoints.events);
};

export const addUserDataApi = (request: any) => {
    return makeApiCall('POST', request, apiEndpoints.addUserData);
};

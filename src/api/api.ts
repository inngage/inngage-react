import { fetchClient } from './handler'

const apiEndpoints = {
    subscription: '/subscription/',
    notification: '/notification/',
    events: '/events/newEvent/',
    addUserData: '/subscription/addCustomField',
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

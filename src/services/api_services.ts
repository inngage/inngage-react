import { InngageProperties } from '../models/inngage_properties';
import { subscriptionApi, notificationApi, eventsApi, addUserDataApi } from '../api/api';

class ApiService {
    async subscribe(request: any) {
        if (InngageProperties.getDebugMode())
            console.log('INNGAGE PAYLOAD SUBSCRIPTION: ', request)
        return subscriptionApi(request);
    }

    async sendEvent(request: any, dev = false) {
        if (InngageProperties.getDebugMode())
            console.log('INNGAGE PAYLOAD EVENT: ', request)
        return eventsApi(request);
    }

    async addUserData(request: any, dev = false) {
        if (InngageProperties.getDebugMode())
            console.log('INNGAGE PAYLOAD ADDUSERDATA: ', request)
        return addUserDataApi(request);
    }
}

export async function sendNotification(request: any, dev = false) {
    if (InngageProperties.getDebugMode())
        console.log('INNGAGE PAYLOAD NOTIFICATION: ', request)
    return notificationApi(request);
}

export default ApiService;
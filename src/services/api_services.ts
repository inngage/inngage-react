import { InngageProperties } from '../models/inngage_properties';
import { subscriptionApi, notificationApi, eventsApi, addUserDataApi } from '../api/api';

const logResponse = async (label: string, response: Response) => {
    if (!InngageProperties.getDebugMode()) return;
    try {
        const body = await response.clone().json();
        console.log(`INNGAGE RESPONSE ${label}: ${response.status}`, body);
    } catch {
        console.log(`INNGAGE RESPONSE ${label}: ${response.status}`);
    }
};

class ApiService {
    async subscribe(request: any) {
        if (InngageProperties.getDebugMode())
            console.log('INNGAGE PAYLOAD SUBSCRIPTION: ', request)
        const response = await subscriptionApi(request);
        await logResponse('SUBSCRIPTION', response);
        return response;
    }

    async sendEvent(request: any, dev = false) {
        if (InngageProperties.getDebugMode())
            console.log('INNGAGE PAYLOAD EVENT: ', request)
        return eventsApi(request);
    }

    async addUserData(request: any, dev = false) {
        if (InngageProperties.getDebugMode())
            console.log('INNGAGE PAYLOAD ADDUSERDATA: ', request)
        const response = await addUserDataApi(request);
        await logResponse('ADDUSERDATA', response);
        return response;
    }
}

export async function sendNotification(request: any, dev = false) {
    if (InngageProperties.getDebugMode())
        console.log('INNGAGE PAYLOAD NOTIFICATION: ', request)
    return notificationApi(request);
}

export default ApiService;

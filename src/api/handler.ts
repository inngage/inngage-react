const baseUrlHook = {
    [false as any]: 'https://api.inngage.com.br/v1',
    [undefined as any]: 'https://api.inngage.com.br/v1',
    [null as any]: 'https://api.inngage.com.br/v1',
    [true as any]: 'https://apid.inngage.com.br/v1',
}

const requestConfigFactory = (method, request) => {

    let header: any = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    }
    try {
        if (request?.registerSubscriberRequest?.authKey) {
            header = {
                ...header,
                Authorization: request.registerSubscriberRequest.authKey
            }
        }
    } catch (e) {
        console.error(e)
    }
    let objToSend = {
        method,
        body: JSON.stringify(request),
        headers: header
    }

    return objToSend
}

export const fetchClient = async (
    method: string,
    requestBody: any,
    path: string,
    isDev = false
): Promise<Response> => {
    try {
        const url: URL = new URL(`${baseUrlHook[isDev as any]}${path}`);
        const request: RequestInit = requestConfigFactory(method, requestBody);
        const response: Response = await fetch(url, request);

        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }

        return response;
    } catch (error: any) {
        console.error('Fetch Error:', error.message);
        throw error;
    }
};

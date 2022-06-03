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
  try{
    if (request?.registerSubscriberRequest?.authKey) {
      header = {
        ...header,
        Authorization: request.registerSubscriberRequest.authKey
      }
    }
 }catch(e){
   console.error(e)
 }
  let objToSend = {
    method,
    body: JSON.stringify(request),
    headers: header
  }

  return objToSend
}

export const fetchClient = (method, requestBody, path, isDev = false): Promise<Response> => {
  return new Promise((resolve) => {
    const url = String(baseUrlHook[isDev as any]).concat(path)
    const request = requestConfigFactory(method, requestBody)
    console.log(request)
    fetch(url, request)
      .then(resolve)
      .catch(err => console.error('Fetch Error', err))
  })
}

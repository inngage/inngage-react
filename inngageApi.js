import { fetchClient } from './utils'

export const subscription = (request, dev = false) => fetchClient('POST', request, '/subscription/', !!dev)
export const geolocation = (request, dev = false) => fetchClient('POST', request, '/geolocation/', !!dev)
export const notificationApi = (request, dev = false) => fetchClient('POST', request, '/notification/', !!dev)

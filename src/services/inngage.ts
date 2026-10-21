import { InngageProperties } from '../models/inngage_properties'
import { fetchClient } from './handler'

export const subscriptionApi = (request, dev = false) => {
  if (InngageProperties.getDebugMode())
    console.log('subscriptionApi', request)
  return fetchClient('POST', request, '/subscription/', !!dev)
}
export const notificationApi = (request, dev = false) => {
  if (InngageProperties.getDebugMode())
    console.log('notificationApi', request)
  return fetchClient('POST', request, '/notification/', !!dev)
}
export const eventsApi = (request, dev = false) => {
  if (InngageProperties.getDebugMode())
    console.log('eventsApi', request)
  return fetchClient('POST', request, '/events/newEvent/', !!dev)
}
export const addUserDataApi = (request, dev = false) => {
  if (InngageProperties.getDebugMode())
    console.log('addUserData', request)
  return fetchClient('POST', request, '/subscription/addCustomField', !!dev)
}

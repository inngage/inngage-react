import { Alert } from 'react-native'

export const formatDate = (timestamp) => {
  if (!timestamp) {
    return null
  }
  return new Date(timestamp).toISOString()
}

export const showAlert = (title: string, body: string) => {
  Alert.alert(title, body, [{ text: 'OK', onPress: () => console.log('OK Pressed') }], {
    cancelable: false,
  })
}

export const showAlertLink = (title: string, body: string, appName: string, link: string) => {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      `${body}\n\n${link}`,
      [{ text: 'NO', onPress: () => resolve(false) }, { text: 'OK', onPress: () => resolve(true) }],
      { cancelable: false },
    )
  })
}

export const subscriptionRequestAdapter = (sdkRequest, useCustomData, customData) => {
  if (useCustomData) {
    return {
      registerSubscriberRequest: {
        ...sdkRequest.registerSubscriberRequest,
        custom_field: customData
      }
    }
  }
  return {
    registerSubscriberRequest: {
      ...sdkRequest.registerSubscriberRequest
    }
  };
}

export const eventRequest = (request) => {
  return { ...request }
}

export const isEmpty = (obj: any) => {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

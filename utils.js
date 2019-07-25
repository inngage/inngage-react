import { Alert } from 'react-native'

const baseUrlHook = {
  [false]: 'https://api.inngage.com.br/v1',
  [undefined]: 'https://api.inngage.com.br/v1',
  [null]: 'https://api.inngage.com.br/v1',
  [true]: 'https://apid.inngage.com.br/v1',
}

const requestConfigFactory = (method, request) => ({
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  method,
  body: JSON.stringify(request),
})

export const fetchClient = (method, requestBody, path, isDev = false) => {
  return new Promise((resolve) => {
    const url = String(baseUrlHook[isDev]).concat(path)
    const request = requestConfigFactory(method, requestBody)

    fetch(url, request)
      .then(resolve)
      .catch(err => console.log('Fetch Error', err))
  })
}

export const formatDate = (timestamp) => {
  return new Date(timestamp).toISOString()
}

export const showAlert = (title, body) => {
  Alert.alert(title, body, [{ text: 'OK', onPress: () => console.log('OK Pressed') }], {
    cancelable: false,
  })
}

export const showAlertLink = (title, body, appName, link) => {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      `${body}\n\n${link}`,
      [{ text: 'NO', onPress: () => resolve(false) }, { text: 'OK', onPress: () => resolve(true) }],
      { cancelable: false },
    )
  })
}

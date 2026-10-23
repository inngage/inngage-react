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

export const isEmpty = (obj: any) => {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

export const toStringValue = (v: unknown): string =>
  typeof v === 'string' ? v : JSON.stringify(v ?? '');

const isEmptyValue = (v: unknown): boolean => {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (typeof v === 'object' && !Array.isArray(v)) return Object.keys(v as object).length === 0;
  return false;
};

/**
 * Removes keys whose value is undefined, null, empty/blank string or empty object.
 * The Inngage v4 API treats such values as absent and asks SDKs to omit the key.
 */
export const compactPayload = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (!isEmptyValue(value)) {
      out[key] = value;
    }
  }
  return out as Partial<T>;
};

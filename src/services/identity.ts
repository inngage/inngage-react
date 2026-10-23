import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const INNGAGE_UUID_KEY = 'inngageUuid';

let inMemoryUuid: string | null = null;

/**
 * Returns a stable per-installation UUID used as the technical `identifier`
 * when the app has no logged-in user. Generated once and persisted in
 * AsyncStorage (`inngageUuid`); falls back to an in-memory value if storage fails.
 */
export const getOrCreateInngageUuid = async (): Promise<string> => {
  if (inMemoryUuid) {
    return inMemoryUuid;
  }

  try {
    const stored = await AsyncStorage.getItem(INNGAGE_UUID_KEY);
    if (stored) {
      inMemoryUuid = stored;
      return stored;
    }
  } catch (e) {
    console.log('[INNGAGE] Failed to read inngageUuid from storage:', e);
  }

  const generated = String(uuid.v4());
  inMemoryUuid = generated;

  try {
    await AsyncStorage.setItem(INNGAGE_UUID_KEY, generated);
  } catch (e) {
    console.log('[INNGAGE] Failed to persist inngageUuid; using in-memory value:', e);
  }

  return generated;
};

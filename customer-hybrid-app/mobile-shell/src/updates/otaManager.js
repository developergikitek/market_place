import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

/**
 * Checks for OTA updates in the background or on app launch.
 * In development builds or Expo Go, Updates.checkForUpdateAsync() is disabled.
 */
export async function checkForOtaUpdates(silent = true) {
  if (__DEV__) {
    console.log('[OTA Updates] Running in __DEV__ mode. OTA updates are active in release/standalone builds.');
    return { status: 'DEV_MODE' };
  }

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      console.log('[OTA Updates] New update found! Downloading in background...');
      await Updates.fetchUpdateAsync();

      if (silent) {
        console.log('[OTA Updates] Update ready. Will apply on next restart.');
      } else {
        Alert.alert(
          '🚀 Update Downloaded',
          'A new version has been downloaded over-the-air. Restart app now to apply?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart Now',
              onPress: async () => {
                await Updates.reloadAsync();
              }
            }
          ]
        );
      }
      return { status: 'UPDATE_DOWNLOADED' };
    } else {
      console.log('[OTA Updates] App is already on the latest bundle.');
      return { status: 'UP_TO_DATE' };
    }
  } catch (error) {
    console.warn('[OTA Updates] Error checking for OTA updates:', error.message);
    return { status: 'ERROR', error: error.message };
  }
}

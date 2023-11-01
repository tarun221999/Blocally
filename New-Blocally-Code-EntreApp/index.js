/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import { name as appName } from './app.json';
import rootStack from './app/config/Routes';
import BackgroundMessage from './app/fcm/BackgroundMessages';
import messaging from '@react-native-firebase/messaging';
import { constants } from './app/config/Constants';

if (Platform.OS === constants.ANDROID) {
    messaging().setBackgroundMessageHandler(BackgroundMessage)
}
AppRegistry.registerComponent(appName, () => rootStack);

/**
 * @format
 */

import {AppRegistry} from 'react-native';
import rootStack from './app/config/routes'
import {name as appName} from './app.json';
import BackgroundMessage from './app/fcm/BackgroundMessages';
import  messaging  from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(BackgroundMessage)
AppRegistry.registerComponent(appName, () => rootStack);
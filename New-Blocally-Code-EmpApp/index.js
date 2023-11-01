/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import rootStack from './app/config/Routes'

AppRegistry.registerComponent(appName, () => rootStack);

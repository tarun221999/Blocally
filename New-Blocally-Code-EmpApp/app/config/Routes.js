import React, { Component, Image } from 'react'
import { createAppContainer } from 'react-navigation'
import { createStackNavigator, StackViewTransitionConfigs } from 'react-navigation-stack'
import { createBottomTabNavigator } from 'react-navigation-tabs'
import TabBarComponent from '../components/TabBarComponent'
import ImageComponent from '../components/ImageComponent'
import SplashScreen from '../screens/SplashScreen'
import LoginScreen from '../screens/LoginScreen'
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'
import SignUpScreen from '../screens/SignUpScreen'
import EnterOtpScreen from '../screens/EnterOtpScreen'
import strings from '../config/Strings'
import colors from '../config/Colors'
import ResetPasswordScreen from '../screens/ResetPasswordScreen'
import { screenNames, fontNames, sizes, constants } from '../config/Constants'
import EmployeeHomeScreen from '../screens/employee/EmployeeHomeScreen'
import QRScanScreen from '../screens/employee/QRScanScreen'
import SyncDataScreen from '../screens/employee/SyncDataScreen'
import EmployeeProfileScreen from '../screens/employee/EmployeeProfileScreen'
import ChangePassword from '../screens/ChangePassword'
import EmployeeSettingsScreen from '../screens/employee/EmployeeSettingsScreen'
import NavigationService from './NavigationService'
import TabIconWithBadge from '../components/TabIconWithBadge'
import { Platform } from 'react-native'

/**
 * Routes for the Application
 */

const employeeTabNavigator = createBottomTabNavigator(
    {
        EMP_HOME_SCREEN: {
            screen: EmployeeHomeScreen,
        },
        SYNC_DATA: {
            screen: SyncDataScreen,
        },
        EMPLOYEE_PROFILE_SCREEN: {
            screen: EmployeeProfileScreen,
        },
        EMPLOYEE_SETTINGS_SCREEN: {
            screen: EmployeeSettingsScreen,
        },
    },
    {
        defaultNavigationOptions: ({ navigation }) => {
            const { routeName } = navigation.state;
            let tabBarLabel = ""

            if (routeName === screenNames.EMP_HOME_SCREEN) {
                tabBarLabel = strings.scan_qr
            } else if (routeName === screenNames.SYNC_DATA) {
                tabBarLabel = strings.sync_data
            } else if (routeName === screenNames.EMPLOYEE_PROFILE_SCREEN) {
                tabBarLabel = strings.profile
            } else if (routeName === screenNames.EMPLOYEE_SETTINGS_SCREEN) {
                tabBarLabel = strings.settings
            }

            return {
                tabBarIcon: ({ focused, horizontal, tintColor }) => {
                    let iconName;
                    if (routeName === screenNames.EMP_HOME_SCREEN) {
                        iconName = focused ? require('../assets/scanQrSelected.png') : require('../assets/scanQr.png')
                    } else if (routeName === screenNames.SYNC_DATA) {
                        iconName = focused ? require('../assets/syncDataSelected.png') : require('../assets/syncData.png')
                    } else if (routeName === screenNames.EMPLOYEE_PROFILE_SCREEN) {
                        iconName = focused ? require('../assets/profileTabSelected.png') : require('../assets/profileTab.png')
                    } else if (routeName === screenNames.EMPLOYEE_SETTINGS_SCREEN) {
                        iconName = focused ? require('../assets/settingsSelected.png') : require('../assets/settings.png')
                    }
                    return <ImageComponent source={iconName} />
                },
                tabBarLabel,
            }
        },
        tabBarOptions: {
            activeTintColor: colors.primaryColor,
            inactiveTintColor: colors.tabGreyTextColor,
            showLabel: true,
            labelStyle: {
                fontSize: sizes.tabTextSize,
                fontFamily: fontNames.regularFont,
            },
            style: {
                backgroundColor: colors.white,
                paddingVertical: 5
            },
            safeAreaInset:{
                top: 10,
                right: Platform.OS === constants.ANDROID ? 5 : 0,
                bottom: Platform.OS === constants.ANDROID ? 5 : 20,
                left: 10,
            }
        },
        tabBarComponent: props => <TabBarComponent {...props} />,
    }
);

const rootStack = createStackNavigator(
    {
        SPLASH_SCREEN: {
            screen: SplashScreen,
            navigationOptions: {
                header: null,
            }
        },
        LOGIN_SCREEN: {
            screen: LoginScreen,
            navigationOptions: {
                header: null,
            }
        },
        FORGOT_PASSWORD_SCREEN: {
            screen: ForgotPasswordScreen,
            navigationOptions: {
                header: null,
            }
        },
        SIGN_UP_SCREEN: {
            screen: SignUpScreen,
            navigationOptions: {
                header: null,
            }
        },
        ENTER_OTP_SCREEN: {
            screen: EnterOtpScreen,
            navigationOptions: {
                header: null,
            }
        },
        RESET_PASSWORD_SCREEN: {
            screen: ResetPasswordScreen,
            navigationOptions: {
                header: null,
            }
        },
        // Employee related screens
        EMPLOYEE_HOME_SCREEN: {
            screen: employeeTabNavigator,
            navigationOptions: {
                header: null,
            }
        },
        QR_SCAN_SCREEN: {
            screen: QRScanScreen,
            navigationOptions: {
                header: null,
            }
        },
        CHANGE_PASSWORD_SCREEN: {
            screen: ChangePassword,
            navigationOptions: {
                header: null,
            }
        },
    },
    {
        transitionConfig: () => StackViewTransitionConfigs.SlideFromRightIOS
    }
)

const AppContainer = createAppContainer(rootStack);

export default class App extends React.Component {
    render() {
        return (
            <AppContainer
                ref={navigatorRef => {
                    NavigationService.setTopLevelNavigator(navigatorRef);
                }}
            />
        );
    }
}
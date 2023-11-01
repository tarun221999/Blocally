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
import HomeScreen from '../screens/HomeScreen'
import PurchaseScreen from '../screens/PurchaseScreen'
import MyAreaScreen from '../screens/MyAreaScreen'
import MessengerScreen from '../screens/MessengerScreen'
import PurchaseListingScreen from '../screens/PurchaseListingScreen'
import PurchaseDetailScreen from '../screens/PurchaseDetailScreen'
import AppointmentScreen from '../screens/AppointmentScreen'
import HotDealDetailScreen from '../screens/HotDealDetailScreen'
import MessengerChatScreen from '../screens/MessengerChatScreen'
import ProfileScreen from '../screens/ProfileScreen'
import EnterOtpScreen from '../screens/EnterOtpScreen'
import MenuScreen from '../screens/MenuScreen'
import strings from '../config/Strings'
import colors from '../config/Colors'
import ResetPasswordScreen from '../screens/ResetPasswordScreen'
import { screenNames, fontNames, sizes, constants } from '../config/Constants'
import EmployeeHomeScreen from '../screens/employee/EmployeeHomeScreen'
import QRScanScreen from '../screens/employee/QRScanScreen'
import SyncDataScreen from '../screens/employee/SyncDataScreen'
import EmployeeProfileScreen from '../screens/employee/EmployeeProfileScreen'
import ChangePassword from '../screens/ChangePassword'
import HolidaysScreen from '../screens/HolidaysScreen'
import ViewAllDealsScreen from '../screens/ViewAllDealsScreen'
import WebViewScreen from '../screens/WebViewScreen'
import EmployeeSettingsScreen from '../screens/employee/EmployeeSettingsScreen'
import NavigationService from './NavigationService'
import NotificationsScreen from '../screens/NotificationsScreen'
import TabIconWithBadge from '../components/TabIconWithBadge'
import AddHolidayScreen from '../screens/AddHolidayScreen'
import ViewAllMenuImagesScreen from '../screens/ViewAllMenuImagesScreen';
import WebViewForPDFScreen from '../screens/WebViewForPDFScreen';
import { PermissionsAndroid, Platform } from 'react-native'

/**
 * Routes for the Application
 */

const entrepreneurTabNavigator = createBottomTabNavigator(
    {
        MEIN_REGENSBURG: {
            screen: HomeScreen,
        },
        APPOINTMENT: {
            screen: AppointmentScreen,
        },
        MESSENGER: {
            screen: MessengerScreen,
        },
        MY_AREA: {
            screen: MyAreaScreen,
        },
    },
    {
        defaultNavigationOptions: ({ navigation }) => {
            const { routeName } = navigation.state;
            let tabBarLabel = ""

            if (routeName === screenNames.MEIN_REGENSBURG) {
                tabBarLabel = strings.mein_promotions
            } else if (routeName === screenNames.APPOINTMENT) {
                tabBarLabel = strings.appointments
            } else if (routeName === screenNames.MESSENGER) {
                tabBarLabel = strings.messenger
            } else if (routeName === screenNames.MY_AREA) {
                tabBarLabel = strings.my_area
            }

            return {
                tabBarIcon: ({ focused, horizontal, tintColor }) => {
                    let badgeCount = 0;
                    if (navigation.state.params) {
                        let params = navigation.state.params;
                        if (params.badgeCount) {
                            badgeCount = params.badgeCount;
                        }
                    }
                    let iconName;
                    if (routeName === screenNames.MEIN_REGENSBURG) {
                        iconName = focused ? require('../assets/home_selected.png') : require('../assets/home.png')
                    }
                    else if (routeName === screenNames.APPOINTMENT) {
                        iconName = focused ? require('../assets/appointmentSelected.png') : require('../assets/appointmentsUnSelected.png')
                    }
                    else if (routeName === screenNames.MESSENGER) {
                        iconName = focused ? require('../assets/messenger_selected.png') : require('../assets/messenger.png')
                    } else if (routeName === screenNames.MY_AREA) {
                        iconName = focused ? require('../assets/my_area_selected.png') : require('../assets/my_area.png')
                    }
                    return <TabIconWithBadge iconName={iconName} badgeCount={badgeCount} />
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

const employeeTabNavigator = createBottomTabNavigator(
    {
        EMP_HOME_SCREEN: {
            screen: EmployeeHomeScreen,
            navigationOptions: {
                tabBarLabel: strings.scan_qr
            }
        },
        SYNC_DATA: {
            screen: SyncDataScreen,
            navigationOptions: {
                tabBarLabel: strings.sync_data
            }
        },
        EMPLOYEE_PROFILE_SCREEN: {
            screen: EmployeeProfileScreen,
            navigationOptions: {
                tabBarLabel: strings.profile
            }
        },
        EMPLOYEE_SETTINGS_SCREEN: {
            screen: EmployeeSettingsScreen,
            navigationOptions: {
                tabBarLabel: strings.settings
            }
        },
    },
    {
        defaultNavigationOptions: ({ navigation }) => ({
            tabBarIcon: ({ focused, horizontal, tintColor }) => {
                const { routeName } = navigation.state;
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
        }),
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
        HOME_SCREEN: {
            screen: entrepreneurTabNavigator,
            navigationOptions: {
                header: null,
            }
        },
        PURCHASE_LISTING_SCREEN: {
            screen: PurchaseListingScreen,
            navigationOptions: {
                header: null,
            }
        },
        PURCHASE_DETAIL_SCREEN: {
            screen: PurchaseDetailScreen,
            navigationOptions: {
                header: null,
            }
        },
        HOT_DEAL_DETAIL_SCREEN: {
            screen: HotDealDetailScreen,
            navigationOptions: {
                header: null,
            }
        },
        PROFILE_SCREEN: {
            screen: ProfileScreen,
            navigationOptions: {
                header: null,
            }
        },
        MESSENGER_CHAT_SCREEN: {
            screen: MessengerChatScreen,
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
        MENU_SCREEN: {
            screen: MenuScreen,
            navigationOptions: {
                header: null,
            }
        },
        WEB_VIEW_SCREEN: {
            screen: WebViewScreen,
            navigationOptions: {
                header: null,
            }
        },
        NOTIFICATIONS_SCREEN: {
            screen: NotificationsScreen,
            navigationOptions: {
                header: null,
            }
        },
        ADD_HOLIDAY_SCREEN: {
            screen: AddHolidayScreen,
            navigationOptions: {
                header: null,
            }
        },
        VIEW_ALL_MENU_IMAGES_SCREEN: {
            screen: ViewAllMenuImagesScreen,
            navigationOptions: {
                header: null,
            }
        },
        WEB_VIEW_FOR_PDF_SCREEN: {
            screen: WebViewForPDFScreen,
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
        HOLIDAYS_SCREEN: {
            screen: HolidaysScreen,
            navigationOptions: {
                header: null,
            }
        },
        VIEW_ALL_DEALS_SCREEN: {
            screen: ViewAllDealsScreen,
            navigationOptions: {
                header: null,
            }
        }
    },
    {
        transitionConfig: () => StackViewTransitionConfigs.SlideFromRightIOS
    }
)

const AppContainer = createAppContainer(rootStack);

export default class App extends React.Component {
    requestNotificationPermission = async () => {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATION
          )
        } catch (err) {
          if (__DEV__) console.warn('requestNotificationPermission error: ', err)
         }
    }
    componentDidMount(){
        this.requestNotificationPermission()
    }
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
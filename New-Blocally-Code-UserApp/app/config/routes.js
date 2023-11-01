import React, { Component } from 'react'
import { createAppContainer } from 'react-navigation'
import { createStackNavigator, StackViewTransitionConfigs } from 'react-navigation-stack'
import { createBottomTabNavigator } from 'react-navigation-tabs'
import NavigationService from './NavigationService';
import ImageComponent from '../components/ImageComponent'
import TabBarComponent from '../components/TabBarComponent'
import SplashScreen from '../screens/SplashScreen'
import ChooseTypeOfUser from '../screens/ChooseTypeOfUser'
import LoginScreen from '../screens/LoginScreen'
import SignUpScreen from '../screens/user/SignUpScreen'
import SocialSignUpScreen from '../screens/user/SocialSignUpScreen'
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'
import EnterOTPScreen from '../screens/EnterOTPScreen'
import ResetPasswordScreen from '../screens/ResetPasswordScreen'
import UserHomeScreen from '../screens/user/UserHomeScreen'
import UserBookScreen from '../screens/user/UserBookScreen'
import UserFavoritesScreen from '../screens/user/UserFavoritesScreen'
import UserMyAreaScreen from '../screens/user/UserMyAreaScreen'
import UserProfileScreen from '../screens/user/UserProfileScreen'
import ViewAllScreen from '../screens/user/ViewAllScreen'
import SubCategoriesScreen from '../screens/user/SubCategoriesScreen'
import HotDealDetailScreen from '../screens/user/HotDealDetailScreen'
import ActionEventDetailScreen from '../screens/user/ActionEventDetailScreen'
import MenuScreen from '../screens/user/MenuScreen'
import BookFilterCategoriesScreen from '../screens/user/BookFilterCategoriesScreen'
import UserSettingsScreen from '../screens/user/UserSettingsScreen'
import ChangePassword from '../screens/user/ChangePassword'
import EntrepreneurDetailScreen from '../screens/user/EntrepreneurDetailScreen'
import MyHotDealsScreen from '../screens/user/MyHotDealsScreen'
import MyHotDealDetailScreen from '../screens/user/MyHotDealDetailScreen'
import MyHotDealRedeemScreen from '../screens/user/MyHotDealRedeemScreen'
import MessengerScreen from '../screens/user/MessengerScreen'
import MessageScreen from '../screens/user/MessageScreen'
import MyAppointmentsScreen from '../screens/user/MyAppointmentsScreen'
import WebViewScreen from '../screens/user/WebViewScreen'
import EnterQRCodeScreen from '../screens/user/EnterQRCodeScreen'
import QRScanScreen from '../screens/user/QRScanScreen'
import AddAppointmentScreen from '../screens/user/AddAppointmentScreen'

import EntrepreneurSignUpScreen from '../screens/entrepreneur/EntrepreneurSignUpScreen'
import strings from '../config/strings'
import colors from '../config/colors'
import { screenNames, fontNames, sizes, constants } from '../config/constants'
import ShowQRCodeScreen from '../screens/user/ShowQRCodeScreen';
import ChooseTimeScreen from '../screens/user/ChooseTimeScreen';
import ContactUsScreen from '../screens/user/ContactUsScreen';
import TabIconWithBadge from '../components/TabIconWithBadge';
import NotificationsScreen from '../screens/user/NotificationsScreen';
import ChoosePredefinedSlotScreen from '../screens/user/ChoosePredefinedSlotScreen';
import FullImageScreen from '../screens/user/FullImageScreen';
import ViewAllMenuImagesScreen from '../screens/user/ViewAllMenuImagesScreen';
import PDFViewerScreen from '../screens/user/PDFViewerScreen';
import WebViewForPDFScreen from '../screens/user/WebViewForPDFScreen';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Routes for the Application
 */
const userTabNavigator = createBottomTabNavigator(
    {
        MEIN_REGENSBURG: {
            screen: ViewAllScreen,
        },
        LOCATIONS: {
            screen: UserBookScreen,
        },
        FAVORITES: {
            screen: UserFavoritesScreen,
        },
        MY_AREA: {
            screen: UserMyAreaScreen,
        },
    },
    {
        defaultNavigationOptions: ({ navigation }) => {
            const { routeName } = navigation.state;
            let tabBarLabel = ""
            if (routeName === screenNames.MEIN_REGENSBURG) {
                tabBarLabel = strings.mein_regensburg
            } else if (routeName === screenNames.LOCATIONS) {
                tabBarLabel = strings.locations
            } else if (routeName === screenNames.FAVORITES) {
                tabBarLabel = strings.favorites
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
                    } else if (routeName === screenNames.LOCATIONS) {
                        iconName = focused ? require('../assets/bookSelected.png') : require('../assets/book.png')
                    } else if (routeName === screenNames.FAVORITES) {
                        iconName = focused ? require('../assets/favorites_selected.png') : require('../assets/favorites.png')
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

const rootStack = createStackNavigator(
    {
        SPLASH_SCREEN: {
            screen: SplashScreen,
            navigationOptions: {
                header: null,
            },
        },
        CHOOSE_TYPE_OF_USER_SCREEN: {
            screen: ChooseTypeOfUser,
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
        SIGN_UP_SCREEN: {
            screen: SignUpScreen,
            navigationOptions: {
                header: null,
            }
        },
        SOCIAL_SIGN_UP_SCREEN: {
            screen: SocialSignUpScreen,
            navigationOptions: {
                header: null,
            }
        },
        ENTREPRENEUR_SIGN_UP_SCREEN: {
            screen: EntrepreneurSignUpScreen,
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
        ENTER_OTP_SCREEN: {
            screen: EnterOTPScreen,
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
        USER_HOME_SCREEN: {
            screen: userTabNavigator,
            navigationOptions: {
                header: null,
            }
        },
        // VIEW_ALL_SCREEN: {
        //     screen: ViewAllScreen,
        //     navigationOptions: {
        //         header: null,
        //     }
        // },
        SUB_CATEGORIES_SCREEN: {
            screen: SubCategoriesScreen,
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
        ACTION_EVENT_DETAIL_SCREEN: {
            screen: ActionEventDetailScreen,
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
        BOOK_FILTER_CATEGORIES_SCREEN: {
            screen: BookFilterCategoriesScreen,
            navigationOptions: {
                header: null,
            }
        },
        USER_SETTINGS_SCREEN: {
            screen: UserSettingsScreen,
            navigationOptions: {
                header: null,
            }
        },
        USER_PROFILE_SCREEN: {
            screen: UserProfileScreen,
            navigationOptions: {
                header: null,
            }
        },
        USER_CHANGE_PASSWORD_SCREEN: {
            screen: ChangePassword,
            navigationOptions: {
                header: null,
            }
        },
        ENTREPRENEUR_DETAIL_SCREEN: {
            screen: EntrepreneurDetailScreen,
            navigationOptions: {
                header: null,
            }
        },
        MY_HOT_DEALS_SCREEN: {
            screen: MyHotDealsScreen,
            navigationOptions: {
                header: null,
            }
        },
        MY_HOT_DEAL_DETAIL_SCREEN: {
            screen: MyHotDealDetailScreen,
            navigationOptions: {
                header: null,
            }
        },
        ENTER_QR_CODE_SCREEN: {
            screen: EnterQRCodeScreen,
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
        MY_HOT_DEAL_REDEEM_SCREEN: {
            screen: MyHotDealRedeemScreen,
            navigationOptions: {
                header: null,
            }
        },
        MESSENGER_SCREEN: {
            screen: MessengerScreen,
            navigationOptions: {
                header: null,
            }
        },
        MESSAGE_SCREEN: {
            screen: MessageScreen,
            navigationOptions: {
                header: null,
            }
        },
        MY_APPOINTMENTS_SCREEN: {
            screen: MyAppointmentsScreen,
            navigationOptions: {
                header: null,
            }
        },
        ADD_APPOINTMENT_SCREEN: {
            screen: AddAppointmentScreen,
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
        SHOW_QR_CODE_SCREEN: {
            screen: ShowQRCodeScreen,
            navigationOptions: {
                header: null,
            }
        },
        CHOOSE_TIME_SCREEN: {
            screen: ChooseTimeScreen,
            navigationOptions: {
                header: null,
            }
        },
        CHOOSE_PREDEFINED_TIME_SCREEN: {
            screen: ChoosePredefinedSlotScreen,
            navigationOptions: {
                header: null,
            }
        },
        CONTACT_US_SCREEN: {
            screen: ContactUsScreen,
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
        FULL_IMAGE_SCREEN: {
            screen: FullImageScreen,
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
        PDF_VIEWER_SCREEN: {
            screen: PDFViewerScreen,
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
    },
    {
        transitionConfig: () => StackViewTransitionConfigs.SlideFromRightIOS
    }
);

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
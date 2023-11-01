import React, { Component } from 'react'
import { View, ImageBackground, StatusBar, Platform } from 'react-native'
import { StackActions, NavigationActions } from 'react-navigation'
import ImageComponent from '../components/ImageComponent'
import { getScreenDimensions, startStackFrom, getSelectedLanguage, alertDialog, getCircularReplacer } from '../utilities/HelperFunctions'
import colors from '../config/Colors'
import StatusBarComponent from '../components/StatusBarComponent'
import commonStyles from '../styles/Styles'
import { constants, screenNames, userTypes, notificationTypes } from '../config/Constants'
import AsyncStorageHelper from '../utilities/AsyncStorageHelper'
import strings from '../config/Strings'
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native'
/**
 * Splash Screen
 */
export default class SplashScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        getSelectedLanguage().then((selectedLanguage) => {
            strings.setLanguage(selectedLanguage)
        })

        this.isComingFromNotification = false;
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent backgroundColor={colors.transparent} />
                <ImageBackground
                    style={[commonStyles.componentBackgroundImage, commonStyles.centerInContainer, {
                        width: this.screenDimensions.width,
                        height: this.screenDimensions.height + (Platform.OS === constants.IOS ? 0 : StatusBar.currentHeight),
                    }]}
                    source={require('../assets/splash.png')}
                    resizeMode={'cover'}>
                    <ImageComponent
                        source={require('../assets/logoForSplash.png')} />
                </ImageBackground>
            </View>
        );
    }

    componentDidMount() {
        this.registerFcmReceivers();
    }

    // check push permission
    registerFcmReceivers = async () => {
        const checkPermission = await messaging().hasPermission()
        const permissionEnabled =
            checkPermission === messaging.AuthorizationStatus.AUTHORIZED ||
            checkPermission === messaging.AuthorizationStatus.PROVISIONAL;

        if (permissionEnabled) {
            this.addFcmListener();
        } else {
            this.requestFcmPermission();

        }
    }

    // ask for push permission
    requestFcmPermission = async () => {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            this.addFcmListener();
        }
        else {
            this.checkPlatform();
        }
    }

    // add listeners for FCM
    addFcmListener = async () => {
        /**
         * the following method will be called when app was killed and
         * the push notification was tapped
         */
        // await messaging().getInitialNotification()
        //     .then((notificationOpen) => {
        //         if (notificationOpen) {
        //             // App was opened by a notification
        //             // Get the action triggered by the notification being opened
        //             const action = notificationOpen.action;
        //             // Get information about the notification that was opened
        //             const notification = notificationOpen.notification;

        //             this.isComingFromNotification = true;
        //             this.handleNotificationData(notification.data);
        //         }
        //     });
        await notifee.getInitialNotification()
            .then((notificationOpen) => {
                if (notificationOpen) {
                    // App was opened by a notification
                    // Get the action triggered by the notification being opened
                    const action = notificationOpen.action;
                    // Get information about the notification that was opened
                    const notification = notificationOpen.notification;

                    this.isComingFromNotification = true;
                    this.handleNotificationData(notification.data);
                }
            });

        this.checkPlatform();
    }

    checkPlatform = () => {
        if (Platform.OS === constants.ANDROID) {
            setTimeout(() => {
                this.moveToNextScreen();
            }, constants.SPLASH_WAIT_TIME);
        } else {
            this.moveToNextScreen();
        }
    }

    // handle push notification data
    handleNotificationData = (data) => {
        if (data.type && data.type == notificationTypes.MESSAGE) {
            let businessId = data.businessId;
            let product = {
                userName: data.name,
                messageId: data.messageId
            }

            const resetAction = StackActions.reset({
                index: 2,
                actions: [
                    NavigationActions.navigate({
                        routeName: screenNames.HOME_SCREEN,
                        params: {}
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.HOME_SCREEN,
                        action: NavigationActions.navigate({
                            routeName: screenNames.MESSENGER,
                            params: {}
                        }),
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.MESSENGER_CHAT_SCREEN,
                        params: {
                            PRODUCT: product,
                            BUSINESS_ID: businessId
                        },
                    }),
                ],
            })
            this.props.navigation.dispatch(resetAction)
        } else if (data.type && data.type == notificationTypes.FROM_SUPER_ADMIN) {
            const resetAction = StackActions.reset({
                index: 2,
                actions: [
                    NavigationActions.navigate({
                        routeName: screenNames.HOME_SCREEN,
                        params: {}
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.HOME_SCREEN,
                        action: NavigationActions.navigate({
                            routeName: screenNames.MY_AREA,
                            params: {}
                        }),
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.NOTIFICATIONS_SCREEN,
                        params: {},
                    }),
                ],
            })
            this.props.navigation.dispatch(resetAction)
        } else if (data.type && data.type == notificationTypes.APPOINTMENT) {
            let businessId = data.businessId;
            let product = {
                userName: data.name,
                messageId: data.messageId
            }

            const resetAction = StackActions.reset({
                index: 2,
                actions: [
                    NavigationActions.navigate({
                        routeName: screenNames.HOME_SCREEN,
                        params: {}
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.HOME_SCREEN,
                        action: NavigationActions.navigate({
                            routeName: screenNames.MESSENGER,
                            params: {}
                        }),
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.MESSENGER_CHAT_SCREEN,
                        params: {
                            PRODUCT: product,
                            BUSINESS_ID: businessId
                        },
                    }),
                ],
            })
            this.props.navigation.dispatch(resetAction)
        } else {
            startStackFrom(this.props.navigation, screenNames.HOME_SCREEN)
        }
    }

    // Move to next screen
    moveToNextScreen = () => {
        AsyncStorageHelper.getStringAsync(constants.IS_USER_LOGGED_IN)
            .then((isUserLoggedIn) => {
                if (isUserLoggedIn && isUserLoggedIn === 'true') {
                    AsyncStorageHelper.getStringAsync(constants.TYPE_OF_USER)
                        .then((typeOfUser) => {
                            if (typeOfUser && typeOfUser === userTypes.ENTREPRENEUR) {
                                if (!this.isComingFromNotification) {
                                    startStackFrom(this.props.navigation, screenNames.HOME_SCREEN)
                                }
                            } else if (typeOfUser && typeOfUser === userTypes.EMPLOYEE) {
                                // should not happen now
                                startStackFrom(this.props.navigation, screenNames.EMPLOYEE_HOME_SCREEN)
                            } else {
                                // should never happen
                                alertDialog("", "Wrong type of user");
                            }
                        })
                } else {
                    startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                }
            })
    }
}
import React, { Component } from 'react'
import { View, ImageBackground, Platform, StatusBar } from 'react-native'
import { StackActions, NavigationActions } from 'react-navigation'
import commonStyles from '../styles/Styles'
import StatusBarComponent from '../components/StatusBarComponent'
import ImageComponent from '../components/ImageComponent'
import LoaderComponent from '../components/LoaderComponent'
import colors from '../config/colors'
import { screenNames, constants, notificationTypes, languages, databaseConstants, dealStatuses, urls, itemTypes } from '../config/constants'
import AsyncStorageHelper from '../utilities/AsyncStorageHelper'
import {
    getScreenDimensions, startStackFrom, getSelectedLanguage, getCommonParamsForAPI,
    alertDialog, getCircularReplacer
} from '../utilities/HelperFunctions'
import strings from '../config/strings';
import NetInfo from "@react-native-community/netinfo";
import ProductMenuSchema from '../database/ProductMenuSchema'
import ProductSchedulerSchema from '../database/ProductSchedulerSchema'
import DealsSchema from '../database/DealsSchema'
import Realm from 'realm'
import { hitApi } from '../api/APICall'
// import firebase, { Notification, NotificationOpen } from 'react-native-firebase';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidBadgeIconType, AndroidDefaults, AndroidGroupAlertBehavior, AndroidImportance, EventType } from '@notifee/react-native';

/**
 * Splash Screen of the App
 */
export default class SplashScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.checkInternet = true
        this.state = {
            showModalLoader: false,
        }

        /**
         * Get the currently selected language from local storage
         * and set for the app
         */
        getSelectedLanguage().then((selectedLanguage) => {
            strings.setLanguage(selectedLanguage)
            constants.CURRENT_SELECTED_LANGUAGE = selectedLanguage
        })

        this.realm = null
        this.initRealm()

        this.isComingFromNotification = false;
    }

    // Returns UI of the Splash Screen
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
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
            </View>
        );
    }

    // Initialize Realm object
    initRealm = () => {
        Realm.open({
            schema: [ProductMenuSchema, ProductSchedulerSchema, DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                this.realm = realm
            })
            .catch(error => {
                alertDialog("", error);
            });
    }

    componentDidMount() {
        this.registerFcmReceivers();
    }

    // Register the FCM Receivers
    registerFcmReceivers = () => {
        messaging().hasPermission()
            .then(enabled => {
                if (enabled) {
                    // user has permissions
                    this.addFcmListener();
                } else {
                    // user doesn't have permission
                    this.requestFcmPermission();
                }
            });
    }

    // Request Permission for Push
    requestFcmPermission = async() => {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
             // User has authorised
             this.addFcmListener();
        }
        else {
             // User has rejected permissions
             this.checkPlatform();
        }
    }

    addFcmListener = () => {
        /**
         * the following method will be called when app was killed and
         * the push notification was tapped
         */
        notifee.getInitialNotification().then((notificationOpen) => {
            console.log("notificationOpen",notificationOpen)
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

        // messaging().getInitialNotification()
        //     .then((notificationOpen) => {
        //         console.log("notificationOpen",notificationOpen)
        //         if (notificationOpen) {
        //             // App was opened by a notification
        //             // Get the action triggered by the notification being opened
        //             const action = notificationOpen.action;
        //             // Get information about the notification that was opened
        //             const notification = notificationOpen.notification;

        //             this.isComingFromNotification = true;
        //             this.handleNotificationData(notification._data);
        //         }
        //     });

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

    componentWillUnmount() {
        if (this.realm !== null && !this.realm.isClosed && this.checkInternet) {
            this.realm.close();
        }
        if (this.removeNotificationOpenedListener) {
            this.removeNotificationOpenedListener();
        }
    }

    moveToNextScreen = () => {
        AsyncStorageHelper.getStringAsync(constants.IS_USER_LOGGED_IN)
            .then((isUserLoggedIn) => {
                if (isUserLoggedIn && isUserLoggedIn === 'true') {
                    // is internet connected
                    NetInfo.fetch().then(state => {
                        if (state.isConnected) {
                            // check if there are any offline redeemed deals
                            let allDeals = this.realm.objects(databaseConstants.DEALS_SCHEMA)
                            let syncDeal = [];
                            let dealsToDelete = [];

                            allDeals.forEach(savedDeal => {
                                if (savedDeal.dealStatusId != dealStatuses.CHECKED_IN) {
                                    let deal = {
                                        redeemedCode: savedDeal.dealRedeemedCode,
                                        dealStatusId: savedDeal.dealStatusId,
                                        redeemedOn: savedDeal.redeemedOn,
                                        expiredOn: savedDeal.expiredOn
                                    }
                                    syncDeal.push(deal);
                                    dealsToDelete.push(savedDeal);
                                }
                            });

                            if (syncDeal.length > 0) {
                                // sync deals & delete them
                                this.hitSyncDealsApi(syncDeal, dealsToDelete)
                            } else {
                                // nothing to sync
                                // console.log("Starting Home");
                                this.goToHome();
                            }
                        } else {
                            this.checkInternet = false
                            startStackFrom(this.props.navigation, screenNames.MY_HOT_DEALS_SCREEN, {
                                COMING_FROM: screenNames.SPLASH_SCREEN
                            })
                        }
                    });
                } else {
                    startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                }
            })
    }

    goToHome = () => {
        if (!this.isComingFromNotification) {
            startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
        }
    }

    // Handle the push notification data
    handleNotificationData = (data) => {
        if (data.type && data.type == notificationTypes.MESSAGE) {
            let businessId = data.businessId;
            let product = {
                businessName: data.name,
                messageId: data.messageId
            }

            const resetAction = StackActions.reset({
                index: 3,
                actions: [
                    NavigationActions.navigate({
                        routeName: screenNames.USER_HOME_SCREEN,
                        params: {}
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.USER_HOME_SCREEN,
                        action: NavigationActions.navigate({
                            routeName: screenNames.MY_AREA,
                            params: {}
                        }),
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.MESSENGER_SCREEN,
                        params: {},
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.MESSAGE_SCREEN,
                        params: {
                            PRODUCT: product,
                            BUSINESS_ID: businessId
                        },
                    }),
                ],
            })
            this.props.navigation.dispatch(resetAction)
        } else if (data.type && data.type == notificationTypes.FOR_PRODUCT) {
            let productId = data.productId;
            let productType = data.productType;
            let resetAction = null;
            if (productType == itemTypes.ACTION || productType == itemTypes.EVENT) {
                resetAction = StackActions.reset({
                    index: 1,
                    actions: [
                        NavigationActions.navigate({
                            routeName: screenNames.USER_HOME_SCREEN,
                            params: {}
                        }),
                        NavigationActions.navigate({
                            routeName: screenNames.ACTION_EVENT_DETAIL_SCREEN,
                            params: {
                                PRODUCT_ID: productId,
                                PRODUCT_TYPE: productType
                            },
                        }),
                    ],
                })
            } else {
                resetAction = StackActions.reset({
                    index: 1,
                    actions: [
                        NavigationActions.navigate({
                            routeName: screenNames.USER_HOME_SCREEN,
                            params: {}
                        }),
                        NavigationActions.navigate({
                            routeName: screenNames.HOT_DEAL_DETAIL_SCREEN,
                            params: {
                                PRODUCT_ID: productId
                            },
                        }),
                    ],
                })
            }
            this.props.navigation.dispatch(resetAction)
        } else if (data.type && data.type == notificationTypes.FROM_SUPER_ADMIN) {
            const resetAction = StackActions.reset({
                index: 2,
                actions: [
                    NavigationActions.navigate({
                        routeName: screenNames.USER_HOME_SCREEN,
                        params: {}
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.USER_HOME_SCREEN,
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
        } else if (data.type && data.type == notificationTypes.MARK_ENT_FAV) {
            let businessId = data.businessId;
            const resetAction = StackActions.reset({
                index: 1,
                actions: [
                    NavigationActions.navigate({
                        routeName: screenNames.USER_HOME_SCREEN,
                        params: {}
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.ENTREPRENEUR_DETAIL_SCREEN,
                        params: {
                            BUSINESS_ID: businessId
                        },
                    }),
                ],
            })
            this.props.navigation.dispatch(resetAction)
        } else if (data.type && data.type == notificationTypes.APPOINTMENT) {
            let businessId = data.businessId;
            let product = {
                businessName: data.name,
                messageId: data.messageId
            }

            const resetAction = StackActions.reset({
                index: 3,
                actions: [
                    NavigationActions.navigate({
                        routeName: screenNames.USER_HOME_SCREEN,
                        params: {}
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.USER_HOME_SCREEN,
                        action: NavigationActions.navigate({
                            routeName: screenNames.MY_AREA,
                            params: {}
                        }),
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.MESSENGER_SCREEN,
                        params: {},
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.MESSAGE_SCREEN,
                        params: {
                            PRODUCT: product,
                            BUSINESS_ID: businessId
                        },
                    }),
                ],
            })
            this.props.navigation.dispatch(resetAction)
        } else {
            startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
        }
    }

    // Sync the offline deals
    hitSyncDealsApi = (syncDeal, dealsToDelete) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                syncDeal
            }

            hitApi(urls.SYNC_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.realm.write(() => {
                    this.realm.delete(dealsToDelete);
                });
                this.goToHome();
            }, (jsonResponse) => {
                this.goToHome();
            })
        })
    }

    // function to show/hide loader
    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}
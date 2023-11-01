import React, { Component } from 'react'
import { View, TouchableOpacity, FlatList } from 'react-native'
import { StackActions, NavigationActions } from 'react-navigation'
import StatusBarComponent from '../components/StatusBarComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import LoaderComponent from '../components/LoaderComponent'
import TextComponent from '../components/TextComponent'
import ImageComponent from '../components/ImageComponent'
import ButtonComponent from '../components/ButtonComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import {
    isUserLoggedIn, startStackFrom, alertDialog, openUrlInBrowser,
    getCommonParamsForAPI, parseDate, parseDateTime, handleErrorResponse
} from '../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, urls, constants, notificationTypes, } from '../config/Constants'
import { hitApi } from '../api/ApiCall'
import notifee from '@notifee/react-native';

/**
 * Notifications screen
 */
export default class NotificationsScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModalLoader: false,
            showNoNotifications: false,
            notificationsArray: [],
            pullToRefreshWorking: false,
        }

        this.shouldHitPagination = true
        this.pageIndex = 1
        this.paginationRequired = true
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.notifications}
                    navigation={this.props.navigation} />
                <View style={commonStyles.container}>
                    <FlatList
                        data={this.state.notificationsArray}
                        onRefresh={this.onPullToRefresh}
                        refreshing={this.state.pullToRefreshWorking}
                        renderItem={({ item }) =>
                            <TouchableOpacity
                                onPress={() => {
                                    this.handleClick(item)
                                }}>
                                <View>
                                    <View style={[commonStyles.rowContainer, { paddingVertical: 20 }]}>
                                        <View style={{ width: '15%', alignItems: 'center' }}>
                                            <ImageComponent
                                                source={require('../assets/logoForNotification.png')} />
                                        </View>
                                        <View style={{ width: '85%' }}>
                                            <TextComponent style={{ fontSize: sizes.largeTextSize }}>
                                                {item.messageBody}
                                            </TextComponent>
                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                <TextComponent style={{ fontFamily: fontNames.boldFont }}>
                                                    {parseDateTime(item.sentOn)}
                                                </TextComponent>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.deleteNotification(item.notificationId)
                                                    }}
                                                    style={{ marginLeft: 'auto', marginRight: 10, padding: 10 }}>
                                                    <ImageComponent
                                                        source={require('../assets/delete.png')} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ height: 1, backgroundColor: colors.lightLineColor }} />
                                </View>
                            </TouchableOpacity>
                        }
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        ListEmptyComponent={
                            this.state.showNoNotifications &&
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                    {strings.no_notifications_yet}
                                </TextComponent>
                            </View>
                        }
                        onEndReached={({ distanceFromEnd }) => {
                            if (distanceFromEnd < 0) {
                                return;
                            }
                            if (this.paginationRequired && this.shouldHitPagination) {
                                this.shouldHitPagination = false
                                this.pageIndex++
                                this.fetchNotifications()
                            }
                        }}
                        onEndReachedThreshold={0.5} />
                </View>
            </View>
        );
    }

    componentDidMount() {
        this.loadInitial()
    }

    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.loadInitial()
        })
    }

    loadInitial = () => {
        this.setState({
            showNoNotifications: false,
            notificationsArray: [],
        }, () => {
            this.pageIndex = 1
            this.paginationRequired = true
            this.fetchNotifications()
        })
    }

    // handle click on notification
    handleClick = (data) => {
        if (data.notificationType && data.notificationType == notificationTypes.MESSAGE) {
            let businessId = data.businessId;
            let product = {
                userName: data.name,
                messageId: data.messageId
            }

            this.props.navigation.navigate(screenNames.MESSENGER_CHAT_SCREEN, {
                PRODUCT: product,
                BUSINESS_ID: businessId
            })
        } else if (data.notificationType && data.notificationType == notificationTypes.FROM_SUPER_ADMIN) {
            // Do Nothing
        } else if (data.notificationType && data.notificationType == notificationTypes.APPOINTMENT) {
            let appointmentStatus = data.appointmentStatusId;

            const resetAction = StackActions.reset({
                index: 1,
                actions: [
                    NavigationActions.navigate({
                        routeName: screenNames.HOME_SCREEN,
                        params: {}
                    }),
                    NavigationActions.navigate({
                        routeName: screenNames.HOME_SCREEN,
                        action: NavigationActions.navigate({
                            routeName: screenNames.APPOINTMENT,
                            params: {
                                APPOINTMENT_STATUS: appointmentStatus
                            }
                        }),
                    }),
                ],
            })
            this.props.navigation.dispatch(resetAction)
        }
    }

    // api to get listing of notifications
    fetchNotifications = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                pageIndex: this.pageIndex,
                pageSize: constants.PAGE_SIZE,
            }

            hitApi(urls.GET_NOTIFICATIONS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.paginationRequired = false
                }
                let tempArray = this.state.notificationsArray
                tempArray.push(...jsonResponse.response.data)

                this.setState({
                    notificationsArray: tempArray,
                    showNoNotifications: true,
                    pullToRefreshWorking: false,
                }, () => {
                    this.shouldHitPagination = true

                    this.getUnreadCount()
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)

                this.getUnreadCount()
            })
        })
    }

    getUnreadCount = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }

            hitApi(urls.GET_UNREAD_COUNT, urls.POST, params, null, (jsonResponse) => {
                let unreadMessages = jsonResponse.response.unreadMessagesCount;
                let unreadAppointments = jsonResponse.response.unreadAppointmentsCount;
                let unreadAdminNotificationsCount = jsonResponse.response.unreadAdminNotificationsCount;

                const setParamsForAppointments = NavigationActions.setParams({
                    params: { badgeCount: unreadAppointments },
                    key: screenNames.APPOINTMENT,
                });
                this.props.navigation.dispatch(setParamsForAppointments);

                const setParamsForMessages = NavigationActions.setParams({
                    params: { badgeCount: unreadMessages },
                    key: screenNames.MESSENGER,
                });
                this.props.navigation.dispatch(setParamsForMessages);

                const setParamsForMyArea = NavigationActions.setParams({
                    params: { badgeCount: unreadAdminNotificationsCount },
                    key: screenNames.MY_AREA,
                });
                this.props.navigation.dispatch(setParamsForMyArea);

                let count = unreadMessages + unreadAppointments + unreadAdminNotificationsCount;
                notifee.setBadgeCount(count)
            })
        })
    }

    // api to delete a notification
    deleteNotification = (notificationId) => {
        alertDialog("", strings.confirm_delete_notification, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    notificationId
                }

                hitApi(urls.DELETE_NOTIFICATION, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    setTimeout(() => {
                        this.loadInitial()
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    showModalLoader = (shouldShow) => {
        if (shouldShow) {
            this.setState({
                showModalLoader: shouldShow,
            })
        } else {
            setTimeout(() => {
                this.setState({
                    showModalLoader: shouldShow,
                    pullToRefreshWorking: false,
                })
            }, constants.HANDLING_TIMEOUT)
        }
    }
}
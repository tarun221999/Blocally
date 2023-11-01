import React, { Component } from 'react'
import {
    View, StyleSheet, TouchableHighlight, ScrollView, Modal, StatusBar, FlatList,
    TouchableOpacity, RefreshControl,
} from 'react-native'
import { NavigationActions } from 'react-navigation'
import StatusBarComponent from '../components/StatusBarComponent'
import LoaderComponent from '../components/LoaderComponent'
import TextComponent from '../components/TextComponent'
import HeaderComponent from '../components/HeaderComponent'
import ImageComponent from '../components/ImageComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import { getCommonParamsForAPI, getBoldText, alertDialog, handleErrorResponse } from '../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, urls, constants } from '../config/Constants'
import { hitApi } from '../api/ApiCall'
import TitleBarComponent from '../components/TitleBarComponent'
import {  Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import notifee from '@notifee/react-native';

const marginValue = 25

/**
 * Listing of threads screen
 */
export default class MessengerScreen extends Component {
    constructor(props) {
        super(props);
        this.colorArray = [colors.randomBrickRed, colors.randomGreen, colors.randomOliveGreen, colors.randomPurple]
        this.state = {
            showModalLoader: false,
            messageThreadsArray: [],
            pullToRefreshWorking: false,
            showNoMessages: false,
        }

        this.shouldHitPagination = true
        this.pageIndex = 1
        this.paginationRequired = true
        this.didFocusSubscription = null
        this.didBlurSubscription = null

        this.messageInterval = null
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <TitleBarComponent
                    isHomeScreen={true}
                    title={strings.messenger}
                    navigation={this.props.navigation}
                />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.pullToRefreshWorking}
                            onRefresh={this.onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}>
                    <HeaderComponent
                        image={require('../assets/MessengerHeader.png')}>
                    </HeaderComponent>
                    <FlatList
                        data={this.state.messageThreadsArray}
                        renderItem={({ item, index }) =>
                            <TouchableOpacity
                                onPress={() => {
                                    let product = {}
                                    product.userName = item.userFirstName + ' ' + item.userLastName
                                    product.messageId = item.messageId

                                    this.props.navigation.navigate(screenNames.MESSENGER_CHAT_SCREEN, {
                                        PRODUCT: product,
                                        BUSINESS_ID: item.businessId
                                    })
                                }}>
                                <View style={{ marginLeft: 20, flexDirection: 'row', marginTop: 15, marginBottom: 15 }}>
                                    <View style={{ height: 70, width: 90, borderRadius: 8, backgroundColor: this.colorArray[(index + 1) % 4], justifyContent: 'center' }}>
                                        <TextComponent style={{ fontSize: 26, alignSelf: 'center', color: colors.white, fontFamily: fontNames.boldFont }}>
                                            {item.userFirstName.charAt(0) + item.userLastName.charAt(0)}
                                        </TextComponent>
                                    </View>
                                    <View style={{ flex: 1, marginStart: 10, }}>
                                        <TextComponent
                                            numberOfLines={4}
                                            style={{ fontFamily: fontNames.regularFont, fontSize: sizes.detailTextSize }}>
                                            {item.isMessageSent ? getBoldText(strings.you) : getBoldText(item.userFirstName)} : {item.message}
                                        </TextComponent>
                                    </View>

                                    <View style={{ marginRight: 10, }}>
                                        <Menu
                                            ref={(ref) => item._menu = ref}
                                            button={
                                                <TouchableOpacity
                                                    style={{
                                                        padding: 10, marginLeft: 'auto',
                                                    }}
                                                    onPress={() => item._menu.show()}>
                                                    <ImageComponent
                                                        source={require('../assets/threeDots.png')} />
                                                </TouchableOpacity>
                                            }>
                                            <MenuItem onPress={() => {
                                                item._menu.hide()
                                                setTimeout(() => {
                                                    alertDialog("", strings.sure_delete_chat, strings.yes, strings.no, () => {
                                                        this.deleteMessageThread(item.messageId)
                                                    })
                                                }, constants.HANDLING_TIMEOUT)
                                            }}>
                                                {strings.delete_chat}
                                            </MenuItem>
                                        </Menu>
                                        {item.unreadMessageCount > 0 &&
                                            <TextComponent style={[commonStyles.badgeCount, {
                                                marginTop: 10
                                            }]}>
                                                {item.unreadMessageCount}
                                            </TextComponent>
                                        }
                                    </View>
                                </View>
                                <View style={[styles.line, {}]} />
                            </TouchableOpacity>
                        }
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        ListEmptyComponent={
                            this.state.showNoMessages &&
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                    {strings.no_records_found}
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
                                this.fetchMessageThreads()
                            }
                        }}
                        onEndReachedThreshold={0.5}
                    />
                </ScrollView>
            </View>
        );
    }

    componentDidMount() {
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.getInitialData();
                this.startTimer();
            }
        );

        this.didBlurSubscription = this.props.navigation.addListener(
            'didBlur',
            payload => {
                if (this.messageInterval) {
                    clearInterval(this.messageInterval)
                }
            }
        );
    }

    // pull to refresh listener
    onRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.getInitialData()
        })
    }

    // get initial data for threads
    getInitialData = () => {
        this.setState({
            messageThreadsArray: [],
            showNoMessages: false
        }, () => {
            this.getUnreadCount();

            this.pageIndex = 1
            this.paginationRequired = true
            this.fetchMessageThreads();
        })
    }

    // timer to refresh
    startTimer = () => {
        this.messageInterval = setInterval(() => {
            this.getFirstPage();
        }, constants.MESSENGER_LISTING_REFRESH_INTERVAL);
    }

    componentWillUnmount() {
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }
        if (this.didBlurSubscription) {
            this.didBlurSubscription.remove();
        }
        if (this.messageInterval) {
            clearInterval(this.messageInterval)
        }
    }

    // api to get listing of threads
    fetchMessageThreads = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                pageIndex: this.pageIndex,
                pageSize: constants.PAGE_SIZE,
            }

            hitApi(urls.GET_MESSAGES, urls.POST, params, this.showModalLoader, (res) => {
                if (res.response.data.length < constants.PAGE_SIZE) {
                    this.paginationRequired = false
                }
                console.log("res.response.data--", res.response.data)
                let tempArray = this.state.messageThreadsArray
                let threadsToAdd = this.getThreadsToAdd(res.response.data)
                tempArray.push(...threadsToAdd)

                setTimeout(() => {
                    this.setState({
                        messageThreadsArray: tempArray,
                        pullToRefreshWorking: false,
                        showNoMessages: true
                    }, () => {
                        this.shouldHitPagination = true
                    })
                }, constants.HANDLING_TIMEOUT)
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    getThreadsToAdd = (newThreads) => {
        let oldThreads = this.state.messageThreadsArray

        let threadsToAdd = []
        for (let i = 0; i < newThreads.length; i++) {
            let alreadyExists = false
            let newThread = newThreads[i]
            for (let j = 0; j < oldThreads.length; j++) {
                let currentThread = oldThreads[j]

                if (newThread.messageId == currentThread.messageId) {
                    alreadyExists = true
                    break
                }
            }
            if (!alreadyExists) {
                threadsToAdd.push(newThread)
            }
        }
        return threadsToAdd
    }

    // api to get first page of threads
    getFirstPage = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                pageIndex: 1, // always check for first page
                pageSize: constants.PAGE_SIZE,
            }

            hitApi(urls.GET_MESSAGES, urls.POST, params, null, (jsonResponse) => {
                if (!this.state.pullToRefreshWorking) {
                    let existingDate = this.state.messageThreadsArray
                    let newData = jsonResponse.response.data

                    if (existingDate && existingDate.length > 0) {
                        if (newData && newData.length > 0) {
                            let existingFirst = existingDate[0]
                            let newFirst = newData[0]

                            let shouldUpdate = false

                            if (existingFirst.messageId == newFirst.messageId) {
                                if (existingFirst.messageChatId == newFirst.messageChatId) {
                                    // Do nothing
                                } else {
                                    // got new message in same thread
                                    shouldUpdate = true
                                }
                            } else {
                                // got new message in some other thread
                                shouldUpdate = true
                            }

                            if (shouldUpdate) {
                                if (this.pageIndex == 1) {
                                    if (newData.length < constants.PAGE_SIZE) {
                                        this.paginationRequired = false
                                    } else {
                                        this.paginationRequired = true
                                    }

                                    this.setState({
                                        messageThreadsArray: [],
                                    }, () => {
                                        this.setState({
                                            messageThreadsArray: newData,
                                        })
                                    })
                                } else {
                                    this.getInitialData()
                                }
                            }
                        }
                    } else {
                        if (newData && newData.length > 0) {
                            this.setState({
                                messageThreadsArray: newData,
                            })
                        }
                    }
                }
            })
        })
    }

    // api to get unread counts
    getUnreadCount = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }

            hitApi(urls.GET_UNREAD_COUNT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
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

    // api to delete message thread
    deleteMessageThread = (messageId) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                messageId: messageId
            }

            hitApi(urls.DELETE_MESSAGES, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.setState({
                    messageThreadsArray: [],
                }, () => {
                    this.pageIndex = 1
                    this.paginationRequired = true
                    this.fetchMessageThreads()
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
            },1000)
        }
    }
}

const styles = StyleSheet.create({
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: marginValue
    },
    title: {
        position: 'absolute',
        marginStart: 75,
    },
    arrowImage: {
        marginStart: 'auto',
    },
    line: {
        height: 1,
        backgroundColor: colors.lineColor,
        width: '88%',
        alignSelf: 'center'
    },
    popupButton: {
        marginTop: 20,
        width: '40%',
        alignSelf: 'center',
        marginEnd: 5
    }
});
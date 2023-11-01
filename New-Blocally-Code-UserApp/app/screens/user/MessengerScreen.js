import React, { Component } from 'react'
import { View, StyleSheet, FlatList, TouchableWithoutFeedback, TouchableOpacity, Modal } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import LoaderComponent from '../../components/LoaderComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import HeaderComponent from '../../components/HeaderComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    getCommonParamsForAPI, alertDialog, parseTextForCard, getInitialsFromName, getUnreadCounts,
    handleErrorResponse,
} from '../../utilities/HelperFunctions'
import { urls, fontNames, constants, screenNames, } from '../../config/constants'
import { hitApi } from '../../api/APICall'
import FastImage from 'react-native-fast-image'
import {Menu,  MenuItem, MenuDivider } from 'react-native-material-menu';

/**
 * Listing of Message Threads Screen
 */
export default class MessengerScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModalLoader: false,
            messageThreadsArray: [],
            pullToRefreshWorking: false,
            showNoMessages: false
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
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.messenger}
                    navigation={this.props.navigation} />
                <HeaderComponent
                    image={require('../../assets/messengerHeader.png')} />
                <FlatList
                    data={this.state.messageThreadsArray}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View style={{
                            paddingHorizontal: 20, paddingTop: 20,
                            marginBottom: index === this.state.messageThreadsArray.length - 1 ? 40 : 0
                        }}>
                            <TouchableWithoutFeedback
                                onPress={() => {
                                    let product = {}
                                    product.businessName = item.businessName
                                    product.messageId = item.messageId
                                    this.props.navigation.navigate(screenNames.MESSAGE_SCREEN, {
                                        PRODUCT_ID: null,
                                        PRODUCT: product,
                                        BUSINESS_ID: item.businessId
                                    })
                                }}>
                                <View style={commonStyles.rowContainer}>
                                    <View style={{
                                        alignSelf: 'baseline', borderRadius: 10, overflow: 'hidden'
                                    }}>
                                        <View style={[commonStyles.centerInContainer, { backgroundColor: colors.white }]}>
                                            <ImageComponent
                                                style={{ position: 'absolute' }}
                                                source={require('../../assets/placeholderLogo.png')} />
                                            <FastImage
                                                style={{ width: 120, height: 70, }}
                                                source={{
                                                    uri: item.bannerImage ? item.bannerImage : "",
                                                }}
                                                resizeMode={FastImage.resizeMode.cover}
                                            />
                                        </View>
                                        <TextComponent
                                            style={{
                                                backgroundColor: colors.black, color: colors.white, padding: 2,
                                                textAlign: 'center'
                                            }}>
                                            {parseTextForCard(item.businessName, 12)}
                                        </TextComponent>
                                    </View>

                                    <View style={{ flex: 1, marginStart: 20, marginVertical: 10, }}>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont, fontWeight: 'bold' }}>
                                            {item.isMessageSent ? strings.you : getInitialsFromName(item.businessName)}:
                                            <TextComponent style={{ fontWeight: 'normal' }}>
                                                {" " + parseTextForCard(item.message, 30)}
                                            </TextComponent>
                                        </TextComponent>
                                    </View>

                                    <View>
                                        <Menu
                                            ref={(ref) => item._menu = ref}
                                            anchor={
                                                <TouchableOpacity
                                                    style={{}}
                                                    onPress={() => item._menu.show()}>
                                                    <View
                                                        style={{ padding: 10, marginLeft: 'auto' }}>
                                                        <ImageComponent
                                                            source={require('../../assets/threeDots.png')}
                                                        />
                                                    </View>
                                                </TouchableOpacity>
                                            }
                                            onRequestClose={() => item._menu.hide()}
                                            >
                                            <MenuItem onPress={() => {
                                                item._menu.hide()
                                                setTimeout(() => {
                                                    alertDialog("", strings.sure_delete_chat, strings.yes, strings.no, () => {
                                                        this.deleteMessageThread(item.messageId)
                                                    })
                                                }, constants.HANDLING_TIMEOUT)
                                            }}
                                            textStyle={{color: colors.black,}}
                                            >
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
                            </TouchableWithoutFeedback>
                            <View style={styles.line} />
                        </View>
                    }
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        this.state.showNoMessages &&
                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                {strings.no_chats_yet}
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
                            this.fetchMessageThreads(this.showModalLoader)
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        );
    }

    componentDidMount() {
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                if (!this.state.pullToRefreshWorking) {
                    this.getInitialData(this.showModalLoader);
                }
                this.startTimer();
                getUnreadCounts(this.props.navigation)
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

    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.getInitialData(this.showModalLoader);
        })
    }

    // Get initial data from api
    getInitialData = (showModalLoader) => {
        this.setState({
            messageThreadsArray: [],
            showNoMessages: false
        }, () => {
            this.pageIndex = 1
            this.paginationRequired = true
            this.fetchMessageThreads(showModalLoader)
        })
    }

    // timer for refreshing data
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

    // get message threads from API
    fetchMessageThreads = (showModalLoader) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                pageIndex: this.pageIndex,
                pageSize: constants.PAGE_SIZE,
            }

            hitApi(urls.GET_MESSAGES, urls.POST, params, showModalLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.paginationRequired = false
                }
                console.log("jsonResponse.response.data",jsonResponse.response.data)
                let tempArray = this.state.messageThreadsArray
                let threadsToAdd = this.getThreadsToAdd(jsonResponse.response.data)
                tempArray.push(...threadsToAdd)

                setTimeout(() => {
                    this.setState({
                        pullToRefreshWorking: false,
                        messageThreadsArray: tempArray,
                        showNoMessages: true
                    }, () => {
                        this.shouldHitPagination = true
                    })
                }, constants.HANDLING_TIMEOUT)
            }, (jsonResponse) => {
                this.setState({
                    pullToRefreshWorking: false,
                }, () => {
                    this.shouldHitPagination = true
                    handleErrorResponse(this.props.navigation, jsonResponse)
                })
            })
        })
    }

    // filter threads to add
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

    // get data for page 1
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
                                    this.getInitialData(this.showModalLoader)
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
                    this.fetchMessageThreads(this.showModalLoader)
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
    line: {
        height: 1,
        marginTop: 10,
        backgroundColor: colors.lightLineColor
    },
});
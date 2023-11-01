import React, { Component } from 'react'
import {
    View, StyleSheet, FlatList, TouchableWithoutFeedback, Modal, TouchableOpacity, Platform,
    PermissionsAndroid, Linking, AppState,
} from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TextComponent from '../../components/TextComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import HeaderComponent from '../../components/HeaderComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ImageComponent from '../../components/ImageComponent'
import ButtonComponent from '../../components/ButtonComponent'
import TextInputComponent from '../../components/TextInputComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import {
    getScreenDimensions, getCommonParamsForAPI, getImageDimensions, parseDate, parseTextForCard,
    parseTime, getCurrencyFormat, addMinutesToADate, addMinutesToADateGetTime, parseTimeWithoutUnit,
    getTimeOffset, alertDialog, handleErrorResponse, parseDateTime, checkIfDateIsInRange, parseLocalDateTime,
    compareDealsForDistance, getKmFromMeters, getUTCDateTimeFromLocalDateTime, getISODateTimeFromLocalDateTime,
    compareCheckedInDeals, compareExpiredDeals, compareRedeemedDeals, parseDiscountApplied, getLocalDateTimeFromLocalDateTime,
    isNetworkConnected, getExactTimeOffset,
} from '../../utilities/HelperFunctions'
import colors from '../../config/colors'
import { hitApi } from '../../api/APICall'
import {
    fontNames, sizes, screenNames, urls, constants, dealStatuses,
    appointmentRequestStatus, languages, databaseConstants, itemTypes, scheduleTypes,
    productDuration,
} from '../../config/constants'
// import { IndicatorViewPager, PagerTitleIndicator } from 'react-native-best-viewpager'
import FastImage from 'react-native-fast-image'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import Geolocation from 'react-native-geolocation-service';
import ProductMenuSchema from '../../database/ProductMenuSchema'
import ProductSchedulerSchema from '../../database/ProductSchedulerSchema'
import DealsSchema from '../../database/DealsSchema'
import Realm from 'realm'
import ReactNativeBlobUtil from 'rn-fetch-blob'
import NetInfo from "@react-native-community/netinfo";
import { getDistance } from 'geolib';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'

/**
 * My Hot Deals Screen
 */
export default class MyHotDealsScreen extends Component {
    constructor(props) {
        super(props);
        this.initRealm(false)
        this.comingFrom = this.props.navigation.state.params ?
            this.props.navigation.state.params.COMING_FROM : null

        this.screenDimensions = getScreenDimensions()
        this.state = {
            showModalLoader: false,
            activeDeals: [],
            bookedDeals: [],
            checkedInDeals: [],
            redeemedDeals: [],
            expiredDeals: [],
            pullToRefreshWorking: false,

            showInfoPopup: false,
            productTypeForInfo: null,
            isUnlimitedForInfo: false,
            isBookedForInfo: false,

            showEnterCountPopup: false,

            showNoSavedDeals: false,
            showNoBookedDeals: false,
            showNoCheckedInDeals: false,
            showNoRedeemedDeals: false,
            showNoExpiredDeals: false,

            currentBookedDeal: null,
            dealCountError: "",
            isInternetConnected: true,

            isRedeemSuccess: false,
            redeemMessage: "",
            showRedeemDonePopup: false,

            showCheckInFailedPopup: false,
            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            productTypeForSchedule: null,
            schedulerData: [],

            showCheckInFailedBookedPopup: false,
            schedulerAppointmentDateTime: null,

            showCheckInDonePopup: false,
            tabs: {
                index: 0,
                routes: [
                    { key: 'first', title: strings.bonus },
                    { key: 'second', title: strings.reserved },
                    { key: 'third', title: strings.checked_in },
                    { key: 'fourth', title: strings.redeemed },
                    { key: 'fifth', title: strings.expired },
                ],
            }
        }

        this.screenDimensions = getScreenDimensions()
        this.cardFullUpperBgImage = getImageDimensions(require('../../assets/cardFullUpperBg.png'))
        this.cardFullRedStripImage = getImageDimensions(require('../../assets/cardFullRedStrip.png'))
        this.cardFullLowerBgWithCut = getImageDimensions(require('../../assets/cardFullLowerBgWithCut.png'))

        this.activeDealsPageIndex = 1
        this.activeDealsPaginationRequired = true

        this.bookedDealsPageIndex = 1
        this.bookedDealsPaginationRequired = true

        this.checkedInDealsPageIndex = 1
        this.checkedInDealsPaginationRequired = true

        this.redeemedDealsPageIndex = 1
        this.redeemedDealsPaginationRequired = true

        this.expiredDealsPageIndex = 1
        this.expiredDealsPaginationRequired = true

        this.selectedDealCount = ""

        this.isComingFromSettings = false
        this.currentLatitude = 0
        this.currentLongitude = 0
        this.distance = 0
        this.isFirstTime = true

        this.realm = null
        // this.indicatorViewPagerRef = null
        this.didFocusSubscription = null

        this.shouldHitPagination = true
        this.checkInternet = true

    }

    firstScene = () => {
        return (
            <View style={commonStyles.container}>
                {/* Active Hot Deals view */}
                <FlatList
                    data={this.state.activeDeals}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View style={{
                            alignItems: 'center', marginBottom: index === this.state.activeDeals.length - 1 ? 10 : 0
                        }}>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                marginStart: 0, marginEnd: 0, marginTop: 0
                            }]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            this.props.navigation.navigate(screenNames.MY_HOT_DEAL_DETAIL_SCREEN, {
                                                DEAL_ID: item.dealId
                                            })
                                        }}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.dealImage ? item.dealImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                <TouchableWithoutFeedback
                                                    onPress={() => this.setState({
                                                        productTypeForInfo: item.productType,
                                                        isUnlimitedForInfo: item.productIsHotDealUnlimited,
                                                        isBookedForInfo: false,
                                                        showInfoPopup: false // hiding it
                                                    })}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        position: 'absolute', backgroundColor: colors.timerBackground,
                                                        paddingHorizontal: 20, borderRadius: 20, paddingVertical: 5
                                                    }]}>
                                                        <TextComponent style={{ color: colors.white, fontSize: sizes.mediumTextSize }}>
                                                            {item.productType === itemTypes.BONUS_DEAL ?
                                                                (item.dealCount + " " + (item.dealCount === 1 ? strings.deal : strings.deals))
                                                                :
                                                                item.productIsHotDealUnlimited ? strings.until_stock_lasts :
                                                                    item.hotDealLeft + " " + strings.left}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableWithoutFeedback>
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={item.productType === itemTypes.BONUS_DEAL ?
                                                        require('../../assets/bonusBadge.png')
                                                        : require('../../assets/hotDeal.png')} />

                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={[commonStyles.cardBigTitleText, { left: 15 }]}>
                                                        {item.dealTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }]}>
                                                <View style={commonStyles.rowContainer}>
                                                    <View>
                                                        <TextComponent style={[commonStyles.cardBigDescriptionText, {
                                                            fontFamily: fontNames.boldFont,
                                                        }]}>
                                                            {parseTextForCard(item.businessName, 15)}
                                                        </TextComponent>
                                                        {item.isDiscounted ?
                                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles.greenTextColor, { fontSize: 13 }]}>
                                                                    {item.discount + strings.percent_discount}
                                                                </TextComponent>
                                                            </View>
                                                            :
                                                            <TextComponent style={{ fontSize: 13, color: colors.greenTextColor, marginTop: 3 }}>
                                                                {item.dealOP ? getCurrencyFormat(item.dealOP) :
                                                                    (typeof item.dealOP == 'number') ? getCurrencyFormat(item.dealOP) : ""}
                                                            </TextComponent>
                                                        }
                                                    </View>
                                                    <View style={{ marginStart: 'auto', }}>
                                                        <ButtonComponent
                                                            isFillRequired={true}
                                                            style={styles.button}
                                                            fontStyle={{ fontSize: sizes.normalTextSize }}
                                                            onPress={() => {
                                                                if (item.productType === itemTypes.BONUS_DEAL) {
                                                                    this.checkForLocation(item, item.dealCount)
                                                                } else if (item.productIsHotDealUnlimited || item.hotDealLeft > 0) {
                                                                    this.checkForLocation(item, item.dealCount)
                                                                } else {
                                                                    alertDialog("", strings.no_more_deals_left);
                                                                }
                                                            }}>
                                                            {strings.check_in}
                                                        </ButtonComponent>
                                                    </View>
                                                </View>
                                                <View style={[commonStyles.rowContainer, { marginTop: 3, justifyContent: 'space-between' }]}>
                                                    <TextComponent style={{ fontSize: 11 }}>
                                                        {item.productType === itemTypes.BONUS_DEAL ?
                                                            item.dealExpiredOn ? parseDate(item.dealExpiredOn) : ""
                                                            : item.dealNextAvailableStartDateTime ? parseDate(item.dealNextAvailableStartDateTime) : ""
                                                        }
                                                    </TextComponent>
                                                    <TextComponent style={{ fontSize: 11 }}>
                                                        {item.productType === itemTypes.BONUS_DEAL ?
                                                            item.dealExpiredOn ? parseTime(item.dealExpiredOn) : ""
                                                            : item.dealNextAvailableStartDateTime ?
                                                                (parseTimeWithoutUnit(item.dealNextAvailableStartDateTime)
                                                                    + " - " + parseTime(item.dealNextAvailableEndDateTime))
                                                                : ""
                                                        }
                                                    </TextComponent>
                                                    <TextComponent style={{ fontSize: 11 }}>
                                                        {item.distance}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    }
                    style={styles.mainFlatList}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={
                        this.state.showNoSavedDeals ?
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginHorizontal: 20, textAlign: 'center' }}>
                                    {strings.no_active_deals}
                                </TextComponent>
                            </View>
                            :
                            !this.state.isInternetConnected ?
                                <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                    <TextComponent style={{
                                        color: colors.greyTextColor, marginTop: 20, textAlign: 'center',
                                        marginHorizontal: 20
                                    }}>
                                        {strings.internet_not_connected}
                                    </TextComponent>
                                </View>
                                : <View />
                    }
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd == 0) {
                            return;
                        }
                        isNetworkConnected().then((isConnected) => {
                            if (isConnected) {
                                if (this.activeDealsPaginationRequired && this.shouldHitPagination) {
                                    this.shouldHitPagination = false
                                    this.activeDealsPageIndex++
                                    this.fetchMyActiveDeals()
                                }
                            } else {
                                alertDialog("", strings.internet_not_connected)
                            }
                        })
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        )
    }

    secondScene = () => {
        return (
            <View style={commonStyles.container}>
                {/* Booked Hot Deals view */}
                <FlatList
                    data={this.state.bookedDeals}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View style={{
                            alignItems: 'center', marginBottom: index === this.state.bookedDeals.length - 1 ? 10 : 0
                        }}>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                marginStart: 0,
                                marginEnd: 0,
                                marginTop: 0
                            }]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            this.props.navigation.navigate(screenNames.MY_HOT_DEAL_DETAIL_SCREEN, {
                                                DEAL_ID: item.dealId
                                            })
                                        }}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.dealImage ? item.dealImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                <TouchableWithoutFeedback
                                                    onPress={() => {
                                                        this.setState({
                                                            productTypeForInfo: item.productType,
                                                            isUnlimitedForInfo: item.productIsHotDealUnlimited,
                                                            isBookedForInfo: true,
                                                            showInfoPopup: false // hiding it
                                                        })
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        position: 'absolute', backgroundColor: colors.timerBackground,
                                                        paddingHorizontal: 20, borderRadius: 20, paddingVertical: 5
                                                    }]}>
                                                        <TextComponent style={{ color: colors.white, fontSize: sizes.mediumTextSize }}>
                                                            {item.dealCount + " " + (item.dealCount === 1 ? strings.deal : strings.deals)}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableWithoutFeedback>
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={item.productType === itemTypes.BONUS_DEAL ?
                                                        require('../../assets/bonusBadge.png')
                                                        : require('../../assets/hotDeal.png')} />

                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={[commonStyles.cardBigTitleText, { left: 15 }]}>
                                                        {item.dealTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }]}>
                                                <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                    <View>
                                                        <TextComponent style={[commonStyles.cardBigDescriptionText, {
                                                            fontFamily: fontNames.boldFont,
                                                        }]}>
                                                            {parseTextForCard(item.businessName, 15)}
                                                        </TextComponent>
                                                        {item.isDiscounted ?
                                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles.greenTextColor, { fontSize: 13 }]}>
                                                                    {item.discount + strings.percent_discount}
                                                                </TextComponent>
                                                            </View>
                                                            :
                                                            <TextComponent style={{ fontSize: 13, color: colors.greenTextColor, marginTop: 3 }}>
                                                                {item.dealOP ? getCurrencyFormat(item.dealOP) :
                                                                    (typeof item.dealOP == 'number') ? getCurrencyFormat(item.dealOP) : ""}
                                                            </TextComponent>
                                                        }
                                                    </View>
                                                    <View style={{ marginStart: 'auto' }}>
                                                        {item.appointmentStatusId === appointmentRequestStatus.APPROVED ?
                                                            <ButtonComponent
                                                                isFillRequired={true}
                                                                style={styles.button}
                                                                fontStyle={{ fontSize: sizes.mediumTextSize }}
                                                                onPress={() => {
                                                                    if (item.dealCount == 1) {
                                                                        this.checkForLocation(item, item.dealCount)
                                                                    } else {
                                                                        this.setState({
                                                                            currentBookedDeal: item,
                                                                            showEnterCountPopup: true
                                                                        })
                                                                    }
                                                                }}>
                                                                {strings.check_in}
                                                            </ButtonComponent>
                                                            :
                                                            item.appointmentStatusId === appointmentRequestStatus.REJECTED ?
                                                                <TextComponent style={{ alignSelf: 'center', color: colors.rejectedStatusColor }}>
                                                                    {strings.rejected}
                                                                </TextComponent>
                                                                :
                                                                item.appointmentStatusId === appointmentRequestStatus.PENDING ?
                                                                    <TextComponent style={{ alignSelf: 'center', color: colors.pendingStatusColor }}>
                                                                        {strings.pending}
                                                                    </TextComponent>
                                                                    :
                                                                    /* should never come */
                                                                    <TextComponent style={{ alignSelf: 'center', color: colors.rejectedStatusColor }}>
                                                                        {strings.not_available}
                                                                    </TextComponent>
                                                        }
                                                    </View>
                                                </View>
                                                <View style={[commonStyles.rowContainer, { marginTop: 3, justifyContent: 'space-between' }]}>
                                                    <TextComponent style={{ fontSize: 11 }}>
                                                        {item.appointmentDateTime ? parseDate(item.appointmentDateTime) :
                                                            item.appointmentStartDateTime ? parseDate(item.appointmentStartDateTime)
                                                                : ""}
                                                    </TextComponent>
                                                    <TextComponent style={{ fontSize: 11, }}>
                                                        {item.appointmentDateTime ? parseTime(item.appointmentDateTime) :
                                                            item.appointmentEndDateTime ? parseTimeWithoutUnit(item.appointmentStartDateTime)
                                                                + " - " + parseTime(item.appointmentEndDateTime)
                                                                : item.appointmentStartDateTime ? parseTime(item.appointmentStartDateTime)
                                                                    : ""}
                                                    </TextComponent>
                                                    <TextComponent style={{ fontSize: 11 }}>
                                                        {item.distance}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    }
                    style={styles.mainFlatList}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={
                        this.state.showNoBookedDeals ?
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginHorizontal: 20, textAlign: 'center' }}>
                                    {strings.no_booked_deals}
                                </TextComponent>
                            </View>
                            :
                            !this.state.isInternetConnected ?
                                <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                    <TextComponent style={{
                                        color: colors.greyTextColor, marginTop: 20, textAlign: 'center',
                                        marginHorizontal: 20
                                    }}>
                                        {strings.internet_not_connected}
                                    </TextComponent>
                                </View>
                                : <View />
                    }
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd == 0) {
                            return;
                        }
                        isNetworkConnected().then((isConnected) => {
                            if (isConnected) {
                                if (this.bookedDealsPaginationRequired && this.shouldHitPagination) {
                                    this.shouldHitPagination = false
                                    this.bookedDealsPageIndex++
                                    this.fetchMyBookedDeals()
                                }
                            } else {
                                alertDialog("", strings.internet_not_connected)
                            }
                        })
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        )
    }

    thirdScene = () => {
        return (
            <View style={commonStyles.container}>
                {/* Checked In Hot Deals view */}
                <FlatList
                    data={this.state.checkedInDeals}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View style={{
                            alignItems: 'center', marginBottom: index === this.state.checkedInDeals.length - 1 ? 10 : 0,
                        }}>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                marginStart: 0, marginEnd: 0, marginTop: 0
                            }]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            NetInfo.fetch().then(state => {
                                                if (state.isConnected) {
                                                    this.props.navigation.navigate(screenNames.MY_HOT_DEAL_DETAIL_SCREEN, {
                                                        DEAL_ID: item.dealId
                                                    })
                                                } else {
                                                    let temp = JSON.parse(JSON.stringify(item));
                                                    this.props.navigation.navigate(screenNames.SHOW_QR_CODE_SCREEN, {
                                                        CURRENT_DEAL: temp,
                                                    });
                                                }
                                            });
                                        }}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <ImageComponent
                                                    style={[commonStyles.productImage, {
                                                        resizeMode: 'cover',
                                                    }]}
                                                    source={{
                                                        uri: Platform.OS === constants.ANDROID ?
                                                            'file://' + item.imageLocalPath
                                                            : '' + item.imageLocalPath
                                                    }} />

                                                <TouchableWithoutFeedback
                                                    onPress={() => {
                                                        // Hiding info popup
                                                        /* this.setState({
                                                            showInfoPopup: true
                                                        }) */
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        position: 'absolute', backgroundColor: colors.timerBackground,
                                                        paddingHorizontal: 20, borderRadius: 20, paddingVertical: 5
                                                    }]}>
                                                        <TextComponent style={{ color: colors.white, fontSize: sizes.mediumTextSize }}>
                                                            {item.dealCount + " " + (item.dealCount === 1 ? strings.deal : strings.deals)}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableWithoutFeedback>
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={item.productType === itemTypes.BONUS_DEAL ?
                                                        require('../../assets/bonusBadge.png')
                                                        : require('../../assets/hotDeal.png')} />

                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={[commonStyles.cardBigTitleText, { left: 15 }]}>
                                                        {item.dealTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }]}>
                                                <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                    <View>
                                                        <TextComponent style={[commonStyles.cardBigDescriptionText, {
                                                            fontFamily: fontNames.boldFont,
                                                        }]}>
                                                            {parseTextForCard(item.businessName, 15)}
                                                        </TextComponent>
                                                        {item.isDiscounted ?
                                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles.greenTextColor, { fontSize: 13 }]}>
                                                                    {parseDiscountApplied(item.discount) + strings.percent_discount}
                                                                </TextComponent>
                                                            </View>
                                                            :
                                                            <TextComponent style={{ fontSize: 13, color: colors.greenTextColor, marginTop: 3 }}>
                                                                {item.dealOP ? getCurrencyFormat(item.dealOP) :
                                                                    (typeof item.dealOP == 'number') ? getCurrencyFormat(item.dealOP) : ""}
                                                            </TextComponent>
                                                        }
                                                    </View>
                                                    <View style={{ marginStart: 'auto', }}>
                                                        <ButtonComponent
                                                            isFillRequired={true}
                                                            style={styles.button}
                                                            fontStyle={{ fontSize: sizes.normalTextSize }}
                                                            onPress={() => {
                                                                let temp = JSON.parse(JSON.stringify(item))
                                                                this.props.navigation.navigate(screenNames.SHOW_QR_CODE_SCREEN, {
                                                                    CURRENT_DEAL: temp,
                                                                });
                                                            }}>
                                                            {strings.redeem}
                                                        </ButtonComponent>
                                                    </View>
                                                </View>
                                                <View style={[commonStyles.rowContainer, { marginTop: 3, justifyContent: 'space-between' }]}>
                                                    <TextComponent style={{ fontSize: 11 }}>
                                                        {item.productType === itemTypes.BONUS_DEAL ?
                                                            item.dealExpiredOn ? parseDate(item.dealExpiredOn) : ""
                                                            : item.appointmentDateTime ?
                                                                parseDate(item.appointmentDateTime) :
                                                                item.dealNextAvailableStartDateTime ? parseDate(item.dealNextAvailableStartDateTime) : ""
                                                        }
                                                    </TextComponent>

                                                    <TextComponent style={{ fontSize: 11, }}>
                                                        {item.productType === itemTypes.BONUS_DEAL ?
                                                            item.dealExpiredOn ? parseTime(item.dealExpiredOn) : ""
                                                            : item.appointmentDateTime ? parseTime(item.appointmentDateTime) :
                                                                item.dealNextAvailableStartDateTime ? parseTimeWithoutUnit(item.dealNextAvailableStartDateTime)
                                                                    + " - " + parseTime(item.dealNextAvailableEndDateTime)
                                                                    : ""
                                                        }
                                                    </TextComponent>
                                                    <TextComponent style={{ fontSize: 11, }}>
                                                        {getKmFromMeters(item.distance) + " km"}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    }
                    style={styles.mainFlatList}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={
                        this.state.showNoCheckedInDeals &&
                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                {strings.no_checked_in_deals}
                            </TextComponent>
                        </View>
                    }
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd == 0) {
                            return;
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        )
    }

    fourthScene = () => {
        return (
            <View style={commonStyles.container}>
                {/* Redeemed Hot Deals view */}
                <FlatList
                    data={this.state.redeemedDeals}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View style={{
                            alignItems: 'center', marginBottom: index === this.state.redeemedDeals.length - 1 ? 10 : 0
                        }}>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                marginStart: 0,
                                marginEnd: 0,
                                marginTop: 0
                            }]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            NetInfo.fetch().then(state => {
                                                if (state.isConnected) {
                                                    this.props.navigation.navigate(screenNames.MY_HOT_DEAL_DETAIL_SCREEN, {
                                                        DEAL_ID: item.dealId
                                                    })
                                                } else {
                                                    alertDialog("", strings.internet_not_connected)
                                                }
                                            });
                                        }}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.dealImage ? item.dealImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                <TouchableWithoutFeedback
                                                    onPress={() => {
                                                        // hiding info popup
                                                        /* this.setState({
                                                            showInfoPopup: true
                                                        }) */
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        position: 'absolute', backgroundColor: colors.timerBackground,
                                                        paddingHorizontal: 20, borderRadius: 20, paddingVertical: 5
                                                    }]}>
                                                        <TextComponent style={{ color: colors.white, fontSize: sizes.mediumTextSize }}>
                                                            {item.dealCount + " " + (item.dealCount === 1 ? strings.deal : strings.deals)}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableWithoutFeedback>
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={item.productType === itemTypes.BONUS_DEAL ?
                                                        require('../../assets/bonusBadge.png')
                                                        : require('../../assets/hotDeal.png')} />

                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={[commonStyles.cardBigTitleText, { left: 15 }]}>
                                                        {item.dealTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }]}>
                                                <View style={commonStyles.rowContainer}>
                                                    <View style={commonStyles.container}>
                                                        <TextComponent style={[commonStyles.cardBigDescriptionText, {
                                                            fontFamily: fontNames.boldFont,
                                                        }]}>
                                                            {parseTextForCard(item.businessName, 15)}
                                                        </TextComponent>

                                                        {item.isDiscounted ?
                                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles.greenTextColor, { fontSize: 13 }]}>
                                                                    {parseDiscountApplied(item.discount) + strings.percent_discount}
                                                                </TextComponent>
                                                            </View>
                                                            :
                                                            <TextComponent style={{ fontSize: 13, color: colors.greenTextColor, marginTop: 3 }}>
                                                                {item.dealOP ? getCurrencyFormat(item.dealOP) :
                                                                    (typeof item.dealOP == 'number') ? getCurrencyFormat(item.dealOP) : ""}
                                                            </TextComponent>
                                                        }

                                                        <View style={[commonStyles.rowContainer, { marginTop: 3, justifyContent: 'space-between', }]}>
                                                            <TextComponent style={{ fontSize: 11 }}>
                                                                {item.dealRedeemedOn ? parseDate(item.dealRedeemedOn) : ""}
                                                            </TextComponent>
                                                            <TextComponent style={{ fontSize: 11 }}>
                                                                {item.dealRedeemedOn ? parseTime(item.dealRedeemedOn) : ""}
                                                            </TextComponent>
                                                            <TextComponent style={{ fontSize: 11 }}>
                                                                {item.distance}
                                                            </TextComponent>
                                                        </View>
                                                    </View>

                                                    <TouchableOpacity
                                                        style={{ paddingVertical: 5 }}
                                                        onPress={() =>
                                                            this.deleteDeal(item.dealId)
                                                        }>
                                                        <ImageComponent
                                                            style={{ marginStart: 10, }}
                                                            source={require('../../assets/delete2.png')} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    }
                    style={styles.mainFlatList}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={
                        this.state.showNoRedeemedDeals ?
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginHorizontal: 20, textAlign: 'center' }}>
                                    {strings.no_redeemed_deals}
                                </TextComponent>
                            </View>
                            :
                            !this.state.isInternetConnected ?
                                <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                    <TextComponent style={{
                                        color: colors.greyTextColor, marginTop: 20, textAlign: 'center',
                                        marginHorizontal: 20
                                    }}>
                                        {strings.internet_not_connected}
                                    </TextComponent>
                                </View>
                                : <View />
                    }
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd == 0) {
                            return;
                        }
                        isNetworkConnected().then((isConnected) => {
                            if (isConnected) {
                                if (this.redeemedDealsPaginationRequired && this.shouldHitPagination) {
                                    this.shouldHitPagination = false
                                    this.redeemedDealsPageIndex++
                                    this.fetchMyRedeemedDeals()
                                }
                            } else {
                                // not showing here
                                // alertDialog("", strings.internet_not_connected)
                            }
                        })
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        )
    }

    fifthScene = () => {
        return (
            <View style={commonStyles.container}>
                {/* Expired Hot Deals view */}
                <FlatList
                    data={this.state.expiredDeals}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View style={{
                            alignItems: 'center', marginBottom: index === this.state.expiredDeals.length - 1 ? 10 : 0
                        }}>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                marginStart: 0,
                                marginEnd: 0,
                                marginTop: 0
                            }]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            NetInfo.fetch().then(state => {
                                                if (state.isConnected) {
                                                    this.props.navigation.navigate(screenNames.MY_HOT_DEAL_DETAIL_SCREEN, {
                                                        DEAL_ID: item.dealId
                                                    })
                                                } else {
                                                    alertDialog("", strings.internet_not_connected)
                                                }
                                            });
                                        }}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.dealImage ? item.dealImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                <TouchableWithoutFeedback
                                                    onPress={() => {
                                                        // hiding popup
                                                        /* this.setState({
                                                            showInfoPopup: true
                                                        }) */
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        position: 'absolute', backgroundColor: colors.timerBackground,
                                                        paddingHorizontal: 20, borderRadius: 20, paddingVertical: 5
                                                    }]}>
                                                        <TextComponent style={{ color: colors.white, fontSize: sizes.mediumTextSize }}>
                                                            {item.dealCount + " " + (item.dealCount === 1 ? strings.deal : strings.deals)}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableWithoutFeedback>
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={item.productType === itemTypes.BONUS_DEAL ?
                                                        require('../../assets/bonusBadge.png')
                                                        : require('../../assets/hotDeal.png')} />

                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={[commonStyles.cardBigTitleText, { left: 15 }]}>
                                                        {item.dealTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }]}>
                                                <View style={commonStyles.rowContainer}>
                                                    <View style={commonStyles.container}>
                                                        <TextComponent style={[commonStyles.cardBigDescriptionText, {
                                                            fontFamily: fontNames.boldFont,
                                                        }]}>
                                                            {parseTextForCard(item.businessName, 15)}
                                                        </TextComponent>
                                                        {item.isDiscounted ?
                                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles.greenTextColor, { fontSize: 13 }]}>
                                                                    {parseDiscountApplied(item.discount) + strings.percent_discount}
                                                                </TextComponent>
                                                            </View>
                                                            :
                                                            <TextComponent style={{ fontSize: 13, color: colors.greenTextColor, marginTop: 3 }}>
                                                                {item.dealOP ? getCurrencyFormat(item.dealOP) :
                                                                    (typeof item.dealOP == 'number') ? getCurrencyFormat(item.dealOP) : ""}
                                                            </TextComponent>
                                                        }
                                                        <View style={[commonStyles.rowContainer, { marginTop: 3, justifyContent: 'space-between' }]}>
                                                            <TextComponent style={{ fontSize: 11 }}>
                                                                {item.dealExpiredOn ? parseDate(item.dealExpiredOn) : ""}
                                                            </TextComponent>
                                                            <TextComponent style={{ fontSize: 11 }}>
                                                                {item.dealExpiredOn ? parseTime(item.dealExpiredOn) : ""}
                                                            </TextComponent>
                                                            <TextComponent style={{ fontSize: 11 }}>
                                                                {item.distance}
                                                            </TextComponent>
                                                        </View>
                                                    </View>

                                                    <TouchableOpacity
                                                        style={{ paddingVertical: 5 }}
                                                        onPress={() =>
                                                            this.deleteDeal(item.dealId)
                                                        }>
                                                        <ImageComponent
                                                            style={{ marginStart: 10, }}
                                                            source={require('../../assets/delete2.png')} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    }
                    style={styles.mainFlatList}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={
                        this.state.showNoExpiredDeals ?
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginHorizontal: 20, textAlign: 'center' }}>
                                    {strings.no_expired_deals}
                                </TextComponent>
                            </View>
                            :
                            !this.state.isInternetConnected ?
                                <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                    <TextComponent style={{
                                        color: colors.greyTextColor, marginTop: 20, textAlign: 'center',
                                        marginHorizontal: 20
                                    }}>
                                        {strings.internet_not_connected}
                                    </TextComponent>
                                </View>
                                : <View />
                    }
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd == 0) {
                            return;
                        }
                        isNetworkConnected().then((isConnected) => {
                            if (isConnected) {
                                if (this.expiredDealsPaginationRequired && this.shouldHitPagination) {
                                    this.shouldHitPagination = false
                                    this.expiredDealsPageIndex++
                                    this.fetchMyExpiredDeals()
                                }
                            } else {
                                // not showing here
                                // alertDialog("", strings.internet_not_connected)
                            }
                        })
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        )
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.my_hot_deals}
                    navigation={this.props.navigation}
                    isHomeScreen={this.comingFrom && this.comingFrom === screenNames.SPLASH_SCREEN} />
                <HeaderComponent
                    image={require('../../assets/myHotDealsHeader.png')} />

                {/* info popup */}
                {this.state.showInfoPopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={commonStyles.infoPopupView}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', padding: 10 }}
                                    onPress={() => {
                                        this.setState({ showInfoPopup: false })
                                    }}>
                                    <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                </TouchableOpacity>

                                <View style={{ marginBottom: 10, marginTop: 10 }}>
                                    <TextComponent
                                        style={{ alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                        {this.state.isBookedForInfo ?
                                            strings.booked_info_heading
                                            :
                                            this.state.productTypeForInfo === itemTypes.BONUS_DEAL ?
                                                strings.bonus_info_heading
                                                :
                                                this.state.isUnlimitedForInfo ?
                                                    strings.as_long_as_stock_lasts :
                                                    strings.limited_number_of_deals}
                                    </TextComponent>
                                    <TextComponent
                                        style={{ alignSelf: 'center', marginTop: 10 }}>
                                        {this.state.isBookedForInfo ?
                                            strings.booked_info_detail
                                            :
                                            this.state.productTypeForInfo === itemTypes.BONUS_DEAL ?
                                                strings.bonsu_info_detail
                                                :
                                                this.state.isUnlimitedForInfo ?
                                                    strings.unlimited_detail :
                                                    strings.limited_deals_detail}
                                    </TextComponent>
                                </View>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles.loginPopupButton}
                                    onPress={() => {
                                        this.setState({
                                            showInfoPopup: false
                                        })
                                    }}>
                                    {strings.done}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                {/* Enter count of deals popup */}
                {this.state.showEnterCountPopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', padding: 10 }}
                                    onPress={() => {
                                        this.setState({ showEnterCountPopup: false })
                                    }}>
                                    <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                </TouchableOpacity>

                                <View style={{ marginBottom: 10, marginTop: 10 }}>
                                    <TextComponent
                                        style={{ alignSelf: 'center', textAlign: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                        {strings.enter_no_of_deals_to_check_in + ":"}
                                    </TextComponent>
                                    <TextComponent
                                        style={{ alignSelf: 'center', marginTop: 5 }}>
                                        {"(" + strings.you_have_saved + " " + this.state.currentBookedDeal.dealCount + " " + strings.deals + ")"}
                                    </TextComponent>
                                    <TextInputComponent
                                        isBorderRequired={false}
                                        underlineColorAndroid={colors.transparent}
                                        keyboardType={"numeric"}
                                        style={{ marginTop: 10 }}
                                        placeholder={strings.enter_count}
                                        onChangeText={(text) => {
                                            this.selectedDealCount = text.trim()
                                            this.setState({
                                                dealCountError: ''
                                            })
                                        }} />
                                    <TextComponent style={commonStyles.errorText}>{this.state.dealCountError}</TextComponent>
                                </View>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles.loginPopupButton}
                                    onPress={() => {
                                        if (this.selectedDealCount.length == 0) {
                                            this.setState({
                                                dealCountError: strings.enter_deal_count
                                            })
                                        } else if (!constants.MOBILE_REGULAR_EXPRESSION.test(this.selectedDealCount)) {
                                            this.setState({
                                                dealCountError: strings.enter_valid_deal_count
                                            })
                                        } else {
                                            let dealCount = parseInt(this.selectedDealCount)
                                            if (dealCount > this.state.currentBookedDeal.dealCount) {
                                                this.setState({
                                                    dealCountError: strings.you_can_choose_max + " " + this.state.currentBookedDeal.dealCount + " " + strings.max_deals
                                                })
                                            } else if (dealCount < 1) {
                                                this.setState({
                                                    dealCountError: strings.choose_at_least_one
                                                })
                                            } else {
                                                this.setState({
                                                    showEnterCountPopup: false
                                                }, () => {
                                                    this.checkForLocation(this.state.currentBookedDeal, dealCount)
                                                })
                                            }
                                        }
                                    }}>
                                    {strings.done}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                {/* Redeem done Popup */}
                {this.state.showRedeemDonePopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                                <View style={{ marginBottom: 10, marginTop: 10, }}>
                                    <ImageComponent
                                        style={{ alignSelf: 'center' }}
                                        source={this.state.isRedeemSuccess ?
                                            require('../../assets/redeemSuccess.png')
                                            : require('../../assets/redeemFail.png')} />
                                    <TextComponent style={{
                                        fontSize: 20, fontFamily: fontNames.boldFont,
                                        color: this.state.isRedeemSuccess ? colors.green : colors.red,
                                        alignSelf: 'center', marginTop: 10, textAlign: 'center'
                                    }}>
                                        {this.state.redeemMessage}
                                    </TextComponent>
                                </View>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles.loginPopupButton}
                                    onPress={() => {
                                        this.setState({
                                            showRedeemDonePopup: false
                                        }, () => {
                                            this.onPullToRefresh();
                                        })
                                    }}>
                                    {strings.done}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                {/* show check in failed popup */}
                {this.state.showCheckInFailedPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={commonStyles.infoPopupView}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showCheckInFailedPopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                            </TouchableOpacity>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', color: colors.primaryColor,
                                    fontSize: sizes.xLargeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center'
                                }}>
                                {strings.check_in_failed}
                            </TextComponent>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', fontSize: sizes.normalTextSize, textAlign: 'center',
                                    marginTop: 10
                                }}>
                                {strings.you_can_only_check_in}
                            </TextComponent>
                            {this.state.scheduleType == scheduleTypes.DAYS &&
                                <View style={{ marginTop: 5 }}>
                                    <TextComponent style={{ alignSelf: 'center', }}>
                                        {this.state.schedulerRedemptionStartDate ?
                                            (strings.from + " " +
                                                parseDate(this.state.schedulerRedemptionStartDate)
                                                + " " + strings.to + " " +
                                                parseDate(this.state.schedulerRedemptionEndDate))
                                            : ""}
                                    </TextComponent>
                                    <TextComponent style={{ alignSelf: 'center', marginTop: 5 }}>
                                        {strings.on_following_days}
                                    </TextComponent>
                                </View>
                            }
                            <FlatList
                                data={this.state.schedulerData}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.rowContainer, { marginBottom: 10, marginStart: 20, marginEnd: 20 }]}>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont }}>
                                            {
                                                this.state.scheduleType == scheduleTypes.DAYS ?
                                                    index > 0 ?
                                                        this.state.schedulerData[index - 1].scheduleDay == item.scheduleDay ?
                                                            "" : strings.days_of_week[item.scheduleDay - 1]
                                                        :
                                                        strings.days_of_week[item.scheduleDay - 1]
                                                    :
                                                    parseDate(item.startTime)
                                            }
                                        </TextComponent>

                                        <View style={[commonStyles.rowContainer, { marginStart: 'auto' }]}>
                                            <TextComponent>{parseTimeWithoutUnit(item.startTime) + " - "}</TextComponent>
                                            <TextComponent>{parseTime(item.endTime)}</TextComponent>
                                        </View>
                                    </View>
                                }
                                style={commonStyles.infoFlatList}
                                keyExtractor={(item, index) => index.toString()}
                            />
                            <ButtonComponent
                                isFillRequired={true}
                                style={commonStyles.loginPopupButton}
                                onPress={() => {
                                    this.setState({
                                        showCheckInFailedPopup: false
                                    })
                                }}>
                                {strings.done}
                            </ButtonComponent>
                        </View>
                    </View>
                </Modal>
                }

                {/* show check in failed popup */}
                {this.state.showCheckInFailedBookedPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showCheckInFailedBookedPopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                            </TouchableOpacity>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', color: colors.primaryColor,
                                    fontSize: sizes.xLargeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center'
                                }}>
                                {strings.check_in_failed}
                            </TextComponent>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', textAlign: 'center',
                                    marginTop: 10
                                }}>
                                {strings.you_have_made_appointment + " " +
                                    parseDateTime(this.state.schedulerAppointmentDateTime) + "."}
                            </TextComponent>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', textAlign: 'center',
                                    marginTop: 5
                                }}>
                                {strings.check_in_30_min_before}
                            </TextComponent>

                            <ButtonComponent
                                isFillRequired={true}
                                style={commonStyles.loginPopupButton}
                                onPress={() => {
                                    this.setState({
                                        showCheckInFailedBookedPopup: false
                                    })
                                }}>
                                {strings.done}
                            </ButtonComponent>
                        </View>
                    </View>
                </Modal>
                }

                {/* check in success popup */}
                {this.state.showCheckInDonePopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                                <View style={{ marginBottom: 10, marginTop: 10 }}>
                                    <TextComponent
                                        style={{ alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                        {strings.check_in_successful}
                                    </TextComponent>
                                    <TextComponent
                                        style={{ alignSelf: 'center', marginTop: 10 }}>
                                        {strings.press_redeem_and_show}
                                    </TextComponent>
                                </View>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles.loginPopupButton}
                                    onPress={() => {
                                        this.setState({
                                            showCheckInDonePopup: false
                                        }, () => {
                                            // Reload all data
                                            this.onPullToRefresh();
                                            // this.indicatorViewPagerRef.setPage(2)
                                        })
                                    }}>
                                    {strings.done}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                <View style={[commonStyles.container, { marginTop: 10 }]}>
                    <TabView
                        // style={{ width: '100%', height: '100%', flexDirection: 'column-reverse', backgroundColor: 'white' }}
                        // indicator={
                        //     <PagerTitleIndicator
                        //         titles={[strings.bonus, strings.reserved, strings.checked_in, strings.redeemed, strings.expired]}
                        //         style={{ backgroundColor: colors.white }}
                        //         itemStyle={{ width: this.screenDimensions.width / 3.5 }}
                        //         selectedItemStyle={{ width: this.screenDimensions.width / 3.5 }}
                        //         itemTextStyle={styles.indicatorText}
                        //         selectedItemTextStyle={styles.indicatorSelectedText}
                        //         selectedBorderStyle={styles.indicatorBorder}
                        //     />
                        // }
                        // ref={(ref) => this.indicatorViewPagerRef = ref}
                        onIndexChange={index => this.setState({ index })}
                        navigationState={this.state.tabs}
                        renderTabBar={props => (
                            <TabBar
                                {...props}
                                scrollEnabled
                                activeColor={colors.primaryColor}
                                inactiveColor={colors.greyTextColor}
                                indicatorStyle={{ backgroundColor: colors.primaryColor }}
                                style={{ backgroundColor: colors.transparent }}
                                tabStyle={{
                                    width: 120
                                }}
                            />
                        )}
                        renderScene={({ route }) => {
                            switch (route.key) {
                                case 'first': return this.firstScene();
                                case 'second': return this.secondScene();
                                case 'third': return this.thirdScene();
                                case 'fourth': return this.fourthScene()
                                case 'fifth': return this.fifthScene()
                            }
                        }}
                    />
                </View>
            </View>
        );
    }

    initRealm = (callPulltoRefresh) => {
        console.log("realmOpen---")
        Realm.open({
            schema: [ProductMenuSchema, ProductSchedulerSchema, DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                this.realm = realm
                if (callPulltoRefresh) {
                    if (!this.isFirstTime && !this.state.pullToRefreshWorking) {
                        this.onPullToRefresh();
                    }
                    this.isFirstTime = false
                }
            })
            .catch(error => {
                alertDialog("", error);
            });
    }

    componentDidMount() {
        AppState.addEventListener('change', this._handleAppStateChange);
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                if (this.realm != null && this.realm.isClosed) {
                    this.initRealm(true)
                } else {
                    if (!this.isFirstTime && !this.state.pullToRefreshWorking) {
                        this.onPullToRefresh();
                    }
                    this.isFirstTime = false
                }
            }
        );

        AsyncStorageHelper.getStringAsync(constants.COORDINATES)
            .then((strCoordinates) => {
                const coordinates = JSON.parse(strCoordinates);

                this.currentLatitude = coordinates.latitude
                this.currentLongitude = coordinates.longitude

                this.checkIfPermissionGranted();
            })

        if (this.comingFrom && (this.comingFrom === screenNames.SPLASH_SCREEN ||
            this.comingFrom === screenNames.HOT_DEAL_DETAIL_SCREEN)) {
            // setTimeout(() => {

            //     if (this.indicatorViewPagerRef != null && this.indicatorViewPagerRef != undefined) {
            //         this.indicatorViewPagerRef.setPage(2)
            //     }

            // }, 600)
        }
    }

    componentWillUnmount() {
        AppState.addEventListener('change', this._handleAppStateChange);
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }

        console.log("componeWillUnmount--")
        // if (this.realm !== null && !this.realm.isClosed) {
        //     this.realm.close();
        // }
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active' && this.isComingFromSettings) {
            console.log("realm------")
            this.isComingFromSettings = false
            this.checkIfPermissionGranted();
        }
    };

    // pull to refresh handler
    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
            activeDeals: [],
            bookedDeals: [],
            checkedInDeals: [],
            redeemedDeals: [],
            expiredDeals: [],
            showNoSavedDeals: false,
            showNoBookedDeals: false,
            showNoCheckedInDeals: false,
            showNoRedeemedDeals: false,
            showNoExpiredDeals: false,
        }, () => {
            this.shouldHitPagination = true

            this.activeDealsPageIndex = 1
            this.activeDealsPaginationRequired = true
            this.bookedDealsPageIndex = 1
            this.bookedDealsPaginationRequired = true
            this.checkedInDealsPageIndex = 1
            this.checkedInDealsPaginationRequired = true
            this.redeemedDealsPageIndex = 1
            this.redeemedDealsPaginationRequired = true
            this.expiredDealsPageIndex = 1
            this.expiredDealsPaginationRequired = true

            this.fetchOfflineDeals()
        })
    }

    showModalLoader = (shouldShow) => {
        if (shouldShow) {
            this.setState({
                showModalLoader: shouldShow,
            })
        } else {
            this.setState({
                showModalLoader: shouldShow,
                pullToRefreshWorking: false,
            })
        }
    }

    // get Active deals API
    fetchMyActiveDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealStatusId: dealStatuses.SAVED,
                searchText: null,
                pageIndex: this.activeDealsPageIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
                lat: this.currentLatitude,
                lng: this.currentLongitude,
            }
            console.log("-paramsss---", params)
            hitApi(urls.GET_DEALS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.activeDealsPaginationRequired = false
                }

                setTimeout(() => {
                    let tempArray = this.state.activeDeals
                    tempArray.push(...jsonResponse.response.data)
                    this.setState({
                        pullToRefreshWorking: false,
                        activeDeals: tempArray,
                        showNoSavedDeals: true,
                    }, () => {
                        this.shouldHitPagination = true
                        this.checkIfSavedDealsExpired()
                    })
                }, constants.HANDLING_TIMEOUT)
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // check if any active deal expired
    checkIfSavedDealsExpired = () => {
        let currentDateTime = new Date();

        let offset = getExactTimeOffset()
        currentDateTime.setMinutes(currentDateTime.getMinutes() + offset)

        for (let i = 0; i < this.state.activeDeals.length; i++) {
            let deal = this.state.activeDeals[i]

            if (deal.productType === itemTypes.BONUS_DEAL) {
                let expiryDate = new Date(deal.dealExpiredOn);

                if (currentDateTime.getTime() > expiryDate.getTime()) {
                    // bonus deal expired
                    // DateTimeChange - Changing From UTC Date time to Local Date Time
                    // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(expiryDate);
                    let utcExpiredOn = getUTCDateTimeFromLocalDateTime(expiryDate);

                    this.dealExpired(deal.dealId, utcExpiredOn, false, deal.dealTitle);
                    break;
                }
            } else {
                let endDateTime;
                let dealExpired = false;

                if (deal.dealNextAvailableStartDateTime) {
                    endDateTime = new Date(deal.dealNextAvailableEndDateTime);
                } else {
                    // it should happen when the last date time has passed
                    // deal expired
                    dealExpired = true
                }

                if (dealExpired) {
                    // DateTimeChange - Changing From UTC Date time to Local Date Time
                    // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(new Date());
                    let utcExpiredOn = getUTCDateTimeFromLocalDateTime(new Date());

                    this.dealExpired(deal.dealId, utcExpiredOn, false, deal.dealTitle);
                    break;
                } else {
                    let originalEndDateTime = new Date(endDateTime)
                    endDateTime.setMinutes(endDateTime.getMinutes() + constants.EXTENSION_MINUTES)

                    if (currentDateTime.getTime() > endDateTime.getTime()) {
                        // deal expired
                        // DateTimeChange - Changing From UTC Date time to Local Date Time
                        // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(originalEndDateTime);
                        let utcExpiredOn = getUTCDateTimeFromLocalDateTime(originalEndDateTime);

                        this.dealExpired(deal.dealId, utcExpiredOn, false, deal.dealTitle);
                        break;
                    }
                }
            }
        }
    }

    // get Booked deals api
    fetchMyBookedDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealStatusId: dealStatuses.BOOKED,
                searchText: null,
                pageIndex: this.bookedDealsPageIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
                lat: this.currentLatitude,
                lng: this.currentLongitude,
            }

            hitApi(urls.GET_DEALS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.bookedDealsPaginationRequired = false
                }

                setTimeout(() => {
                    let tempArray = this.state.bookedDeals
                    tempArray.push(...jsonResponse.response.data)
                    this.setState({
                        pullToRefreshWorking: false,
                        bookedDeals: tempArray,
                        showNoBookedDeals: true,
                    }, () => {
                        this.shouldHitPagination = true
                        this.checkIfBookedDealsExpired()
                    })
                }, constants.HANDLING_TIMEOUT)
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // check if any booked deal expired
    checkIfBookedDealsExpired = () => {
        let currentDateTime = new Date();

        let offset = getExactTimeOffset()
        currentDateTime.setMinutes(currentDateTime.getMinutes() + offset)

        for (let i = 0; i < this.state.bookedDeals.length; i++) {
            let deal = this.state.bookedDeals[i]

            if (deal.appointmentStatusId === appointmentRequestStatus.APPROVED) {
                let endDateTime = new Date(deal.appointmentDateTime);
                let originalEndDateTime = new Date(deal.appointmentDateTime)
                endDateTime.setMinutes(endDateTime.getMinutes() + constants.APPOINTMENT_EXTENSION_MINUTES)

                if (currentDateTime.getTime() > endDateTime.getTime()) {
                    // deal expired
                    // DateTimeChange - Changing From UTC Date time to Local Date Time
                    // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(originalEndDateTime);
                    let utcExpiredOn = getUTCDateTimeFromLocalDateTime(originalEndDateTime);

                    this.dealExpired(deal.dealId, utcExpiredOn, false, deal.dealTitle);
                    break;
                }
            }
        }
    }

    // get offline deals from local db
    fetchOfflineDeals = () => {
        console.log("realm " + this.realm.isClosed);
        const savedDeals = this.realm.objects(databaseConstants.DEALS_SCHEMA);
        console.log("offline " + JSON.stringify(savedDeals));

        // check if internet available
        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                // check if any pending data to sync
                let syncDeal = [];
                let dealsToDelete = [];
                let remainingDeals = [];

                savedDeals.forEach(savedDeal => {
                    if (savedDeal.dealStatusId != dealStatuses.CHECKED_IN) {
                        let deal = {
                            redeemedCode: savedDeal.dealRedeemedCode,
                            dealStatusId: savedDeal.dealStatusId,
                            redeemedOn: savedDeal.redeemedOn,
                            expiredOn: savedDeal.expiredOn
                        }
                        syncDeal.push(deal);
                        dealsToDelete.push(savedDeal);
                    } else {
                        remainingDeals.push(savedDeal);
                    }
                });

                if (syncDeal.length > 0) {
                    // sync deals & delete them
                    this.hitSyncDealsApi(syncDeal, dealsToDelete, remainingDeals)
                } else {
                    // nothing to sync
                    this.getAllDeals(savedDeals);
                }
            } else {
                // no internet, show offline data
                this.populateLocalData(savedDeals);
                this.setState({
                    isInternetConnected: false
                })
            }
        });
    }

    getAllDeals = (savedDeals) => {
        this.populateLocalData(savedDeals);
        this.fetchMyActiveDeals()
        this.fetchMyBookedDeals()
        this.fetchMyRedeemedDeals()
        this.fetchMyExpiredDeals()
    }

    populateLocalData = (savedDeals) => {
        let checkedInDealsArray = []
        let redeemedDealsArray = []
        let expiredDealsArray = []

        savedDeals.forEach(savedDeal => {
            // calculate distance
            let distance = getDistance(
                { latitude: this.currentLatitude, longitude: this.currentLongitude },
                { latitude: savedDeal.productLat, longitude: savedDeal.productLng }
            );
            savedDeal.distance = distance

            if (savedDeal.dealStatusId == dealStatuses.CHECKED_IN) {
                checkedInDealsArray.push(savedDeal)
            } else if (savedDeal.dealStatusId == dealStatuses.REDEEMED) {
                savedDeal.distance = getKmFromMeters(savedDeal.distance) + " km"
                redeemedDealsArray.push(savedDeal)
            } else if (savedDeal.dealStatusId == dealStatuses.EXPIRED) {
                savedDeal.distance = getKmFromMeters(savedDeal.distance) + " km"
                expiredDealsArray.push(savedDeal)
            } else {
                // should never happen
                alert("", strings.something_went_wrong);
            }
        });

        // sort on the basis of distance
        checkedInDealsArray.sort(compareCheckedInDeals)
        redeemedDealsArray.sort(compareRedeemedDeals)
        expiredDealsArray.sort(compareExpiredDeals)

        this.setState({
            pullToRefreshWorking: false,
            checkedInDeals: checkedInDealsArray,
            redeemedDeals: redeemedDealsArray,
            expiredDeals: expiredDealsArray,
            showNoCheckedInDeals: true,
        }, () => {


            this.checkIfCheckedInDealsExpired()
        })
    }

    // api to sync deals
    hitSyncDealsApi = (syncDeal, dealsToDelete, remainingDeals) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                syncDeal
            }

            hitApi(urls.SYNC_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.realm.write(() => {
                    this.realm.delete(dealsToDelete);
                });
                this.getAllDeals(remainingDeals)
            }, (jsonResponse) => {
                this.getAllDeals(remainingDeals)
            })
        })
    }

    // check if any checked-in deal expired
    checkIfCheckedInDealsExpired = () => {
        let currentDateTime = new Date();

        let offset = getExactTimeOffset()
        currentDateTime.setMinutes(currentDateTime.getMinutes() + offset)

        for (let i = 0; i < this.state.checkedInDeals.length; i++) {
            let deal = this.state.checkedInDeals[i]

            if (deal.productType === itemTypes.BONUS_DEAL) {
                let expiryDate = new Date(deal.dealExpiredOn);

                if (currentDateTime.getTime() > expiryDate.getTime()) {
                    // bonus deal expired
                    this.handleDealExpired(deal.dealId, expiryDate, deal.dealTitle);
                }
            } else {
                let endDateTime;

                if (deal.appointmentDateTime) {
                    endDateTime = new Date(deal.appointmentDateTime);
                } else {
                    endDateTime = new Date(deal.dealNextAvailableEndDateTime);
                }
                let originalEndDateTime = new Date(endDateTime)
                endDateTime.setMinutes(endDateTime.getMinutes() + constants.REDEEM_END_EXTENSION_MINUTES)

                if (currentDateTime.getTime() > endDateTime.getTime()) {
                    // deal expired
                    this.handleDealExpired(deal.dealId, originalEndDateTime, deal.dealTitle);
                }
            }
        }
    }

    // api to delete deal
    deleteDeal = (id) => {
        alertDialog("", strings.confirm_delete_deal, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    dealId: id
                }

                hitApi(urls.DELETE_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    setTimeout(() => {
                        this.onPullToRefresh()
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    // api to get redeemed deals
    fetchMyRedeemedDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealStatusId: dealStatuses.REDEEMED,
                searchText: null,
                pageIndex: this.redeemedDealsPageIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
                lat: this.currentLatitude,
                lng: this.currentLongitude,
            }

            hitApi(urls.GET_DEALS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.redeemedDealsPaginationRequired = false
                }

                let tempArray = this.state.redeemedDeals
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    redeemedDeals: tempArray,
                    showNoRedeemedDeals: true,
                }, () => {
                    this.shouldHitPagination = true
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // api to get expired deals
    fetchMyExpiredDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealStatusId: dealStatuses.EXPIRED,
                searchText: null,
                pageIndex: this.expiredDealsPageIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
                lat: this.currentLatitude,
                lng: this.currentLongitude,
            }

            hitApi(urls.GET_DEALS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.expiredDealsPaginationRequired = false
                }

                let tempArray = this.state.expiredDeals
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    expiredDeals: tempArray,
                    showNoExpiredDeals: true,
                }, () => {
                    this.shouldHitPagination = true
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // check location permission
    checkIfPermissionGranted() {
        if (Platform.OS == constants.ANDROID) {
            if (Platform.Version >= 23) {
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                    .then(response => {
                        if (response == true) {
                            this.onPullToRefresh();
                        } else {
                            this.requestPermission();
                        }
                    });
            } else {
                this.onPullToRefresh();
            }
        } else {
            this.onPullToRefresh();
        }
    }

    // ask for location permission
    requestPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: strings.permission_title,
                    message: strings.permission_message,
                    buttonPositive: strings.ok,
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                this.onPullToRefresh();
            } else {
                alertDialog(strings.permission_title, strings.permission_must, strings.ok, "", () => {
                    this.isComingFromSettings = true
                    Linking.openSettings();
                })
            }
        } catch (err) {
            console.log("Request permission error " + err.toString());
        }
    }

    // get latest location
    checkForLocation(deal, dealCount) {
        this.setState({
            showModalLoader: true
        }, () => {
            Geolocation.getCurrentPosition(
                (position) => {
                    this.setState({
                        showModalLoader: false
                    }, () => {
                        this.currentLatitude = position.coords.latitude
                        this.currentLongitude = position.coords.longitude

                        // save/update position in async storage
                        AsyncStorageHelper.saveStringAsync(constants.COORDINATES, JSON.stringify(position.coords))
                        // should be in x meters range
                        this.distance = getDistance(
                            { latitude: this.currentLatitude, longitude: this.currentLongitude },
                            { latitude: deal.productLat, longitude: deal.productLng }
                        );

                        this.validateCheckIn(deal, dealCount)
                    })
                },
                (error) => {
                    this.setState({
                        showModalLoader: false
                    }, () => {
                        if (error.code == 1) {
                            if (Platform.OS === constants.IOS) {
                                alertDialog(strings.permission_title, strings.permission_must, strings.ok, "", () => {
                                    this.isComingFromSettings = true
                                    Linking.openSettings();
                                })
                            }
                        }
                        if (error.code == 2) {
                            if (Platform.OS === constants.IOS) {
                                this.isComingFromSettings = true
                                Linking.openSettings();
                            } else {
                                alertDialog(strings.permission_title, strings.location_off, strings.ok, "", () => {
                                    this.checkForLocation(deal, dealCount);
                                })
                            }
                        }
                        if (error.code == 5) {
                            if (Platform.OS === constants.ANDROID) {
                                alertDialog(strings.permission_title, strings.location_off, strings.ok, "", () => {
                                    this.checkForLocation(deal, dealCount);
                                })
                            }
                        }
                    })
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, }
            );
        })
    }

    // check whether to allow check in
    validateCheckIn = (deal, dealCount) => {
        let currentDateTime = new Date();

        let offset = getExactTimeOffset()
        currentDateTime.setMinutes(currentDateTime.getMinutes() + offset)

        if (deal.productType === itemTypes.BONUS_DEAL) {
            let expiryDate = new Date(deal.dealExpiredOn);

            if (currentDateTime.getTime() > expiryDate.getTime()) {
                // bonus deal expired
                // DateTimeChange - Changing From UTC Date time to Local Date Time
                // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(expiryDate);
                let utcExpiredOn = getUTCDateTimeFromLocalDateTime(expiryDate);

                this.dealExpired(deal.dealId, utcExpiredOn, false, deal.dealTitle);
            } else {
                if (this.distance > constants.DISTANCE_FOR_CHECK_IN) {
                    alertDialog("", strings.you_can_check_in_within)
                } else {
                    this.checkInHotDeal(deal.dealId, dealCount)
                }
            }
        } else {
            let startDateTime;
            let endDateTime;

            let dealExpired = false;

            if (deal.dealStatusId == dealStatuses.BOOKED) {
                startDateTime = new Date(deal.appointmentDateTime);
                endDateTime = new Date(deal.appointmentDateTime);
            } else if (deal.dealNextAvailableStartDateTime) {
                startDateTime = new Date(deal.dealNextAvailableStartDateTime);
                endDateTime = new Date(deal.dealNextAvailableEndDateTime);
            } else {
                // it should happen when the last date time has passed
                // deal expired
                dealExpired = true
            }

            if (dealExpired) {
                // DateTimeChange - Changing From UTC Date time to Local Date Time
                // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(new Date());
                let utcExpiredOn = getUTCDateTimeFromLocalDateTime(new Date());

                this.dealExpired(deal.dealId, utcExpiredOn, false, deal.dealTitle);
            } else {
                let originalEndDateTime = new Date(endDateTime)

                if (deal.dealStatusId == dealStatuses.BOOKED) {
                    startDateTime.setMinutes(startDateTime.getMinutes() - constants.APPOINTMENT_EXTENSION_MINUTES)
                    endDateTime.setMinutes(endDateTime.getMinutes() + constants.APPOINTMENT_EXTENSION_MINUTES)
                } else {
                    startDateTime.setMinutes(startDateTime.getMinutes() - constants.EXTENSION_MINUTES)
                    endDateTime.setMinutes(endDateTime.getMinutes() + constants.EXTENSION_MINUTES)
                }

                if (currentDateTime.getTime() > endDateTime.getTime()) {
                    // deal expired
                    // DateTimeChange - Changing From UTC Date time to Local Date Time
                    // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(originalEndDateTime);
                    let utcExpiredOn = getUTCDateTimeFromLocalDateTime(originalEndDateTime);

                    this.dealExpired(deal.dealId, utcExpiredOn, false, deal.dealTitle);
                } else if (checkIfDateIsInRange(currentDateTime, startDateTime, endDateTime)) {
                    if (this.distance > constants.DISTANCE_FOR_CHECK_IN) {
                        alertDialog("", strings.you_can_check_in_within)
                    } else {
                        this.checkInHotDeal(deal.dealId, dealCount)
                    }
                } else {
                    this.fetchDealDetails(deal.dealId)
                }
            }
        }
    }

    // api to check-in deal
    checkInHotDeal = (dealId, dealForCheckIn) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId,
                dealForCheckIn,
                lat: this.currentLatitude,
                lng: this.currentLongitude,
                timeOffset: getTimeOffset(),
            }

            this.setState({
                showModalLoader: true
            }, () => {
                hitApi(urls.CHECK_IN_DEAL, urls.POST, params, null, (jsonResponse) => {
                    // save it offline
                    let response = jsonResponse.response.data[0];
                    let checkedInDeal;
                    this.realm.write(() => {
                        checkedInDeal = this.realm.create(databaseConstants.DEALS_SCHEMA, {
                            dealId: response.dealId,
                            productId: response.productId,
                            dealTitle: response.dealTitle,
                            dealDetails: response.dealDetails,
                            dealConditions: response.dealConditions,
                            dealMRP: response.dealMRP,
                            dealOP: response.dealOP,
                            dealRedemptionStartDate: response.dealRedemptionStartDate,
                            dealRedemptionEndDate: response.dealRedemptionEndDate,
                            dealRedeemedCode: response.dealRedeemedCode,
                            dealRedeemedOn: response.dealRedeemedOn,
                            dealLat: response.dealLat + "",
                            dealLng: response.dealLng + "",
                            dealAddress: response.dealAddress,
                            dealAppointmentId: response.dealAppointmentId,
                            appointmentDateTime: response.appointmentDateTime,
                            appointmentStatusId: response.appointmentStatusId,
                            dealImage: response.dealImage,
                            dealStatusId: response.dealStatusId,
                            dealAddedOn: response.dealAddedOn,
                            currentUTCDateTime: response.currentUTCDateTime,
                            businessId: response.businessId,
                            businessName: response.businessName,
                            businessAddress: response.businessAddress,
                            businessPhoneNumber: response.businessPhoneNumber,
                            dealNextAvailableStartDateTime: response.dealNextAvailableStartDateTime,
                            dealNextAvailableEndDateTime: response.dealNextAvailableEndDateTime,
                            dealCount: response.dealCount,
                            hotDealLeft: response.hotDealLeft,
                            scheduleType: response.scheduleType,
                            productLat: response.productLat + "",
                            productLng: response.productLng + "",
                            productScheduler: response.productScheduler,
                            productMenu: response.productMenu,
                            productIsHotDealUnlimited: response.productIsHotDealUnlimited,
                            imageLocalPath: null,
                            productType: response.productType,
                            dealExpiredOn: response.dealExpiredOn,
                            isDiscounted: response.isDiscounted,
                            discount: response.discount,
                        });
                    });

                    // download image
                    ReactNativeBlobUtil
                        .config({
                            fileCache: true,
                            appendExt: 'png'
                        })
                        .fetch('GET', response.dealImage, {
                            // headers if required
                        })
                        .then((res) => {
                            console.log('The file saved to ', res.path())
                            this.realm.write(() => {
                                checkedInDeal.imageLocalPath = res.path();
                            });
                            this.setState({
                                showModalLoader: false
                            }, () => {
                                setTimeout(() => {
                                    this.setState({
                                        showCheckInDonePopup: true
                                    })
                                }, constants.HANDLING_TIMEOUT)
                            })
                        })
                        .catch((error) => {
                            this.setState({
                                showModalLoader: false
                            }, () => {
                                setTimeout(() => {
                                    alertDialog("", error.message)
                                }, constants.HANDLING_TIMEOUT)
                            })
                        });
                }, (jsonResponse) => {
                    this.setState({
                        showModalLoader: false
                    }, () => {
                        handleErrorResponse(this.props.navigation, jsonResponse)
                    })
                })
            })
        })
    }

    // show popup with max limit reached text
    showMaxLimitReachedPopup = () => {
        let duration = this.state.product.dealDuration == productDuration.DAILY ? "1"
            : this.state.product.dealDuration == productDuration.WEEKLY ? "7"
                : this.state.product.dealDuration == productDuration.MONTHLY ? "30"
                    : "365"
        let strMessage = strings.provider_has_limited + " " + this.state.product.productNoOfDealsPerUser
            + " " + strings.deals_within + " " + duration + " " + strings.already_saved_booked_max
        alertDialog("", strMessage)
    }

    // handle when deal is expired
    handleDealExpired = (dealId, endDateTime, dealTitle) => {
        NetInfo.fetch().then(state => {
            // DateTimeChange - Changing From UTC Date time to Local Date Time
            // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(endDateTime);
            let utcExpiredOn = getUTCDateTimeFromLocalDateTime(endDateTime);

            if (state.isConnected) {
                this.dealExpired(dealId, utcExpiredOn, true, dealTitle)
            } else {
                // mark local as expired
                this.setState({
                    checkedInDeals: [],
                    redeemedDeals: [],
                    expiredDeals: [],
                }, () => {
                    this.realm.write(() => {
                        let currentSavedDeals = this.realm.objects(databaseConstants.DEALS_SCHEMA).filtered('dealId = ' + dealId);
                        if (currentSavedDeals && currentSavedDeals.length == 1) {
                            currentSavedDeals[0].dealStatusId = dealStatuses.EXPIRED;
                            currentSavedDeals[0].dealExpiredOn = getISODateTimeFromLocalDateTime(endDateTime);
                            currentSavedDeals[0].expiredOn = utcExpiredOn;
                        } else {
                            // should never happen
                            alertDialog("", strings.deal_not_found)
                        }
                    });
                })

                let redeemMessage = strings.the_deal + dealTitle + strings.deal_has_expired
                this.setState({
                    isRedeemSuccess: false,
                    redeemMessage,
                    showRedeemDonePopup: true
                });
            }
        });
    }

    // api to expire deal
    dealExpired = (dealId, utcExpiredOn, isCheckedIn, dealTitle) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId,
                dealStatusId: dealStatuses.EXPIRED,
                actionTakenOn: utcExpiredOn,
            }

            hitApi(urls.MANAGE_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.setState({
                    checkedInDeals: []
                }, () => {
                    if (isCheckedIn) {
                        this.realm.write(() => {
                            let currentDeal = this.realm.objects(databaseConstants.DEALS_SCHEMA).filtered('dealId = ' + dealId);
                            this.realm.delete(currentDeal);
                        });
                    }

                    setTimeout(() => {
                        let redeemMessage = strings.the_deal + dealTitle + strings.deal_has_expired
                        this.setState({
                            isRedeemSuccess: false,
                            redeemMessage,
                            showRedeemDonePopup: true
                        })
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    // api to get deal's details
    fetchDealDetails = (dealId) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId,
                timeOffset: getTimeOffset(),
            }

            hitApi(urls.GET_DEAL_DETAIL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                let deal = jsonResponse.response.data[0];
                if (deal.dealStatusId == dealStatuses.BOOKED) {
                    setTimeout(() => {
                        this.setState({
                            schedulerAppointmentDateTime: deal.appointmentDateTime,
                            showCheckInFailedBookedPopup: true
                        })
                    }, constants.HANDLING_TIMEOUT)
                } else {
                    setTimeout(() => {
                        this.setState({
                            scheduleType: deal.scheduleType,
                            schedulerRedemptionStartDate: deal.dealRedemptionStartDate,
                            schedulerRedemptionEndDate: deal.dealRedemptionEndDate,
                            schedulerData: deal.productScheduler,
                            productTypeForSchedule: deal.productType,
                            showCheckInFailedPopup: true
                        })
                    }, constants.HANDLING_TIMEOUT)
                }
            })
        })
    }
}

const styles = StyleSheet.create({
    indicatorText: {
        color: colors.greyTextColor,
        textAlign: 'center',
        width: 150
    },
    indicatorSelectedText: {
        color: colors.primaryColor,
        textAlign: 'center',
        width: 150,
    },
    indicatorBorder: {
        backgroundColor: colors.primaryColor,
    },
    mainFlatList: {
        paddingTop: 10,
    },
    button: {
        width: 'auto',
        height: 35,
        paddingHorizontal: 20
    }
});
import React, { Component } from 'react'
import {
    View, StyleSheet, FlatList, Modal, TouchableWithoutFeedback,
    TouchableOpacity, Linking, AppState, Platform, PermissionsAndroid
} from 'react-native'
import { NavigationEvents } from 'react-navigation'
import StatusBarComponent from '../../components/StatusBarComponent'
import TextComponent from '../../components/TextComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import HeaderComponent from '../../components/HeaderComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ImageComponent from '../../components/ImageComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import {
    isUserLoggedIn, startStackFrom, getScreenDimensions, parseTextForCard, parseDate, parseTime, parseDateTime,
    getCommonParamsForAPI, getImageDimensions, alertDialog, parseDiscountApplied, getCurrencyFormat,
    parseTimeWithoutUnit, getTimeOffset, getLoggedInUser, openUrlInBrowser, getDayOfWeek,
    openNumberInDialer, getDayFromUtcDateTime, getUnreadCounts, handleErrorResponse,
} from '../../utilities/HelperFunctions'
import colors from '../../config/colors'
import { hitApi } from '../../api/APICall'
import { fontNames, sizes, screenNames, urls, constants, itemTypes, scheduleTypes, statsTypes } from '../../config/constants'
// import { IndicatorViewPager, PagerTitleIndicator } from 'react-native-best-viewpager'
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import FastImage from 'react-native-fast-image'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import QRCode from 'react-native-qrcode-svg';
import SmallButtonComponent from '../../components/SmallButtonComponent'
import Geolocation from 'react-native-geolocation-service';

/**
 * Favorites Screen
 */
export default class UserFavoritesScreen extends Component {
    constructor(props) {
        super(props);
        this.changeEventListener = null
        this.screenDimensions = getScreenDimensions()
        this.qrCodeDimensions = this.screenDimensions.width * 0.5

        this.state = {
            showLoginPopup: false,
            showModalLoader: false,
            showInfoPopup: false,
            favEntrepreneursArray: [],
            favProductsArray: [],
            entrepreneursWithBonus: [],
            pullToRefreshWorking: false,

            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            schedulerData: [],
            productTypeForSchedule: null,

            showNoFavEntrepreneurs: false,
            showNoFavProducts: false,
            showNoEntrepreneursWithBonus: false,

            showUserQrCodepopup: false,
            tabs: {
                index: 0,
                routes: [
                    { key: 'first', title: strings.provider },
                    { key: 'second', title: strings.bookmarklist },
                    { key: 'third', title: strings.bonus },
                ],
            }
        }

        this.shouldHitPagination = true
        this.apiCount = 0;

        this.isComingFromSettings = false
        this.latitude = 0
        this.longitude = 0

        this.screenDimensions = getScreenDimensions()
        this.cardFullUpperBgImage = getImageDimensions(require('../../assets/cardFullUpperBg.png'))
        this.cardFullRedStripImage = getImageDimensions(require('../../assets/cardFullRedStrip.png'))
        this.cardFullLowerBgWithCut = getImageDimensions(require('../../assets/cardFullLowerBgWithCut.png'))

        this.favEntrepreneursPageIndex = 1
        this.favEntrepreneursPaginationRequired = true
        this.favProductsPageIndex = 1
        this.favProductsPaginationRequired = true
        this.entrepreneursWithBonusIndex = 1
        this.entrepreneursWithBonusPaginationRequired = true

        this.userQrCode = null
        getLoggedInUser().then((userObject) => {
            this.userQrCode = userObject.userCode
        })
    }

    firstScene = () => {
        return (
            <View style={commonStyles.container}>
                {/* Favorite Entrepreneurs view */}
                <FlatList
                    data={this.state.favEntrepreneursArray}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View>
                            <View style={[commonStyles.cardShadow, {
                                marginBottom: 24, marginStart: 6, marginEnd: 6, marginTop: 6,
                            }]}>
                                <View style={[commonStyles.cardRadius, { alignSelf: 'center' }]}>
                                    <TouchableWithoutFeedback
                                        onPress={() => this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                            BUSINESS_ID: item.businessId
                                        })}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.businessBannerImage ? item.businessBannerImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                {item.hasHotdeal && <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={require('../../assets/hotDeal.png')} />
                                                }
                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={commonStyles.cardBigTitleText}>
                                                        {parseTextForCard(item.businessName, 16)}
                                                    </TextComponent>
                                                    <View style={commonStyles.cardOpeningView}>
                                                        {item.scheduleStartTime ?
                                                            <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                {"(" + strings.open + ": "
                                                                    + parseTimeWithoutUnit(item.scheduleStartTime)
                                                                    + " - " + parseTime(item.scheduleEndTime) + ")"}
                                                            </TextComponent>
                                                            :
                                                            <View>
                                                                <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                    {"(" + strings.closed_now + ")"}
                                                                </TextComponent>
                                                                <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                    {"(" + strings.opens + " " + strings.days_of_week[getDayFromUtcDateTime(item.scheduleNextStartTime)]
                                                                        + " " /* + strings.at + " " */
                                                                        + parseTimeWithoutUnit(item.scheduleNextStartTime)
                                                                        + " - " + parseTime(item.scheduleNextEndTime) + ")"}
                                                                </TextComponent>
                                                            </View>
                                                        }
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={{
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }}>
                                                <View style={styles.cardDetailsContainer}>
                                                    <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                        <View>
                                                            <TextComponent style={commonStyles.cardBigBusinessAddress}>
                                                                {parseTextForCard(item.businessAddress, 25)}
                                                            </TextComponent>
                                                            <TextComponent>
                                                                {/* Empty */}
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { alignItems: 'center', marginTop: 3 }]}>
                                                                <ImageComponent
                                                                    source={require('../../assets/locationBlack.png')} />
                                                                <TextComponent style={commonStyles.cardBigDistance}>{item.distance}</TextComponent>
                                                            </View>
                                                        </View>
                                                        <View style={[commonStyles.rowContainer, { marginStart: 'auto', alignSelf: 'baseline', alignItems: 'center', marginTop: -4 }]}>
                                                            {(item.isBookingsActive || item.isEntrepreneurRedirectToURL) &&
                                                                <TouchableOpacity
                                                                    style={{}}
                                                                    onPress={() => {
                                                                        if (item.isEntrepreneurRedirectToURL) {
                                                                            if (item.businessWebUrl && item.businessWebUrl.length > 0) {
                                                                                this.hitAddStats(statsTypes.REDIRECT_TO_WEBSITE, item.businessId, null, item.businessWebUrl);
                                                                            } else {
                                                                                alertDialog("", strings.url_not_available);
                                                                            }
                                                                        } else {
                                                                            this.props.navigation.navigate(screenNames.ADD_APPOINTMENT_SCREEN, {
                                                                                BUSINESS_ID: item.businessId,
                                                                                MESSAGE_ID: item.messageId,
                                                                                PRODUCT_ID: null,
                                                                                PRODUCT_TYPE: null,
                                                                            })
                                                                        }
                                                                    }}>
                                                                    <ImageComponent
                                                                        style={{ marginStart: 10, }}
                                                                        source={require('../../assets/bookCard.png')} />
                                                                </TouchableOpacity>
                                                            }
                                                            {item.isMessageActive &&
                                                                <TouchableOpacity
                                                                    style={{}}
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
                                                                    <ImageComponent
                                                                        style={{ marginStart: 10 }}
                                                                        source={require('../../assets/chat.png')} />
                                                                </TouchableOpacity>
                                                            }
                                                            {item.isCallActive &&
                                                                <TouchableOpacity
                                                                    style={{}}
                                                                    onPress={() =>
                                                                        this.hitAddStats(statsTypes.CLICK_ON_CALL, item.businessId, item.businessPhoneNumber)
                                                                    }>
                                                                    <ImageComponent
                                                                        style={{ marginStart: 10, }}
                                                                        source={require('../../assets/callPurple.png')} />
                                                                </TouchableOpacity>
                                                            }
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    }
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    style={styles.mainFlatList}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={
                        this.state.showNoFavEntrepreneurs &&
                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginHorizontal: 10, textAlign: 'center' }}>
                                {strings.no_favorites_yet}
                            </TextComponent>
                        </View>
                    }
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd < 0) {
                            return;
                        }
                        if (this.favEntrepreneursPaginationRequired && this.shouldHitPagination) {
                            this.shouldHitPagination = false
                            this.showModalLoader(true)
                            this.favEntrepreneursPageIndex++
                            this.fetchFavoriteEntrepreneurs()
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        )
    }

    secondScene = () => {
        return (
            <View style={commonStyles.container}>
                {/* Favorite Products view */}

                <FlatList
                    data={this.state.favProductsArray}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View style={{ alignItems: 'center', marginBottom: index === this.state.favProductsArray.length - 1 ? 40 : 0 }}>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                marginStart: 0,
                                marginEnd: 0,
                            }]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            item.productType === itemTypes.HOT_DEAL ?
                                                this.props.navigation.navigate(screenNames.HOT_DEAL_DETAIL_SCREEN, {
                                                    PRODUCT_ID: item.productId
                                                })
                                                :
                                                this.props.navigation.navigate(screenNames.ACTION_EVENT_DETAIL_SCREEN, {
                                                    PRODUCT_ID: item.productId,
                                                    PRODUCT_TYPE: item.productType,
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
                                                        uri: item.productImage ? item.productImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover} />
                                                {item.productType === itemTypes.HOT_DEAL &&
                                                    <ImageComponent
                                                        style={commonStyles.cardBadgeIcon}
                                                        source={require('../../assets/hotDeal.png')} />
                                                }
                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={commonStyles.cardBigTitleText}>
                                                        {item.productTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }]}>
                                                <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                    <View>
                                                        <TextComponent style={commonStyles.cardProductName}>
                                                            {parseTextForCard(item.businessName, 15)}
                                                        </TextComponent>

                                                        {item.isDiscounted ?
                                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles.cardOP]}>
                                                                    {item.discount + strings.percent_discount}
                                                                </TextComponent>
                                                            </View>
                                                            :
                                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles.cardMRP, (typeof item.productOP == 'number' && commonStyles.lineThrough)]}>
                                                                    {item.productMRP ? getCurrencyFormat(item.productMRP) :
                                                                        (typeof item.productMRP == 'number') ? getCurrencyFormat(item.productMRP) : ""}
                                                                </TextComponent>
                                                                <TextComponent style={commonStyles.cardOP}>
                                                                    {item.productOP ? getCurrencyFormat(item.productOP) :
                                                                        (typeof item.productOP == 'number') ? getCurrencyFormat(item.productOP) : ""}
                                                                </TextComponent>
                                                            </View>
                                                        }
                                                    </View>
                                                    <SmallButtonComponent
                                                        icon={require('../../assets/infoRound.png')}
                                                        onPress={() => this.fetchProductDetails(item.productId)}>
                                                        {strings.info}
                                                    </SmallButtonComponent>
                                                </View>

                                                <View style={[commonStyles.rowContainer, { justifyContent: 'space-between', marginTop: 2 }]}>
                                                    <TextComponent style={[commonStyles.cardLeftText, { color: colors.red, fontFamily: fontNames.boldFont, }]}>
                                                        {item.productNextAvailableStartDateTime ? parseDate(item.productNextAvailableStartDateTime) : ""}
                                                    </TextComponent>
                                                    <TextComponent style={commonStyles.cardLeftText}>
                                                        {
                                                            item.productNextAvailableStartDateTime ?
                                                                parseTimeWithoutUnit(item.productNextAvailableStartDateTime)
                                                                + " - " + parseTime(item.productNextAvailableEndDateTime)
                                                                : ""
                                                        }
                                                    </TextComponent>
                                                    <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                        <ImageComponent
                                                            source={require('../../assets/locationBlack.png')} />
                                                        <TextComponent style={commonStyles.cardDistance}>
                                                            {item.distance}
                                                        </TextComponent>
                                                    </View>
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
                        this.state.showNoFavProducts &&
                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginHorizontal: 10, textAlign: 'center' }}>
                                {strings.no_favorite_products_yet}
                            </TextComponent>
                        </View>
                    }
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd < 0) {
                            return;
                        }
                        if (this.favProductsPaginationRequired && this.shouldHitPagination) {
                            this.shouldHitPagination = false
                            this.showModalLoader(true)
                            this.favProductsPageIndex++
                            this.fetchFavoriteProducts()
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            </View>
        )
    }

    thirdScene = () => {
        return (
            <View style={commonStyles.container}>
                {/* Entrepreneurs with Bonus deals view */}
                <ButtonComponent
                    isFillRequired={true}
                    style={[{ width: '40%', paddingHorizontal: 20, alignSelf: 'center', marginTop: 10 }]}
                    icon={require('../../assets/qrCode.png')}
                    iconStyle={{ marginEnd: 10 }}
                    onPress={() => {
                        this.setState({ showUserQrCodepopup: true })
                    }}>
                    {strings.my_card}
                </ButtonComponent>

                <FlatList
                    data={this.state.entrepreneursWithBonus}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View>
                            <View style={[commonStyles.cardShadow, {
                                marginBottom: index === this.state.entrepreneursWithBonus.length - 1 ? 40 : 0,
                                marginStart: 6, marginEnd: 6, marginTop: 10,
                            }]}>
                                <View style={[commonStyles.cardRadius, { alignSelf: 'center' }]}>
                                    <TouchableWithoutFeedback
                                        onPress={() => this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                            BUSINESS_ID: item.businessId,
                                        })}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.businessBannerImage ? item.businessBannerImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />

                                                <View style={[commonStyles.rowContainer, {
                                                    position: 'absolute', backgroundColor: colors.timerBackground,
                                                    paddingHorizontal: 20, borderRadius: 20, paddingVertical: 5,
                                                    minWidth: 120, justifyContent: 'center'
                                                }]}>
                                                    <ImageComponent
                                                        style={{ marginEnd: 5 }}
                                                        source={require('../../assets/bonus.png')} />
                                                    <TextComponent style={{ color: colors.white, fontSize: sizes.mediumTextSize }}>
                                                        {item.availableScannedCountOfUser}
                                                    </TextComponent>
                                                </View>

                                                {item.hasHotdeal && <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={require('../../assets/hotDeal.png')} />
                                                }
                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={commonStyles.cardBigTitleText}>
                                                        {parseTextForCard(item.businessName, 16)}
                                                    </TextComponent>
                                                    <View style={commonStyles.cardOpeningView}>
                                                        {item.scheduleStartTime ?
                                                            <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                {"(" + strings.open + ": "
                                                                    + parseTimeWithoutUnit(item.scheduleStartTime)
                                                                    + " - " + parseTime(item.scheduleEndTime) + ")"}
                                                            </TextComponent>
                                                            :
                                                            <View>
                                                                <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                    {"(" + strings.closed_now + ")"}
                                                                </TextComponent>
                                                                <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                    {"(" + strings.opens + " " + strings.days_of_week[getDayFromUtcDateTime(item.scheduleNextStartTime)]
                                                                        + " "
                                                                        + parseTimeWithoutUnit(item.scheduleNextStartTime)
                                                                        + " - " + parseTime(item.scheduleNextEndTime) + ")"}
                                                                </TextComponent>
                                                            </View>
                                                        }
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={{
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }}>
                                                <View style={styles.cardDetailsContainer}>
                                                    <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                        <View>
                                                            <TextComponent style={commonStyles.cardBigBusinessAddress}>
                                                                {parseTextForCard(item.businessAddress, 25)}
                                                            </TextComponent>
                                                            <TextComponent>
                                                                {/* Empty */}
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { alignItems: 'center', marginTop: 3 }]}>
                                                                <ImageComponent
                                                                    source={require('../../assets/locationBlack.png')} />
                                                                <TextComponent style={commonStyles.cardBigDistance}>{item.distance}</TextComponent>
                                                            </View>
                                                        </View>
                                                        <View style={{ marginStart: 'auto', alignSelf: 'baseline', alignItems: 'center', }}>
                                                            <SmallButtonComponent
                                                                icon={require('../../assets/infoRound.png')}
                                                                onPress={() => {
                                                                    this.props.navigation.navigate(screenNames.WEB_VIEW_SCREEN, {
                                                                        TITLE: strings.bonus_details_conditions,
                                                                        HTML_CONTENT: item.bonusConditions ? item.bonusConditions : ""
                                                                    })
                                                                }}
                                                                style={{ paddingTop: 0, paddingBottom: 4 }}>
                                                                {strings.conditions}
                                                            </SmallButtonComponent>
                                                            <View style={[commonStyles.rowContainer]}>
                                                                {(item.isBookingsActive || item.isEntrepreneurRedirectToURL) &&
                                                                    <TouchableOpacity
                                                                        style={{}}
                                                                        onPress={() => {
                                                                            if (item.isEntrepreneurRedirectToURL) {
                                                                                if (item.businessWebUrl && item.businessWebUrl.length > 0) {
                                                                                    this.hitAddStats(statsTypes.REDIRECT_TO_WEBSITE, item.businessId, null, item.businessWebUrl)
                                                                                } else {
                                                                                    alertDialog("", strings.url_not_available);
                                                                                }
                                                                            } else {
                                                                                this.props.navigation.navigate(screenNames.ADD_APPOINTMENT_SCREEN, {
                                                                                    BUSINESS_ID: item.businessId,
                                                                                    MESSAGE_ID: item.messageId,
                                                                                    PRODUCT_ID: null,
                                                                                    PRODUCT_TYPE: null,
                                                                                })
                                                                            }
                                                                        }}>
                                                                        <ImageComponent
                                                                            style={{ marginStart: 10, }}
                                                                            source={require('../../assets/bookCard.png')} />
                                                                    </TouchableOpacity>
                                                                }
                                                                {item.isMessageActive &&
                                                                    <TouchableOpacity
                                                                        style={{}}
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
                                                                        <ImageComponent
                                                                            style={{ marginStart: 10 }}
                                                                            source={require('../../assets/chat.png')} />
                                                                    </TouchableOpacity>
                                                                }
                                                                {item.isCallActive &&
                                                                    <TouchableOpacity
                                                                        style={{}}
                                                                        onPress={() =>
                                                                            this.hitAddStats(statsTypes.CLICK_ON_CALL, item.businessId, item.businessPhoneNumber)
                                                                        }>
                                                                        <ImageComponent
                                                                            style={{ marginStart: 10, }}
                                                                            source={require('../../assets/callPurple.png')} />
                                                                    </TouchableOpacity>
                                                                }
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    }
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    style={styles.mainFlatList}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={
                        this.state.showNoEntrepreneursWithBonus &&
                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginHorizontal: 10, textAlign: 'center' }}>
                                {strings.no_entrepreneurs_with_bonus}
                            </TextComponent>
                        </View>
                    }
                    onEndReached={({ distanceFromEnd }) => {
                        if (distanceFromEnd < 0) {
                            return;
                        }
                        if (this.entrepreneursWithBonusPaginationRequired && this.shouldHitPagination) {
                            this.shouldHitPagination = false
                            this.showModalLoader(true)
                            this.entrepreneursWithBonusIndex++
                            this.fetchEntrepreneursWithBonusDeals()
                        }
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
                <NavigationEvents
                    onDidFocus={payload => {
                        this.checkIfUserLoggedIn();
                    }}
                />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                {this.state.showLoginPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TextComponent
                                style={{ alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                {strings.login_to_continue}
                            </TextComponent>
                            <View style={[commonStyles.rowContainer, commonStyles.centerInContainer]}>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={styles.popupButton}
                                    color={colors.greyButtonColor2}
                                    fontStyle={{ color: colors.black }}
                                    onPress={() => {
                                        this.setState({ showLoginPopup: false })
                                        this.props.navigation.goBack(null)
                                    }}>
                                    {strings.no}
                                </ButtonComponent>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={styles.popupButton}
                                    onPress={() => startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)}>
                                    {strings.yes}
                                </ButtonComponent>
                            </View>
                        </View>
                    </View>
                </Modal>
                }

                {/* info popup */}
                {this.state.showInfoPopup && <Modal
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

                            <TextComponent
                                style={{
                                    color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center', marginTop: 10
                                }}>
                                {this.state.productTypeForSchedule === itemTypes.HOT_DEAL ?
                                    strings.this_deal_can_be_redeemed_on_dates
                                    : this.state.productTypeForSchedule === itemTypes.ACTION ?
                                        strings.promotional_period : strings.event_schedule}
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
                                                    index > 0 ?
                                                        parseDate(this.state.schedulerData[index - 1].startTime) == parseDate(item.startTime) ?
                                                            "" : parseDate(item.startTime)
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
                                        showInfoPopup: false
                                    })
                                }}>
                                {strings.done}
                            </ButtonComponent>
                        </View>
                    </View>
                </Modal>
                }

                {/* QR Code Popup */}
                {this.state.showUserQrCodepopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showUserQrCodepopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                            </TouchableOpacity>
                            <View style={{ alignItems: 'center' }}>
                                <TextComponent style={{ fontSize: sizes.xLargeTextSize, marginBottom: 20 }}>
                                    {strings.please_scan_the_qr_code}
                                </TextComponent>

                                {this.userQrCode ?
                                    <QRCode
                                        value={this.userQrCode}
                                        size={this.qrCodeDimensions}
                                    />
                                    :
                                    <View />
                                }
                                <TextComponent style={{ fontSize: sizes.xLargeTextSize, marginTop: 20 }}>
                                    {this.userQrCode ? this.userQrCode : strings.not_available}
                                </TextComponent>
                            </View>
                        </View>
                    </View>
                </Modal>
                }
                <TitleBarComponent
                    title={strings.favorites}
                    navigation={this.props.navigation}
                    isHomeScreen={true} />
                <HeaderComponent
                    image={require('../../assets/favoritesHeader.png')}>
                </HeaderComponent>
                <View style={[commonStyles.container, { marginTop: 10 }]}>
                    <TabView
                        onIndexChange={index => this.setState({ index })}
                        navigationState={this.state.tabs}
                        // style={{ width: '100%', height: '100%', flexDirection: 'column-reverse', backgroundColor: colors.white }}
                        // indicator={
                        //     <PagerTitleIndicator
                        //         titles={[strings.provider, strings.bookmarklist, strings.bonus]}
                        //         style={{ backgroundColor: colors.white }}
                        //         itemStyle={{ width: this.screenDimensions.width / 3 }}
                        //         selectedItemStyle={{ width: this.screenDimensions.width / 3 }}
                        //         itemTextStyle={styles.indicatorText}
                        //         selectedItemTextStyle={styles.indicatorSelectedText}
                        //         selectedBorderStyle={styles.indicatorBorder}
                        //     />
                        // }
                        renderTabBar={props => (
                            <TabBar
                                {...props}
                                activeColor={colors.primaryColor}
                                inactiveColor={colors.greyTextColor}
                                indicatorStyle={{ backgroundColor: colors.primaryColor }}
                                style={{ backgroundColor: colors.transparent }}
                            />
                        )}
                        renderScene={({ route }) => {
                            switch (route.key) {
                                case 'first': return this.firstScene();
                                case 'second': return this.secondScene();
                                case 'third': return this.thirdScene()
                            }
                        }}
                    />
                </View>
            </View>
        );
    }

    // Check if user is logged in
    checkIfUserLoggedIn = () => {
        isUserLoggedIn().then((isUserLoggedIn) => {
            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                // user is not logged in
                this.setState({
                    showLoginPopup: true
                })
            } else {
                // user is logged in
                this.changeEventListener = AppState.addEventListener('change', this._handleAppStateChange);

                getUnreadCounts(this.props.navigation)

                if (!this.state.pullToRefreshWorking) {
                    this.checkIfPermissionGranted()
                }
            }
        })
    }

    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            getUnreadCounts(this.props.navigation)
            this.checkIfPermissionGranted()
        })
    }

    componentWillUnmount() {
        if (this.changeEventListener) {
            this.changeEventListener.remove();
        }
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active' && this.isComingFromSettings) {
            this.isComingFromSettings = false
            this.checkIfPermissionGranted();
        }
    };

    // Check for location permission
    checkIfPermissionGranted() {
        if (Platform.OS == constants.ANDROID) {
            if (Platform.Version >= 23) {
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                    .then(response => {
                        if (response == true) {
                            this.checkForLocation();
                        } else {
                            this.requestPermission();
                        }
                    });
            } else {
                this.checkForLocation();
            }
        } else {
            this.checkForLocation();
        }
    }

    // Request location permission
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
                this.checkForLocation();
            } else {
                alertDialog(strings.permission_title, strings.permission_must, strings.ok, "", () => {
                    this.isComingFromSettings = true
                    Linking.openSettings();
                })
            }
        } catch (err) {
            console.log("request permission error " + err.toString());
        }
    }

    // get current location
    checkForLocation() {
        this.setState({
            showModalLoader: true
        }, () => {
            Geolocation.getCurrentPosition(
                (position) => {
                    this.setState({
                        pullToRefreshWorking: false,
                    }, () => {
                        this.latitude = position.coords.latitude
                        this.longitude = position.coords.longitude
                        // save/update position in async storage
                        AsyncStorageHelper.saveStringAsync(constants.COORDINATES, JSON.stringify(position.coords))

                        // hit APIs
                        this.hitAllApis()
                    })
                },
                (error) => {
                    this.setState({
                        showModalLoader: false,
                        pullToRefreshWorking: false,
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
                                    this.checkForLocation();
                                })
                            }
                        }
                        if (error.code == 5) {
                            if (Platform.OS === constants.ANDROID) {
                                alertDialog(strings.permission_title, strings.location_off, strings.ok, "", () => {
                                    this.checkForLocation();
                                })
                            }
                        }
                    })
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, }
            );
        })
    }

    // Hit all APIs of this screen
    hitAllApis = () => {
        this.apiCount = 0;

        this.favEntrepreneursPageIndex = 1
        this.favEntrepreneursPaginationRequired = true
        this.favProductsPageIndex = 1
        this.favProductsPaginationRequired = true
        this.entrepreneursWithBonusIndex = 1
        this.entrepreneursWithBonusPaginationRequired = true

        this.setState({
            favEntrepreneursArray: [],
            favProductsArray: [],
            entrepreneursWithBonus: [],
            showNoFavEntrepreneurs: false,
            showNoFavProducts: false,
            showNoEntrepreneursWithBonus: false,
        }, () => {
            this.fetchFavoriteEntrepreneurs()
            this.fetchFavoriteProducts()
            this.fetchEntrepreneursWithBonusDeals()
        })
    }

    showModalLoader = (shouldShow) => {
        if (shouldShow) {
            this.setState({
                showModalLoader: shouldShow
            })
        } else {
            if (this.apiCount === 0) {
                this.setState({
                    showModalLoader: shouldShow,
                    pullToRefreshWorking: false
                })
            } else {
                this.setState({
                    pullToRefreshWorking: false
                })
            }
        }
    }

    // API to get fav ents
    fetchFavoriteEntrepreneurs = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                pageIndex: this.favEntrepreneursPageIndex,
                pageSize: constants.PAGE_SIZE,
                scheduleDay: getDayOfWeek(),
                timeOffset: getTimeOffset(),
            }

            this.apiCount++
            hitApi(urls.GET_FAVORITE_ENTREPRENEURS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.favEntrepreneursPaginationRequired = false
                }

                let tempArray = this.state.favEntrepreneursArray
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    pullToRefreshWorking: false,
                    favEntrepreneursArray: tempArray,
                    showNoFavEntrepreneurs: true,
                }, () => {
                    this.shouldHitPagination = true
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get fav products
    fetchFavoriteProducts = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                pageIndex: this.favProductsPageIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
            }

            this.apiCount++
            hitApi(urls.GET_FAVORITE_PRODUCTS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.favProductsPaginationRequired = false
                }

                let tempArray = this.state.favProductsArray
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    favProductsArray: tempArray,
                    showNoFavProducts: true,
                }, () => {
                    this.shouldHitPagination = true
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get ents with bonus deals
    fetchEntrepreneursWithBonusDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                pageIndex: this.entrepreneursWithBonusIndex,
                pageSize: constants.PAGE_SIZE,
                scheduleDay: getDayOfWeek(),
                timeOffset: getTimeOffset(),
            }

            this.apiCount++
            hitApi(urls.GET_ENTREPRENEURS_WITH_BONUS_DEALS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.entrepreneursWithBonusPaginationRequired = false
                }

                let tempArray = this.state.entrepreneursWithBonus
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    entrepreneursWithBonus: tempArray,
                    showNoEntrepreneursWithBonus: true,
                }, () => {
                    this.shouldHitPagination = true
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get product's details
    fetchProductDetails = (productId) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: productId,
                lat: this.latitude,
                lng: this.longitude,
                timeOffset: getTimeOffset(),
                statsType: statsTypes.CLICK_ON_INFO,
            }

            hitApi(urls.GET_PRODUCT_DETAIL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                setTimeout(() => {
                    this.setState({
                        scheduleType: jsonResponse.response[0].scheduleType,
                        schedulerRedemptionStartDate: jsonResponse.response[0].productRedemptionStartDate,
                        schedulerRedemptionEndDate: jsonResponse.response[0].productRedemptionEndDate,
                        schedulerData: jsonResponse.response[0].productScheduler,
                        productTypeForSchedule: jsonResponse.response[0].productType,
                        showInfoPopup: true
                    })
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    // API for stats
    hitAddStats = (statType, businessId, businessPhoneNumber, businessWebUrl) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                statsType: statType,
                productId: null,
                businessId: businessId,
            }

            hitApi(urls.ADD_STATS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (statType === statsTypes.CLICK_ON_CALL) {
                    this.openCaller(businessPhoneNumber)
                } else if (statType === statsTypes.REDIRECT_TO_WEBSITE) {
                    this.openUrl(businessWebUrl)
                }
            }, (jsonResponse) => {
                if (statType === statsTypes.CLICK_ON_CALL) {
                    this.openCaller(businessPhoneNumber)
                } else if (statType === statsTypes.REDIRECT_TO_WEBSITE) {
                    this.openUrl(businessWebUrl)
                }
            })
        })
    }

    openCaller = (businessPhoneNumber) => {
        openNumberInDialer(businessPhoneNumber)
    }

    openUrl = (businessWebUrl) => {
        openUrlInBrowser(businessWebUrl)
    }
}

const styles = StyleSheet.create({
    popupButton: {
        marginTop: 20,
        width: '40%',
        alignSelf: 'center',
        marginEnd: 5
    },
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
        paddingTop: 5,
    },
    cardDetailsContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    nestedFlatList: {
        minHeight: constants.MIN_HEIGHT_FOR_FLAT_LIST,
    }
});
import React, { Component } from 'react'
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    FlatList, Platform, PermissionsAndroid, TouchableWithoutFeedback,
    Linking, AppState, BackHandler, ToastAndroid, Modal, RefreshControl
} from 'react-native'
import { StackActions, NavigationActions } from 'react-navigation'
import StatusBarComponent from '../../components/StatusBarComponent'
import TextComponent from '../../components/TextComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import HeaderComponent from '../../components/HeaderComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    fontNames, sizes, constants, itemTypes, urls,
    screenNames, productSortBy, productOrderBy, scheduleTypes, statsTypes, notificationTypes,
} from '../../config/constants'
import {
    getCommonParamsForAPI, alertDialog, isNetworkConnected, getImageDimensions, getScreenDimensions,
    parseTextForCard, parseDiscountApplied, startStackFrom, parseDate, parseTime,
    parseDateTime, getCurrencyFormat, parseTimeWithoutUnit, handleErrorResponse, getTimeOffset,
    getCircularReplacer, getUnreadCounts, isUserLoggedIn,
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import FastImage from 'react-native-fast-image'
import Geolocation from 'react-native-geolocation-service';
import SmallButtonComponent from '../../components/SmallButtonComponent'
// import firebase, { Notification, NotificationOpen } from 'react-native-firebase';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidBadgeIconType, AndroidDefaults, AndroidGroupAlertBehavior, AndroidImportance, EventType } from '@notifee/react-native';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';

/**
 * User's Home Screen - My Regensburg
 */
export default class UserHomeScreen extends Component {
    constructor(props) {
        super(props);
        this.changeEventListener = null
        this.removeNotificationListener = null
        this.removeNotificationOpenedListener = null
        this.messageListener = null
        this.isComingFromSettings = false

        this.hotDealIndex = 1
        this.hotDealPaginationRequired = true

        this.actionsIndex = 1
        this.actionsPaginationRequired = true

        this.eventsIndex = 1
        this.eventsPaginationRequired = true

        this.apiCount = 0;

        this.didFocusSubscription = null;
        this.didBlurSubscription = null;

        this.state = {
            showModalLoader: false,
            showLoginPopup: false,
            showInfoPopup: false,
            pullToRefreshWorking: false,

            hotDealsArray: [],
            showHotDealLoader: false,

            actionsArray: [],
            showActionsLoader: false,

            eventsArray: [],
            showEventsLoader: false,

            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            productTypeForSchedule: null,
            schedulerData: [],

            showNoHotDeals: false,
            showNoActions: false,
            showNoEvents: false,
        }

        this.backHandler = null
        this.backCount = 0

        this.screenDimensions = getScreenDimensions()
        this.cardUpperBgImage = getImageDimensions(require('../../assets/cardUpperBg.png'))
        this.cardLowerBgWithCut = getImageDimensions(require('../../assets/cardLowerBgWithCut.png'))
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.mein_regensburg}
                    navigation={this.props.navigation}
                    isHomeScreen={true} />

                {/* Login Popup */}
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
                                    style={commonStyles.loginPopupButton}
                                    color={colors.greyButtonColor2}
                                    fontStyle={{ color: colors.black }}
                                    onPress={() => {
                                        this.setState({ showLoginPopup: false })
                                    }}>
                                    {strings.no}
                                </ButtonComponent>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles.loginPopupButton}
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

                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.pullToRefreshWorking}
                            onRefresh={this.onPullToRefresh} />
                    }>
                    <HeaderComponent
                        image={require('../../assets/homeHeader.png')}>
                    </HeaderComponent>

                    {/* Hot Deals */}
                    <View style={[styles.view, { marginTop: 10 }]}>
                        <TextComponent style={styles.headingText}>
                            {strings.hot_deals}
                        </TextComponent>
                        <TouchableOpacity
                            style={styles.viewAllTouch}
                            onPress={() => {
                                if (this.state.hotDealsArray && this.state.hotDealsArray.length > 0) {
                                    this.goToViewAllScreen(itemTypes.HOT_DEAL)
                                }
                            }}>
                            <TextComponent style={styles.viewAll}>
                                {strings.view_all}
                            </TextComponent>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={this.state.hotDealsArray}
                        renderItem={({ item }) =>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            this.props.navigation.navigate(screenNames.HOT_DEAL_DETAIL_SCREEN, {
                                                PRODUCT_ID: item.productId
                                            })
                                        }}>
                                        <View>
                                            <View style={[{
                                                width: this.cardUpperBgImage.width, height: this.cardUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.productImage ? item.productImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={require('../../assets/hotDeal.png')} />

                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardTitleBg.png')} />
                                                    <TextComponent style={commonStyles.cardTitleText}>
                                                        {item.productTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardLowerBgWithCut.width, height: this.cardLowerBgWithCut.height,
                                            }]}>
                                                <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                    <View>
                                                        <TextComponent style={commonStyles.cardProductName}>
                                                            {parseTextForCard(item.businessName)}
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
                                                                    {getCurrencyFormat(item.productMRP)}
                                                                </TextComponent>
                                                                <TextComponent style={commonStyles.cardOP}>
                                                                    {getCurrencyFormat(item.productOP)}
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
                        }
                        showsHorizontalScrollIndicator={false}
                        style={styles.flatList}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal={true}
                        onEndReached={({ distanceFromEnd }) => {
                            // Pagination not required
                            /* if (this.hotDealPaginationRequired) {
                                this.showModalLoader(true)
                                this.hotDealIndex++
                                this.getHotDeals()
                            } */
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            <View style={[commonStyles.container, commonStyles.centerInContainer,
                            { backgroundColor: colors.transparent, marginEnd: 15 }]}>
                                <LoaderComponent
                                    shouldShow={this.state.showHotDealLoader} />
                            </View>
                        }
                        ListEmptyComponent={
                            this.state.showNoHotDeals &&
                            <View style={{ flex: 1, justifyContent: 'center', marginStart: 12 }}>
                                <TextComponent>{strings.no_hot_deals_found}</TextComponent>
                            </View>
                        }
                    />

                    {/* Actions */}
                    <View style={styles.view}>
                        <TextComponent style={styles.headingText}>
                            {strings.actions}
                        </TextComponent>
                        <TouchableOpacity
                            style={styles.viewAllTouch}
                            onPress={() => {
                                if (this.state.actionsArray && this.state.actionsArray.length > 0) {
                                    this.goToViewAllScreen(itemTypes.ACTION)
                                }
                            }}>
                            <TextComponent style={styles.viewAll}>
                                {strings.view_all}
                            </TextComponent>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={this.state.actionsArray}
                        renderItem={({ item }) =>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins]}>
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
                                                width: this.cardUpperBgImage.width, height: this.cardUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.productImage ? item.productImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                {item.productType === itemTypes.HOT_DEAL &&
                                                    <ImageComponent
                                                        style={commonStyles.cardBadgeIcon}
                                                        source={require('../../assets/hotDeal.png')} />
                                                }

                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardTitleBg.png')} />
                                                    <TextComponent style={commonStyles.cardTitleText}>
                                                        {item.productTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardLowerBgWithCut.width, height: this.cardLowerBgWithCut.height,
                                            }]}>
                                                <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                    <View>
                                                        <TextComponent style={commonStyles.cardProductName}>
                                                            {parseTextForCard(item.businessName)}
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
                        }
                        showsHorizontalScrollIndicator={false}
                        style={styles.flatList}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal={true}
                        onEndReached={() => {
                            // Pagination not required
                            /* if (this.actionsPaginationRequired) {
                                this.showModalLoader(true)
                                this.actionsIndex++
                                this.getActions()
                            } */
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            <View style={[commonStyles.container, commonStyles.centerInContainer,
                            { backgroundColor: colors.transparent, marginEnd: 15 }]}>
                                <LoaderComponent
                                    shouldShow={this.state.showActionsLoader} />
                            </View>
                        }
                        ListEmptyComponent={
                            this.state.showNoActions &&
                            <View style={{ flex: 1, justifyContent: 'center', marginStart: 12 }}>
                                <TextComponent>{strings.no_actions_found}</TextComponent>
                            </View>
                        }
                    />

                    {/* Events */}
                    <View style={styles.view}>
                        <TextComponent style={styles.headingText}>
                            {strings.events}
                        </TextComponent>
                        <TouchableOpacity
                            style={styles.viewAllTouch}
                            onPress={() => {
                                if (this.state.eventsArray && this.state.eventsArray.length > 0) {
                                    this.goToViewAllScreen(itemTypes.EVENT)
                                }
                            }}>
                            <TextComponent style={styles.viewAll}>
                                {strings.view_all}
                            </TextComponent>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={this.state.eventsArray}
                        renderItem={({ item }) =>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins]}>
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
                                                width: this.cardUpperBgImage.width, height: this.cardUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.productImage ? item.productImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                {item.productType === itemTypes.HOT_DEAL &&
                                                    <ImageComponent
                                                        style={commonStyles.cardBadgeIcon}
                                                        source={require('../../assets/hotDeal.png')} />
                                                }

                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardTitleBg.png')} />
                                                    <TextComponent style={commonStyles.cardTitleText}>
                                                        {item.productTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles.cardDetailsContainer, {
                                                width: this.cardLowerBgWithCut.width, height: this.cardLowerBgWithCut.height,
                                            }]}>
                                                <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                    <View>
                                                        <TextComponent style={commonStyles.cardProductName}>
                                                            {parseTextForCard(item.businessName)}
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
                        }
                        showsHorizontalScrollIndicator={false}
                        style={styles.flatList}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal={true}
                        onEndReached={() => {
                            // Pagination not required
                            /* if (this.eventsPaginationRequired) {
                                this.showModalLoader(true)
                                this.eventsIndex++
                                this.getEvents()
                            } */
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            <View style={[commonStyles.container, commonStyles.centerInContainer,
                            { backgroundColor: colors.transparent, marginEnd: 15 }]}>
                                <LoaderComponent
                                    shouldShow={this.state.showEventsLoader} />
                            </View>
                        }
                        ListEmptyComponent={
                            this.state.showNoEvents &&
                            <View style={{ flex: 1, justifyContent: 'center', marginStart: 12 }}>
                                <TextComponent>{strings.no_events_found}</TextComponent>
                            </View>
                        }
                    />
                </ScrollView>
            </View>
        );
    }

    componentDidMount() {
        this.changeEventListener = AppState.addEventListener('change', this._handleAppStateChange);

        // When screen gets focus
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
                getUnreadCounts(this.props.navigation)
            }
        );

        // When screen looses focus
        this.didBlurSubscription = this.props.navigation.addListener(
            'didBlur',
            payload => {
                if (this.backHandler) {
                    this.backHandler.remove()
                }
            }
        );

        this.registerFcmReceivers();
        this.createNotificationChannel(null)

        setTimeout(() => {
            this.checkIfPermissionGranted();
        }, constants.HANDLING_TIMEOUT)

        this.getUserSettings();
    }

    // Check permission for FCM
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

    // Ask for FCM Permission
    requestFcmPermission = async () => {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            this.addFcmListener();
        }
    }

    // Add FCM Listeners
    addFcmListener = () => {
        /**
         * the following method will receive Push Notifications when app is foregroud
         */
        this.removeNotificationListener = messaging().onMessage((notification) => {
            // Process notification
            let data = notification.data;
            if (data.type && data.type == notificationTypes.MESSAGE) {
                if (constants.IS_CHAT_SCREEN &&
                    constants.CURRENT_CHAT_ENT_ID == data.businessId) {
                    // Do not show notification
                } else {
                    this.createNotificationChannel(notification);
                }
            } else {
                this.createNotificationChannel(notification);
            }
        });


        /**
         * the following method will be called when app was in foreground and 
         * the push notification was tapped
         */
        notifee.onForegroundEvent(({ type, detail }) => {
            switch (type) {
                case EventType.DISMISSED:
                    console.log('User dismissed notification', detail.notification);
                    break;
                case EventType.PRESS:
                    this.handleNotificationData(detail.notification.data);
                    break;
            }
        });

        notifee.onBackgroundEvent(async ({ type, detail }) => {
            // Check if the user pressed the "Mark as read" action
            switch (type) {
                case EventType.PRESS:
                this.handleNotificationData(detail.notification.data);
                case EventType.DISMISSED:
                console.log('User dismissed notification', detail.notification);
                break;
            }
        });

        /**
         * the following method will be called when app was in background and 
         * the push notification was tapped
         */
        // this.removeNotificationOpenedListener = messaging().onNotificationOpenedApp((notificationOpen) => {
        //     // Get the action triggered by the notification being opened
        //     const action = notificationOpen.action;
        //     // Get information about the notification that was opened
        //     const notification = notificationOpen.notification;

        //     this.handleNotificationData(notification.data);
        // });
    }

    createNotificationChannel = (notification, isDataMessage) => {
        // Build a channel
        const channel = {
            id: constants.FCM_CHANNEL_ID,
            name: constants.FCM_CHANNEL_NAME,
            importance: AndroidImportance.HIGH,
            lights: true,
            vibration: true,
            sound: 'default',
            lightColor: colors.primaryHexColor,
            badge: true,
            description: constants.FCM_CHANNEL_DESCRIPTION,
        };

        // Create the channel
        notifee.createChannel(channel);

        // Build a channel group
        const channelGroup = {
            id: constants.FCM_GROUP_ID,
            name: constants.FCM_GROUP_NAME,
        };

        // Create the channel group
        notifee.createChannelGroup(channelGroup);

        if (notification) {
            this.showNotification(notification);
        }
    }

    // Show Notification to User
    showNotification = (notificationObj) => {

        let data = notificationObj.data;
        if (data.unreadMessagesCount) {
            let unreadMessages = data.unreadMessagesCount;
            let unreadAppointments = data.unreadAppointmentsCount;
            let unreadNotifications = data.unreadAdminNotificationsCount;

            if (typeof unreadMessages == 'string') {
                unreadMessages = parseInt(unreadMessages);
            }

            if (typeof unreadAppointments == 'string') {
                unreadAppointments = parseInt(unreadAppointments);
            }

            if (typeof unreadNotifications == 'string') {
                unreadNotifications = parseInt(unreadNotifications);
            }

            let count = unreadMessages + unreadAppointments + unreadNotifications;
            const setParamsForMyArea = NavigationActions.setParams({
                params: {
                    badgeCount: count,
                    unreadMessages,
                    unreadAppointments,
                    unreadNotifications,
                },
                key: screenNames.MY_AREA,
            });
            this.props.navigation.dispatch(setParamsForMyArea);
            notifee.setBadgeCount(count)
        }

        const groupId = constants.FCM_GROUP_ID;

        // Create a notification
        const groupNotification = {
            title: Platform.OS === constants.ANDROID ? data.title : notificationObj.notification.title,
            body: Platform.OS === constants.ANDROID ? data.body : notificationObj.notification.body,
            android: {
                channelId: groupId,
                smallIcon: '@mipmap/ic_notification_icon',
                autoCancel: true,
                color: colors.primaryHexColor,
                group: constants.FCM_GROUP_ID,
                groupSummary: true,
                groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
            },
        };


        const channelId = constants.FCM_CHANNEL_ID;
        const notification = {
            id: notificationObj.messageId,
            title: Platform.OS === constants.ANDROID ? data.title : notificationObj.notification.title,
            body: Platform.OS === constants.ANDROID ? data.body : notificationObj.notification.body,
            data: data,
            android: {
                autoCancel: true,
                channelId: channelId,
                color: colors.primaryHexColor,
                badgeIconType: AndroidBadgeIconType.LARGE,
                smallIcon: '@mipmap/ic_notification_icon',
                tag: constants.FCM_TAG,
                priority: AndroidImportance.HIGH,
                defaults: [AndroidDefaults.SOUND, AndroidDefaults.VIBRATE],
                groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
            },
        };

        if (Platform.OS === constants.ANDROID && Platform.Version >= 28) {
            notification.android.group = constants.FCM_GROUP_ID;
            notifee.displayNotification(groupNotification);
        }

        notifee.displayNotification(notification);



    }

    // Handle Notification Data
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

    // Pull to refresh listener
    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
            hotDealsArray: [],
            actionsArray: [],
            eventsArray: [],
            showNoHotDeals: false,
            showNoActions: false,
            showNoEvents: false,
        })
        this.hotDealIndex = 1
        this.hotDealPaginationRequired = true
        this.actionsIndex = 1
        this.actionsPaginationRequired = true
        this.eventsIndex = 1
        this.eventsPaginationRequired = true

        this.apiCount = 0

        getUnreadCounts(this.props.navigation)

        this.checkIfPermissionGranted();
    }

    componentWillUnmount() {
        if (this.changeEventListener) {
            this.changeEventListener.remove();
        }
        if (this.didBlurSubscription) {
            this.didBlurSubscription.remove();
        }
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }
        if (this.removeNotificationListener) {
            this.removeNotificationListener();
        }
        if (this.removeNotificationOpenedListener) {
            this.removeNotificationOpenedListener();
        }
        if (this.messageListener) {
            this.messageListener();
        }
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
            getUnreadCounts(this.props.navigation)

            if (this.isComingFromSettings) {
                this.isComingFromSettings = false
                this.checkIfPermissionGranted();
            }
        }
    };

    // Android default back button handler
    handleBackPress = () => {
        this.backCount++
        if (this.backCount == 2) {
            clearTimeout(this.backTimer)
            BackHandler.exitApp()
        } else {
            ToastAndroid.show(strings.press_back_again_to_exit, ToastAndroid.SHORT);
            this.backTimer = setTimeout(() => {
                this.backCount = 0
            }, constants.BACK_WAIT_TIME)
        }

        return true;
    }

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
        }
        else {
            this.checkForLocation();
        }
    }



    // Android request Location Permission
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

    // Get latest location
    checkForLocation() {
        this.setState({
            showModalLoader: true
        }, () => {
            Geolocation.getCurrentPosition(
                (position) => {
                    this.setState({
                        showModalLoader: false,
                        pullToRefreshWorking: false,
                    }, () => {
                        this.latitude = position.coords.latitude
                        this.longitude = position.coords.longitude

                        isNetworkConnected().then((isConnected) => {
                            if (isConnected) {
                                this.showModalLoader(true);
                                this.getHotDeals();
                                this.getActions();
                                this.getEvents();
                            } else {
                                this.setState({
                                    pullToRefreshWorking: false,
                                }, () => {
                                    alertDialog("", strings.internet_not_connected)
                                })
                            }
                        })

                        // save/update position in async storage
                        AsyncStorageHelper.saveStringAsync(constants.COORDINATES, JSON.stringify(position.coords))
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

    // API to get Hot Deals
    getHotDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                type: itemTypes.HOT_DEAL,
                category: null,
                subCategory: null,
                filterCategory: null,
                pageIndex: this.hotDealIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
                dateFrom: null,
                dateTo: null,
            }

            this.apiCount++
            hitApi(urls.GET_PRODUCTS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.hotDealPaginationRequired = false
                }

                let tempArray = this.state.hotDealsArray
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    pullToRefreshWorking: false,
                    hotDealsArray: tempArray,
                    showNoHotDeals: true
                }, () => {
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get Actions
    getActions = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                type: itemTypes.ACTION,
                category: null,
                subCategory: null,
                filterCategory: null,
                pageIndex: this.actionsIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
                dateFrom: null,
                dateTo: null,
            }

            this.apiCount++
            hitApi(urls.GET_PRODUCTS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.actionsPaginationRequired = false
                }

                let tempArray = this.state.actionsArray
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    actionsArray: tempArray,
                    showNoActions: true
                }, () => {
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get Events
    getEvents = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                type: itemTypes.EVENT,
                category: null,
                subCategory: null,
                filterCategory: null,
                pageIndex: this.eventsIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
                dateFrom: null,
                dateTo: null,
            }

            this.apiCount++
            hitApi(urls.GET_PRODUCTS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.eventsPaginationRequired = false
                }

                let tempArray = this.state.eventsArray
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    eventsArray: tempArray,
                    showNoEvents: true
                }, () => {
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get User Settings
    getUserSettings = () => {
        isUserLoggedIn()
            .then((isUserLoggedIn) => {
                if (isUserLoggedIn && isUserLoggedIn === 'true') {
                    getCommonParamsForAPI().then((commonParams) => {
                        const params = {
                            ...commonParams,
                        }

                        hitApi(urls.GET_SETTINGS, urls.POST, params, null, (jsonResponse) => {
                            if (jsonResponse && jsonResponse.response && jsonResponse.response.data && jsonResponse.response.data.length > 0) {
                                let value = jsonResponse.response.data[0].setting_value
                                if (typeof value == 'string') {
                                    value = parseInt(value)
                                }
                                if (value > 0) {
                                    constants.CURRENT_COUNT_FOR_FAILURE = value
                                } else {
                                    constants.CURRENT_COUNT_FOR_FAILURE = 3 // default 3
                                }
                            }
                        })
                    })
                }
            });
    }

    // API to get Product's details
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

    goToViewAllScreen = (type) => {
        this.props.navigation.navigate(screenNames.VIEW_ALL_SCREEN, { ITEM_TYPE: type })
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

    showHotDealLoader = (shouldShow) => {
        this.setState({
            showHotDealLoader: shouldShow
        })
    }

    showActionsLoader = (shouldShow) => {
        this.setState({
            showActionsLoader: shouldShow
        })
    }

    showEventsLoader = (shouldShow) => {
        this.setState({
            showEventsLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    view: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headingText: {
        color: colors.black,
        fontFamily: fontNames.boldFont,
        marginStart: 18,
        fontSize: 17,
    },
    viewAllTouch: {
        marginStart: 'auto',
        marginEnd: 15,
    },
    viewAll: {
        color: colors.blueTextColor,
        padding: 5,
    },
    flatList: {
        paddingStart: 10,
        minHeight: constants.MIN_HEIGHT_FOR_FLAT_LIST,
    }
});
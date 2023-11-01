import React, { Component } from 'react'
import {
    View, ScrollView, StyleSheet, TouchableOpacity, FlatList,
    Platform, PermissionsAndroid, TouchableWithoutFeedback,
    Linking, AppState, BackHandler, ToastAndroid, Alert, StatusBar, RefreshControl, Modal
} from 'react-native'
import { StackActions, NavigationActions } from 'react-navigation'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import HeaderComponent from '../components/HeaderComponent'
import ImageComponent from '../components/ImageComponent'
import LoaderComponent from '../components/LoaderComponent'
import commonStyles from '../styles/StylesUser'
import strings from '../config/Strings'
import colors from '../config/Colors'
import { scheduleTypes, fontNames, sizes, constants, itemTypes, urls, screenNames, notificationTypes, } from '../config/Constants'
import {
    parseDate, getCommonParamsForAPI, getScreenDimensions, parseTime2, parseTimeWithoutUnit, isUserLoggedIn,
    getImageDimensions, toGermanCurrency, parseTextForCard, parseDiscountApplied, getCurrencyFormat,
    getTimeOffset, handleErrorResponse, getCircularReplacer, alertDialog, parseTime, startStackFrom, isNetworkConnected,
} from '../utilities/HelperFunctions'
import FastImage from 'react-native-fast-image'
import { hitApi } from '../api/ApiCall'
import SmallButtonComponent from '../components/SmallButtonComponent'
import ButtonComponent from '../components/ButtonComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidBadgeIconType, AndroidDefaults, AndroidGroupAlertBehavior, AndroidImportance, EventType } from '@notifee/react-native';

/**
 * Entrepreneur Home Screen
 */
export default class UserHomeScreen extends Component {
    constructor(props) {
        super(props);
        this.hotDealIndex = 1
        this.hotDealPaginationRequired = true

        this.actionsIndex = 1
        this.actionsPaginationRequired = true

        this.eventsIndex = 1
        this.eventsPaginationRequired = true

        this.bonusDealIndex = 1
        this.bonusDealPaginationRequired = true

        this.shouldHitPagination = true
        this.apiCount = 0;

        this.didBlurSubscription = null;
        this.didFocusSubscription = null;

        this.isInitial = true

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

            bonusDealsArray: [],
            showBonusDealLoader: false,

            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            productTypeForSchedule: null,
            schedulerData: [],

            showNoHotDeals: false,
            showNoActions: false,
            showNoEvents: false,
            showNoBonusDeals: false,

            showBonusInfoPopup: false,
            schedulerProductPromotionEndDate: null,
        }

        this.backHandler = null
        this.backCount = 0

        this.screenDimensions = getScreenDimensions()
        this.cardUpperBgImage = getImageDimensions(require('../assets/cardUpperBg.png'))
        this.cardLowerBgWithCut = getImageDimensions(require('../assets/cardLowerBgWithCut.png'))
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.my_promotions}
                    navigation={this.props.navigation}
                    isHomeScreen={true} />
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
                                    {strings.cancel}
                                </ButtonComponent>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles.loginPopupButton}
                                    onPress={() => startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)}>
                                    {strings.ok}
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
                                <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
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
                                            <TextComponent>{parseTime2(item.endTime)}</TextComponent>
                                        </View>
                                    </View>
                                }
                                showsVerticalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                style={commonStyles.infoFlatList}
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

                {this.state.showBonusInfoPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showBonusInfoPopup: false })
                                }}>
                                <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
                            </TouchableOpacity>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center'
                                }}>
                                {strings.available_till}
                            </TextComponent>
                            <TextComponent style={{ alignSelf: 'center', marginTop: 10 }}>
                                {this.state.schedulerProductPromotionEndDate ?
                                    parseDate(this.state.schedulerProductPromotionEndDate) : ""}
                            </TextComponent>
                            <ButtonComponent
                                isFillRequired={true}
                                style={commonStyles.loginPopupButton}
                                onPress={() => {
                                    this.setState({
                                        showBonusInfoPopup: false
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
                        <RefreshControl refreshing={this.state.pullToRefreshWorking} onRefresh={this.onPullToRefresh} />
                    }>
                    <HeaderComponent
                        image={require('../assets/homeHeader.png')}>
                    </HeaderComponent>

                    {/* Hot Deals */}
                    {(this.state.hotDealsArray && this.state.hotDealsArray.length > 0) ?
                        <View>
                            <View style={[styles.view, { marginTop: 10 }]}>
                                <TextComponent style={styles.headingText}>
                                    {strings.hot_deals}
                                </TextComponent>
                                <TouchableOpacity
                                    style={styles.viewAllTouch}
                                    onPress={() => {
                                        this.goToViewAllScreen(itemTypes.HOT_DEAL)
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
                                                    this.dealDetailScreenIntent(item, itemTypes.HOT_DEAL)
                                                }}>
                                                <View>
                                                    <View style={[{
                                                        width: this.cardUpperBgImage.width, height: this.cardUpperBgImage.height,
                                                    }, commonStyles.centerInContainer]}>
                                                        <ImageComponent
                                                            source={require('../assets/placeholderLogo.png')} />
                                                        <FastImage
                                                            style={commonStyles.productImage}
                                                            source={{
                                                                uri: item.productImage ? item.productImage : "",
                                                            }}
                                                            resizeMode={FastImage.resizeMode.cover}
                                                        />
                                                        <ImageComponent
                                                            style={commonStyles.cardBadgeIcon}
                                                            source={
                                                                item.productType === itemTypes.BONUS_DEAL ?
                                                                    require('../assets/bonusBadge.png')
                                                                    :
                                                                    require('../assets/hotDeal.png')
                                                            } />

                                                        <View style={[commonStyles.rowContainer, { position: 'absolute', left: 10, top: 10 }]}>
                                                            <ImageComponent
                                                                source={
                                                                    item.productIsPublished
                                                                        ? require('../assets/publishedIcon.png') :
                                                                        require('../assets/unpublishedIcon.png')} />
                                                            {!item.productIsActive &&
                                                                <ImageComponent
                                                                    style={{ marginLeft: 10 }}
                                                                    source={require('../assets/inactive.png')} />
                                                            }
                                                        </View>

                                                        <View style={commonStyles.cardTitleContainer}>
                                                            <ImageComponent
                                                                source={require('../assets/cardTitleBg.png')} />
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
                                                                        <TextComponent style={[commonStyles.cardDiscount]}>
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
                                                                icon={require('../assets/infoRound.png')}
                                                                onPress={() => this.fetchProductDetails(item)}>
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
                                                                        + " - " + parseTime2(item.productNextAvailableEndDateTime)
                                                                        : ""
                                                                }
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                                <ImageComponent
                                                                    source={require('../assets/locationBlack.png')} />
                                                                <TextComponent style={commonStyles.cardDistance}>
                                                                    xxx KM
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
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    isNetworkConnected().then((isConnected) => {
                                        if (isConnected) {
                                            if (this.hotDealPaginationRequired && this.shouldHitPagination) {
                                                this.shouldHitPagination = false
                                                this.showModalLoader(true)
                                                this.hotDealIndex++
                                                this.getHotDeals()
                                            }
                                        } else {
                                            alertDialog("", strings.internet_not_connected)
                                        }
                                    })
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
                        </View>
                        : <View />
                    }

                    {/* Actions */}
                    {(this.state.actionsArray && this.state.actionsArray.length > 0) ?
                        <View>
                            <View style={styles.view}>
                                <TextComponent style={styles.headingText}>
                                    {strings.mein_regensburg}
                                </TextComponent>
                                <TouchableOpacity
                                    style={styles.viewAllTouch}
                                    onPress={() => {
                                        this.goToViewAllScreen(itemTypes.ACTION)
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
                                                    this.dealDetailScreenIntent(item, itemTypes.ACTION)
                                                }}>
                                                <View>
                                                    <View style={[{
                                                        width: this.cardUpperBgImage.width, height: this.cardUpperBgImage.height,
                                                    }, commonStyles.centerInContainer]}>
                                                        <ImageComponent
                                                            source={require('../assets/placeholderLogo.png')} />
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
                                                                source={require('../assets/hotDeal.png')} />
                                                        }

                                                        <View style={[commonStyles.rowContainer, { position: 'absolute', left: 10, top: 10 }]}>
                                                            <ImageComponent
                                                                source={
                                                                    item.productIsPublished
                                                                        ? require('../assets/publishedIcon.png') :
                                                                        require('../assets/unpublishedIcon.png')} />
                                                            {!item.productIsActive &&
                                                                <ImageComponent
                                                                    style={{ marginLeft: 10 }}
                                                                    source={require('../assets/inactive.png')} />
                                                            }
                                                        </View>

                                                        <View style={commonStyles.cardTitleContainer}>
                                                            <ImageComponent
                                                                source={require('../assets/cardTitleBg.png')} />
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
                                                                        <TextComponent style={[commonStyles.cardDiscount]}>
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
                                                                icon={require('../assets/infoRound.png')}
                                                                onPress={() => this.fetchProductDetails(item)}>
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
                                                                        + " - " + parseTime2(item.productNextAvailableEndDateTime)
                                                                        : ""
                                                                }
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                                <ImageComponent
                                                                    source={require('../assets/locationBlack.png')} />
                                                                <TextComponent style={commonStyles.cardDistance}>
                                                                    xxx KM
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
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    isNetworkConnected().then((isConnected) => {
                                        if (isConnected) {
                                            if (this.actionsPaginationRequired && this.shouldHitPagination) {
                                                this.shouldHitPagination = false
                                                this.showModalLoader(true)
                                                this.actionsIndex++
                                                this.getActions()
                                            }
                                        } else {
                                            alertDialog("", strings.internet_not_connected)
                                        }
                                    })
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
                        </View>
                        : <View />
                    }

                    {/* Events */}
                    {/* {(this.state.eventsArray && this.state.eventsArray.length > 0) ?
                        <View>
                            <View style={styles.view}>
                                <TextComponent style={styles.headingText}>
                                    {strings.events}
                                </TextComponent>
                                <TouchableOpacity
                                    style={styles.viewAllTouch}
                                    onPress={() => {
                                        this.goToViewAllScreen(itemTypes.EVENT)
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
                                                    this.dealDetailScreenIntent(item, itemTypes.EVENT)
                                                }}>
                                                <View>
                                                    <View style={[{
                                                        width: this.cardUpperBgImage.width, height: this.cardUpperBgImage.height,
                                                    }, commonStyles.centerInContainer]}>
                                                        <ImageComponent
                                                            source={require('../assets/placeholderLogo.png')} />
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
                                                                source={require('../assets/hotDeal.png')} />
                                                        }

                                                        <View style={[commonStyles.rowContainer, { position: 'absolute', left: 10, top: 10 }]}>
                                                            <ImageComponent
                                                                source={
                                                                    item.productIsPublished
                                                                        ? require('../assets/publishedIcon.png') :
                                                                        require('../assets/unpublishedIcon.png')} />
                                                            {!item.productIsActive &&
                                                                <ImageComponent
                                                                    style={{ marginLeft: 10 }}
                                                                    source={require('../assets/inactive.png')} />
                                                            }
                                                        </View>

                                                        <View style={commonStyles.cardTitleContainer}>
                                                            <ImageComponent
                                                                source={require('../assets/cardTitleBg.png')} />
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
                                                                        <TextComponent style={[commonStyles.cardDiscount]}>
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
                                                                icon={require('../assets/infoRound.png')}
                                                                onPress={() => this.fetchProductDetails(item)}>
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
                                                                        + " - " + parseTime2(item.productNextAvailableEndDateTime)
                                                                        : ""
                                                                }
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                                <ImageComponent
                                                                    source={require('../assets/locationBlack.png')} />
                                                                <TextComponent style={commonStyles.cardDistance}>
                                                                    xxx KM
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
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    isNetworkConnected().then((isConnected) => {
                                        if (isConnected) {
                                            if (this.eventsPaginationRequired && this.shouldHitPagination) {
                                                this.shouldHitPagination = false
                                                this.showModalLoader(true)
                                                this.eventsIndex++
                                                this.getEvents()
                                            }
                                        } else {
                                            alertDialog("", strings.internet_not_connected)
                                        }
                                    })
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
                        </View>
                        : <View />
                    } */}

                    {/* Bonus Deals */}
                    {(this.state.bonusDealsArray && this.state.bonusDealsArray.length > 0) ?
                        <View>
                            <View style={[styles.view, { marginTop: 10 }]}>
                                <TextComponent style={styles.headingText}>
                                    {strings.bonus_deals}
                                </TextComponent>
                                <TouchableOpacity
                                    style={styles.viewAllTouch}
                                    onPress={() => {
                                        this.goToViewAllScreen(itemTypes.BONUS_DEAL)
                                    }}>
                                    <TextComponent style={styles.viewAll}>
                                        {strings.view_all}
                                    </TextComponent>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={this.state.bonusDealsArray}
                                renderItem={({ item }) =>
                                    <View style={[commonStyles.cardShadow, commonStyles.cardMargins]}>
                                        <View style={commonStyles.cardRadius}>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.dealDetailScreenIntent(item, itemTypes.BONUS_DEAL)
                                                }}>
                                                <View>
                                                    <View style={[{
                                                        width: this.cardUpperBgImage.width, height: this.cardUpperBgImage.height,
                                                    }, commonStyles.centerInContainer]}>
                                                        <ImageComponent
                                                            source={require('../assets/placeholderLogo.png')} />
                                                        <FastImage
                                                            style={commonStyles.productImage}
                                                            source={{
                                                                uri: item.productImage ? item.productImage : "",
                                                            }}
                                                            resizeMode={FastImage.resizeMode.cover}
                                                        />
                                                        <ImageComponent
                                                            style={commonStyles.cardBadgeIcon}
                                                            source={
                                                                item.productType === itemTypes.BONUS_DEAL ?
                                                                    require('../assets/bonusBadge.png')
                                                                    :
                                                                    require('../assets/hotDeal.png')
                                                            } />

                                                        <View style={[commonStyles.rowContainer, { position: 'absolute', left: 10, top: 10 }]}>
                                                            <ImageComponent
                                                                source={
                                                                    item.productIsPublished
                                                                        ? require('../assets/publishedIcon.png') :
                                                                        require('../assets/unpublishedIcon.png')} />
                                                            {!item.productIsActive &&
                                                                <ImageComponent
                                                                    style={{ marginLeft: 10 }}
                                                                    source={require('../assets/inactive.png')} />
                                                            }
                                                        </View>

                                                        <View style={commonStyles.cardTitleContainer}>
                                                            <ImageComponent
                                                                source={require('../assets/cardTitleBg.png')} />
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
                                                                        <TextComponent style={[commonStyles.cardDiscount]}>
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
                                                                icon={require('../assets/infoRound.png')}
                                                                onPress={() => {
                                                                    this.setState({
                                                                        schedulerProductPromotionEndDate: item.productPromotionEndDate,
                                                                        showBonusInfoPopup: true
                                                                    });
                                                                }}>
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
                                                                        + " - " + parseTime2(item.productNextAvailableEndDateTime)
                                                                        : ""
                                                                }
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                                <ImageComponent
                                                                    source={require('../assets/locationBlack.png')} />
                                                                <TextComponent style={commonStyles.cardDistance}>
                                                                    xxx KM
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
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    isNetworkConnected().then((isConnected) => {
                                        if (isConnected) {
                                            if (this.bonuDealPaginationRequired && this.shouldHitPagination) {
                                                this.shouldHitPagination = false
                                                this.showModalLoader(true)
                                                this.bonusDealIndex++
                                                this.getBonusDeals()
                                            }
                                        } else {
                                            alertDialog("", strings.internet_not_connected)
                                        }
                                    })
                                }}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={
                                    <View style={[commonStyles.container, commonStyles.centerInContainer,
                                    { backgroundColor: colors.transparent, marginEnd: 15 }]}>
                                        <LoaderComponent
                                            shouldShow={this.state.showBonusDealLoader} />
                                    </View>
                                }
                                ListEmptyComponent={
                                    this.state.showNoBonusDeals &&
                                    <View style={{ flex: 1, justifyContent: 'center', marginStart: 12 }}>
                                        <TextComponent>{strings.no_bonus_deals_found}</TextComponent>
                                    </View>
                                }
                            />
                        </View>
                        : <View />
                    }

                </ScrollView>
            </View >
        );
    }

    componentDidMount() {
        AppState.addEventListener('change', this._handleAppStateChange);

        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
                this.getUnreadCount();
                if (this.isInitial) {
                    this.isInitial = false
                    this.hitAllApis()
                }
            }
        );

        this.didBlurSubscription = this.props.navigation.addListener(
            'didBlur',
            payload => {
                if (this.backHandler) {
                    this.backHandler.remove()
                }
            }
        );
        this.registerFcmReceivers();
        this.createNotificationChannel(null);

        this.getUserSettings();
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
            this.getUnreadCount();
        }
    };

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

    // request for push permission
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
                    constants.CURRENT_CHAT_ID == data.businessId) {
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
            if (type === EventType.PRESS) {
                this.handleNotificationData(detail.notification.data);
            }
        });

        /**
         * the following method will be called when app was in background and 
         * the push notification was tapped
         */
        this.removeNotificationOpenedListener = messaging().onNotificationOpenedApp((notificationOpen) => {
            // Get the action triggered by the notification being opened
            const action = notificationOpen.action;
            // Get information about the notification that was opened
            const notification = notificationOpen.notification;

            this.handleNotificationData(notification.data);
        });
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

    // handle notification data
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

    // hit all required APIs of the screen
    hitAllApis = () => {
        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                this.setState({
                    hotDealsArray: [],
                    actionsArray: [],
                    eventsArray: [],
                    bonusDealsArray: [],
                    showModalLoader: true,
                    showNoHotDeals: false,
                    showNoActions: false,
                    showNoEvents: false,
                    showNoBonusDeals: false,
                }, () => {
                    this.hotDealIndex = 1
                    this.hotDealPaginationRequired = true
                    this.actionsIndex = 1
                    this.actionsPaginationRequired = true
                    this.eventsIndex = 1
                    this.eventsPaginationRequired = true
                    this.bonusDealIndex = 1
                    this.bonusDealPaginationRequired = true

                    this.shouldHitPagination = true
                    this.apiCount = 0
                    this.getHotDeals();
                    this.getActions();
                    this.getEvents();
                    this.getBonusDeals();
                })
            } else {
                this.setState({
                    pullToRefreshWorking: false,
                }, () => {
                    alertDialog("", strings.internet_not_connected)
                })
            }
        })
    }

    // pull to refresh listener
    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.getUnreadCount();
            this.hitAllApis();
        })
    }

    // api to get user settings
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

    componentWillUnmount() {

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
        // if (this.messageListener) {
        //     this.messageListener();
        // }
    }

    // open hot deal detail screen
    dealDetailScreenIntent(item, type) {
        this.props.navigation.navigate(screenNames.HOT_DEAL_DETAIL_SCREEN, {
            PRODUCT_ID: item.productId,
            PRODUCT_LAT: item.productLng,
            PRODUCT_LNG: item.productLat,
            TYPE_OF_DEAL: type
        })
    }

    // Android - back button handler
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

    showBonusDealLoader = (shouldShow) => {
        this.setState({
            showBonusDealLoader: shouldShow
        })
    }

    goToViewAllScreen = (type) => {
        this.props.navigation.navigate(screenNames.VIEW_ALL_DEALS_SCREEN, { ITEM_TYPE_ID: type })
    }

    // api to get hot deals
    getHotDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: itemTypes.HOT_DEAL,
                category: null,
                subCategory: null,
                filterCategory: null,
                pageIndex: this.hotDealIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
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

    // api to get actions
    getActions = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: itemTypes.ACTION,
                category: null,
                subCategory: null,
                filterCategory: null,
                pageIndex: this.actionsIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
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

    // api to get events
    getEvents = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: itemTypes.EVENT,
                category: null,
                subCategory: null,
                filterCategory: null,
                pageIndex: this.eventsIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
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

    // api to get bonus deals
    getBonusDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: itemTypes.BONUS_DEAL,
                category: null,
                subCategory: null,
                filterCategory: null,
                pageIndex: this.bonusDealIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
            }

            this.apiCount++
            hitApi(urls.GET_PRODUCTS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.bonusDealPaginationRequired = false
                }

                let tempArray = this.state.bonusDealsArray
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    pullToRefreshWorking: false,
                    bonusDealsArray: tempArray,
                    showNoBonusDeals: true
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

    // api to get unread counts
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

    // api to get product's details
    fetchProductDetails = (item) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: item.productId,
                lat: item.productLng,
                lng: item.productLat,
                timeOffset: getTimeOffset(),
            }

            hitApi(urls.GET_PRODUCT_DETAIL_ENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                setTimeout(() => {
                    this.setState({
                        scheduleType: jsonResponse.response.scheduleType,
                        schedulerRedemptionStartDate: jsonResponse.response.productRedemptionStartDate,
                        schedulerRedemptionEndDate: jsonResponse.response.productRedemptionEndDate,
                        schedulerData: jsonResponse.response.productScheduler,
                        productTypeForSchedule: jsonResponse.response.productType,
                        showInfoPopup: true
                    })
                }, constants.HANDLING_TIMEOUT)
            })
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
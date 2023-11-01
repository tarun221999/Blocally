import React, { Component } from 'react'
import {
    View, TouchableOpacity, StyleSheet, ScrollView, Modal, Linking, FlatList, Platform,
    PermissionsAndroid,
} from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    constants, dealStatuses, urls, fontNames, sizes, scheduleTypes, screenNames,
    favoriteType, favoriteRequests, itemTypes, statsTypes, databaseConstants, productDuration,
} from '../../config/constants'
import {
    getScreenDimensions, getCommonParamsForAPI, parseDiscountApplied, startStackFrom, isUserLoggedIn,
    getImageDimensions, parseDate, parseTime, openUrlInBrowser, getExactTimeOffset,
    alertDialog, getCurrencyFormat, parseTimeWithoutUnit, parseTextForCard, getTimeOffset, 
    getPlainTextFromHtml, handleErrorResponse, checkIfDateIsInRange, getUnreadCounts,checkIfDateIsInRangeHotDeal
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import FastImage from 'react-native-fast-image'
import ProductMenuSchema from '../../database/ProductMenuSchema'
import ProductSchedulerSchema from '../../database/ProductSchedulerSchema'
import DealsSchema from '../../database/DealsSchema'
import Realm from 'realm'
import ReactNativeBlobUtil from 'rn-fetch-blob'
import { getDistance } from 'geolib';
import Geolocation from 'react-native-geolocation-service';

/**
 * Hot Deal Detail Screen
 */
export default class HotDealDetailScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.headerImageHeight = this.screenDimensions.width * constants.HEADER_IMAGE_HEIGHT_PERCENTAGE

        this.currentLatitude = 0
        this.currentLongitude = 0
        this.initial = true
        this.productId = this.props.navigation.state.params.PRODUCT_ID
        this.didFocusSubscription = null
        this.state = {
            showModalLoader: false,
            product: {},
            showLoginPopup: false,
            showGetDealPopup: false,
            showInfoPopup: false,
            shouldRenderUI: false,
            showBonusInfoPopup: false,
            showDealAddedPopup: false,
            showBonusAddedPopup: false,
            showCheckInFailedPopup: false,
            showCheckInDonePopup: false,
        }

        this.realm = null
        this.initRealm()
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />

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

                {this.state.showGetDealPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, { backgroundColor: colors.blurBackground }]}>
                        <View style={[{ width: '90%', backgroundColor: colors.white, padding: 15, borderRadius: 10 }]}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showGetDealPopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                            </TouchableOpacity>
                            <TextComponent style={{ color: colors.primaryColor, fontFamily: fontNames.boldFont, fontSize: sizes.largeTextSize }}>
                                {strings.you_are_interested_in_hot_deal}
                            </TextComponent>

                            <TextComponent style={{ marginTop: 15, fontWeight: 'bold' }}>
                                {strings.secure_a_hot_deal}
                            </TextComponent>
                            <TextComponent>
                                {strings.secure_hot_deal_paragraph}
                            </TextComponent>
                            <TextComponent style={{ marginTop: 15, fontWeight: 'bold', }}>
                                {strings.direct_booking}
                            </TextComponent>
                            <TextComponent>
                                {strings.direct_booking_paragraph}
                            </TextComponent>

                            {(this.state.product.dealDetail && this.state.product.dealDetail.dealStatusId === dealStatuses.SAVED) ?
                                <ButtonComponent
                                    isFillRequired={true}
                                    color={colors.purpleButtonLight}
                                    style={[styles.unsaveButton, { width: '80%', marginTop: 15, }]}
                                    icon={require('../../assets/unsave.png')}
                                    onPress={() => {
                                        this.unsaveDeal()
                                    }}>
                                    {strings.unsave}
                                </ButtonComponent>
                                :
                                <ButtonComponent
                                    isFillRequired={true}
                                    color={(this.state.product.productEnableSave && this.state.product.productNextAvailableStartDateTime)
                                        ? colors.purpleButtonLight : colors.disabledGreyColor}
                                    style={{
                                        marginTop: 15, width: '80%', alignSelf: 'center',
                                    }}
                                    onPress={() => {
                                        if (this.state.product.productEnableSave && this.state.product.productNextAvailableStartDateTime) {
                                            this.setState({
                                                showGetDealPopup: false
                                            }, () => {
                                                if (this.state.product.productIsHotDealUnlimited) {
                                                    if (this.state.product.allowedDeals > 0) {
                                                        this.checkForLocation(1)
                                                    } else {
                                                        this.showMaxLimitReachedPopup()
                                                    }
                                                } else if (this.state.product.hotDealLeft > 0) {
                                                    if (this.state.product.allowedDeals > 0) {
                                                        this.checkForLocation(1)
                                                    } else {
                                                        this.showMaxLimitReachedPopup()
                                                    }
                                                } else {
                                                    alertDialog("", strings.no_more_deals_left)
                                                }
                                            })
                                        }
                                    }}>
                                    {strings.check_in}
                                </ButtonComponent>
                            }

                            <ButtonComponent
                                isFillRequired={true}
                                color={((this.state.product.productEnableBookings && this.state.product.productNextAvailableStartDateTime)
                                    || this.state.product.productRedirectToEntURL)
                                    ? colors.purpleButton : colors.disabledGreyColor}
                                style={{ marginTop: 15, width: '80%', alignSelf: 'center' }}
                                onPress={() => {
                                    if (this.state.product.productRedirectToEntURL) {
                                        this.setState({
                                            showGetDealPopup: false
                                        }, () => {
                                            if (this.state.product.websiteURL && this.state.product.websiteURL.length > 0) {
                                                openUrlInBrowser(this.state.product.websiteURL)
                                            } else {
                                                alertDialog("", strings.url_not_available);
                                            }
                                        })
                                    } else {
                                        if (this.state.product.productEnableBookings && this.state.product.productNextAvailableStartDateTime) {
                                            this.setState({
                                                showGetDealPopup: false
                                            }, () => {
                                                if (this.state.product.productIsHotDealUnlimited) {
                                                    /**
                                                     * New Change
                                                     * Remove check for allowed deals
                                                     */
                                                    this.props.navigation.navigate(screenNames.ADD_APPOINTMENT_SCREEN, {
                                                        BUSINESS_ID: this.state.product.businessId,
                                                        MESSAGE_ID: this.state.product.messageId,
                                                        PRODUCT_ID: this.productId,
                                                        PRODUCT_TYPE: this.state.product.productType,
                                                    });
                                                } else if (this.state.product.hotDealLeft > 0) {
                                                    /**
                                                     * New Change
                                                     * Remove check for allowed deals
                                                     */
                                                    this.props.navigation.navigate(screenNames.ADD_APPOINTMENT_SCREEN, {
                                                        BUSINESS_ID: this.state.product.businessId,
                                                        MESSAGE_ID: this.state.product.messageId,
                                                        PRODUCT_ID: this.productId,
                                                        PRODUCT_TYPE: this.state.product.productType,
                                                    });
                                                } else {
                                                    alertDialog("", strings.no_more_deals_left)
                                                }
                                            })
                                        }
                                    }
                                }}>
                                {strings.reserve}
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
                            {this.state.product.scheduleType == scheduleTypes.DAYS &&
                                <View style={{ marginTop: 5 }}>
                                    <TextComponent style={{ alignSelf: 'center', }}>
                                        {this.state.product.productRedemptionStartDate ?
                                            (strings.from + " " +
                                                parseDate(this.state.product.productRedemptionStartDate)
                                                + " " + strings.to + " " +
                                                parseDate(this.state.product.productRedemptionEndDate))
                                            : ""}
                                    </TextComponent>
                                    <TextComponent style={{ alignSelf: 'center', marginTop: 5 }}>
                                        {strings.on_following_days}
                                    </TextComponent>
                                </View>
                            }
                            <FlatList
                                data={this.state.product.productScheduler}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.rowContainer, { marginBottom: 10, marginStart: 20, marginEnd: 20 }]}>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont }}>
                                            {
                                                this.state.product.scheduleType == scheduleTypes.DAYS ?
                                                    index > 0 ?
                                                        this.state.product.productScheduler[index - 1].scheduleDay == item.scheduleDay ?
                                                            "" : strings.days_of_week[item.scheduleDay - 1]
                                                        :
                                                        strings.days_of_week[item.scheduleDay - 1]
                                                    :
                                                    index > 0 ?
                                                        parseDate(this.state.product.productScheduler[index - 1].startTime) == parseDate(item.startTime) ?
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
                                        showCheckInFailedPopup: false
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
                                            // this.fetchDealDetails()
                                            this.props.navigation.navigate(screenNames.MY_HOT_DEALS_SCREEN, {
                                                COMING_FROM: screenNames.HOT_DEAL_DETAIL_SCREEN
                                            })
                                        })
                                    }}>
                                    {strings.done}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                {/* show deal added popup */}
                {this.state.showDealAddedPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, { backgroundColor: colors.blurBackground }]}>
                        <View style={[{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }]}>
                            <TextComponent style={{
                                color: colors.primaryColor, fontFamily: fontNames.boldFont, fontSize: sizes.largeTextSize,
                                alignSelf: 'center'
                            }}>
                                {strings.deal_added}
                            </TextComponent>
                            <TextComponent style={{ marginTop: 20 }}>
                                {strings.as_long_as_available}
                            </TextComponent>
                            <TextComponent style={{ marginTop: 10, fontWeight: 'bold' }}>
                                {strings.note + ": "}
                                <TextComponent style={{ fontWeight: 'normal' }}>
                                    {strings.please_tell_provider}
                                </TextComponent>
                            </TextComponent>
                            <TextComponent style={{ marginTop: 10, fontWeight: 'bold', }}>
                                {strings.no_network_at_provider}
                            </TextComponent>
                            <TextComponent style={{ marginTop: 2 }}>
                                {strings.no_problem_check_in}
                            </TextComponent>

                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButton}
                                style={{ marginTop: 20, width: '80%', alignSelf: 'center' }}
                                onPress={() => {
                                    this.setState({
                                        showDealAddedPopup: false
                                    }, () => {
                                        this.props.navigation.navigate(screenNames.MY_HOT_DEALS_SCREEN)
                                    })
                                }}>
                                {strings.done}
                            </ButtonComponent>
                        </View>
                    </View>
                </Modal>
                }

                {/* show bonus added popup */}
                {this.state.showBonusAddedPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, { backgroundColor: colors.blurBackground }]}>
                        <View style={[{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }]}>
                            <TextComponent style={{
                                color: colors.primaryColor, fontFamily: fontNames.boldFont, fontSize: sizes.largeTextSize,
                                alignSelf: 'center'
                            }}>
                                {strings.bonus_added}
                            </TextComponent>
                            <TextComponent style={{ marginTop: 20 }}>
                                {strings.for_one_year}
                            </TextComponent>
                            <TextComponent style={{ marginTop: 10, fontWeight: 'bold' }}>
                                {strings.note + ": "}
                                <TextComponent style={{ fontWeight: 'normal' }}>
                                    {strings.please_tell_provider_bonus}
                                </TextComponent>
                            </TextComponent>
                            <TextComponent style={{ marginTop: 10, fontWeight: 'bold', }}>
                                {strings.no_network_at_provider}
                            </TextComponent>
                            <TextComponent style={{ marginTop: 2 }}>
                                {strings.no_problem_check_in}
                            </TextComponent>

                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButton}
                                style={{ marginTop: 20, width: '80%', alignSelf: 'center' }}
                                onPress={() => {
                                    this.setState({
                                        showBonusAddedPopup: false
                                    }, () => {
                                        this.props.navigation.navigate(screenNames.MY_HOT_DEALS_SCREEN)
                                    })
                                }}>
                                {strings.done}
                            </ButtonComponent>
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
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}} />
                            </TouchableOpacity>
                            <TextComponent
                                style={{
                                    color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center', marginTop: 10
                                }}>
                                {strings.this_deal_can_be_redeemed_on_dates}
                            </TextComponent>

                            {this.state.product.scheduleType === scheduleTypes.DAYS &&
                                <View style={{ marginTop: 5 }}>
                                    <TextComponent style={{ alignSelf: 'center', }}>
                                        {this.state.product.productRedemptionStartDate ?
                                            (strings.from + " " +
                                                parseDate(this.state.product.productRedemptionStartDate)
                                                + " " + strings.to + " " +
                                                parseDate(this.state.product.productRedemptionEndDate))
                                            : ""}
                                    </TextComponent>
                                    <TextComponent style={{ alignSelf: 'center', marginTop: 5 }}>
                                        {strings.on_following_days}
                                    </TextComponent>
                                </View>
                            }
                            <FlatList
                                data={this.state.product.productScheduler}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.rowContainer, { marginBottom: 10, marginStart: 20, marginEnd: 20 }]}>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont }}>
                                            {
                                                this.state.product.scheduleType == scheduleTypes.DAYS ?
                                                    index > 0 ?
                                                        this.state.product.productScheduler[index - 1].scheduleDay == item.scheduleDay ?
                                                            "" : strings.days_of_week[item.scheduleDay - 1]
                                                        :
                                                        strings.days_of_week[item.scheduleDay - 1]
                                                    :
                                                    index > 0 ?
                                                        parseDate(this.state.product.productScheduler[index - 1].startTime) == parseDate(item.startTime) ?
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

                {this.state.showBonusInfoPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showBonusInfoPopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                            </TouchableOpacity>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center'
                                }}>
                                {strings.available_till}
                            </TextComponent>
                            <TextComponent style={{ alignSelf: 'center', marginTop: 10 }}>
                                {this.state.product.productPromotionEndDate ?
                                    parseDate(this.state.product.productPromotionEndDate) : ""}
                            </TextComponent>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center', marginTop: 10
                                }}>
                                {strings.valid_for_one_year}
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

                <View style={[commonStyles.headerBorder, commonStyles.centerInContainer, {
                    width: '100%', height: this.headerImageHeight, backgroundColor: colors.white, zIndex: 3
                }]}>
                    <ImageComponent source={require('../../assets/placeholderLogo.png')} />
                    <FastImage
                        source={{
                            uri: (this.state.product && this.state.product.productImage) ? this.state.product.productImage : "",
                        }}
                        resizeMode={FastImage.resizeMode.cover}
                        style={commonStyles.productImage} />
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 5, start: 10 }}
                        onPress={() => this.props.navigation.goBack(null)}>
                        <ImageComponent source={require('../../assets/backArrowWhiteShadow.png')} />
                    </TouchableOpacity>
                    <ImageComponent
                        style={commonStyles.cardBadgeIcon}
                        source={this.state.product.productType ?
                            this.state.product.productType === itemTypes.BONUS_DEAL ?
                                require('../../assets/bonusBadge.png')
                                : require('../../assets/hotDeal.png')
                            : ""} />
                </View>

                <ScrollView
                    style={{ marginTop: 20, }}
                    showsVerticalScrollIndicator={false}>
                    <View style={{ marginStart: 40, }}>
                        <View style={commonStyles.rowContainer}>
                            <View style={{ width: '70%' }}>
                                <TextComponent style={{ fontSize: sizes.largeTextSize }}>
                                    {this.state.product.productTitle}
                                </TextComponent>

                                <TouchableOpacity
                                    onPress={this.goToDetailsAndConditions}
                                    style={{ marginTop: 5 }}>
                                    <TextComponent>
                                        {parseTextForCard(getPlainTextFromHtml(this.state.product.productDetails), 50)}
                                        <TextComponent style={{ color: colors.blueTextColor }}>
                                            {" " + strings.read_more}
                                        </TextComponent>
                                    </TextComponent>
                                </TouchableOpacity>

                                <View style={[commonStyles.rowContainer, { alignItems: 'center', marginTop: 5, }]}>
                                    <ImageComponent
                                        source={require('../../assets/locationBlack.png')} />
                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, marginStart: 3, fontFamily: fontNames.boldFont }}>
                                        {this.state.product.distance}
                                    </TextComponent>
                                </View>
                            </View>
                            {(this.state.product.productType && this.state.product.productType === itemTypes.HOT_DEAL) &&
                                <TouchableOpacity
                                    onPress={this.manageProductFavorite}
                                    style={{ marginStart: 'auto', paddingHorizontal: 20, paddingBottom: 20, }}>
                                    <ImageComponent
                                        source={this.state.product.isMarkedAsFavourite ?
                                            require('../../assets/bookmarkSelected.png')
                                            : require('../../assets/bookmark.png')} />
                                </TouchableOpacity>
                            }
                        </View>
                        {this.state.shouldRenderUI ?
                            <View style={[commonStyles.rowContainer, { justifyContent: 'space-between', marginTop: 10, marginEnd: 50 }]}>
                                <TextComponent>
                                    <TextComponent style={{
                                        color: this.state.product.productIsHotDealUnlimited ? colors.primaryColor :
                                            colors.blackTextColor
                                    }}>
                                        {this.state.product.productType === itemTypes.BONUS_DEAL ?
                                            (this.state.product.productNoOfScannedForBonus + " " + strings.scans_required)
                                            : this.state.product.productIsHotDealUnlimited ?
                                                strings.until_stock_lasts : (this.state.product.hotDealLeft + " " + strings.left)}
                                    </TextComponent>
                                </TextComponent>
                                <TextComponent>
                                    |
                                </TextComponent>
                                {this.state.shouldRenderUI &&
                                    this.state.product.isDiscounted ?
                                    <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                        <TextComponent style={commonStyles.greenTextColor}>
                                            {this.state.product.discount + strings.percent_discount}
                                        </TextComponent>
                                    </View>
                                    :
                                    <View style={[commonStyles.rowContainer]}>
                                        <TextComponent style={(typeof this.state.product.productOP == 'number' && commonStyles.lineThrough)}>
                                            {this.state.product.productMRP ? getCurrencyFormat(this.state.product.productMRP) :
                                                (typeof this.state.product.productMRP == 'number') ? getCurrencyFormat(this.state.product.productMRP) : ""}
                                        </TextComponent>
                                        <TextComponent style={{ color: colors.green, marginStart: 5, fontFamily: fontNames.boldFont }}>
                                            {this.state.product.productOP ? getCurrencyFormat(this.state.product.productOP) :
                                                (typeof this.state.product.productOP == 'number') ? getCurrencyFormat(this.state.product.productOP) : ""}
                                        </TextComponent>
                                    </View>
                                }
                                <TextComponent>
                                    |
                                </TextComponent>
                                {this.state.shouldRenderUI &&
                                    <TextComponent>
                                        {this.state.product.discountApplied ? "-" + parseDiscountApplied(this.state.product.discountApplied) + "%"
                                            : "-"}
                                    </TextComponent>}
                            </View>
                            :
                            <View>
                                {/* Empty view until data is loaded */}
                            </View>
                        }
                    </View>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={styles.dottedLine} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.product.businessId) {
                                this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                    BUSINESS_ID: this.state.product.businessId
                                })
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/homeIcon.png')} />
                            <TextComponent style={styles.text}>{this.state.product.businessName}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            this.hitAddStats(statsTypes.REDIRECT_TO_GOOGLE_MAP)
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/locationBig.png')} />
                            <TextComponent style={styles.text}>{this.state.product.productAddress}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={this.goToDetailsAndConditions}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/docIcon.png')} />
                            {this.state.shouldRenderUI &&
                                <TextComponent style={styles.text}>
                                    {this.state.product.productType === itemTypes.BONUS_DEAL ?
                                        strings.bonus_details_conditions : strings.deal_details_conditions}
                                </TextComponent>
                            }
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.product.productType === itemTypes.BONUS_DEAL) {
                                this.setState({
                                    showBonusInfoPopup: true
                                })
                            } else {
                                this.setState({
                                    showInfoPopup: true
                                })
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/calendarStar.png')} />
                            <TextComponent style={styles.text}>
                                {strings.redemption_dates}
                            </TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.product.productMenu && this.state.product.productMenu.length > 0) {
                                this.props.navigation.navigate(screenNames.VIEW_ALL_MENU_IMAGES_SCREEN, {
                                    MENU_IMAGES: this.state.product.productMenu,
                                    TITLE: this.state.product.productTitle
                                })
                            } else {
                                alertDialog("", strings.menu_not_available)
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/menuIcon.png')} />
                            <TextComponent style={styles.text}>
                                {this.state.product.productMenuTitle}
                            </TextComponent>
                        </View>
                    </TouchableOpacity>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={[styles.dottedLine, { marginTop: 0 }]} />

                    {this.state.shouldRenderUI ?
                        <View style={[commonStyles.rowContainer, { justifyContent: 'space-evenly', marginVertical: 20 }]}>
                            {
                                this.state.product.productType === itemTypes.BONUS_DEAL ?
                                    <ButtonComponent
                                        isFillRequired={true}
                                        color={colors.purpleButtonLight}
                                        icon={require('../../assets/bonus.png')}
                                        style={styles.button}
                                        onPress={() => {
                                            isUserLoggedIn().then((isUserLoggedIn) => {
                                                if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                                    this.setState({
                                                        showLoginPopup: true
                                                    })
                                                } else {
                                                    if (this.state.product.availableScannedCountOfUser >= this.state.product.productNoOfScannedForBonus) {
                                                        this.availBonusDeal()
                                                    } else {
                                                        let message = strings.this_deal_requires + " " + this.state.product.productNoOfScannedForBonus + " "
                                                            + strings.scans + ". " + strings.you_currently_have + " " + this.state.product.availableScannedCountOfUser
                                                            + " " + strings.scans + "."
                                                        alertDialog("", message)
                                                    }
                                                }
                                            })
                                        }}>
                                        {strings.avail_now}
                                    </ButtonComponent>
                                    :
                                    (this.state.product.productIsHotDealUnlimited || this.state.product.hotDealLeft > 0) ?
                                        <ButtonComponent
                                            isFillRequired={true}
                                            color={colors.purpleButtonLight}
                                            icon={require('../../assets/buy.png')}
                                            style={styles.button}
                                            onPress={() => {
                                                isUserLoggedIn().then((isUserLoggedIn) => {
                                                    if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                                        this.setState({
                                                            showLoginPopup: true
                                                        })
                                                    } else {
                                                        this.setState({
                                                            showGetDealPopup: true
                                                        })
                                                    }
                                                })
                                            }}>
                                            {strings.get_deal}
                                        </ButtonComponent>
                                        :
                                        <ImageComponent source={require('../../assets/soldOut.png')} />
                            }
                        </View>
                        :
                        <View>
                            {/* Empty view until data is loaded */}
                        </View>
                    }
                </ScrollView>
            </View >
        );
    }

    // initialize realm object
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
        AsyncStorageHelper.getStringAsync(constants.COORDINATES)
            .then((strCoordinates) => {
                const coordinates = JSON.parse(strCoordinates);
                this.currentLatitude = coordinates.latitude
                this.currentLongitude = coordinates.longitude
                this.checkIfPermissionGranted();
            })

        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                if (!this.initial) {
                    if (this.productId !== this.props.navigation.state.params.PRODUCT_ID) {
                        this.productId = this.props.navigation.state.params.PRODUCT_ID
                    }
                    this.checkIfPermissionGranted();
                    getUnreadCounts(this.props.navigation)
                }
                this.initial = false
            }
        );
    }

    // check for location permission
    checkIfPermissionGranted() {
        if (Platform.OS == constants.ANDROID) {
            if (Platform.Version >= 23) {
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                    .then(response => {
                        if (response == true) {
                            this.fetchProductDetails();
                        } else {
                            this.requestPermission();
                        }
                    });
            } else {
                this.fetchProductDetails()
            }
        } else {
            this.fetchProductDetails()
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
                this.fetchProductDetails()
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
    checkForLocation(dealCount) {
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
                            { latitude: this.state.product.productLat, longitude: this.state.product.productLng }
                        );

                        setTimeout(() => {
                            this.validateCheckIn(dealCount)
                        }, constants.HANDLING_TIMEOUT)
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
                                    this.checkForLocation(dealCount);
                                })
                            }
                        }
                        if (error.code == 5) {
                            if (Platform.OS === constants.ANDROID) {
                                alertDialog(strings.permission_title, strings.location_off, strings.ok, "", () => {
                                    this.checkForLocation(dealCount);
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
    validateCheckIn = (dealCount) => {
        let currentDateTime = new Date();
        let offset = getExactTimeOffset()
        currentDateTime.setMinutes(currentDateTime.getMinutes() + offset)

        let startDateTime;
        let endDateTime;

        let productExpired = false;
        console.log("nextAvaialable----",this.state.product.productNextAvailableStartDateTime + "///" +this.state.product.productNextAvailableEndDateTime)
        if (this.state.product.productNextAvailableStartDateTime) {
            startDateTime = new Date(this.state.product.productNextAvailableStartDateTime);
            endDateTime = new Date(this.state.product.productNextAvailableEndDateTime);
        } else {
            // it should happen when the last date time has passed
            productExpired = true
        }

        if (productExpired) {
            alertDialog("", strings.product_has_expired)
        } else {
            startDateTime.setMinutes(startDateTime.getMinutes() - constants.EXTENSION_MINUTES)
            //endDateTime.setMinutes(endDateTime.getMinutes() + constants.EXTENSION_MINUTES)
            console.log("currentDate----",currentDateTime + "///" +startDateTime + "///" + endDateTime)
            if (currentDateTime.getTime() > endDateTime.getTime()) {
                // last date time has passed
                alertDialog("", strings.product_has_expired)
            } else if (checkIfDateIsInRangeHotDeal(currentDateTime, startDateTime, endDateTime)) {
                if (this.distance > constants.DISTANCE_FOR_CHECK_IN) {
                    alertDialog("", strings.you_can_check_in_within)
                } else {
                    this.checkInHotDeal(dealCount)
                }
            } else {
                setTimeout(() => {
                    this.setState({
                        showCheckInFailedPopup: true
                    })
                }, constants.HANDLING_TIMEOUT)
            }
        }
    }

    // api to check in hot deal
    checkInHotDeal = (dealForCheckIn) => {
        console.log("checkedinhotdeal--","checkedinhotdeal")
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: this.productId,
                dealForCheckIn,
                lat: this.currentLatitude,
                lng: this.currentLongitude,
                timeOffset: getTimeOffset(),
            }
            console.log("params--",params)
            this.setState({
                showModalLoader: true
            }, () => {
                hitApi(urls.SAVE_DEAL, urls.POST, params, null, (jsonResponse) => {
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
                                alertDialog("", error)
                            })
                        });
                }, (jsonResponse) => {
                    this.setState({
                        showModalLoader: false
                    }, () => {
                        setTimeout(() => {
                            if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.ADD_APPOINTMENT_LIMIT_REACHED) {
                                this.showMaxLimitReachedPopup()
                            } else {
                                handleErrorResponse(this.props.navigation, jsonResponse)
                            }
                        }, constants.HANDLING_TIMEOUT)
                    })
                })
            })
        })
    }

    showMaxLimitReachedPopup = () => {
        let duration = this.state.product.dealDuration == productDuration.DAILY ? "1"
            : this.state.product.dealDuration == productDuration.WEEKLY ? "7"
                : this.state.product.dealDuration == productDuration.MONTHLY ? "30"
                    : "365"
        let strMessage = strings.provider_has_limited + " " + this.state.product.productNoOfDealsPerUser
            + " " + strings.deals_within + " " + duration + " " + strings.already_saved_booked_max
        alertDialog("", strMessage)
    }

    componentWillUnmount() {
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }

        if (this.realm !== null && !this.realm.isClosed) {
            this.realm.close();
        }
    }

    // api to get product's details
    fetchProductDetails = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: this.productId,
                lat: this.currentLatitude,
                lng: this.currentLongitude,
                timeOffset: getTimeOffset(),
                statsType: statsTypes.HOT_DEAL_CLICK,
            }

            hitApi(urls.GET_PRODUCT_DETAIL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.setState({
                    product: jsonResponse.response[0],
                    shouldRenderUI: true,
                });
            }, (jsonResponse) => {
                if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                    this.productUnpublished(jsonResponse.message);
                } else {
                    handleErrorResponse(this.props.navigation, jsonResponse)
                }
            })
        })
    }

    // popup when product is unpublished
    productUnpublished = (message) => {
        alertDialog("", message, strings.ok, "", () => {
            this.props.navigation.goBack(null);
        })
    }

    // api to add deal
    saveDeal = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: this.productId,
                statusId: dealStatuses.SAVED,
            }

            hitApi(urls.ADD_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                let temp = this.state.product
                temp.dealsSavedBookedByUser++
                setTimeout(() => {
                    this.setState({
                        product: temp,
                        showDealAddedPopup: true
                    })
                }, constants.HANDLING_TIMEOUT);
            }, (jsonResponse) => {
                if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                    this.productUnpublished(jsonResponse.message);
                } else {
                    handleErrorResponse(this.props.navigation, jsonResponse)
                }
            })
        })
    }

    // api to remove deal
    unsaveDeal = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId: this.state.product.dealDetail.dealId
            }

            hitApi(urls.REMOVE_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.fetchProductDetails()
            }, (jsonResponse) => {
                if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                    this.productUnpublished(jsonResponse.message);
                } else {
                    handleErrorResponse(this.props.navigation, jsonResponse)
                }
            })
        })
    }

    // api to avail a bonus deal
    availBonusDeal = () => {
        let message = strings.this_deal_requires + " " + this.state.product.productNoOfScannedForBonus + " "
            + strings.scans + ". " + strings.sure_avail_bonus
        alertDialog("", message, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    productId: this.productId,
                    businessId: this.state.product.businessId,
                }

                hitApi(urls.ADD_BONUS_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    setTimeout(() => {
                        this.setState({
                            showBonusAddedPopup: true
                        })
                    }, constants.HANDLING_TIMEOUT);
                }, (jsonResponse) => {
                    if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                        this.productUnpublished(jsonResponse.message);
                    } else {
                        handleErrorResponse(this.props.navigation, jsonResponse)
                    }
                })
            })
        })
    }

    // api to add/remove from fav
    manageProductFavorite = () => {
        isUserLoggedIn().then((isUserLoggedIn) => {
            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                this.setState({
                    showLoginPopup: true
                })
            } else {
                getCommonParamsForAPI().then((commonParams) => {
                    const params = {
                        ...commonParams,
                        favId: this.productId,
                        favType: favoriteType.PRODUCT,
                        addFav: this.state.product.isMarkedAsFavourite ? favoriteRequests.REMOVE_FAVORITE : favoriteRequests.ADD_TO_FAVORITE
                    }

                    hitApi(urls.MANAGE_FAVORITES, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                        let temp = this.state.product
                        temp.isMarkedAsFavourite = !this.state.product.isMarkedAsFavourite
                        this.setState({
                            product: temp
                        })
                    }, (jsonResponse) => {
                        if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                            this.productUnpublished(jsonResponse.message);
                        } else {
                            handleErrorResponse(this.props.navigation, jsonResponse)
                        }
                    })
                })
            }
        })
    }

    // api for stats
    hitAddStats = (statType) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                statsType: statType,
                productId: this.productId,
                businessId: this.state.product.businessId,
            }

            hitApi(urls.ADD_STATS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (statType === statsTypes.REDIRECT_TO_GOOGLE_MAP) {
                    this.openMaps()
                }
            }, (jsonResponse) => {
                if (statType === statsTypes.REDIRECT_TO_GOOGLE_MAP) {
                    this.openMaps()
                }
            })
        })
    }

    showMaxLimitReachedPopup = () => {
        let duration = this.state.product.productDuration == productDuration.DAILY ? "1"
            : this.state.product.productDuration == productDuration.WEEKLY ? "7"
                : this.state.product.productDuration == productDuration.MONTHLY ? "30"
                    : "365"
        let strMessage = strings.provider_has_limited + " " + this.state.product.productNoOfDealsPerUser
            + " " + strings.deals_within + " " + duration + " " + strings.already_saved_booked_max
        alertDialog("", strMessage)
    }

    openMaps = () => {
        const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${this.state.product.productLat},${this.state.product.productLng}`;
        const label = this.state.product.productTitle;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        Linking.openURL(url);
    }

    goToDetailsAndConditions = () => {
        this.props.navigation.navigate(screenNames.WEB_VIEW_SCREEN, {
            TITLE: strings.deal_details_conditions,
            HTML_CONTENT: this.state.product.productDetails + "<br/>" + this.state.product.productConditions
        })
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    dottedLine: {
        width: '100%',
        resizeMode: 'stretch',
        marginTop: 10,
        zIndex: 1,
    },
    row: {
        flexDirection: 'row',
        marginVertical: 20,
        marginHorizontal: 40,
        alignItems: 'center'
    },
    text: {
        color: colors.greyTextColor,
        marginStart: 20,
        paddingEnd: 40
    },
    info: {
        marginStart: 'auto',
    },
    line: {
        height: 1,
        marginHorizontal: 40,
        backgroundColor: colors.lightLineColor
    },
    button: {
        width: '60%',
    },
    unsaveButton: {
        width: '40%',
        alignSelf: 'center'
    }
});
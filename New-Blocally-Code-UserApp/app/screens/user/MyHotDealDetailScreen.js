import React, { Component } from 'react'
import {
    View, TouchableOpacity, StyleSheet, ScrollView, Modal, Linking, FlatList, Platform,
    PermissionsAndroid, AppState,
} from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import TextInputComponent from '../../components/TextInputComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    constants, categoryTypes, urls, fontNames, sizes, scheduleTypes, screenNames,
    favoriteType, productDuration, dealStatuses, appointmentRequestStatus, databaseConstants, itemTypes, statsTypes,
} from '../../config/constants'
import {
    getScreenDimensions, getCommonParamsForAPI, addMinutesToADate, parseDate, checkIfDateIsInRange,
    getCurrencyFormat, parseTimeWithoutUnit, parseTime, alertDialog, getTimeOffset, handleErrorResponse,
    parseLocalDateTime, calculateDistance, getUTCDateTimeFromLocalDateTime, parseDateTime, parseDiscountApplied,
    getLocalDateTimeFromLocalDateTime, getExactTimeOffset,
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import Geolocation from 'react-native-geolocation-service';
import FastImage from 'react-native-fast-image'
import ProductMenuSchema from '../../database/ProductMenuSchema'
import ProductSchedulerSchema from '../../database/ProductSchedulerSchema'
import DealsSchema from '../../database/DealsSchema'
import Realm from 'realm'
import ReactNativeBlobUtil from 'rn-fetch-blob'
import { getDistance } from 'geolib'
import NetInfo from "@react-native-community/netinfo"

/**
 * My Hot Deal Detail Screen
 */
export default class MyHotDealDetailScreen extends Component {
    constructor(props) {
        super(props)
        this.changeEventListener = null
        this.dealId = this.props.navigation.state.params.DEAL_ID

        this.screenDimensions = getScreenDimensions()
        this.headerImageHeight = this.screenDimensions.width * constants.HEADER_IMAGE_HEIGHT_PERCENTAGE

        this.didFocusSubscription = null

        this.state = {
            showModalLoader: false,
            currentDeal: {},
            showInfoPopup: false,
            showEnterCountPopup: false,
            dealCountError: "",
            showBonusInfoPopup: false,

            isRedeemSuccess: false,
            redeemMessage: "",
            showRedeemDonePopup: false,
            showCheckInFailedPopup: false,
            showCheckInDonePopup: false,
            showCheckInFailedBookedPopup: false,
        }

        this.selectedDealCount = ""

        this.isInitial = true
        this.isComingFromSettings = false
        this.currentLatitude = 0
        this.currentLongitude = 0
        this.distance = 0
        this.isComingFromRedeem = false

        this.realm = null
        this.initRealm()
    }

    render() {
        console.log("this.state.currentDeal.dealExpiredOn",this.state.currentDeal)
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />

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
                            {this.state.currentDeal.scheduleType === scheduleTypes.DAYS ?
                                <View style={{ marginBottom: 10, marginTop: 10 }}>
                                    <TextComponent
                                        style={{ alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                        {strings.this_deal_can_be_redeemed}
                                    </TextComponent>
                                    <TextComponent style={{ alignSelf: 'center', marginTop: 10 }}>
                                        {this.state.currentDeal.dealRedemptionStartDate ?
                                            (strings.from + " " +
                                                parseDate(this.state.currentDeal.dealRedemptionStartDate)
                                                + " " + strings.to + " " +
                                                parseDate(this.state.currentDeal.dealRedemptionEndDate))
                                            : ""}
                                    </TextComponent>
                                    <TextComponent style={{ alignSelf: 'center', marginTop: 10 }}>
                                        {strings.on_following_days}
                                    </TextComponent>
                                </View>
                                :
                                <TextComponent
                                    style={{
                                        color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                        textAlign: 'center', marginBottom: 10, marginTop: 10
                                    }}>
                                    {strings.this_deal_can_be_redeemed_on_dates}
                                </TextComponent>
                            }
                            <FlatList
                                data={this.state.currentDeal.productScheduler}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.rowContainer, { marginBottom: 10, marginStart: 20, marginEnd: 20 }]}>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont }}>
                                            {
                                                this.state.currentDeal.scheduleType == scheduleTypes.DAYS ?
                                                    index > 0 ?
                                                        this.state.currentDeal.productScheduler[index - 1].scheduleDay == item.scheduleDay ?
                                                            "" : strings.days_of_week[item.scheduleDay - 1]
                                                        :
                                                        strings.days_of_week[item.scheduleDay - 1]
                                                    :
                                                    index > 0 ?
                                                        parseDate(this.state.currentDeal.productScheduler[index - 1].startTime) == parseDate(item.startTime) ?
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
                                {this.state.currentDeal.productPromotionEndDate ?
                                    parseDate(this.state.currentDeal.productPromotionEndDate) : ""}
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

                {/* Redeem Success Popup */}
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
                                            this.fetchDealDetails();
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
                                        {"(" + strings.you_have_saved + " " + this.state.currentDeal.dealCount + " " + strings.deals + ")"}
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
                                            if (dealCount > this.state.currentDeal.dealCount) {
                                                this.setState({
                                                    dealCountError: strings.you_can_choose_max + " " + this.state.currentDeal.dealCount + " " + strings.max_deals
                                                })
                                            } else if (dealCount < 1) {
                                                this.setState({
                                                    dealCountError: strings.choose_at_least_one
                                                })
                                            } else {
                                                this.setState({
                                                    showEnterCountPopup: false
                                                }, () => {
                                                    this.checkForLocation(dealCount)
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
                            {this.state.currentDeal.scheduleType == scheduleTypes.DAYS &&
                                <View style={{ marginTop: 5 }}>
                                    <TextComponent style={{ alignSelf: 'center', }}>
                                        {this.state.currentDeal.dealRedemptionStartDate ?
                                            (strings.from + " " +
                                                parseDate(this.state.currentDeal.dealRedemptionStartDate)
                                                + " " + strings.to + " " +
                                                parseDate(this.state.currentDeal.dealRedemptionEndDate))
                                            : ""}
                                    </TextComponent>
                                    <TextComponent style={{ alignSelf: 'center', marginTop: 5 }}>
                                        {strings.on_following_days}
                                    </TextComponent>
                                </View>
                            }
                            <FlatList
                                data={this.state.currentDeal.productScheduler}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.rowContainer, { marginBottom: 10, marginStart: 20, marginEnd: 20 }]}>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont }}>
                                            {
                                                this.state.currentDeal.scheduleType == scheduleTypes.DAYS ?
                                                    index > 0 ?
                                                        this.state.currentDeal.productScheduler[index - 1].scheduleDay == item.scheduleDay ?
                                                            "" : strings.days_of_week[item.scheduleDay - 1]
                                                        :
                                                        strings.days_of_week[item.scheduleDay - 1]
                                                    :
                                                    index > 0 ?
                                                        parseDate(this.state.currentDeal.productScheduler[index - 1].startTime) == parseDate(item.startTime) ?
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
                                    parseDateTime(this.state.currentDeal.appointmentDateTime) + "."}
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
                                            this.fetchDealDetails()
                                        })
                                    }}>
                                    {strings.done}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                <ScrollView>
                    <View style={[commonStyles.headerBorder, commonStyles.centerInContainer, {
                        width: '100%', height: this.headerImageHeight, backgroundColor: colors.white
                    }]}>
                        <ImageComponent source={require('../../assets/placeholderLogo.png')} />
                        <FastImage
                            source={{
                                uri: this.state.currentDeal.dealImage ? this.state.currentDeal.dealImage : "",
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
                            source={this.state.currentDeal.productType === itemTypes.BONUS_DEAL ?
                                require('../../assets/bonusBadge.png')
                                : require('../../assets/hotDeal.png')} />
                    </View>
                    <View style={[{ marginTop: 20, marginHorizontal: 50 }]}>
                        <View style={[commonStyles.rowContainer, { alignItems: 'flex-start' }]}>
                            <TextComponent style={{ width: '75%', fontSize: sizes.largeTextSize }}>
                                {this.state.currentDeal.dealTitle}
                            </TextComponent>

                            {this.state.currentDeal.isDiscounted ?
                                <View style={[commonStyles.rowContainer, { marginTop: 3, marginStart: 'auto', }]}>
                                    <TextComponent style={[commonStyles.greenTextColor, { fontSize: sizes.largeTextSize }]}>
                                        {(typeof this.state.currentDeal.discount == 'number') ?
                                            (parseDiscountApplied(this.state.currentDeal.discount) + strings.percent_discount)
                                            : ""}
                                    </TextComponent>
                                </View>
                                :
                                <TextComponent style={{ marginStart: 'auto', color: colors.greenTextColor, fontSize: sizes.largeTextSize }}>
                                    {this.state.currentDeal.dealOP ? getCurrencyFormat(this.state.currentDeal.dealOP) :
                                        (typeof this.state.currentDeal.dealOP == 'number') ? getCurrencyFormat(this.state.currentDeal.dealOP) : ""}
                                </TextComponent>
                            }
                        </View>

                        {(this.state.currentDeal && this.state.currentDeal.dealAddedOn) &&
                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 5 }}>
                                {(this.state.currentDeal.dealStatusId === dealStatuses.BOOKED ?
                                    strings.booked_on : strings.saved_on) + " - "}
                                <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                    {parseDate(this.state.currentDeal.dealAddedOn)}
                                </TextComponent>
                            </TextComponent>
                        }

                        {(this.state.currentDeal.dealAppointmentId
                            && this.state.currentDeal.appointmentStatusId === appointmentRequestStatus.APPROVED) ?
                            <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                {strings.appointment_date + " - "}
                                <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                    {parseDate(this.state.currentDeal.appointmentDateTime) + " " + parseTime(this.state.currentDeal.appointmentDateTime)}
                                </TextComponent>
                            </TextComponent>
                            :
                            (this.state.currentDeal.dealAppointmentId
                                && this.state.currentDeal.appointmentStatusId === appointmentRequestStatus.PENDING) ?
                                <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                    {strings.appointment + " - "}
                                    <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize, color: colors.pendingStatusColor }}>
                                        {strings.pending}
                                    </TextComponent>
                                </TextComponent>
                                :
                                (this.state.currentDeal.dealAppointmentId
                                    && this.state.currentDeal.appointmentStatusId === appointmentRequestStatus.REJECTED)
                                    ?
                                    <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                        {strings.appointment + " - "}
                                        <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize, color: colors.rejectedStatusColor }}>
                                            {strings.rejected}
                                        </TextComponent>
                                    </TextComponent>
                                    :
                                    <View />
                        }

                        {(this.state.currentDeal.dealStatusId && (this.state.currentDeal.dealStatusId === dealStatuses.SAVED
                            || this.state.currentDeal.dealStatusId === dealStatuses.REDEEMED
                            || this.state.currentDeal.dealStatusId === dealStatuses.EXPIRED)) &&
                            <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                {this.state.currentDeal.dealStatusId === dealStatuses.SAVED ? strings.expiry_date + " - "
                                    : this.state.currentDeal.dealStatusId === dealStatuses.BOOKED ? strings.expiry_date + " - "
                                        : this.state.currentDeal.dealStatusId === dealStatuses.REDEEMED ? strings.redeemed_on + " - "
                                            : this.state.currentDeal.dealStatusId === dealStatuses.EXPIRED ? strings.expired_on + " - " : ""}
                                <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                    {this.state.currentDeal.dealStatusId === dealStatuses.SAVED ?
                                        this.state.currentDeal.productType === itemTypes.BONUS_DEAL ? parseDateTime(this.state.currentDeal.dealExpiredOn)
                                            : parseDateTime(this.state.currentDeal.dealRedemptionEndDate)
                                        : this.state.currentDeal.dealStatusId === dealStatuses.BOOKED ? parseDateTime(this.state.currentDeal.appointmentDateTime)
                                            : this.state.currentDeal.dealStatusId === dealStatuses.REDEEMED ? parseDateTime(this.state.currentDeal.dealRedeemedOn)
                                                : this.state.currentDeal.dealStatusId === dealStatuses.EXPIRED ? parseDateTime(this.state.currentDeal.dealExpiredOn)
                                                 : ""}
                                </TextComponent>
                            </TextComponent>
                        }

                        {(this.state.currentDeal.dealStatusId && this.state.currentDeal.dealStatusId === dealStatuses.CHECKED_IN)
                            ?
                            this.state.currentDeal.productType === itemTypes.BONUS_DEAL
                                ?
                                <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                    {strings.expiry_date + " - "}
                                    <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                        {parseDateTime(this.state.currentDeal.dealExpiredOn)}
                                    </TextComponent>
                                </TextComponent>
                                :
                                this.state.currentDeal.appointmentDateTime ?
                                    <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                        {strings.expiry_date + " - "}
                                        <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                            {parseDateTime(this.state.currentDeal.appointmentDateTime)}
                                        </TextComponent>
                                    </TextComponent>
                                    :
                                    <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                        {strings.expiry_date + " -dsd "}
                                        <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                            {parseDateTime(this.state.currentDeal.dealExpiredOn)}
                                        </TextComponent>
                                    </TextComponent>
                            : <View />
                        }

                        {(this.state.currentDeal.dealStatusId
                            && this.state.currentDeal.dealStatusId === dealStatuses.SAVED) &&
                            <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                {this.state.currentDeal.productType === itemTypes.BONUS_DEAL ?
                                    (this.state.currentDeal.dealCount + " " + (this.state.currentDeal.dealCount === 1 ? strings.deal : strings.deals))
                                    : this.state.currentDeal.productIsHotDealUnlimited ? strings.until_stock_lasts :
                                        this.state.currentDeal.hotDealLeft + " " + strings.left}
                            </TextComponent>
                        }

                        {(this.state.currentDeal.dealStatusId && (this.state.currentDeal.dealStatusId !== dealStatuses.SAVED)) &&
                            <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                {this.state.currentDeal.dealCount + " " + (this.state.currentDeal.dealCount === 1 ? strings.deal : strings.deals)}
                            </TextComponent>
                        }
                        <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                            {this.state.currentDeal.productLat ? (calculateDistance(this.state.currentDeal.productLat, this.state.currentDeal.productLng, this.currentLatitude, this.currentLongitude) + " km") : ""}
                        </TextComponent>
                    </View>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={styles.dottedLine} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.currentDeal.businessId && this.state.currentDeal.isEntrepreneurDeleted == 0) {
                                this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                    BUSINESS_ID: this.state.currentDeal.businessId
                                })
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/homeIcon.png')} />
                            <TextComponent style={styles.text}>{this.state.currentDeal.businessName}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.currentDeal.isEntrepreneurDeleted == 0) {
                                this.hitAddStats(statsTypes.REDIRECT_TO_GOOGLE_MAP)
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/locationBig.png')} />
                            <TextComponent style={styles.text}>{this.state.currentDeal.dealAddress}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.currentDeal.isEntrepreneurDeleted == 0) {
                                this.props.navigation.navigate(screenNames.WEB_VIEW_SCREEN, {
                                    TITLE: strings.deal_details_conditions,
                                    HTML_CONTENT: this.state.currentDeal.dealDetails + "<br/>" + this.state.currentDeal.dealConditions
                                })
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/docIcon.png')} />
                            <TextComponent style={styles.text}>
                                {strings.deal_details_conditions}
                            </TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.currentDeal.isEntrepreneurDeleted == 0) {
                                if (this.state.currentDeal.productType === itemTypes.BONUS_DEAL) {
                                    this.setState({
                                        showBonusInfoPopup: true
                                    })
                                } else {
                                    this.setState({
                                        showInfoPopup: true
                                    })
                                }
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
                            if (this.state.currentDeal.isEntrepreneurDeleted == 0) {
                                if (this.state.currentDeal.productMenu && this.state.currentDeal.productMenu.length > 0) {
                                    this.props.navigation.navigate(screenNames.VIEW_ALL_MENU_IMAGES_SCREEN, {
                                        MENU_IMAGES: this.state.currentDeal.productMenu,
                                        TITLE: this.state.currentDeal.dealTitle
                                    })
                                } else {
                                    alertDialog("", strings.menu_not_available)
                                }
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/menuIcon.png')} />
                            <TextComponent style={styles.text}>
                                {this.state.currentDeal.productMenuTitle}
                            </TextComponent>
                        </View>
                    </TouchableOpacity>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={styles.dottedLine} />

                    <View style={[commonStyles.rowContainer, commonStyles.centerInContainer, { marginTop: 20, marginBottom: 20 }]}>
                        {(this.state.currentDeal.dealStatusId === dealStatuses.SAVED &&
                            this.state.currentDeal.productType !== itemTypes.BONUS_DEAL) &&
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButtonLight}
                                style={[styles.button, { marginEnd: 5 }]}
                                icon={require('../../assets/unsave.png')}
                                onPress={this.unsaveDeal}>
                                {strings.unsave}
                            </ButtonComponent>
                        }
                        {(this.state.currentDeal.dealStatusId === dealStatuses.SAVED ||
                            (this.state.currentDeal.dealStatusId === dealStatuses.BOOKED &&
                                this.state.currentDeal.appointmentStatusId === appointmentRequestStatus.APPROVED)) &&
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.primaryColor}
                                style={[styles.button, { marginStart: 5 }]}
                                onPress={() => {
                                    if (this.state.currentDeal.dealStatusId === dealStatuses.SAVED) {
                                        if (this.state.currentDeal.productType === itemTypes.BONUS_DEAL) {
                                            this.checkForLocation(this.state.currentDeal.dealCount)
                                        } else if (this.state.currentDeal.productIsHotDealUnlimited || this.state.currentDeal.hotDealLeft > 0) {
                                            this.checkForLocation(this.state.currentDeal.dealCount)
                                        } else {
                                            alertDialog("", strings.no_more_deals_left);
                                        }
                                    } else if (this.state.currentDeal.dealStatusId === dealStatuses.BOOKED) {
                                        if (this.state.currentDeal.dealCount == 1) {
                                            this.checkForLocation(this.state.currentDeal.dealCount)
                                        } else {
                                            this.setState({
                                                showEnterCountPopup: true
                                            })
                                        }
                                    } else {
                                        // should never happen
                                        alertDialog("", strings.not_available);
                                    }
                                }}>
                                {strings.check_in}
                            </ButtonComponent>
                        }
                        {this.state.currentDeal.dealStatusId === dealStatuses.CHECKED_IN &&
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.primaryColor}
                                style={[styles.button, { marginStart: 5 }]}
                                onPress={() => {
                                    this.isComingFromRedeem = true
                                    let temp = { ...this.state.currentDeal }
                                    console.log("temp---",temp)
                                    this.props.navigation.navigate(screenNames.SHOW_QR_CODE_SCREEN, {
                                        CURRENT_DEAL: temp,
                                    });
                                }}>
                                {strings.redeem}
                            </ButtonComponent>
                        }

                        {this.state.currentDeal.dealStatusId === dealStatuses.REDEEMED &&
                            <View>
                                <ImageComponent
                                    style={{ alignSelf: 'center' }}
                                    source={require('../../assets/redeemSuccess.png')} />
                                <TextComponent style={{
                                    fontSize: 25, fontFamily: fontNames.boldFont,
                                    color: colors.green, alignSelf: 'center', marginTop: 10,
                                    marginHorizontal: 20, textAlign: 'center'
                                }}>
                                    {strings.redeemed_successfully}
                                </TextComponent>
                            </View>
                        }
                    </View>
                </ScrollView>
            </View >
        )
    }

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
        this.changeEventListener = AppState.addEventListener('change', this._handleAppStateChange);
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                if (!this.isInitial || this.isComingFromRedeem) {
                    this.fetchDealDetails()
                }
                this.isInitial = false
            }
        );
        AsyncStorageHelper.getStringAsync(constants.COORDINATES)
            .then((strCoordinates) => {
                const coordinates = JSON.parse(strCoordinates);

                this.currentLatitude = coordinates.latitude
                this.currentLongitude = coordinates.longitude
            })
        this.checkIfOfflineDataPendingToSync();
    }

    checkIfOfflineDataPendingToSync = () => {
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
                    this.checkIfPermissionGranted();
                }
            } else {
                this.checkIfPermissionGranted();
            }
        });
    }

    // api to sync offline deals
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
                this.checkIfPermissionGranted();
            }, (jsonResponse) => {
                this.checkIfPermissionGranted();
            })
        })
    }

    componentWillUnmount() {
        if (this.changeEventListener) {
            this.changeEventListener.remove();
        }

        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }

        if (this.realm !== null && !this.realm.isClosed) {
            this.realm.close();
        }
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active' && this.isComingFromSettings) {
            this.isComingFromSettings = false
            this.checkIfPermissionGranted();
        }
    };

    // api to get deal details
    fetchDealDetails = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId: this.dealId,
                timeOffset: getTimeOffset(),
            }
            console.log("params--",params)

            hitApi(urls.GET_DEAL_DETAIL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.setState({
                    currentDeal: jsonResponse.response.data[0],
                })
            })
        })
    }

    // api for stats
    hitAddStats = (statType) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                statsType: statType,
                productId: this.state.currentDeal.productId,
                businessId: this.state.currentDeal.businessId,
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

    openMaps = () => {
        const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${this.state.currentDeal.dealLat},${this.state.currentDeal.dealLng}`;
        const label = this.state.currentDeal.dealTitle;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        Linking.openURL(url);
    }

    unsaveDeal = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId: this.dealId
            }

            hitApi(urls.REMOVE_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                setTimeout(() => {
                    this.props.navigation.goBack(null)
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    checkIfPermissionGranted() {
        if (Platform.OS == constants.ANDROID) {
            if (Platform.Version >= 23) {
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                    .then(response => {
                        if (response == true) {
                            this.fetchDealDetails()
                        } else {
                            this.requestPermission();
                        }
                    });
            } else {
                this.fetchDealDetails()
            }
        } else {
            this.fetchDealDetails()
        }
    }

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
                this.fetchDealDetails()
            } else {
                alertDialog(strings.permission_title, strings.permission_must, strings.ok, "", () => {
                    this.isComingFromSettings = true
                    Linking.openSettings();
                })
            }
        } catch (err) {
            console.log("request permission error " + err)
        }
    }

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
                            { latitude: this.state.currentDeal.productLat, longitude: this.state.currentDeal.productLng }
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

    validateCheckIn = (dealCount) => {
        let currentDateTime = new Date();

        let offset = getExactTimeOffset()
        currentDateTime.setMinutes(currentDateTime.getMinutes() + offset)

        if (this.state.currentDeal.productType === itemTypes.BONUS_DEAL) {
            let expiryDate = new Date(this.state.currentDeal.dealExpiredOn);

            if (currentDateTime.getTime() > expiryDate.getTime()) {
                // bonus deal expired
                let utcExpiredOn = getLocalDateTimeFromLocalDateTime(expiryDate);

                this.dealExpired(utcExpiredOn);
            } else {
                if (this.distance > constants.DISTANCE_FOR_CHECK_IN) {
                    alertDialog("", strings.you_can_check_in_within)
                } else {
                    this.checkInHotDeal(dealCount)
                }
            }
        } else {
            let startDateTime;
            let endDateTime;

            let dealExpired = false;

            if (this.state.currentDeal.dealStatusId == dealStatuses.BOOKED) {
                startDateTime = new Date(this.state.currentDeal.appointmentDateTime);
                endDateTime = new Date(this.state.currentDeal.appointmentDateTime);
            } else if (this.state.currentDeal.dealNextAvailableStartDateTime) {
                startDateTime = new Date(this.state.currentDeal.dealNextAvailableStartDateTime);
                endDateTime = new Date(this.state.currentDeal.dealNextAvailableEndDateTime);
            } else {
                // it should happen when the last date time has passed
                // deal expired
                dealExpired = true
            }

            if (dealExpired) {
                let utcExpiredOn = getLocalDateTimeFromLocalDateTime(new Date());

                this.dealExpired(utcExpiredOn);
            } else {
                let originalEndDateTime = new Date(endDateTime)

                if (this.state.currentDeal.dealStatusId == dealStatuses.BOOKED) {
                    startDateTime.setMinutes(startDateTime.getMinutes() - constants.APPOINTMENT_EXTENSION_MINUTES)
                    endDateTime.setMinutes(endDateTime.getMinutes() + constants.APPOINTMENT_EXTENSION_MINUTES)
                } else {
                    startDateTime.setMinutes(startDateTime.getMinutes() - constants.EXTENSION_MINUTES)
                    endDateTime.setMinutes(endDateTime.getMinutes() + constants.EXTENSION_MINUTES)
                }

                if (currentDateTime.getTime() > endDateTime.getTime()) {
                    // deal expired
                    let utcExpiredOn = getLocalDateTimeFromLocalDateTime(originalEndDateTime);

                    this.dealExpired(utcExpiredOn);
                } else if (checkIfDateIsInRange(currentDateTime, startDateTime, endDateTime)) {
                    if (this.distance > constants.DISTANCE_FOR_CHECK_IN) {
                        alertDialog("", strings.you_can_check_in_within)
                    } else {
                        this.checkInHotDeal(dealCount)
                    }
                } else {
                    if (this.state.currentDeal.dealStatusId == dealStatuses.BOOKED) {
                        setTimeout(() => {
                            this.setState({
                                showCheckInFailedBookedPopup: true
                            })
                        }, constants.HANDLING_TIMEOUT)
                    } else {
                        setTimeout(() => {
                            this.setState({
                                showCheckInFailedPopup: true
                            })
                        }, constants.HANDLING_TIMEOUT)
                    }
                }
            }
        }
    }

    // api to check in hot deal
    checkInHotDeal = (dealForCheckIn) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId: this.dealId,
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
                                    alertDialog("", error)
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

    showMaxLimitReachedPopup = () => {
        let duration = this.state.product.dealDuration == productDuration.DAILY ? "1"
            : this.state.product.dealDuration == productDuration.WEEKLY ? "7"
                : this.state.product.dealDuration == productDuration.MONTHLY ? "30"
                    : "365"
        let strMessage = strings.provider_has_limited + " " + this.state.product.productNoOfDealsPerUser
            + " " + strings.deals_within + " " + duration + " " + strings.already_saved_booked_max
        alertDialog("", strMessage)
    }

    // api to expire deal
    dealExpired = (utcExpiredOn) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId: this.dealId,
                dealStatusId: dealStatuses.EXPIRED,
                actionTakenOn: utcExpiredOn,
            }

            let redeemMessage = strings.the_deal + this.state.currentDeal.dealTitle + strings.deal_has_expired
            hitApi(urls.MANAGE_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                setTimeout(() => {
                    this.setState({
                        isRedeemSuccess: false,
                        redeemMessage,
                        showRedeemDonePopup: true
                    });
                }, constants.HANDLING_TIMEOUT)
            })
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
        marginHorizontal: 50,
        alignItems: 'center'
    },
    text: {
        color: colors.greyTextColor,
        marginStart: 20,
        paddingEnd: 40
    },
    line: {
        height: 1,
        marginHorizontal: 50,
        backgroundColor: colors.lightLineColor
    },
    button: {
        width: '40%',
        alignSelf: 'center'
    }
});
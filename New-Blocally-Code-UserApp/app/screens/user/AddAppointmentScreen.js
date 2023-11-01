import React, { Component } from 'react'
import {
    View, KeyboardAvoidingView, TouchableOpacity, ScrollView, StyleSheet, Modal,
    FlatList, TouchableWithoutFeedback
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
    constants, categoryTypes, urls, fontNames, sizes, itemTypes, screenNames, scheduleTypes,
    favoriteType, favoriteRequests, statsTypes, productDuration,
} from '../../config/constants'
import {
    getCommonParamsForAPI, openUrlInBrowser, parseDate, parseTime, parseTimeWithoutUnit, startStackFrom,
    alertDialog, getLoggedInUser, combineDateTime, getUTCDateTimeFromLocalDateTime, checkIfDateIsInRange,
    getScreenDimensions, getImageDimensions, parseTextForCard, getCurrencyFormat, checkIfDatesAreSameDay,
    getTimeOffset, getStringDateFromLocalDateTime, checkIfTimesAreSame, getMillisecondsFromMinutes,
    handleErrorResponse, isNetworkConnected, getLocalDateTimeFromLocalDateTime, getExactTimeOffset,
    clearAndMoveToLogin,
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import FastImage from 'react-native-fast-image'
import { Dropdown } from 'react-native-material-dropdown'
import CountryCodes from '../../utilities/CountryCodes.json'
import * as RNLocalize from "react-native-localize"
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import SmallButtonComponent from '../../components/SmallButtonComponent'
import { Calendar, CalendarList, Agenda, } from 'react-native-calendars'

/**
 * Add Appointment Screen
 */
export default class AddAppointmentScreen extends Component {
    constructor(props) {
        super(props);

        this.businessId = this.props.navigation.state.params.BUSINESS_ID
        this.messageId = this.props.navigation.state.params.MESSAGE_ID

        this.todayDate = new Date()
        this.todayDate.setHours(0, 0, 0, 0);
        this.numOfGuests = 0
        this.comments = ""
        this.countries = []

        this.showingDateForIndex = 0
        this.showingTimeForIndex = 0

        this.latitude = 0
        this.longitude = 0
        this.pageIndex = 1
        this.paginationRequired = true

        this.previousProductId = null
        this.previousProductType = null

        this.productNoOfDealsPerUser = 0
        this.dealDuration = 0

        this.apiCount = 0;

        this.shouldHitPagination = true

        this.state = {
            showModalLoader: false,
            showCountryCodes: false,
            productId: this.props.navigation.state.params.PRODUCT_ID,
            productType: this.props.navigation.state.params.PRODUCT_TYPE,
            name: "",
            nameError: "",
            currentCountryCode: '+49',
            contactNo: "",
            contactNoError: "",
            showAlternateDateOne: false,
            showAlternateDateTwo: false,

            appointmentDate: strings.date,
            appointmentDateError: "",
            appointmentDateObject: null,
            appointmentDateObjectInitial: null,

            appointmentFromTime: strings.from_2,
            appointmentFromTimeObject: null,

            appointmentToTime: strings.to,
            appointmentToTimeObject: null,

            alternateDateOne: strings.date,
            alternateDateOneError: "",
            alternateDateOneObject: null,
            alternateDateOneObjectInitial: null,

            alternateFromTimeOne: strings.from_2,
            alternateFromTimeOneObject: null,

            alternateToTimeOne: strings.to,
            alternateToTimeOneObject: null,

            alternateDateTwo: strings.date,
            alternateDateTwoError: "",
            alternateDateTwoObject: null,
            alternateDateTwoObjectInitial: null,

            alternateFromTimeTwo: strings.from_2,
            alternateFromTimeTwoObject: null,

            alternateToTimeTwo: strings.to,
            alternateToTimeTwoObject: null,

            numberOfDeals: 1,
            numberOfDealsArray: [],
            productIsHotDealUnlimited: null,
            numberOfDealsError: "",

            numOfGuestsError: "",
            commentsError: "",
            showDatePicker: false,
            termsAccepted: true,

            entrepreneurProducts: [],

            showInfoPopup: false,
            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            productTypeForSchedule: null,
            schedulerData: [],

            showHolidayCalendarPopup: false,
            entrepreneurHolidays: [],
            businessConditions: "",

            showDealBookedPopup: false,

            directBookingAllowed: true,
        }

        this.screenDimensions = getScreenDimensions()
        this.cardUpperBgImage = getImageDimensions(require('../../assets/cardUpperBg.png'))
        this.cardLowerBgWithCut = getImageDimensions(require('../../assets/cardLowerBgWithCut.png'))
        this.headerImageHeight = getImageDimensions(require('../../assets/homeHeader.png')).height

        this.userObject = {}
        getLoggedInUser().then((userObject) => {
            this.userObject = userObject
            this.setState({
                name: userObject.firstName + " " + userObject.lastName,
                currentCountryCode: '+' + (userObject.countryCode == '' ? '49' : userObject.countryCode),
                contactNo: userObject.contactNo,
            })
        })

        this.startDateForAppointments = null
        this.endDateForAppointments = null

        this.availableDateMarking = {
            selected: true,
            customStyles: {
                container: {
                    backgroundColor: colors.transparent,
                    borderRadius: 0
                },
                text: {
                    color: colors.green,
                }
            }
        };

        this.blockedDateMarking = {
            selected: true, disableTouchEvent: true, disabled: true,
            customStyles: {
                container: {
                    backgroundColor: colors.transparent,
                    borderRadius: 0
                },
                text: {
                    color: colors.red,
                }
            }
        };

        this.markedDates = {}

        this.lunchStartTime = null
        this.lunchEndTime = null
        this.currentProductScheduler = []
        this.entrepreneurScheduler = []

        this.appointmentDateScheduler = []
        this.appointmentDateHolidays = []
        this.alternateOneDateScheduler = []
        this.alternateOneDateHolidays = []
        this.alternateTwoDateScheduler = []
        this.alternateTwoDateHolidays = []

        this.predefinedSlots = false
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.booking_request}
                    navigation={this.props.navigation} />

                {/* Country Code Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={this.state.showCountryCodes}
                    onRequestClose={() => {
                        this.toggleCountryCodeVisibility(false);
                    }}>
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity style={{ flex: 1 }}
                            onPress={() => { this.toggleCountryCodeVisibility(false) }}>
                        </TouchableOpacity>
                        <View style={commonStyles.countryCodeView}>
                            <TouchableOpacity
                                style={{ position: 'absolute', padding: 10, end: 0, }}
                                onPress={() => { this.toggleCountryCodeVisibility(false) }}>
                                <TextComponent style={{ color: colors.white }}>{strings.cancel}</TextComponent>
                            </TouchableOpacity>
                            <FlatList
                                data={this.countries}
                                style={{ flex: 1, marginTop: 15 }}
                                keyExtractor={(item, index) => index + ""}
                                renderItem={(item) =>
                                    <TouchableOpacity
                                        style={{ margin: 5, }}
                                        onPress={() => {
                                            this.setState({
                                                currentCountryCode: item.item.dial_code
                                            })
                                            this.toggleCountryCodeVisibility(false);
                                        }}>
                                        <TextComponent style={{ alignSelf: 'center', color: colors.white }}>
                                            {item.item.name} ({item.item.dial_code})
                                        </TextComponent>
                                    </TouchableOpacity>
                                } />
                        </View>
                    </View>
                </Modal>

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
                            {this.state.scheduleType === scheduleTypes.DAYS ?
                                <View style={{ marginBottom: 10, marginTop: 10 }}>
                                    <TextComponent
                                        style={{
                                            alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                            textAlign: 'center'
                                        }}>
                                        {this.state.productTypeForSchedule === itemTypes.HOT_DEAL ?
                                            strings.this_deal_can_be_redeemed_on_dates
                                            : this.state.productTypeForSchedule === itemTypes.ACTION ?
                                                strings.promotional_period : strings.event_schedule}
                                    </TextComponent>
                                    <TextComponent style={{ alignSelf: 'center', marginTop: 10 }}>
                                        {this.state.schedulerRedemptionStartDate ?
                                            (strings.from + " " +
                                                parseDate(this.state.schedulerRedemptionStartDate)
                                                + " " + strings.to + " " +
                                                parseDate(this.state.schedulerRedemptionEndDate))
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
                                    {this.state.productTypeForSchedule === itemTypes.HOT_DEAL ?
                                        strings.this_deal_can_be_redeemed_on_dates
                                        : this.state.productTypeForSchedule === itemTypes.ACTION ?
                                            strings.promotional_period : strings.event_schedule}
                                </TextComponent>
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

                {/* holiday calendar popup */}
                {this.state.showHolidayCalendarPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{
                            width: '90%', backgroundColor: colors.white, padding: 10,
                            borderRadius: 10
                        }}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showHolidayCalendarPopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}} />
                            </TouchableOpacity>
                            <TextComponent
                                style={{
                                    color: colors.primaryColor, fontSize: sizes.largeTextSize,
                                    fontFamily: fontNames.boldFont,
                                    textAlign: 'center', marginBottom: 10, marginTop: 10
                                }}>
                                {strings.entrepreneur_on_holiday_on_following + ":"}
                            </TextComponent>
                            <FlatList
                                data={this.state.entrepreneurHolidays}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.rowContainer, { marginBottom: 10, marginStart: 20, marginEnd: 20 }]}>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont }}>
                                            {parseDate(item.startDateTime)}
                                        </TextComponent>

                                        <View style={[commonStyles.rowContainer, { marginStart: 'auto' }]}>
                                            <TextComponent>{parseTimeWithoutUnit(item.startDateTime) + " - "}</TextComponent>
                                            <TextComponent>{parseTime(item.endDateTime)}</TextComponent>
                                        </View>
                                    </View>
                                }
                                showsVerticalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                            />
                            <ButtonComponent
                                isFillRequired={true}
                                style={commonStyles.loginPopupButton}
                                onPress={() => {
                                    this.setState({
                                        showHolidayCalendarPopup: false
                                    })
                                }}>
                                {strings.done}
                            </ButtonComponent>
                        </View>
                    </View>
                </Modal>
                }

                {/* show deal booked popup */}
                {this.state.showDealBookedPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, { backgroundColor: colors.blurBackground }]}>
                        <View style={[{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }]}>
                            <TextComponent style={{
                                color: colors.primaryColor, fontFamily: fontNames.boldFont, fontSize: sizes.largeTextSize,
                                alignSelf: 'center'
                            }}>
                                {strings.deal_request_sent}
                            </TextComponent>

                            {(this.state.productId && this.state.productType == itemTypes.HOT_DEAL) ?
                                <View>
                                    <TextComponent style={{ marginTop: 20 }}>
                                        {strings.deal_request_detail}
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
                                </View>
                                :
                                <TextComponent style={{ marginTop: 10, }}>
                                    {strings.find_inquiries_in_my_appointments}
                                </TextComponent>
                            }

                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButton}
                                style={{ marginTop: 20, width: '80%', alignSelf: 'center' }}
                                onPress={() => {
                                    this.setState({
                                        showDealBookedPopup: false
                                    }, () => {
                                        this.props.navigation.goBack(null);
                                    })
                                }}>
                                {strings.done}
                            </ButtonComponent>
                        </View>
                    </View>
                </Modal>
                }

                {this.state.showDatePicker &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{
                                width: '90%', backgroundColor: colors.white,
                                padding: 10, borderRadius: 10
                            }}>
                                <View style={[commonStyles.rowContainer]}>
                                    {this.state.productId &&
                                        <TextComponent style={{ marginLeft: 5, marginRight: 25, color: colors.red }}>
                                            {strings.currently_only_times_are_displayed}
                                        </TextComponent>
                                    }
                                    <TouchableOpacity
                                        style={{ marginStart: 'auto', padding: 10 }}
                                        onPress={() => {
                                            this.setState({ showDatePicker: false })
                                        }}>
                                        <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                    </TouchableOpacity>
                                </View>
                                <Calendar
                                    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
                                    minDate={this.startDateForAppointments}
                                    // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
                                    maxDate={this.endDateForAppointments}
                                    // Handler which gets executed on day press. Default = undefined
                                    onDayPress={(day) => {
                                        let strDate = day.dateString
                                        let selectedDate = new Date(day.year, (day.month - 1), day.day)

                                        if (this.showingDateForIndex == 0) {
                                            this.appointmentDateScheduler = this.getSelectedDateScheduler(selectedDate)
                                            this.appointmentDateHolidays = this.getSelectedDateHolidays(selectedDate)
                                            this.setState({
                                                appointmentDate: strDate,
                                                appointmentDateError: "",
                                                appointmentDateObject: selectedDate,
                                                appointmentDateObjectInitial: selectedDate,
                                                showDatePicker: false,
                                                alternateDateOneError: "",
                                                alternateDateTwoError: "",
                                            })
                                        } else if (this.showingDateForIndex == 1) {
                                            this.alternateOneDateScheduler = this.getSelectedDateScheduler(selectedDate)
                                            this.alternateOneDateHolidays = this.getSelectedDateHolidays(selectedDate)
                                            this.setState({
                                                alternateDateOne: strDate,
                                                alternateDateOneError: "",
                                                alternateDateOneObject: selectedDate,
                                                alternateDateOneObjectInitial: selectedDate,
                                                showDatePicker: false,
                                                appointmentDateError: "",
                                                alternateDateTwoError: "",
                                            })
                                        } else if (this.showingDateForIndex == 2) {
                                            this.alternateTwoDateScheduler = this.getSelectedDateScheduler(selectedDate)
                                            this.alternateTwoDateHolidays = this.getSelectedDateHolidays(selectedDate)
                                            this.setState({
                                                alternateDateTwo: strDate,
                                                alternateDateTwoError: "",
                                                alternateDateTwoObject: selectedDate,
                                                alternateDateTwoObjectInitial: selectedDate,
                                                showDatePicker: false,
                                                appointmentDateError: "",
                                                alternateDateOneError: "",
                                            })
                                        }
                                    }}
                                    // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
                                    monthFormat={'yyyy MM'}
                                    // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
                                    firstDay={1}
                                    onPressArrowLeft={substractMonth => substractMonth()}
                                    onPressArrowRight={addMonth => addMonth()}
                                    markingType={'custom'}
                                    markedDates={this.markedDates}
                                />

                                <View style={[commonStyles.rowContainer, commonStyles.centerInContainer,
                                { padding: 10, marginLeft: 10, marginRight: 10 }]}>
                                    <View style={{ width: 15, height: 15, backgroundColor: colors.red }} />
                                    <TextComponent style={{ marginLeft: 5 }}>
                                        {strings.closed_blocked_for_booking}
                                    </TextComponent>
                                </View>
                            </View>
                        </View>
                    </Modal>
                }

                <View style={commonStyles.container}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps={'always'}>

                        {(this.state.entrepreneurProducts && this.state.entrepreneurProducts.length > 0) ?
                            <View>
                                <View style={[commonStyles.rowContainer, { marginTop: 10 }]}>
                                    <TextComponent style={[styles.pleaseIndicate, { marginStart: 18 }]}>
                                        {this.state.directBookingAllowed ?
                                            strings.choose_a_product
                                            : strings.choose_one_product_must}
                                    </TextComponent>
                                    <TextComponent style={[styles.optional, { marginLeft: 5 }]}>
                                        {this.state.directBookingAllowed ? strings.optional_b : ""}
                                    </TextComponent>
                                </View>
                                <FlatList
                                    data={this.state.entrepreneurProducts}
                                    extraData={this.state}
                                    renderItem={({ item, index }) =>
                                        <View style={[commonStyles.cardShadow, commonStyles.cardMargins]}>
                                            <View style={commonStyles.cardRadius}>
                                                <TouchableWithoutFeedback
                                                    onPress={() => {
                                                        let productId = null
                                                        let productType = null
                                                        if (this.state.productId !== item.productId) {
                                                            productId = item.productId
                                                            productType = item.productType
                                                        } else {
                                                            this.previousProductId = item.productId
                                                            this.previousProductType = item.productType
                                                        }

                                                        this.setState({
                                                            productId,
                                                            productType,
                                                            numberOfDeals: 1,

                                                            appointmentDateObject: null,
                                                            appointmentDateObjectInitial: null,
                                                            appointmentFromTimeObject: null,
                                                            appointmentToTimeObject: null,
                                                            appointmentDate: strings.date,
                                                            appointmentFromTime: strings.from_2,
                                                            appointmentToTime: strings.to,

                                                            alternateDateOneObject: null,
                                                            alternateDateOneObjectInitial: null,
                                                            alternateFromTimeOneObject: null,
                                                            alternateToTimeOneObject: null,
                                                            alternateDateOne: strings.date,
                                                            alternateFromTimeOne: strings.from_2,
                                                            alternateToTimeOne: strings.to,

                                                            alternateDateTwoObject: null,
                                                            alternateDateTwoObjectInitial: null,
                                                            alternateFromTimeTwoObject: null,
                                                            alternateToTimeTwoObject: null,
                                                            alternateDateTwo: strings.date,
                                                            alternateFromTimeTwo: strings.from_2,
                                                            alternateToTimeTwo: strings.to,

                                                            appointmentDateError: "",
                                                            alternateDateOneError: "",
                                                            alternateDateTwoError: "",

                                                            showModalLoader: true,
                                                        }, () => {
                                                            this.getAvailableScheduler()
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

                                                            {this.state.productId == item.productId &&
                                                                <ImageComponent
                                                                    source={require('../../assets/selected.png')}
                                                                    style={{ position: 'absolute', start: 0, top: 0 }} />
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
                                                                                    (typeof item.productMRP == 'number') ? getCurrencyFormat(item.productMRP)
                                                                                        : ""}
                                                                            </TextComponent>
                                                                            <TextComponent style={commonStyles.cardOP}>
                                                                                {item.productOP ? getCurrencyFormat(item.productOP) :
                                                                                    (typeof item.productOP == 'number') ? getCurrencyFormat(item.productOP)
                                                                                        : ""}
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
                                    keyExtractor={(item, index) => index.toString()}
                                    horizontal={true}
                                    style={{ paddingStart: 10, marginTop: 10 }}
                                    ListEmptyComponent={
                                        this.state.showNoProducts &&
                                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginStart: 10 }}>
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
                                            this.fetchProductsOfEntrepreneur()
                                        }
                                    }}
                                    onEndReachedThreshold={0.5}
                                    ListFooterComponent={
                                        <View style={[commonStyles.container, commonStyles.centerInContainer,
                                        { backgroundColor: colors.transparent, marginEnd: 15 }]}>
                                            <LoaderComponent
                                                shouldShow={this.state.showDealLoader} />
                                        </View>
                                    }
                                />
                            </View>
                            : <View />
                        }
                        <View style={{ alignItems: 'center' }}>
                            <View style={[commonStyles.container, { width: '90%', }]}>
                                <TextComponent style={[styles.pleaseIndicate, { textAlign: 'center', }]}>
                                    {strings.please_indicate_desired_date + ":"}
                                </TextComponent>
                                <TextComponent style={{ color: colors.greyTextColor, textAlign: 'center' }}>
                                    {"(" + strings.you_can_suggest_alternate + ")"}
                                </TextComponent>

                                <TextInputComponent
                                    isBorderRequired={false}
                                    underlineColorAndroid={colors.transparent}
                                    keyboardType={"default"}
                                    style={[styles.textInput, { marginTop: 20 }]}
                                    placeholder={strings.name + "*"}
                                    value={this.state.name}
                                    onChangeText={(text) => {
                                        this.setState({
                                            name: text,
                                            nameError: ''
                                        })
                                    }}
                                    maxLength={constants.CONTACT_NAME_LIMIT}
                                    returnKeyType={"next"}
                                    onSubmitEditing={() => { this.phoneNumberTextInput.focus(); }} />
                                <View style={styles.line} />
                                <TextComponent style={commonStyles.errorText}>{this.state.nameError}</TextComponent>

                                <View style={[commonStyles.rowContainer, styles.textInput]}>
                                    <TextInputComponent
                                        isBorderRequired={false}
                                        underlineColorAndroid={colors.transparent}
                                        keyboardType={"numeric"}
                                        style={{ paddingStart: 80 }}
                                        getRef={(input) => { this.phoneNumberTextInput = input }}
                                        placeholder={strings.mobile_number + "*"}
                                        value={this.state.contactNo}
                                        onChangeText={(text) => {
                                            this.setState({
                                                contactNo: text.trim(),
                                                contactNoError: ''
                                            })
                                        }}
                                        maxLength={constants.PHONE_CHAR_MAX_LIMIT}
                                        returnKeyType={"next"}
                                        onSubmitEditing={() => {
                                            this.numberOfGuestsField.focus();
                                        }} />
                                    <View style={{ position: 'absolute', bottom: 0, paddingEnd: 10 }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.toggleCountryCodeVisibility(true)
                                            }}
                                            style={[commonStyles.rowContainer, commonStyles.centerInContainer, {
                                                paddingVertical: 8, zIndex: 1
                                            }]}>
                                            <TextComponent style={{ fontSize: sizes.xLargeTextSize, marginEnd: 5 }}>
                                                {this.state.currentCountryCode}
                                            </TextComponent>
                                            <ImageComponent source={require('../../assets/downArrowPurple.png')} />
                                            <View style={commonStyles.verticalLine} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.line} />
                                <TextComponent style={commonStyles.errorText}>
                                    {this.state.contactNoError}
                                </TextComponent>

                                <View style={[commonStyles.rowContainer, { marginTop: 20, justifyContent: 'space-between', }]}>
                                    <TextComponent
                                        style={[styles.textInput, {
                                            color: colors.primaryColor,
                                            width: '30%'
                                        }]}>
                                        {strings.choose_a_day + strings.asterisk}
                                    </TextComponent>
                                    <TextComponent
                                        style={[styles.textInput, { color: colors.primaryColor, width: '30%' }]}>
                                        {strings.choose_time + strings.asterisk}
                                    </TextComponent>
                                    <View style={{ width: '30%' }} />
                                </View>
                                <View style={[commonStyles.rowContainer, {
                                    justifyContent: 'space-between', marginTop: 5
                                }]}>
                                    <View style={{ width: '30%', }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.showingDateForIndex = 0
                                                this.setState({
                                                    showDatePicker: true,
                                                    appointmentFromTime: strings.from_2,
                                                    appointmentToTime: strings.to,
                                                    appointmentFromTimeObject: null,
                                                    appointmentToTimeObject: null,
                                                })
                                            }}>
                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                <ImageComponent
                                                    source={require('../../assets/calGreySmall.png')} />
                                                <TextComponent
                                                    style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                    {this.state.appointmentDate}
                                                </TextComponent>
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.line} />
                                    </View>
                                    <View style={{ width: '30%' }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (this.state.appointmentDateObjectInitial) {
                                                    this.showingTimeForIndex = 0
                                                    
                                                    if (this.predefinedSlots) {
                                                        this.props.navigation.navigate(screenNames.CHOOSE_PREDEFINED_TIME_SCREEN, {
                                                            CURRENT_DATE: this.state.appointmentDateObjectInitial,
                                                            ALL_AVAILABLE_SLOTS: this.appointmentDateScheduler,
                                                            ALL_BLOCKED_SLOTS: this.appointmentDateHolidays,
                                                            LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                            LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                            CALLBACK: this.timePickerCallback,
                                                        })
                                                    } else {
                                                        this.props.navigation.navigate(screenNames.CHOOSE_TIME_SCREEN, {
                                                            CURRENT_DATE: this.state.appointmentDateObjectInitial,
                                                            ALL_AVAILABLE_SLOTS: this.appointmentDateScheduler,
                                                            ALL_BLOCKED_SLOTS: this.appointmentDateHolidays,
                                                            LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                            LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                            CALLBACK: this.timePickerCallback,
                                                            CHOSEN_PRODUCT_ID: this.state.productId,
                                                        })
                                                    }
                                                } else {
                                                    this.showingDateForIndex = 0
                                                    this.setState({
                                                        showDatePicker: true
                                                    })
                                                }
                                            }}>
                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                <ImageComponent
                                                    source={require('../../assets/clockGreySmall.png')} />
                                                <TextComponent
                                                    style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                    {this.state.appointmentFromTime}
                                                </TextComponent>
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.line} />
                                    </View>
                                    <View style={{ width: '30%' }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (this.state.appointmentDateObjectInitial) {
                                                    this.showingTimeForIndex = 0
                                                    
                                                    if (this.predefinedSlots) {
                                                        this.props.navigation.navigate(screenNames.CHOOSE_PREDEFINED_TIME_SCREEN, {
                                                            CURRENT_DATE: this.state.appointmentDateObjectInitial,
                                                            ALL_AVAILABLE_SLOTS: this.appointmentDateScheduler,
                                                            ALL_BLOCKED_SLOTS: this.appointmentDateHolidays,
                                                            LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                            LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                            CALLBACK: this.timePickerCallback,
                                                        })
                                                    } else {
                                                        this.props.navigation.navigate(screenNames.CHOOSE_TIME_SCREEN, {
                                                            CURRENT_DATE: this.state.appointmentDateObjectInitial,
                                                            ALL_AVAILABLE_SLOTS: this.appointmentDateScheduler,
                                                            ALL_BLOCKED_SLOTS: this.appointmentDateHolidays,
                                                            LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                            LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                            CALLBACK: this.timePickerCallback,
                                                            CHOSEN_PRODUCT_ID: this.state.productId,
                                                        })
                                                    }
                                                } else {
                                                    this.showingDateForIndex = 0
                                                    this.setState({
                                                        showDatePicker: true
                                                    })
                                                }
                                            }}>
                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                <ImageComponent
                                                    source={require('../../assets/clockGreySmall.png')} />
                                                <TextComponent
                                                    style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                    {this.state.appointmentToTime}
                                                </TextComponent>
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.line} />
                                    </View>
                                </View>
                                <TextComponent style={commonStyles.errorText}>{this.state.appointmentDateError}</TextComponent>

                                {this.state.showAlternateDateOne &&
                                    <View>
                                        <View style={[commonStyles.rowContainer, { marginTop: 20, justifyContent: 'space-between', }]}>
                                            <TextComponent
                                                style={[styles.textInput, {
                                                    color: colors.primaryColor, width: '29%'
                                                }]}>
                                                {strings.choose_alternate_day + strings.asterisk}
                                            </TextComponent>
                                            <TextComponent
                                                style={[styles.textInput, {
                                                    color: colors.primaryColor, width: '30%',
                                                }]}>
                                                {strings.choose_time + strings.asterisk}
                                            </TextComponent>
                                            {/* Adding empty views to match width %  */}
                                            <View style={{ width: '29%' }} />
                                            <TouchableOpacity
                                                style={{ padding: 10, alignSelf: 'center', opacity: 0 }}>
                                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={[commonStyles.rowContainer,
                                        { justifyContent: 'space-between', marginTop: 5 }]}>
                                            <View style={{ width: '29%', }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.showingDateForIndex = 1
                                                        this.setState({
                                                            showDatePicker: true,
                                                            alternateFromTimeOne: strings.from_2,
                                                            alternateToTimeOne: strings.to,
                                                            alternateFromTimeOneObject: null,
                                                            alternateToTimeOneObject: null,
                                                        })
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                        <ImageComponent
                                                            source={require('../../assets/calGreySmall.png')} />
                                                        <TextComponent
                                                            style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                            {this.state.alternateDateOne}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableOpacity>
                                                <View style={styles.line} />
                                            </View>
                                            <View style={{ width: '29%', }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (this.state.alternateDateOneObjectInitial) {
                                                            this.showingTimeForIndex = 1
                                                            
                                                            if (this.predefinedSlots) {
                                                                this.props.navigation.navigate(screenNames.CHOOSE_PREDEFINED_TIME_SCREEN, {
                                                                    CURRENT_DATE: this.state.alternateDateOneObjectInitial,
                                                                    ALL_AVAILABLE_SLOTS: this.alternateOneDateScheduler,
                                                                    ALL_BLOCKED_SLOTS: this.alternateOneDateHolidays,
                                                                    LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                                    LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                                    CALLBACK: this.timePickerCallback,
                                                                })
                                                            } else {
                                                                this.props.navigation.navigate(screenNames.CHOOSE_TIME_SCREEN, {
                                                                    CURRENT_DATE: this.state.alternateDateOneObjectInitial,
                                                                    ALL_AVAILABLE_SLOTS: this.alternateOneDateScheduler,
                                                                    ALL_BLOCKED_SLOTS: this.alternateOneDateHolidays,
                                                                    LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                                    LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                                    CALLBACK: this.timePickerCallback,
                                                                    CHOSEN_PRODUCT_ID: this.state.productId,
                                                                })
                                                            }
                                                        } else {
                                                            this.showingDateForIndex = 1
                                                            this.setState({
                                                                showDatePicker: true
                                                            })
                                                        }
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                        <ImageComponent
                                                            source={require('../../assets/clockGreySmall.png')} />
                                                        <TextComponent
                                                            style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                            {this.state.alternateFromTimeOne}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableOpacity>
                                                <View style={styles.line} />
                                            </View>
                                            <View style={{ width: '29%' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (this.state.alternateDateOneObjectInitial) {
                                                            this.showingTimeForIndex = 1
                                                            
                                                            if (this.predefinedSlots) {
                                                                this.props.navigation.navigate(screenNames.CHOOSE_PREDEFINED_TIME_SCREEN, {
                                                                    CURRENT_DATE: this.state.alternateDateOneObjectInitial,
                                                                    ALL_AVAILABLE_SLOTS: this.alternateOneDateScheduler,
                                                                    ALL_BLOCKED_SLOTS: this.alternateOneDateHolidays,
                                                                    LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                                    LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                                    CALLBACK: this.timePickerCallback,
                                                                })
                                                            } else {
                                                                this.props.navigation.navigate(screenNames.CHOOSE_TIME_SCREEN, {
                                                                    CURRENT_DATE: this.state.alternateDateOneObjectInitial,
                                                                    ALL_AVAILABLE_SLOTS: this.alternateOneDateScheduler,
                                                                    ALL_BLOCKED_SLOTS: this.alternateOneDateHolidays,
                                                                    LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                                    LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                                    CALLBACK: this.timePickerCallback,
                                                                    CHOSEN_PRODUCT_ID: this.state.productId,
                                                                })
                                                            }
                                                        } else {
                                                            this.showingDateForIndex = 1
                                                            this.setState({
                                                                showDatePicker: true
                                                            })
                                                        }
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                        <ImageComponent
                                                            source={require('../../assets/clockGreySmall.png')} />
                                                        <TextComponent
                                                            style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                            {this.state.alternateToTimeOne}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableOpacity>
                                                <View style={styles.line} />
                                            </View>
                                            <TouchableOpacity
                                                style={{ padding: 10, alignSelf: 'center', }}
                                                onPress={() => {
                                                    this.setState({
                                                        showAlternateDateOne: false,
                                                        alternateDateOneObject: null,
                                                        alternateDateOneObjectInitial: null,
                                                        alternateFromTimeOneObject: null,
                                                        alternateToTimeOneObject: null,
                                                        alternateDateOne: strings.date,
                                                        alternateFromTimeOne: strings.from_2,
                                                        alternateToTimeOne: strings.to,
                                                        appointmentDateError: "",
                                                        alternateDateOneError: "",
                                                        alternateDateTwoError: "",
                                                    })
                                                }}>
                                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                            </TouchableOpacity>
                                        </View>
                                        <TextComponent style={commonStyles.errorText}>{this.state.alternateDateOneError}</TextComponent>
                                    </View>
                                }

                                {this.state.showAlternateDateTwo &&
                                    <View>
                                        <View style={[commonStyles.rowContainer, { marginTop: 20, justifyContent: 'space-between', }]}>
                                            <TextComponent
                                                style={[styles.textInput, {
                                                    color: colors.primaryColor, width: '29%'
                                                }]}>
                                                {strings.choose_alternate_day + strings.asterisk}
                                            </TextComponent>
                                            <TextComponent
                                                style={[styles.textInput, {
                                                    color: colors.primaryColor, width: '30%',
                                                }]}>
                                                {strings.choose_time + strings.asterisk}
                                            </TextComponent>
                                            {/* Adding empty views to match width %  */}
                                            <View style={{ width: '29%' }} />
                                            <TouchableOpacity
                                                style={{ padding: 10, alignSelf: 'center', opacity: 0 }}>
                                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={[commonStyles.rowContainer, { justifyContent: 'space-between', marginTop: 5 }]}>
                                            <View style={{ width: '30%', }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.showingDateForIndex = 2
                                                        this.setState({
                                                            showDatePicker: true,
                                                            alternateFromTimeTwo: strings.from_2,
                                                            alternateToTimeTwo: strings.to,
                                                            alternateFromTimeTwoObject: null,
                                                            alternateToTimeTwoObject: null,
                                                        })
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                        <ImageComponent
                                                            source={require('../../assets/calGreySmall.png')} />
                                                        <TextComponent
                                                            style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                            {this.state.alternateDateTwo}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableOpacity>
                                                <View style={styles.line} />
                                            </View>
                                            <View style={{ width: '29%' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (this.state.alternateDateTwoObjectInitial) {
                                                            this.showingTimeForIndex = 2
                                                            
                                                            if (this.predefinedSlots) {
                                                                this.props.navigation.navigate(screenNames.CHOOSE_PREDEFINED_TIME_SCREEN, {
                                                                    CURRENT_DATE: this.state.alternateDateTwoObjectInitial,
                                                                    ALL_AVAILABLE_SLOTS: this.alternateTwoDateScheduler,
                                                                    ALL_BLOCKED_SLOTS: this.alternateTwoDateHolidays,
                                                                    LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                                    LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                                    CALLBACK: this.timePickerCallback,
                                                                })
                                                            } else {
                                                                this.props.navigation.navigate(screenNames.CHOOSE_TIME_SCREEN, {
                                                                    CURRENT_DATE: this.state.alternateDateTwoObjectInitial,
                                                                    ALL_AVAILABLE_SLOTS: this.alternateTwoDateScheduler,
                                                                    ALL_BLOCKED_SLOTS: this.alternateTwoDateHolidays,
                                                                    LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                                    LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                                    CALLBACK: this.timePickerCallback,
                                                                    CHOSEN_PRODUCT_ID: this.state.productId,
                                                                })
                                                            }
                                                        } else {
                                                            this.showingDateForIndex = 2
                                                            this.setState({
                                                                showDatePicker: true
                                                            })
                                                        }
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                        <ImageComponent
                                                            source={require('../../assets/clockGreySmall.png')} />
                                                        <TextComponent
                                                            style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                            {this.state.alternateFromTimeTwo}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableOpacity>
                                                <View style={styles.line} />
                                            </View>
                                            <View style={{ width: '29%' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (this.state.alternateDateTwoObjectInitial) {
                                                            this.showingTimeForIndex = 2

                                                            if (this.predefinedSlots) {
                                                                this.props.navigation.navigate(screenNames.CHOOSE_PREDEFINED_TIME_SCREEN, {
                                                                    CURRENT_DATE: this.state.alternateDateTwoObjectInitial,
                                                                    ALL_AVAILABLE_SLOTS: this.alternateTwoDateScheduler,
                                                                    ALL_BLOCKED_SLOTS: this.alternateTwoDateHolidays,
                                                                    LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                                    LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                                    CALLBACK: this.timePickerCallback,
                                                                })
                                                            } else {
                                                                this.props.navigation.navigate(screenNames.CHOOSE_TIME_SCREEN, {
                                                                    CURRENT_DATE: this.state.alternateDateTwoObjectInitial,
                                                                    ALL_AVAILABLE_SLOTS: this.alternateTwoDateScheduler,
                                                                    ALL_BLOCKED_SLOTS: this.alternateTwoDateHolidays,
                                                                    LUNCH_START_TIME: this.state.productId ? null : this.lunchStartTime,
                                                                    LUNCH_END_TIME: this.state.productId ? null : this.lunchEndTime,
                                                                    CALLBACK: this.timePickerCallback,
                                                                    CHOSEN_PRODUCT_ID: this.state.productId,
                                                                })
                                                            }
                                                        } else {
                                                            this.showingDateForIndex = 2
                                                            this.setState({
                                                                showDatePicker: true
                                                            })
                                                        }
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                        <ImageComponent
                                                            source={require('../../assets/clockGreySmall.png')} />
                                                        <TextComponent
                                                            style={{ paddingVertical: 10, paddingStart: 5 }}>
                                                            {this.state.alternateToTimeTwo}
                                                        </TextComponent>
                                                    </View>
                                                </TouchableOpacity>
                                                <View style={styles.line} />
                                            </View>
                                            <TouchableOpacity
                                                style={{ padding: 10, alignSelf: 'center', }}
                                                onPress={() => {
                                                    this.setState({
                                                        showAlternateDateTwo: false,
                                                        alternateDateTwoObject: null,
                                                        alternateDateTwoObjectInitial: null,
                                                        alternateFromTimeTwoObject: null,
                                                        alternateToTimeTwoObject: null,
                                                        alternateDateTwo: strings.date,
                                                        alternateFromTimeTwo: strings.from_2,
                                                        alternateToTimeTwo: strings.to,
                                                        appointmentDateError: "",
                                                        alternateDateOneError: "",
                                                        alternateDateTwoError: "",
                                                    })
                                                }}>
                                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                            </TouchableOpacity>
                                        </View>
                                        <TextComponent style={commonStyles.errorText}>{this.state.alternateDateTwoError}</TextComponent>
                                    </View>
                                }

                                {(!this.state.showAlternateDateOne || !this.state.showAlternateDateTwo) &&
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!this.state.showAlternateDateOne) {
                                                this.setState({
                                                    showAlternateDateOne: true
                                                })
                                            } else {
                                                this.setState({
                                                    showAlternateDateTwo: true
                                                })
                                            }
                                        }}
                                        style={{ marginStart: 'auto', paddingVertical: 5 }}>
                                        <TextComponent style={{
                                            color: colors.primaryColor, fontFamily: fontNames.boldFont, textDecorationLine: 'underline',
                                        }}>
                                            {"+" + strings.add_one_more_date}
                                        </TextComponent>
                                    </TouchableOpacity>
                                }

                                {this.state.productType === itemTypes.HOT_DEAL ?
                                    <View style={{ marginTop: 30, }}>
                                        <Dropdown
                                            label={strings.number_of_deals + "*"}
                                            data={this.state.numberOfDealsArray}
                                            value={this.state.numberOfDeals}
                                            onChangeText={(value, index, data) => {
                                                this.setState({
                                                    numberOfDeals: value
                                                })
                                            }}
                                            dropdownOffset={{ top: 0 }}
                                            rippleInsets={{ top: 0 }}
                                            inputContainerStyle={{ borderBottomColor: 'transparent' }}
                                        />
                                        <View style={styles.line} />
                                    </View>
                                    : <View />
                                }

                                <TextInputComponent
                                    isBorderRequired={false}
                                    underlineColorAndroid={colors.transparent}
                                    keyboardType={"numeric"}
                                    placeholder={strings.no_of_guests + "*"}
                                    onChangeText={(text) => {
                                        this.numOfGuests = text.trim()
                                        this.setState({
                                            numOfGuestsError: ''
                                        })
                                    }}
                                    maxLength={constants.NUM_OF_GUESTS_MAX_LIMIT}
                                    getRef={(input) => { this.numberOfGuestsField = input }}
                                    returnKeyType={"next"}
                                    onSubmitEditing={() => { this.whichService.focus(); }}
                                    style={{ marginTop: 20 }} />
                                <View style={styles.line} />
                                <TextComponent style={commonStyles.errorText}>
                                    {this.state.numOfGuestsError}
                                </TextComponent>

                                <TextInputComponent
                                    isBorderRequired={false}
                                    underlineColorAndroid={colors.transparent}
                                    keyboardType={"default"}
                                    style={styles.textInput}
                                    placeholder={strings.please_tell_which_services}
                                    onChangeText={(text) => {
                                        this.comments = text.trim()
                                        this.setState({
                                            commentsError: ''
                                        })
                                    }}
                                    maxLength={constants.APPOINTMENT_NOTE_MAX_LIMIT}
                                    getRef={(input) => { this.whichService = input }}
                                    returnKeyType={"done"} />
                                <View style={styles.line} />
                                <TextComponent style={commonStyles.errorText}>{this.state.commentsError}</TextComponent>

                                <View style={[commonStyles.rowContainer, { marginTop: 10, alignItems: 'center', alignSelf: 'center' }]}>
                                    <TextComponent style={{}}>
                                        {strings.conditions_the}
                                    </TextComponent>
                                    <TouchableOpacity
                                        style={{ padding: 5 }}
                                        onPress={() => {
                                            this.props.navigation.navigate(screenNames.WEB_VIEW_SCREEN, {
                                                TITLE: strings.terms_and_conditions,
                                                HTML_CONTENT: this.state.businessConditions
                                            })
                                        }}>
                                        <TextComponent style={commonStyles.terms}>
                                            {strings.conditions_of_ent}
                                        </TextComponent>
                                    </TouchableOpacity>
                                </View>
                                <TextComponent style={{ textAlign: 'center' }}>
                                    {strings.conditions_ent_apply}
                                </TextComponent>

                                <ButtonComponent
                                    style={{ marginTop: 10, marginBottom: 20 }}
                                    isFillRequired={true}
                                    onPress={this.onAddAppointmentPress}>
                                    {strings.i_agree_send_request}
                                </ButtonComponent>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        );
    }

    componentDidMount() {
        AsyncStorageHelper.getStringAsync(constants.COORDINATES)
            .then((strCoordinates) => {
                const coordinates = JSON.parse(strCoordinates);
                this.latitude = coordinates.latitude
                this.longitude = coordinates.longitude
                this.fetchProductsOfEntrepreneur()
            })
        this.loadDataForCountryCodes();
    }

    // Callback to be called when coming back from picker screen
    timePickerCallback = (startDateTime, endDateTime, isPredefined) => {
        let strDate = ""
        let strStartTime = ""
        let strEndTime = null
        if (startDateTime) {
            let date = startDateTime.getUTCDate();
            let month = startDateTime.getUTCMonth() + 1;
            if (date < 10) {
                date = "0" + date
            }
            if (month < 10) {
                month = "0" + month
            }
            strDate = startDateTime.getUTCFullYear() + "-" + month + "-" + date

            let hours = startDateTime.getUTCHours()
            let minutes = startDateTime.getUTCMinutes()

            if (hours < 10) {
                hours = "0" + hours;
            }
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            strStartTime = hours + ":" + minutes + " Uhr"
        }

        if (endDateTime) {
            if (!isPredefined) {
                endDateTime.setMinutes(endDateTime.getMinutes() + constants.INTERVAL_FOR_APPOINTMENTS)
            }

            let hours = endDateTime.getUTCHours()
            let minutes = endDateTime.getUTCMinutes()

            if (hours < 10) {
                hours = "0" + hours;
            }
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            strEndTime = hours + ":" + minutes + " Uhr"
        }

        if (this.showingTimeForIndex == 0) {
            this.setState({
                appointmentDate: strDate,
                appointmentDateObject: startDateTime,
                appointmentFromTime: strStartTime,
                appointmentToTime: strEndTime ? strEndTime : strings.to,
                appointmentFromTimeObject: startDateTime,
                appointmentToTimeObject: endDateTime,
                appointmentDateError: "",
                alternateDateOneError: "",
                alternateDateTwoError: "",
            })
        } else if (this.showingTimeForIndex == 1) {
            this.setState({
                alternateDateOne: strDate,
                alternateDateOneObject: startDateTime,
                alternateFromTimeOne: strStartTime,
                alternateToTimeOne: strEndTime ? strEndTime : strings.to,
                alternateFromTimeOneObject: startDateTime,
                alternateToTimeOneObject: endDateTime,
                alternateDateOneError: "",
                appointmentDateError: "",
                alternateDateTwoError: "",
            })
        } else if (this.showingTimeForIndex == 2) {
            this.setState({
                alternateDateTwo: strDate,
                alternateDateTwoObject: startDateTime,
                alternateFromTimeTwo: strStartTime,
                alternateToTimeTwo: strEndTime ? strEndTime : strings.to,
                alternateFromTimeTwoObject: startDateTime,
                alternateToTimeTwoObject: endDateTime,
                alternateDateTwoError: "",
                appointmentDateError: "",
                alternateDateOneError: "",
            })
        }
    }

    // Click listener for add appointment button
    onAddAppointmentPress = () => {
        if (this.state.name == '') {
            this.setState({
                nameError: strings.enter_name
            })
        } else if (this.state.contactNo == '') {
            this.setState({
                contactNoError: strings.enter_mobile
            })
        } else if (this.state.contactNo.length < constants.PHONE_CHAR_MIN_LIMIT) {
            this.setState({
                contactNoError: strings.mobile_should_be
            })
        } else if (!constants.MOBILE_REGULAR_EXPRESSION.test(this.state.contactNo)) {
            this.setState({
                contactNoError: strings.enter_valid_mobile
            })
        } else if (!this.state.appointmentDateObject) {
            this.setState({
                appointmentDateError: strings.enter_date
            })
        } else if (!this.state.appointmentFromTimeObject) {
            this.setState({
                appointmentDateError: strings.enter_from_time
            })
        } else if (this.numOfGuests == '') {
            this.setState({
                numOfGuestsError: strings.enter_num_of_guests
            })
        } else if (!constants.MOBILE_REGULAR_EXPRESSION.test(this.numOfGuests)) {
            this.setState({
                numOfGuestsError: strings.enter_valid_num_of_guests
            })
        } else if (parseInt(this.numOfGuests) < 1) {
            this.setState({
                numOfGuestsError: strings.at_least_one_guest
            })
        } else if (!this.state.termsAccepted) {
            alertDialog("", strings.accept_terms)
        } else {
            if (this.state.productType === itemTypes.HOT_DEAL && this.state.productIsHotDealUnlimited) {
                if (this.state.numberOfDeals == '') {
                    this.setState({
                        numberOfDealsError: strings.enter_number_of_deals
                    })
                    return
                } else if (!constants.MOBILE_REGULAR_EXPRESSION.test(this.state.numberOfDeals)) {
                    this.setState({
                        numberOfDealsError: strings.enter_valid_number_of_deals
                    })
                    return
                } else if (parseInt(this.state.numberOfDeals) < 1) {
                    this.setState({
                        numberOfDealsError: strings.choose_at_least_one
                    })
                    return
                } else if (parseInt(this.state.numberOfDeals) > constants.MAX_NUM_OF_DEAL) {
                    this.setState({
                        numberOfDealsError: strings.deals_should_be_less_than
                    })
                    return
                }
            }

            if (!this.state.directBookingAllowed && !this.state.productId) {
                alertDialog("", strings.mandatory_to_choose_product)
                return
            }

            let appointmentFromDateTime = this.state.appointmentFromTimeObject
            let appointmentToDateTime = this.state.appointmentToTimeObject ? this.state.appointmentToTimeObject : null

            let alternateOneFromDateTime = null;
            let alternateOneToDateTime = null;

            let alternateTwoFromDateTime = null;
            let alternateTwoToDateTime = null;

            let currentDateTime = new Date()
            let offset = getExactTimeOffset()
            currentDateTime.setMinutes(currentDateTime.getMinutes() + offset)

            if (currentDateTime.getTime() >= (appointmentFromDateTime.getTime() + getMillisecondsFromMinutes(constants.INTERVAL_FOR_APPOINTMENTS))) {
                this.setState({
                    appointmentDateError: strings.date_time_should_be_in_future
                })
                return
            }

            if (appointmentToDateTime && appointmentFromDateTime.getTime() == appointmentToDateTime.getTime()) {
                this.setState({
                    appointmentDateError: strings.both_date_time_cannot_be_same
                })
                return
            }

            if (this.state.alternateDateOneObject || this.state.alternateFromTimeOneObject || this.state.alternateToTimeOneObject) {
                if (!this.state.alternateDateOneObject) {
                    this.setState({
                        alternateDateOneError: strings.choose_alternate_date
                    })
                    return;
                } else if (!this.state.alternateFromTimeOneObject) {
                    this.setState({
                        alternateDateOneError: strings.choose_alternate_from_time
                    })
                    return;
                } else {

                    alternateOneFromDateTime = this.state.alternateFromTimeOneObject
                    alternateOneToDateTime = this.state.alternateToTimeOneObject ?
                        this.state.alternateToTimeOneObject : null

                    if (currentDateTime.getTime() >= (alternateOneFromDateTime.getTime() + getMillisecondsFromMinutes(constants.INTERVAL_FOR_APPOINTMENTS))) {
                        this.setState({
                            alternateDateOneError: strings.date_time_should_be_in_future
                        })
                        return
                    }

                    if (alternateOneToDateTime && alternateOneFromDateTime.getTime() == alternateOneToDateTime.getTime()) {
                        this.setState({
                            alternateDateOneError: strings.both_date_time_cannot_be_same
                        })
                        return
                    }
                }
            }
            if (this.state.alternateDateTwoObject || this.state.alternateFromTimeTwoObject || this.state.alternateToTimeTwoObject) {
                if (!this.state.alternateDateTwoObject) {
                    this.setState({
                        alternateDateTwoError: strings.choose_alternate_date
                    })
                    return;
                } else if (!this.state.alternateFromTimeTwoObject) {
                    this.setState({
                        alternateDateTwoError: strings.choose_alternate_from_time
                    })
                    return;
                } else {

                    alternateTwoFromDateTime = this.state.alternateFromTimeTwoObject
                    alternateTwoToDateTime = this.state.alternateToTimeTwoObject ?
                        this.state.alternateToTimeTwoObject : null

                    if (currentDateTime.getTime() >= (alternateTwoFromDateTime.getTime() + getMillisecondsFromMinutes(constants.INTERVAL_FOR_APPOINTMENTS))) {
                        this.setState({
                            alternateDateTwoError: strings.date_time_should_be_in_future
                        })
                        return
                    }

                    if (alternateTwoToDateTime && alternateTwoFromDateTime.getTime() == alternateTwoToDateTime.getTime()) {
                        this.setState({
                            alternateDateTwoError: strings.both_date_time_cannot_be_same
                        })
                        return
                    }
                }
            }

            if (!this.predefinedSlots) {
                if (alternateOneFromDateTime) {
                    if (appointmentFromDateTime.getTime() == alternateOneFromDateTime.getTime()) {
                        this.setState({
                            alternateDateOneError: strings.time_already_selected
                        })
                        return
                    } else if (appointmentToDateTime &&
                        checkIfDateIsInRange(alternateOneFromDateTime, appointmentFromDateTime, appointmentToDateTime)) {
                        this.setState({
                            alternateDateOneError: strings.time_already_selected
                        })
                        return
                    } else if (alternateOneToDateTime && appointmentToDateTime &&
                        checkIfDateIsInRange(alternateOneToDateTime, appointmentFromDateTime, appointmentToDateTime)) {
                        this.setState({
                            alternateDateOneError: strings.time_already_selected
                        })
                        return
                    } else if (alternateOneToDateTime &&
                        checkIfDateIsInRange(appointmentFromDateTime, alternateOneFromDateTime, alternateOneToDateTime)) {
                        this.setState({
                            appointmentDateError: strings.time_already_selected
                        })
                        return
                    } else if (appointmentToDateTime && alternateOneToDateTime &&
                        checkIfDateIsInRange(appointmentToDateTime, alternateOneFromDateTime, alternateOneToDateTime)) {
                        this.setState({
                            appointmentDateError: strings.time_already_selected
                        })
                        return
                    } else if (alternateTwoFromDateTime) {
                        if (alternateOneFromDateTime.getTime() == alternateTwoFromDateTime.getTime()) {
                            this.setState({
                                alternateDateOneError: strings.time_already_selected
                            })
                            return
                        } else if (alternateTwoToDateTime &&
                            checkIfDateIsInRange(alternateOneFromDateTime, alternateTwoFromDateTime, alternateTwoToDateTime)) {
                            this.setState({
                                alternateDateOneError: strings.time_already_selected
                            })
                            return
                        } else if (alternateOneToDateTime && alternateTwoToDateTime &&
                            checkIfDateIsInRange(alternateOneToDateTime, alternateTwoFromDateTime, alternateTwoToDateTime)) {
                            this.setState({
                                alternateDateOneError: strings.time_already_selected
                            })
                            return
                        }
                    }
                }

                if (alternateTwoFromDateTime) {
                    if (appointmentFromDateTime.getTime() == alternateTwoFromDateTime.getTime()) {
                        this.setState({
                            alternateDateTwoError: strings.time_already_selected
                        })
                        return
                    } else if (appointmentToDateTime &&
                        checkIfDateIsInRange(alternateTwoFromDateTime, appointmentFromDateTime, appointmentToDateTime)) {
                        this.setState({
                            alternateDateTwoError: strings.time_already_selected
                        })
                        return
                    } else if (alternateTwoToDateTime && appointmentToDateTime &&
                        checkIfDateIsInRange(alternateTwoToDateTime, appointmentFromDateTime, appointmentToDateTime)) {
                        this.setState({
                            alternateDateTwoError: strings.time_already_selected
                        })
                        return
                    } else if (alternateTwoToDateTime &&
                        checkIfDateIsInRange(appointmentFromDateTime, alternateTwoFromDateTime, alternateTwoToDateTime)) {
                        this.setState({
                            appointmentDateError: strings.time_already_selected
                        })
                        return
                    } else if (appointmentToDateTime && alternateTwoToDateTime &&
                        checkIfDateIsInRange(appointmentToDateTime, alternateTwoFromDateTime, alternateTwoToDateTime)) {
                        this.setState({
                            appointmentDateError: strings.time_already_selected
                        })
                        return
                    } else if (alternateOneFromDateTime) {
                        if (alternateTwoFromDateTime.getTime() == alternateOneFromDateTime.getTime()) {
                            this.setState({
                                alternateDateTwoError: strings.time_already_selected
                            })
                            return
                        } else if (alternateOneToDateTime &&
                            checkIfDateIsInRange(alternateTwoFromDateTime, alternateOneFromDateTime, alternateOneToDateTime)) {
                            this.setState({
                                alternateDateTwoError: strings.time_already_selected
                            })
                            return
                        } else if (alternateTwoToDateTime && alternateOneToDateTime &&
                            checkIfDateIsInRange(alternateTwoToDateTime, alternateOneFromDateTime, alternateOneToDateTime)) {
                            this.setState({
                                alternateDateTwoError: strings.time_already_selected
                            })
                            return
                        }
                    }
                }
            }

            let appointmentScheduler = [];

            let utcAppointmentFromDateTime = getUTCDateTimeFromLocalDateTime(appointmentFromDateTime)
            let utcAppointmentToDateTime = appointmentToDateTime ? getUTCDateTimeFromLocalDateTime(appointmentToDateTime) : null

            let appointmentDate = {
                isAlternateDate: 0,
                startDateTime: utcAppointmentFromDateTime,
                endDateTime: utcAppointmentToDateTime
            };
            appointmentScheduler.push(appointmentDate);

            if (alternateOneFromDateTime) {
                let utcAlternateOneFromDateTime = getUTCDateTimeFromLocalDateTime(alternateOneFromDateTime)
                let utcAlternateOneToDateTime = alternateOneToDateTime ? getUTCDateTimeFromLocalDateTime(alternateOneToDateTime) : null

                let alternateDateOne = {
                    isAlternateDate: 1,
                    startDateTime: utcAlternateOneFromDateTime,
                    endDateTime: utcAlternateOneToDateTime
                };
                appointmentScheduler.push(alternateDateOne);
            }

            if (alternateTwoFromDateTime) {
                let utcAlternateTwoFromDateTime = getUTCDateTimeFromLocalDateTime(alternateTwoFromDateTime)
                let utcAlternateTwoToDateTime = alternateTwoToDateTime ? getUTCDateTimeFromLocalDateTime(alternateTwoToDateTime) : null

                let alternateDateTwo = {
                    isAlternateDate: 1,
                    startDateTime: utcAlternateTwoFromDateTime,
                    endDateTime: utcAlternateTwoToDateTime
                };
                appointmentScheduler.push(alternateDateTwo);
            }

            this.addAppointment(appointmentScheduler)
        }
    }

    // api to add appointment
    addAppointment = (appointmentScheduler) => {
        let countryCode = ""
        countryCode = this.state.currentCountryCode.substring(1)

        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                messageId: this.messageId,
                contactName: this.state.name,
                contactNo: countryCode + this.state.contactNo,
                personsCount: parseInt(this.numOfGuests),
                appointmentNote: this.comments,
                productId: this.state.productId,
                businessId: this.businessId,
                appointmentScheduler: appointmentScheduler,
                dealCount: parseInt(this.state.numberOfDeals)
            }

            hitApi(urls.ADD_APPOINTMENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                setTimeout(() => {
                    this.setState({
                        showDealBookedPopup: true
                    })
                }, constants.HANDLING_TIMEOUT)
            }, (jsonResponse) => {
                if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                    this.productUnpublished(jsonResponse.message);
                } else if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.ADD_APPOINTMENT_LIMIT_REACHED) {
                    this.showMaxLimitReachedPopup()
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

    // api to get the schedulers
    getAvailableScheduler = () => {
        this.predefinedSlots = false
        this.startDateForAppointments = null;
        this.endDateForAppointments = null;
        this.markedDates = {}

        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                getCommonParamsForAPI().then((commonParams) => {
                    const params = {
                        ...commonParams,
                        productId: this.state.productId,
                        businessId: this.businessId,
                        timeOffset: getExactTimeOffset()
                    }

                    this.apiCount++
                    hitApi(urls.GET_AVAILABLE_SCHEDULER, urls.POST, params, null, (jsonResponse) => {
                        let response = jsonResponse.response;

                        this.setState({
                            directBookingAllowed: response.isBookingsActive
                        })

                        this.predefinedSlots = response.predefinedSlots

                        let productRedemptionStartDate = null
                        let productRedemptionEndDate = null
                        if (response.productRedemptionStartDate) {
                            productRedemptionStartDate = new Date(response.productRedemptionStartDate)
                            productRedemptionEndDate = new Date(response.productRedemptionEndDate)
                        }
                        let ninetyDaysAfter = new Date()
                        ninetyDaysAfter.setDate(ninetyDaysAfter.getDate() + constants.EXTRA_DAYS_FOR_APPOINTMENTS)

                        this.startDateForAppointments = productRedemptionStartDate ?
                            this.todayDate.getTime() >= productRedemptionStartDate.getTime() ? this.todayDate
                                : productRedemptionStartDate
                            : this.todayDate;
                        this.endDateForAppointments = productRedemptionEndDate ? productRedemptionEndDate
                            : ninetyDaysAfter

                        this.startDateForAppointments.setHours(0, 0, 0, 0);
                        this.endDateForAppointments.setHours(0, 0, 0, 0);

                        this.currentProductScheduler = response.productScheduler
                        this.entrepreneurScheduler = response.entrepreneurScheduler;
                        let entrepreneurHolidays = response.entrepreneurBlockDate;

                        if (response.lunchStartTime) {
                            this.lunchStartTime = new Date(response.lunchStartTime)
                            this.lunchEndTime = new Date(response.lunchEndTime)
                        }

                        for (let d = new Date(this.startDateForAppointments); d <= this.endDateForAppointments; d.setDate(d.getDate() + 1)) {
                            // check if today date lies in opening hours
                            let todayDay = d.getDay() + 1;
                            let exists = false;

                            if (this.state.productId) {
                                // check product scheduler only
                                if (this.currentProductScheduler.length > 0) {
                                    let schedulerType = this.currentProductScheduler[0].scheduleType

                                    if (schedulerType == scheduleTypes.DAYS) {
                                        // specific days
                                        for (let i = 0; i < this.currentProductScheduler.length; i++) {
                                            if (this.currentProductScheduler[i].scheduleDay == todayDay) {
                                                exists = true
                                                break;
                                            }
                                        }
                                    } else {
                                        // specific dates
                                        for (let i = 0; i < this.currentProductScheduler.length; i++) {
                                            let specificDateStartDateTime = new Date(this.currentProductScheduler[i].startTime);
                                            if (checkIfDatesAreSameDay(d, specificDateStartDateTime)) {
                                                exists = true
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                for (let i = 0; i < this.entrepreneurScheduler.length; i++) {
                                    if (this.entrepreneurScheduler[i].scheduleDay == todayDay) {
                                        exists = true
                                        break;
                                    }
                                }
                            }

                            let strDate = getStringDateFromLocalDateTime(d)
                            if (exists) {
                                let isFullDayHoliday = false;
                                // check if current day exists in holidays
                                for (let i = 0; i < entrepreneurHolidays.length; i++) {
                                    let currentHolidayStartDateTime = new Date(entrepreneurHolidays[i].startDateTime)

                                    if (checkIfDatesAreSameDay(d, currentHolidayStartDateTime)) {
                                        if (entrepreneurHolidays[i].isFullDayOff) {
                                            isFullDayHoliday = true
                                            break;
                                        }
                                    }
                                }

                                if (isFullDayHoliday) {
                                    this.markedDates[strDate] = this.blockedDateMarking
                                } else {
                                    this.markedDates[strDate] = this.availableDateMarking
                                }
                            } else {
                                this.markedDates[strDate] = this.blockedDateMarking
                            }
                        }

                        this.setState({
                            entrepreneurHolidays,
                            businessConditions: response.businessConditions,
                            productIsHotDealUnlimited: response.productIsHotDealUnlimited,
                        }, () => {
                            this.apiCount--
                            this.showModalLoader(false)

                            if (this.state.productId) {
                                this.productNoOfDealsPerUser = response.productNoOfDealsPerUser
                                this.dealDuration = response.dealDuration

                                if (response.productNextAvailableStartDateTime) {
                                    let maxNumberOfDeals = response.allowedDeals;

                                    if (maxNumberOfDeals > 0) {
                                        let numberOfDealsArray = []
                                        for (let i = 1; i <= maxNumberOfDeals; i++) {
                                            let value = {
                                                value: i,
                                            }
                                            numberOfDealsArray.push(value);
                                        }
                                        this.setState({
                                            numberOfDealsArray,
                                        })
                                    } else {
                                        /* 
                                         *  Should never happen now 
                                         */

                                        let productId = null
                                        let productType = null

                                        this.setState({
                                            productId,
                                            productType,
                                            numberOfDeals: 1,
                                        }, () => {
                                            setTimeout(() => {
                                                this.showMaxLimitReachedPopup()
                                            }, constants.HANDLING_TIMEOUT)
                                        })
                                    }
                                } else {
                                    let productId = null
                                    let productType = null

                                    this.setState({
                                        productId,
                                        productType,
                                        numberOfDeals: 1,
                                    }, () => {
                                        setTimeout(() => {
                                            alertDialog("", strings.deal_cannot_be_saved)
                                        }, constants.HANDLING_TIMEOUT)
                                    })
                                }
                            }
                        })
                    }, (jsonResponse) => {
                        this.apiCount = 0
                        this.showModalLoader(false)
                        setTimeout(() => {
                            if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                                this.productUnpublished(jsonResponse.message);
                            } else {
                                if (jsonResponse) {
                                    if (jsonResponse.resCode && jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                                        if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                                            clearAndMoveToLogin(this.props.navigation, screenNames.LOGIN_SCREEN)
                                        } else {
                                            alertDialog("", jsonResponse.message, strings.ok, "", () => {
                                                this.props.navigation.goBack(null);
                                            })
                                        }
                                    } else {
                                        alertDialog("", strings.could_not_connect_server, strings.ok, "", () => {
                                            this.props.navigation.goBack(null);
                                        })
                                    }
                                } else {
                                    alertDialog("", strings.something_went_wrong, strings.ok, "", () => {
                                        this.props.navigation.goBack(null);
                                    })
                                }
                            }
                        }, constants.HANDLING_TIMEOUT)
                    })
                })
            } else {
                this.apiCount = 0
                this.showModalLoader(false)

                setTimeout(() => {
                    alertDialog("", strings.internet_not_connected, strings.ok, "", () => {
                        this.props.navigation.goBack(null);
                    })
                }, constants.HANDLING_TIMEOUT)
            }
        })
    }

    showMaxLimitReachedPopup = () => {
        let duration = this.dealDuration == productDuration.DAILY ? "1"
            : this.dealDuration == productDuration.WEEKLY ? "7"
                : this.dealDuration == productDuration.MONTHLY ? "30"
                    : "365"
        let strMessage = strings.provider_has_limited + " " + this.productNoOfDealsPerUser
            + " " + strings.deals_within + " " + duration + " " + strings.already_saved_booked_max
        alertDialog("", strMessage)
    }

    // returns the scheduler for selected date
    getSelectedDateScheduler = (selectedDate) => {
        let appointmentDateScheduler = []
        let todayDay = selectedDate.getDay() + 1;
        if (this.state.productId) {
            // check product scheduler only
            if (this.currentProductScheduler.length > 0) {
                let schedulerType = this.currentProductScheduler[0].scheduleType

                if (schedulerType == scheduleTypes.DAYS) {
                    // specific days
                    for (let i = 0; i < this.currentProductScheduler.length; i++) {
                        if (this.currentProductScheduler[i].scheduleDay == todayDay) {
                            appointmentDateScheduler.push(this.currentProductScheduler[i])
                        }
                    }
                } else {
                    // specific dates
                    for (let i = 0; i < this.currentProductScheduler.length; i++) {
                        let specificDateStartDateTime = new Date(this.currentProductScheduler[i].startTime);
                        if (checkIfDatesAreSameDay(selectedDate, specificDateStartDateTime)) {
                            appointmentDateScheduler.push(this.currentProductScheduler[i])
                        }
                    }
                }
            }
        } else {
            for (let i = 0; i < this.entrepreneurScheduler.length; i++) {
                if (this.entrepreneurScheduler[i].scheduleDay == todayDay) {
                    appointmentDateScheduler.push(this.entrepreneurScheduler[i])
                }
            }
        }

        return appointmentDateScheduler;
    }

    // returns holidays for selected dates
    getSelectedDateHolidays = (selectedDate) => {
        let nextDayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1,
            0, 0, 0, 0)
        let appointmentDateHolidays = []
        for (let i = 0; i < this.state.entrepreneurHolidays.length; i++) {
            let currentHolidayStartDateTime = new Date(this.state.entrepreneurHolidays[i].startDateTime)

            if (checkIfDatesAreSameDay(selectedDate, currentHolidayStartDateTime)) {
                appointmentDateHolidays.push(this.state.entrepreneurHolidays[i])
            } else if (checkIfDatesAreSameDay(nextDayDate, currentHolidayStartDateTime)) {
                appointmentDateHolidays.push(this.state.entrepreneurHolidays[i])
            }
        }
        return appointmentDateHolidays
    }

    // api to get listing of products for appointments
    fetchProductsOfEntrepreneur = () => {
        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                this.showModalLoader(true)

                getCommonParamsForAPI().then((commonParams) => {
                    const params = {
                        ...commonParams,
                        businessId: this.businessId,
                        lat: this.latitude,
                        lng: this.longitude,
                        pageIndex: this.pageIndex,
                        pageSize: constants.PAGE_SIZE,
                        timeOffset: getTimeOffset(),
                        productId: this.state.productId,
                    }

                    this.apiCount++
                    hitApi(urls.GET_ENTREPRENEUR_PRODUCTS, urls.POST, params, null, (jsonResponse) => {
                        if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                            this.paginationRequired = false
                        }

                        let tempArray = this.state.entrepreneurProducts
                        tempArray.push(...jsonResponse.response.data)
                        this.setState({
                            entrepreneurProducts: tempArray,
                        }, () => {
                            this.shouldHitPagination = true
                            this.apiCount--
                            if (this.pageIndex == 1) {
                                // call only initially
                                this.getAvailableScheduler();
                            } else {
                                this.showModalLoader(false)
                            }
                        })
                    }, (jsonResponse) => {
                        this.apiCount = 0
                        this.shouldHitPagination = true
                        this.showModalLoader(false)
                        setTimeout(() => {
                            if (jsonResponse) {
                                if (jsonResponse.resCode && jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                                    if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                                        clearAndMoveToLogin(this.props.navigation, screenNames.LOGIN_SCREEN)
                                    } else {
                                        alertDialog("", jsonResponse.message, strings.ok, "", () => {
                                            this.props.navigation.goBack(null);
                                        })
                                    }
                                } else {
                                    alertDialog("", strings.could_not_connect_server, strings.ok, "", () => {
                                        this.props.navigation.goBack(null);
                                    })
                                }
                            } else {
                                alertDialog("", strings.something_went_wrong, strings.ok, "", () => {
                                    this.props.navigation.goBack(null);
                                })
                            }
                        }, constants.HANDLING_TIMEOUT)
                    })
                })
            } else {
                this.shouldHitPagination = true
                alertDialog("", strings.internet_not_connected, strings.ok, "", () => {
                    this.props.navigation.goBack(null);
                })
            }
        })
    }

    // api to get product's details
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
                this.setState({
                    scheduleType: jsonResponse.response[0].scheduleType,
                    schedulerRedemptionStartDate: jsonResponse.response[0].productRedemptionStartDate,
                    schedulerRedemptionEndDate: jsonResponse.response[0].productRedemptionEndDate,
                    schedulerData: jsonResponse.response[0].productScheduler,
                    productTypeForSchedule: jsonResponse.response[0].productType,
                    showInfoPopup: true
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

    toggleCountryCodeVisibility(visible) {
        this.setState({ showCountryCodes: visible });
    }

    loadDataForCountryCodes = () => {
        let data = JSON.parse(JSON.stringify(CountryCodes));
        for (let index = 0; index < data.country_codes.length; index++) {
            var obj = data.country_codes[index]
            const element = {
                name: obj.name,
                dial_code: obj.dial_code,
                code: obj.code,
            }
            this.countries.push(element)
            if (RNLocalize.getCountry() == element.code) {
                this.setState({
                    currentCountryCode: element.dial_code
                })
            }
        }
    }

    showModalLoader = (shouldShow) => {
        if (shouldShow) {
            this.setState({
                showModalLoader: shouldShow
            })
        } else {
            if (this.apiCount == 0) {
                this.setState({
                    showModalLoader: shouldShow,
                })
            }
        }
    }
}

const styles = StyleSheet.create({
    pleaseIndicate: {
        fontFamily: fontNames.boldFont,
        fontSize: sizes.largeTextSize
    },
    optional: {
        fontSize: sizes.largeTextSize
    },
    textInput: {
        marginTop: 10,
        paddingHorizontal: 0,
    },
    line: {
        width: '100%',
        height: 1,
        backgroundColor: colors.primaryColor
    },
});
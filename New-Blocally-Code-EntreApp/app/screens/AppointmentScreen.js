import React, { Component } from 'react'
import {
    View, StyleSheet, FlatList, Linking, TouchableOpacity, Modal, ScrollView,
} from 'react-native'
import { NavigationActions } from 'react-navigation'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import LoaderComponent from '../components/LoaderComponent'
import ImageComponent from '../components/ImageComponent'
import ButtonComponent from '../components/ButtonComponent'
import commonStyles from '../styles/StylesUser'
import strings from '../config/Strings'
import {
    getScreenDimensions, getCommonParamsForAPI, getOnlyDate, getOnlyMonth, parseTime, getBuissnessId,
    parseTextForCard, parseTimeWithoutUnit, changeToBooleanForAppointments, assignColors, alertDialog,
    parseDate, combineDateTime, getUTCDateTimeFromLocalDateTime, checkIfDateIsInRange, parseLocalDate,
    parseLocalTime, getTimeOffset, getLocalDateTimeFromLocalDateTime, getExactTimeOffset, handleErrorResponse,
} from '../utilities/HelperFunctions'
import colors from '../config/Colors'
import { hitApi } from '../api/ApiCall'
import { fontNames, sizes, urls, constants, appointmentSortType, screenNames, statsTypes, itemTypes, appointmentRequestStatus } from '../config/Constants'
import { IndicatorViewPager, PagerTitleIndicator } from 'react-native-best-viewpager'
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import SmallButtonComponent from '../components/SmallButtonComponent'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, } from 'react-native-calendars'
import notifee from '@notifee/react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

/**
 * Listing of Appointments Screen
 */
export default class MyAppointmentsScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.state = {
            showModalLoader: false,
            upcomingAppointmentsArray: [],
            pastAppointmentsArray: [],
            pendingAppointmentsArray: [],
            rejectedAppointmentsArray: [],
            pullToRefreshWorking: false,

            showNoUpcomingAppointments: false,
            showNoPastAppointments: false,
            showNoPendingAppointments: false,
            showNoRejectedAppointments: false,

            showAppointmentDetailPopup: false,
            currentAppointment: null,

            showDatePicker: false,
            timePicker: false,

            appointmentDate: '',
            appointmentTime: '',

            appointmentDateFull: null,
            appointmentTimeFull: null,

            errorThere: false,
            appointmentErrorText: '',

            showFilter: false,
            currentFilterDate: null,
            tabs: {
                index: 0,
                routes: [
                    { key: 'first', title:  strings.pending },
                    { key: 'second', title: strings.upcoming },
                    { key: 'third', title: strings.past },
                    { key: 'fourth', title: strings.rejected },
                ],
            }
        }

        this.shouldHitPagination = true
        this.apiCount = 0;

        this.todayDate = new Date()

        this.upcomingAppointmentsPageIndex = 1
        this.upcomingAppointmentsPaginationRequired = true

        this.pastAppointmentsPageIndex = 1
        this.pastAppointmentsPaginationRequired = true

        this.pendingAppointmentsPageIndex = 1
        this.pendingAppointmentsPaginationRequired = true

        this.rejectedAppointmentsPageIndex = 1
        this.rejectedAppointmentsPaginationRequired = true

        this.colorsArray = [colors.appointmentColorOne, colors.appointmentColorTwo, colors.appointmentColorThree, colors.appointmentColorFour]

        this.cardWidth = this.screenDimensions.width * 0.9

        this.didFocusSubscription = null

        this.indicatorViewPagerRef = null
        this.appointmentStatus = (this.props.navigation.state && this.props.navigation.state.params) ?
            this.props.navigation.state.params.APPOINTMENT_STATUS : null;

        this.isPickerForFilter = false
        this.fromFilterDate = null
        this.toFilterDate = null

        this.titleLength = 18
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    isHomeScreen={true}
                    title={strings.my_appointments}
                    navigation={this.props.navigation}
                    icon={this.state.showFilter ? require('../assets/filterSelected.png') : require('../assets/filter.png')}
                    onIconPress={() => {
                        this.changeShowFilterVisibility(!this.state.showFilter)
                    }} />

                {this.state.showDatePicker &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10, }}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', paddingVertical: 20 }}
                                    onPress={() => {
                                        this.setState({ showDatePicker: false })
                                    }}>
                                    <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 20, height: 20}}/>
                                </TouchableOpacity>

                                <Calendar
                                    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
                                    // minDate={this.todayDate}
                                    // Handler which gets executed on day press. Default = undefined
                                    onDayPress={(day) => {
                                        // setting day in the required format for processing further
                                        let date = new Date(day.year, (day.month - 1), day.day)

                                        if (this.isPickerForFilter) {
                                            let filterFromDateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
                                            let filterToDateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 0, 0)

                                            this.fromFilterDate = getLocalDateTimeFromLocalDateTime(filterFromDateLocal)
                                            this.toFilterDate = getLocalDateTimeFromLocalDateTime(filterToDateLocal)

                                            this.setState({
                                                showDatePicker: false,
                                                currentFilterDate: date,
                                            }, () => {
                                                this.hitAllApis()
                                            })
                                        } else {
                                            this.setState({
                                                appointmentDate: parseDate(date) + '',
                                                appointmentDateFull: date,
                                                showDatePicker: false,
                                                errorThere: false,
                                            })
                                        }
                                    }}
                                    // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
                                    monthFormat={'yyyy MM'}
                                    // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
                                    firstDay={1}
                                    onPressArrowLeft={substractMonth => substractMonth()}
                                    onPressArrowRight={addMonth => addMonth()}
                                />
                            </View>
                        </View>
                    </Modal>
                }

                {/* appointment detail popup */}
                {this.state.showAppointmentDetailPopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '90%', backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden' }}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', padding: 15, }}
                                    onPress={() => {
                                        this.setState({
                                            showAppointmentDetailPopup: false,

                                            showDatePicker: false,
                                            timePicker: false,

                                            appointmentDate: '',
                                            appointmentTime: '',

                                            appointmentDateFull: null,
                                            appointmentTimeFull: null,

                                            errorThere: false,
                                            appointmentErrorText: '',
                                        })
                                    }}>
                                    <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
                                </TouchableOpacity>
                                <View style={[commonStyles.rowContainer, { backgroundColor: colors.white, paddingHorizontal: 15 }]}>
                                    <View style={[{
                                        backgroundColor: this.colorsArray[this.state.currentAppointment.bgColorIndex], width: 100, height: 100,
                                        alignItems: 'center'
                                    }]}>
                                        <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize, marginTop: 10 }}>
                                            {getOnlyDate(this.state.currentAppointment.appointmentDateTime ? this.state.currentAppointment.appointmentDateTime
                                                : this.state.currentAppointment.appointmentStartDateTime)}
                                        </TextComponent>
                                        <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize }}>
                                            {getOnlyMonth(this.state.currentAppointment.appointmentDateTime ? this.state.currentAppointment.appointmentDateTime
                                                : this.state.currentAppointment.appointmentStartDateTime)}
                                        </TextComponent>
                                        <View style={{
                                            position: 'absolute', width: '100%', bottom: 0, backgroundColor: colors.hightlightColor, padding: 5,
                                            alignItems: 'center'
                                        }}>
                                            <TextComponent style={{ color: colors.white, fontSize: sizes.smallTextSize }}>
                                                {this.state.currentAppointment.appointmentDateTime ?
                                                    parseTime(this.state.currentAppointment.appointmentDateTime) :
                                                    this.state.currentAppointment.appointmentEndDateTime ?
                                                        parseTimeWithoutUnit(this.state.currentAppointment.appointmentStartDateTime) + " - "
                                                        + parseTime(this.state.currentAppointment.appointmentEndDateTime)
                                                        : parseTime(this.state.currentAppointment.appointmentStartDateTime)}
                                            </TextComponent>
                                        </View>
                                    </View>
                                    <View style={{ paddingStart: 10, width: '65%', }}>
                                        {this.state.currentAppointment.productTitle &&
                                            <TextComponent style={styles.productName}>
                                                {parseTextForCard(this.state.currentAppointment.productTitle, 16)}
                                            </TextComponent>
                                        }
                                        <TextComponent style={[styles.userId, styles.margin]}>
                                            {constants.TEXT_FOR_USER_ID + this.state.currentAppointment.bookedByUserId}
                                        </TextComponent>
                                        <TextComponent style={[styles.businessName, styles.margin]}>
                                            {this.state.currentAppointment.userFirstName + " " + this.state.currentAppointment.userLastName}
                                        </TextComponent>
                                        <TextComponent style={[styles.businessName, styles.margin]}>
                                            {this.state.currentAppointment.contactName}
                                        </TextComponent>

                                        <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                            <TextComponent style={{ fontSize: sizes.mediumTextSize, }}>
                                                {strings.guests_capital + " - "}
                                                <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                    {this.state.currentAppointment.personsCount}
                                                </TextComponent>
                                            </TextComponent>
                                            {(this.state.currentAppointment.productId && this.state.currentAppointment.dealCount > 0) &&
                                                <TextComponent style={{ fontSize: sizes.mediumTextSize, marginStart: 20 }}>
                                                    {strings.deals_capital + " - "}
                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                        {this.state.currentAppointment.dealCount}
                                                    </TextComponent>
                                                </TextComponent>
                                            }
                                        </View>
                                        {((this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.CANCELLED ||
                                            this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.REJECTED) &&
                                            this.state.currentAppointment.alternateStartDateTime1) &&
                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                <TextComponent style={[{ color: colors.primaryColor, alignSelf: 'baseline' }, styles.alternateText]}>
                                                    {strings.alternate_dates + ":"}
                                                </TextComponent>
                                                <View style={{ marginStart: 5 }}>
                                                    <TextComponent style={styles.alternateText}>
                                                        {(getOnlyDate(this.state.currentAppointment.alternateStartDateTime1) + " "
                                                            + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime1))
                                                            + " " +
                                                            (this.state.currentAppointment.alternateEndDateTime1 ?
                                                                parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime1)
                                                                + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime1)
                                                                : parseTime(this.state.currentAppointment.alternateStartDateTime1))
                                                        }
                                                    </TextComponent>
                                                    {this.state.currentAppointment.alternateStartDateTime2 &&
                                                        <TextComponent style={styles.alternateText}>
                                                            {(getOnlyDate(this.state.currentAppointment.alternateStartDateTime2) + " "
                                                                + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime2))
                                                                + " " +
                                                                (this.state.currentAppointment.alternateEndDateTime2 ?
                                                                    parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime2)
                                                                    + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime2)
                                                                    : parseTime(this.state.currentAppointment.alternateStartDateTime2))
                                                            }
                                                        </TextComponent>}
                                                </View>
                                            </View>
                                        }
                                        {(this.state.currentAppointment.appointmentNote && this.state.currentAppointment.appointmentNote.length > 0) ?
                                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                                {this.state.currentAppointment.appointmentNote}
                                            </TextComponent>
                                            :
                                            <View />
                                        }
                                        {this.state.currentAppointment.appointmentStatusId === appointmentRequestStatus.CANCELLED ?
                                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                                {this.state.currentAppointment.cancelledByUser ? strings.cancelled_by_user : strings.cancelled_by_you}
                                            </TextComponent>
                                            : <View />
                                        }
                                        {this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.REQUESTED &&
                                            <View style={{ marginTop: 10 }}>
                                                {this.state.currentAppointment.predefinedSlots ?
                                                    <TextComponent>
                                                        {strings.predefined_slots}
                                                    </TextComponent>
                                                    : <View />
                                                }
                                                <TouchableOpacity style={[commonStyles.rowContainer, { padding: 5 }]}
                                                    onPress={() => {
                                                        let requestedDate = new Date(this.state.currentAppointment.appointmentStartDateTime)
                                                        this.setState({
                                                            appointmentDate: parseDate(requestedDate) + '',
                                                            appointmentDateFull: requestedDate,
                                                            appointmentTime: parseTime(requestedDate, true),
                                                            appointmentTimeFull: requestedDate,
                                                            errorThere: false
                                                        })
                                                    }}>
                                                    <ImageComponent source={
                                                        new Date(this.state.currentAppointment.appointmentStartDateTime).getTime() == this.state.appointmentDateFull.getTime() ?
                                                            require('../assets/radioButton.png') :
                                                            require('../assets/radioButtonEmpty.png')
                                                    }
                                                        style={{ alignSelf: 'center' }} />
                                                    <TextComponent style={{ marginLeft: 5, }}>
                                                        {(getOnlyDate(this.state.currentAppointment.appointmentStartDateTime) + " "
                                                            + getOnlyMonth(this.state.currentAppointment.appointmentStartDateTime))
                                                            + " " +
                                                            (this.state.currentAppointment.appointmentEndDateTime ?
                                                                parseTimeWithoutUnit(this.state.currentAppointment.appointmentStartDateTime)
                                                                + " - " + parseTime(this.state.currentAppointment.appointmentEndDateTime)
                                                                : parseTime(this.state.currentAppointment.appointmentStartDateTime))
                                                        }
                                                    </TextComponent>
                                                </TouchableOpacity>

                                                {this.state.currentAppointment.alternateStartDateTime1 ?
                                                    <View>
                                                        <TouchableOpacity style={[commonStyles.rowContainer, { padding: 5 }]}
                                                            onPress={() => {
                                                                let requestedDate = new Date(this.state.currentAppointment.alternateStartDateTime1)
                                                                this.setState({
                                                                    appointmentDate: parseDate(requestedDate) + '',
                                                                    appointmentDateFull: requestedDate,
                                                                    appointmentTime: parseTime(requestedDate, true),
                                                                    appointmentTimeFull: requestedDate,
                                                                    errorThere: false
                                                                })
                                                            }}>
                                                            <ImageComponent source={
                                                                new Date(this.state.currentAppointment.alternateStartDateTime1).getTime() == this.state.appointmentDateFull.getTime() ?
                                                                    require('../assets/radioButton.png') :
                                                                    require('../assets/radioButtonEmpty.png')
                                                            }
                                                                style={{ alignSelf: 'center' }} />
                                                            <TextComponent style={{ marginLeft: 5, }}>
                                                                {(getOnlyDate(this.state.currentAppointment.alternateStartDateTime1) + " "
                                                                    + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime1))
                                                                    + " " +
                                                                    (this.state.currentAppointment.alternateEndDateTime1 ?
                                                                        parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime1)
                                                                        + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime1)
                                                                        : parseTime(this.state.currentAppointment.alternateStartDateTime1))
                                                                }
                                                            </TextComponent>
                                                        </TouchableOpacity>

                                                        {this.state.currentAppointment.alternateStartDateTime2 &&
                                                            <TouchableOpacity style={[commonStyles.rowContainer, { padding: 5 }]}
                                                                onPress={() => {
                                                                    let requestedDate = new Date(this.state.currentAppointment.alternateStartDateTime2)
                                                                    this.setState({
                                                                        appointmentDate: parseDate(requestedDate) + '',
                                                                        appointmentDateFull: requestedDate,
                                                                        appointmentTime: parseTime(requestedDate, true),
                                                                        appointmentTimeFull: requestedDate,
                                                                        errorThere: false
                                                                    })
                                                                }}>
                                                                <ImageComponent source={
                                                                    new Date(this.state.currentAppointment.alternateStartDateTime2).getTime() == this.state.appointmentDateFull.getTime() ?
                                                                        require('../assets/radioButton.png') :
                                                                        require('../assets/radioButtonEmpty.png')
                                                                }
                                                                    style={{ alignSelf: 'center' }} />
                                                                <TextComponent style={{ marginLeft: 5, }}>
                                                                    {(getOnlyDate(this.state.currentAppointment.alternateStartDateTime2) + " "
                                                                        + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime2))
                                                                        + " " +
                                                                        (this.state.currentAppointment.alternateEndDateTime2 ?
                                                                            parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime2)
                                                                            + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime2)
                                                                            : parseTime(this.state.currentAppointment.alternateStartDateTime2))
                                                                    }
                                                                </TextComponent>
                                                            </TouchableOpacity>
                                                        }

                                                    </View>
                                                    : <View />
                                                }
                                            </View>
                                        }
                                    </View>
                                    <ImageComponent
                                        style={{ position: 'absolute', right: 10 }}
                                        source={this.state.currentAppointment.productType === itemTypes.HOT_DEAL ?
                                            require('../assets/hotDealRound.png')
                                            :
                                            ""
                                        }
                                    />
                                </View>
                                <ImageComponent
                                    style={{ alignSelf: 'center', marginTop: 10 }}
                                    source={this.state.currentAppointment.appointmentStatusId === appointmentRequestStatus.CANCELLED ?
                                        require('../assets/cancelled.png')
                                        :
                                        this.state.currentAppointment.appointmentStatusId === appointmentRequestStatus.REJECTED ?
                                            require('../assets/rejected.png')
                                            : ""} />
                                <View style={[commonStyles.rowContainer, { marginTop: 20 }]}>
                                    {this.state.currentAppointment.appointmentStatusId === appointmentSortType.PENDING &&
                                        <View style={{ flex: 1 }}>
                                            <View style={{ width: '100%', justifyContent: 'center', borderTopColor: colors.greyBackgroundColor, borderTopWidth: 1 }}>
                                                <View style={{ alignSelf: 'center', width: '80%', flexDirection: 'row' }}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            // not required now
                                                            /* if (!this.state.currentAppointment.predefinedSlots) {
                                                                this.isPickerForFilter = false
                                                                this.setState({
                                                                    showDatePicker: true
                                                                })
                                                            } */
                                                        }}
                                                        style={{ paddingVertical: 20, flex: 1, flexDirection: 'column', alignSelf: 'center', justifyContent: 'center' }}>
                                                        <TextComponent
                                                            style={{ marginLeft: 5, fontSize: 12, fontFamily: fontNames.regularFont }}>
                                                            {this.state.appointmentDate.length != 0 ? this.state.appointmentDate : strings.date_star}
                                                        </TextComponent>
                                                        <View style={{ backgroundColor: colors.greyBackgroundColor, width: '80%', height: 1, marginTop: 5 }} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            if (!this.state.currentAppointment.predefinedSlots) {
                                                                this.setState({
                                                                    timePicker: true
                                                                })
                                                            }
                                                        }}
                                                        style={{ paddingVertical: 20, flex: 1, flexDirection: 'column', alignSelf: 'center', justifyContent: 'center' }}>
                                                        <TextComponent
                                                            style={{ marginLeft: 5, fontSize: 12, fontFamily: fontNames.regularFont }}>
                                                            {this.state.appointmentTime.length != 0 ? this.state.appointmentTime : strings.time_star}
                                                        </TextComponent>
                                                        <View style={{ backgroundColor: colors.greyBackgroundColor, width: '80%', height: 1, marginTop: 5 }} />
                                                    </TouchableOpacity>
                                                </View>
                                                {this.state.errorThere &&
                                                    <TextComponent
                                                        style={{ alignSelf: 'center', marginBottom: 10, color: colors.red, marginLeft: 20, marginRight: 20 }}>
                                                        {this.state.appointmentErrorText}
                                                    </TextComponent>}
                                            </View>
                                            <View style={{ alignSelf: 'center', width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (this.state.appointmentTimeFull != null && this.state.appointmentDateFull != null) {
                                                            let combinedDateTemp1 = combineDateTime(this.state.appointmentDateFull, this.state.appointmentTimeFull)

                                                            let tempDate = new Date()
                                                            let offset = getExactTimeOffset()
                                                            tempDate.setMinutes(tempDate.getMinutes() + offset)

                                                            if (combinedDateTemp1 <= tempDate) {
                                                                this.setState({
                                                                    appointmentErrorText: strings.error_appointment_future_date,
                                                                }, () => {
                                                                    this.setState({
                                                                        errorThere: true
                                                                    })
                                                                })
                                                            } else {
                                                                // check if selected time lies in user's propsed date times
                                                                let dateTimeCorrect = false;
                                                                let appointmentStartDateTime = new Date(this.state.currentAppointment.appointmentStartDateTime);
                                                                if (this.state.currentAppointment.appointmentEndDateTime) {
                                                                    let appointmentEndDateTime = new Date(this.state.currentAppointment.appointmentEndDateTime);
                                                                    if (checkIfDateIsInRange(combinedDateTemp1, appointmentStartDateTime, appointmentEndDateTime)) {
                                                                        dateTimeCorrect = true;
                                                                    }
                                                                } else {
                                                                    if (appointmentStartDateTime.getTime() == combinedDateTemp1.getTime()) {
                                                                        dateTimeCorrect = true;
                                                                    }
                                                                }
                                                                if (this.state.currentAppointment.alternateStartDateTime1) {
                                                                    let alternateStartDateTime1 = new Date(this.state.currentAppointment.alternateStartDateTime1);
                                                                    if (this.state.currentAppointment.alternateEndDateTime1) {
                                                                        let alternateEndDateTime1 = new Date(this.state.currentAppointment.alternateEndDateTime1);
                                                                        if (checkIfDateIsInRange(combinedDateTemp1, alternateStartDateTime1, alternateEndDateTime1)) {
                                                                            dateTimeCorrect = true;
                                                                        }
                                                                    } else {
                                                                        if (alternateStartDateTime1.getTime() == combinedDateTemp1.getTime()) {
                                                                            dateTimeCorrect = true;
                                                                        }
                                                                    }
                                                                }
                                                                if (this.state.currentAppointment.alternateStartDateTime2) {
                                                                    let alternateStartDateTime2 = new Date(this.state.currentAppointment.alternateStartDateTime2);
                                                                    if (this.state.currentAppointment.alternateEndDateTime2) {
                                                                        let alternateEndDateTime2 = new Date(this.state.currentAppointment.alternateEndDateTime2);
                                                                        if (checkIfDateIsInRange(combinedDateTemp1, alternateStartDateTime2, alternateEndDateTime2)) {
                                                                            dateTimeCorrect = true;
                                                                        }
                                                                    } else {
                                                                        if (alternateStartDateTime2.getTime() == combinedDateTemp1.getTime()) {
                                                                            dateTimeCorrect = true;
                                                                        }
                                                                    }
                                                                }

                                                                if (dateTimeCorrect) {
                                                                    this.setState({
                                                                        errorThere: false,
                                                                        showAddHolidayPopup: false,
                                                                        timePicker: false,
                                                                        DateTimePicker: false,
                                                                    }, () => {
                                                                        let tempTimeUtc = getUTCDateTimeFromLocalDateTime(combinedDateTemp1)

                                                                        this.approveAppointment(this.state.currentAppointment.appointmentId, tempTimeUtc)
                                                                    })
                                                                } else {
                                                                    this.setState({
                                                                        appointmentErrorText: strings.choose_time_suggested_by_user,
                                                                        errorThere: true
                                                                    })
                                                                    return;
                                                                }
                                                            }
                                                        } else {
                                                            if (this.state.appointmentDateFull === null) {
                                                                this.setState({
                                                                    appointmentErrorText: strings.error_appointment_date,
                                                                }, () => {
                                                                    this.setState({
                                                                        errorThere: true
                                                                    })
                                                                })
                                                            }
                                                            else if (this.state.appointmentTimeFull === null) {
                                                                this.setState({
                                                                    appointmentErrorText: strings.error_appointment_time,
                                                                }, () => {
                                                                    this.setState({
                                                                        errorThere: true
                                                                    })
                                                                })
                                                            } else {
                                                                this.setState({
                                                                    appointmentErrorText: strings.error_holiday_mandatory,
                                                                }, () => {
                                                                    this.setState({
                                                                        errorThere: true
                                                                    })
                                                                })
                                                            }
                                                        }
                                                    }}
                                                    style={{ backgroundColor: colors.green, paddingVertical: 10, flex: 1, flexDirection: 'column' }}>
                                                    <TextComponent
                                                        style={{ marginLeft: 5, fontSize: 15, fontFamily: fontNames.boldFont, color: colors.white, alignSelf: 'center' }}>
                                                        {strings.approve}
                                                    </TextComponent>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.rejectAppointment(this.state.currentAppointment.appointmentId)
                                                    }}
                                                    style={{ backgroundColor: colors.red, paddingVertical: 10, flex: 1, flexDirection: 'column' }}>
                                                    <TextComponent
                                                        style={{ marginLeft: 5, fontSize: 15, fontFamily: fontNames.boldFont, color: colors.white, alignSelf: 'center' }}>
                                                        {strings.reject}
                                                    </TextComponent>
                                                </TouchableOpacity>
                                            </View>
                                        </View>}
                                </View>
                            </View>
                        </View>

                        <DateTimePickerModal
                            isVisible={this.state.timePicker}
                            date={this.todayDate}
                            confirmTextIOS={strings.confirm}
                            cancelTextIOS={strings.cancel}
                            mode={'time'}
                            is24Hour={true}
                            onConfirm={(date) => {
                                if (date) {
                                    let hours = date.getHours()
                                    let minutes = date.getMinutes()
                                    if (hours < 10) {
                                        hours = "0" + hours;
                                    }
                                    if (minutes < 10) {
                                        minutes = "0" + minutes;
                                    }
                                    let strTime = hours + ":" + minutes + " Uhr"

                                    let offset = getExactTimeOffset()

                                    date.setMinutes(date.getMinutes() + offset)

                                    this.setState({
                                        appointmentTime: strTime,
                                        appointmentTimeFull: date,
                                        timePicker: false,
                                        errorThere: false,
                                    })
                                } else {
                                    this.setState({
                                        timePicker: false
                                    })
                                }
                            }}
                            onCancel={() => {
                                this.setState({
                                    timePicker: false
                                })
                            }} />
                    </Modal>
                }

                <View style={[commonStyles.container,]}>
                    {this.state.showFilter &&
                        <View style={[commonStyles.rowContainer, {
                            width: '100%', backgroundColor: colors.white, elevation: 5,
                            justifyContent: 'center', position: 'absolute', padding: 10, zIndex: 10
                        }]}>
                            <ButtonComponent
                                isFillRequired={true}
                                icon={require('../assets/calendar31White.png')}
                                iconStyle={{ marginRight: 5 }}
                                style={{ width: '28%', height: 20, marginStart: 5, padding: 0, paddingHorizontal: 5 }}
                                fontStyle={{ fontSize: sizes.smallTextSize }}
                                onPress={() => {
                                    this.isPickerForFilter = true
                                    this.setState({
                                        showDatePicker: true,
                                    })
                                }}>
                                {this.state.currentFilterDate ? parseLocalDate(this.state.currentFilterDate) : strings.choose_by_date}
                            </ButtonComponent>

                            <ButtonComponent
                                isFillRequired={true}
                                icon={require('../assets/sync.png')}
                                iconStyle={{ marginRight: 5, width: 10, height: 10 }}
                                style={{ width: '28%', height: 20, marginLeft: 5, padding: 0, paddingHorizontal: 5 }}
                                fontStyle={{ fontSize: sizes.smallTextSize }}
                                onPress={() => {
                                    this.setState({
                                        currentFilterDate: null
                                    }, () => {
                                        this.fromFilterDate = null
                                        this.toFilterDate = null
                                        this.hitAllApis()
                                    })
                                }}>
                                {strings.reset}
                            </ButtonComponent>
                        </View>
                    }
                    {/* <IndicatorViewPager
                        style={{ width: '100%', height: '100%', flexDirection: 'column-reverse', backgroundColor: colors.white }}
                        indicator={
                            <PagerTitleIndicator
                                titles={[strings.pending, strings.upcoming, strings.past, strings.rejected]}
                                style={{ backgroundColor: colors.white }}
                                itemStyle={{ width: this.screenDimensions.width / 4 }}
                                selectedItemStyle={{ width: this.screenDimensions.width / 4 }}
                                itemTextStyle={styles.indicatorText}
                                selectedItemTextStyle={styles.indicatorSelectedText}
                                selectedBorderStyle={styles.indicatorBorder}
                            />
                        }
                        ref={(ref) => this.indicatorViewPagerRef = ref}> */}
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
                              scrollEnabled
                              activeColor={colors.primaryColor}
                              inactiveColor={colors.greyTextColor}
                              indicatorStyle={{ backgroundColor: colors.primaryColor }}
                              style={{ backgroundColor: colors.transparent }}
                              tabStyle={{
                                width: 130
                            }}
                            />
                          )}
                        renderScene={SceneMap({
                            first: () => 
                            <View style={commonStyles.container}>
                            {/* Pending appointments view */}
                            <FlatList
                                data={this.state.pendingAppointmentsArray}
                                extraData={this.state}
                                onRefresh={this.onPullToRefresh}
                                refreshing={this.state.pullToRefreshWorking}
                                renderItem={({ item, index }) =>
                                    <View style={{
                                        alignItems: 'center', marginTop: index === 0 ? 10 : 0,
                                        marginBottom: index === this.state.pendingAppointmentsArray.length - 1 ? 10 : 0
                                    }}>
                                        <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                            marginBottom: 10
                                        }]}>
                                            <View style={commonStyles.cardRadius}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        let requestedDate = new Date(item.appointmentStartDateTime)
                                                        this.setState({
                                                            currentAppointment: item,
                                                            showAppointmentDetailPopup: true,
                                                            appointmentDate: parseDate(requestedDate) + '',
                                                            appointmentDateFull: requestedDate,
                                                            appointmentTime: parseTime(requestedDate, true),
                                                            appointmentTimeFull: requestedDate
                                                        })
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        padding: 15, width: this.cardWidth, backgroundColor: colors.white
                                                    }]}>
                                                        {item.productId &&
                                                            <ImageComponent
                                                                style={commonStyles.cardBadgeIcon}
                                                                source={
                                                                    item.productType === itemTypes.HOT_DEAL ?
                                                                        require('../assets/hotDeal.png')
                                                                        :
                                                                        ""
                                                                } />
                                                        }
                                                        <View style={[{
                                                            backgroundColor: this.colorsArray[item.bgColorIndex], width: 100, height: 100,
                                                            alignItems: 'center'
                                                        }]}>
                                                            <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize, marginTop: 10 }}>
                                                                {getOnlyDate(item.appointmentStartDateTime)}
                                                            </TextComponent>
                                                            <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize }}>
                                                                {getOnlyMonth(item.appointmentStartDateTime)}
                                                            </TextComponent>
                                                            <View style={{
                                                                position: 'absolute', width: '100%', bottom: 0, backgroundColor: colors.hightlightColor, padding: 5,
                                                                alignItems: 'center'
                                                            }}>
                                                                <TextComponent style={{ color: colors.white, fontSize: sizes.smallTextSize }}>
                                                                    {item.appointmentEndDateTime ?
                                                                        parseTimeWithoutUnit(item.appointmentStartDateTime) + " - "
                                                                        + parseTime(item.appointmentEndDateTime)
                                                                        : parseTime(item.appointmentStartDateTime)}
                                                                </TextComponent>
                                                            </View>
                                                        </View>
                                                        <View style={{ paddingStart: 10, width: '70%', }}>
                                                            {item.productTitle &&
                                                                <TextComponent style={styles.productName}>
                                                                    {parseTextForCard(item.productTitle, this.titleLength)}
                                                                </TextComponent>
                                                            }
                                                            <TextComponent style={[styles.userId, styles.margin]}>
                                                                {constants.TEXT_FOR_USER_ID + item.bookedByUserId}
                                                            </TextComponent>
                                                            <TextComponent style={[styles.businessName, styles.margin]}>
                                                                {parseTextForCard(item.userFirstName + " " + item.userLastName, 16)}
                                                            </TextComponent>
                                                            <TextComponent style={[styles.businessName, styles.margin]}>
                                                                {parseTextForCard(item.contactName, 16)}
                                                            </TextComponent>

                                                            <View style={[commonStyles.rowContainer, styles.margin]}>
                                                                <TextComponent style={{ fontSize: sizes.mediumTextSize, }}>
                                                                    {strings.guests_capital + " - "}
                                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                                        {item.personsCount}
                                                                    </TextComponent>
                                                                </TextComponent>
                                                                {(item.productId && item.dealCount > 0) &&
                                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, marginStart: 20 }}>
                                                                        {strings.deals_capital + " - "}
                                                                        <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                                            {item.dealCount}
                                                                        </TextComponent>
                                                                    </TextComponent>
                                                                }
                                                            </View>
                                                            {item.alternateStartDateTime1 &&
                                                                <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                    <TextComponent style={[{ color: colors.primaryColor, alignSelf: 'baseline', }, styles.alternateText]}>
                                                                        {strings.alternate_dates + ":"}
                                                                    </TextComponent>
                                                                    <View style={{ marginStart: 5 }}>
                                                                        <TextComponent style={styles.alternateText}>
                                                                            {(getOnlyDate(item.alternateStartDateTime1) + " "
                                                                                + getOnlyMonth(item.alternateStartDateTime1))
                                                                                + " " +
                                                                                (item.alternateEndDateTime1 ?
                                                                                    parseTimeWithoutUnit(item.alternateStartDateTime1)
                                                                                    + " - " + parseTime(item.alternateEndDateTime1)
                                                                                    : parseTime(item.alternateStartDateTime1))
                                                                            }
                                                                        </TextComponent>
                                                                        {item.alternateStartDateTime2 &&
                                                                            <TextComponent style={styles.alternateText}>
                                                                                {(getOnlyDate(item.alternateStartDateTime2) + " "
                                                                                    + getOnlyMonth(item.alternateStartDateTime2))
                                                                                    + " " +
                                                                                    (item.alternateEndDateTime2 ?
                                                                                        parseTimeWithoutUnit(item.alternateStartDateTime2)
                                                                                        + " - " + parseTime(item.alternateEndDateTime2)
                                                                                        : parseTime(item.alternateStartDateTime2))
                                                                                }
                                                                            </TextComponent>}
                                                                    </View>
                                                                </View>
                                                            }
                                                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                                                {parseTextForCard(item.appointmentNote, 35)}
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { marginStart: 'auto', alignItems: 'center' }]}>
                                                                {item.isMessageActive &&
                                                                    <TouchableOpacity
                                                                        style={{ paddingVertical: 5 }}
                                                                        onPress={() => {
                                                                            getBuissnessId().then((bid) => {
                                                                                let product = {}
                                                                                product.userName = item.userFirstName + ' ' + item.userLastName
                                                                                product.messageId = item.messageId
                                                                                this.props.navigation.navigate(screenNames.MESSENGER_CHAT_SCREEN, {
                                                                                    PRODUCT_ID: item.productId,
                                                                                    PRODUCT: product,
                                                                                    BUSINESS_ID: bid
                                                                                })
                                                                            })
                                                                        }}>
                                                                        <ImageComponent
                                                                            style={{ marginStart: 10 }}
                                                                            source={require('../assets/chat.png')} />
                                                                    </TouchableOpacity>
                                                                }

                                                                {item.contactNo && item.contactNo.length != 0 &&
                                                                    <TouchableOpacity
                                                                        style={{ paddingVertical: 5 }}
                                                                        onPress={() =>
                                                                            this.hitAddStats(statsTypes.CLICK_ON_CALL, item.businessId, item.productId, item.contactNo)
                                                                        }>
                                                                        <ImageComponent
                                                                            style={{ marginStart: 10, }}
                                                                            source={require('../assets/callPurple.png')} />
                                                                    </TouchableOpacity>
                                                                }
                                                            </View>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                }
                                style={styles.mainFlatList}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                ListEmptyComponent={
                                    this.state.showNoPendingAppointments &&
                                    <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                        <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                            {strings.no_pending_appointments}
                                        </TextComponent>
                                    </View>
                                }
                                onEndReached={({ distanceFromEnd }) => {
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    if (this.pendingAppointmentsPaginationRequired && this.shouldHitPagination) {
                                        this.shouldHitPagination = false
                                        this.showModalLoader(true)
                                        this.pendingAppointmentsPageIndex++
                                        this.fetchAppointments(appointmentSortType.PENDING)
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                            />
                        </View>,

                        second: () => <View style={[commonStyles.container, commonStyles.centerInContainer,]}>
                            {/* Upcoming appointments view */}
                            <FlatList
                                data={this.state.upcomingAppointmentsArray}
                                extraData={this.state}
                                onRefresh={this.onPullToRefresh}
                                refreshing={this.state.pullToRefreshWorking}
                                renderItem={({ item, index }) =>
                                    <View style={{
                                        alignItems: 'center', marginTop: index === 0 ? 10 : 0,
                                        marginBottom: index === this.state.upcomingAppointmentsArray.length - 1 ? 10 : 0
                                    }}>
                                        <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                            marginBottom: 10
                                        }]}>
                                            <View style={commonStyles.cardRadius}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({
                                                            currentAppointment: item,
                                                            showAppointmentDetailPopup: true
                                                        })
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        padding: 15, width: this.cardWidth, backgroundColor: colors.white
                                                    }]}>
                                                        {item.productId &&
                                                            <ImageComponent
                                                                style={commonStyles.cardBadgeIcon}
                                                                source={
                                                                    item.productType === itemTypes.HOT_DEAL ?
                                                                        require('../assets/hotDeal.png')
                                                                        : ""
                                                                } />
                                                        }
                                                        <View style={[{
                                                            backgroundColor: this.colorsArray[item.bgColorIndex], width: 100, height: 100,
                                                            alignItems: 'center'
                                                        }]}>
                                                            <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize, marginTop: 10 }}>
                                                                {getOnlyDate(item.appointmentDateTime)}
                                                            </TextComponent>
                                                            <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize }}>
                                                                {getOnlyMonth(item.appointmentDateTime)}
                                                            </TextComponent>
                                                            <View style={{
                                                                position: 'absolute', width: '100%', bottom: 0, backgroundColor: colors.hightlightColor, padding: 5,
                                                                alignItems: 'center'
                                                            }}>
                                                                <TextComponent style={{ color: colors.white, fontSize: sizes.smallTextSize }}>
                                                                    {parseTime(item.appointmentDateTime)}
                                                                </TextComponent>
                                                            </View>
                                                        </View>
                                                        <View style={{ paddingStart: 10, width: '70%', }}>
                                                            {item.productTitle &&
                                                                <TextComponent style={styles.productName}>
                                                                    {parseTextForCard(item.productTitle, this.titleLength)}
                                                                </TextComponent>
                                                            }
                                                            <TextComponent style={[styles.userId, styles.margin]}>
                                                                {constants.TEXT_FOR_USER_ID + item.bookedByUserId}
                                                            </TextComponent>
                                                            <TextComponent style={[styles.businessName, styles.margin]}>
                                                                {parseTextForCard(item.userFirstName + " " + item.userLastName, 16)}
                                                            </TextComponent>
                                                            <TextComponent style={[styles.businessName, styles.margin]}>
                                                                {parseTextForCard(item.contactName, 16)}
                                                            </TextComponent>

                                                            <View style={[commonStyles.rowContainer, styles.margin]}>
                                                                <TextComponent style={{ fontSize: sizes.mediumTextSize, }}>
                                                                    {strings.guests_capital + " - "}
                                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                                        {item.personsCount}
                                                                    </TextComponent>
                                                                </TextComponent>
                                                                {(item.productId && item.dealCount > 0) &&
                                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, marginStart: 20 }}>
                                                                        {strings.deals_capital + " - "}
                                                                        <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                                            {item.dealCount}
                                                                        </TextComponent>
                                                                    </TextComponent>
                                                                }
                                                            </View>
                                                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                                                {parseTextForCard(item.appointmentNote, 35)}
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { marginStart: 'auto', alignItems: 'center' }]}>
                                                                <SmallButtonComponent
                                                                    icon={require('../assets/appointmentWhite.png')}
                                                                    onPress={() => this.cancelAppointment(item.appointmentId)}>
                                                                    {strings.cancel}
                                                                </SmallButtonComponent>

                                                                {item.isMessageActive &&
                                                                    <TouchableOpacity
                                                                        style={{ paddingVertical: 5 }}
                                                                        onPress={() => {
                                                                            getBuissnessId().then((bid) => {
                                                                                let product = {}
                                                                                product.userName = item.userFirstName + ' ' + item.userLastName
                                                                                product.messageId = item.messageId
                                                                                this.props.navigation.navigate(screenNames.MESSENGER_CHAT_SCREEN, {
                                                                                    PRODUCT_ID: item.productId,
                                                                                    PRODUCT: product,
                                                                                    BUSINESS_ID: bid
                                                                                })
                                                                            })
                                                                        }}>
                                                                        <ImageComponent
                                                                            style={{ marginStart: 10 }}
                                                                            source={require('../assets/chat.png')} />
                                                                    </TouchableOpacity>
                                                                }

                                                                {item.contactNo && item.contactNo.length != 0 &&
                                                                    <TouchableOpacity
                                                                        style={{ paddingVertical: 5 }}
                                                                        onPress={() =>
                                                                            this.hitAddStats(statsTypes.CLICK_ON_CALL, item.businessId, item.productId, item.contactNo)
                                                                        }>
                                                                        <ImageComponent
                                                                            style={{ marginStart: 10, }}
                                                                            source={require('../assets/callPurple.png')} />
                                                                    </TouchableOpacity>
                                                                }
                                                            </View>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                }
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                style={{}}
                                keyExtractor={(item, index) => index.toString()}
                                ListEmptyComponent={
                                    this.state.showNoUpcomingAppointments &&
                                    <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                        <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                            {strings.no_upcoming_appointments}
                                        </TextComponent>
                                    </View>
                                }
                                onEndReached={({ distanceFromEnd }) => {
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    if (this.upcomingAppointmentsPaginationRequired && this.shouldHitPagination) {
                                        this.shouldHitPagination = false
                                        this.showModalLoader(true)
                                        this.upcomingAppointmentsPageIndex++
                                        this.fetchAppointments(appointmentSortType.UPCOMING)
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                            />
                        </View>,

                        third: () => <View style={commonStyles.container}>
                            {/* Past appointments view */}
                            <FlatList
                                data={this.state.pastAppointmentsArray}
                                extraData={this.state}
                                onRefresh={this.onPullToRefresh}
                                refreshing={this.state.pullToRefreshWorking}
                                renderItem={({ item, index }) =>
                                    <View style={{
                                        alignItems: 'center', marginTop: index === 0 ? 10 : 0,
                                        marginBottom: index === this.state.pastAppointmentsArray.length - 1 ? 10 : 0
                                    }}>
                                        <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                            marginBottom: 10
                                        }]}>
                                            <View style={commonStyles.cardRadius}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({
                                                            currentAppointment: item,
                                                            showAppointmentDetailPopup: true
                                                        })
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        padding: 15, width: this.cardWidth, backgroundColor: colors.white
                                                    }]}>
                                                        {item.productId &&
                                                            <ImageComponent
                                                                style={commonStyles.cardBadgeIcon}
                                                                source={
                                                                    item.productType === itemTypes.HOT_DEAL ?
                                                                        require('../assets/hotDeal.png')
                                                                        : ""
                                                                } />
                                                        }
                                                        <View style={[{
                                                            backgroundColor: this.colorsArray[item.bgColorIndex], width: 100, height: 100,
                                                            alignItems: 'center'
                                                        }]}>
                                                            <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize, marginTop: 10 }}>
                                                                {getOnlyDate(item.appointmentDateTime ? item.appointmentDateTime : item.appointmentStartDateTime)}
                                                            </TextComponent>
                                                            <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize }}>
                                                                {getOnlyMonth(item.appointmentDateTime ? item.appointmentDateTime : item.appointmentStartDateTime)}
                                                            </TextComponent>
                                                            <View style={{
                                                                position: 'absolute', width: '100%', bottom: 0, backgroundColor: colors.hightlightColor, padding: 5,
                                                                alignItems: 'center'
                                                            }}>
                                                                <TextComponent style={{ color: colors.white, fontSize: sizes.smallTextSize }}>
                                                                    {item.appointmentDateTime ?
                                                                        parseTime(item.appointmentDateTime) :
                                                                        item.appointmentEndDateTime ?
                                                                            parseTimeWithoutUnit(item.appointmentStartDateTime) + " - "
                                                                            + parseTime(item.appointmentEndDateTime)
                                                                            : parseTime(item.appointmentStartDateTime)}
                                                                </TextComponent>
                                                            </View>
                                                        </View>
                                                        <View style={{ paddingStart: 10, width: '70%', }}>
                                                            {item.productTitle &&
                                                                <TextComponent style={styles.productName}>
                                                                    {parseTextForCard(item.productTitle, this.titleLength)}
                                                                </TextComponent>
                                                            }
                                                            <TextComponent style={[styles.userId, styles.margin]}>
                                                                {constants.TEXT_FOR_USER_ID + item.bookedByUserId}
                                                            </TextComponent>
                                                            <TextComponent style={[styles.businessName, styles.margin]}>
                                                                {parseTextForCard(item.userFirstName + " " + item.userLastName, 16)}
                                                            </TextComponent>
                                                            <TextComponent style={[styles.businessName, styles.margin]}>
                                                                {parseTextForCard(item.contactName, 16)}
                                                            </TextComponent>

                                                            <View style={[commonStyles.rowContainer, styles.margin]}>
                                                                <TextComponent style={{ fontSize: sizes.mediumTextSize, }}>
                                                                    {strings.guests_capital + " - "}
                                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                                        {item.personsCount}
                                                                    </TextComponent>
                                                                </TextComponent>
                                                                {(item.productId && item.dealCount > 0) &&
                                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, marginStart: 20 }}>
                                                                        {strings.deals_capital + " - "}
                                                                        <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                                            {item.dealCount}
                                                                        </TextComponent>
                                                                    </TextComponent>
                                                                }
                                                            </View>
                                                            {(!item.appointmentDateTime && item.alternateStartDateTime1) &&
                                                                <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                    <TextComponent style={[{ color: colors.primaryColor, alignSelf: 'baseline', }, styles.alternateText]}>
                                                                        {strings.alternate_dates + ":"}
                                                                    </TextComponent>
                                                                    <View style={{ marginStart: 5 }}>
                                                                        <TextComponent style={styles.alternateText}>
                                                                            {(getOnlyDate(item.alternateStartDateTime1) + " "
                                                                                + getOnlyMonth(item.alternateStartDateTime1))
                                                                                + " " + (item.alternateEndDateTime1 ?
                                                                                    parseTimeWithoutUnit(item.alternateStartDateTime1)
                                                                                    + " - " + parseTime(item.alternateEndDateTime1)
                                                                                    : parseTime(item.alternateStartDateTime1))}
                                                                        </TextComponent>
                                                                        {item.alternateStartDateTime2 &&
                                                                            <TextComponent style={styles.alternateText}>
                                                                                {(getOnlyDate(item.alternateStartDateTime2) + " "
                                                                                    + getOnlyMonth(item.alternateStartDateTime2))
                                                                                    + " " + (item.alternateEndDateTime2 ?
                                                                                        parseTimeWithoutUnit(item.alternateStartDateTime2)
                                                                                        + " - " + parseTime(item.alternateEndDateTime2)
                                                                                        : parseTime(item.alternateStartDateTime2))}
                                                                            </TextComponent>}
                                                                    </View>
                                                                </View>
                                                            }
                                                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                                                {parseTextForCard(item.appointmentNote, 35)}
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { marginStart: 'auto', alignItems: 'center' }]}>
                                                                <TouchableOpacity
                                                                    style={{ paddingVertical: 5 }}
                                                                    onPress={() =>
                                                                        this.deleteAppointment(item.appointmentId)
                                                                    }>
                                                                    <ImageComponent
                                                                        style={{ marginStart: 10, }}
                                                                        source={require('../assets/delete.png')} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                }
                                style={styles.mainFlatList}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                ListEmptyComponent={
                                    this.state.showNoPastAppointments &&
                                    <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                        <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                            {strings.no_past_appointments}
                                        </TextComponent>
                                    </View>
                                }
                                onEndReached={({ distanceFromEnd }) => {
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    if (this.pastAppointmentsPaginationRequired && this.shouldHitPagination) {
                                        this.shouldHitPagination = false
                                        this.showModalLoader(true)
                                        this.pastAppointmentsPageIndex++
                                        this.fetchAppointments(appointmentSortType.PAST)
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                            />
                        </View>,

                        fourth: () =>  <View style={commonStyles.container}>
                            {/* Rejected appointments view */}
                            <FlatList
                                data={this.state.rejectedAppointmentsArray}
                                extraData={this.state}
                                onRefresh={this.onPullToRefresh}
                                refreshing={this.state.pullToRefreshWorking}
                                renderItem={({ item, index }) =>
                                    <View style={{
                                        alignItems: 'center', marginTop: index === 0 ? 10 : 0,
                                        marginBottom: index === this.state.rejectedAppointmentsArray.length - 1 ? 10 : 0
                                    }}>
                                        <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                            marginBottom: 10
                                        }]}>
                                            <View style={commonStyles.cardRadius}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({
                                                            currentAppointment: item,
                                                            showAppointmentDetailPopup: true
                                                        })
                                                    }}>
                                                    <View style={[commonStyles.rowContainer, {
                                                        padding: 15, width: this.cardWidth, backgroundColor: colors.white
                                                    }]}>
                                                        {item.productId &&
                                                            <ImageComponent
                                                                style={commonStyles.cardBadgeIcon}
                                                                source={
                                                                    item.productType === itemTypes.HOT_DEAL ?
                                                                        require('../assets/hotDeal.png')
                                                                        : ""
                                                                } />
                                                        }
                                                        <View style={[{
                                                            backgroundColor: this.colorsArray[item.bgColorIndex], width: 100, height: 100,
                                                            alignItems: 'center'
                                                        }]}>
                                                            <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize, marginTop: 10 }}>
                                                                {getOnlyDate(item.appointmentDateTime ? item.appointmentDateTime : item.appointmentStartDateTime)}
                                                            </TextComponent>
                                                            <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize }}>
                                                                {getOnlyMonth(item.appointmentDateTime ? item.appointmentDateTime : item.appointmentStartDateTime)}
                                                            </TextComponent>
                                                            <View style={{
                                                                position: 'absolute', width: '100%', bottom: 0, backgroundColor: colors.hightlightColor, padding: 5,
                                                                alignItems: 'center'
                                                            }}>
                                                                <TextComponent style={{ color: colors.white, fontSize: sizes.smallTextSize }}>
                                                                    {item.appointmentDateTime ?
                                                                        parseTime(item.appointmentDateTime) :
                                                                        item.appointmentEndDateTime ?
                                                                            parseTimeWithoutUnit(item.appointmentStartDateTime) + " - "
                                                                            + parseTime(item.appointmentEndDateTime)
                                                                            : parseTime(item.appointmentStartDateTime)}
                                                                </TextComponent>
                                                            </View>
                                                        </View>
                                                        <View style={{ paddingStart: 10, width: '70%', }}>
                                                            {item.productTitle &&
                                                                <TextComponent style={styles.productName}>
                                                                    {parseTextForCard(item.productTitle, this.titleLength)}
                                                                </TextComponent>
                                                            }
                                                            <TextComponent style={[styles.userId, styles.margin]}>
                                                                {constants.TEXT_FOR_USER_ID + item.bookedByUserId}
                                                            </TextComponent>
                                                            <TextComponent style={[styles.businessName, styles.margin]}>
                                                                {parseTextForCard(item.userFirstName + " " + item.userLastName, 16)}
                                                            </TextComponent>
                                                            <TextComponent style={[styles.businessName, styles.margin]}>
                                                                {parseTextForCard(item.contactName, 16)}
                                                            </TextComponent>

                                                            <View style={[commonStyles.rowContainer, styles.margin]}>
                                                                <TextComponent style={{ fontSize: sizes.mediumTextSize, }}>
                                                                    {strings.guests_capital + " - "}
                                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                                        {item.personsCount}
                                                                    </TextComponent>
                                                                </TextComponent>
                                                                {(item.productId && item.dealCount > 0) &&
                                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, marginStart: 20 }}>
                                                                        {strings.deals_capital + " - "}
                                                                        <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont }}>
                                                                            {item.dealCount}
                                                                        </TextComponent>
                                                                    </TextComponent>
                                                                }
                                                            </View>
                                                            {(!item.appointmentDateTime && item.alternateStartDateTime1) &&
                                                                <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                    <TextComponent style={[{ color: colors.primaryColor, alignSelf: 'baseline', }, styles.alternateText]}>
                                                                        {strings.alternate_dates + ":"}
                                                                    </TextComponent>
                                                                    <View style={{ marginStart: 5 }}>
                                                                        <TextComponent style={styles.alternateText}>
                                                                            {(getOnlyDate(item.alternateStartDateTime1) + " "
                                                                                + getOnlyMonth(item.alternateStartDateTime1))
                                                                                + " " +
                                                                                (item.alternateEndDateTime1 ?
                                                                                    parseTimeWithoutUnit(item.alternateStartDateTime1)
                                                                                    + " - " + parseTime(item.alternateEndDateTime1)
                                                                                    : parseTime(item.alternateStartDateTime1))
                                                                            }
                                                                        </TextComponent>
                                                                        {item.alternateStartDateTime2 &&
                                                                            <TextComponent style={styles.alternateText}>
                                                                                {(getOnlyDate(item.alternateStartDateTime2) + " "
                                                                                    + getOnlyMonth(item.alternateStartDateTime2))
                                                                                    + " " +
                                                                                    (item.alternateEndDateTime2 ?
                                                                                        parseTimeWithoutUnit(item.alternateStartDateTime2)
                                                                                        + " - " + parseTime(item.alternateEndDateTime2)
                                                                                        : parseTime(item.alternateStartDateTime2))}
                                                                            </TextComponent>}
                                                                    </View>
                                                                </View>
                                                            }

                                                            {(item.appointmentNote && item.appointmentNote.length > 0) ?
                                                                <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                                                    {parseTextForCard(item.appointmentNote, 35)}
                                                                </TextComponent>
                                                                : <View />
                                                            }

                                                            {item.appointmentStatusId === appointmentRequestStatus.CANCELLED ?
                                                                <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                                                    {item.cancelledByUser ? strings.cancelled_by_user : strings.cancelled_by_you}
                                                                </TextComponent>
                                                                : <View />
                                                            }

                                                            <View style={[commonStyles.rowContainer, { marginStart: 'auto', alignItems: 'center' }]}>
                                                                <ImageComponent
                                                                    source={item.appointmentStatusId === appointmentRequestStatus.CANCELLED ?
                                                                        require('../assets/cancelled.png')
                                                                        : require('../assets/rejected.png')} />

                                                                <TouchableOpacity
                                                                    style={{ paddingVertical: 5 }}
                                                                    onPress={() =>
                                                                        this.deleteAppointment(item.appointmentId)
                                                                    }>
                                                                    <ImageComponent
                                                                        style={{ marginStart: 10, }}
                                                                        source={require('../assets/delete.png')} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                }
                                style={styles.mainFlatList}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                ListEmptyComponent={
                                    this.state.showNoRejectedAppointments &&
                                    <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                        <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                            {strings.no_rejected_appointments}
                                        </TextComponent>
                                    </View>
                                }
                                onEndReached={({ distanceFromEnd }) => {
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    if (this.rejectedAppointmentsPaginationRequired && this.shouldHitPagination) {
                                        this.shouldHitPagination = false
                                        this.showModalLoader(true)
                                        this.rejectedAppointmentsPageIndex++
                                        this.fetchAppointments(appointmentSortType.REJECTED)
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                            />
                        </View>
                        })}/>
                    {/* </IndicatorViewPager> */}
                </View>
            </View >
        );
    }

    componentDidMount() {
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.hitAllApis();
            }
        );
        // Directly change the tabs
        if (this.appointmentStatus && this.appointmentStatus == appointmentRequestStatus.REQUESTED) {
            this.indicatorViewPagerRef.setPage(0)
        } else if (this.appointmentStatus && this.appointmentStatus == appointmentRequestStatus.CANCELLED) {
            this.indicatorViewPagerRef.setPage(3)
        }
    }

    changeShowFilterVisibility = (visible) => {
        this.setState({
            showFilter: visible
        })
    }

    // api to reject appointment
    rejectAppointment(appointmentId) {
        alertDialog("", strings.confirm_reject_appointment, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    appointmentId: appointmentId,
                    appointmentStatusId: appointmentRequestStatus.REJECTED,
                    appointmentDateTime: null
                }
                hitApi(urls.MANAGE_APPOINTMENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    setTimeout(() => {
                        this.setState({
                            showAppointmentDetailPopup: false,
                            showDatePicker: false,
                            timePicker: false,
                            appointmentDate: '',
                            appointmentTime: '',
                            appointmentDateFull: null,
                            appointmentTimeFull: null,
                            errorThere: false,
                            appointmentErrorText: '',
                        }, () => {
                            this.onPullToRefresh()
                        })
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    // api to approve appointment
    approveAppointment(appointmentId, appointmentDateTime) {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                appointmentId: appointmentId,
                appointmentStatusId: appointmentRequestStatus.APPROVED,
                appointmentDateTime: appointmentDateTime,
            }
            hitApi(urls.MANAGE_APPOINTMENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                setTimeout(() => {
                    this.setState({
                        showAppointmentDetailPopup: false,
    
                        showDatePicker: false,
                        timePicker: false,
    
                        appointmentDate: '',
                        appointmentTime: '',
    
                        appointmentDateFull: null,
                        appointmentTimeFull: null,
    
                        errorThere: false,
                        appointmentErrorText: '',
                    }, () => {
                        this.onPullToRefresh()
                    })
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    // Hit all required apis of the screen
    hitAllApis = () => {
        this.setState({
            upcomingAppointmentsArray: [],
            pastAppointmentsArray: [],
            pendingAppointmentsArray: [],
            rejectedAppointmentsArray: [],
            showModalLoader: true,
            showNoUpcomingAppointments: false,
            showNoPastAppointments: false,
            showNoPendingAppointments: false,
            showNoRejectedAppointments: false,
        }, () => {
            this.upcomingAppointmentsPageIndex = 1
            this.upcomingAppointmentsPaginationRequired = true
            this.pastAppointmentsPageIndex = 1
            this.pastAppointmentsPaginationRequired = true
            this.pendingAppointmentsPageIndex = 1
            this.pendingAppointmentsPaginationRequired = true
            this.rejectedAppointmentsPageIndex = 1
            this.rejectedAppointmentsPaginationRequired = true

            this.shouldHitPagination = true
            this.apiCount = 0;
            this.getUnreadCount();
            this.fetchAppointments(appointmentSortType.PENDING)
            this.fetchAppointments(appointmentSortType.UPCOMING)
            this.fetchAppointments(appointmentSortType.PAST)
            this.fetchAppointments(appointmentSortType.REJECTED)
        })
    }

    componentWillUnmount() {
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }
    }

    // pull to refresh listener
    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.hitAllApis();
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

    // API to get appointments based on appointment type
    fetchAppointments = (appointmentType) => {
        getCommonParamsForAPI().then((commonParams) => {
            let pageIndex = appointmentType === appointmentSortType.PENDING ? this.pendingAppointmentsPageIndex :
                appointmentType === appointmentSortType.UPCOMING ? this.upcomingAppointmentsPageIndex :
                    appointmentType === appointmentSortType.PAST ? this.pastAppointmentsPageIndex :
                        this.rejectedAppointmentsPageIndex;
            const params = {
                ...commonParams,
                appointmentTypeId: appointmentType,
                pageIndex: pageIndex,
                pageSize: constants.PAGE_SIZE,
                dateFrom: this.fromFilterDate,
                dateTo: this.toFilterDate,
                timeOffset: getTimeOffset(),
            }

            this.apiCount++
            hitApi(urls.GET_APPOINTMENTS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    if (appointmentType === appointmentSortType.PENDING) {
                        this.pendingAppointmentsPaginationRequired = false
                    } else if (appointmentType === appointmentSortType.UPCOMING) {
                        this.upcomingAppointmentsPaginationRequired = false
                    } else if (appointmentType === appointmentSortType.PAST) {
                        this.pastAppointmentsPaginationRequired = false
                    } else {
                        this.rejectedAppointmentsPaginationRequired = false
                    }
                }

                let newData = jsonResponse.response.data;

                if (appointmentType === appointmentSortType.PENDING) {
                    let tempArray = this.state.pendingAppointmentsArray
                    newData = assignColors(tempArray, newData, this.colorsArray.length);
                    tempArray.push(...newData)
                    this.setState({
                        pullToRefreshWorking: false,
                        pendingAppointmentsArray: tempArray,
                        showNoPendingAppointments: true
                    }, () => {
                        this.shouldHitPagination = true
                        this.apiCount--
                        this.showModalLoader(false)
                    })
                } else if (appointmentType === appointmentSortType.UPCOMING) {
                    let tempArray = this.state.upcomingAppointmentsArray
                    newData = assignColors(tempArray, newData, this.colorsArray.length);
                    tempArray.push(...newData)
                    this.setState({
                        pullToRefreshWorking: false,
                        upcomingAppointmentsArray: tempArray,
                        showNoUpcomingAppointments: true
                    }, () => {
                        this.shouldHitPagination = true
                        this.apiCount--
                        this.showModalLoader(false)
                    })
                } else if (appointmentType === appointmentSortType.PAST) {
                    let tempArray = this.state.pastAppointmentsArray
                    newData = assignColors(tempArray, newData, this.colorsArray.length);
                    tempArray.push(...newData)
                    this.setState({
                        pullToRefreshWorking: false,
                        pastAppointmentsArray: tempArray,
                        showNoPastAppointments: true
                    }, () => {
                        this.shouldHitPagination = true
                        this.apiCount--
                        this.showModalLoader(false)
                    })
                } else {
                    let tempArray = this.state.rejectedAppointmentsArray
                    newData = assignColors(tempArray, newData, this.colorsArray.length);
                    tempArray.push(...newData)
                    this.setState({
                        pullToRefreshWorking: false,
                        rejectedAppointmentsArray: tempArray,
                        showNoRejectedAppointments: true
                    }, () => {
                        this.shouldHitPagination = true
                        this.apiCount--
                        this.showModalLoader(false)
                    })
                }
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get unread count
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

    // API to delete appointment by id
    deleteAppointment(id) {
        alertDialog("", strings.confirm_delete_appointment, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    appointmentId: id
                }

                hitApi(urls.DELETE_APPOINTMENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    setTimeout(() => {
                        this.onPullToRefresh()
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    hitAddStats = (statType, businessId, productId, contactNo) => {
        this.openCaller(contactNo)
    }

    // API to cancel appointment
    cancelAppointment = (appointmentId) => {
        alertDialog("", strings.confirm_cancel_appointment, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    appointmentId
                }

                hitApi(urls.CANCEL_APPOINTMENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    setTimeout(() => {
                        this.onPullToRefresh()
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    openCaller = (contactNo) => {
        Linking.openURL(`tel:${"+" + contactNo}`)
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
    businessName: {
        fontSize: sizes.mediumTextSize,
        color: colors.blueTextColor,
    },
    userId: {
        fontSize: sizes.mediumTextSize,
        fontFamily: fontNames.boldFont,
    },
    productName: {
        fontSize: sizes.xLargeTextSize,
        fontFamily: fontNames.boldFont
    },
    margin: {
        marginTop: 3
    },
    alternateText: {
        fontSize: sizes.smallTextSize
    }
});
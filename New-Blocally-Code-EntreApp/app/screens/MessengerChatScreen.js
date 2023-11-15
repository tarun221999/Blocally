import React, { Component } from 'react'
import {
    View, KeyboardAvoidingView, Platform, StyleSheet, FlatList, TouchableOpacity, ScrollView,
    Modal, Keyboard, Linking,
} from 'react-native'
import { NavigationActions } from 'react-navigation'
import StatusBarComponent from '../components/StatusBarComponent'
import LoaderComponent from '../components/LoaderComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import TextComponent from '../components/TextComponent'
import TextInputComponent from '../components/TextInputComponent'
import ImageComponent from '../components/ImageComponent'
import ButtonComponent from '../components/ButtonComponent'
import commonStyles from '../styles/StylesUser'
import strings from '../config/Strings'
import colors from '../config/Colors'
import {
    getScreenDimensions, getCommonParamsForAPI, parseDate, parseDateTime, parseTime, alertDialog,
    parseTimeWithoutUnit, getOnlyDate, getOnlyMonth, parseTextForCard, combineDateTime,
    getUTCDateTimeFromLocalDateTime, checkIfDateIsInRange, parseLocalTime, compareMessages,
    handleErrorResponse, getLocalDateTimeFromLocalDateTime, getTimeOffset, getExactTimeOffset,
    startStackFrom,
} from '../utilities/HelperFunctions'
import {
    itemTypes, constants, sizes, urls, fontNames, appointmentRequestStatus, screenNames,
    appointmentSortType
} from '../config/Constants'
import { hitApi } from '../api/ApiCallMessenger'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, } from 'react-native-calendars'
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorageHelper from '../utilities/AsyncStorageHelper'
import notifee from '@notifee/react-native';

/**
 * Chat Screen
 */
export default class MessageScreen extends Component {
    constructor(props) {
        super(props);
        this.product = this.props.navigation.state.params.PRODUCT
        this.businessId = this.props.navigation.state.params.BUSINESS_ID

        this.screenDimensions = getScreenDimensions()
        this.startMargin = this.screenDimensions.width * 0.05

        this.messagesFlatList = null
        this.needsToGoToBottom = true

        this.state = {
            showModalLoader: false,
            messagesArray: [],
            messageToBeSent: "",
            pullToRefreshWorking: false,

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
        }

        this.messageInterval = null

        this.shouldHitTimer = true
        this.shouldAllowPullToRefresh = false
        this.shouldSendMessage = true

        this.todayDate = new Date()
        this.requestFailedCounter = 0
    }

    // api to approve appointment
    approveAppointment(appointmentId, appointmentDateTime, index) {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                appointmentId: appointmentId,
                appointmentStatusId: appointmentRequestStatus.APPROVED,
                appointmentDateTime: appointmentDateTime,
            }
            hitApi(urls.MANAGE_APPOINTMENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
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
                    let tempArr = this.state.messagesArray
                    for (let i = 0; i < tempArr.length; i++) {
                        if (i === index) {
                            tempArr[i].appointmentStatusId = appointmentRequestStatus.ACTION_PERFORMED
                            break;
                        }
                    }
                    this.setState({ messagesArray: tempArr })
                })
            })
        })
    }

    // api to reject appointment
    rejectAppointment(appointmentId, index) {
        alertDialog("", strings.confirm_reject_appointment, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    appointmentId: appointmentId,
                    appointmentStatusId: appointmentRequestStatus.REJECTED,
                    appointmentDateTime: null
                }
                hitApi(urls.MANAGE_APPOINTMENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
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
                        let tempArr = this.state.messagesArray
                        for (let i = 0; i < tempArr.length; i++) {
                            if (i === index) {
                                tempArr[i].appointmentStatusId = appointmentRequestStatus.ACTION_PERFORMED
                                break;
                            }
                        }
                        this.setState({ messagesArray: tempArr })
                    })
                })
            })
        })
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={this.product.userName}
                    navigation={this.props.navigation} />

                {this.state.showDatePicker &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', padding: 10 }}
                                    onPress={() => {
                                        this.setState({ showDatePicker: false })
                                    }}>
                                    <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
                                </TouchableOpacity>

                                <Calendar
                                    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
                                    minDate={this.todayDate}
                                    // Handler which gets executed on day press. Default = undefined
                                    onDayPress={(day) => {
                                        // setting day in the required format for processing further
                                        let date = new Date(day.year, (day.month - 1), day.day)

                                        this.setState({
                                            appointmentDate: parseDate(date) + '',
                                            appointmentDateFull: date,
                                            showDatePicker: false,
                                            errorThere: false,
                                        })
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
                                        backgroundColor: colors.appointmentColorOne, width: 100, height: 100,
                                        alignItems: 'center'
                                    }]}>
                                        <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize, marginTop: 10 }}>
                                            {this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.APPROVED
                                                ?
                                                getOnlyDate(this.state.currentAppointment.appointmentDateTime)
                                                :
                                                this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.CANCELLED ?
                                                    this.state.currentAppointment.appointmentDateTime ?
                                                        getOnlyDate(this.state.currentAppointment.appointmentDateTime)
                                                        : getOnlyDate(this.state.currentAppointment.appointmentStartDateTime)
                                                    : getOnlyDate(this.state.currentAppointment.appointmentStartDateTime)}
                                        </TextComponent>
                                        <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize }}>
                                            {this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.APPROVED
                                                ?
                                                getOnlyMonth(this.state.currentAppointment.appointmentDateTime)
                                                :
                                                this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.CANCELLED ?
                                                    this.state.currentAppointment.appointmentDateTime ?
                                                        getOnlyMonth(this.state.currentAppointment.appointmentDateTime)
                                                        : getOnlyMonth(this.state.currentAppointment.appointmentStartDateTime)
                                                    : getOnlyMonth(this.state.currentAppointment.appointmentStartDateTime)
                                            }
                                        </TextComponent>
                                        <View style={{
                                            position: 'absolute', width: '100%', bottom: 0, backgroundColor: colors.hightlightColor, padding: 5,
                                            alignItems: 'center'
                                        }}>
                                            <TextComponent style={{ color: colors.white, fontSize: sizes.smallTextSize }}>
                                                {this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.APPROVED ?
                                                    parseTime(this.state.currentAppointment.appointmentDateTime)
                                                    :
                                                    this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.CANCELLED ?
                                                        this.state.currentAppointment.appointmentDateTime ?
                                                            parseTime(this.state.currentAppointment.appointmentDateTime) :
                                                            this.state.currentAppointment.appointmentEndDateTime ?
                                                                parseTimeWithoutUnit(this.state.currentAppointment.appointmentStartDateTime) + " - "
                                                                + parseTime(this.state.currentAppointment.appointmentEndDateTime)
                                                                : parseTime(this.state.currentAppointment.appointmentStartDateTime)
                                                        : this.state.currentAppointment.appointmentEndDateTime ?
                                                            parseTimeWithoutUnit(this.state.currentAppointment.appointmentStartDateTime) + " - "
                                                            + parseTime(this.state.currentAppointment.appointmentEndDateTime)
                                                            : parseTime(this.state.currentAppointment.appointmentStartDateTime)
                                                }
                                            </TextComponent>
                                        </View>
                                    </View>
                                    <View style={{ paddingStart: 10, width: '65%', }}>
                                        {this.state.currentAppointment.productTitle &&
                                            <TextComponent style={styles.appointmentTitleText}>
                                                {parseTextForCard(this.state.currentAppointment.productTitle, 16)}
                                            </TextComponent>
                                        }

                                        {this.state.currentAppointment.bookedByUserId &&
                                            <TextComponent style={styles.appointmentContentText}>
                                                {constants.TEXT_FOR_USER_ID + this.state.currentAppointment.bookedByUserId}
                                            </TextComponent>
                                        }
                                        {this.state.currentAppointment.contactName &&
                                            <TextComponent style={styles.appointmentContentText}>
                                                {this.state.currentAppointment.contactName}
                                            </TextComponent>
                                        }

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

                                        {/* Alternate Dates */}
                                        {(this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.ACTION_PERFORMED ||
                                            this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.REJECTED) ?
                                            <View>
                                                {this.state.currentAppointment.alternateStartDateTime1 &&
                                                    <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                        {strings.alternate_date + " - "}
                                                        <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                            {parseDate(this.state.currentAppointment.alternateStartDateTime1) + " "
                                                                + (this.state.currentAppointment.alternateEndDateTime1 ?
                                                                    parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime1)
                                                                    + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime1)
                                                                    : parseTime(this.state.currentAppointment.alternateStartDateTime1))}
                                                        </TextComponent>
                                                    </TextComponent>
                                                }

                                                {this.state.currentAppointment.alternateStartDateTime2 &&
                                                    <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                        {strings.alternate_date + " - "}
                                                        <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                            {parseDate(this.state.currentAppointment.alternateStartDateTime2) + " "
                                                                + (this.state.currentAppointment.alternateEndDateTime2 ?
                                                                    parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime2)
                                                                    + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime2)
                                                                    : parseTime(this.state.currentAppointment.alternateStartDateTime2))}
                                                        </TextComponent>
                                                    </TextComponent>
                                                }
                                            </View>
                                            :
                                            /* Check if status was cancelled */
                                            (this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.CANCELLED) ?
                                                /* if cancelled then check if appointment date time exists */
                                                (this.state.currentAppointment.appointmentDateTime) ?
                                                    /* if exists then it was approved appointment, don't show */
                                                    <View />
                                                    :
                                                    /* otherwise show */
                                                    <View>
                                                        {this.state.currentAppointment.alternateStartDateTime1 &&
                                                            <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                                {strings.alternate_date + " - "}
                                                                <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                    {parseDate(this.state.currentAppointment.alternateStartDateTime1) + " "
                                                                        + (this.state.currentAppointment.alternateEndDateTime1 ?
                                                                            parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime1)
                                                                            + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime1)
                                                                            : parseTime(this.state.currentAppointment.alternateStartDateTime1))}
                                                                </TextComponent>
                                                            </TextComponent>
                                                        }

                                                        {this.state.currentAppointment.alternateStartDateTime2 &&
                                                            <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                                {strings.alternate_date + " - "}
                                                                <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                    {parseDate(this.state.currentAppointment.alternateStartDateTime2) + " "
                                                                        + (this.state.currentAppointment.alternateEndDateTime2 ?
                                                                            parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime2)
                                                                            + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime2)
                                                                            : parseTime(this.state.currentAppointment.alternateStartDateTime2))}
                                                                </TextComponent>
                                                            </TextComponent>
                                                        }
                                                    </View>
                                                :
                                                /* if not cancelled, then don't show */
                                                <View />
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
                                            : ""
                                        } />
                                </View>
                                <ImageComponent
                                    style={{ alignSelf: 'center' }}
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
                                                            // Not required now
                                                            // this.setState({ showDatePicker: true })
                                                        }}
                                                        style={{ paddingVertical: 20, flex: 1, flexDirection: 'column', alignSelf: 'center', justifyContent: 'center' }}>
                                                        <TextComponent style={{ marginLeft: 5, fontSize: 12, fontFamily: fontNames.regularFont }}>
                                                            {this.state.appointmentDate.length != 0 ? this.state.appointmentDate : strings.date_star}
                                                        </TextComponent>
                                                        <View style={{ backgroundColor: colors.greyBackgroundColor, width: '80%', height: 1, marginTop: 5 }}></View>
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
                                                        <TextComponent style={{ marginLeft: 5, fontSize: 12, fontFamily: fontNames.regularFont }}>
                                                            {this.state.appointmentTime.length != 0 ? this.state.appointmentTime : strings.time_star}
                                                        </TextComponent>
                                                        <View style={{ backgroundColor: colors.greyBackgroundColor, width: '80%', height: 1, marginTop: 5 }}></View>
                                                    </TouchableOpacity>
                                                </View>
                                                {this.state.errorThere &&
                                                    <TextComponent style={{ alignSelf: 'center', marginBottom: 10, marginHorizontal: 10, color: colors.red }}>
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
                                                                        this.approveAppointment(this.state.currentAppointment.appointmentId, getUTCDateTimeFromLocalDateTime(combinedDateTemp1), this.state.currentAppointment.index)
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
                                                    <TextComponent style={{ marginLeft: 5, fontSize: 15, fontFamily: fontNames.boldFont, color: colors.white, alignSelf: 'center' }}>{strings.approve}</TextComponent>

                                                </TouchableOpacity>
                                                <View style={{ height: '100%', width: 1, backgroundColor: colors.white }}></View>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.rejectAppointment(this.state.currentAppointment.appointmentId, this.state.currentAppointment.index)
                                                    }}
                                                    style={{ backgroundColor: colors.red, paddingVertical: 10, flex: 1, flexDirection: 'column' }}>
                                                    <TextComponent style={{ marginLeft: 5, fontSize: 15, fontFamily: fontNames.boldFont, color: colors.white, alignSelf: 'center' }}>{strings.reject}</TextComponent>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    }
                                </View>
                            </View>
                        </View>

                        <DateTimePickerModal
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            isVisible={this.state.timePicker}
                            date={this.state.appointmentDateFull}
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

                <FlatList
                    data={this.state.messagesArray}
                    extraData={this.state}
                    onRefresh={this.onPullToRefresh}
                    refreshing={this.state.pullToRefreshWorking}
                    renderItem={({ item, index }) =>
                        <View>
                            {(index === 0 || parseDate(item.sentOn) !== parseDate(this.state.messagesArray[index - 1].sentOn)) &&
                                <View style={[commonStyles.rowContainer, { alignItems: 'center', marginVertical: 10 }]}>
                                    <View style={{ height: 1, flex: 1, backgroundColor: colors.primaryColor }} />
                                    <TextComponent>
                                        {parseDate(item.sentOn)}
                                    </TextComponent>
                                    <View style={{ height: 1, flex: 1, backgroundColor: colors.primaryColor }} />
                                </View>
                            }
                            {item.appointmentId ?
                                <TouchableOpacity
                                    onPress={() => {
                                        let currentAppointment = {
                                            index: index,
                                            appointmentStartDateTime: item.appointmentStartDateTime,
                                            appointmentEndDateTime: item.appointmentEndDateTime,
                                            productTitle: item.productTitle,
                                            personsCount: item.personsCount,
                                            productId: item.productId,
                                            dealCount: item.dealCount,
                                            alternateStartDateTime1: item.alternateStartDateTime1,
                                            alternateEndDateTime1: item.alternateEndDateTime1,
                                            alternateStartDateTime2: item.alternateStartDateTime2,
                                            alternateEndDateTime2: item.alternateEndDateTime2,
                                            appointmentNote: item.appointmentNote,
                                            appointmentId: item.appointmentId,
                                            messageId: item.messageId,
                                            businessId: item.businessId,
                                            productType: item.productType,
                                            productEnableMessage: item.productEnableMessage,
                                            isMessageActive: item.isMessageActive,
                                            productEnableCalling: item.productEnableCalling,
                                            businessPhoneNumber: item.businessPhoneNumber,
                                            isCallActive: item.isCallActive,
                                            appointmentStatusId: item.appointmentStatusId,
                                            bookedByUserId: item.bookedByUserId,
                                            contactName: item.contactName,
                                            predefinedSlots: item.predefinedSlots,
                                            cancelledByUser: item.cancelledByUser,
                                            appointmentDateTime: item.appointmentDateTime,
                                        }
                                        let requestedDate = new Date(item.appointmentStartDateTime)
                                        this.setState({
                                            currentAppointment,
                                            showAppointmentDetailPopup: true,
                                            appointmentDate: parseDate(requestedDate) + '',
                                            appointmentDateFull: requestedDate,
                                            appointmentTime: parseTime(requestedDate, true),
                                            appointmentTimeFull: requestedDate
                                        })
                                    }}>
                                    <View style={[styles.appointmentView, {
                                        marginTop: 10,
                                        marginBottom: index === this.state.messagesArray.length - 1 ? 20 : 10,
                                        marginStart: item.isMessageSent ? '35%' : this.startMargin
                                    }]}>
                                        <View style={[{ backgroundColor: colors.lightGreyColor }]}>
                                            <View style={[commonStyles.rowContainer, {
                                                padding: 5, alignItems: 'center'
                                            }]}>
                                                <ImageComponent
                                                    style={{ marginStart: 10 }}
                                                    source={require('../assets/calendarBlack.png')} />
                                                <TextComponent
                                                    style={styles.appointmentText}>
                                                    {strings.appointment}
                                                </TextComponent>
                                                <ImageComponent
                                                    style={{ position: 'absolute', right: 0 }}
                                                    source={item.productType === itemTypes.HOT_DEAL ?
                                                        require('../assets/smallhotdealBadge.png')
                                                        : ""
                                                    }

                                                />

                                            </View>
                                            <View style={{ width: '100%', height: 1, backgroundColor: colors.greyLineColor }} />
                                            <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
                                                {item.productTitle &&
                                                    <TextComponent
                                                        style={styles.appointmentTitleText}>
                                                        {parseTextForCard(item.productTitle, 18)}
                                                    </TextComponent>}

                                                {item.bookedByUserId &&
                                                    <TextComponent style={styles.appointmentContentText}>
                                                        {constants.TEXT_FOR_USER_ID + item.bookedByUserId}
                                                    </TextComponent>
                                                }

                                                {item.contactName &&
                                                    <TextComponent style={styles.appointmentContentText}>
                                                        {parseTextForCard(item.contactName, 16)}
                                                    </TextComponent>
                                                }

                                                {/* Approved appointment date */}
                                                {((item.appointmentStatusId == appointmentRequestStatus.APPROVED
                                                    || item.appointmentStatusId == appointmentRequestStatus.CANCELLED)
                                                    && item.appointmentDateTime) &&
                                                    <TextComponent style={[styles.appointmentContentText]}>
                                                        {strings.approved_date + " - "}

                                                        <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                            {parseDate(item.appointmentDateTime) + " " + parseTime(item.appointmentDateTime)}
                                                        </TextComponent>
                                                    </TextComponent>
                                                }

                                                {/* Desired Date */}
                                                {(item.appointmentStatusId == appointmentRequestStatus.REQUESTED ||
                                                    item.appointmentStatusId == appointmentRequestStatus.ACTION_PERFORMED ||
                                                    item.appointmentStatusId == appointmentRequestStatus.REJECTED) ?
                                                    <TextComponent style={[styles.appointmentContentText]}>
                                                        {strings.desired_date + " - "}
                                                        <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                            {parseDate(item.appointmentStartDateTime) + " " +
                                                                (item.appointmentEndDateTime ?
                                                                    parseTimeWithoutUnit(item.appointmentStartDateTime) + " - "
                                                                    + parseTime(item.appointmentEndDateTime)
                                                                    : parseTime(item.appointmentStartDateTime))
                                                            }
                                                        </TextComponent>
                                                    </TextComponent>
                                                    :
                                                    /* Check if status was cancelled */
                                                    (item.appointmentStatusId == appointmentRequestStatus.CANCELLED) ?
                                                        /* if cancelled then check if appointment date time exists */
                                                        (item.appointmentDateTime) ?
                                                            /* if exists then it was approved appointment, don't show */
                                                            <View />
                                                            :
                                                            /* otherwise show */
                                                            <TextComponent style={[styles.appointmentContentText]}>
                                                                {strings.desired_date + " - "}
                                                                <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                    {parseDate(item.appointmentStartDateTime) + " " +
                                                                        (item.appointmentEndDateTime ?
                                                                            parseTimeWithoutUnit(item.appointmentStartDateTime) + " - "
                                                                            + parseTime(item.appointmentEndDateTime)
                                                                            : parseTime(item.appointmentStartDateTime))
                                                                    }
                                                                </TextComponent>
                                                            </TextComponent>
                                                        :
                                                        /* if not cancelled, then don't show */
                                                        <View />
                                                }

                                                {/* Alternate Dates */}
                                                {(item.appointmentStatusId == appointmentRequestStatus.REQUESTED ||
                                                    item.appointmentStatusId == appointmentRequestStatus.ACTION_PERFORMED ||
                                                    item.appointmentStatusId == appointmentRequestStatus.REJECTED) ?
                                                    <View>
                                                        {item.alternateStartDateTime1 &&
                                                            <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                                {strings.alternate_date + " - "}
                                                                <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                    {parseDate(item.alternateStartDateTime1) + " "
                                                                        + (item.alternateEndDateTime1 ?
                                                                            parseTimeWithoutUnit(item.alternateStartDateTime1)
                                                                            + " - " + parseTime(item.alternateEndDateTime1)
                                                                            : parseTime(item.alternateStartDateTime1))}
                                                                </TextComponent>
                                                            </TextComponent>
                                                        }

                                                        {item.alternateStartDateTime2 &&
                                                            <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                                {strings.alternate_date + " - "}
                                                                <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                    {parseDate(item.alternateStartDateTime2) + " "
                                                                        + (item.alternateEndDateTime2 ?
                                                                            parseTimeWithoutUnit(item.alternateStartDateTime2)
                                                                            + " - " + parseTime(item.alternateEndDateTime2)
                                                                            : parseTime(item.alternateStartDateTime2))}
                                                                </TextComponent>
                                                            </TextComponent>
                                                        }
                                                    </View>
                                                    :
                                                    /* Check if status was cancelled */
                                                    (item.appointmentStatusId == appointmentRequestStatus.CANCELLED) ?
                                                        /* if cancelled then check if appointment date time exists */
                                                        (item.appointmentDateTime) ?
                                                            /* if exists then it was approved appointment, don't show */
                                                            <View />
                                                            :
                                                            /* otherwise show */
                                                            <View>
                                                                {item.alternateStartDateTime1 &&
                                                                    <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                                        {strings.alternate_date + " - "}
                                                                        <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                            {parseDate(item.alternateStartDateTime1) + " "
                                                                                + (item.alternateEndDateTime1 ?
                                                                                    parseTimeWithoutUnit(item.alternateStartDateTime1)
                                                                                    + " - " + parseTime(item.alternateEndDateTime1)
                                                                                    : parseTime(item.alternateStartDateTime1))}
                                                                        </TextComponent>
                                                                    </TextComponent>
                                                                }

                                                                {item.alternateStartDateTime2 &&
                                                                    <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                                        {strings.alternate_date + " - "}
                                                                        <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                            {parseDate(item.alternateStartDateTime2) + " "
                                                                                + (item.alternateEndDateTime2 ?
                                                                                    parseTimeWithoutUnit(item.alternateStartDateTime2)
                                                                                    + " - " + parseTime(item.alternateEndDateTime2)
                                                                                    : parseTime(item.alternateStartDateTime2))}
                                                                        </TextComponent>
                                                                    </TextComponent>
                                                                }
                                                            </View>
                                                        :
                                                        /* if not cancelled, then don't show */
                                                        <View />
                                                }

                                                <View style={[commonStyles.rowContainer, styles.topMargin]}>
                                                    <View style={{ width: '90%', }}>
                                                        <TextComponent style={[styles.appointmentContentText, styles.topMargin]}>
                                                            {strings.no_of_guests + " - "}
                                                            <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                {item.personsCount}
                                                            </TextComponent>
                                                        </TextComponent>
                                                        {(item.productId && item.dealCount > 0) &&
                                                            <TextComponent style={[styles.appointmentContentText, styles.topMargin]}>
                                                                {strings.no_of_deals + " - "}
                                                                <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                                    {item.dealCount}
                                                                </TextComponent>
                                                            </TextComponent>
                                                        }
                                                        <TextComponent style={styles.appointmentContentText}>
                                                            {item.appointmentNote}
                                                        </TextComponent>
                                                    </View>

                                                    {item.contactNo && item.contactNo.length != 0 &&
                                                        <TouchableOpacity
                                                            style={{
                                                                paddingVertical: 5,
                                                                marginLeft: 'auto', marginTop: 'auto'
                                                            }}
                                                            onPress={() => {
                                                                this.openCaller(item.contactNo)
                                                            }}>
                                                            <ImageComponent
                                                                style={{}}
                                                                source={require('../assets/callPurple.png')} />
                                                        </TouchableOpacity>
                                                    }
                                                </View>
                                                <TextComponent style={styles.receivedDateTime}>
                                                    {parseTime(item.sentOn)}
                                                </TextComponent>
                                            </View>
                                        </View>
                                        {item.isMessageSent ?
                                            <TextComponent style={{
                                                color: colors.white, padding: 5, textAlign: 'center', fontFamily: fontNames.boldFont,
                                                backgroundColor: item.appointmentStatusId == appointmentRequestStatus.APPROVED ? colors.approvedStatusColor :
                                                    (item.appointmentStatusId == appointmentRequestStatus.REJECTED || item.appointmentStatusId == appointmentRequestStatus.CANCELLED)
                                                        ? colors.rejectedStatusColor : colors.pendingStatusColor,
                                            }}>
                                                {item.message}
                                            </TextComponent>
                                            :
                                            item.appointmentStatusId == appointmentRequestStatus.CANCELLED ?
                                                <TextComponent style={{
                                                    color: colors.white, padding: 5, textAlign: 'center', fontFamily: fontNames.boldFont,
                                                    backgroundColor: item.appointmentStatusId == appointmentRequestStatus.APPROVED ? colors.approvedStatusColor :
                                                        (item.appointmentStatusId == appointmentRequestStatus.REJECTED || item.appointmentStatusId == appointmentRequestStatus.CANCELLED)
                                                            ? colors.rejectedStatusColor : colors.pendingStatusColor,
                                                }}>
                                                    {item.message}
                                                </TextComponent>
                                                :
                                                <View style={{ flex: 1, flexDirection: 'row', width: '100%' }}>
                                                    <TouchableOpacity
                                                        disabled={(item.appointmentStatusId === appointmentRequestStatus.ACTION_PERFORMED
                                                            || item.appointmentStatusId === appointmentRequestStatus.CANCELLED)}
                                                        onPress={() => {
                                                            let currentAppointment = {
                                                                index: index,
                                                                appointmentStartDateTime: item.appointmentStartDateTime,
                                                                appointmentEndDateTime: item.appointmentEndDateTime,
                                                                productTitle: item.productTitle,
                                                                personsCount: item.personsCount,
                                                                productId: item.productId,
                                                                dealCount: item.dealCount,
                                                                alternateStartDateTime1: item.alternateStartDateTime1,
                                                                alternateEndDateTime1: item.alternateEndDateTime1,
                                                                alternateStartDateTime2: item.alternateStartDateTime2,
                                                                alternateEndDateTime2: item.alternateEndDateTime2,
                                                                appointmentNote: item.appointmentNote,
                                                                appointmentId: item.appointmentId,
                                                                messageId: item.messageId,
                                                                businessId: item.businessId,
                                                                productType: item.productType,
                                                                productEnableMessage: item.productEnableMessage,
                                                                isMessageActive: item.isMessageActive,
                                                                productEnableCalling: item.productEnableCalling,
                                                                businessPhoneNumber: item.businessPhoneNumber,
                                                                isCallActive: item.isCallActive,
                                                                appointmentStatusId: item.appointmentStatusId,
                                                                bookedByUserId: item.bookedByUserId,
                                                                contactName: item.contactName,
                                                                predefinedSlots: item.predefinedSlots,
                                                                cancelledByUser: item.cancelledByUser,
                                                                appointmentDateTime: item.appointmentDateTime,
                                                            }
                                                            let requestedDate = new Date(item.appointmentStartDateTime)
                                                            this.setState({
                                                                currentAppointment,
                                                                showAppointmentDetailPopup: true,
                                                                appointmentDate: parseDate(requestedDate) + '',
                                                                appointmentDateFull: requestedDate,
                                                                appointmentTime: parseTime(requestedDate, true),
                                                                appointmentTimeFull: requestedDate
                                                            })
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: (item.appointmentStatusId === appointmentRequestStatus.ACTION_PERFORMED
                                                                || item.appointmentStatusId === appointmentRequestStatus.CANCELLED)
                                                                ? colors.disabledGreyColor : colors.approvedStatusColor,
                                                        }}>
                                                        <TextComponent style={{
                                                            color: colors.white, padding: 5, textAlign: 'center', fontFamily: fontNames.boldFont
                                                        }}>
                                                            {strings.approve}
                                                        </TextComponent>
                                                    </TouchableOpacity>
                                                    <View style={{ height: '100%', width: 1, backgroundColor: colors.white }} />
                                                    <TouchableOpacity
                                                        disabled={(item.appointmentStatusId === appointmentRequestStatus.ACTION_PERFORMED
                                                            || item.appointmentStatusId === appointmentRequestStatus.CANCELLED)}
                                                        onPress={() => {
                                                            this.rejectAppointment(item.appointmentId, index)
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: (item.appointmentStatusId === appointmentRequestStatus.ACTION_PERFORMED
                                                                || item.appointmentStatusId === appointmentRequestStatus.CANCELLED)
                                                                ? colors.disabledGreyColor : colors.rejectedStatusColor,
                                                        }}>
                                                        <TextComponent style={{
                                                            color: colors.white, padding: 5, textAlign: 'center', fontFamily: fontNames.boldFont
                                                        }}>
                                                            {strings.reject}
                                                        </TextComponent>
                                                    </TouchableOpacity>
                                                </View>
                                        }
                                    </View>
                                </TouchableOpacity>
                                :
                                item.isMessageSent ?
                                    <View style={[styles.sentMessage, {
                                        marginTop: 10,
                                        marginBottom: index === this.state.messagesArray.length - 1 ? 20 : 10,
                                    }]}>
                                        <TextComponent style={styles.sentText}>
                                            {item.message}
                                        </TextComponent>
                                        <TextComponent style={styles.sentDateTime}>
                                            {parseTime(item.sentOn)}
                                        </TextComponent>
                                    </View>
                                    :
                                    <View style={[styles.receivedMessage, {
                                        marginTop: 10,
                                        marginBottom: index === this.state.messagesArray.length - 1 ? 20 : 10,
                                        marginStart: this.startMargin
                                    }]}>
                                        <TextComponent style={styles.receivedText}>
                                            {item.message}
                                        </TextComponent>
                                        <TextComponent style={styles.receivedDateTime}>
                                            {parseTime(item.sentOn)}
                                        </TextComponent>
                                    </View>
                            }
                        </View>
                    }
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    style={[styles.messagesFlatList,]}
                    ref={(input) => {
                        this.messagesFlatList = input
                    }}
                    onScroll={({ nativeEvent }) => {
                        if (this.isCloseToBottom(nativeEvent)) {
                            this.needsToGoToBottom = true
                        } else {
                            this.needsToGoToBottom = false
                        }
                    }}
                />
                <View
                    style={[commonStyles.rowContainer, commonStyles.centerInContainer, styles.bottomView]}>
                    <TextInputComponent
                        isBorderRequired={true}
                        underlineColorAndroid={colors.transparent}
                        style={{ width: '70%', marginEnd: 5 }}
                        value={this.state.messageToBeSent}
                        onChangeText={(text) => {
                            this.setState({
                                messageToBeSent: text
                            })
                        }} />
                    <ButtonComponent
                        isFillRequired={true}
                        color={colors.primaryColor}
                        icon={require('../assets/send.png')}
                        style={{ width: '20%', marginStart: 5 }}
                        iconStyle={{ marginEnd: 0 }}
                        onPress={this.onSendMessagePress} />
                </View>
            </KeyboardAvoidingView>
        );
    }

    componentDidMount() {
        constants.IS_CHAT_SCREEN = true;
        constants.CURRENT_CHAT_ID = this.product.messageId;
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.fetchOldMessages(this.showModalLoader);
    }

    componentWillUnmount() {
        constants.IS_CHAT_SCREEN = false;
        constants.CURRENT_CHAT_ID = -1;
        if (this.keyboardDidShowListener) {
            this.keyboardDidShowListener.remove();
        }
        if (this.keyboardDidHideListener) {
            this.keyboardDidHideListener.remove();
        }
        if (this.messageInterval) {
            clearInterval(this.messageInterval)
        }
    }

    // pull to refresh listener
    onPullToRefresh = () => {
        if (this.shouldAllowPullToRefresh) {
            this.setState({
                pullToRefreshWorking: true,
            }, () => {
                this.fetchOldMessages(this.showModalLoader);
            })
        }
    }

    // send message click listener
    onSendMessagePress = () => {
        this.setState({
            messageToBeSent: this.state.messageToBeSent.trim()
        })
        if (this.state.messageToBeSent.length > 0) {
            this.sendMessage()
        }
    }

    // timer to refresh messages
    startTimer = () => {
        if (!this.messageInterval) {
            this.messageInterval = setInterval(() => {
                if (this.state.messagesArray && this.state.messagesArray.length > 0) {
                    this.fetchNewMessages();
                } else {
                    this.fetchOldMessages(null);
                }
            }, constants.MESSAGE_REFRESH_INTERVAL);
        }
    }

    // api to get past messages
    fetchOldMessages = (showLoader) => {
        getCommonParamsForAPI().then((commonParams) => {
            let messageChatId = null
            let arrayLength = this.state.messagesArray.length
            if (arrayLength > 0) {
                messageChatId = this.state.messagesArray[0].messageChatId
            }
            const params = {
                ...commonParams,
                messageId: this.product.messageId,
                messageChatId: messageChatId,
                businessId: this.businessId,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
            }

            hitApi(urls.GET_MESSAGES_CHAT_PAST, urls.POST, params, showLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length > 0) {
                    let temp = [...jsonResponse.response.data, ...this.state.messagesArray];
                    this.setState({
                        pullToRefreshWorking: false,
                        messagesArray: temp
                    }, () => {
                        // update message id
                        this.product.messageId = jsonResponse.response.data[0].messageId;
                        if (!messageChatId) {
                            let timeoutValue = 600
                            this.scrollFlatListToEnd(timeoutValue)
                            // start timer
                            this.startTimer();
                        }
                        if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                            this.shouldAllowPullToRefresh = false;
                        } else {
                            this.shouldAllowPullToRefresh = true;
                        }
                        this.getUnreadCount();
                    })
                } else {
                    this.setState({
                        pullToRefreshWorking: false
                    }, () => {
                        this.shouldAllowPullToRefresh = false;
                        if (!messageChatId) {
                            // if user has done messaging with this entrepreneur
                            // but has deleted messages
                            // start timer
                            this.startTimer();
                        }
                        this.getUnreadCount();
                    })
                }
                this.requestFailedCounter = 0
            }, (jsonResponse) => {
                this.startTimer();
                setTimeout(() => {
                    if (jsonResponse) {
                        if (jsonResponse.isComingFromException) {
                            this.requestFailedCounter++
                            if (this.requestFailedCounter >= constants.CURRENT_COUNT_FOR_FAILURE) {
                                alertDialog("", strings.something_went_wrong)
                                this.requestFailedCounter = 0
                            }
                        } else if (jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                            if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                                alertDialog("", jsonResponse.message, strings.ok, "", () => {
                                    AsyncStorageHelper.clearAsyncStorage().then(() => {
                                        startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN);
                                    })
                                })
                            } else {
                                alertDialog("", jsonResponse.message)
                            }
                        } else {
                            alertDialog("", strings.could_not_connect_server)
                        }
                    } else {
                        alertDialog("", strings.something_went_wrong)
                    }
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    getChatIdOfLastReceivedMessage = () => {
        let messageChatId = null
        for (let i = this.state.messagesArray.length - 1; i >= 0; i--) {
            let message = this.state.messagesArray[i]
            if (!message.isMessageSent) {
                messageChatId = message.messageChatId
                break;
            }
        }
        return messageChatId;
    }

    // api to get new messages
    fetchNewMessages = () => {
        if (this.product.messageId && this.shouldHitTimer) {
            getCommonParamsForAPI().then((commonParams) => {
                let messageChatId = null
                let arrayLength = this.state.messagesArray.length

                if (arrayLength > 0) {
                    messageChatId = this.getChatIdOfLastReceivedMessage()
                    if (!messageChatId) {
                        messageChatId = this.state.messagesArray[arrayLength - 1].messageChatId
                    }
                }

                const params = {
                    ...commonParams,
                    messageId: this.product.messageId,
                    messageChatId: messageChatId,
                    timeOffset: getTimeOffset(),
                }

                this.shouldHitTimer = false
                hitApi(urls.GET_MESSAGES_CHAT_NEW, urls.POST, params, null, (jsonResponse) => {
                    let newMessages = jsonResponse.response.data;
                    if (newMessages.length > 0) {
                        /**
                         * Check if any messageId in data already exists in messagesArray
                         * then don't add it
                         */
                        if (this.state.messagesArray.length > 0) {
                            let temp = this.state.messagesArray
                            let messagesToAdd = this.getMessagesToAdd(newMessages)
                            temp.push(...messagesToAdd)

                            // sort here
                            temp.sort(compareMessages)

                            this.setState({
                                messagesArray: temp
                            }, () => {
                                if (messagesToAdd.length > 0) {
                                    this.scrollFlatListToEnd(200)
                                }
                            })
                        } else {
                            let temp = this.state.messagesArray
                            temp.push(...newMessages)
                            this.setState({
                                messagesArray: temp
                            }, () => {
                                this.scrollFlatListToEnd(200)
                            })
                        }
                    }
                    this.shouldHitTimer = true
                    this.requestFailedCounter = 0
                }, (jsonResponse) => {
                    this.shouldHitTimer = true
                    setTimeout(() => {
                        if (jsonResponse) {
                            if (jsonResponse.isComingFromException) {
                                this.requestFailedCounter++
                                if (this.requestFailedCounter >= constants.CURRENT_COUNT_FOR_FAILURE) {
                                    alertDialog("", strings.something_went_wrong)
                                    this.requestFailedCounter = 0
                                }
                            } else if (jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                                if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                                    alertDialog("", jsonResponse.message, strings.ok, "", () => {
                                        AsyncStorageHelper.clearAsyncStorage().then(() => {
                                            startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN);
                                        })
                                    })
                                } else {
                                    alertDialog("", jsonResponse.message)
                                }
                            } else {
                                alertDialog("", strings.could_not_connect_server)
                            }
                        } else {
                            alertDialog("", strings.something_went_wrong)
                        }
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        }
    }

    // api to send message
    sendMessage = () => {
        if (this.shouldSendMessage) {
            this.shouldSendMessage = false
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    message: this.state.messageToBeSent,
                    messageId: this.product.messageId,
                    businessId: this.businessId,
                    timeOffset: getTimeOffset(),
                }

                hitApi(urls.SEND_MESSAGE, urls.POST, params, null, (jsonResponse) => {
                    this.product.messageId = jsonResponse.response.data[0].messageId

                    let tempArray = this.state.messagesArray
                    let messagesToAdd = this.getMessagesToAdd(jsonResponse.response.data)
                    tempArray.push(...messagesToAdd)

                    // sort here
                    tempArray.sort(compareMessages)

                    this.setState({
                        messagesArray: tempArray,
                        messageToBeSent: ""
                    }, () => {
                        this.scrollFlatListToEnd(200)
                        this.shouldSendMessage = true
                    })
                }, (jsonResponse) => {
                    this.shouldSendMessage = true
                    handleErrorResponse(this.props.navigation, jsonResponse)
                })
            })
        }
    }

    getMessagesToAdd = (newMessages) => {
        let oldMessages = this.state.messagesArray
        let messagesToAdd = []
        for (let i = 0; i < newMessages.length; i++) {
            let alreadyExists = false
            let newMessage = newMessages[i]
            for (let j = 0; j < oldMessages.length; j++) {
                let currentMessage = oldMessages[j]

                if (newMessage.messageChatId == currentMessage.messageChatId) {
                    alreadyExists = true
                    break
                }
            }
            if (!alreadyExists) {
                messagesToAdd.push(newMessage)
            }
        }
        return messagesToAdd
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

    openCaller = (contactNo) => {
        Linking.openURL(`tel:${"+" + contactNo}`)
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }

    scrollFlatListToEnd = (timeout) => {
        setTimeout(() => {
            if (this.messagesFlatList) {
                this.messagesFlatList.scrollToEnd()
            }
        }, timeout)
    }

    _keyboardDidShow = () => {
        if (this.needsToGoToBottom) {
            this.scrollFlatListToEnd(100)
        }
    }

    _keyboardDidHide = () => {
        // Keyboard Hidden
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };
}

const styles = StyleSheet.create({
    messagesFlatList: {

    },
    receivedMessage: {
        width: '60%',
        padding: 10,
        backgroundColor: colors.greyBackgroundColor,
        borderRadius: 10,
    },
    receivedText: {
        color: colors.blackTextColor
    },
    receivedDateTime: {
        color: colors.greyTextColor,
        fontSize: sizes.smallTextSize,
        marginStart: 'auto',
        marginTop: 5
    },
    sentMessage: {
        width: '60%',
        marginStart: '35%',
        padding: 10,
        backgroundColor: colors.lightPurple,
        borderRadius: 10,
    },
    sentText: {
        color: colors.white
    },
    sentDateTime: {
        color: colors.white,
        fontSize: sizes.smallTextSize,
        marginStart: 'auto',
        marginTop: 5
    },
    appointmentView: {
        width: '60%',
        backgroundColor: colors.white,
        borderRadius: 10,
        overflow: 'hidden'
    },
    appointmentText: {
        color: colors.greyTextColor2,
        fontFamily: fontNames.boldFont,
        fontSize: 13,
        marginStart: 5
    },
    appointmentTitleText: {
        fontFamily: fontNames.boldFont,
        fontSize: sizes.xLargeTextSize
    },
    appointmentContentText: {
        fontSize: sizes.smallTextSize,
        marginTop: 2
    },
    boldText: {
        fontFamily: fontNames.boldFont
    },
    topMargin: {
        marginTop: 2
    },
    bottomView: {
        width: '100%',
        backgroundColor: colors.white,
        paddingVertical: 20
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
    alternateText: {
        fontSize: sizes.smallTextSize
    }
});
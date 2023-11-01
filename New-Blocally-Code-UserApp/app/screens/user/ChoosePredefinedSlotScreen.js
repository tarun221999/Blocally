import React, { Component } from 'react'
import { View, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import ImageComponent from '../../components/ImageComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    constants, categoryTypes, urls, fontNames, sizes, itemTypes, screenNames, scheduleTypes,
    favoriteType, favoriteRequests,
} from '../../config/constants'
import {
    parseLocalTimeWithoutUnit, parseLocalDate, parseDate, parseTime, parseTimeWithoutUnit, getExactTimeOffset,
    alertDialog, getLoggedInUser, combineDateTime, getUTCDateTimeFromLocalDateTime, checkIfDateIsInRange, getScreenDimensions,
    getExactTimeOffsetFromDate, parseLocalTime, adjustTimeForDaylight, checkIfDatesAreSameDay, getTimeOffset, 
    getStringDateFromLocalDateTime, checkIfTimesAreSame, parseLocalDateTime, checkIfTimeIsInRange,
    compareAppointmentDateTimes,
} from '../../utilities/HelperFunctions'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import moment from 'moment';

/**
 * Choose Predefined Slots Screen for Add Appointment
 */
export default class ChoosePredefinedSlotScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            showModalLoader: false,
            slotsArray: [],
        }

        this.today = new Date()

        this.currentDate = this.props.navigation.state.params.CURRENT_DATE
        this.allAvailableSlots = this.props.navigation.state.params.ALL_AVAILABLE_SLOTS
        this.allBlockedSlots = this.props.navigation.state.params.ALL_BLOCKED_SLOTS
        this.lunchStartTime = this.props.navigation.state.params.LUNCH_START_TIME
        this.lunchEndTime = this.props.navigation.state.params.LUNCH_END_TIME
        this.callback = this.props.navigation.state.params.CALLBACK

        this.screenDimensions = getScreenDimensions()
        this.itemWidth = (this.screenDimensions.width / 2) - 20
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={parseLocalDate(this.currentDate)}
                    navigation={this.props.navigation}
                />
                <View style={commonStyles.container}>
                    <TextComponent style={{
                        marginHorizontal: 10, marginVertical: 10, color: colors.red,
                        textAlign: 'center'
                    }}>
                        {strings.currently_only_times_are_displayed}
                    </TextComponent>
                    <FlatList
                        data={this.state.slotsArray}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                disabled={item.isBlocked}
                                onPress={() => {
                                    let startOffset = getExactTimeOffsetFromDate(item.startDateTime)
                                    let endOffset = getExactTimeOffsetFromDate(item.endDateTime)
                                    
                                    item.startDateTime = moment(item.startDateTime).add(startOffset, 'm').toDate();
                                    item.endDateTime = moment(item.endDateTime).add(endOffset, 'm').toDate();

                                    this.callback(item.startDateTime, item.endDateTime, true)
                                    this.props.navigation.goBack(null)
                                }}
                                style={[
                                    commonStyles.centerInContainer, styles.slot,
                                    item.isBlocked ? styles.slotNotAvailable : styles.slotAvailable, {
                                        width: this.itemWidth
                                    }]}>
                                <TextComponent style={styles.text}>
                                    {parseLocalTimeWithoutUnit(item.startDateTime) +
                                        " " + strings.to + " " + parseLocalTime(item.endDateTime)}
                                </TextComponent>
                            </TouchableOpacity>
                        )}
                        numColumns={2}
                        keyExtractor={(item, index) => index + ""}
                    />

                    <View style={{ marginBottom: 10 }}>
                        <View style={[commonStyles.rowContainer, commonStyles.centerInContainer,
                        { marginLeft: 10, marginRight: 10, marginTop: 10 }]}>
                            <View style={{ width: 15, height: 15, backgroundColor: colors.approvedStatusColor }} />
                            <TextComponent style={{ marginLeft: 5 }}>
                                {strings.request_possible}
                            </TextComponent>
                        </View>
                        <View style={[commonStyles.rowContainer, commonStyles.centerInContainer,
                        { marginLeft: 10, marginRight: 10, marginTop: 5 }]}>
                            <View style={{ width: 15, height: 15, backgroundColor: colors.rejectedStatusColor }} />
                            <TextComponent style={{ marginLeft: 5 }}>
                                {strings.closed_blocked_for_booking}
                            </TextComponent>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    componentDidMount() {
        this.prepareData()
    }

    prepareData = () => {
        let slotsArray = []

        let atleastOneAvailable = false

        for (let i = 0; i < this.allAvailableSlots.length; i++) {
            let currentStartDateTime = new Date(this.allAvailableSlots[i].startTime)
            let currentEndDateTime = new Date(this.allAvailableSlots[i].endTime)

            currentStartDateTime = adjustTimeForDaylight(currentStartDateTime)
            currentEndDateTime = adjustTimeForDaylight(currentEndDateTime)

            // change date to what was selected
            currentStartDateTime.setFullYear(this.currentDate.getFullYear());
            currentStartDateTime.setMonth(this.currentDate.getMonth());
            currentStartDateTime.setDate(this.currentDate.getDate());

            currentEndDateTime.setFullYear(this.currentDate.getFullYear());
            currentEndDateTime.setMonth(this.currentDate.getMonth());
            currentEndDateTime.setDate(this.currentDate.getDate());

            // check if endTime is less than start time, add 1 day to end date
            if (currentEndDateTime.getTime() < currentStartDateTime.getTime()) {
                currentEndDateTime.setDate(currentEndDateTime.getDate() + 1);
            }

            let isBlocked = false

            // check if is in past
            if (this.today.getTime() > currentStartDateTime.getTime()) {
                isBlocked = true
            }

            // check if lies in blocked slots
            for (let i = 0; i < this.allBlockedSlots.length; i++) {
                let holidayStartDateTime = new Date(this.allBlockedSlots[i].startDateTime)
                let holidayEndDateTime = new Date(this.allBlockedSlots[i].endDateTime)

                holidayStartDateTime = adjustTimeForDaylight(holidayStartDateTime)
                holidayEndDateTime = adjustTimeForDaylight(holidayEndDateTime)

                if (checkIfDateIsInRange(currentStartDateTime, holidayStartDateTime, holidayEndDateTime)) {
                    if (!checkIfTimesAreSame(currentStartDateTime, holidayEndDateTime)) {
                        isBlocked = true
                        break;
                    }
                } else if (checkIfDateIsInRange(currentEndDateTime, holidayStartDateTime, holidayEndDateTime)) {
                    if (!checkIfTimesAreSame(currentEndDateTime, holidayStartDateTime)) {
                        isBlocked = true
                        break;
                    }
                } else if (checkIfDateIsInRange(holidayStartDateTime, currentStartDateTime, currentEndDateTime)) {
                    if (!checkIfTimesAreSame(holidayStartDateTime, currentEndDateTime)) {
                        isBlocked = true
                        break;
                    }
                } else if (checkIfDateIsInRange(holidayEndDateTime, currentStartDateTime, currentEndDateTime)) {
                    if (!checkIfTimesAreSame(holidayEndDateTime, currentStartDateTime)) {
                        isBlocked = true
                        break;
                    }
                }
            }

            // check if lies in lunch hours
            if (this.lunchStartTime) {
                if (checkIfDateIsInRange(currentStartDateTime, this.lunchStartTime, this.lunchEndTime)) {
                    if (!checkIfTimesAreSame(currentStartDateTime, this.lunchEndTime)) {
                        isBlocked = true
                        break;
                    }
                } else if (checkIfDateIsInRange(currentEndDateTime, this.lunchStartTime, this.lunchEndTime)) {
                    if (!checkIfTimesAreSame(currentEndDateTime, this.lunchStartTime)) {
                        isBlocked = true
                        break;
                    }
                } else if (checkIfDateIsInRange(this.lunchStartTime, currentStartDateTime, currentEndDateTime)) {
                    if (!checkIfTimesAreSame(this.lunchStartTime, currentEndDateTime)) {
                        isBlocked = true
                        break;
                    }
                } else if (checkIfDateIsInRange(this.lunchEndTime, currentStartDateTime, currentEndDateTime)) {
                    if (!checkIfTimesAreSame(this.lunchEndTime, currentStartDateTime)) {
                        isBlocked = true
                        break;
                    }
                }
            }

            if (!isBlocked) {
                atleastOneAvailable = true
            }

            let slotObject = {
                startDateTime: currentStartDateTime,
                endDateTime: currentEndDateTime,
                isBlocked
            };
            slotsArray.push(slotObject)
        }

        slotsArray.sort(compareAppointmentDateTimes)

        this.setState({
            slotsArray,
        }, () => {
            if (!atleastOneAvailable) {
                alertDialog("", strings.no_time_left_to_choose)
            }
        })
    }
}

const styles = StyleSheet.create({
    slot: {
        height: 50,
        borderWidth: 1,
        marginHorizontal: 10,
        marginVertical: 10,
        borderRadius: 5,
        maxWidth: '50%'
    },
    slotAvailable: {
        backgroundColor: colors.approvedStatusColor,
        borderColor: colors.approvedStatusColor,
    },
    slotNotAvailable: {
        backgroundColor: colors.rejectedStatusColor,
        borderColor: colors.rejectedStatusColor,
    },
    text: {
        textAlign: 'center',
        color: colors.white
    }
});
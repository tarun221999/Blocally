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
    getExactTimeOffsetFromDate, parseTextForCard, getCurrencyFormat, checkIfDatesAreSameDay, getTimeOffset, getStringDateFromLocalDateTime, checkIfTimesAreSame, parseLocalDateTime, checkIfTimeIsInRange, adjustTimeForDaylight,
} from '../../utilities/HelperFunctions'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import moment from 'moment';

/**
 * Time Picker screen for Add Appointments
 */
export default class ChooseTimeScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModalLoader: false,
            slotsArray: [],
            firstIndex: -1,
            secondIndex: -1,
            showGuidePopup: false,
            dontShowAgain: false,
            productId: this.props.navigation.state.params.CHOSEN_PRODUCT_ID,
        }

        this.today = new Date()

        this.currentDate = this.props.navigation.state.params.CURRENT_DATE
        this.allAvailableSlots = this.props.navigation.state.params.ALL_AVAILABLE_SLOTS
        this.allBlockedSlots = this.props.navigation.state.params.ALL_BLOCKED_SLOTS
        this.lunchStartTime = this.props.navigation.state.params.LUNCH_START_TIME
        this.lunchEndTime = this.props.navigation.state.params.LUNCH_END_TIME
        this.callback = this.props.navigation.state.params.CALLBACK

        this.startDateTime = null
        this.endDateTime = null

        this.firstSelectedSlot = null
        this.secondSelectedSlot = null
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
                    textAction={strings.guide}
                    onTextActionPress={() => {
                        this.setState({
                            showGuidePopup: true
                        })
                    }} />

                {/* guide popup */}
                {this.state.showGuidePopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '90%', backgroundColor: colors.white, padding: 15, borderRadius: 10 }}>
                                <View style={{ marginBottom: 10, marginTop: 10 }}>
                                    <TextComponent
                                        style={{ alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                        {strings.guide_for_booking}
                                    </TextComponent>
                                    <TextComponent
                                        style={{ alignSelf: 'center', marginTop: 10 }}>
                                        {strings.if_you_are_flexible}
                                    </TextComponent>
                                    <TextComponent
                                        style={{ alignSelf: 'center', marginTop: 10 }}>
                                        {strings.for_example_if_you}
                                    </TextComponent>
                                    <TextComponent
                                        style={{ alignSelf: 'center', marginTop: 10 }}>
                                        {strings.if_your_appointment}
                                    </TextComponent>

                                    <TouchableOpacity
                                        style={[commonStyles.rowContainer, {
                                            marginTop: 10, padding: 5,
                                            marginLeft: 'auto'
                                        }]}
                                        onPress={() => {
                                            this.setState({
                                                dontShowAgain: !this.state.dontShowAgain
                                            })
                                        }}>
                                        <ImageComponent
                                            source={this.state.dontShowAgain ?
                                                require('../../assets/checkbox.png')
                                                : require('../../assets/checkboxEmpty.png')} />
                                        <TextComponent style={{ marginLeft: 5 }}>
                                            {strings.dont_show_me_again}
                                        </TextComponent>
                                    </TouchableOpacity>
                                </View>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={[commonStyles.loginPopupButton, { marginTop: 10 }]}
                                    onPress={() => {
                                        this.setState({
                                            showGuidePopup: false
                                        }, () => {
                                            if (this.state.dontShowAgain) {
                                                AsyncStorageHelper.saveStringAsync(constants.SHOULD_SHOW_TIME_POPUP, "false")
                                            } else {
                                                AsyncStorageHelper.saveStringAsync(constants.SHOULD_SHOW_TIME_POPUP, "true")
                                            }
                                        })
                                    }}>
                                    {strings.done}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                <View style={commonStyles.container}>
                    {this.state.productId &&
                        <TextComponent style={{
                            marginHorizontal: 10, marginVertical: 10, color: colors.red,
                            textAlign: 'center'
                        }}>
                            {strings.currently_only_times_are_displayed}
                        </TextComponent>
                    }
                    <FlatList
                        data={this.state.slotsArray}
                        contentContainerStyle={{ flexGrow: 1 }}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    // check if lies in blocked slots
                                    if (!item.isBlocked) {
                                        if (this.secondSelectedSlot) {
                                            this.firstSelectedSlot = null
                                            this.secondSelectedSlot = null
                                            this.setState({
                                                firstIndex: -1,
                                                secondIndex: -1
                                            })
                                        }
                                        if (!this.firstSelectedSlot) {
                                            this.firstSelectedSlot = item
                                            this.setState({
                                                firstIndex: index
                                            })
                                        } else {
                                            if (index > this.state.firstIndex) {
                                                this.secondSelectedSlot = item
                                                this.setState({
                                                    secondIndex: index
                                                })
                                            }
                                        }
                                    }
                                }}>
                                <View>
                                    <View style={[commonStyles.rowContainer]}>
                                        <TextComponent style={styles.slotTime}>
                                            {item.timeToShow}
                                        </TextComponent>
                                        <View style={
                                            [item.isBlocked ? styles.slotNotAvailable : styles.slot,
                                            index === this.state.firstIndex ? styles.slotHighlighted :
                                                this.state.secondIndex != -1 ?
                                                    (index > this.state.firstIndex && index <= this.state.secondIndex)
                                                        ? styles.slotHighlighted
                                                        : null
                                                    : null
                                            ]} />
                                    </View>
                                    <View style={styles.slotDivider} />
                                </View>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index + ""}
                        ListEmptyComponent={
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ fontSize: sizes.largeTextSize }}>
                                    {strings.no_time_left_to_choose}
                                </TextComponent>
                            </View>
                        }
                    />

                    <View style={{}}>
                        <View style={[commonStyles.rowContainer, commonStyles.centerInContainer,
                        { marginLeft: 10, marginRight: 10, marginTop: 10 }]}>
                            <View style={{ width: 15, height: 15, backgroundColor: colors.greenForTimePicker }} />
                            <TextComponent style={{ marginLeft: 5 }}>
                                {strings.request_possible}
                            </TextComponent>
                        </View>
                        <View style={[commonStyles.rowContainer, commonStyles.centerInContainer,
                        { marginLeft: 10, marginRight: 10, marginTop: 5 }]}>
                            <View style={{ width: 15, height: 15, backgroundColor: colors.redForTimePicker }} />
                            <TextComponent style={{ marginLeft: 5 }}>
                                {strings.closed_blocked_for_booking}
                            </TextComponent>
                        </View>
                        <View style={[commonStyles.rowContainer, { justifyContent: 'center' }]}>
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButtonLight}
                                onPress={() => {
                                    this.firstSelectedSlot = null
                                    this.secondSelectedSlot = null
                                    this.setState({
                                        firstIndex: -1,
                                        secondIndex: -1
                                    })
                                }}
                                style={styles.doneButton}>
                                {strings.reset}
                            </ButtonComponent>
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButton}
                                onPress={() => {
                                    if (this.firstSelectedSlot && this.secondSelectedSlot) {
                                        let firstOffset = getExactTimeOffsetFromDate(this.firstSelectedSlot.dateTimeObject)
                                        let secondOffset = getExactTimeOffsetFromDate(this.secondSelectedSlot.dateTimeObject)
                                        this.firstSelectedSlot.dateTimeObject = moment(this.firstSelectedSlot.dateTimeObject).add(firstOffset, 'm').toDate();
                                        this.secondSelectedSlot.dateTimeObject = moment(this.secondSelectedSlot.dateTimeObject).add(secondOffset, 'm').toDate();

                                        this.callback(this.firstSelectedSlot.dateTimeObject,
                                            this.secondSelectedSlot ? this.secondSelectedSlot.dateTimeObject : null)
                                        this.props.navigation.goBack(null)
                                    } else {
                                        alertDialog("", strings.choose_both_start_end)
                                    }
                                }}
                                style={styles.doneButton}>
                                {strings.done}
                            </ButtonComponent>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    componentDidMount() {
        this.findStartAndEndTime()
        this.shouldShowPopup()
    }

    findStartAndEndTime = () => {
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

            if (i === 0) {
                this.startDateTime = new Date(this.allAvailableSlots[i].startTime)
                this.endDateTime = new Date(this.allAvailableSlots[i].endTime)

                this.startDateTime = adjustTimeForDaylight(this.startDateTime)
                this.endDateTime = adjustTimeForDaylight(this.endDateTime)

                this.startDateTime.setFullYear(this.currentDate.getFullYear());
                this.startDateTime.setMonth(this.currentDate.getMonth());
                this.startDateTime.setDate(this.currentDate.getDate());

                this.endDateTime.setFullYear(this.currentDate.getFullYear());
                this.endDateTime.setMonth(this.currentDate.getMonth());
                this.endDateTime.setDate(this.currentDate.getDate());

                // check if endTime is less than start time, add 1 day to end date
                if (this.endDateTime.getTime() < this.startDateTime.getTime()) {
                    this.endDateTime.setDate(this.endDateTime.getDate() + 1);
                }
            } else {
                if (this.startDateTime > currentStartDateTime) {
                    this.startDateTime = new Date(currentStartDateTime)
                }
                if (this.endDateTime < currentEndDateTime) {
                    this.endDateTime = new Date(currentEndDateTime)
                }
            }
        }
        
        this.prepareData()
    }

    prepareData = () => {
        let slotsArray = []

        let startFrom = null
        if (this.today.getTime() > this.startDateTime.getTime()) {
            let coeff = 1000 * 60 * 5;
            startFrom = new Date(Math.ceil(this.today.getTime() / coeff) * coeff)
        } else {
            startFrom = this.startDateTime
        }

        for (let d = new Date(startFrom); d < this.endDateTime; d = moment(d).add(constants.INTERVAL_FOR_APPOINTMENTS, 'm').toDate()) {
            let isBlocked = false
            // check if lies in blocked slots
            for (let i = 0; i < this.allBlockedSlots.length; i++) {
                let holidayStartDateTime = new Date(this.allBlockedSlots[i].startDateTime)
                let holidayEndDateTime = new Date(this.allBlockedSlots[i].endDateTime)

                holidayStartDateTime = adjustTimeForDaylight(holidayStartDateTime)
                holidayEndDateTime = adjustTimeForDaylight(holidayEndDateTime)

                if (checkIfDateIsInRange(d, holidayStartDateTime, holidayEndDateTime)) {
                    if (!checkIfTimesAreSame(d, holidayEndDateTime)) {
                        isBlocked = true
                        break;
                    }
                }
            }
            // if lies in lunch hours
            if (this.lunchStartTime) {
                if (checkIfTimeIsInRange(d, this.lunchStartTime, this.lunchEndTime)) {
                    isBlocked = true
                }
            }

            // check if this date time is selected in any one of selected slots
            let isInRange = false;
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

                if (checkIfDateIsInRange(d, currentStartDateTime, currentEndDateTime)) {
                    if (!checkIfTimesAreSame(d, currentEndDateTime)) {
                        isInRange = true;
                        break;
                    }
                }
            }
            if (!isInRange) {
                isBlocked = true
            }

            let timeToShow = parseLocalTimeWithoutUnit(d)
            let slotObject = {
                timeToShow,
                dateTimeObject: new Date(d),
                isBlocked
            };
            slotsArray.push(slotObject)
        }

        if (slotsArray.length == 1) {
            slotsArray[0].isBlocked = true
        }

        this.setState({
            slotsArray,
        })
    }

    shouldShowPopup = () => {
        AsyncStorageHelper.getStringAsync(constants.SHOULD_SHOW_TIME_POPUP)
            .then((shouldShowPopup) => {
                if (!shouldShowPopup) {
                    this.setState({
                        showGuidePopup: true,
                        dontShowAgain: false
                    })
                } else if (shouldShowPopup === "true") {
                    this.setState({
                        showGuidePopup: true,
                        dontShowAgain: false
                    })
                } else {
                    this.setState({
                        dontShowAgain: true
                    })
                }
            });
    }
}

const styles = StyleSheet.create({
    slotTime: {
        alignSelf: 'baseline',
        width: '20%',
        textAlign: 'center',
        fontFamily: fontNames.boldFont
    },
    slot: {
        height: 50,
        width: '80%',
        backgroundColor: colors.greenForTimePicker
    },
    slotNotAvailable: {
        height: 50,
        width: '80%',
        backgroundColor: colors.redForTimePicker
    },
    slotHighlighted: {
        backgroundColor: colors.purpleForTimePicker
    },
    slotDivider: {
        width: '100%',
        height: 1,
        backgroundColor: colors.black
    },
    doneButton: {
        width: '40%',
        marginVertical: 10,
        marginHorizontal: 5
    }
});
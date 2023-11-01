import React, { Component } from 'react'
import {
    View, KeyboardAvoidingView, Platform, StyleSheet, FlatList, TouchableOpacity, ScrollView,
    Modal, Keyboard, Linking,
} from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import LoaderComponent from '../../components/LoaderComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import TextInputComponent from '../../components/TextInputComponent'
import ImageComponent from '../../components/ImageComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    getScreenDimensions, getCommonParamsForAPI, parseDate, parseDateTime, parseTime, alertDialog,
    parseTimeWithoutUnit, getOnlyDate, getOnlyMonth, parseTextForCard, openNumberInDialer, compareMessages,
    handleErrorResponse, getTimeOffset, getUnreadCounts, startStackFrom, clearAndMoveToLogin,
} from '../../utilities/HelperFunctions'
import {
    itemTypes, constants, sizes, urls, fontNames, appointmentRequestStatus, screenNames,
    appointmentSortType, statsTypes
} from '../../config/constants'
import { hitApi } from '../../api/APICallMessenger'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'

/**
 * Message Screen
 */
export default class MessageScreen extends Component {
    constructor(props) {
        super(props);
        this.productId = this.props.navigation.state.params.PRODUCT_ID
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
            isBookingsActive: false,
        }

        this.shouldHitTimer = true
        this.shouldAllowPullToRefresh = false
        this.shouldSendMessage = true
        this.messageInterval = null

        this.requestFailedCounter = 0
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={this.product.businessName}
                    navigation={this.props.navigation} />
                {this.state.isBookingsActive ?
                        <View style={[commonStyles.rowContainer, commonStyles.centerInContainer, { backgroundColor: colors.lightGreyColor, }]}>
                            <TextComponent style={{ padding: 10, }}>
                                {strings.for_bookings_use_button}
                            </TextComponent>
                            <TouchableOpacity
                                onPress={() => this.props.navigation.navigate(screenNames.ADD_APPOINTMENT_SCREEN, {
                                    BUSINESS_ID: this.businessId,
                                    MESSAGE_ID: this.product.messageId,
                                    PRODUCT_ID: this.productId,
                                    PRODUCT_TYPE: this.product.productType ? this.product.productType : null,
                                })}>
                                <ImageComponent
                                    source={require('../../assets/bookGrey.png')} />
                            </TouchableOpacity>
                        </View>
                        : <View />
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
                                        this.setState({ showAppointmentDetailPopup: false })
                                    }}>
                                    <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                </TouchableOpacity>
                                <View style={[commonStyles.rowContainer, { backgroundColor: colors.white, paddingHorizontal: 15 }]}>
                                    <View style={[{
                                        backgroundColor: colors.appointmentColorOne, width: 100, height: 100,
                                        alignItems: 'center'
                                    }]}>
                                        <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize, marginTop: 10 }}>
                                            {this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.APPROVED ?
                                                getOnlyDate(this.state.currentAppointment.appointmentDateTime)
                                                :
                                                this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.CANCELLED ?
                                                    this.state.currentAppointment.appointmentDateTime ?
                                                        getOnlyDate(this.state.currentAppointment.appointmentDateTime)
                                                        : getOnlyDate(this.state.currentAppointment.appointmentStartDateTime)
                                                    : getOnlyDate(this.state.currentAppointment.appointmentStartDateTime)
                                            }
                                        </TextComponent>
                                        <TextComponent style={{ color: colors.white, fontSize: sizes.headerTextSize }}>
                                            {this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.APPROVED ?
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
                                                            parseTime(this.state.currentAppointment.appointmentDateTime)
                                                            : this.state.currentAppointment.appointmentEndDateTime ?
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
                                        <View style={commonStyles.rowContainer}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                                        BUSINESS_ID: this.state.currentAppointment.businessId
                                                    })
                                                }}>
                                                <TextComponent style={{
                                                    fontSize: sizes.xLargeTextSize, color: colors.primaryColor,
                                                }}>
                                                    {parseTextForCard(this.state.currentAppointment.businessName, 16)}
                                                </TextComponent>
                                            </TouchableOpacity>
                                            {this.state.currentAppointment.productType === itemTypes.HOT_DEAL &&
                                                <ImageComponent
                                                    style={{ position: 'absolute', right: 0 }}
                                                    source={require('../../assets/hotDealRound.png')} />
                                            }
                                        </View>
                                        {this.state.currentAppointment.productTitle &&
                                            <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont, marginTop: 3 }}>
                                                {parseTextForCard(this.state.currentAppointment.productTitle, 20)}
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
                                        {(this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.PENDING ||
                                            this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.ACTION_PERFORMED ||
                                            this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.REJECTED) ?
                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                <TextComponent style={[{ color: colors.primaryColor, alignSelf: 'baseline', }, styles.alternateText]}>
                                                    {strings.alternate_dates + ":"}
                                                </TextComponent>
                                                <View style={{ marginStart: 5 }}>
                                                {this.state.currentAppointment.alternateStartDateTime1 &&
                                                    <TextComponent style={styles.alternateText}>
                                                        {getOnlyDate(this.state.currentAppointment.alternateStartDateTime1) + " "
                                                            + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime1)
                                                            + " " + (this.state.currentAppointment.alternateEndDateTime1 ?
                                                                parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime1)
                                                                + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime1)
                                                                : parseTime(this.state.currentAppointment.alternateStartDateTime1))}
                                                    </TextComponent>}
                                                    {this.state.currentAppointment.alternateStartDateTime2 &&
                                                        <TextComponent style={styles.alternateText}>
                                                            {getOnlyDate(this.state.currentAppointment.alternateStartDateTime2) + " "
                                                                + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime2)
                                                                + " " + (this.state.currentAppointment.alternateEndDateTime2 ?
                                                                    parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime2)
                                                                    + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime2)
                                                                    : parseTime(this.state.currentAppointment.alternateStartDateTime2))}
                                                        </TextComponent>}
                                                </View>
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
                                                    <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                        <TextComponent style={[{ color: colors.primaryColor, alignSelf: 'baseline', }, styles.alternateText]}>
                                                            {strings.alternate_dates + ":"}
                                                        </TextComponent>
                                                        <View style={{ marginStart: 5 }}>
                                                        {this.state.currentAppointment.alternateStartDateTime1 &&
                                                            <TextComponent style={styles.alternateText}>
                                                                {getOnlyDate(this.state.currentAppointment.alternateStartDateTime1) + " "
                                                                    + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime1)
                                                                    + " " + (this.state.currentAppointment.alternateEndDateTime1 ?
                                                                        parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime1)
                                                                        + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime1)
                                                                        : parseTime(this.state.currentAppointment.alternateStartDateTime1))}
                                                            </TextComponent>}
                                                            {this.state.currentAppointment.alternateStartDateTime2 &&
                                                                <TextComponent style={styles.alternateText}>
                                                                    {getOnlyDate(this.state.currentAppointment.alternateStartDateTime2) + " "
                                                                        + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime2)
                                                                        + " " + (this.state.currentAppointment.alternateEndDateTime2 ?
                                                                            parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime2)
                                                                            + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime2)
                                                                            : parseTime(this.state.currentAppointment.alternateStartDateTime2))}
                                                                </TextComponent>}
                                                        </View>
                                                    </View>
                                                :
                                                /* if not cancelled, then don't show */
                                                <View />
                                        }

                                        <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                            {this.state.currentAppointment.appointmentNote}
                                        </TextComponent>

                                        {this.state.currentAppointment.appointmentStatusId === appointmentRequestStatus.CANCELLED ?
                                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 3 }}>
                                                {this.state.currentAppointment.cancelledByUser ? strings.cancelled_by_you : strings.cancelled_by_ent}
                                            </TextComponent>
                                            : <View />
                                        }
                                    </View>
                                </View>
                                <ImageComponent
                                    style={{ alignSelf: 'center' }}
                                    source={this.state.currentAppointment.appointmentStatusId === appointmentRequestStatus.CANCELLED ?
                                        require('../../assets/cancelled.png')
                                        :
                                        this.state.currentAppointment.appointmentStatusId === appointmentRequestStatus.REJECTED ?
                                            require('../../assets/rejected.png')
                                            : ""} />
                                <View style={[commonStyles.rowContainer, { marginTop: 20 }]}>
                                    {(this.state.currentAppointment.appointmentTypeId == appointmentSortType.PENDING ||
                                        this.state.currentAppointment.appointmentTypeId == appointmentSortType.UPCOMING) &&
                                        <TouchableOpacity
                                            style={{ flex: 1, paddingVertical: 10, backgroundColor: colors.purpleButtonDark, alignItems: 'center' }}
                                            onPress={() => {
                                                this.setState({
                                                    showAppointmentDetailPopup: false
                                                }, () => {
                                                    this.cancelAppointment(this.state.currentAppointment.appointmentId)
                                                })
                                            }}>
                                            <ImageComponent
                                                source={require('../../assets/cancelAppointmentBig.png')} />
                                        </TouchableOpacity>
                                    }

                                    {this.state.currentAppointment.productId ?
                                        this.state.currentAppointment.productEnableCalling &&
                                        <TouchableOpacity
                                            style={{ flex: 1, paddingVertical: 10, backgroundColor: colors.purpleButtonLight, alignItems: 'center' }}
                                            onPress={() => {
                                                this.setState({
                                                    showAppointmentDetailPopup: false
                                                }, () => {
                                                    this.hitAddStats(statsTypes.CLICK_ON_CALL, this.state.currentAppointment.businessId, this.state.currentAppointment.productId, this.state.currentAppointment.businessPhoneNumber)
                                                })
                                            }}>
                                            <ImageComponent
                                                source={require('../../assets/callWhiteBig.png')} />
                                        </TouchableOpacity>
                                        :
                                        this.state.currentAppointment.isCallActive &&
                                        <TouchableOpacity
                                            style={{ flex: 1, paddingVertical: 10, backgroundColor: colors.purpleButtonLight, alignItems: 'center' }}
                                            onPress={() => {
                                                this.setState({
                                                    showAppointmentDetailPopup: false
                                                }, () => {
                                                    this.hitAddStats(statsTypes.CLICK_ON_CALL, this.state.currentAppointment.businessId, this.state.currentAppointment.productId, this.state.currentAppointment.businessPhoneNumber)
                                                })
                                            }}>
                                            <ImageComponent
                                                source={require('../../assets/callWhiteBig.png')} />
                                        </TouchableOpacity>
                                    }
                                </View>
                            </View>
                        </View>
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
                                            businessName: item.businessName,
                                            productType: item.productType,
                                            productEnableMessage: item.productEnableMessage,
                                            isMessageActive: item.isMessageActive,
                                            productEnableCalling: item.productEnableCalling,
                                            businessPhoneNumber: item.businessPhoneNumber,
                                            isCallActive: item.isCallActive,
                                            appointmentStatusId: item.appointmentStatusId,
                                            appointmentTypeId: item.appointmentTypeId,
                                            cancelledByUser: item.cancelledByUser,
                                            appointmentDateTime: item.appointmentDateTime,
                                        }
                                        this.setState({
                                            currentAppointment,
                                            showAppointmentDetailPopup: true
                                        })
                                    }}>
                                    <View style={[styles.appointmentView, {
                                        marginTop: 10,
                                        marginBottom: index === this.state.messagesArray.length - 1 ? 20 : 10,
                                        marginStart: item.isMessageSent ? '35%' : this.startMargin
                                    }]}>
                                        <View style={[{ backgroundColor: colors.lightGreyColor }]}>
                                            <View style={[commonStyles.rowContainer, { alignItems: 'center' }]}>
                                                <ImageComponent
                                                    style={{ marginStart: 10 }}
                                                    source={require('../../assets/calendarBlack.png')} />
                                                <TextComponent
                                                    style={styles.appointmentText}>
                                                    {strings.appointment}
                                                </TextComponent>
                                                {item.productType === itemTypes.HOT_DEAL &&
                                                    <ImageComponent
                                                        style={styles.appointmentProductIcon}
                                                        source={require('../../assets/smallhotdealBadge.png')} />
                                                }
                                            </View>
                                            <View style={{ width: '100%', height: 1, backgroundColor: colors.greyLineColor }} />
                                            <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
                                                {item.productTitle &&
                                                    <TextComponent
                                                        style={styles.appointmentTitleText}>
                                                        {item.productTitle}
                                                    </TextComponent>
                                                }

                                                {/* Approved appointment date */}
                                                {((item.appointmentStatusId == appointmentRequestStatus.APPROVED
                                                    || item.appointmentStatusId == appointmentRequestStatus.CANCELLED)
                                                    && item.appointmentDateTime) &&
                                                    <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                        {strings.approved_date + " - "}

                                                        <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                            {parseDate(item.appointmentDateTime) + " " + parseTime(item.appointmentDateTime)}
                                                        </TextComponent>
                                                    </TextComponent>
                                                }

                                                {/* Desired Date */}
                                                {(item.appointmentStatusId == appointmentRequestStatus.PENDING ||
                                                    item.appointmentStatusId == appointmentRequestStatus.ACTION_PERFORMED ||
                                                    item.appointmentStatusId == appointmentRequestStatus.REJECTED) ?
                                                    <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
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
                                                            <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
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
                                                {(item.appointmentStatusId == appointmentRequestStatus.PENDING ||
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

                                                <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                    {strings.no_of_guests + " - "}
                                                    <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                        {item.personsCount}
                                                    </TextComponent>
                                                </TextComponent>
                                                {(item.productId && item.dealCount > 0) &&
                                                    <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                        {strings.no_of_deals + " - "}
                                                        <TextComponent style={[styles.appointmentContentText, styles.boldText]}>
                                                            {item.dealCount}
                                                        </TextComponent>
                                                    </TextComponent>
                                                }
                                                <TextComponent style={[styles.appointmentContentText, styles.appointmentContentMargin]}>
                                                    {parseTextForCard(item.appointmentNote, 35)}
                                                </TextComponent>

                                                <TextComponent style={styles.receivedDateTime}>
                                                    {parseTime(item.sentOn)}
                                                </TextComponent>
                                            </View>
                                        </View>
                                        <TextComponent style={{
                                            color: colors.white, padding: 5, textAlign: 'center',
                                            backgroundColor: item.appointmentStatusId == appointmentRequestStatus.APPROVED ? colors.approvedStatusColor :
                                                (item.appointmentStatusId == appointmentRequestStatus.REJECTED || item.appointmentStatusId == appointmentRequestStatus.CANCELLED)
                                                    ? colors.rejectedStatusColor : colors.pendingStatusColor,
                                        }}>
                                            {item.message}
                                        </TextComponent>
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
                        icon={require('../../assets/send.png')}
                        style={{ width: '20%', marginStart: 5 }}
                        iconStyle={{ marginEnd: 0 }}
                        onPress={this.onSendMessagePress} />
                </View>
            </KeyboardAvoidingView>
        );
    }

    componentDidMount() {
        constants.IS_CHAT_SCREEN = true;
        constants.CURRENT_CHAT_ENT_ID = this.businessId;
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
        this.getBookingStatus();
        this.fetchOldMessages(this.showModalLoader);
    }

    componentWillUnmount() {
        constants.IS_CHAT_SCREEN = false;
        constants.CURRENT_CHAT_ENT_ID = -1;
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

    // listener for send message click
    onSendMessagePress = () => {
        this.setState({
            messageToBeSent: this.state.messageToBeSent.trim()
        })
        if (this.state.messageToBeSent.length > 0) {
            this.sendMessage()
        }
    }

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

    getBookingStatus = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                businessId: this.businessId
            }

            hitApi(urls.CHECK_BOOKING_ACTIVE, urls.POST, params, null, (jsonResponse) => {
                this.setState({
                    isBookingsActive: jsonResponse.response.isBookingsActive
                })
            })
        })
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
                        getUnreadCounts(this.props.navigation)
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
                        getUnreadCounts(this.props.navigation)
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
                        } else if (jsonResponse.resCode && jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                            if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                                clearAndMoveToLogin(this.props.navigation, screenNames.LOGIN_SCREEN)
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

    getChatIdOfLastSentMessage = () => {
        let messageChatId = null
        for (let i = this.state.messagesArray.length - 1; i >= 0; i--) {
            let message = this.state.messagesArray[i]
            if (message.isMessageSent) {
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
                            } else if (jsonResponse.resCode && jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                                if (jsonResponse.resCode == constants.INVALID_AUTH_TOKEN_CODE) {
                                    clearAndMoveToLogin(this.props.navigation, screenNames.LOGIN_SCREEN)
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
                    if (this.state.messagesArray.length > 0) {
                        this.setState({
                            messageToBeSent: ""
                        }, () => {
                            this.shouldSendMessage = true

                            let temp = this.state.messagesArray
                            let messagesToAdd = this.getMessagesToAdd(jsonResponse.response.data)
                            temp.push(...messagesToAdd)

                            // sort here
                            temp.sort(compareMessages)

                            this.setState({
                                messagesArray: temp
                            }, () => {
                                this.scrollFlatListToEnd(200)
                            })
                        })
                    } else {
                        let tempArray = this.state.messagesArray
                        tempArray.push(...jsonResponse.response.data)

                        this.setState({
                            messagesArray: tempArray,
                            messageToBeSent: ""
                        }, () => {
                            this.scrollFlatListToEnd(200)
                            this.product.messageId = jsonResponse.response.data[0].messageId

                            this.shouldSendMessage = true
                        })
                    }
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

    hitAddStats = (statType, businessId, productId, businessPhoneNumber) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                statsType: statType,
                productId: productId,
                businessId: businessId,
            }

            hitApi(urls.ADD_STATS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (statType === statsTypes.CLICK_ON_CALL) {
                    this.openCaller(businessPhoneNumber)
                }
            }, (jsonResponse) => {
                if (statType === statsTypes.CLICK_ON_CALL) {
                    this.openCaller(businessPhoneNumber)
                }
            })
        })
    }

    openCaller = (businessPhoneNumber) => {
        openNumberInDialer(businessPhoneNumber)
    }

    cancelAppointment = (appointmentId) => {
        alertDialog("", strings.confirm_cancel_appointment, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    appointmentId
                }

                hitApi(urls.CANCEL_APPOINTMENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    // do nothing
                })
            })
        })
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }

    scrollFlatListToEnd = (timeout) => {
        setTimeout(() => {
            console.log(this.state.messagesArray.length == 0)
            if(this.state.messagesArray.length !== 0){
                if (this.messagesFlatList) {
                    this.messagesFlatList.scrollToEnd()
                }
            }
            else {
                console.log("ref Error")
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
        fontSize: sizes.mediumTextSize
    },
    appointmentContentText: {
        fontSize: sizes.smallTextSize,
    },
    appointmentContentMargin: {
        marginTop: 3,
    },
    appointmentProductIcon: {
        marginStart: 'auto',
    },
    boldText: {
        fontFamily: fontNames.boldFont
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
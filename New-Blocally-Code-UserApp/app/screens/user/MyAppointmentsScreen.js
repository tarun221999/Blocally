import React, { Component } from 'react'
import {
    View, StyleSheet, FlatList, Linking, TouchableOpacity, Modal, ScrollView,
} from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TextComponent from '../../components/TextComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ImageComponent from '../../components/ImageComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import {
    getScreenDimensions, getCommonParamsForAPI, getOnlyDate, getOnlyMonth, parseTime,
    parseTextForCard, parseTimeWithoutUnit, checkIfDatesAreSameDay, assignColors, alertDialog,
    openNumberInDialer, handleErrorResponse, getTimeOffset,
} from '../../utilities/HelperFunctions'
import colors from '../../config/colors'
import { hitApi } from '../../api/APICall'
import { fontNames, sizes, urls, constants, appointmentSortType, screenNames, statsTypes, itemTypes, appointmentRequestStatus } from '../../config/constants'
// import { IndicatorViewPager, PagerTitleIndicator } from 'react-native-best-viewpager'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import SmallButtonComponent from '../../components/SmallButtonComponent'

/**
 * My Appointments Screen
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
            currentAppointmentTypeId: null,
            tabs: {
                index: 0,
                routes: [
                    { key: 'first', title: strings.pending },
                    { key: 'second', title: strings.upcoming },
                    { key: 'third', title: strings.past },
                    { key: 'fourth', title: strings.rejected },
                ],
            }
        }

        this.shouldHitPagination = true
        this.apiCount = 0

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

        // this.indicatorViewPagerRef = null
        this.appointmentStatus = (this.props.navigation.state && this.props.navigation.state.params) ?
            this.props.navigation.state.params.APPOINTMENT_STATUS : null;
    }

    firstScene = () => {
        return (
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
                                            this.setState({
                                                currentAppointment: item,
                                                currentAppointmentTypeId: appointmentSortType.PENDING,
                                                showAppointmentDetailPopup: true
                                            })
                                        }}>
                                        <View style={[commonStyles.rowContainer, {
                                            padding: 15, width: this.cardWidth, backgroundColor: colors.white
                                        }]}>
                                            {(item.productType && item.productType === itemTypes.HOT_DEAL) &&
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={require('../../assets/hotDeal.png')} />
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
                                                <View style={commonStyles.rowContainer}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                                                BUSINESS_ID: item.businessId
                                                            })
                                                        }}>
                                                        <TextComponent style={styles.businessName}>
                                                            {parseTextForCard(item.businessName, 16)}
                                                        </TextComponent>
                                                    </TouchableOpacity>
                                                </View>
                                                {item.productTitle &&
                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont, marginTop: 3 }}>
                                                        {parseTextForCard(item.productTitle, 20)}
                                                    </TextComponent>
                                                }
                                                <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
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
                                                                {getOnlyDate(item.alternateStartDateTime1) + " "
                                                                    + getOnlyMonth(item.alternateStartDateTime1)
                                                                    + " " + (item.alternateEndDateTime1 ?
                                                                        parseTimeWithoutUnit(item.alternateStartDateTime1)
                                                                        + " - " + parseTime(item.alternateEndDateTime1)
                                                                        : parseTime(item.alternateStartDateTime1))}
                                                            </TextComponent>
                                                            {item.alternateStartDateTime2 &&
                                                                <TextComponent style={styles.alternateText}>
                                                                    {getOnlyDate(item.alternateStartDateTime2) + " "
                                                                        + getOnlyMonth(item.alternateStartDateTime2)
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
                                                    <SmallButtonComponent
                                                        icon={require('../../assets/appointmentWhite.png')}
                                                        onPress={() => this.cancelAppointment(item.appointmentId)}>
                                                        {strings.cancel}
                                                    </SmallButtonComponent>

                                                    {item.isMessageActive ?
                                                        <TouchableOpacity
                                                            style={{ paddingVertical: 5 }}
                                                            onPress={() => {
                                                                let product = {}
                                                                product.businessName = item.businessName
                                                                product.messageId = item.messageId
                                                                this.props.navigation.navigate(screenNames.MESSAGE_SCREEN, {
                                                                    PRODUCT_ID: item.productId,
                                                                    PRODUCT: product,
                                                                    BUSINESS_ID: item.businessId
                                                                })
                                                            }}>
                                                            <ImageComponent
                                                                style={{ marginStart: 10 }}
                                                                source={require('../../assets/chat.png')} />
                                                        </TouchableOpacity>
                                                        : <View />
                                                    }

                                                    {item.isCallActive ?
                                                        <TouchableOpacity
                                                            style={{ paddingVertical: 5 }}
                                                            onPress={() =>
                                                                this.hitAddStats(statsTypes.CLICK_ON_CALL, item.businessId, item.productId, item.businessPhoneNumber)
                                                            }>
                                                            <ImageComponent
                                                                style={{ marginStart: 10, }}
                                                                source={require('../../assets/callPurple.png')} />
                                                        </TouchableOpacity>
                                                        : <View />
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
            </View>
        )
    }

    secondScene = () => {
        return (
            <View style={[commonStyles.container, commonStyles.centerInContainer,]}>
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
                                                currentAppointmentTypeId: appointmentSortType.UPCOMING,
                                                showAppointmentDetailPopup: true
                                            })
                                        }}>
                                        <View style={[commonStyles.rowContainer, {
                                            padding: 15, width: this.cardWidth, backgroundColor: colors.white
                                        }]}>
                                            {(item.productType && item.productType === itemTypes.HOT_DEAL) &&
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={require('../../assets/hotDeal.png')} />
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
                                                <View style={commonStyles.rowContainer}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                                                BUSINESS_ID: item.businessId
                                                            })
                                                        }}>
                                                        <TextComponent style={styles.businessName}>
                                                            {parseTextForCard(item.businessName, 16)}
                                                        </TextComponent>
                                                    </TouchableOpacity>
                                                </View>
                                                {item.productTitle &&
                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont, marginTop: 3 }}>
                                                        {parseTextForCard(item.productTitle, 20)}
                                                    </TextComponent>
                                                }
                                                <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
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
                                                        icon={require('../../assets/appointmentWhite.png')}
                                                        onPress={() => this.cancelAppointment(item.appointmentId)}>
                                                        {strings.cancel}
                                                    </SmallButtonComponent>
                                                    {item.isMessageActive ?
                                                        <TouchableOpacity
                                                            style={{ paddingVertical: 5 }}
                                                            onPress={() => {
                                                                let product = {}
                                                                product.businessName = item.businessName
                                                                product.messageId = item.messageId
                                                                this.props.navigation.navigate(screenNames.MESSAGE_SCREEN, {
                                                                    PRODUCT_ID: item.productId,
                                                                    PRODUCT: product,
                                                                    BUSINESS_ID: item.businessId
                                                                })
                                                            }}>
                                                            <ImageComponent
                                                                style={{ marginStart: 10 }}
                                                                source={require('../../assets/chat.png')} />
                                                        </TouchableOpacity>
                                                        : <View />
                                                    }

                                                    {item.isCallActive ?
                                                        <TouchableOpacity
                                                            style={{ paddingVertical: 5 }}
                                                            onPress={() =>
                                                                this.hitAddStats(statsTypes.CLICK_ON_CALL, item.businessId, item.productId, item.businessPhoneNumber)
                                                            }>
                                                            <ImageComponent
                                                                style={{ marginStart: 10, }}
                                                                source={require('../../assets/callPurple.png')} />
                                                        </TouchableOpacity>
                                                        : <View />
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
            </View>
        )
    }

    thirdScene = () => {
        return (
            <View style={commonStyles.container}>
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
                                                currentAppointmentTypeId: appointmentSortType.PAST,
                                                showAppointmentDetailPopup: true
                                            })
                                        }}>
                                        <View style={[commonStyles.rowContainer, {
                                            padding: 15, width: this.cardWidth, backgroundColor: colors.white
                                        }]}>
                                            {(item.productType && item.productType === itemTypes.HOT_DEAL) &&
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={require('../../assets/hotDeal.png')} />
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
                                                            (item.appointmentEndDateTime ?
                                                                parseTimeWithoutUnit(item.appointmentStartDateTime) + " - "
                                                                + parseTime(item.appointmentEndDateTime) :
                                                                parseTime(item.appointmentStartDateTime))}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={{ paddingStart: 10, width: '70%', }}>
                                                <View style={commonStyles.rowContainer}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                                                BUSINESS_ID: item.businessId
                                                            })
                                                        }}>
                                                        <TextComponent style={styles.businessName}>
                                                            {parseTextForCard(item.businessName, 16)}
                                                        </TextComponent>
                                                    </TouchableOpacity>
                                                </View>
                                                {item.productTitle &&
                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont, marginTop: 3 }}>
                                                        {parseTextForCard(item.productTitle, 20)}
                                                    </TextComponent>
                                                }
                                                <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
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
                                                                {getOnlyDate(item.alternateStartDateTime1) + " "
                                                                    + getOnlyMonth(item.alternateStartDateTime1)
                                                                    + " " + (item.alternateEndDateTime1 ?
                                                                        parseTimeWithoutUnit(item.alternateStartDateTime1)
                                                                        + " - " + parseTime(item.alternateEndDateTime1)
                                                                        : parseTime(item.alternateStartDateTime1))}
                                                            </TextComponent>
                                                            {item.alternateStartDateTime2 &&
                                                                <TextComponent style={styles.alternateText}>
                                                                    {getOnlyDate(item.alternateStartDateTime2) + " "
                                                                        + getOnlyMonth(item.alternateStartDateTime2)
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
                                                            source={require('../../assets/delete2.png')} />
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
            </View>
        )
    }

    fourthScene = () => {
        return (
            <View style={commonStyles.container}>
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
                                                currentAppointmentTypeId: appointmentSortType.REJECTED,
                                                showAppointmentDetailPopup: true
                                            })
                                        }}>
                                        <View style={[commonStyles.rowContainer, {
                                            padding: 15, width: this.cardWidth, backgroundColor: colors.white
                                        }]}>
                                            {(item.productType && item.productType === itemTypes.HOT_DEAL) &&
                                                <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={require('../../assets/hotDeal.png')} />
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
                                                                : parseTime(item.appointmentStartDateTime)
                                                        }
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={{ paddingStart: 10, width: '70%', }}>
                                                <View style={commonStyles.rowContainer}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                                                BUSINESS_ID: item.businessId
                                                            })
                                                        }}>
                                                        <TextComponent style={styles.businessName}>
                                                            {parseTextForCard(item.businessName, 16)}
                                                        </TextComponent>
                                                    </TouchableOpacity>
                                                </View>
                                                {item.productTitle &&
                                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, fontFamily: fontNames.boldFont, marginTop: 3 }}>
                                                        {parseTextForCard(item.productTitle, 20)}
                                                    </TextComponent>
                                                }
                                                <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
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
                                                                {getOnlyDate(item.alternateStartDateTime1) + " "
                                                                    + getOnlyMonth(item.alternateStartDateTime1)
                                                                    + " " + (item.alternateEndDateTime1 ?
                                                                        parseTimeWithoutUnit(item.alternateStartDateTime1)
                                                                        + " - " + parseTime(item.alternateEndDateTime1)
                                                                        : parseTime(item.alternateStartDateTime1))}
                                                            </TextComponent>
                                                            {item.alternateStartDateTime2 &&
                                                                <TextComponent style={styles.alternateText}>
                                                                    {getOnlyDate(item.alternateStartDateTime2) + " "
                                                                        + getOnlyMonth(item.alternateStartDateTime2)
                                                                        + " " + (item.alternateEndDateTime2 ?
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
                                                        {item.cancelledByUser ? strings.cancelled_by_you : strings.cancelled_by_ent}
                                                    </TextComponent>
                                                    : <View />
                                                }

                                                <View style={[commonStyles.rowContainer, { marginStart: 'auto', alignItems: 'center' }]}>
                                                    <ImageComponent
                                                        source={item.appointmentStatusId === appointmentRequestStatus.CANCELLED ?
                                                            require('../../assets/cancelled.png')
                                                            : require('../../assets/rejected.png')} />

                                                    <TouchableOpacity
                                                        style={{ paddingVertical: 5 }}
                                                        onPress={() =>
                                                            this.deleteAppointment(item.appointmentId)
                                                        }>
                                                        <ImageComponent
                                                            style={{ marginStart: 10, }}
                                                            source={require('../../assets/delete2.png')} />
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
        )
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.my_appointments}
                    navigation={this.props.navigation} />

                {/* appointment detail popup */}
                {this.state.showAppointmentDetailPopup && <Modal
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
                                    <View style={commonStyles.rowContainer}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({
                                                    showAppointmentDetailPopup: false
                                                }, () => {
                                                    this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                                        BUSINESS_ID: this.state.currentAppointment.businessId
                                                    })
                                                })
                                            }}>
                                            <TextComponent style={styles.businessName}>
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
                                    {((this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.PENDING ||
                                        this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.CANCELLED ||
                                        this.state.currentAppointment.appointmentStatusId == appointmentRequestStatus.REJECTED)
                                        && this.state.currentAppointment.alternateStartDateTime1) &&
                                        <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                            <TextComponent style={[{ color: colors.primaryColor, alignSelf: 'baseline', }, styles.alternateText]}>
                                                {strings.alternate_dates + ":"}
                                            </TextComponent>
                                            <View style={{ marginStart: 5 }}>
                                                <TextComponent style={styles.alternateText}>
                                                    {getOnlyDate(this.state.currentAppointment.alternateStartDateTime1) + " "
                                                        + getOnlyMonth(this.state.currentAppointment.alternateStartDateTime1)
                                                        + " " + (this.state.currentAppointment.alternateEndDateTime1 ?
                                                            parseTimeWithoutUnit(this.state.currentAppointment.alternateStartDateTime1)
                                                            + " - " + parseTime(this.state.currentAppointment.alternateEndDateTime1)
                                                            : parseTime(this.state.currentAppointment.alternateStartDateTime1))}
                                                </TextComponent>
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
                                {(this.state.currentAppointmentTypeId == appointmentSortType.PENDING ||
                                    this.state.currentAppointmentTypeId == appointmentSortType.UPCOMING) &&
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
                                {((this.state.currentAppointmentTypeId == appointmentSortType.PENDING ||
                                    this.state.currentAppointmentTypeId == appointmentSortType.UPCOMING) &&
                                    this.state.currentAppointment.isMessageActive
                                ) &&
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 10, backgroundColor: colors.purpleButton, alignItems: 'center' }}
                                        onPress={() => {
                                            this.setState({
                                                showAppointmentDetailPopup: false
                                            }, () => {
                                                let product = {}
                                                product.businessName = this.state.currentAppointment.businessName
                                                product.messageId = this.state.currentAppointment.messageId
                                                this.props.navigation.navigate(screenNames.MESSAGE_SCREEN, {
                                                    PRODUCT_ID: this.state.currentAppointment.productId,
                                                    PRODUCT: product,
                                                    BUSINESS_ID: this.state.currentAppointment.businessId
                                                })
                                            })
                                        }}>
                                        <ImageComponent
                                            source={require('../../assets/chatWhiteBig.png')} />
                                    </TouchableOpacity>
                                }

                                {((this.state.currentAppointmentTypeId == appointmentSortType.PENDING ||
                                    this.state.currentAppointmentTypeId == appointmentSortType.UPCOMING) &&
                                    this.state.currentAppointment.isCallActive) &&
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

                <View style={[commonStyles.container]}>
                    <TabView
                        // style={{ width: '100%', height: '100%', flexDirection: 'column-reverse', backgroundColor: colors.white }}
                        // indicator={
                        //     <PagerTitleIndicator
                        //         titles={[strings.pending, strings.upcoming, strings.past, strings.rejected]}
                        //         style={{ backgroundColor: colors.white }}
                        //         itemStyle={{ width: this.screenDimensions.width / 4 }}
                        //         selectedItemStyle={{ width: this.screenDimensions.width / 4 }}
                        //         itemTextStyle={styles.indicatorText}
                        //         selectedItemTextStyle={styles.indicatorSelectedText}
                        //         selectedBorderStyle={styles.indicatorBorder}
                        //     />
                        // }
                        // ref={(ref) => this.indicatorViewPagerRef = ref}

                        onIndexChange={index => this.setState({ index })}
                        navigationState={this.state.tabs}
                        renderTabBar={props => (
                            <TabBar
                                {...props}
                                scrollEnabled
                                activeColor={colors.primaryColor}
                                inactiveColor={colors.greyTextColor}
                                indicatorStyle={{ backgroundColor: colors.primaryColor }}
                                style={{ backgroundColor: colors.transparent }}
                                tabStyle={{
                                    width: 150
                                }}
                            />
                        )}
                        renderScene={({ route }) => {
                            switch (route.key) {
                                case 'first': return this.firstScene();
                                case 'second': return this.secondScene();
                                case 'third': return this.thirdScene();
                                case 'fourth': return this.fourthScene();
                            }
                        }}
                    />
                </View>
            </View>
        );
    }

    componentDidMount() {
        // if (this.appointmentStatus && this.appointmentStatus == appointmentRequestStatus.APPROVED) {
        //     this.indicatorViewPagerRef.setPage(1)
        // } else if (this.appointmentStatus && (this.appointmentStatus == appointmentRequestStatus.REJECTED
        //     || this.appointmentStatus == appointmentRequestStatus.CANCELLED)) {
        //     this.indicatorViewPagerRef.setPage(3)
        // }

        this.hitAllApis()
    }

    onPullToRefresh = () => {
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.hitAllApis()
        })
    }

    hitAllApis = () => {
        this.setState({
            upcomingAppointmentsArray: [],
            pastAppointmentsArray: [],
            pendingAppointmentsArray: [],
            rejectedAppointmentsArray: [],
            showNoUpcomingAppointments: false,
            showNoPastAppointments: false,
            showNoPendingAppointments: false,
            showNoRejectedAppointments: false,
            showModalLoader: true,
        }, () => {
            this.apiCount = 0

            this.upcomingAppointmentsPageIndex = 1
            this.upcomingAppointmentsPaginationRequired = true
            this.pastAppointmentsPageIndex = 1
            this.pastAppointmentsPaginationRequired = true
            this.pendingAppointmentsPageIndex = 1
            this.pendingAppointmentsPaginationRequired = true
            this.rejectedAppointmentsPageIndex = 1
            this.rejectedAppointmentsPaginationRequired = true

            this.fetchAppointments(appointmentSortType.PENDING)
            this.fetchAppointments(appointmentSortType.UPCOMING)
            this.fetchAppointments(appointmentSortType.PAST)
            this.fetchAppointments(appointmentSortType.REJECTED)
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

    // get appointments by type
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

    // api for stats
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

    // api to cancel appointment
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

    // api to delete appointment
    deleteAppointment = (id) => {
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

    openCaller = (businessPhoneNumber) => {
        openNumberInDialer(businessPhoneNumber)
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
        fontSize: sizes.xLargeTextSize,
        color: colors.blueTextColor,
    },
    alternateText: {
        fontSize: sizes.smallTextSize
    }
});
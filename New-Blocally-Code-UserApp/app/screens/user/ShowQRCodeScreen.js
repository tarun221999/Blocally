import React, { Component } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, StyleSheet, Modal } from 'react-native';
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import LoaderComponent from '../../components/LoaderComponent'
import TextComponent from '../../components/TextComponent'
import ButtonComponent from '../../components/ButtonComponent'
import ImageComponent from '../../components/ImageComponent'
import commonStyles from '../../styles/Styles'
import colors from '../../config/colors'
import strings from '../../config/strings'
import {
    sizes, urls, itemTypes, databaseConstants, dealStatuses, constants, fontNames,
    appointmentRequestStatus, checkinType,
} from '../../config/constants';
import QRCode from 'react-native-qrcode-svg';
import {
    getScreenDimensions, alertDialog, getCommonParamsForAPI, getCurrentUTCDateTime, getCurrentISODateTime, checkIfDateIsInRange,
    parseLocalDateTime, getISODateTimeFromLocalDateTime, getUTCDateTimeFromLocalDateTime, getCurrencyFormat, parseDate,
    parseTime, getLocalDateTimeFromLocalDateTime, getCurrentLocalDateTime, getExactTimeOffset, parseDateTime,
} from '../../utilities/HelperFunctions';
import { hitApi } from '../../api/APICall';
import NetInfo from "@react-native-community/netinfo";
import ProductMenuSchema from '../../database/ProductMenuSchema'
import ProductSchedulerSchema from '../../database/ProductSchedulerSchema'
import DealsSchema from '../../database/DealsSchema'
import Realm from 'realm'
import FastImage from 'react-native-fast-image'

/**
 * Show QR Code Screen
 */
export default class ShowQRCodeScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.qrCodeDimensions = this.screenDimensions.width * 0.6
        this.headerImageHeight = this.screenDimensions.width * constants.HEADER_IMAGE_HEIGHT_PERCENTAGE

        this.currentDeal = this.props.navigation.state.params.CURRENT_DEAL

        console.log("currentDeal----", this.currentDeal)
        this.state = {
            showModalLoader: false,
            expiresOn: "",
            isRedeemSuccess: false,
            redeemMessage: "",
            showRedeemDonePopup: false,
            checkinType: null
        }

        this.dealNextAvailableStartDateTime = null
        this.dealNextAvailableEndDateTime = null

        this.realm = null
        this.initRealm(false)
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />

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
                                            this.props.navigation.goBack(null);
                                        })
                                    }}>
                                    {strings.done}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                <ScrollView
                    style={commonStyles.container}
                    showsVerticalScrollIndicator={false}>

                    <View style={[commonStyles.headerBorder, commonStyles.centerInContainer, {
                        width: '100%', height: this.headerImageHeight, backgroundColor: colors.white
                    }]}>
                        <ImageComponent source={require('../../assets/placeholderLogo.png')} />
                        <FastImage
                            source={{
                                uri: this.currentDeal.imageLocalPath ?
                                    Platform.OS === constants.ANDROID ?
                                        'file://' + this.currentDeal.imageLocalPath
                                        : '' + this.currentDeal.imageLocalPath
                                    : this.currentDeal.dealImage ? this.currentDeal.dealImage : "",
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
                            source={this.currentDeal.productType === itemTypes.BONUS_DEAL ?
                                require('../../assets/bonusBadge.png')
                                : require('../../assets/hotDeal.png')} />
                    </View>

                    <View style={[{ marginTop: 20, marginHorizontal: 50 }]}>
                        <View style={[commonStyles.rowContainer, { alignItems: 'flex-start' }]}>
                            <TextComponent style={{ width: '75%', fontSize: sizes.largeTextSize }}>
                                {this.currentDeal.dealTitle}
                            </TextComponent>
                            <TextComponent style={{ marginStart: 'auto', color: colors.greenTextColor, fontSize: sizes.largeTextSize }}>
                                {this.currentDeal.dealOP ? getCurrencyFormat(this.currentDeal.dealOP) :
                                    (typeof this.currentDeal.dealOP == 'number') ? getCurrencyFormat(this.currentDeal.dealOP) : ""}
                            </TextComponent>
                        </View>

                        {(this.currentDeal && this.currentDeal.dealAddedOn) &&
                            <TextComponent style={{ fontSize: sizes.mediumTextSize, marginTop: 5 }}>
                                {strings.saved_on + " - "}
                                <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                    {parseDate(this.currentDeal.dealAddedOn)}
                                </TextComponent>
                            </TextComponent>
                        }

                        {(this.currentDeal.dealAppointmentId
                            && this.currentDeal.appointmentStatusId === appointmentRequestStatus.APPROVED) ?
                            <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                {strings.appointment_date + " - "}
                                <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                    {parseDate(this.currentDeal.appointmentDateTime) + " " + parseTime(this.currentDeal.appointmentDateTime)}
                                </TextComponent>
                            </TextComponent>
                            :
                            (this.currentDeal.dealAppointmentId
                                && this.currentDeal.appointmentStatusId === appointmentRequestStatus.PENDING) ?
                                <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                    {strings.appointment + " - "}
                                    <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize, color: colors.pendingStatusColor }}>
                                        {strings.pending}
                                    </TextComponent>
                                </TextComponent>
                                :
                                (this.currentDeal.dealAppointmentId
                                    && this.currentDeal.appointmentStatusId === appointmentRequestStatus.REJECTED)
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

                        {(this.currentDeal.dealStatusId && (this.currentDeal.dealStatusId === dealStatuses.SAVED
                            || this.currentDeal.dealStatusId === dealStatuses.REDEEMED
                            || this.currentDeal.dealStatusId === dealStatuses.EXPIRED)) &&
                            < TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                {this.currentDeal.dealStatusId === dealStatuses.SAVED ? strings.expiry_date + " - "
                                    : this.currentDeal.dealStatusId === dealStatuses.REDEEMED ? strings.redeemed_on + " - "
                                        : this.currentDeal.dealStatusId === dealStatuses.EXPIRED ? strings.expired_on + " - " : ""}
                                <TextComponent style={{ fontFamily: fontNames.boldFont, fontSize: sizes.mediumTextSize }}>
                                    {this.currentDeal.dealStatusId === dealStatuses.SAVED ? parseDate(this.currentDeal.dealRedemptionEndDate)
                                        : this.currentDeal.dealStatusId === dealStatuses.REDEEMED ? parseDate(this.currentDeal.dealRedeemedOn)
                                            : this.currentDeal.dealStatusId === dealStatuses.EXPIRED ? parseDate(this.currentDeal.dealExpiredOn) : ""}
                                </TextComponent>
                            </TextComponent>
                        }

                        {(this.currentDeal.dealStatusId && (this.currentDeal.dealStatusId !== dealStatuses.SAVED)) &&
                            <TextComponent style={{ marginTop: 5, fontSize: sizes.mediumTextSize }}>
                                {this.currentDeal.dealCount + " " + (this.currentDeal.dealCount === 1 ? strings.deal : strings.deals)}
                            </TextComponent>
                        }
                    </View>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={styles.dottedLine} />

                    <View style={{ width: '80%', alignItems: 'center', alignSelf: 'center' }}>
                        {this.state.checkinType &&
                            <TextComponent
                                style={{
                                    fontSize: sizes.headerTextSize, marginTop: 10, textAlign: 'center',
                                    marginBottom: 40, color: colors.red, fontStyle: 'italic'
                                }}>
                                {(this.state.checkinType == checkinType.BONUS ? strings.bonus_expires
                                    : this.state.checkinType == checkinType.BOOKED ? strings.booked_expires
                                        : strings.saved_expires)
                                    + ": " + this.state.expiresOn}
                            </TextComponent>
                        }

                        <QRCode
                            value={this.currentDeal.dealRedeemedCode}
                            size={this.qrCodeDimensions}
                        />
                        <TextComponent
                            style={{
                                fontSize: sizes.xLargeTextSize, marginHorizontal: 50, textAlign: 'center',
                                marginTop: 20
                            }}>
                            {this.currentDeal.dealRedeemedCode}
                        </TextComponent>

                        <ButtonComponent
                            style={{ marginTop: 40, marginBottom: 20 }}
                            isFillRequired={true}
                            onPress={() => {
                                alertDialog("", strings.sure_redeem_deal, strings.yes, strings.no, () => {
                                    this.validateRedeem();
                                })
                            }}>
                            {strings.final_redeem}
                        </ButtonComponent>
                    </View>
                </ScrollView>
            </View >
        );
    }

    // initialize Realm object
    initRealm = (callDelete) => {
        Realm.open({
            schema: [ProductMenuSchema, ProductSchedulerSchema, DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                this.realm = realm
                if (callDelete) {
                    this.realm.write(() => {
                        let deal = this.realm.objects(databaseConstants.DEALS_SCHEMA).filtered('dealId = ' + dealId);
                        this.realm.delete(deal);
                    });
                }
            })
            .catch(error => {
                alertDialog("", error);
            });
    }

    componentDidMount() {
        if (this.currentDeal.productType === itemTypes.BONUS_DEAL) {
            // bonus deal
            let endDateTime = new Date(this.currentDeal.dealExpiredOn);
            this.setState({
                expiresOn: parseDateTime(endDateTime),
                checkinType: checkinType.BONUS
            })
        } else {
            if (this.currentDeal.appointmentDateTime) {
                this.dealNextAvailableStartDateTime = this.currentDeal.appointmentDateTime
                this.dealNextAvailableEndDateTime = this.currentDeal.appointmentDateTime
                this.setState({
                    checkinType: checkinType.BOOKED
                })
            } else {
                this.dealNextAvailableStartDateTime = this.currentDeal.dealNextAvailableStartDateTime
                this.dealNextAvailableEndDateTime = this.currentDeal.dealNextAvailableEndDateTime
                this.setState({
                    checkinType: checkinType.SAVED
                })
            }

            if (this.dealNextAvailableEndDateTime) {
                this.setState({
                    expiresOn: parseDateTime(this.dealNextAvailableEndDateTime)
                })
            }
        }
    }

    componentWillUnmount() {
        // if (this.realm !== null && !this.realm.isClosed) {
        //     this.realm.close();
        // }
    }

    // Validate Redeem deal
    validateRedeem = () => {
        let currentDateTime = new Date();
        let offset = getExactTimeOffset();

        currentDateTime.setMinutes(currentDateTime.getMinutes() + offset)

        if (this.currentDeal.productType === itemTypes.BONUS_DEAL) {
            let endDateTime = new Date(this.currentDeal.dealExpiredOn);
            if (currentDateTime.getTime() > endDateTime.getTime()) {
                this.handleDealExpired(endDateTime);
            } else {
                this.redeemDeal();
            }
        } else if (this.dealNextAvailableStartDateTime && this.dealNextAvailableEndDateTime) {
            let startDateTime = new Date(this.dealNextAvailableStartDateTime);
            let endDateTime = new Date(this.dealNextAvailableEndDateTime);
            let originalStartDateTime = new Date(this.dealNextAvailableStartDateTime);
            let originalEndDateTime = new Date(this.dealNextAvailableEndDateTime);

            if (this.state.checkinType == checkinType.BOOKED) {
                startDateTime.setMinutes(startDateTime.getMinutes() - constants.APPOINTMENT_EXTENSION_MINUTES)
            } else {
                startDateTime.setMinutes(startDateTime.getMinutes() - constants.EXTENSION_MINUTES)
            }

            endDateTime.setMinutes(endDateTime.getMinutes() + constants.REDEEM_END_EXTENSION_MINUTES)

            if (checkIfDateIsInRange(currentDateTime, startDateTime, endDateTime)) {
                console.log("redeem")
                console.log("realmmmmm---", this.realm.isClosed)
                this.redeemDeal();
            } else {
                // if early then show error
                if (currentDateTime.getTime() < startDateTime.getTime()) {
                    alertDialog("", strings.deal_can_be_redeemed_after + " " + parseDateTime(originalStartDateTime))
                } else if (currentDateTime.getTime() > endDateTime.getTime()) {
                    // deal expired if time passed
                    this.handleDealExpired(originalEndDateTime);
                }
            }
        } else {
            alertDialog("", strings.something_went_wrong)
        }
    }

    // API to redeem deal
    redeemDeal = () => {
        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                getCommonParamsForAPI().then((commonParams) => {
                    const params = {
                        ...commonParams,
                        redeemCode: this.currentDeal.dealRedeemedCode,
                    }

                    hitApi(urls.REDEEM_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                        let dealId = this.currentDeal.dealId;
                        // delete local entry
                        if (this.realm != null  && this.realm.isClosed) {
                            this.initRealm(true)
                        } else {
                            this.realm.write(() => {
                                let deal = this.realm.objects(databaseConstants.DEALS_SCHEMA).filtered('dealId = ' + dealId);
                                this.realm.delete(deal);
                            });
                        }
                        this.setState({
                            isRedeemSuccess: true,
                            redeemMessage: strings.deal_redeemed_successully,
                            showRedeemDonePopup: true
                        });
                    })
                })
            } else {
                // local redeem
                this.realm.write(() => {
                    let currentSavedDeals = this.realm.objects(databaseConstants.DEALS_SCHEMA).filtered('dealId = ' + this.currentDeal.dealId);
                    if (currentSavedDeals && currentSavedDeals.length == 1) {
                        currentSavedDeals[0].dealStatusId = dealStatuses.REDEEMED;

                        // DateTimeChange - Changing From UTC Date time to Local Date Time
                        currentSavedDeals[0].redeemedOn = getCurrentLocalDateTime();
                        // currentSavedDeals[0].redeemedOn = getCurrentUTCDateTime();

                        currentSavedDeals[0].dealRedeemedOn = getCurrentISODateTime();
                    } else {
                        // should never happen
                        alertDialog("", strings.deal_not_found)
                    }
                });
                this.setState({
                    isRedeemSuccess: true,
                    redeemMessage: strings.deal_redeemed_successully,
                    showRedeemDonePopup: true
                });
            }
        });
    }

    handleDealExpired = (endDateTime) => {
        NetInfo.fetch().then(state => {
            // DateTimeChange - Changing From UTC Date time to Local Date Time
            // let utcExpiredOn = getLocalDateTimeFromLocalDateTime(endDateTime);
            let utcExpiredOn = getUTCDateTimeFromLocalDateTime(endDateTime);

            if (state.isConnected) {
                this.dealExpired(utcExpiredOn)
            } else {
                // mark local as expired
                this.realm.write(() => {
                    let currentSavedDeals = this.realm.objects(databaseConstants.DEALS_SCHEMA).filtered('dealId = ' + this.currentDeal.dealId);
                    if (currentSavedDeals && currentSavedDeals.length == 1) {
                        currentSavedDeals[0].dealStatusId = dealStatuses.EXPIRED;
                        currentSavedDeals[0].dealExpiredOn = getISODateTimeFromLocalDateTime(endDateTime);
                        currentSavedDeals[0].expiredOn = utcExpiredOn;
                    } else {
                        // should never happen
                        alertDialog("", strings.deal_not_found)
                    }
                });

                let redeemMessage = strings.the_deal + this.currentDeal.dealTitle + strings.deal_has_expired
                this.setState({
                    isRedeemSuccess: false,
                    redeemMessage,
                    showRedeemDonePopup: true
                });
            }
        });
    }

    // API to expire deal
    dealExpired = (utcExpiredOn) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId: this.currentDeal.dealId,
                dealStatusId: dealStatuses.EXPIRED,
                actionTakenOn: utcExpiredOn,
            }

            hitApi(urls.MANAGE_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                // delete local entry
                this.realm.write(() => {
                    let currentDeal = this.realm.objects(databaseConstants.DEALS_SCHEMA).filtered('dealId = ' + this.currentDeal.dealId);
                    this.realm.delete(currentDeal);
                });

                let redeemMessage = strings.the_deal + this.currentDeal.dealTitle + strings.deal_has_expired
                this.setState({
                    isRedeemSuccess: false,
                    redeemMessage,
                    showRedeemDonePopup: true
                });
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
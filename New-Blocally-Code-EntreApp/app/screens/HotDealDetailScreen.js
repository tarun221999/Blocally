import React, { Component } from 'react'
import { View, TouchableOpacity, StyleSheet, ScrollView, Modal, Linking, StatusBar, FlatList } from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import ImageComponent from '../components/ImageComponent'
import LoaderComponent from '../components/LoaderComponent'
import ButtonComponent from '../components/ButtonComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import { urls, fontNames, sizes, screenNames, scheduleTypes, constants, favoriteType } from '../config/Constants'
import {
    getBonusStatsValueByIndex, getCommonParamsForAPI, alertDialog, getCurrencyFormat, parseDiscountApplied,
    parseTextForCard, itemTypes, parseDate, parseTime2, parseTimeWithoutUnit, getIconByDealType,
    getStatsValueByIndex, getTimeOffset, getPlainTextFromHtml, getScreenDimensions, getActionEventStatsValueByIndex,
} from '../utilities/HelperFunctions'
import { hitApi } from '../api/ApiCall'
import FastImage from 'react-native-fast-image'
import commonStyles2 from '../styles/StylesUser'

/**
 * Hot Deal Detail Screen
 */
export default class HotDealDetailScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.headerImageHeight = this.screenDimensions.width * constants.HEADER_IMAGE_HEIGHT_PERCENTAGE

        this.productId = this.props.navigation.state.params.PRODUCT_ID
        this.productLAT = this.props.navigation.state.params.PRODUCT_LAT
        this.productLNG = this.props.navigation.state.params.PRODUCT_LNG

        this.state = {
            showModalLoader: false,
            product: {},
            showAllDescription: false,
            showDetailPopup: false,
            showDetailAndConditionsPopup: false,
            shouldRenderUI: false,
            statsPopup: false,
            popupArray: [/* strings.Saved, */strings.Clicks, strings.Booked, strings.Checked_in, strings.Reedemed, strings.Scanned, strings.clicks_on_info],
            bonusStatsArray: [strings.Clicks, strings.secured_deals, strings.redeemed, strings.Scanned, strings.expired, strings.clicks_on_info],
            actionStatsArray: [strings.Clicks, strings.booking_requests, strings.clicks_on_call, strings.clicks_on_messenger, strings.redirect_to_website, strings.clicks_on_info],
            showBonusInfoPopup: false,
            sendPushPopup: false,
            sendToFavEnt: false,
            sendToFavProduct: false,
            publishMessage: ""
        }
    }

    lapsList() {
        return this.state.popupArray.map((data, index) => {
            return (
                <View>
                    <View style={{ width: '90%', alignSelf: 'center', flexDirection: 'row' }}>
                        <TextComponent style={{ fontFamily: fontNames.regularFont, fontSize: 13 }}>
                            {data}
                        </TextComponent>
                        <TextComponent style={{
                            position: 'absolute', right: 0,
                            fontFamily: fontNames.regularFont, fontSize: 13
                        }}>
                            {getStatsValueByIndex(this.state.product, index)}
                        </TextComponent>
                    </View>
                    <View style={{ width: '100%', height: 0.5, backgroundColor: colors.black, marginVertical: 10 }} />
                </View>
            )
        })
    }

    bonusDealStats() {
        return this.state.bonusStatsArray.map((data, index) => {
            return (
                <View>
                    <View style={{ width: '90%', alignSelf: 'center', flexDirection: 'row' }}>
                        <TextComponent style={{ fontFamily: fontNames.regularFont, fontSize: 13 }}>
                            {data}
                        </TextComponent>
                        <TextComponent style={{
                            position: 'absolute', right: 0, fontFamily: fontNames.regularFont,
                            fontSize: 13
                        }}>
                            {getBonusStatsValueByIndex(this.state.product, index)}
                        </TextComponent>
                    </View>
                    <View style={{
                        width: '100%', height: 0.5, backgroundColor: colors.black,
                        marginVertical: 10
                    }}>
                    </View>
                </View>
            )
        })
    }

    actionEventStats() {
        return this.state.actionStatsArray.map((data, index) => {
            return (
                <View>
                    <View style={{ width: '90%', alignSelf: 'center', flexDirection: 'row' }}>
                        <TextComponent style={{ fontFamily: fontNames.regularFont, fontSize: 13 }}>
                            {data}
                        </TextComponent>
                        <TextComponent style={{
                            position: 'absolute', right: 0, fontFamily: fontNames.regularFont,
                            fontSize: 13
                        }}>
                            {getActionEventStatsValueByIndex(this.state.product, index)}
                        </TextComponent>
                    </View>
                    <View style={{
                        width: '100%', height: 0.5, backgroundColor: colors.black,
                        marginVertical: 10
                    }}>
                    </View>
                </View>
            )
        })
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />

                {/* Send Push Popup */}
                {this.state.sendPushPopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles2.container, commonStyles2.centerInContainer, commonStyles2.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', padding: 10 }}
                                    onPress={() => {
                                        this.setState({ sendPushPopup: false })
                                    }}>
                                    <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
                                </TouchableOpacity>

                                <TextComponent
                                    style={{ marginTop: 20, alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                    {strings.send_push_message}
                                </TextComponent>

                                <View style={[commonStyles.rowContainer, { marginTop: 10 }]}>
                                    <TouchableOpacity
                                        style={{ padding: 5 }}
                                        onPress={() => {
                                            this.setState({
                                                sendToFavEnt: !this.state.sendToFavEnt
                                            })
                                        }}>
                                        <ImageComponent
                                            source={this.state.sendToFavEnt ? require('../assets/checkbox.png') : require('../assets/checkboxEmpty.png')} />
                                    </TouchableOpacity>

                                    <TextComponent
                                        style={{ marginLeft: 5, marginRight: 10, fontSize: sizes.largeTextSize }}>
                                        {strings.send_push_to_fav_ent}
                                    </TextComponent>
                                </View>

                                <View style={[commonStyles.rowContainer, { marginTop: 10 }]}>
                                    <TouchableOpacity
                                        style={{ padding: 5 }}
                                        onPress={() => {
                                            this.setState({
                                                sendToFavProduct: !this.state.sendToFavProduct
                                            })
                                        }}>
                                        <ImageComponent
                                            source={this.state.sendToFavProduct ? require('../assets/checkbox.png') : require('../assets/checkboxEmpty.png')} />
                                    </TouchableOpacity>

                                    <TextComponent
                                        style={{ marginLeft: 5, marginRight: 10, fontSize: sizes.largeTextSize }}>
                                        {strings.send_push_to_fav_product}
                                    </TextComponent>
                                </View>

                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles2.loginPopupButton}
                                    color={colors.primaryColor}
                                    fontStyle={{ color: colors.white }}
                                    onPress={() => {
                                        this.setState({
                                            sendPushPopup: false
                                        }, () => {
                                            if (this.state.sendToFavEnt || this.state.sendToFavProduct) {
                                                this.sendPushApi()
                                            } else {
                                                alertDialog("", this.state.publishMessage)
                                            }
                                        })
                                    }}>
                                    {strings.okay}
                                </ButtonComponent>
                            </View>
                        </View>
                    </Modal>
                }

                {/* Statistics Popup */}
                {this.state.statsPopup &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles2.container, commonStyles2.centerInContainer, commonStyles2.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', padding: 10 }}
                                    onPress={() => {
                                        this.setState({ statsPopup: false })
                                    }}>
                                    <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
                                </TouchableOpacity>

                                <TextComponent
                                    style={{ marginTop: 20, alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                    {this.state.product.productTitle}
                                </TextComponent>

                                {this.state.product.productType == itemTypes.HOT_DEAL ?
                                    <View style={{ width: '90%', alignSelf: 'center', marginVertical: 35 }}>
                                        {this.lapsList()}
                                    </View>
                                    :
                                    this.state.product.productType === itemTypes.BONUS_DEAL ?
                                        <View style={{ width: '90%', alignSelf: 'center', marginVertical: 35 }}>
                                            {this.bonusDealStats()}
                                        </View>
                                        :
                                        // for actions and events
                                        <View style={{ width: '90%', alignSelf: 'center', marginVertical: 35 }}>
                                            {this.actionEventStats()}
                                        </View>
                                }

                                <View style={{ width: '80%', alignSelf: 'center' }}>
                                    <ButtonComponent
                                        isFillRequired={true}
                                        color={colors.primaryColor}
                                        fontStyle={{ color: colors.white }}
                                        onPress={() => {
                                            this.setState({ statsPopup: false })
                                        }}>
                                        {strings.okay}
                                    </ButtonComponent>
                                </View>
                            </View>
                        </View>
                    </Modal>
                }

                {/* info popup */}
                {this.state.showInfoPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={commonStyles2.infoPopupView}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showInfoPopup: false })
                                }}>
                                <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
                            </TouchableOpacity>
                            <TextComponent
                                style={{
                                    color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center', marginTop: 10
                                }}>
                                {this.state.product.productType === itemTypes.HOT_DEAL ?
                                    strings.this_deal_can_be_redeemed_on_dates
                                    : this.state.product.productType === itemTypes.ACTION ?
                                        (strings.promotional_period) : (strings.event_schedule)}
                                    :
                            </TextComponent>
                            {this.state.product.scheduleType == scheduleTypes.DAYS &&
                                <View style={{ marginTop: 5 }}>
                                    <TextComponent style={{ alignSelf: 'center' }}>
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
                                            <TextComponent>{parseTime2(item.endTime)}</TextComponent>
                                        </View>
                                    </View>
                                }
                                showsVerticalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                style={commonStyles2.infoFlatList}
                            />
                            <ButtonComponent
                                isFillRequired={true}
                                style={commonStyles2.loginPopupButton}
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
                                <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
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
                            <ButtonComponent
                                isFillRequired={true}
                                style={commonStyles2.loginPopupButton}
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

                {/* detail & conditions popup */}
                {this.state.showDetailAndConditionsPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles2.container, commonStyles2.centerInContainer, commonStyles2.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showDetailAndConditionsPopup: false })
                                }}>
                                <ImageComponent source={require('../assets/crossPurple.png')} style={{width: 15, height: 15}} />
                            </TouchableOpacity>

                            <ScrollView
                                style={{ maxHeight: '80%', marginBottom: 10, marginTop: 10 }}
                                showsVerticalScrollIndicator={false}>
                                <TextComponent
                                    style={{ color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                    {strings.details}
                                </TextComponent>
                                <TextComponent style={{ marginTop: 10 }}>
                                    {this.state.product.productDetails}
                                </TextComponent>
                                <TextComponent
                                    style={{
                                        color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                        marginTop: 20
                                    }}>
                                    {strings.conditions}
                                </TextComponent>
                                <TextComponent style={{ marginTop: 10 }}>
                                    {this.state.product.productConditions}
                                </TextComponent>
                            </ScrollView>
                            <ButtonComponent
                                isFillRequired={true}
                                style={commonStyles2.loginPopupButton}
                                onPress={() => {
                                    this.setState({
                                        showDetailAndConditionsPopup: false
                                    })
                                }}>
                                {strings.done}
                            </ButtonComponent>
                        </View>
                    </View>
                </Modal>
                }

                <View style={[commonStyles2.headerBorder, commonStyles2.centerInContainer, {
                    width: '100%', height: this.headerImageHeight, backgroundColor: colors.white, zIndex: 3
                }]}>
                    <ImageComponent source={require('../assets/placeholderLogo.png')} />
                    <FastImage
                        source={{
                            uri: (this.state.product && this.state.product.productImage) ? this.state.product.productImage : "",
                        }}
                        resizeMode={FastImage.resizeMode.cover}
                        style={commonStyles2.productImage} />
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 5, start: 10 }}
                        onPress={() => this.props.navigation.goBack(null)}>
                        <ImageComponent source={require('../assets/backArrowWhiteShadow.png')} />
                    </TouchableOpacity>
                    <ImageComponent
                        style={{ position: 'absolute', top: 0, end: 0 }}
                        source={this.state.product.productType ? getIconByDealType(this.state.product.productType) : ""}
                    />
                    {this.state.shouldRenderUI &&
                        <View style={[commonStyles.rowContainer, { position: 'absolute', right: 10, bottom: 10 }]}>
                            <ImageComponent
                                source={
                                    this.state.product.productIsPublished
                                        ? require('../assets/publishedIcon.png') :
                                        require('../assets/unpublishedIcon.png')} />
                            {!this.state.product.productIsActive &&
                                <ImageComponent
                                    style={{ marginLeft: 10 }}
                                    source={require('../assets/inactive.png')} />
                            }
                        </View>
                    }
                </View>

                <ScrollView
                    style={{ marginTop: 20, }}
                    showsVerticalScrollIndicator={false}>
                    <View style={{ marginStart: 40, }}>
                        <View style={commonStyles2.rowContainer}>
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

                                <View style={[commonStyles2.rowContainer, { alignItems: 'center', marginTop: 5, }]}>
                                    <ImageComponent
                                        source={require('../assets/locationBlack.png')} />
                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, marginStart: 3, fontFamily: fontNames.boldFont }}>
                                        xxx KM
                                    </TextComponent>
                                </View>
                            </View>
                        </View>
                        {this.state.shouldRenderUI ?
                            <View style={[commonStyles2.rowContainer, { justifyContent: 'space-between', marginTop: 10, marginEnd: 50 }]}>
                                {this.state.product.productType === itemTypes.HOT_DEAL &&
                                    <TextComponent>
                                        <TextComponent style={{
                                            color: this.state.product.productIsHotDealUnlimited ? colors.primaryColor :
                                                colors.blackTextColor
                                        }}>
                                            {this.state.product.productIsHotDealUnlimited ? strings.until_stock_lasts
                                                : this.state.product.hotDealLeft + " " + strings.left
                                            }
                                        </TextComponent>
                                    </TextComponent>
                                }
                                {this.state.product.productType === itemTypes.BONUS_DEAL &&
                                    <TextComponent style={{
                                        color: this.state.product.productIsHotDealUnlimited ? colors.primaryColor
                                            : colors.blackTextColor
                                    }}>
                                        {this.state.product.productNoOfScannedForBonus + " " + strings.scans_required}
                                    </TextComponent>
                                }
                                {(this.state.product.productType === itemTypes.HOT_DEAL
                                    || this.state.product.productType === itemTypes.BONUS_DEAL) &&
                                    <TextComponent>
                                        |
                                    </TextComponent>
                                }

                                {this.state.product.isDiscounted ?
                                    <View style={[commonStyles.rowContainer]}>
                                        <TextComponent style={[commonStyles.cardDiscount, { fontSize: sizes.normalTextSize }]}>
                                            {this.state.product.discount + strings.percent_discount}
                                        </TextComponent>
                                    </View>
                                    :
                                    <View style={[commonStyles.rowContainer]}>
                                        <TextComponent style={(typeof this.state.product.productOP == 'number' && commonStyles2.lineThrough)}>
                                            {this.state.product.productMRP ? getCurrencyFormat(this.state.product.productMRP)
                                                : typeof this.state.product.productMRP == 'number' ? getCurrencyFormat(this.state.product.productMRP)
                                                    : ""}
                                        </TextComponent>
                                        <TextComponent style={{ color: colors.green, marginStart: 5, fontFamily: fontNames.boldFont }}>
                                            {this.state.product.productOP ? getCurrencyFormat(this.state.product.productOP)
                                                : typeof this.state.product.productOP == 'number' ? getCurrencyFormat(this.state.product.productOP)
                                                    : ""}
                                        </TextComponent>
                                    </View>
                                }

                                <TextComponent>
                                    |
                                </TextComponent>
                                <TextComponent>
                                    {this.state.product.discountApplied ?
                                        "-" + parseDiscountApplied(this.state.product.discountApplied) + "%" : "-"}
                                </TextComponent>
                            </View>
                            :
                            <View>
                                {/* Empty view until data is loaded */}
                            </View>
                        }
                    </View>

                    <ImageComponent
                        source={require('../assets/dottedLine.png')}
                        style={styles.dottedLine} />

                    <View>
                        <View style={styles.row}>
                            <ImageComponent source={require('../assets/homeIcon.png')} />
                            <TextComponent style={styles.text}>{this.state.product.businessName}</TextComponent>
                        </View>
                    </View>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
                            const latLng = `${this.state.product.productLat},${this.state.product.productLng}`;
                            const label = this.state.product.productTitle;
                            const url = Platform.select({
                                ios: `${scheme}${label}@${latLng}`,
                                android: `${scheme}${latLng}(${label})`
                            });
                            Linking.openURL(url);
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../assets/locationBig.png')} />
                            <TextComponent style={styles.text}>{this.state.product.productAddress}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={this.goToDetailsAndConditions}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../assets/docIcon.png')} />
                            <TextComponent style={styles.text}>
                                {strings.details_and_conditions}
                            </TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.product.productType === itemTypes.BONUS_DEAL) {
                                this.setState({
                                    showBonusInfoPopup: true
                                });
                            } else {
                                this.setState({
                                    showInfoPopup: true
                                })
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../assets/calendarStar.png')} />
                            <TextComponent style={styles.text}>
                                {(this.state.product.productType === itemTypes.HOT_DEAL || this.state.product.productType === itemTypes.BONUS_DEAL)
                                    ? strings.redemption_dates :
                                    this.state.product.productType === itemTypes.ACTION ? strings.promotional_period : strings.event_schedule}
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
                            <ImageComponent source={require('../assets/menuIcon.png')} />
                            <TextComponent style={styles.text}>{this.state.product.productMenuTitle}</TextComponent>
                        </View>
                    </TouchableOpacity>

                    <ImageComponent
                        source={require('../assets/dottedLine.png')}
                        style={[styles.dottedLine, { marginTop: 0 }]} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 20 }}>
                        <ButtonComponent
                            isFillRequired={true}
                            color={colors.green}
                            style={styles.button}
                            onPress={() => {
                                this.setState({ statsPopup: true })
                            }}>
                            {strings.statistics}
                        </ButtonComponent>

                        <ButtonComponent
                            isFillRequired={true}
                            color={colors.lightPurple}
                            style={styles.button}
                            onPress={() => {
                                this.validatePublishUnpublish()
                            }}>
                            {this.state.product.productIsPublished ? strings.unpublish : strings.publish}
                        </ButtonComponent>
                    </View>
                </ScrollView>
            </View>
        );
    }

    goToDetailsAndConditions = () => {
        this.props.navigation.navigate(screenNames.WEB_VIEW_SCREEN, {
            TITLE: strings.details_and_conditions,
            HTML_CONTENT: this.state.product.productDetails + "<br/>" + this.state.product.productConditions
        })
    }
    
    componentDidMount() {
        this.fetchProductDetails()
    }

    showLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }

    // api to get product's details
    fetchProductDetails = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: this.productId,
                lat: this.productLAT,
                lng: this.productLNG,
                timeOffset: getTimeOffset(),
            }

            hitApi(urls.GET_PRODUCT_DETAIL_ENT, urls.POST, params, this.showLoader, (jsonResponse) => {
                this.setState({
                    product: jsonResponse.response,
                    shouldRenderUI: true
                })
            })
        })
    }

    // api to delete product
    deleteProduct() {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: this.productId
            }

            hitApi(urls.DELETE_PRODUCT, urls.POST, params, this.showLoader, (jsonResponse) => {
                alertDialog("", jsonResponse.message)
            })
        })
    }

    // validations for publish/unpublish
    validatePublishUnpublish = () => {
        if (this.state.product.productIsPublished) {
            this.publishUnpublishProduct()
        } else {
            if (this.state.product.productIsDrafted) {
                alertDialog("", strings.product_draft_error)
            } else {
                if (this.state.product.productType == itemTypes.BONUS_DEAL) {
                    if (this.state.product.isBonusConditionsAdded) {
                        this.publishUnpublishProduct()
                    } else {
                        alertDialog("", strings.add_bonus_conditions);
                    }
                } else {
                    this.publishUnpublishProduct()
                }
            }
        }
    }

    // api to publish/unpublish the deal
    publishUnpublishProduct = () => {
        let msg = this.state.product.productIsPublished ? strings.sure_unpublish_product : strings.sure_publish_product
        alertDialog("", msg, strings.yes, strings.no, () => {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    productId: this.productId,
                    isPublished: !this.state.product.productIsPublished
                }

                hitApi(urls.MANAGE_PRODUCT, urls.POST, params, this.showLoader, (jsonResponse) => {
                    let temp = this.state.product
                    temp.productIsPublished = !this.state.product.productIsPublished
                    this.setState({
                        product: temp
                    }, () => {
                        if (temp.productIsPublished) {
                            let obj = jsonResponse.response
                            let today = new Date()
                            let promotionStartDate = new Date(this.state.product.productPromotionStartDate)
                            let redemptionEndDate = new Date(this.state.product.productRedemptionEndDate)

                            if(today.getTime() < promotionStartDate.getTime() || today.getTime() > redemptionEndDate.getTime()) {
                                alertDialog("", jsonResponse.message)                   
                            } else {
                                this.setState({
                                    sendPushPopup: true,
                                    publishMessage: jsonResponse.message
                                })
                            }
                        } else {
                            alertDialog("", jsonResponse.message)
                        }
                    })
                })
            })
        })
    }

    // api to send push to fav ent/product
    sendPushApi = () => {
        let favType = null
        if (this.state.sendToFavEnt && !this.state.sendToFavProduct) {
            favType = favoriteType.ENTREPRENEUR
        } else if (!this.state.sendToFavEnt && this.state.sendToFavProduct) {
            favType = favoriteType.PRODUCT
        }

        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: this.productId,
                favType,
                message: null,
                isProductAdded: false,
            }

            hitApi(urls.SEND_PUSH_NOTIFICATIONS_ENT, urls.POST, params, this.showLoader, (jsonResponse) => {
                this.setState({
                    sendToFavEnt: false,
                    sendToFavProduct: false
                }, () => {
                    alertDialog("", this.state.publishMessage)
                })
            })
        })
    }
}

const styles = StyleSheet.create({
    dottedLine: {
        width: '100%',
        resizeMode: 'stretch',
        marginTop: 20,
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
    info: {
        marginStart: 'auto',
        padding: 10,
    },
    line: {
        height: 1,
        marginHorizontal: 50,
        backgroundColor: colors.lightLineColor
    },
    button: {
        width: '40%',
    }
});
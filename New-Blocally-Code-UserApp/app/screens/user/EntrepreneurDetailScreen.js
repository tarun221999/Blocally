import React, { Component } from 'react'
import {
    View, StyleSheet, FlatList, TouchableWithoutFeedback,
    TouchableOpacity, ScrollView, Linking, Modal, Platform
} from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import HeaderComponent from '../../components/HeaderComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    constants, urls, fontNames, sizes, itemTypes, screenNames,
    favoriteType, favoriteRequests, scheduleTypes, statsTypes,
} from '../../config/constants'
import {
    getCommonParamsForAPI, alertDialog, getScreenDimensions, getImageDimensions, parseDate, parseTime,
    parseTextForCard, parseDiscountApplied, isUserLoggedIn, startStackFrom, parseDateTime,
    getCurrencyFormat, parseTimeWithoutUnit, getTimeOffset, openUrlInBrowser, openNumberInDialer,
    handleErrorResponse, getUnreadCounts,
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import FastImage from 'react-native-fast-image'
// import { IndicatorViewPager, PagerDotIndicator } from 'react-native-best-viewpager'
import Swiper from 'react-native-swiper';
import SmallButtonComponent from '../../components/SmallButtonComponent'

/**
 * Ent detail screen
 */
export default class EntrepreneurDetailScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.cardUpperBgImage = getImageDimensions(require('../../assets/cardUpperBg.png'))
        this.cardLowerBgWithCut = getImageDimensions(require('../../assets/cardLowerBgWithCut.png'))
        this.headerImageHeight = this.screenDimensions.width * constants.HEADER_IMAGE_HEIGHT_PERCENTAGE

        this.latitude = 0
        this.longitude = 0

        this.shouldHitPagination = true

        this.state = {
            showModalLoader: false,
            showInfoPopup: false,
            showSchedulerPopup: false,
            currentEntrepreneur: {},
            entrepreneurDeals: [],
            showDealLoader: false,
            entrepreneurImagesArray: [],
            showLoginPopup: false,

            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            productTypeForSchedule: null,
            schedulerData: [],

            showNoProducts: false,

            bonusDeals: [],
            showNoBonusDeals: false,
            showBonusDealLoader: false,
            showBonusInfoPopup: false,
            schedulerProductPromotionEndDate: null,
        }
        this.businessId = this.props.navigation.state.params.BUSINESS_ID
        this.pageIndex = 1
        this.paginationRequired = true

        this.bonusPageIndex = 1
        this.bonusPaginationRequired = true
    }

    render() {
        console.log(this.state.entrepreneurImagesArray)
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />

                {/* Login Popup */}
                {this.state.showLoginPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TextComponent
                                style={{ alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                {strings.login_to_continue}
                            </TextComponent>
                            <View style={[commonStyles.rowContainer, commonStyles.centerInContainer]}>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles.loginPopupButton}
                                    color={colors.greyButtonColor2}
                                    fontStyle={{ color: colors.black }}
                                    onPress={() => {
                                        this.setState({ showLoginPopup: false })
                                    }}>
                                    {strings.no}
                                </ButtonComponent>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={commonStyles.loginPopupButton}
                                    onPress={() => startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)}>
                                    {strings.yes}
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
                        <View style={commonStyles.infoPopupView}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showInfoPopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                            </TouchableOpacity>

                            <TextComponent
                                style={{
                                    color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center', marginTop: 10
                                }}>
                                {this.state.productTypeForSchedule === itemTypes.HOT_DEAL ?
                                    strings.this_deal_can_be_redeemed_on_dates
                                    : this.state.productTypeForSchedule === itemTypes.ACTION ?
                                        strings.promotional_period : strings.event_schedule}
                            </TextComponent>

                            {this.state.scheduleType == scheduleTypes.DAYS &&
                                <View style={{ marginTop: 5 }}>
                                    <TextComponent style={{ alignSelf: 'center', }}>
                                        {this.state.schedulerRedemptionStartDate ?
                                            (strings.from + " " +
                                                parseDate(this.state.schedulerRedemptionStartDate)
                                                + " " + strings.to + " " +
                                                parseDate(this.state.schedulerRedemptionEndDate))
                                            : ""}
                                    </TextComponent>
                                    <TextComponent style={{ alignSelf: 'center', marginTop: 5 }}>
                                        {strings.on_following_days}
                                    </TextComponent>
                                </View>
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

                {this.state.showBonusInfoPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showBonusInfoPopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}} />
                            </TouchableOpacity>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont,
                                    textAlign: 'center'
                                }}>
                                {strings.available_till}
                            </TextComponent>
                            <TextComponent style={{ alignSelf: 'center', marginTop: 10 }}>
                                {this.state.schedulerProductPromotionEndDate ?
                                    parseDate(this.state.schedulerProductPromotionEndDate) : ""}
                            </TextComponent>
                            <TextComponent
                                style={{
                                    alignSelf: 'center', fontSize: sizes.largeTextSize, textAlign: 'center', marginTop: 10
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

                {/* Entrepreneur Scheduler popup */}
                {this.state.showSchedulerPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={commonStyles.infoPopupView}>
                            <TouchableOpacity
                                style={{ marginStart: 'auto', padding: 10 }}
                                onPress={() => {
                                    this.setState({ showSchedulerPopup: false })
                                }}>
                                <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                            </TouchableOpacity>

                            <TextComponent
                                style={{
                                    alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize,
                                    fontFamily: fontNames.boldFont, marginBottom: 20
                                }}>
                                {strings.opening_hours}
                            </TextComponent>

                            <FlatList
                                data={this.state.currentEntrepreneur.entrepreneurScheduler}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.rowContainer, { marginBottom: 10, marginStart: 20, marginEnd: 20 }]}>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont }}>
                                            {
                                                index > 0 ?
                                                    this.state.currentEntrepreneur.entrepreneurScheduler[index - 1].scheduleDay == item.scheduleDay ?
                                                        "" : strings.days_of_week[item.scheduleDay - 1]
                                                    :
                                                    strings.days_of_week[item.scheduleDay - 1]
                                            }
                                        </TextComponent>

                                        <View style={[commonStyles.rowContainer, { marginStart: 'auto' }]}>
                                            <TextComponent>{parseTime(item.startTime) + " - "}</TextComponent>
                                            <TextComponent>{parseTime(item.endTime)}</TextComponent>
                                        </View>
                                    </View>
                                }
                                style={commonStyles.infoFlatList}
                                keyExtractor={(item, index) => index.toString()}
                            />
                        </View>
                    </View>
                </Modal>
                }

                <View style={[commonStyles.headerBorder, commonStyles.centerInContainer, {
                    width: '100%', height: this.headerImageHeight, backgroundColor: colors.white
                }]}>
                    <ImageComponent source={require('../../assets/placeholderLogo.png')} />
                    {this.state.entrepreneurImagesArray.length > 0 &&
                        <Swiper
                            containerStyle={[styles.viewPager]}
                            // onPageSelected={(index) => {
                            //     this.currentAdIndex = index.position
                            // }}
                            // ref={(ref) => { this.viewPager = ref }}
                            // indicator={<PagerDotIndicator pageCount={this.state.entrepreneurImagesArray.length} />}
                            autoplay={true}
                            autoplayTimeout={3000}
                            activeDotColor={colors.purpleButton}
                            dotColor={colors.greyButtonColor}
                        // keyboardDismissMode='none'
                        >
                            {this.state.entrepreneurImagesArray}

                        </Swiper>
                    }
                    <TouchableOpacity style={{ position: 'absolute', left: 0, top: 0 }}
                        onPress={() => {
                            if (this.props.onBackPress) {
                                this.props.onBackPress()
                            } else {
                                this.props.navigation.goBack(null);
                            }
                        }}>
                        <ImageComponent
                            source={require('../../assets/backArrowWhiteShadow.png')}
                        />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    style={{ marginTop: 10 }}
                    showsVerticalScrollIndicator={false}>
                    <View style={[commonStyles.rowContainer, styles.row]}>
                        <ImageComponent
                            source={require('../../assets/homeIcon.png')} />
                        <TouchableOpacity
                            style={{ paddingHorizontal: 20, justifyContent: 'center', width: '75%' }}
                            onPress={() => {
                                if (this.state.currentEntrepreneur && this.state.currentEntrepreneur.businessId) {
                                    this.props.navigation.navigate(screenNames.WEB_VIEW_SCREEN, {
                                        TITLE: strings.about_us,
                                        HTML_CONTENT: this.state.currentEntrepreneur.businessAboutUs
                                    })
                                }
                            }}>
                            <TextComponent>
                                {this.state.currentEntrepreneur.businessName}
                            </TextComponent>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginStart: 'auto', paddingHorizontal: 20, }}
                            onPress={this.manageEntrepreneurFavorite}>
                            <ImageComponent
                                source={this.state.currentEntrepreneur.isMarkedAsFavourite ?
                                    require('../../assets/bookmarkSelected.png')
                                    : require('../../assets/bookmark.png')} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            this.hitAddStats(statsTypes.REDIRECT_TO_GOOGLE_MAP)
                        }}>
                        <View style={[commonStyles.rowContainer, styles.row]}>
                            <ImageComponent
                                source={require('../../assets/locationBig.png')} />
                            <TextComponent style={styles.rowText}>{this.state.currentEntrepreneur.businessAddress}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.currentEntrepreneur && this.state.currentEntrepreneur.businessId) {
                                this.setState({
                                    showSchedulerPopup: true
                                })
                            }
                        }}>
                        <View style={[commonStyles.rowContainer, styles.row]}>
                            <ImageComponent
                                source={require('../../assets/clockIcon.png')} />
                            <TextComponent style={styles.rowText}>{strings.opening_hours /* + ": " + this.state.currentEntrepreneur.openHours */}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.currentEntrepreneur.entrepreneurMenu && this.state.currentEntrepreneur.entrepreneurMenu.length > 0) {
                                this.props.navigation.navigate(screenNames.VIEW_ALL_MENU_IMAGES_SCREEN, {
                                    MENU_IMAGES: this.state.currentEntrepreneur.entrepreneurMenu,
                                    TITLE: this.state.currentEntrepreneur.businessName
                                })
                            } else {
                                alertDialog("", strings.menu_not_available)
                            }
                        }}>
                        <View style={[commonStyles.rowContainer, styles.row]}>
                            <ImageComponent
                                source={require('../../assets/menuIcon.png')} />
                            <TextComponent style={styles.rowText}>
                                {this.state.currentEntrepreneur.businessMenuTitle}
                            </TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.currentEntrepreneur && this.state.currentEntrepreneur.businessId) {
                                this.props.navigation.navigate(screenNames.WEB_VIEW_SCREEN, {
                                    TITLE: strings.imprint,
                                    HTML_CONTENT: this.state.currentEntrepreneur.businessImprint
                                })
                            }
                        }}>
                        <View style={[commonStyles.rowContainer, styles.row]}>
                            <ImageComponent
                                source={require('../../assets/imprintIcon.png')} />
                            <TextComponent style={styles.rowText}>
                                {strings.imprint}
                            </TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <View style={[commonStyles.rowContainer, commonStyles.centerInContainer, { marginTop: 20 }]}>
                        {this.state.currentEntrepreneur.isMessageActive &&
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButtonDark}
                                icon={require('../../assets/chatWhite.png')}
                                style={[styles.button, {}]}
                                onPress={() => {
                                    isUserLoggedIn().then((isUserLoggedIn) => {
                                        if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                            this.setState({
                                                showLoginPopup: true
                                            })
                                        } else {
                                            if (this.state.currentEntrepreneur && this.state.currentEntrepreneur.businessId) {
                                                let product = {}
                                                product.businessName = this.state.currentEntrepreneur.businessName
                                                product.messageId = this.state.currentEntrepreneur.messageId
                                                this.props.navigation.navigate(screenNames.MESSAGE_SCREEN, {
                                                    PRODUCT_ID: null,
                                                    PRODUCT: product,
                                                    BUSINESS_ID: this.businessId
                                                })
                                            }
                                        }
                                    })
                                }}>
                                {strings.message}
                            </ButtonComponent>
                        }

                        {this.state.currentEntrepreneur.isCallActive &&
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButton}
                                icon={require('../../assets/call_icon.png')}
                                style={[styles.button, { marginStart: 5 }]}
                                onPress={() => {
                                    isUserLoggedIn().then((isUserLoggedIn) => {
                                        if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                            this.setState({
                                                showLoginPopup: true
                                            })
                                        } else {
                                            this.hitAddStats(statsTypes.CLICK_ON_CALL)
                                        }
                                    })
                                }}>
                                {strings.call}
                            </ButtonComponent>
                        }

                        {(this.state.currentEntrepreneur.isBookingsActive || this.state.currentEntrepreneur.isEntrepreneurRedirectToURL) &&
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButtonLight}
                                icon={require('../../assets/bookWhite.png')}
                                style={[styles.button, { marginStart: 5 }]}
                                onPress={() => {
                                    isUserLoggedIn().then((isUserLoggedIn) => {
                                        if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                            this.setState({
                                                showLoginPopup: true
                                            })
                                        } else {
                                            if (this.state.currentEntrepreneur.isEntrepreneurRedirectToURL) {
                                                if (this.state.currentEntrepreneur.businessWebUrl
                                                    && this.state.currentEntrepreneur.businessWebUrl.length > 0) {
                                                    this.hitAddStats(statsTypes.REDIRECT_TO_WEBSITE);
                                                } else {
                                                    alertDialog("", strings.url_not_available);
                                                }
                                            } else {
                                                if (this.state.currentEntrepreneur && this.state.currentEntrepreneur.businessId) {
                                                    this.props.navigation.navigate(screenNames.ADD_APPOINTMENT_SCREEN, {
                                                        BUSINESS_ID: this.businessId,
                                                        MESSAGE_ID: this.state.currentEntrepreneur.messageId,
                                                        PRODUCT_ID: null,
                                                        PRODUCT_TYPE: null,
                                                    });
                                                }
                                            }
                                        }
                                    })
                                }}>
                                {strings.book}
                            </ButtonComponent>
                        }
                    </View>

                    {(this.state.entrepreneurDeals && this.state.entrepreneurDeals.length > 0) &&
                        <View>
                            <TextComponent
                                style={[styles.headerText,
                                { marginTop: 20, marginStart: 20 }]}>
                                {strings.action_events}
                            </TextComponent>

                            <FlatList
                                data={this.state.entrepreneurDeals}
                                extraData={this.state}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.cardShadow, commonStyles.cardMargins]}>
                                        <View style={commonStyles.cardRadius}>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    (item.productType === itemTypes.HOT_DEAL || item.productType === itemTypes.BONUS_DEAL) ?
                                                        this.props.navigation.navigate(screenNames.HOT_DEAL_DETAIL_SCREEN, {
                                                            PRODUCT_ID: item.productId
                                                        })
                                                        :
                                                        this.props.navigation.navigate(screenNames.ACTION_EVENT_DETAIL_SCREEN, {
                                                            PRODUCT_ID: item.productId,
                                                            PRODUCT_TYPE: item.productType,
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
                                style={styles.flatList}
                                ListEmptyComponent={
                                    this.state.showNoProducts &&
                                    <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                        <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginStart: 10 }}>
                                            {strings.no_records_found}
                                        </TextComponent>
                                    </View>
                                }
                                onEndReached={({ distanceFromEnd }) => {
                                    if (distanceFromEnd == 0) {
                                        return;
                                    }
                                    if (this.paginationRequired && this.shouldHitPagination) {
                                        this.shouldHitPagination = false
                                        this.pageIndex++
                                        this.fetchDealsOfEntrepreneur()
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
                    }

                    <View style={[commonStyles.rowContainer, { marginTop: 20, marginStart: 20 }]}>
                        <TextComponent
                            style={styles.headerText}>
                            {strings.bonus_deals}
                        </TextComponent>
                        {this.state.currentEntrepreneur.availableScannedCountOfUser ?
                            <View style={[commonStyles.rowContainer]}>
                                <TextComponent style={styles.headerText}>
                                    {" ("}
                                </TextComponent>
                                <ImageComponent
                                    tintColor={colors.primaryColor}
                                    style={{ marginRight: 5, tintColor: colors.primaryColor }}
                                    source={require('../../assets/bonus.png')} />
                                <TextComponent style={styles.headerText}>
                                    {this.state.currentEntrepreneur.availableScannedCountOfUser + ")"}
                                </TextComponent>
                            </View>
                            : <View />
                        }
                    </View>

                    <FlatList
                        data={this.state.bonusDeals}
                        extraData={this.state}
                        renderItem={({ item, index }) =>
                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            if (item.productType === itemTypes.BONUS_DEAL) {
                                                this.props.navigation.navigate(screenNames.HOT_DEAL_DETAIL_SCREEN, {
                                                    PRODUCT_ID: item.productId
                                                })
                                            }
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
                                                {item.productType === itemTypes.BONUS_DEAL &&
                                                    <ImageComponent
                                                        style={commonStyles.cardBadgeIcon}
                                                        source={require('../../assets/bonusBadge.png')} />
                                                }

                                                <View style={[commonStyles.rowContainer, {
                                                    position: 'absolute', backgroundColor: colors.timerBackground,
                                                    paddingHorizontal: 20, borderRadius: 20, paddingVertical: 5
                                                }]}>
                                                    <ImageComponent
                                                        style={{ marginRight: 10 }}
                                                        source={require('../../assets/bonus.png')} />
                                                    <TextComponent style={{ color: colors.white, fontSize: sizes.mediumTextSize }}>
                                                        {item.productNoOfScannedForBonus + " " + strings.scans_required}
                                                    </TextComponent>
                                                </View>

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
                                                        onPress={() => {
                                                            this.setState({
                                                                schedulerProductPromotionEndDate: item.productPromotionEndDate
                                                            }, () => {
                                                                this.fetchProductDetails(item.productId, true)
                                                            })
                                                        }}>
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
                        style={[styles.flatList, { marginBottom: 20 }]}
                        ListEmptyComponent={
                            this.state.showNoBonusDeals &&
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginStart: 10 }}>
                                    {strings.no_records_found}
                                </TextComponent>
                            </View>
                        }
                        onEndReached={({ distanceFromEnd }) => {
                            if (distanceFromEnd == 0) {
                                return;
                            }
                            if (this.bonusPaginationRequired && this.shouldHitPagination) {
                                this.shouldHitPagination = false
                                this.bonusPageIndex++
                                this.fetchBonusDeals()
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
                </ScrollView>
            </View >
        )
    }

    componentDidMount() {
        AsyncStorageHelper.getStringAsync(constants.COORDINATES)
            .then((strCoordinates) => {
                const coordinates = JSON.parse(strCoordinates);
                this.latitude = coordinates.latitude
                this.longitude = coordinates.longitude
                this.fetchDealsOfEntrepreneur()
                this.fetchBonusDeals()
            })
        this.fetchEntrepreneurDetail()
        getUnreadCounts(this.props.navigation)
    }

    showDealLoader = (shouldShow) => {
        this.setState({
            showDealLoader: shouldShow
        })
    }

    showBonusDealLoader = (shouldShow) => {
        this.setState({
            showBonusDealLoader: shouldShow
        })
    }

    // api to get ent details
    fetchEntrepreneurDetail = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                businessId: this.businessId,
                timeOffset: getTimeOffset(),
            }

            hitApi(urls.GET_ENTREPRENEUR_DETAIL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                let entrepreneurData = jsonResponse.response;
                if (entrepreneurData && entrepreneurData.entrepreneurImages) {
                    const entrepreneurImagesArray = entrepreneurData.entrepreneurImages.map((item, key) => {
                        return (
                            <FastImage
                                source={{
                                    uri: item.businessImage ? item.businessImage : "",
                                }}
                                resizeMode={FastImage.resizeMode.contain}
                                style={[commonStyles.container, { height: '100%' }]}
                            />
                        )
                    })
                    this.setState({
                        currentEntrepreneur: entrepreneurData,
                        entrepreneurImagesArray: entrepreneurImagesArray
                    })
                }
            })
        })
    }

    // api to get deals of ent
    fetchDealsOfEntrepreneur = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                businessId: this.businessId,
                lat: this.latitude,
                lng: this.longitude,
                pageIndex: this.pageIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
            }

            hitApi(urls.GET_ENTREPRENEUR_DEALS, urls.POST, params, this.showDealLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.paginationRequired = false
                }

                let tempArray = this.state.entrepreneurDeals
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    entrepreneurDeals: tempArray,
                    showNoProducts: true,
                }, () => {
                    this.shouldHitPagination = true
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // api to get bonus deals of ent
    fetchBonusDeals = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                businessId: this.businessId,
                lat: this.latitude,
                lng: this.longitude,
                pageIndex: this.bonusPageIndex,
                pageSize: constants.PAGE_SIZE,
                timeOffset: getTimeOffset(),
            }

            hitApi(urls.GET_ENTREPRENEUR_BONUS_DEALS, urls.POST, params, this.showBonusDealLoader, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.bonusPaginationRequired = false
                }

                let tempArray = this.state.bonusDeals
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    bonusDeals: tempArray,
                    showNoBonusDeals: true,
                }, () => {
                    this.shouldHitPagination = true
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // api to add/remove from fav
    manageEntrepreneurFavorite = () => {
        isUserLoggedIn().then((isUserLoggedIn) => {
            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                this.setState({
                    showLoginPopup: true
                })
            } else {
                if (this.state.currentEntrepreneur && this.state.currentEntrepreneur.businessId) {
                    getCommonParamsForAPI().then((commonParams) => {
                        const params = {
                            ...commonParams,
                            favId: this.businessId,
                            favType: favoriteType.ENTREPRENEUR,
                            addFav: this.state.currentEntrepreneur.isMarkedAsFavourite ? favoriteRequests.REMOVE_FAVORITE : favoriteRequests.ADD_TO_FAVORITE
                        }

                        hitApi(urls.MANAGE_FAVORITES, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                            let temp = this.state.currentEntrepreneur
                            temp.isMarkedAsFavourite = !this.state.currentEntrepreneur.isMarkedAsFavourite
                            this.setState({
                                currentEntrepreneur: temp
                            })
                        })
                    })
                }
            }
        })
    }

    // api to get product details
    fetchProductDetails = (productId, isBonusDeal) => {
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
                if (isBonusDeal) {
                    this.setState({
                        showBonusInfoPopup: true
                    })
                } else {
                    this.setState({
                        scheduleType: jsonResponse.response[0].scheduleType,
                        schedulerRedemptionStartDate: jsonResponse.response[0].productRedemptionStartDate,
                        schedulerRedemptionEndDate: jsonResponse.response[0].productRedemptionEndDate,
                        schedulerData: jsonResponse.response[0].productScheduler,
                        productTypeForSchedule: jsonResponse.response[0].productType,
                        showInfoPopup: true
                    })
                }
            })
        })
    }

    hitAddStats = (statType) => {
        if (this.state.currentEntrepreneur && this.state.currentEntrepreneur.businessId) {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    statsType: statType,
                    productId: null,
                    businessId: this.businessId,
                }

                hitApi(urls.ADD_STATS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    if (statType === statsTypes.CLICK_ON_CALL) {
                        this.openCaller()
                    } else if (statType === statsTypes.REDIRECT_TO_WEBSITE) {
                        this.openUrl()
                    } else if (statType === statsTypes.REDIRECT_TO_GOOGLE_MAP) {
                        this.openMaps()
                    }
                }, (jsonResponse) => {
                    if (statType === statsTypes.CLICK_ON_CALL) {
                        this.openCaller()
                    } else if (statType === statsTypes.REDIRECT_TO_WEBSITE) {
                        this.openUrl()
                    } else if (statType === statsTypes.REDIRECT_TO_GOOGLE_MAP) {
                        this.openMaps()
                    }
                })
            })
        }
    }

    openCaller = () => {
        openNumberInDialer(this.state.currentEntrepreneur.businessPhoneNumber)
    }

    openUrl = () => {
        openUrlInBrowser(this.state.currentEntrepreneur.businessWebUrl)
    }

    openMaps = () => {
        const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${this.state.currentEntrepreneur.businessLat},${this.state.currentEntrepreneur.businessLng}`;
        const label = this.state.currentEntrepreneur.businessName;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        
        Linking.openURL(url);
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    viewPager: {
        height: '100%',
        width: '100%',
        position: 'absolute',
        backgroundColor: colors.transparent,
    },
    headerText: {
        fontSize: sizes.xLargeTextSize,
        fontFamily: fontNames.boldFont,
    },
    row: {
        padding: 20
    },
    rowText: {
        marginStart: 20
    },
    line: {
        height: 1,
        marginHorizontal: 20,
        backgroundColor: colors.lightLineColor,
    },
    button: {
        width: '30%',
    },
    flatList: {
        paddingStart: 10,
        marginTop: 10,
        minHeight: constants.MIN_HEIGHT_FOR_FLAT_LIST,
    },
});
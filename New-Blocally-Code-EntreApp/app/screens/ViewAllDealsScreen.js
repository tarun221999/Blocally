import React, { Component } from 'react'
import { View, StyleSheet, TouchableHighlight, ScrollView, Modal, StatusBar, FlatList, TouchableOpacity, RefreshControl, TouchableWithoutFeedback } from 'react-native'
import { NavigationEvents } from 'react-navigation'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import HeaderComponent from '../components/HeaderComponent'
import ImageComponent from '../components/ImageComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import {
    isUserLoggedIn, startStackFrom, alertDialog, getColor, parseTime, getOnlyMonth, getOnlyDate,
    getTypeOfScreenName, getHeaderNameByScreenType, getTimeOffset, isNetworkConnected, handleErrorResponse,
} from '../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, constants, urls, productSortBy, productOrderBy, scheduleTypes, itemTypes } from '../config/Constants'
import { getCommonParamsForAPI, getScreenDimensions, getImageDimensions, parseTimeWithoutUnit, parseTime2, parseTextForCard, parseDiscountApplied, getIconByDealType, getCurrencyFormat, parseDate } from '../utilities/HelperFunctions'
import TitleBarComponent from '../components/TitleBarComponent'
import { hitApi } from '../api/ApiCall'
import LoaderComponent from '../components/LoaderComponent'
import ButtonComponent from '../components/ButtonComponent'
import { IndicatorViewPager, PagerTitleIndicator } from 'react-native-best-viewpager'
import commonStyles2 from '../styles/StylesUser'
import FastImage from 'react-native-fast-image'
import SmallButtonComponent from '../components/SmallButtonComponent'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'

/**
 * View All Products screen
 */
export default class ViewAllDealsScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dealsArrayPublished: [],
            dealsArrayUnpublished: [],
            pullToRefreshWorking: false,
            showModalLoader: false,
            shouldshowDealsArrayPublishedEmpty: false,
            shouldshowDealsArrayUnPublishedEmpty: false,

            showInfoPopup: false,
            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            productTypeForSchedule: null,
            schedulerData: [],

            showBonusInfoPopup: false,
            schedulerProductPromotionEndDate: null,
            tabs: {
                index: 0,
                routes: [
                    { key: 'first', title:  strings.published },
                    { key: 'second', title: strings.unpublished },
                ],
            }
        }

        this.didFocusSubscription = null

        this.dealsArrayPublishedIndex = 1
        this.dealsArrayPublishedPaginationRequired = true

        this.dealsArrayUnpublishedIndex = 1
        this.dealsArrayUnpublishedPaginationRequired = true

        this.shouldHitPagination = true
        this.apiCount = 0;

        this.typeOfIntent = this.props.navigation.state.params.ITEM_TYPE_ID
        this.screenDimensions = getScreenDimensions()
        this.cardUpperBgImage = getImageDimensions(require('../assets/cardUpperBg.png'))
        this.cardLowerBgWithCut = getImageDimensions(require('../assets/cardLowerBgWithCut.png'))

        this.headerImageHeight = getImageDimensions(require('../assets/hotDealsHeader.png')).height
        this.cardFullUpperBgImage = getImageDimensions(require('../assets/cardFullUpperBg.png'))
        this.cardFullRedStripImage = getImageDimensions(require('../assets/cardFullRedStrip.png'))
        this.cardFullLowerBgWithCut = getImageDimensions(require('../assets/cardFullLowerBgWithCut.png'))
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />

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
                                            <TextComponent>{parseTime2(item.endTime)}</TextComponent>
                                        </View>
                                    </View>
                                }
                                showsVerticalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                style={{ marginTop: 10 }}
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
                                {this.state.schedulerProductPromotionEndDate ?
                                    parseDate(this.state.schedulerProductPromotionEndDate) : ""}
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

                <TitleBarComponent
                    title={getTypeOfScreenName(this.typeOfIntent)}
                    navigation={this.props.navigation} />

                <HeaderComponent
                    image={getHeaderNameByScreenType(this.typeOfIntent)}>
                </HeaderComponent>

                {/* <IndicatorViewPager
                    style={{ flex: 1, flexDirection: 'column-reverse', backgroundColor: colors.white }}
                    indicator={
                        <PagerTitleIndicator
                            titles={[strings.published, strings.unpublished]}
                            style={{ backgroundColor: colors.white }}
                            itemStyle={{ width: this.screenDimensions.width / 2 }}
                            selectedItemStyle={{ width: this.screenDimensions.width / 2 }}
                            itemTextStyle={styles.indicatorText}
                            selectedItemTextStyle={styles.indicatorSelectedText}
                            selectedBorderStyle={styles.indicatorBorder}
                        />
                    }> */}
                <TabView
                    onIndexChange={index => this.setState({ index })}
                    navigationState={this.state.tabs}
                    renderTabBar={props => (
                        <TabBar
                            {...props}
                            activeColor={colors.primaryColor}
                            inactiveColor={colors.greyTextColor}
                            indicatorStyle={{ backgroundColor: colors.primaryColor }}
                            style={{ backgroundColor: colors.transparent }}
                        />
                    )}
                    renderScene={SceneMap({
                        first: () => 
                    < View style = {{ flex: 1, alignItems: 'center' }}>
                    <FlatList
                        ListEmptyComponent={
                            this.state.shouldshowDealsArrayPublishedEmpty &&
                            <View style={{ flex: 1, justifyContent: 'center', marginTop: 20 }}>
                                <TextComponent>{strings.no_records_found}</TextComponent>
                            </View>
                        }
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.pullToRefreshWorking}
                                onRefresh={() => {
                                    this.onPullToRefresh()
                                }} />
                        }
                        data={this.state.dealsArrayPublished}
                        renderItem={({ item, index }) =>
                            <View style={[commonStyles2.cardShadow, commonStyles2.cardMargins]}>
                                <View style={commonStyles2.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            this.dealDetailScreenIntent(item)
                                        }}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles2.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles2.productImage}
                                                    source={{
                                                        uri: item.productImage ? item.productImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                <ImageComponent
                                                    style={commonStyles2.cardBadgeIcon}
                                                    source={getIconByDealType(item.productType)} />

                                                <View style={[commonStyles.rowContainer, { position: 'absolute', left: 10, top: 10 }]}>
                                                    <ImageComponent
                                                        style={{}}
                                                        source={
                                                            require('../assets/publishedIcon.png')} />
                                                    {!item.productIsActive &&
                                                        <ImageComponent
                                                            style={{ marginLeft: 10 }}
                                                            source={require('../assets/inactive.png')} />
                                                    }
                                                </View>

                                                <View style={commonStyles2.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={commonStyles2.cardTitleText}>
                                                        {item.productTitle}
                                                    </TextComponent>
                                                </View>
                                            </View>
                                            <View style={[commonStyles2.cardDetailsContainer, {
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }]}>
                                                <View style={[commonStyles2.rowContainer, { alignItems: 'center' }]}>
                                                    <View>
                                                        <TextComponent style={commonStyles2.cardProductName}>
                                                            {item.businessName && parseTextForCard(item.businessName)}
                                                        </TextComponent>

                                                        {item.isDiscounted ?
                                                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles.cardDiscount]}>
                                                                    {item.discount + strings.percent_discount}
                                                                </TextComponent>
                                                            </View>
                                                            :
                                                            <View style={[commonStyles2.rowContainer, { marginTop: 3 }]}>
                                                                <TextComponent style={[commonStyles2.cardMRP, (typeof item.productOP == 'number' && commonStyles2.lineThrough)]}>
                                                                    {item.productMRP ? getCurrencyFormat(item.productMRP) :
                                                                        typeof item.productMRP == 'number' ? getCurrencyFormat(item.productMRP)
                                                                            : ""
                                                                    }
                                                                </TextComponent>
                                                                <TextComponent style={commonStyles2.cardOP}>
                                                                    {item.productOP ? getCurrencyFormat(item.productOP)
                                                                        : typeof item.productOP == 'number' ? getCurrencyFormat(item.productOP)
                                                                            : ""
                                                                    }
                                                                </TextComponent>
                                                            </View>
                                                        }
                                                    </View>
                                                    <SmallButtonComponent
                                                        icon={require('../assets/infoRound.png')}
                                                        onPress={() => {
                                                            if (item.productType === itemTypes.BONUS_DEAL) {
                                                                this.setState({
                                                                    schedulerProductPromotionEndDate: item.productPromotionEndDate,
                                                                    showBonusInfoPopup: true
                                                                });
                                                            } else {
                                                                this.fetchProductDetails(item)
                                                            }
                                                        }}>
                                                        {strings.info}
                                                    </SmallButtonComponent>
                                                </View>

                                                <View style={[commonStyles2.rowContainer, { marginTop: 2, justifyContent: 'center' }]}>
                                                    <View style={[commonStyles2.rowContainer, { position: 'absolute', left: 0 }]}>
                                                        <TextComponent style={[commonStyles2.cardLeftText, { color: colors.red, marginEnd: 10, fontFamily: fontNames.boldFont }]}>
                                                            {item.productNextAvailableStartDateTime ? parseDate(item.productNextAvailableStartDateTime) : ""}
                                                        </TextComponent>
                                                    </View>
                                                    <View>
                                                        <TextComponent style={[commonStyles2.cardLeftText, {}]}>
                                                            {
                                                                item.productNextAvailableStartDateTime ?
                                                                    parseTimeWithoutUnit(item.productNextAvailableStartDateTime)
                                                                    + " - " + parseTime2(item.productNextAvailableEndDateTime)
                                                                    : ""
                                                            }
                                                        </TextComponent>
                                                    </View>
                                                    <View style={[commonStyles2.rowContainer, { alignItems: 'center', position: 'absolute', right: 0 }]}>
                                                        <ImageComponent
                                                            source={require('../assets/locationBlack.png')} />
                                                        <TextComponent style={commonStyles2.cardDistance}>
                                                            xxx KM
                                                        </TextComponent>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                        style={{ height: '100%', marginTop: 10 }}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal={false}
                        onEndReached={({ distanceFromEnd }) => {
                            if (distanceFromEnd < 0) {
                                return;
                            }
                            isNetworkConnected().then((isConnected) => {
                                if (isConnected) {
                                    if (this.dealsArrayPublishedPaginationRequired && this.shouldHitPagination) {
                                        this.shouldHitPagination = false
                                        this.showModalLoader(true)
                                        this.dealsArrayPublishedIndex++
                                        this.getPublishedDeals()
                                    }
                                } else {
                                    alertDialog("", strings.internet_not_connected)
                                }
                            })
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            <View style={[commonStyles.container, commonStyles.centerInContainer,
                            { backgroundColor: colors.transparent, marginEnd: 15 }]}>
                                <LoaderComponent
                                    shouldShow={this.state.showHotDealLoader} />
                            </View>
                        }
                    />
                    </View>,
                    second: () => 
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <FlatList
                                ListEmptyComponent={
                                    this.state.shouldshowDealsArrayUnPublishedEmpty &&
                                    <View style={{ flex: 1, justifyContent: 'center', marginStart: 12 }}>
                                        <TextComponent>{strings.no_records_found}</TextComponent>
                                    </View>
                                }
                                refreshControl={
                                    <RefreshControl
                                        refreshing={this.state.pullToRefreshWorking}
                                        onRefresh={() => {
                                            this.onPullToRefresh()
                                        }} />
                                }
                                data={this.state.dealsArrayUnpublished}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles2.cardShadow, commonStyles2.cardMargins]}>
                                        <View style={commonStyles2.cardRadius}>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.dealDetailScreenIntent(item)
                                                }}>
                                                <View>
                                                    <View style={[{
                                                        width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                                    }, commonStyles2.centerInContainer]}>
                                                        <ImageComponent
                                                            source={require('../assets/placeholderLogo.png')} />
                                                        <FastImage
                                                            style={commonStyles2.productImage}
                                                            source={{
                                                                uri: item.productImage ? item.productImage : "",
                                                            }}
                                                            resizeMode={FastImage.resizeMode.cover}
                                                        />
                                                        <ImageComponent
                                                            style={commonStyles2.cardBadgeIcon}
                                                            source={getIconByDealType(item.productType)} />

                                                        <View style={[commonStyles.rowContainer, { position: 'absolute', left: 10, top: 10 }]}>
                                                            <ImageComponent
                                                                style={{}}
                                                                source={
                                                                    require('../assets/unpublishedIcon.png')
                                                                }
                                                            />
                                                            {!item.productIsActive &&
                                                                <ImageComponent
                                                                    style={{ marginLeft: 10 }}
                                                                    source={require('../assets/inactive.png')} />
                                                            }
                                                        </View>

                                                        <View style={commonStyles2.cardTitleContainer}>
                                                            <ImageComponent
                                                                source={require('../assets/cardFullTitleBg.png')} />
                                                            <TextComponent style={commonStyles2.cardTitleText}>
                                                                {item.productTitle}
                                                            </TextComponent>
                                                        </View>
                                                    </View>
                                                    <View style={[commonStyles2.cardDetailsContainer, {
                                                        width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                                    }]}>
                                                        <View style={[commonStyles2.rowContainer, { alignItems: 'center' }]}>
                                                            <View>
                                                                <TextComponent style={commonStyles2.cardProductName}>
                                                                    {parseTextForCard(item.businessName)}
                                                                </TextComponent>

                                                                {item.isDiscounted ?
                                                                    <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                                        <TextComponent style={[commonStyles.cardDiscount]}>
                                                                            {item.discount + strings.percent_discount}
                                                                        </TextComponent>
                                                                    </View>
                                                                    :
                                                                    <View style={[commonStyles2.rowContainer, { marginTop: 3 }]}>
                                                                        <TextComponent style={[commonStyles2.cardMRP, (typeof item.productOP == 'number' && commonStyles2.lineThrough)]}>
                                                                            {item.productMRP ? getCurrencyFormat(item.productMRP) :
                                                                                typeof item.productMRP == 'number' ? getCurrencyFormat(item.productMRP)
                                                                                    : ""
                                                                            }
                                                                        </TextComponent>
                                                                        <TextComponent style={commonStyles2.cardOP}>
                                                                            {item.productOP ? getCurrencyFormat(item.productOP)
                                                                                : typeof item.productOP == 'number' ? getCurrencyFormat(item.productOP)
                                                                                    : ""
                                                                            }
                                                                        </TextComponent>
                                                                    </View>
                                                                }
                                                            </View>
                                                            <SmallButtonComponent
                                                                icon={require('../assets/infoRound.png')}
                                                                onPress={() => {
                                                                    if (item.productType === itemTypes.BONUS_DEAL) {
                                                                        this.setState({
                                                                            schedulerProductPromotionEndDate: item.productPromotionEndDate,
                                                                            showBonusInfoPopup: true
                                                                        });
                                                                    } else {
                                                                        this.fetchProductDetails(item)
                                                                    }
                                                                }}>
                                                                {strings.info}
                                                            </SmallButtonComponent>
                                                        </View>

                                                        <View style={[commonStyles2.rowContainer, { marginTop: 2, justifyContent: 'center' }]}>

                                                            <View style={[commonStyles2.rowContainer, { position: 'absolute', left: 0 }]}>
                                                                <TextComponent style={[commonStyles2.cardLeftText, { color: colors.red, marginEnd: 10, fontFamily: fontNames.boldFont }]}>
                                                                    {item.productNextAvailableStartDateTime ? parseDate(item.productNextAvailableStartDateTime) : ""}
                                                                </TextComponent>
                                                            </View>
                                                            <View>
                                                                <TextComponent style={[commonStyles2.cardLeftText, {}]}>
                                                                    {
                                                                        item.productNextAvailableStartDateTime ?
                                                                            parseTimeWithoutUnit(item.productNextAvailableStartDateTime)
                                                                            + " - " + parseTime2(item.productNextAvailableEndDateTime)
                                                                            : ""
                                                                    }
                                                                </TextComponent>
                                                            </View>
                                                            <View style={[commonStyles2.rowContainer, { alignItems: 'center', position: 'absolute', right: 0 }]}>
                                                                <ImageComponent
                                                                    source={require('../assets/locationBlack.png')} />
                                                                <TextComponent style={commonStyles2.cardDistance}>
                                                                    xxx KM
                                                                </TextComponent>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </View>
                                }
                                showsVerticalScrollIndicator={false}
                                style={[styles.flatList, { marginTop: 10 }]}
                                keyExtractor={(item, index) => index.toString()}
                                horizontal={false}
                                onEndReached={({ distanceFromEnd }) => {
                                    if (distanceFromEnd < 0) {
                                        return;
                                    }
                                    isNetworkConnected().then((isConnected) => {
                                        if (isConnected) {
                                            if (this.dealsArrayUnpublishedPaginationRequired && this.shouldHitPagination) {
                                                this.shouldHitPagination = false
                                                this.showModalLoader(true)
                                                this.dealsArrayUnpublishedIndex++
                                                this.getUnpublishedDeals()
                                            }
                                        } else {
                                            alertDialog("", strings.internet_not_connected)
                                        }
                                    })
                                }}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={
                                    <View style={[commonStyles.container, commonStyles.centerInContainer,
                                    { backgroundColor: colors.transparent, marginEnd: 15 }]}>
                                        <LoaderComponent
                                            shouldShow={this.state.showHotDealLoader} />
                                    </View>
                                }
                            />
                        </View>,
                        })}
/>
            </View >
        );
    }

componentDidMount() {
    this.didFocusSubscription = this.props.navigation.addListener(
        'didFocus',
        payload => {
            // Not required now
            // this.hitAllApis()
        }
    );

    this.hitAllApis()
}

// hit all required apis of the screen
hitAllApis = () => {
    isNetworkConnected().then((isConnected) => {
        if (isConnected) {
            this.dealsArrayPublishedIndex = 1
            this.dealsArrayUnpublishedIndex = 1
            this.apiCount = 0

            this.setState({
                dealsArrayPublished: [],
                dealsArrayUnpublished: [],
                showModalLoader: true,
            }, () => {
                this.getPublishedDeals()
                this.getUnpublishedDeals()
            })
        } else {
            this.setState({
                pullToRefreshWorking: false,
            }, () => {
                alertDialog("", strings.internet_not_connected)
            })
        }
    })
}

componentWillUnmount() {
    if (this.didFocusSubscription) {
        this.didFocusSubscription.remove();
    }
}

// api to get product's details
fetchProductDetails = (item) => {
    getCommonParamsForAPI().then((commonParams) => {
        const params = {
            ...commonParams,
            productId: item.productId,
            lat: item.productLng,
            lng: item.productLat,
            timeOffset: getTimeOffset(),
        }
        hitApi(urls.GET_PRODUCT_DETAIL_ENT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
            setTimeout(() => {
                this.setState({
                    scheduleType: jsonResponse.response.scheduleType,
                    schedulerRedemptionStartDate: jsonResponse.response.productRedemptionStartDate,
                    schedulerRedemptionEndDate: jsonResponse.response.productRedemptionEndDate,
                    schedulerData: jsonResponse.response.productScheduler,
                    productTypeForSchedule: jsonResponse.response.productType,
                    showInfoPopup: true
                })
            }, constants.HANDLING_TIMEOUT)
        })
    })
}

dealDetailScreenIntent(item) {
    this.props.navigation.navigate(screenNames.HOT_DEAL_DETAIL_SCREEN, {
        PRODUCT_ID: item.productId,
        PRODUCT_LAT: item.productLng,
        PRODUCT_LNG: item.productLat,
        TYPE_OF_DEAL: this.typeOfIntent
    })
}

// api to get published deals
getPublishedDeals() {
    getCommonParamsForAPI().then((commonParams) => {
        const params = {
            ...commonParams,
            type: this.typeOfIntent,
            timeOffset: getTimeOffset(),
            publishStatus: true,
            pageIndex: this.dealsArrayPublishedIndex,
            pageSize: constants.PAGE_SIZE
        }

        this.apiCount++
        hitApi(urls.GET_PRODUCTS, urls.POST, params, null, (jsonResponse) => {
            if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                this.dealsArrayPublishedPaginationRequired = false
            }

            this.setState({
                dealsArrayPublished: [...this.state.dealsArrayPublished, ...jsonResponse.response.data],
                pullToRefreshWorking: false,
                shouldshowDealsArrayPublishedEmpty: true
            }, () => {
                this.shouldHitPagination = true
                this.apiCount--
                this.showModalLoader(false)
            })
        }, (jsonResponse) => {
            this.shouldHitPagination = true
            this.apiCount = 0
            this.showModalLoader(false)
            handleErrorResponse(this.props.navigation, jsonResponse)
        })
    })
}

// api to get unpublished deals
getUnpublishedDeals() {
    getCommonParamsForAPI().then((commonParams) => {
        const params = {
            ...commonParams,
            type: this.typeOfIntent,
            timeOffset: getTimeOffset(),
            publishStatus: false,
            pageIndex: this.dealsArrayUnpublishedIndex,
            pageSize: constants.PAGE_SIZE,
        }

        this.apiCount++
        hitApi(urls.GET_PRODUCTS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
            if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                this.dealsArrayUnpublishedPaginationRequired = false
            }
            this.setState({
                dealsArrayUnpublished: [...this.state.dealsArrayUnpublished, ...jsonResponse.response.data],
                pullToRefreshWorking: false,
                shouldshowDealsArrayUnPublishedEmpty: true
            }, () => {
                this.shouldHitPagination = true
                this.apiCount--
                this.showModalLoader(false)
            })
        }, (jsonResponse) => {
            this.shouldHitPagination = true
            this.apiCount = 0
            this.showModalLoader(false)
            handleErrorResponse(this.props.navigation, jsonResponse)
        })
    })
}

showModalLoader = (shouldShow) => {
    if (shouldShow) {
        this.setState({
            showModalLoader: shouldShow,
        })
    } else {
        if (this.apiCount === 0) {
            this.setState({
                showModalLoader: shouldShow,
                pullToRefreshWorking: false,
            })
        } else {
            this.setState({
                pullToRefreshWorking: false,
            })
        }
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
});
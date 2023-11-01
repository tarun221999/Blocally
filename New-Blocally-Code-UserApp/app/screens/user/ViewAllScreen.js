import React, { Component } from 'react'
import { View, StyleSheet, FlatList, TouchableOpacity, TouchableWithoutFeedback, Modal, Platform, PermissionsAndroid, Linking, AppState } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import HeaderComponent from '../../components/HeaderComponent'
import ImageComponent from '../../components/ImageComponent';
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    constants, categoryTypes, urls, fontNames, sizes, scheduleTypes,
    itemTypes, screenNames, productSortBy, productOrderBy, statsTypes
} from '../../config/constants'
import {
    getCommonParamsForAPI, getImageDimensions, getScreenDimensions, parseTextForCard,
    getTimeOffset, parseDate, parseTime, parseDateTime, isNetworkConnected,
    getCurrencyFormat, parseTimeWithoutUnit, alertDialog, handleErrorResponse, getUTCDateTimeFromLocalDateTime,
    getLocalDateTimeFromLocalDateTime,
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import FastImage from 'react-native-fast-image'
import SmallButtonComponent from '../../components/SmallButtonComponent'
import { Calendar, } from 'react-native-calendars'
import Geolocation from 'react-native-geolocation-service';

/**
 * View All Products Screen
 */
export default class ViewAllScreen extends Component {
    constructor(props) {
        super(props)
        this.changeEventListener = null
        this.state = {
            showModalLoader: false,
            showInfoPopup: false,
            showFilter: false,
            mainData: [],
            pullToRefreshWorking: false,
            // adsArray: [],
            currentSortBy: productSortBy.DATE,
            currentOrderBy: productOrderBy.ASCENDING,

            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            schedulerData: [],
            productTypeForSchedule: null,

            specificDate: strings.choose_date,
            showDatePicker: false,
            showNoCategories: false,
        }

        this.todayDate = new Date()
        this.specificFromDateUTC = null
        this.specificToDateUTC = null
        this.sortByValue = productSortBy.DATE

        this.isComingFromSettings = false
        this.latitude = 0
        this.longitude = 0
        // this.itemType = this.props.navigation.state.params.ITEM_TYPE
        this.itemType = itemTypes.ACTION

        this.apiCount = 0

        this.shouldHitPagination = true

        this.screenDimensions = getScreenDimensions()
        this.cardUpperBgImage = getImageDimensions(require('../../assets/cardUpperBg.png'))
        this.cardLowerBgWithCut = getImageDimensions(require('../../assets/cardLowerBgWithCut.png'))
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    // title={this.itemType === itemTypes.HOT_DEAL ? strings.hot_deals :
                    //     this.itemType === itemTypes.ACTION ? strings.actions :
                    //         strings.events}
                    title={strings.mein_regensburg}
                    navigation={this.props.navigation}
                    icon={this.state.showFilter ? require('../../assets/filterSelected.png') : require('../../assets/filter.png')}
                    onIconPress={() => {
                        this.changeShowFilterVisibility(!this.state.showFilter)
                    }}
                    isHomeScreen={true} 
                />

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

                {this.state.showDatePicker &&
                    <Modal
                        transparent={true}>
                        <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                            <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                                <TouchableOpacity
                                    style={{ marginStart: 'auto', padding: 10}}
                                    onPress={() => {
                                        this.setState({ showDatePicker: false })
                                    }}>
                                    <ImageComponent source={require('../../assets/crossPurple.png')} style={{width: 15, height: 15}}/>
                                </TouchableOpacity>
                                <View>
                                <Calendar
                                    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
                                    minDate={this.todayDate}
                                    // Handler which gets executed on day press. Default = undefined
                                    onDayPress={(day) => {
                                        let selectedDate = new Date(day.year, (day.month - 1), day.day)

                                        let date = selectedDate.getDate()
                                        if (date < 10) {
                                            date = "0" + date
                                        }

                                        let month = selectedDate.getMonth() + 1
                                        if (month < 10) {
                                            month = "0" + month
                                        }

                                        let strDate = date + "." + month + "." + selectedDate.getFullYear()

                                        let filterFromDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0)
                                        let filterToDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 0, 0)

                                        this.specificFromDateUTC = getLocalDateTimeFromLocalDateTime(filterFromDate)
                                        this.specificToDateUTC = getLocalDateTimeFromLocalDateTime(filterToDate)

                                        this.sortByValue = productSortBy.SPECIFIC_DATE

                                        this.setState({
                                            specificDate: strDate,
                                            currentSortBy: productSortBy.SPECIFIC_DATE,
                                            currentOrderBy: null,
                                            showDatePicker: false
                                        }, () => {
                                            this.hitAllApis()
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
                        </View>
                    </Modal>
                }

                <View style={commonStyles.container}>
                    {/* The following code was for Ads, commenting as not required
                    
                    <View style={[commonStyles.headerBorder, commonStyles.centerInContainer, {
                        width: '100%', height: this.headerImageHeight, backgroundColor: colors.white
                    }]}>
                        <ImageComponent
                            source={this.itemType === itemTypes.HOT_DEAL ? require('../../assets/hotDealsHeader.png')
                                : this.itemType === itemTypes.ACTION ? require('../../assets/actionsHeader.png')
                                    : require('../../assets/eventsHeader.png')}
                            style={{ resizeMode: 'cover', width: '100%', height: '100%', }} />
                        {this.state.adsArray.length > 0 &&
                            <IndicatorViewPager
                                style={styles.adsViewPager}
                                onPageSelected={(index) => {
                                    this.currentAdIndex = index.position
                                }}
                                ref={(ref) => { this.viewPager = ref }}
                                indicator={<PagerDotIndicator pageCount={this.state.adsArray.length} />}
                                autoPlayEnable={true}
                                autoPlayInterval={constants.ADS_INTERVAL}>
                                {this.state.adsArray}
                            </IndicatorViewPager>
                        }
                    </View> */}
                    <FlatList
                        data={this.state.mainData}
                        extraData={this.state}
                        onRefresh={this.onPullToRefresh}
                        refreshing={this.state.pullToRefreshWorking}
                        ListHeaderComponent={
                            <HeaderComponent
                                image={this.itemType === itemTypes.HOT_DEAL ? require('../../assets/hotDealsHeader.png')
                                    : this.itemType === itemTypes.ACTION ? require('../../assets/actionsHeader.png')
                                        : require('../../assets/eventsHeader.png')} />
                        }
                        renderItem={({ item }) =>
                            <View>
                                <View style={styles.view}>
                                    <TextComponent style={styles.headingText}>
                                        {parseTextForCard(item.catName, 28)}
                                    </TextComponent>

                                    <TouchableOpacity
                                        style={styles.viewAllTouch}
                                        onPress={() => {
                                            if (item.data && item.data.length > 0) {
                                                const chosenCategory = {
                                                    catId: item.catId,
                                                    catName: item.catName,
                                                    catImage: item.catImage
                                                }
                                                this.props.navigation.navigate(screenNames.SUB_CATEGORIES_SCREEN, {
                                                    ITEM_TYPE: this.itemType,
                                                    CHOSEN_CATEGORY: chosenCategory
                                                });
                                            }
                                        }}>

                                        <ImageComponent
                                            source={require('../../assets/Menu_h2.png')} />
                                    </TouchableOpacity>
                                </View>

                                <FlatList
                                    data={item.data}
                                    extraData={this.state}
                                    renderItem={({ item }) =>
                                        <View style={[commonStyles.cardShadow, commonStyles.cardMargins]}>
                                            <View style={commonStyles.cardRadius}>
                                                <TouchableWithoutFeedback
                                                    onPress={() => {
                                                        item.productType === itemTypes.HOT_DEAL ?
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
                                                                                    (typeof item.productMRP == 'number') ? getCurrencyFormat(item.productMRP) : ""}
                                                                            </TextComponent>
                                                                            <TextComponent style={commonStyles.cardOP}>
                                                                                {item.productOP ? getCurrencyFormat(item.productOP) :
                                                                                    (typeof item.productOP == 'number') ? getCurrencyFormat(item.productOP) : ""}
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
                                    keyExtractor={(item, index) => item.productId.toString() }
                                    horizontal={true}
                                    style={styles.nestedFlatList}
                                    onEndReached={({ distanceFromEnd }) => {
                                        if (distanceFromEnd == 0) {
                                            return;
                                        }
                                        isNetworkConnected().then((isConnected) => {
                                            if (isConnected) {
                                                if (item.paginationRequired && this.shouldHitPagination) {
                                                    this.shouldHitPagination = false
                                                    this.showModalLoader(true)
                                                    item.pageIndex++
                                                    this.apiCount++
                                                    this.fetchData(item)
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
                                                shouldShow={item.showLoader} />
                                        </View>
                                    }
                                    ListEmptyComponent={
                                        item.showNoRecordFound &&
                                        <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                            <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginStart: 12 }}>
                                                {strings.no_records_found}
                                            </TextComponent>
                                        </View>
                                    }
                                />

                            </View>
                        }
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        style={styles.flatList}
                        keyExtractor={(item, index) => item.catId ? item.catId.toString() : index.toString()}
                        ListEmptyComponent={
                            this.state.showNoCategories &&
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                    {strings.no_records_found}
                                </TextComponent>
                            </View>
                        }
                    />
                    {this.state.showFilter &&
                        <View style={[commonStyles.rowContainer, commonStyles.elevationAndShadow, commonStyles.filtersView]}>
                            <ButtonComponent
                                isFillRequired={this.state.currentSortBy === productSortBy.DISTANCE ?
                                    true : false}
                                icon={this.state.currentSortBy === productSortBy.DISTANCE ?
                                    require('../../assets/locationWhite.png') :
                                    require('../../assets/locationPinPurple.png')}
                                iconStyle={{ marginRight: 5 }}
                                rightIcon={this.state.currentOrderBy === productOrderBy.ASCENDING ? require('../../assets/upArrow.png') :
                                    require('../../assets/downArrow.png')}
                                rightIconStyle={{ marginLeft: 5 }}
                                style={{ width: '33%', height: 20, marginEnd: 5, padding: 0, paddingHorizontal: 5 }}
                                fontStyle={{ fontSize: sizes.smallTextSize }}
                                onPress={() => {
                                    this.specificFromDateUTC = null;
                                    this.specificToDateUTC = null;
                                    this.setState({
                                        showDatePicker: false,
                                        specificDate: strings.choose_date,
                                        currentSortBy: productSortBy.DISTANCE,
                                        currentOrderBy: this.sortByValue === productSortBy.DISTANCE ?
                                            this.state.currentOrderBy === productOrderBy.ASCENDING ?
                                                productOrderBy.DESCENDING : productOrderBy.ASCENDING
                                            : productOrderBy.ASCENDING
                                    }, () => {
                                        this.hitAllApis()
                                    })
                                    this.sortByValue = productSortBy.DISTANCE
                                }}>
                                {strings.sort_by_distance}
                            </ButtonComponent>

                            <ButtonComponent
                                isFillRequired={this.state.currentSortBy === productSortBy.DATE ?
                                    true : false}
                                icon={this.state.currentSortBy === productSortBy.DATE ?
                                    require('../../assets/calendarWhite.png') :
                                    require('../../assets/calendarPurple.png')}
                                iconStyle={{ marginRight: 5, width: 10, height: 10 }}
                                rightIcon={this.state.currentOrderBy === productOrderBy.ASCENDING ? require('../../assets/upArrow.png') :
                                    require('../../assets/downArrow.png')}
                                rightIconStyle={{ marginLeft: 5 }}
                                style={{ width: '30%', height: 20, marginLeft: 5, padding: 0, paddingHorizontal: 5 }}
                                fontStyle={{ fontSize: sizes.smallTextSize }}
                                onPress={() => {
                                    this.specificFromDateUTC = null;
                                    this.specificToDateUTC = null;
                                    this.setState({
                                        showDatePicker: false,
                                        specificDate: strings.choose_date,
                                        currentSortBy: productSortBy.DATE,
                                        currentOrderBy: this.sortByValue === productSortBy.DATE ?
                                            this.state.currentOrderBy === productOrderBy.ASCENDING ?
                                                productOrderBy.DESCENDING : productOrderBy.ASCENDING
                                            : productOrderBy.ASCENDING
                                    }, () => {
                                        this.hitAllApis()
                                    })
                                    this.sortByValue = productSortBy.DATE
                                }}>
                                {strings.filter_by_date}
                            </ButtonComponent>
                            <ButtonComponent
                                isFillRequired={this.state.currentSortBy === productSortBy.SPECIFIC_DATE ?
                                    true : false}
                                icon={this.state.currentSortBy === productSortBy.SPECIFIC_DATE ?
                                    require('../../assets/calendar31White.png') :
                                    require('../../assets/calendar31.png')}
                                iconStyle={{ marginRight: 5 }}
                                style={{ width: '28%', height: 20, marginLeft: 5, padding: 0, paddingHorizontal: 5 }}
                                fontStyle={{ fontSize: sizes.smallTextSize }}
                                onPress={() => {
                                    this.setState({
                                        showDatePicker: true
                                    })
                                }}>
                                {this.state.specificDate}
                            </ButtonComponent>
                        </View>
                    }
                </View>
            </View>
        );
    }

    componentDidMount() {
        this.changeEventListener = AppState.addEventListener('change', this._handleAppStateChange);
        this.checkIfPermissionGranted();
    }

    componentWillUnmount() {
        if (this.changeEventListener) {
            this.changeEventListener.remove();
        };
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active' && this.isComingFromSettings) {
            this.isComingFromSettings = false
            this.checkIfPermissionGranted();
        }
    };

    checkIfPermissionGranted() {
        if (Platform.OS == constants.ANDROID) {
            if (Platform.Version >= 23) {
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                    .then(response => {
                        if (response == true) {
                            this.checkForLocation();
                        } else {
                            this.requestPermission();
                        }
                    });
            } else {
                this.checkForLocation();
            }
        } else {
            this.checkForLocation();
        }
    }

    requestPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: strings.permission_title,
                    message: strings.permission_message,
                    buttonPositive: strings.ok,
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                this.checkForLocation();
            } else {
                alertDialog(strings.permission_title, strings.permission_must, strings.ok, "", () => {
                    this.isComingFromSettings = true
                    Linking.openSettings();
                })
            }
        } catch (err) {
            console.log("request permission error " + err.toString());
        }
    }

    // Get the current location
    checkForLocation() {
        this.setState({
            showModalLoader: true
        }, () => {
            Geolocation.getCurrentPosition(
                (position) => {
                    this.setState({
                        showModalLoader: false,
                        pullToRefreshWorking: false,
                    }, () => {
                        this.latitude = position.coords.latitude
                        this.longitude = position.coords.longitude

                        // hit APIs
                        this.hitAllApis()

                        // save/update position in async storage
                        AsyncStorageHelper.saveStringAsync(constants.COORDINATES, JSON.stringify(position.coords))
                    })
                },
                (error) => {
                    this.setState({
                        showModalLoader: false,
                        pullToRefreshWorking: false,
                    }, () => {
                        if (error.code == 1) {
                            if (Platform.OS === constants.IOS) {
                                alertDialog(strings.permission_title, strings.permission_must, strings.ok, "", () => {
                                    this.isComingFromSettings = true
                                    Linking.openSettings();
                                })
                            }
                        }
                        if (error.code == 2) {
                            if (Platform.OS === constants.IOS) {
                                this.isComingFromSettings = true
                                Linking.openSettings();
                            } else {
                                alertDialog(strings.permission_title, strings.location_off, strings.ok, "", () => {
                                    this.checkForLocation();
                                })
                            }
                        }
                        if (error.code == 5) {
                            if (Platform.OS === constants.ANDROID) {
                                alertDialog(strings.permission_title, strings.location_off, strings.ok, "", () => {
                                    this.checkForLocation();
                                })
                            }
                        }
                    })
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, }
            );
        })
    }

    // Hit All required APIs
    hitAllApis = () => {
        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                this.setState({
                    mainData: [],
                    showNoCategories: false,
                }, () => {
                    this.shouldHitPagination = true
                    this.showModalLoader(true)
                    this.fetchCategories()
                    // this.fetchAds()
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

    onPullToRefresh = () => {
        this.apiCount = 0;
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.checkIfPermissionGranted()
        })
    }

    changeShowFilterVisibility = (visible) => {
        this.setState({
            showFilter: visible
        })
    }

    // Get the categories from API
    fetchCategories = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: this.itemType,
                catType: categoryTypes.CATEGORY,
                catParentId: null,
                searchText: "",
            }

            hitApi(urls.GET_CATEGORY, urls.POST, params, null, (jsonResponse) => {
                jsonResponse.response.data.map((item, key) => {
                    item.index = key
                    item.data = []
                    item.pageIndex = 1
                    item.paginationRequired = true
                    item.showLoader = false
                    item.showNoRecordFound = false
                })

                this.setState({
                    pullToRefreshWorking: false,
                    mainData: jsonResponse.response.data,
                    showNoCategories: true,
                }, () => {
                    if (jsonResponse.response.data.length > 0) {
                        jsonResponse.response.data.map((item, key) => {
                            this.apiCount++
                            this.fetchData(item, key)
                        })
                    } else {
                        this.apiCount = 0
                        this.showModalLoader(false)
                    }
                })
            }, (jsonResponse) => {
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    /* fetchAds = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: this.itemType,
            }

            hitApi(urls.GET_ADVERTISEMENTS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (!jsonResponse.response.data || jsonResponse.response.data.length == 0) {
                    // Ads not available
                } else {
                    const adsArray = jsonResponse.response.data.map((item, key) => {
                        return (
                            <View>
                                <FastImage
                                    source={{
                                        uri: item.advImage,
                                    }}
                                    resizeMode={FastImage.resizeMode.cover}
                                    style={[commonStyles.container, { backgroundColor: colors.white }]}
                                />
                            </View>
                        )
                    })
                    setTimeout(() => {
                        this.setState({
                            adsArray: adsArray
                        })
                    }, 2000)
                }
            })
        })
    } */

    // Get Products for each Category
    fetchData = (item) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                type: this.itemType,
                category: item.catId,
                subCategory: null,
                filterCategory: null,
                pageIndex: item.pageIndex,
                pageSize: constants.PAGE_SIZE,
                sortBy: this.state.currentSortBy,
                orderBy: this.state.currentOrderBy,
                timeOffset: getTimeOffset(),
                dateFrom: this.specificFromDateUTC,
                dateTo: this.specificToDateUTC,
            }

            hitApi(urls.GET_PRODUCTS, urls.POST, params, (shouldShow) => {
                item.showLoader = shouldShow
                let tempObj = this.state.mainData
                tempObj[item.index] = item
                this.setState({
                    mainData: tempObj
                })
            }, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    item.paginationRequired = false
                }

                let tempObj = this.state.mainData
                item.data.push(...jsonResponse.response.data)
                item.showNoRecordFound = true
                tempObj[item.index] = item
                this.setState({
                    mainData: tempObj
                }, () => {
                    this.apiCount--
                    this.showModalLoader(false)
                    this.shouldHitPagination = true
                })
            }, (jsonResponse) => {
                this.apiCount = 0
                this.showModalLoader(false)
                this.shouldHitPagination = true
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get Product's details
    fetchProductDetails = (productId) => {
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
                setTimeout(() => {
                    this.setState({
                        scheduleType: jsonResponse.response[0].scheduleType,
                        schedulerRedemptionStartDate: jsonResponse.response[0].productRedemptionStartDate,
                        schedulerRedemptionEndDate: jsonResponse.response[0].productRedemptionEndDate,
                        schedulerData: jsonResponse.response[0].productScheduler,
                        productTypeForSchedule: jsonResponse.response[0].productType,
                        showInfoPopup: true
                    })
                }, constants.HANDLING_TIMEOUT)
            })
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
}

const styles = StyleSheet.create({
    adsViewPager: {
        height: '100%',
        width: '100%',
        position: 'absolute',
        backgroundColor: colors.transparent,
    },
    flatList: {

    },
    view: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    headingText: {
        color: colors.black,
        fontFamily: fontNames.boldFont,
        marginStart: 23,
        fontSize: 17,
    },
    viewAllTouch: {
        marginStart: 'auto',
        marginEnd: 15,
    },
    viewAll: {
        color: colors.blueTextColor,
        padding: 5,
    },
    nestedFlatList: {
        paddingStart: 10,
        minHeight: constants.MIN_HEIGHT_FOR_FLAT_LIST,
    }
});
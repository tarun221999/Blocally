import React, { Component } from 'react'
import {
    View, StyleSheet, FlatList, ScrollView, RefreshControl, TouchableOpacity,
    TouchableWithoutFeedback, Platform, Modal, AppState, PermissionsAndroid, Linking,
} from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import HeaderComponent from '../../components/HeaderComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    constants, categoryTypes, urls, productSortBy, scheduleTypes,
    fontNames, sizes, itemTypes, screenNames, productOrderBy, statsTypes
} from '../../config/constants'
import {
    getScreenDimensions, getCommonParamsForAPI, getImageDimensions, parseDateTime, parseTimeWithoutUnit,
    parseDiscountApplied, parseTextForCard, parseDate, parseTime, getCurrencyFormat, handleErrorResponse, getTimeOffset, 
    getUTCDateTimeFromLocalDateTime, isNetworkConnected, alertDialog, getLocalDateTimeFromLocalDateTime,
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import FastImage from 'react-native-fast-image'
// import { IndicatorViewPager, PagerDotIndicator } from 'react-native-best-viewpager'
import SmallButtonComponent from '../../components/SmallButtonComponent'
import { Calendar, } from 'react-native-calendars'
import Geolocation from 'react-native-geolocation-service';

export default class SubCategoriesScreen extends Component {
    constructor(props) {
        super(props)
        this.changeEventListener = null
        this.screenDimensions = getScreenDimensions()
        this.subCategoryViewHeight = this.screenDimensions.width * 0.200
        this.subCategoryViewWidth = this.screenDimensions.width * 0.357

        this.itemType = this.props.navigation.state.params.ITEM_TYPE
        this.chosenCategory = this.props.navigation.state.params.CHOSEN_CATEGORY

        this.pageIndex = 1
        this.paginagionRequired = true

        this.currentAdIndex = 0
        this.isComingFromSettings = false
        this.latitude = 0
        this.longitude = 0

        this.shouldHitPagination = true

        this.state = {
            showModalLoader: false,
            showInfoPopup: false,
            subCategoriesArray: [],
            showContentLoader: false,
            contentArray: [],
            pullToRefreshWorking: false,
            showFilter: false,
            currentSortBy: productSortBy.DATE,
            currentOrderBy: productOrderBy.ASCENDING,
            currentSubCategory: null,

            scheduleType: scheduleTypes.DAYS,
            schedulerRedemptionStartDate: null,
            schedulerRedemptionEndDate: null,
            schedulerData: [],
            productTypeForSchedule: null,

            specificDate: strings.choose_date,
            showDatePicker: false,

            showNoProducts: false,
        }
        this.todayDate = new Date()
        this.specificFromDateUTC = null
        this.specificToDateUTC = null
        this.sortByValue = productSortBy.DATE

        this.headerImageHeight = getImageDimensions(require('../../assets/hotDealsHeader.png')).height
        this.cardFullUpperBgImage = getImageDimensions(require('../../assets/cardFullUpperBg.png'))
        this.cardFullRedStripImage = getImageDimensions(require('../../assets/cardFullRedStrip.png'))
        this.cardFullLowerBgWithCut = getImageDimensions(require('../../assets/cardFullLowerBgWithCut.png'))
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={this.chosenCategory.catName}
                    navigation={this.props.navigation}
                    icon={this.state.showFilter ? require('../../assets/filterSelected.png') : require('../../assets/filter.png')}
                    onIconPress={() => {
                        this.changeShowFilterVisibility(!this.state.showFilter)
                    }} />

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
                                    style={{ marginStart: 'auto', padding: 10 }}
                                    onPress={() => {
                                        this.setState({ showDatePicker: false })
                                    }}>
                                    <ImageComponent source={require('../../assets/crossPurple.png')}  style={{width: 15, height: 15}}/>
                                </TouchableOpacity>
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
                                        
                                        // DateTimeChange - Changing From UTC Date time to Local Date Time
                                        this.specificFromDateUTC = getLocalDateTimeFromLocalDateTime(filterFromDate)
                                        this.specificToDateUTC = getLocalDateTimeFromLocalDateTime(filterToDate)

                                        this.sortByValue = productSortBy.SPECIFIC_DATE

                                        this.setState({
                                            specificDate: strDate,
                                            currentSortBy: productSortBy.SPECIFIC_DATE,
                                            currentOrderBy: null,
                                            showDatePicker: false
                                        }, () => {
                                            this.reloadData()
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

                <View style={commonStyles.container}>
                    <View style={commonStyles.container}>

                        {/* This empty view is required */}
                        <View style={commonStyles.elevationAndShadow}>
                            <FlatList
                                data={this.state.subCategoriesArray}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.cardShadow, styles.subcategoryView, {
                                        backgroundColor: colors.transparent, height: this.subCategoryViewHeight,
                                        marginStart: 12, marginTop: 6, marginBottom: 20,
                                        marginEnd: index === this.state.subCategoriesArray.length - 1 ? 25 : 15,
                                    }]}>
                                        <View style={commonStyles.cardRadius}>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.setState(previousState => ({
                                                        currentSubCategory: (previousState.currentSubCategory === item.catId) ? null : item.catId,
                                                    }), () => {
                                                        this.reloadData()
                                                    })
                                                }}>
                                                <View style={{
                                                    width: this.subCategoryViewWidth, height: this.subCategoryViewHeight,
                                                    backgroundColor: colors.white
                                                }}>
                                                    <View style={{
                                                        width: '100%', height: '100%',
                                                        justifyContent: 'center', alignItems: 'center',
                                                        position: 'absolute'
                                                    }}>
                                                        <ImageComponent source={require('../../assets/placeholderLogo.png')} />
                                                        <FastImage
                                                            style={commonStyles.productImage}
                                                            source={{
                                                                uri: item.catImage ? item.catImage : "",
                                                            }}
                                                            resizeMode={FastImage.resizeMode.stretch}
                                                        />
                                                    </View>
                                                    <View
                                                        style={styles.overlayForText}>
                                                        <TextComponent style={styles.subCategoryText}>
                                                            {item.catName}
                                                        </TextComponent>
                                                        {this.state.currentSubCategory === item.catId &&
                                                            <ImageComponent
                                                                source={require('../../assets/selected.png')}
                                                                style={{ position: 'absolute', end: 0, top: 0 }} />
                                                        }
                                                    </View>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </View>
                                }
                                showsHorizontalScrollIndicator={false}
                                style={styles.subCategoriesFlatList}
                                keyExtractor={(item, index) => index.toString()}
                                horizontal={true}
                            />
                        </View>

                        <FlatList
                            data={this.state.contentArray}
                            extraData={this.state}
                            refreshing={this.state.pullToRefreshWorking}
                            onRefresh={this.onPullToRefresh}
                            renderItem={({ item, index }) =>
                                <View style={{
                                    alignItems: 'center', marginTop: index === 0 ? 10 : 0,
                                    marginBottom: index === this.state.contentArray.length - 1 ? 10 : 0
                                }}>
                                    <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                        marginStart: 0,
                                        marginEnd: 0,
                                    }]}>
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
                                                        width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                                    }, commonStyles.centerInContainer]}>
                                                        <ImageComponent
                                                            source={require('../../assets/placeholderLogo.png')} />
                                                        <FastImage
                                                            style={commonStyles.productImage}
                                                            source={{
                                                                uri: item.productImage ? item.productImage : "",
                                                            }}
                                                            resizeMode={FastImage.resizeMode.cover} />
                                                        {item.productType === itemTypes.HOT_DEAL &&
                                                            <ImageComponent
                                                                style={commonStyles.cardBadgeIcon}
                                                                source={require('../../assets/hotDeal.png')} />
                                                        }
                                                        <View style={commonStyles.cardTitleContainer}>
                                                            <ImageComponent
                                                                source={require('../../assets/cardFullTitleBg.png')} />
                                                            <TextComponent style={commonStyles.cardBigTitleText}>
                                                                {item.productTitle}
                                                            </TextComponent>
                                                        </View>
                                                    </View>
                                                    <View style={[commonStyles.cardDetailsContainer, {
                                                        width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
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
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item, index) => index.toString()}
                            onEndReached={({ distanceFromEnd }) => {
                                if (distanceFromEnd == 0) {
                                    return;
                                }
                                isNetworkConnected().then((isConnected) => {
                                    if (isConnected) {
                                        if (this.paginagionRequired && this.shouldHitPagination) {
                                            this.shouldHitPagination = false
                                            this.pageIndex++
                                            this.showModalLoader(true);
                                            this.fetchContents()
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
                                        shouldShow={this.state.showContentLoader} />
                                </View>
                            }
                            ListEmptyComponent={
                                this.state.showNoProducts &&
                                <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                    <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                        {strings.no_records_found}
                                    </TextComponent>
                                </View>
                            }
                        />
                    </View>

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
                                style={{ width: '33%', height: 20, marginRight: 5, padding: 0, paddingHorizontal: 5 }}
                                fontStyle={{ fontSize: sizes.smallTextSize }}
                                onPress={() => {
                                    this.specificFromDateUTC = null;
                                    this.specificToDateUTC = null;
                                    this.setState({
                                        specificDate: strings.choose_date,
                                        currentSortBy: productSortBy.DISTANCE,
                                        currentOrderBy: this.sortByValue === productSortBy.DISTANCE ?
                                            this.state.currentOrderBy === productOrderBy.ASCENDING ?
                                                productOrderBy.DESCENDING : productOrderBy.ASCENDING
                                            : productOrderBy.ASCENDING
                                    }, () => {
                                        this.reloadData()
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
                                        specificDate: strings.choose_date,
                                        currentSortBy: productSortBy.DATE,
                                        currentOrderBy: this.sortByValue === productSortBy.DATE ?
                                            this.state.currentOrderBy === productOrderBy.ASCENDING ?
                                                productOrderBy.DESCENDING : productOrderBy.ASCENDING
                                            : productOrderBy.ASCENDING
                                    }, () => {
                                        this.reloadData()
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
                                style={{ width: '28%', height: 20, marginLeft: 5, padding: 0 }}
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
        }
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active' && this.isComingFromSettings) {
            this.isComingFromSettings = false
            this.checkIfPermissionGranted();
        }
    };

    // check for location permission
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

    // ask for location permission
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

    // get latest location
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

    // Reload all data
    reloadData = () => {
        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                this.pageIndex = 1
                this.setState({
                    contentArray: [],
                    showNoProducts: false,
                }, () => {
                    this.paginagionRequired = true
                    this.shouldHitPagination = true
                    this.showModalLoader(true);
                    this.fetchContents()
                })
            } else {
                alertDialog("", strings.internet_not_connected)
            }
        })
    }

    // Hit all APIs for this screen
    hitAllApis = () => {
        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                this.setState({
                    subCategoriesArray: [],
                    contentArray: [],
                    showNoProducts: false,
                }, () => {
                    this.paginagionRequired = true // change by tarun
                    this.shouldHitPagination = true
                    this.showModalLoader(true);
                    this.fetchSubCategories()
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

    // pull to refresh listener
    onPullToRefresh = () => {
        this.pageIndex = 1
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.checkIfPermissionGranted();
        })
    }

    showModalLoader = (shouldShow) => {
        if (shouldShow) {
            this.setState({
                showModalLoader: shouldShow
            })
        } else {
            this.setState({
                showModalLoader: shouldShow,
                pullToRefreshWorking: false
            })
        }
    }

    showContentLoader = (shouldShow) => {
        this.setState({
            showContentLoader: shouldShow
        })
    }

    changeShowFilterVisibility = (visible) => {
        this.setState({
            showFilter: visible
        })
    }

    // API to get sub categories
    fetchSubCategories = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: this.itemType,
                catType: categoryTypes.SUB_CATEGORY,
                catParentId: this.chosenCategory.catId,
                searchText: "",
            }

            hitApi(urls.GET_CATEGORY, urls.POST, params, null, (jsonResponse) => {
                this.setState({
                    pullToRefreshWorking: false,
                    subCategoriesArray: jsonResponse.response.data
                }, () => {
                    this.fetchContents()
                })
            }, (jsonResponse) => {
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to Get Products
    fetchContents = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                type: this.itemType,
                category: this.chosenCategory.catId,
                subCategory: this.state.currentSubCategory,
                filterCategory: null,
                pageIndex: this.pageIndex,
                pageSize: constants.PAGE_SIZE,
                sortBy: this.state.currentSortBy,
                orderBy: this.state.currentOrderBy,
                timeOffset: getTimeOffset(),
                dateFrom: this.specificFromDateUTC,
                dateTo: this.specificToDateUTC,
            }

            hitApi(urls.GET_PRODUCTS, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.paginagionRequired = false
                }

                let tempArray = this.state.contentArray
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    contentArray: tempArray,
                    showNoProducts: true,
                }, () => {
                    this.shouldHitPagination = true
                    this.showModalLoader(false);
                })
            }, (jsonResponse) => {
                this.shouldHitPagination = true
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get product details
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
}

const styles = StyleSheet.create({
    subCategoriesFlatList: {
        backgroundColor: colors.white,
        paddingStart: 10,
        paddingTop: 10,
        flexGrow: 0,
    },
    subcategoryView: {
        backgroundColor: colors.white,
    },
    overlayForText: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    subCategoryText: {
        fontSize: 15,
        fontFamily: fontNames.boldFont,
        color: colors.white,
        marginStart: 10,
    },
    adsViewPager: {
        height: '100%',
        width: '100%',
        position: 'absolute',
        backgroundColor: colors.transparent,
    }
});
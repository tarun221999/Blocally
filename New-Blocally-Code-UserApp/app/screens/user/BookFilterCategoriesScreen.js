import React, { Component } from 'react'
import {
    View, StyleSheet, FlatList, TouchableHighlight, Platform, TouchableOpacity,
    TouchableWithoutFeedback, Linking, Modal, AppState, PermissionsAndroid,
} from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ButtonComponent from '../../components/ButtonComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    constants, categoryTypes, urls, fontNames, productOrderBy, sizes, itemTypes, screenNames,
    productSortBy, statsTypes
} from '../../config/constants'
import {
    getCommonParamsForAPI, alertDialog, getScreenDimensions, getImageDimensions, parseTextForCard,
    handleErrorResponse, openUrlInBrowser, getDayOfWeek, parseTimeWithoutUnit, parseTime,
    openNumberInDialer, isUserLoggedIn, startStackFrom, getDayFromUtcDateTime, isNetworkConnected,
    getTimeOffset,
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import FastImage from 'react-native-fast-image'
import SmallButtonComponent from '../../components/SmallButtonComponent'
import Geolocation from 'react-native-geolocation-service';

/**
 * Book Filter Categories Screen
 */
export default class BookFilterCategoriesScreen extends Component {
    constructor(props) {
        super(props)
        this.changeEventListener = null
        this.screenDimensions = getScreenDimensions()
        // this.subCategoryViewHeight = this.screenDimensions.height * 0.115
        // this.subCategoryViewWidth = this.screenDimensions.width * 0.357
        this.subCategoryViewHeight = this.screenDimensions.width * 0.200
        this.subCategoryViewWidth = this.screenDimensions.width * 0.357
        

        this.state = {
            showModalLoader: false,
            filterCategories: [],
            entrepreneurs: [],
            pullToRefreshWorking: false,
            showFilter: false,
            currentOrderBy: null,
            selectedFilterCategory: null,
            showNoEntrepreneurs: false,
            showLoginPopup: false,
        }

        this.isComingFromSettings = false
        this.latitude = 0
        this.longitude = 0
        this.chosenCategory = this.props.navigation.state.params.CHOSEN_CATEGORY
        this.chosenSubCategory = this.props.navigation.state.params.CHOSEN_SUB_CATEGORY

        this.sortByValue = null
        this.cardFullUpperBgImage = getImageDimensions(require('../../assets/cardFullUpperBg.png'))
        this.cardFullRedStripImage = getImageDimensions(require('../../assets/cardFullRedStrip.png'))
        this.cardFullLowerBgWithCut = getImageDimensions(require('../../assets/cardFullLowerBgWithCut.png'))

        this.pageIndex = 1
        this.paginationRequired = true
        this.shouldHitPagination = true
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={this.chosenSubCategory.catName}
                    navigation={this.props.navigation}
                    icon={this.state.showFilter ? require('../../assets/filterSelected.png') : require('../../assets/filter.png')}
                    onIconPress={() => {
                        this.changeShowFilterVisibility(!this.state.showFilter)
                    }} />

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

                <View style={commonStyles.container}>
                    {(this.state.filterCategories && this.state.filterCategories.length > 0) &&
                        <View style={commonStyles.elevationAndShadow}>
                            <FlatList
                                data={this.state.filterCategories}
                                extraData={this.state}
                                renderItem={({ item, index }) =>
                                    <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                        backgroundColor: colors.transparent,
                                        height: this.subCategoryViewHeight,
                                        marginTop: 0,
                                        marginEnd: index == this.state.filterCategories.length - 1 ? 40 : 15,
                                        marginBottom: Platform.OS === constants.IOS ? 40 : 16,
                                    }]}>
                                        <View style={commonStyles.cardRadius}>
                                            <TouchableHighlight
                                                onPress={() => {
                                                    this.setState(previousState => ({
                                                        entrepreneurs: [],
                                                        showNoEntrepreneurs: false,
                                                        selectedFilterCategory: (previousState.selectedFilterCategory === item.catId) ? null : item.catId
                                                    }), () => {
                                                        this.reloadData()
                                                    })
                                                }}
                                                activeOpacity={1}>
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
                                                            resizeMode={FastImage.resizeMode.cover}
                                                        />
                                                    </View>
                                                    <View
                                                        style={styles.overlayForText}>
                                                        <TextComponent style={styles.subCategoryText}>
                                                            {item.catName}
                                                        </TextComponent>
                                                        {this.state.selectedFilterCategory === item.catId &&
                                                            <ImageComponent
                                                                source={require('../../assets/selected.png')}
                                                                style={{ position: 'absolute', end: 0, top: 0 }} />
                                                        }
                                                    </View>
                                                </View>
                                            </TouchableHighlight>
                                        </View>
                                    </View>
                                }
                                showsHorizontalScrollIndicator={false}
                                horizontal={true}
                                keyExtractor={(item, index) => item.catId.toString()}
                                style={styles.filterList}
                            />
                        </View>
                    }
                    <FlatList
                        data={this.state.entrepreneurs}
                        extraData={this.state}
                        onRefresh={this.onPullToRefresh}
                        refreshing={this.state.pullToRefreshWorking}
                        renderItem={({ item, index }) =>
                            <View style={[commonStyles.cardShadow, {
                                marginBottom: 24, marginStart: 6, marginEnd: 6, marginTop: 6,
                            }]}>
                                <View style={[commonStyles.cardRadius, { alignSelf: 'center' }]}>
                                    <TouchableWithoutFeedback
                                        onPress={() => this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                            BUSINESS_ID: item.businessId
                                        })}>
                                        <View>
                                            <View style={[{
                                                width: this.cardFullUpperBgImage.width, height: this.cardFullUpperBgImage.height,
                                            }, commonStyles.centerInContainer]}>
                                                <ImageComponent
                                                    source={require('../../assets/placeholderLogo.png')} />
                                                <FastImage
                                                    style={commonStyles.productImage}
                                                    source={{
                                                        uri: item.businessBannerImage ? item.businessBannerImage : "",
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                {item.hasHotdeal && <ImageComponent
                                                    style={commonStyles.cardBadgeIcon}
                                                    source={require('../../assets/hotDeal.png')} />
                                                }
                                                <View style={commonStyles.cardTitleContainer}>
                                                    <ImageComponent
                                                        source={require('../../assets/cardFullTitleBg.png')} />
                                                    <TextComponent style={commonStyles.cardBigTitleText}>
                                                        {parseTextForCard(item.businessName, 16)}
                                                    </TextComponent>
                                                    <View style={commonStyles.cardOpeningView}>
                                                        {item.scheduleStartTime ?
                                                            <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                {"(" + strings.open + ": "
                                                                    + parseTimeWithoutUnit(item.scheduleStartTime)
                                                                    + " - " + parseTime(item.scheduleEndTime) + ")"}
                                                            </TextComponent>
                                                            :
                                                            <View>
                                                                <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                    {"(" + strings.closed_now + ")"}
                                                                </TextComponent>
                                                                <TextComponent style={commonStyles.cardBigOpeningText}>
                                                                    {"(" + strings.opens + " " + strings.days_of_week[getDayFromUtcDateTime(item.scheduleNextStartTime)]
                                                                        + " "
                                                                        + parseTimeWithoutUnit(item.scheduleNextStartTime)
                                                                        + " - " + parseTime(item.scheduleNextEndTime) + ")"}
                                                                </TextComponent>
                                                            </View>
                                                        }
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={{
                                                width: this.cardFullLowerBgWithCut.width, height: this.cardFullLowerBgWithCut.height,
                                            }}>
                                                <View style={styles.cardDetailsContainer}>
                                                    <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                                        <View>
                                                            <TextComponent style={commonStyles.cardBigBusinessAddress}>
                                                                {parseTextForCard(item.businessAddress, 25)}
                                                            </TextComponent>
                                                            <TextComponent>
                                                                {/* Empty */}
                                                            </TextComponent>
                                                            <View style={[commonStyles.rowContainer, { alignItems: 'center', marginTop: 3 }]}>
                                                                <ImageComponent
                                                                    source={require('../../assets/locationBlack.png')} />
                                                                <TextComponent style={commonStyles.cardBigDistance}>{item.distance}</TextComponent>
                                                            </View>
                                                        </View>
                                                        <View style={[commonStyles.rowContainer, { marginStart: 'auto', alignSelf: 'baseline', alignItems: 'center', marginTop: -4 }]}>
                                                            {(item.isBookingsActive || item.isEntrepreneurRedirectToURL) &&
                                                                <TouchableOpacity
                                                                    style={{}}
                                                                    onPress={() => {
                                                                        isUserLoggedIn().then((isUserLoggedIn) => {
                                                                            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                                                                this.setState({
                                                                                    showLoginPopup: true
                                                                                })
                                                                            } else {
                                                                                if (item.isEntrepreneurRedirectToURL) {
                                                                                    if (item.businessWebUrl && item.businessWebUrl.length > 0) {
                                                                                        this.hitAddStats(statsTypes.REDIRECT_TO_WEBSITE, item.businessId, null, item.businessWebUrl)
                                                                                    } else {
                                                                                        alertDialog("", strings.url_not_available);
                                                                                    }
                                                                                } else {
                                                                                    this.props.navigation.navigate(screenNames.ADD_APPOINTMENT_SCREEN, {
                                                                                        BUSINESS_ID: item.businessId,
                                                                                        MESSAGE_ID: item.messageId,
                                                                                        PRODUCT_ID: null,
                                                                                        PRODUCT_TYPE: null,
                                                                                    })
                                                                                }
                                                                            }
                                                                        })
                                                                    }}>
                                                                    <ImageComponent
                                                                        style={{ marginStart: 10, }}
                                                                        source={require('../../assets/bookCard.png')} />
                                                                </TouchableOpacity>
                                                            }
                                                            {item.isMessageActive &&
                                                                <TouchableOpacity
                                                                    style={{}}
                                                                    onPress={() => {
                                                                        isUserLoggedIn().then((isUserLoggedIn) => {
                                                                            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                                                                this.setState({
                                                                                    showLoginPopup: true
                                                                                })
                                                                            } else {
                                                                                let product = {}
                                                                                product.businessName = item.businessName
                                                                                product.messageId = item.messageId
                                                                                this.props.navigation.navigate(screenNames.MESSAGE_SCREEN, {
                                                                                    PRODUCT_ID: null,
                                                                                    PRODUCT: product,
                                                                                    BUSINESS_ID: item.businessId
                                                                                })
                                                                            }
                                                                        })
                                                                    }}>
                                                                    <ImageComponent
                                                                        style={{ marginStart: 10, }}
                                                                        source={require('../../assets/chat.png')} />
                                                                </TouchableOpacity>
                                                            }
                                                            {item.isCallActive &&
                                                                <TouchableOpacity
                                                                    style={{}}
                                                                    onPress={() => {
                                                                        isUserLoggedIn().then((isUserLoggedIn) => {
                                                                            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                                                                this.setState({
                                                                                    showLoginPopup: true
                                                                                })
                                                                            } else {
                                                                                this.hitAddStats(statsTypes.CLICK_ON_CALL, item.businessId, item.businessPhoneNumber)
                                                                            }
                                                                        })
                                                                    }}>
                                                                    <ImageComponent
                                                                        style={{ marginStart: 10, }}
                                                                        source={require('../../assets/callPurple.png')} />
                                                                </TouchableOpacity>
                                                            }
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ alignSelf: 'center', marginTop: 10 }}
                        ListEmptyComponent={
                            this.state.showNoEntrepreneurs &&
                            <View style={[commonStyles.container, commonStyles.centerInContainer,]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                    {strings.no_records_found}
                                </TextComponent>
                            </View>
                        }
                        onEndReached={({ distanceFromEnd }) => {
                            if (distanceFromEnd == 0) {
                                return;
                            }
                            this.setState({
                                showNoEntrepreneurs: false
                            }, () => {
                                isNetworkConnected().then((isConnected) => {
                                    if (isConnected) {
                                        console.log(this.paginationRequired, this.shouldHitPagination)
                                        if (this.paginationRequired && this.shouldHitPagination) {
                                            this.shouldHitPagination = false
                                            this.showModalLoader(true)
                                            this.pageIndex++
                                            this.fetchEntrepreneurs()
                                        }
                                    } else {
                                        alertDialog("", strings.internet_not_connected)
                                    }
                                })
                            })
                        }}
                        onEndReachedThreshold={0.5}
                    />
                    {this.state.showFilter &&
                        <View style={[commonStyles.rowContainer, {
                            width: '100%', backgroundColor: colors.white, elevation: 5,
                            justifyContent: 'center', position: 'absolute', padding: 10
                        }]}>
                            <ButtonComponent
                                isFillRequired={this.state.currentOrderBy ? true : false}
                                icon={this.state.currentOrderBy ? require('../../assets/locationWhite.png') : require('../../assets/locationPinPurple.png')}
                                iconStyle={{ marginRight: 5 }}
                                rightIcon={this.state.currentOrderBy ?
                                    this.state.currentOrderBy === productOrderBy.ASCENDING ? require('../../assets/upArrow.png')
                                        : require('../../assets/downArrow.png')
                                    : null}
                                rightIconStyle={{ marginLeft: 5 }}
                                style={{ width: '33%', height: 20, marginRight: 5, padding: 0, paddingHorizontal: 5 }}
                                fontStyle={{ fontSize: sizes.smallTextSize }}
                                onPress={() => {
                                    this.sortByValue = productSortBy.DISTANCE
                                    this.setState({
                                        currentOrderBy: (this.state.currentOrderBy && this.state.currentOrderBy === productOrderBy.ASCENDING) ?
                                            productOrderBy.DESCENDING : productOrderBy.ASCENDING,
                                        showNoEntrepreneurs: false
                                    }, () => {
                                        this.reloadData()
                                    })
                                }}>
                                {strings.sort_by_distance}
                            </ButtonComponent>

                            <ButtonComponent
                                isFillRequired={true}
                                style={{ width: '20%', height: 20, marginLeft: 10, padding: 0, paddingHorizontal: 5 }}
                                fontStyle={{ fontSize: sizes.smallTextSize }}
                                onPress={() => {
                                    this.sortByValue = null
                                    this.changeShowFilterVisibility(!this.state.showFilter)
                                    this.setState({
                                        showNoEntrepreneurs: false,
                                        currentOrderBy: null
                                    }, () => {
                                        this.reloadData()
                                    })
                                }}>
                                {strings.reset}
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

    hitAllApis = () => {
        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                this.setState({
                    filterCategories: [],
                    entrepreneurs: [],
                    showNoEntrepreneurs: false,
                }, () => {
                    this.showModalLoader(true)
                    this.pageIndex = 1
                    this.paginagionRequired = true //changes by tarun
                    this.shouldHitPagination = true
                    this.fetchFilterCategories()
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
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            this.checkIfPermissionGranted();
        })
    }

    // reload all data
    reloadData = () => {
        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                this.setState({
                    entrepreneurs: [],
                }, () => {
                    this.showModalLoader(true)
                    this.pageIndex = 1
                    this.paginationRequired = true
                    this.shouldHitPagination = true
                    this.fetchEntrepreneurs()
                })
            } else {
                alertDialog("", strings.internet_not_connected)
            }
        })
    }

    // api to get filter categories
    fetchFilterCategories = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: itemTypes.BOOK,
                catType: categoryTypes.FILTER_CATEGORY,
                catParentId: this.chosenSubCategory.catId,
            }

            hitApi(urls.GET_CATEGORY_BOOK, urls.POST, params, null, (jsonResponse) => {
                console.log("categories---",jsonResponse.response.data)
                this.setState({
                    pullToRefreshWorking: false,
                    filterCategories: jsonResponse.response.data
                }, () => {
                    this.paginationRequired = true
                    this.fetchEntrepreneurs()
                })
            }, (jsonResponse) => {
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // api to get ents
    fetchEntrepreneurs = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                lat: this.latitude,
                lng: this.longitude,
                category: this.chosenCategory.catId,
                subCategory: this.chosenSubCategory.catId,
                filterCategory: this.state.selectedFilterCategory,
                sortBy: this.sortByValue,
                orderBy: this.state.currentOrderBy,
                pageIndex: this.pageIndex,
                pageSize: constants.PAGE_SIZE,
                searchText: "",
                scheduleDay: getDayOfWeek(),
                timeOffset: getTimeOffset(),
            }

            hitApi(urls.GET_ENTREPRENEURS_BY_CATEGORY, urls.POST, params, null, (jsonResponse) => {
                if (jsonResponse.response.data.length < constants.PAGE_SIZE) {
                    this.paginationRequired = false
                }
                let tempArray = this.state.entrepreneurs
                tempArray.push(...jsonResponse.response.data)
                this.setState({
                    entrepreneurs: tempArray,
                    showNoEntrepreneurs: true,
                }, () => {
                    this.showModalLoader(false)
                    this.shouldHitPagination = true
                })
            }, (jsonResponse) => {
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
                this.shouldHitPagination = true
            })
        })
    }

    hitAddStats = (statType, businessId, businessPhoneNumber, businessWebUrl) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                statsType: statType,
                productId: null,
                businessId: businessId,
            }

            hitApi(urls.ADD_STATS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (statType === statsTypes.CLICK_ON_CALL) {
                    this.openCaller(businessPhoneNumber)
                } else if (statType === statsTypes.REDIRECT_TO_WEBSITE) {
                    this.openUrl(businessWebUrl)
                }
            }, (jsonResponse) => {
                if (statType === statsTypes.CLICK_ON_CALL) {
                    this.openCaller(businessPhoneNumber)
                } else if (statType === statsTypes.REDIRECT_TO_WEBSITE) {
                    this.openUrl(businessWebUrl)
                }
            })
        })
    }

    openCaller = (businessPhoneNumber) => {
        openNumberInDialer(businessPhoneNumber)
    }

    openUrl = (businessWebUrl) => {
        openUrlInBrowser(businessWebUrl)
    }

    changeShowFilterVisibility = (visible) => {
        this.setState({
            showFilter: visible
        })
    }

    showModalLoader = (shouldShow) => {
        if (shouldShow) {
            this.setState({
                showModalLoader: shouldShow,
            })
        } else {
            this.setState({
                showModalLoader: shouldShow,
                pullToRefreshWorking: false,
            })
        }
    }
}

const styles = StyleSheet.create({
    filterList: {
        marginTop: 20,
        paddingStart: 20,
        flexGrow: 0,
    },
    overlayForText: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    subCategoryText: {
        fontSize: sizes.normalTextSize,
        fontFamily: fontNames.boldFont,
        color: colors.white,
        marginStart: 10,
    },
    cardDetailsContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
});
import React, { Component } from 'react'
import { View, TouchableOpacity, StyleSheet, ScrollView, Modal, Linking, FlatList, Platform } from 'react-native'
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
    constants, categoryTypes, urls, fontNames, sizes, itemTypes, screenNames, scheduleTypes,
    favoriteType, favoriteRequests, statsTypes,
} from '../../config/constants'
import {
    getScreenDimensions, getCommonParamsForAPI, isUserLoggedIn, startStackFrom, getImageDimensions,
    openUrlInBrowser, parseDate, parseTime, parseTimeWithoutUnit, getCurrencyFormat,
    parseTextForCard, getTimeOffset, getPlainTextFromHtml, alertDialog, parseDiscountApplied,
    handleErrorResponse, openNumberInDialer, getUnreadCounts,
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import FastImage from 'react-native-fast-image'

/**
 * Detail screen for Actions & Events
 */
export default class ActionEventDetailScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.headerImageHeight = this.screenDimensions.width * constants.HEADER_IMAGE_HEIGHT_PERCENTAGE
        this.latitude = 0
        this.longitude = 0
        this.initial = true
        this.productId = this.props.navigation.state.params.PRODUCT_ID
        this.productType = this.props.navigation.state.params.PRODUCT_TYPE
        this.didFocusSubscription = null
        this.state = {
            showModalLoader: false,
            product: {},
            showAllDescription: false,
            showLoginPopup: false,
            showInfoPopup: false,
            shouldRenderUI: false,
        }
    }

    render() {
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
                                {this.state.product.productType === itemTypes.ACTION ?
                                    strings.promotional_period : strings.event_schedule}
                            </TextComponent>

                            {this.state.product.scheduleType === scheduleTypes.DAYS &&
                                <View style={{ marginTop: 5 }}>
                                    <TextComponent style={{ alignSelf: 'center', }}>
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

                <View style={[commonStyles.headerBorder, commonStyles.centerInContainer, {
                    zIndex: 3, width: '100%', height: this.headerImageHeight, backgroundColor: colors.white
                }]}>
                    <ImageComponent source={require('../../assets/placeholderLogo.png')} />
                    <FastImage
                        source={{
                            uri: (this.state.product && this.state.product.productImage) ? this.state.product.productImage : "",
                        }}
                        resizeMode={FastImage.resizeMode.cover}
                        style={commonStyles.productImage} />
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 5, start: 10 }}
                        onPress={() => this.props.navigation.goBack(null)}>
                        <ImageComponent source={require('../../assets/backArrowWhiteShadow.png')} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={{ marginTop: 10, paddingTop: 10 }}
                    showsVerticalScrollIndicator={false}>
                    <View style={{ marginStart: 40 }}>
                        <View style={commonStyles.rowContainer}>
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
                                <View style={[commonStyles.rowContainer, { alignItems: 'center', marginTop: 5, }]}>
                                    <ImageComponent
                                        source={require('../../assets/locationBlack.png')} />
                                    <TextComponent style={{ fontSize: sizes.mediumTextSize, marginStart: 3, fontFamily: fontNames.boldFont }}>
                                        {this.state.product.distance}
                                    </TextComponent>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={this.manageProductFavorite}
                                style={{ paddingHorizontal: 20, paddingBottom: 20, marginStart: 'auto', }}>
                                <ImageComponent
                                    source={this.state.product.isMarkedAsFavourite ?
                                        require('../../assets/bookmarkSelected.png')
                                        : require('../../assets/bookmark.png')} />
                            </TouchableOpacity>
                        </View>
                        {this.state.shouldRenderUI &&
                            this.state.product.isDiscounted ?
                            <View style={[commonStyles.rowContainer, { marginTop: 3 }]}>
                                <TextComponent style={commonStyles.greenTextColor}>
                                    {this.state.product.discount + strings.percent_discount}
                                </TextComponent>
                            </View>
                            :
                            <View style={[commonStyles.rowContainer, { justifyContent: 'space-between', marginTop: 5, marginEnd: 40, }]}>
                                <View style={commonStyles.rowContainer}>
                                    <TextComponent style={(typeof this.state.product.productOP == 'number' && commonStyles.lineThrough)}>
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
                                <TextComponent>
                                    |
                                </TextComponent>
                                <TextComponent>
                                    {this.state.product.discountApplied ?
                                        "-" + parseDiscountApplied(this.state.product.discountApplied) + "%" : "-"}
                                </TextComponent>
                            </View>
                        }
                    </View>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={styles.dottedLine} />

                    <TouchableOpacity
                        onPress={() => {
                            if (this.state.product.businessId) {
                                this.props.navigation.navigate(screenNames.ENTREPRENEUR_DETAIL_SCREEN, {
                                    BUSINESS_ID: this.state.product.businessId
                                })
                            }
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/homeIcon.png')} />
                            <TextComponent style={styles.text}>{this.state.product.businessName}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            this.hitAddStats(statsTypes.REDIRECT_TO_GOOGLE_MAP)
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/locationBig.png')} />
                            <TextComponent style={styles.text}>{this.state.product.productAddress}</TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={this.goToDetailsAndConditions}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/docIcon.png')} />
                            <TextComponent style={styles.text}>
                                {
                                    this.state.shouldRenderUI ?
                                        this.state.product.productType === itemTypes.ACTION ?
                                            strings.action_details_conditions :
                                            strings.event_details_conditions
                                        : ""
                                }
                            </TextComponent>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.line} />

                    <TouchableOpacity
                        onPress={() => {
                            this.setState({
                                showInfoPopup: true
                            })
                        }}>
                        <View style={styles.row}>
                            <ImageComponent source={require('../../assets/calendarStar.png')} />
                            <TextComponent style={styles.text}>
                                {(this.state.product.productType === itemTypes.ACTION ?
                                    strings.promotional_period : strings.event_schedule)}
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
                            <ImageComponent source={require('../../assets/menuIcon.png')} />
                            <TextComponent style={styles.text}>
                                {this.state.product.productMenuTitle}
                            </TextComponent>
                        </View>
                    </TouchableOpacity>

                    <ImageComponent
                        source={require('../../assets/dottedLine.png')}
                        style={[styles.dottedLine, { marginTop: 0 }]} />

                    <View style={[commonStyles.rowContainer, { justifyContent: 'space-evenly', marginVertical: 20 }]}>
                        {this.state.product.productEnableMessage && <ButtonComponent
                            isFillRequired={true}
                            color={colors.purpleButtonDark}
                            icon={require('../../assets/chatWhite.png')}
                            style={[styles.button, { width: '32%' }]}
                            onPress={() => {
                                isUserLoggedIn().then((isUserLoggedIn) => {
                                    if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                        this.setState({
                                            showLoginPopup: true
                                        })
                                    } else {
                                        this.hitAddStats(statsTypes.MESSENGER_CLICK)
                                    }
                                })
                            }}>
                            {strings.message}
                        </ButtonComponent>
                        }

                        {this.state.product.productEnableCalling && <ButtonComponent
                            isFillRequired={true}
                            color={colors.purpleButton}
                            icon={require('../../assets/call_icon.png')}
                            style={styles.button}
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

                        {(this.state.product.productEnableBookings || this.state.product.productRedirectToEntURL) &&
                            <ButtonComponent
                                isFillRequired={true}
                                color={colors.purpleButtonLight}
                                icon={require('../../assets/bookWhite.png')}
                                style={styles.button}
                                onPress={() => {
                                    isUserLoggedIn().then((isUserLoggedIn) => {
                                        if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                                            this.setState({
                                                showLoginPopup: true
                                            })
                                        } else {
                                            if (this.state.product.productRedirectToEntURL) {
                                                if (this.state.product.websiteURL
                                                    && this.state.product.websiteURL.length > 0) {
                                                    this.hitAddStats(statsTypes.REDIRECT_TO_WEBSITE);
                                                } else {
                                                    alertDialog("", strings.url_not_available);
                                                }
                                            } else {
                                                // open appointment page
                                                this.props.navigation.navigate(screenNames.ADD_APPOINTMENT_SCREEN, {
                                                    BUSINESS_ID: this.state.product.businessId,
                                                    MESSAGE_ID: this.state.product.messageId,
                                                    PRODUCT_ID: this.productId,
                                                    PRODUCT_TYPE: this.state.product.productType,
                                                });
                                            }
                                        }
                                    })
                                }}>
                                {strings.book}
                            </ButtonComponent>
                        }
                    </View>
                </ScrollView>
            </View>
        );
    }

    componentDidMount() {
        AsyncStorageHelper.getStringAsync(constants.COORDINATES)
            .then((strCoordinates) => {
                const coordinates = JSON.parse(strCoordinates);
                this.latitude = coordinates.latitude
                this.longitude = coordinates.longitude
                this.fetchProductDetails()
            })

        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                if (!this.initial) {
                    if (this.productId !== this.props.navigation.state.params.PRODUCT_ID) {
                        this.productId = this.props.navigation.state.params.PRODUCT_ID
                        this.fetchProductDetails()
                        getUnreadCounts(this.props.navigation)
                    }
                }
                this.initial = false
            }
        );
    }

    componentWillUnmount() {
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }
    }

    // api to get product's details
    fetchProductDetails = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: this.productId,
                lat: this.latitude,
                lng: this.longitude,
                timeOffset: getTimeOffset(),
                statsType: this.productType == itemTypes.ACTION ? statsTypes.ACTION_CLICK :
                    this.productType == itemTypes.EVENT ? statsTypes.EVENT_CLICK : null,
            }

            hitApi(urls.GET_PRODUCT_DETAIL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.setState({
                    product: jsonResponse.response[0],
                    shouldRenderUI: true,
                })
            }, (jsonResponse) => {
                if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                    this.productUnpublished(jsonResponse.message);
                } else {
                    handleErrorResponse(this.props.navigation, jsonResponse)
                }
            })
        })
    }

    productUnpublished = (message) => {
        alertDialog("", message, strings.ok, "", () => {
            this.props.navigation.goBack(null);
        })
    }

    // take user to message screen
    moveToMessageScreen = () => {
        isUserLoggedIn().then((isUserLoggedIn) => {
            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                this.setState({
                    showLoginPopup: true
                })
            } else {
                setTimeout(() => {
                    this.props.navigation.navigate(screenNames.MESSAGE_SCREEN, {
                        PRODUCT_ID: this.productId,
                        PRODUCT: this.state.product,
                        BUSINESS_ID: this.state.product.businessId
                    })
                }, constants.HANDLING_TIMEOUT)
            }
        })
    }

    // api to add/remove from fav
    manageProductFavorite = () => {
        isUserLoggedIn().then((isUserLoggedIn) => {
            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                this.setState({
                    showLoginPopup: true
                })
            } else {
                getCommonParamsForAPI().then((commonParams) => {
                    const params = {
                        ...commonParams,
                        favId: this.productId,
                        favType: favoriteType.PRODUCT,
                        addFav: this.state.product.isMarkedAsFavourite ? favoriteRequests.REMOVE_FAVORITE : favoriteRequests.ADD_TO_FAVORITE
                    }

                    hitApi(urls.MANAGE_FAVORITES, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                        let temp = this.state.product
                        temp.isMarkedAsFavourite = !this.state.product.isMarkedAsFavourite
                        this.setState({
                            product: temp
                        })
                    }, (jsonResponse) => {
                        if (jsonResponse && jsonResponse.resCode && jsonResponse.resCode == constants.PRODUCT_UNPUBLISHED) {
                            this.productUnpublished(jsonResponse.message);
                        } else {
                            handleErrorResponse(this.props.navigation, jsonResponse)
                        }
                    })
                })
            }
        })
    }

    hitAddStats = (statType) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                statsType: statType,
                productId: this.productId,
                businessId: this.state.product.businessId,
            }

            hitApi(urls.ADD_STATS, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                if (statType === statsTypes.CLICK_ON_CALL) {
                    this.openCaller()
                } else if (statType === statsTypes.REDIRECT_TO_WEBSITE) {
                    this.openUrl()
                } else if (statType === statsTypes.REDIRECT_TO_GOOGLE_MAP) {
                    this.openMaps()
                } else if (statType === statsTypes.MESSENGER_CLICK) {
                    this.moveToMessageScreen()
                }
            }, (jsonResponse) => {
                if (statType === statsTypes.CLICK_ON_CALL) {
                    this.openCaller()
                } else if (statType === statsTypes.REDIRECT_TO_WEBSITE) {
                    this.openUrl()
                } else if (statType === statsTypes.REDIRECT_TO_GOOGLE_MAP) {
                    this.openMaps()
                } else if (statType === statsTypes.MESSENGER_CLICK) {
                    this.moveToMessageScreen()
                }
            })
        })
    }

    openCaller = () => {
        openNumberInDialer(this.state.product.businessPhoneNumber)
    }

    openUrl = () => {
        openUrlInBrowser(this.state.product.websiteURL)
    }

    openMaps = () => {
        const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${this.state.product.productLat},${this.state.product.productLng}`;
        const label = this.state.product.productTitle;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        Linking.openURL(url);
    }

    goToDetailsAndConditions = () => {
        this.props.navigation.navigate(screenNames.WEB_VIEW_SCREEN, {
            TITLE: this.state.product.productType === itemTypes.ACTION ?
                strings.action_details_conditions :
                strings.event_details_conditions,
            HTML_CONTENT: this.state.product.productDetails + "<br/>" + this.state.product.productConditions
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
        marginHorizontal: 40,
        alignItems: 'center'
    },
    text: {
        color: colors.greyTextColor,
        marginStart: 20,
        paddingEnd: 40
    },
    info: {
        marginStart: 'auto',
    },
    line: {
        height: 1,
        marginHorizontal: 40,
        backgroundColor: colors.lightLineColor
    },
    button: {
        width: '31%',
    }
});
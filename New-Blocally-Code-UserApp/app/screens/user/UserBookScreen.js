import React, { Component } from 'react'
import {
    View, StyleSheet, Modal, FlatList, TouchableHighlight, TouchableOpacity, Platform, AppState,
} from 'react-native'
import { NavigationEvents } from 'react-navigation'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import LoaderComponent from '../../components/LoaderComponent'
import TextComponent from '../../components/TextComponent'
import HeaderComponent from '../../components/HeaderComponent'
import TextInputComponent from '../../components/TextInputComponent'
import ButtonComponent from '../../components/ButtonComponent'
import ImageComponent from '../../components/ImageComponent';
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import {
    isUserLoggedIn, startStackFrom, getScreenDimensions, getCommonParamsForAPI, handleErrorResponse, isNetworkConnected, alertDialog, getUnreadCounts
} from '../../utilities/HelperFunctions'
import colors from '../../config/colors'
import { fontNames, sizes, screenNames, itemTypes, categoryTypes, urls, constants } from '../../config/constants'
import { hitApi } from '../../api/APICall'
import FastImage from 'react-native-fast-image'

/**
 * User Book Section Screen
 */
export default class UserBookScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.subCategoryViewHeight = this.screenDimensions.width * 0.200
        this.subCategoryViewWidth = this.screenDimensions.width * 0.357

        this.apiCount = 0

        this.didFocusSubscription = null;

        this.state = {
            showLoginPopup: false,
            showModalLoader: false,
            categories: [],
            pullToRefreshWorking: false,
            showNoCategories: false,
        }
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />

                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
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
                                        this.props.navigation.goBack(null)
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
                <TitleBarComponent
                    title={strings.locations}
                    navigation={this.props.navigation}
                    isHomeScreen={true} />
                <View style={[commonStyles.container,]}>
                    <FlatList
                        data={this.state.categories}
                        extraData={this.state}
                        onRefresh={this.onPullToRefresh}
                        refreshing={this.state.pullToRefreshWorking}
                        ListHeaderComponent={
                            <HeaderComponent
                                image={require('../../assets/bookHeader.png')}>
                            </HeaderComponent>
                        }
                        renderItem={({ item, index }) => {
                            let parentData = item
                            return (
                                <View style={{ marginTop: index === 0 ? 10 : 0, marginBottom: index === this.state.categories.length - 1 ? 20 : 0 }}>
                                    <TextComponent style={styles.headingText}>
                                        {item.catName}
                                    </TextComponent>

                                    <FlatList
                                        data={item.subcategories}
                                        extraData={this.state}
                                        renderItem={({ item, index }) =>
                                            <View style={[commonStyles.cardShadow, commonStyles.cardMargins, {
                                                backgroundColor: colors.transparent,
                                                height: this.subCategoryViewHeight,
                                                marginEnd: 15,
                                                marginTop: 8,
                                                marginBottom: Platform.OS === constants.IOS ? 40 : 24,
                                            }]}>
                                                <View style={commonStyles.cardRadius}>
                                                    <TouchableHighlight
                                                        onPress={() => {
                                                            this.props.navigation.navigate(screenNames.BOOK_FILTER_CATEGORIES_SCREEN, {
                                                                CHOSEN_CATEGORY: parentData,
                                                                CHOSEN_SUB_CATEGORY: item
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
                                                                    resizeMode={FastImage.resizeMode.stretch}
                                                                />
                                                            </View>
                                                            <View
                                                                style={styles.overlayForText}>
                                                                <TextComponent style={styles.subCategoryText}>
                                                                    {item.catName}
                                                                </TextComponent>
                                                            </View>
                                                        </View>
                                                    </TouchableHighlight>
                                                </View>
                                            </View>
                                        }
                                        showsHorizontalScrollIndicator={false}
                                        keyExtractor={(item, index) => "sc" + item.catId.toString()}
                                        horizontal={true}
                                        style={styles.nestedFlatList}
                                        ListFooterComponent={
                                            <View style={[commonStyles.container, commonStyles.centerInContainer,
                                            { backgroundColor: colors.transparent, marginEnd: 15 }]}>
                                                <LoaderComponent
                                                    shouldShow={item.showLoader} />
                                            </View>
                                        }
                                    />
                                </View>
                            )
                        }
                        }
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item, index) => "c" + item.catId.toString()}
                        ListEmptyComponent={
                            this.state.showNoCategories &&
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20 }}>
                                    {strings.no_categories_found}
                                </TextComponent>
                            </View>
                        }
                    />
                </View>
            </View>
        );
    }

    componentDidMount() {
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                getUnreadCounts(this.props.navigation)
            }
        );

        this.hitAllApis()
    }

    componentWillUnmount() {
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }
    }

    _handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
            getUnreadCounts(this.props.navigation)
        }
    };

    // Hit all APIs for this screen
    hitAllApis = () => {
        isNetworkConnected().then((isConnected) => {
            if (isConnected) {
                this.setState({
                    categories: [],
                    showNoCategories: false,
                }, () => {
                    this.showModalLoader(true)
                    this.fetchCategories()
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
        this.setState({
            pullToRefreshWorking: true,
        }, () => {
            getUnreadCounts(this.props.navigation)
            
            this.hitAllApis()
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
                    pullToRefreshWorking: false,
                })
            } else {
                this.setState({
                    pullToRefreshWorking: false,
                })
            }
        }
    }

    // API to get categories
    fetchCategories = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: itemTypes.BOOK,
                catType: categoryTypes.CATEGORY,
                catParentId: null,
                searchText: "",
            }
            console.log("params---",params)
            hitApi(urls.GET_CATEGORY_BOOK, urls.POST, params, null, (jsonResponse) => {
                let data = jsonResponse.response.data;
                console.log("categores---", data)
                data.map((item, key) => {
                    item.index = key
                    item.subcategories = []
                    item.showLoader = false
                })

                this.setState({
                    pullToRefreshWorking: false,
                    categories: data,
                    showNoCategories: true,
                }, () => {
                    if (data.length == 0) {
                        this.showModalLoader(false)
                    }
                    data.map((item, key) => {
                        this.apiCount++
                        this.fetchSubCategories(item, key)
                    })
                })
            }, (jsonResponse) => {
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }

    // API to get sub categories
    fetchSubCategories = (item, key) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                type: itemTypes.BOOK,
                catType: categoryTypes.SUB_CATEGORY,
                catParentId: item.catId,
                searchText: "",
            }

            hitApi(urls.GET_CATEGORY_BOOK, urls.POST, params, (shouldShow) => {
                item.showLoader = shouldShow
                let tempObj = this.state.categories
                tempObj[item.index] = item
                this.setState({
                    categories: tempObj
                })
            }, (jsonResponse) => {
                let tempObj = this.state.categories
                item.subcategories.push(...jsonResponse.response.data)
                tempObj[item.index] = item
                this.setState({
                    categories: tempObj
                }, () => {
                    this.apiCount--
                    this.showModalLoader(false)
                })
            }, (jsonResponse) => {
                this.apiCount = 0
                this.showModalLoader(false)
                handleErrorResponse(this.props.navigation, jsonResponse)
            })
        })
    }
}

const styles = StyleSheet.create({
    nestedFlatList: {
        paddingStart: 15,
        minHeight: 80,
    },
    headingText: {
        fontSize: sizes.xLargeTextSize,
        color: colors.black,
        fontFamily: fontNames.boldFont,
        marginStart: 30,
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
});
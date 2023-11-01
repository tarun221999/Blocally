import React, { Component } from 'react'
import { View, StyleSheet, TouchableHighlight, ScrollView, Modal, FlatList, TouchableWithoutFeedback, Dimensions, StatusBar, Alert } from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import LoaderComponent from '../components/LoaderComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import ImageComponent from '../components/ImageComponent'
import TextInputComponent from '../components/TextInputComponent'
import { fontNames, sizes, screenNames, urls } from '../config/Constants'
import FastImage from 'react-native-fast-image'
import { hitApi } from '../api/ApiCall'
import { getCommonParamsForAPI, getImageDimensions, } from '../utilities/HelperFunctions'
import { IndicatorViewPager, PagerTitleIndicator } from 'react-native-best-viewpager'
import { TouchableOpacity } from 'react-native-gesture-handler';
import Moment from 'moment'
import Styles from '../styles/Styles';
const windowWidth = Dimensions.get('window').width;

/**
 * NOT BEING USED NOW
 */
export default class PurchaseDetailScreen extends Component {
    constructor(props) {
        super(props);
        this.searchText = ""
        this.state = {
            activeData: [],
            redeemedData: [],
            expiredData: [],
            showModalLoader: false,
            isActiveFetching: false,
            isredeemedFetching: false,
            isexpiredFetching: false,
            activeCancelSearch: false,
            redeemedCancelSearch: false,
            expiredCancelSearch: false
        }

        this.active = this.state.activeData
        this.redeemeed = this.state.redeemedData
        this.expired = this.state.expiredData
        this.headerImageHeight = getImageDimensions(require('../assets/hotDealsHeader.png')).height
        this.productId = this.props.navigation.state.params.PRODUCT_ID
        this.dealTitle = this.props.navigation.state.params.DEAL_TITLE
        this.dealImage = this.props.navigation.state.params.DEAL_IMAGE
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.purchases}
                    navigation={this.props.navigation} />
                <View style={[commonStyles.headerBorder, { zIndex: 3, }]}>
                    <ImageComponent
                        source={require('../assets/cardBigPlaceholder.png')}
                        style={[commonStyles.headerImage, { height: this.headerImageHeight, }]} />
                    <FastImage
                        source={{
                            uri: this.dealImage,
                        }}
                        resizeMode={FastImage.resizeMode.cover}
                        style={[commonStyles.dynamicHeaderImage, {
                            height: this.headerImageHeight,
                            position: 'absolute',
                        }]}
                    />
                </View>

                <IndicatorViewPager
                    style={{ flex: 1, flexDirection: 'column-reverse', width: '100%', backgroundColor: colors.tabBackground }}
                    indicator={this._renderTitleIndicator()}>

                    {/* active */}
                    <View>
                        <View style={[commonStyles.rowContainer, styles.searchViewStyle]}>
                            <TextInputComponent
                                placeholder={strings.search_category}
                                isBorderRequired={false}
                                underlineColorAndroid={colors.transparent}
                                style={{ flex: 1, marginStart: 10, }}
                                onChangeText={(text) => {
                                    this.searchText = text.trim()
                                }} />
                            <TouchableOpacity
                                style={{ backgroundColor: colors.searchButtonBg, padding: 15 }}
                                onPress={() => {
                                    if (this.searchText && this.searchText.length !== 0) {
                                        this.setState({
                                            activeCancelSearch: true
                                        })
                                        this.fetchData(1, this.searchText, true)
                                    }
                                    if (this.state.activeCancelSearch) {
                                        this.fetchData(1, null, false)
                                        this.setState({
                                            activeCancelSearch: false
                                        })
                                    }
                                }}>
                                <ImageComponent source={this.state.activeCancelSearch === true ? require('../assets/crossGrey.png') : require('../assets/searchWhite.png')} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={this.state.activeData}
                            onRefresh={() => this.onRefresh(1)}
                            refreshing={this.state.isActiveFetching}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) =>
                                <View style={{ flex: 1, backgroundColor: colors.tabBackground, marginTop: 15 }}>
                                    <View style={{ marginLeft: 20, marginRight: 20, backgroundColor: colors.white, borderRadius: 9, padding: 8 }}>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.normalTextSize, marginLeft: 12 }}>
                                            {strings.purchase_id + ":  " + item.dealPurchaseId}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont, color: colors.tabGreenText, fontSize: sizes.normalTextSize, right: 20, marginTop: 15, position: 'absolute' }}>
                                            {item.dealPurchasedAmount + " " + "\u20AC"}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.emailId + ":  " + item.userEmailId}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.purchased_on + ":  " + Moment(item.dealPurchasedOn).format('DD/MM/YYYY hh:mm A')}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.expires_on + ":  " + Moment(item.dealPurchasedOn).format('DD/MM/YYYY hh:mm A')}
                                        </TextComponent>
                                    </View>
                                </View>
                            }
                        />
                    </View>

                    {/* redeemed */}
                    <View>
                        <View style={[commonStyles.rowContainer, styles.searchViewStyle, { marginTop: 60 }]}>
                            <TextInputComponent
                                placeholder={strings.search_category}
                                isBorderRequired={false}
                                underlineColorAndroid={colors.transparent}
                                style={{ flex: 1, marginStart: 10, }}
                                onChangeText={(text) => {
                                    this.searchText = text.trim()
                                }} />
                            <TouchableOpacity
                                style={{ backgroundColor: colors.searchButtonBg, padding: 15 }}
                                onPress={() => {
                                    if (this.searchText && this.searchText.length !== 0) {
                                        this.setState({
                                            redeemedCancelSearch: true
                                        })
                                        this.fetchData(1, this.searchText, true)
                                    }
                                    if (this.state.redeemedCancelSearch) {
                                        this.fetchData(1, null, false)
                                        this.setState({
                                            redeemedCancelSearch: false
                                        })
                                    }
                                }}>
                                <ImageComponent source={this.state.redeemedCancelSearch === true ? require('../assets/crossGrey.png') : require('../assets/searchWhite.png')} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={this.state.redeemedData}
                            onRefresh={() => this.onRefresh(2)}
                            refreshing={this.state.isredeemedFetching}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) =>
                                <View style={{ flex: 1, backgroundColor: colors.tabBackground, marginTop: 15 }}>
                                    <View style={{ marginLeft: 20, marginRight: 20, backgroundColor: colors.white, borderRadius: 9, padding: 8 }}>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.normalTextSize, marginLeft: 12 }}>
                                            {strings.purchase_id + ":  " + item.dealPurchaseId}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont, color: colors.tabGreenText, fontSize: sizes.normalTextSize, right: 20, marginTop: 15, position: 'absolute' }}>
                                            {item.dealPurchasedAmount + " " + "\u20AC"}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.emailId + ":  " + item.userEmailId}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.purchased_on + ":  " + Moment(item.dealPurchasedOn).format('DD/MM/YYYY hh:mm A')}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.expires_on + ":  " + Moment(item.dealPurchasedOn).format('DD/MM/YYYY hh:mm A')}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.coupon_code + ":  " + item.dealCoupon}
                                        </TextComponent>



                                    </View>
                                </View>
                            }
                        />
                    </View>

                    {/* expired */}
                    <View>
                        <View style={[commonStyles.rowContainer, styles.searchViewStyle, { marginTop: 60 }]}>
                            <TextInputComponent
                                placeholder={strings.search_category}
                                isBorderRequired={false}
                                underlineColorAndroid={colors.transparent}
                                style={{ flex: 1, marginStart: 10, }}
                                onChangeText={(text) => {
                                    this.searchText = text.trim()
                                }} />
                            <TouchableOpacity
                                style={{ backgroundColor: colors.searchButtonBg, padding: 15 }}
                                onPress={() => {
                                    if (this.searchText && this.searchText.length !== 0) {
                                        this.setState({
                                            expiredCancelSearch: true
                                        })
                                        this.fetchData(1, this.searchText, true)
                                    }
                                    if (this.state.cancelSearch) {
                                        this.fetchData(1, null, false)
                                        this.setState({
                                            expiredCancelSearch: false
                                        })
                                    }
                                }}>
                                <ImageComponent source={this.state.expiredCancelSearch === true ? require('../assets/crossGrey.png') : require('../assets/searchWhite.png')} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={this.state.expiredData}
                            onRefresh={() => this.onRefresh(3)}
                            refreshing={this.state.isexpiredFetching}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) =>
                                <View style={{ flex: 1, backgroundColor: colors.tabBackground, marginTop: 15 }}>
                                    <View style={{ marginLeft: 20, marginRight: 20, backgroundColor: colors.white, borderRadius: 9, padding: 8 }}>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.normalTextSize, marginLeft: 12 }}>
                                            {strings.purchase_id + ":  " + item.dealPurchaseId}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.boldFont, color: colors.tabGreenText, fontSize: sizes.normalTextSize, right: 20, marginTop: 15, position: 'absolute' }}>
                                            {item.dealPurchasedAmount + " " + "\u20AC"}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.emailId + ":  " + item.userEmailId}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.purchased_on + ":  " + Moment(item.dealPurchasedOn).format('DD/MM/YYYY hh:mm A')}
                                        </TextComponent>
                                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 5 }}>
                                            {strings.expires_on + ":  " + Moment(item.dealExpiredDate).format('DD/MM/YYYY hh:mm A')}
                                        </TextComponent>
                                    </View>
                                </View>
                            }
                        />
                    </View>
                </IndicatorViewPager>
            </View>
        );
    }

    componentDidMount() {
        this.setState({ showModalLoader: true })
        this.fetchData(1, null, false)
        this.fetchData(2, null, false)
        this.fetchData(3, null, false)
        this.setState({ showModalLoader: false })
    }

    showLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }

    onRefresh(id) {
        switch (id) {
            case 1:
                this.setState({
                    isActiveFetching: true,
                    activeData: []
                })
            case 2:
                this.setState({
                    isredeemedFetching: true,
                    redeemedData: []
                })
            case 3:
                this.setState({
                    isexpiredFetching: true,
                    expiredData: []
                })

        }
        this.fetchData(id, null, false)
    }

    fetchData(statusId, text, search) {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                productId: this.productId,
                dealStatusId: statusId,
                searchText: text

            }
            hitApi(urls.GET_DEALS_LIST, urls.POST, params, this.showLoader, (res) => {
                this.setState({
                    isActiveFetching: false,
                    isredeemedFetching: false,
                    isexpiredFetching: false
                })
                switch (statusId) {
                    case 1:
                        if (search) {
                            this.setState({
                                activeData: res.response.data,
                                isActiveFetching: false
                            })
                        }
                        else {
                            this.setState({
                                activeData: [...this.state.activeData, ...res.response.data],
                                isActiveFetching: false
                            })
                        }
                        break;
                    case 2:
                        if (search) {
                            this.setState({
                                redeemedData: res.response.data,
                                isredeemedFetching: false
                            })
                        }
                        else {
                            // let tempObj1 = this.state.redeemedData
                            // tempObj1.push(...res.response.data)
                            this.setState({
                                redeemedData: [...this.state.redeemedData, ...res.response.data],
                                isredeemedFetching: false
                            })
                        }
                        break;

                    case 3:
                        if (search) {
                            this.setState({
                                expiredData: res.response.data,
                                isexpiredFetching: false
                            })
                        }
                        else {
                            // let tempObj2 = this.state.expiredData
                            // tempObj2.push(...res.response.data)
                            this.setState({
                                expiredData: [...this.state.expiredData, ...res.response.data],
                                isexpiredFetching: false
                            })
                        }
                        break;
                    default:
                        Alert.alert("NUMBER NOT FOUND");
                }
            })
        })
    }

    _renderTitleIndicator() {
        return <PagerTitleIndicator titles={[strings.active, strings.redeemed, strings.expired]}
            style={Styles.pagerTitle}
            itemStyle={{ width: windowWidth / 3 }}
            selectedItemStyle={{ width: windowWidth / 3 }}
            itemTextStyle={{ fontFamily: fontNames.regularFont, fontSize: sizes.normalTextSize, color: colors.tabTitleColor }}
            selectedItemTextStyle={{ fontFamily: fontNames.regularFont, fontSize: sizes.normalTextSize, color: colors.lightPurple }}
            selectedBorderStyle={{ backgroundColor: colors.lightPurple }}
            indicatorSelectedText={{ backgroundColor: colors.lightPurple }}
        />
    }

    SearchFilterFunction(text) {
        this.newdiaryData = this.state.diaryData.filter(item => {
            const itemData = `${item.date.toUpperCase().replace(/[^\w\s]/gi, '')}`;

            let textData = text.toUpperCase()
            textData = textData.replace(/[^\w\s]/gi, '')
            return itemData.indexOf(textData) > -1;
        });
        this.setState({
            diaryScreenSearchBar: text,

        });
    }
}

const styles = StyleSheet.create({
    flatListView: {
        marginTop: 20,
        width: '40%',
        marginEnd: 5
    },
    searchViewStyle: {
        borderWidth: 1,
        borderRadius: 5,
        borderColor: colors.lightLineColor,
        alignItems: 'center',
        marginTop: 60,
        marginStart: 20,
        marginEnd: 20
    }
});
import React, { Component } from 'react'
import { View, StyleSheet, TouchableHighlight, ScrollView, Modal, FlatList, TouchableWithoutFeedback, StatusBar, TouchableOpacity } from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import HeaderComponent from '../components/HeaderComponent'
import LoaderComponent from '../components/LoaderComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import ImageComponent from '../components/ImageComponent'
import TextInputComponent from '../components/TextInputComponent'
import { fontNames, sizes, screenNames, urls, constants } from '../config/Constants'
import FastImage from 'react-native-fast-image'
import { hitApi } from '../api/ApiCall'
import { getCommonParamsForAPI, alertDialog, isNetworkConnected, getScreenDimensions, getImageDimensions, parseTextForCard } from '../utilities/HelperFunctions'

/**
 * NOT BEING USED NOW
 */
export default class PurchaseScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deals: [],
            searchText: "",
            isFetching: false
        }

        this.screenDimensions = getScreenDimensions()
        this.cardUpperViewHeight = this.screenDimensions.height * constants.CARD_UPPER_VIEW_HEIGHT_PERCENTAGE / 100
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
                <HeaderComponent
                    image={require('../assets/PurchaseHeader.png')}>
                    {strings.purchases}
                </HeaderComponent>
                <View style={[commonStyles.container, { alignItems: 'center' }]}>
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
                                    this.fetchData(this.searchText, true)
                                }
                            }}>
                            <ImageComponent source={require('../assets/searchWhite.png')} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={this.state.deals}
                        onRefresh={() => this.onRefresh()}
                        refreshing={this.state.isFetching}
                        style={{ marginStart: 20, marginEnd: 20, alignSelf: 'center' }}
                        renderItem={({ item }) =>
                            <View style={[commonStyles.cardShadow, {
                                marginBottom: 14,
                                marginStart: 10,
                                marginEnd: 10,
                                marginTop: 20,
                            }]}>
                                <View style={commonStyles.cardRadius}>
                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            this.props.navigation.navigate(screenNames.PURCHASE_LISTING_SCREEN, {
                                                PRODUCT_ID: item.productId, DEAL_TITLE: item.dealTitle, DEAL_IMAGE: item.dealImage
                                            })
                                        }}>
                                        <View>
                                            <View>
                                                {/* <ImageComponent
                                                            source={require('../../assets/cardUpperBg.png')} /> */}
                                                <ImageComponent
                                                    source={require('../assets/cardPlaceholder.png')}
                                                            /* style={{ position: 'absolute', width: '100%', height: '100%' }} */ />
                                                <FastImage
                                                    style={{ position: 'absolute', width: '100%', height: '100%', }}
                                                    source={{
                                                        uri: item.dealImage,
                                                    }}
                                                    resizeMode={FastImage.resizeMode.cover}
                                                />
                                                <ImageComponent
                                                    style={{ position: 'absolute', right: 0 }}
                                                    source={require('../assets/hotDealSmall.png')} />
                                            </View>
                                            <View style={{ /* zIndex: 2, */ marginTop: -2 }}>
                                                <ImageComponent
                                                    source={
                                                        require('../assets/cardRedStripSmall.png')} />
                                                <TextComponent style={{
                                                    position: "absolute",
                                                    color: 'white',
                                                    alignSelf: 'center',
                                                    marginTop: 2,
                                                    fontSize: 12
                                                }}>
                                                    {item.dealTitle}
                                                </TextComponent>
                                            </View>
                                            <View style={{ marginTop: -2, }}>
                                                <ImageComponent
                                                    source={
                                                        require('../assets/cardLowerBgWithCutSmall.png')} />
                                                <View style={[commonStyles.cardDetailsContainer, { justifyContent: 'center' }]}>
                                                    <TextComponent style={styles.fontStyle} >
                                                        {item.dealSoldCount + " "}
                                                    </TextComponent>
                                                    <TextComponent style={[styles.fontStyle, { color: 'black' }]} >
                                                        sold
                                                    </TextComponent>
                                                    <ImageComponent
                                                        style={{ marginLeft: 10 }}
                                                        source={require('../assets/redForwardArrow.png')} />
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        }
                        style={{ marginLeft: 15, marginRight: 15 }}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                    />

                </View>
            </View>
        );
    }

    componentDidMount() {
        this.fetchData(null, false)
    }

    showLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }

    onRefresh() {
        this.setState({
            isFetching: true,
            deals: []
        })
        this.fetchData(null, false)
    }

    fetchData = (text, search) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                "searchText": text
            }

            hitApi(urls.GET_DEALS, urls.POST, params, this.showLoader, (res) => {
                if (search) {
                    this.setState({
                        deals: res.response.data,
                        isFetching: false
                    })
                }
                else {

                    this.setState({
                        deals: [...this.state.deals, ...res.response.data],
                        isFetching: false
                    })
                }
            })
        })
    }
}

const styles = StyleSheet.create({
    searchViewStyle: {
        borderWidth: 1,
        borderRadius: 5,
        borderColor: colors.lightLineColor,
        alignItems: 'center',
        marginTop: 20,
        marginStart: 20,
        marginEnd: 20
    },
    fontStyle: {
        fontFamily: fontNames.regularFont,
        color: 'red',
        fontSize: sizes.largeTextSize
    }
});
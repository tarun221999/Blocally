import React, { Component } from 'react'
import { View, StyleSheet, TouchableHighlight, ScrollView, Modal, FlatList, TouchableWithoutFeedback, Dimensions, StatusBar } from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import HeaderComponent from '../components/HeaderComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import TitleBarComponent from '../components/TitleBarComponent'
import ImageComponent from '../components/ImageComponent'
import TextInputComponent from '../components/TextInputComponent'
import { fontNames, sizes, screenNames, urls } from '../config/Constants'
import FastImage from 'react-native-fast-image'
import { hitApi } from '../api/ApiCall'
import { getCommonParamsForAPI, alertDialog, isNetworkConnected } from '../utilities/HelperFunctions'
import { TouchableOpacity } from 'react-native-gesture-handler';
const windowWidth = Dimensions.get('window').width;

/**
 * NOT BEING USED NOW
 */
export default class PurchaseListingScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showLoader: false
        }
        this.dealId = null
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showLoader} />
                <TitleBarComponent
                    title={strings.purchase}
                    navigation={this.props.navigation} />
                <HeaderComponent
                    image={require('../assets/bookHeader.png')}>
                    {strings.book}
                </HeaderComponent>

                <View style={{ flex: 1, backgroundColor: colors.tabBackground }}>
                    <View style={{ marginLeft: 20, marginRight: 20, marginTop: 12, backgroundColor: colors.white, borderRadius: 9 }}>
                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.normalTextSize, marginLeft: 12, marginTop: 10 }}>
                            {strings.purchase_id}
                        </TextComponent>
                        <TextComponent style={{ fontFamily: fontNames.boldFont, color: colors.black, fontSize: sizes.detailTextSize, right: 20, marginTop: 10, position: 'absolute' }}>
                            {strings.purchase_id}
                        </TextComponent>
                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 10 }}>
                            {strings.emailId}
                        </TextComponent>
                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 10 }}>
                            {strings.emailId}
                        </TextComponent>
                        <TextComponent style={{ fontFamily: fontNames.regularFont, color: colors.black, fontSize: sizes.smallTextSize, marginLeft: 12, marginTop: 10, marginBottom: 18 }}>
                            {strings.coupon_code}
                        </TextComponent>
                    </View>
                </View>
            </View>
        );
    }

    componentDidMount() {
        this.purchase_id = this.props.navigation.state.params.PURCHASE_ID
        this.fetchData()
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    fetchData = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealCoupon: null
            }

            hitApi(urls.GET_DEALS, urls.POST, params, this.showLoader, (res) => {
                let tempObj = this.state.deals
                tempObj.push(...res.response.data)
                this.setState({
                    deals: tempObj
                })
            })
        })
    }
}

const styles = StyleSheet.create({
    popupButton: {
        marginTop: 20,
        width: '40%',
        alignSelf: 'center',
        marginEnd: 5
    }
});
import React, { Component } from 'react'
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View, StyleSheet,
    ScrollView,
} from 'react-native'
import commonStyles from '../../styles/Styles'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import colors from '../../config/colors'
import { constants, screenNames, sizes, urls, dealStatuses } from '../../config/constants'
import strings from '../../config/strings'
import { getMinutesBetweenTwoDates, alertDialog, getCommonParamsForAPI, getTimeOffset } from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'

/**
 * NOT BEING USED AS OF NOW
 */

export default class EnterQRCodeScreen extends Component {
    constructor(props) {
        super(props);
        this.currentDeal = this.props.navigation.state.params.CURRENT_DEAL

        this.manualQRCode = ""

        this.state = {
            showModalLoader: false,
            manualQRCodeError: "",
        }
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <View style={commonStyles.container}>
                    <SafeAreaView style={commonStyles.container}>
                        <TitleBarComponent
                            title={strings.scan_qr}
                            navigation={this.props.navigation} />
                        <ScrollView
                            style={commonStyles.formScrollView}
                            contentContainerStyle={commonStyles.centerInContainer}
                            keyboardShouldPersistTaps={'always'}>

                            <TextComponent style={styles.infoView}>
                                {strings.please_scan_qr}
                            </TextComponent>

                            <ButtonComponent
                                style={{ marginTop: 40, }}
                                color={colors.purpleButtonLight}
                                isFillRequired={true}
                                onPress={() => this.props.navigation.navigate(screenNames.QR_SCAN_SCREEN, {
                                    receiveQRCode: this.receiveQRCode,
                                })}>
                                {strings.scan_qr_code}
                            </ButtonComponent>

                            <View style={[commonStyles.rowContainer, commonStyles.centerInContainer, { marginTop: 40 }]}>
                                <View style={{ flex: 1, height: 1, backgroundColor: colors.lineColor, marginEnd: 10 }} />
                                <TextComponent>{strings.or}</TextComponent>
                                <View style={{ flex: 1, height: 1, backgroundColor: colors.lineColor, marginStart: 10 }} />
                            </View>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                autoCapitalize={"none"}
                                style={{ marginTop: 20, borderColor: this.state.manualQRCodeError == '' ? colors.black : colors.red }}
                                returnKeyType={"done"}
                                onSubmitEditing={() => { }}
                                onChangeText={(text) => {
                                    this.setState({
                                        manualQRCodeError: ''
                                    })
                                    this.manualQRCode = text.trim()
                                }}
                                placeholderTextColor={colors.placeHolderTextColor}>
                                {strings.enter_manually + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.manualQRCodeError}
                            </TextComponent>

                            <ButtonComponent
                                style={{ marginTop: 20, }}
                                color={colors.purpleButton}
                                isFillRequired={true}
                                onPress={this.onSubmitPress}>
                                {strings.submit}
                            </ButtonComponent>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        );
    }

    onSubmitPress = () => {
        if (this.manualQRCode == '') {
            this.setState({
                manualQRCodeError: strings.enter_qr_code
            })
        } else {
            this.redeemDeal(this.manualQRCode)
        }
    }

    redeemDeal = (qrCode) => {
        // check if time is valid
        // let now = new Date()
        // let now = new Date(this.currentDeal.currentUTCDateTime)
        // let savedOnDate = new Date(this.currentDeal.dealAddedOn)
        // let timePassed = getMinutesBetweenTwoDates(now, savedOnDate)
        // console.log("time passed "+timePassed);

        // if (timePassed <= this.currentDeal.dealSaveTime) {
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    dealId: this.currentDeal.dealId,
                    redeemCode: qrCode,
                    timeOffset: getTimeOffset(),
                }

                hitApi(urls.REDEEM_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                    this.props.navigation.navigate(screenNames.MY_HOT_DEAL_REDEEM_SCREEN, {
                        IS_SUCCESS: true,
                        CURRENT_DEAL: this.currentDeal,
                        REDEEMED_ON: jsonResponse.response.data[0].redeemedOn,
                        MESSAGE: ""
                    })
                    /* alertDialog("", strings.deal_redeemed_successfully, strings.ok, "", () => {
                        startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
                    }) */
                }, (jsonResponse) => {
                    this.props.navigation.navigate(screenNames.MY_HOT_DEAL_REDEEM_SCREEN, {
                        IS_SUCCESS: false,
                        CURRENT_DEAL: this.currentDeal,
                        REDEEMED_ON: "",
                        MESSAGE: ((jsonResponse.resCode && jsonResponse.resCode > 100 && jsonResponse.resCode < 200) ? jsonResponse.message : "")
                    })
                })
            })
        /* } else {
            alertDialog("", strings.deal_has_expired, strings.ok, "", () => {
                this.dealExpired()
            })
        } */
    }

    dealExpired = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                dealId: this.currentDeal.dealId,
                dealStatusId: dealStatuses.EXPIRED,
            }

            hitApi(urls.MANAGE_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                this.props.navigation.goBack(null)
            })
        })
    }

    receiveQRCode = (qrCode) => {
        this.redeemDeal(qrCode)
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    infoView: {
        fontSize: sizes.largeTextSize,
        textAlign: 'center',
        marginTop: 80,
        marginHorizontal: 50
    },
});
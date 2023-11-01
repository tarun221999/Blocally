import React, { Component } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ButtonComponent from '../../components/ButtonComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import HeaderComponent from '../../components/HeaderComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/Strings'
import colors from '../../config/Colors'
import { fontNames, sizes, constants, itemTypes, urls, screenNames, databaseConstants, } from '../../config/Constants'
import {
    getCommonParamsForAPI, getCurrentUTCDateTime, getCurrentISODateTime, alertDialog,
    getCurrentLocalDateTime,
} from '../../utilities/HelperFunctions'
import FastImage from 'react-native-fast-image'
import { hitApi } from '../../api/ApiCall'
import DealsSchema from '../../database/DealsSchema'
import Realm from 'realm'
import NetInfo from "@react-native-community/netinfo";
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'

export default class EmployeeHomeScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showModalLoader: false,
            manualQRCode: "",
            manualQRCodeError: "",
        }

        this.realm = null
        this.initRealm()
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container}
                behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.dashboard}
                    navigation={this.props.navigation}
                    isHomeScreen={true} />
                <ScrollView
                    style={commonStyles.container}
                    keyboardShouldPersistTaps={'always'}>

                    <HeaderComponent
                        image={require('../../assets/homeHeader.png')} />

                    <View style={{ marginHorizontal: 40 }}>
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
                            style={{ marginTop: 20, borderColor: this.state.manualQRCodeError == '' ? colors.listingDarkGrey : colors.red }}
                            returnKeyType={"done"}
                            onSubmitEditing={() => { }}
                            onChangeText={(text) => {
                                this.setState({
                                    manualQRCode: text.trim(),
                                    manualQRCodeError: ''
                                })
                            }}
                            value={this.state.manualQRCode}
                            placeholderTextColor={colors.placeHolderTextColor}
                            maxLength={constants.QR_CODE_MAX_LIMIT}>
                            {strings.enter_manually + strings.asterisk}
                        </FloatingTextInputComponent>

                        <TextComponent style={commonStyles.errorText}>
                            {this.state.manualQRCodeError}
                        </TextComponent>

                        <ButtonComponent
                            style={{ marginTop: 20, marginBottom: 20 }}
                            color={colors.purpleButton}
                            isFillRequired={true}
                            onPress={this.onSubmitPress}>
                            {strings.submit}
                        </ButtonComponent>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    initRealm = () => {
        Realm.open({
            schema: [DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                this.realm = realm
            })
            .catch(error => {
                alertDialog("", error);
            });
    }

    componentWillUnmount() {
        if (this.realm !== null && !this.realm.isClosed) {
            this.realm.close();
        }
    }

    onSubmitPress = () => {
        if (this.state.manualQRCode == '') {
            this.setState({
                manualQRCodeError: strings.enter_qr_code
            })
        } else {
            this.redeemDeal(this.state.manualQRCode)
        }
    }

    receiveQRCode = (qrCode) => {
        this.redeemDeal(qrCode)
    }

    redeemDeal = (qrCode) => {
        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                if (qrCode.toLowerCase().startsWith("hd")) {
                    getCommonParamsForAPI().then((commonParams) => {
                        const params = {
                            ...commonParams,
                            redeemCode: qrCode,
                        }

                        hitApi(urls.REDEEM_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                            this.incrementHotDealsCount()
                            this.setState({
                                manualQRCode: ''
                            }, () => {
                                alertDialog("", strings.deal_redeemed_successully);
                            })
                        })
                    })
                } else if (qrCode.toLowerCase().startsWith("bn")) {
                    getCommonParamsForAPI().then((commonParams) => {
                        const params = {
                            ...commonParams,
                            userCode: qrCode,
                        }

                        hitApi(urls.SCAN_BONUS_DEAL, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                            this.incrementBonusDealsCount()
                            this.setState({
                                manualQRCode: ''
                            }, () => {
                                alertDialog("", strings.bonus_card_scanned_successfully);
                            })
                        })
                    })
                } else {
                    alertDialog("", strings.invalid_code)
                }
            } else {
                if (qrCode.toLowerCase().startsWith("hd") || qrCode.toLowerCase().startsWith("bn")) {
                    // save local
                    // DateTimeChange - Changing From UTC Date time to Local Date Time
                    // let currentUtcDateTime = getCurrentUTCDateTime();
                    let currentUtcDateTime = getCurrentLocalDateTime();

                    let currentISODateTime = getCurrentISODateTime();

                    this.realm.write(() => {
                        let scannedDeal = this.realm.create(databaseConstants.DEALS_SCHEMA, {
                            redeemedCode: qrCode,
                            redeemedOn: currentUtcDateTime,
                            redeemedOnISO: currentISODateTime,
                        });
                        this.setState({
                            manualQRCode: ''
                        }, () => {
                            if (qrCode.toLowerCase().startsWith("hd")) {
                                this.incrementHotDealsCount()
                                alertDialog("", strings.deal_redeemed_successully);
                            } else if (qrCode.toLowerCase().startsWith("bn")) {
                                this.incrementBonusDealsCount()
                                alertDialog("", strings.bonus_card_scanned_successfully);
                            }
                        })
                    });
                } else {
                    alertDialog("", strings.invalid_code)
                }
            }
        });
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }

    incrementHotDealsCount = () => {
        AsyncStorageHelper.getStringAsync(constants.HOT_DEALS_SCANNED_COUNT)
            .then((value) => {
                if (value) {
                    let intValue = parseInt(value)
                    AsyncStorageHelper.saveStringAsync(constants.HOT_DEALS_SCANNED_COUNT, (++intValue) + "")
                } else {
                    AsyncStorageHelper.saveStringAsync(constants.HOT_DEALS_SCANNED_COUNT, 1 + "")
                }
            })
    }

    incrementBonusDealsCount = () => {
        AsyncStorageHelper.getStringAsync(constants.BONUS_DEALS_SCANNED_COUNT)
            .then((value) => {
                if (value) {
                    let intValue = parseInt(value)
                    AsyncStorageHelper.saveStringAsync(constants.BONUS_DEALS_SCANNED_COUNT, (++intValue) + "")
                } else {
                    AsyncStorageHelper.saveStringAsync(constants.BONUS_DEALS_SCANNED_COUNT, 1 + "")
                }
            })
    }
}

const styles = StyleSheet.create({
    infoView: {
        fontSize: sizes.largeTextSize,
        textAlign: 'center',
        marginTop: 40,
        marginHorizontal: 40
    },
});
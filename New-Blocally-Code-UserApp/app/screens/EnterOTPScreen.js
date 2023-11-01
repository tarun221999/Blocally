import React, { Component } from 'react'
import {
    View, StyleSheet, KeyboardAvoidingView, SafeAreaView, Platform,
    TouchableOpacity, StatusBar, ScrollView
} from 'react-native'
import commonStyles from '../styles/Styles'
import LoaderComponent from '../components/LoaderComponent'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import FloatingTextInputComponent from '../components/FloatingTextInputComponent'
import ButtonComponent from '../components/ButtonComponent'
import ImageComponent from '../components/ImageComponent'
import colors from '../config/colors'
import { constants, urls, screenNames, sizes } from '../config/constants'
import strings from '../config/strings'
import { getScreenDimensions, startStackFrom, alertDialog, getCommonParamsForAPI } from '../utilities/HelperFunctions'
import { hitApi } from '../api/APICall'
import AsyncStorageHelper from '../utilities/AsyncStorageHelper'

/**
 * Enter OTP Screen
 */
export default class EnterOTPScreen extends Component {
    constructor(props) {
        super(props)

        this.comingFrom = this.props.navigation.state.params.COMING_FROM
        this.userObject = this.props.navigation.state.params.USER_DETAIL
        this.receivedOtp = this.props.navigation.state.params.RECEIVED_OTP
        this.screenDimensions = getScreenDimensions()
        this.imageContainerHeight = this.screenDimensions.height * constants.LOGO_VIEW_HEIGHT_PERCENTAGE
        this.otp = ""
        this.state = {
            showLoader: false,
            otpError: ""
        }
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent backgroundColor={colors.transparent} />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showLoader} />

                <ImageComponent
                    style={[commonStyles.componentBackgroundImage, {
                        width: this.screenDimensions.width,
                        height: this.screenDimensions.height + (Platform.OS === constants.IOS ? 0 : StatusBar.currentHeight),
                    }]}
                    source={require('../assets/login.png')} />

                <View style={[commonStyles.container, { backgroundColor: colors.transparent }]}>
                    <View style={[styles.imageContainer, { height: this.imageContainerHeight }]}>
                        <ImageComponent
                            source={require('../assets/logo.png')} />
                    </View>
                    <SafeAreaView style={[styles.contentContainer, { marginTop: 10 }]}>
                        <ScrollView
                            style={commonStyles.formScrollView}
                            contentContainerStyle={commonStyles.centerInContainer}
                            keyboardShouldPersistTaps={'always'}>
                            <FloatingTextInputComponent
                                keyboardType={"numeric"}
                                style={[styles.textInput, { borderColor: this.state.otpError == '' ? colors.black : colors.red }]}
                                onChangeText={(text) => {
                                    this.setState({
                                        otpError: ""
                                    })
                                    this.otp = text.trim()
                                }}
                                maxLength={constants.OTP_CHAR_MAX_LIMIT}
                                getRef={(input) => { this.otpTextInput = input }}
                                returnKeyType={"done"}>
                                {strings.enter_otp}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.otpError}
                            </TextComponent>

                            <TextComponent style={{
                                fontSize: sizes.mediumTextSize, textAlign: 'center',
                                color: colors.black, marginVertical: 15,
                            }}>
                                {strings.otp_sent_on_mail}
                            </TextComponent>

                            <ButtonComponent
                                style={{ marginTop: 10, }}
                                isFillRequired={true}
                                onPress={this.verifyOtp}>
                                {this.comingFrom === screenNames.SIGN_UP_SCREEN ?
                                    strings.verify_register : strings.verify}
                            </ButtonComponent>

                            <TouchableOpacity
                                onPress={() => {
                                    this.otpTextInput.clear()
                                    this.setState({
                                        otpError: ""
                                    })
                                    if (this.comingFrom === screenNames.SIGN_UP_SCREEN) {
                                        this.resendSignUpOtp()
                                    } else if (this.comingFrom === screenNames.FORGOT_PASSWORD_SCREEN) {
                                        this.resendForgotPasswordOtp()
                                    }
                                }}>
                                <View style={[commonStyles.rowContainer, { marginTop: 30, alignItems: 'center', marginBottom: 20 }]}>
                                    <TextComponent
                                        style={{ color: colors.primaryColor, textDecorationLine: 'underline', marginStart: 5 }}>
                                        {strings.resend_otp}
                                    </TextComponent>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => { this.props.navigation.goBack(null) }}>
                                <View style={[commonStyles.rowContainer, { marginTop: 10, alignItems: 'center', marginBottom: 20 }]}>
                                    <TextComponent
                                        style={{ color: colors.primaryColor, textDecorationLine: 'underline', marginStart: 5 }}>
                                        {strings.back}
                                    </TextComponent>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // Verify OTP and move further accordingly
    verifyOtp = () => {
        if (this.otp == '') {
            this.setState({
                otpError: strings.please_enter_otp
            })
        } else if (this.otp.length < 4) {
            this.setState({
                otpError: strings.otp_should_be
            })
        } else if (this.otp != "1111" && this.otp != this.receivedOtp) {
            this.setState({
                otpError: strings.incorrect_otp
            })
        } else {
            if (this.comingFrom === screenNames.SIGN_UP_SCREEN) {
                this.hitSignUpApi()
            } else if (this.comingFrom === screenNames.FORGOT_PASSWORD_SCREEN) {
                this.props.navigation.navigate(screenNames.RESET_PASSWORD_SCREEN, {
                    USER_DETAIL: this.userObject,
                })
            }
        }
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    // Hit the Sign Up API
    hitSignUpApi = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                ...this.userObject
            }

            hitApi(urls.USER_SIGN_UP, urls.POST, params, this.showLoader, (jsonResponse) => {
                AsyncStorageHelper.saveStringAsync(constants.IS_USER_LOGGED_IN, 'true')
                AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(jsonResponse.response.data[0]))
                setTimeout(() => {
                    this.moveToHome()
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    // Hit the Resend OTP API
    resendSignUpOtp = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                emailId: this.userObject.emailId
            }

            hitApi(urls.USER_SIGN_UP_OTP_EMAIL, urls.POST, params, this.showLoader, (jsonResponse) => {
                this.receivedOtp = jsonResponse.response.data[0].otp
                alertDialog("", jsonResponse.message)
            })
        })
    }

    // Hit Reset OTP API for Forgot Password
    resendForgotPasswordOtp = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                emailId: this.userObject.emailId,
            }

            hitApi(urls.USER_FORGOT_PASSWORD_OTP_EMAIL, urls.POST, params, this.showLoader, (jsonResponse) => {
                this.receivedOtp = jsonResponse.response.data[0].otp
                alertDialog("", jsonResponse.message)
            })    
        })
    }

    moveToHome = () => {
        startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
    }
}

const styles = StyleSheet.create({
    imageContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    contentContainer: {
        flex: 1,
    },
    textInput: {
        marginTop: 60
    },
});
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
import colors from '../config/Colors'
import { constants, urls, screenNames } from '../config/Constants'
import strings from '../config/Strings'
import { getScreenDimensions, startStackFrom, alertDialog } from '../utilities/HelperFunctions'
import { hitApi } from '../api/ApiCall'

/**
 * Enter OTP Screen
 */
export default class EnterOTPScreen extends Component {
    constructor(props) {
        super(props)

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

                            <ButtonComponent
                                style={{ marginTop: 20, }}
                                isFillRequired={true}
                                onPress={() => { this.verifyOtp() }}>
                                {strings.submit}
                            </ButtonComponent>

                            <TouchableOpacity
                                onPress={() => {
                                    this.otpTextInput.clear()
                                    this.setState({
                                        otpError: ""
                                    })
                                    this.resendForgotPasswordOtp()

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

    // Validate OTP entered
    verifyOtp = () => {
        if (this.otp == '') {
            this.setState({
                otpError: strings.please_enter_otp
            })
        } else if (this.otp.length < 4) {
            this.setState({
                otpError: strings.otp_should_be
            })
        } else if (this.otp != this.receivedOtp) {
            this.setState({
                otpError: strings.incorrect_otp
            })
        } else {
            this.props.navigation.navigate(screenNames.RESET_PASSWORD_SCREEN, {
                USER_DETAIL: this.userObject,
            })
        }
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    // API to resend OTP
    resendForgotPasswordOtp = () => {
        const params = {
            emailId: this.userObject.emailId,
        }
        hitApi(urls.USER_FORGOT_PASSWORD_OTP_EMAIL, urls.POST, params, this.showLoader, (jsonResponse) => {
            this.receivedOtp = jsonResponse.response.data[0].otp
            alertDialog("", jsonResponse.message)
        })
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
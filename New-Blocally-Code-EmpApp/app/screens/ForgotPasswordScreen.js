import React, { Component } from 'react'
import {
    View, StyleSheet, KeyboardAvoidingView, SafeAreaView, Platform,
    TouchableOpacity, StatusBar, ScrollView, Alert
} from 'react-native'
import commonStyles from '../styles/Styles'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import LoaderComponent from '../components/LoaderComponent'
import FloatingTextInputComponent from '../components/FloatingTextInputComponent'
import ButtonComponent from '../components/ButtonComponent'
import ImageComponent from '../components/ImageComponent'
import colors from '../config/Colors'
import { constants, screenNames, urls } from '../config/Constants'
import strings from '../config/Strings'
import { getScreenDimensions, } from '../utilities/HelperFunctions'
import { hitApi } from '../api/ApiCall';

/**
 * Forgot Password Screen
 */
export default class ForgotPasswordScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.imageContainerHeight = this.screenDimensions.height * constants.LOGO_VIEW_HEIGHT_PERCENTAGE
        this.email = ""
        this.state = {
            showLoader: false,
            emailError: ""
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
                                keyboardType={"email-address"}
                                style={[styles.textInput, { borderColor: this.state.emailError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                onChangeText={(text) => {
                                    this.setState({
                                        emailError: ""
                                    })
                                    this.email = text
                                }}
                                maxLength={constants.EMAIL_CHAR_MAX_LIMIT}>
                                {strings.emailId}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.emailError}
                            </TextComponent>

                            <ButtonComponent
                                style={{ marginTop: 20, }}
                                isFillRequired={true}
                                onPress={() => this.onSendLink()}>
                                {strings.send_otp}
                            </ButtonComponent>

                            <TouchableOpacity
                                onPress={() => { this.props.navigation.goBack(null) }}>
                                <View style={{ flexDirection: 'row', marginTop: 30, alignItems: 'center', marginBottom: 20 }}>
                                    <TextComponent
                                        style={{ color: colors.primaryColor, textDecorationLine: 'underline', marginStart: 5 }}>
                                        {strings.back_to_login}
                                    </TextComponent>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // click listener for send button
    onSendLink = () => {
        if (this.email == '') {
            this.setState({
                emailError: strings.enter_email
            })
        } else if (constants.EMAIL_REGULAR_EXPRESSION.test(this.email) === false) {
            this.setState({
                emailError: strings.invalid_email
            })
        } else {
            const userObject = {
                emailId: this.email,
            }

            // API to send OTP
            hitApi(urls.USER_FORGOT_PASSWORD_OTP_EMAIL, urls.POST, userObject, this.showLoader, (jsonResponse) => {
                let receivedOtp = jsonResponse.response.data[0].otp
                this.props.navigation.navigate(screenNames.ENTER_OTP_SCREEN, {
                    RECEIVED_OTP: receivedOtp,
                    USER_DETAIL: userObject,
                })
            })
        }
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
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
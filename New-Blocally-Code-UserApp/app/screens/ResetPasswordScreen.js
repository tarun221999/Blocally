import React, { Component } from 'react'
import {
    View, StyleSheet, KeyboardAvoidingView, SafeAreaView, Platform,
    TouchableOpacity, StatusBar, ScrollView, BackHandler
} from 'react-native'
import commonStyles from '../styles/Styles'
import LoaderComponent from '../components/LoaderComponent'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import FloatingTextInputComponent from '../components/FloatingTextInputComponent'
import ButtonComponent from '../components/ButtonComponent'
import ImageComponent from '../components/ImageComponent'
import colors from '../config/colors'
import { constants, urls, screenNames, } from '../config/constants'
import strings from '../config/strings'
import { getScreenDimensions, startStackFrom, alertDialog, getCommonParamsForAPI } from '../utilities/HelperFunctions'
import { hitApi } from '../api/APICall'

/**
 * Reset Password Screen
 */
export default class ResetPasswordScreen extends Component {
    constructor(props) {
        super(props)
        this.userObject = this.props.navigation.state.params.USER_DETAIL
        this.screenDimensions = getScreenDimensions()
        this.imageContainerHeight = this.screenDimensions.height * constants.LOGO_VIEW_HEIGHT_PERCENTAGE

        this.newPassword = ""
        this.confirmPassword = ""

        this.state = {
            showLoader: false,
            newPasswordError: "",
            confirmPasswordError: "",
        }
    }

    // Returns the UI of the screen
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
                                secureTextEntry={true}
                                style={[styles.textInput,
                                { marginTop: 20, borderColor: this.state.newPasswordError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                returnKeyType={"next"}
                                onSubmitEditing={() => { this.confirmPasswordTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        newPasswordError: ''
                                    })
                                    this.newPassword = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}>
                                {strings.new_password + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.newPasswordError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                secureTextEntry={true}
                                style={[styles.textInput, { borderColor: this.state.confirmPasswordError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                returnKeyType={"done"}
                                getRef={(input) => { this.confirmPasswordTextInput = input }}
                                onChangeText={(text) => {
                                    this.setState({
                                        confirmPasswordError: ''
                                    })
                                    this.confirmPassword = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}>
                                {strings.confirm_password + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.confirmPasswordError}
                            </TextComponent>

                            <ButtonComponent
                                style={{ marginTop: 20, }}
                                isFillRequired={true}
                                onPress={this.onResetPassword}>
                                {strings.reset_password}
                            </ButtonComponent>

                            <TouchableOpacity
                                onPress={() => {
                                    this.props.navigation.goBack(null)
                                }}>
                                <View style={[commonStyles.rowContainer, { marginTop: 30, alignItems: 'center', marginBottom: 20 }]}>
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

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    // Click listener for Reset Password
    onResetPassword = () => {
        if (this.newPassword == '') {
            this.setState({
                newPasswordError: strings.enter_new_password
            })
        } else if (this.newPassword.length < 6) {
            this.setState({
                newPasswordError: strings.password_should_be
            })
        } else if (this.confirmPassword == '') {
            this.setState({
                confirmPasswordError: strings.enter_confirm_password
            })
        } else if (this.newPassword !== this.confirmPassword) {
            this.setState({
                confirmPasswordError: strings.new_password_do_not_match
            })
        } else {
            this.userObject.newPassword = this.newPassword

            // Hit API to reset password
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    ...this.userObject
                }
    
                hitApi(urls.USER_FORGOT_PASSWORD, urls.POST, params, this.showLoader, (jsonResponse) => {
                    alertDialog("", strings.password_changed_successfully, strings.ok, "", () => {
                        startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                    })
                })    
            })
        }
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
        marginTop: 0
    },
});
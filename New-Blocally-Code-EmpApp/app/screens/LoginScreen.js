import React, { Component } from 'react'
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View,
    StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar
} from 'react-native'
import commonStyles from '../styles/Styles'
import colors from '../config/Colors'
import { constants, screenNames, urls, appTypes, userTypes } from '../config/Constants'
import StatusBarComponent from '../components/StatusBarComponent'
import ImageComponent from '../components/ImageComponent'
import ButtonComponent from '../components/ButtonComponent'
import LoaderComponent from '../components/LoaderComponent'
import { getScreenDimensions, startStackFrom, alertDialog, getCommonParamsForAPI } from '../utilities/HelperFunctions'
import TextComponent from '../components/TextComponent'
import FloatingTextInputComponent from '../components/FloatingTextInputComponent'
import strings from '../config/Strings'
import { hitApi } from '../api/ApiCall'
import { getUniqueId, getUniqueIdSync, getVersion } from 'react-native-device-info';
import AsyncStorageHelper from '../utilities/AsyncStorageHelper';

/**
 * Login Screen
 */
export default class LoginScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.imageContainerHeight = this.screenDimensions.height * constants.LOGO_VIEW_HEIGHT_PERCENTAGE

        this.email = ""
        this.password = ""
        this.state = {
            showLoader: false,
            emailError: "",
            passwordError: "",
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
                            keyboardShouldPersistTaps={'always'}
                            contentContainerStyle={commonStyles.centerInContainer}>
                            <FloatingTextInputComponent
                                keyboardType={"email-address"}
                                style={[styles.textInput, { borderColor: this.state.emailError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                returnKeyType={"next"}
                                onSubmitEditing={() => { this.passwordTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        emailError: ''
                                    })
                                    this.email = text.trim()
                                }}
                                maxLength={constants.EMAIL_CHAR_MAX_LIMIT}
                                placeholderTextColor={colors.placeHolderTextColor}>
                                {strings.emailId}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.emailError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                style={[styles.textInput, { borderColor: this.state.passwordError == '' ? colors.black : colors.red }]}
                                getRef={(input) => { this.passwordTextInput = input }}
                                onChangeText={(text) => {
                                    this.setState({
                                        passwordError: ''
                                    })
                                    this.password = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}
                                secureTextEntry={true}
                                placeholderTextColor={colors.placeHolderTextColor}>
                                {strings.password}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.passwordError}
                            </TextComponent>

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => this.props.navigation.navigate(screenNames.FORGOT_PASSWORD_SCREEN)}>
                                <TextComponent style={{ color: colors.darkBlueTextColor }}>
                                    {strings.forgotPassword}
                                </TextComponent>
                            </TouchableOpacity>

                            <ButtonComponent
                                style={{ marginTop: 30, }}
                                isFillRequired={true}
                                onPress={() => {
                                    this.onSignInPress()
                                }}>
                                {strings.sign_in}
                            </ButtonComponent>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // click listener for sign in button
    onSignInPress = () => {
        if (this.email == '') {
            this.setState({
                emailError: strings.enter_email
            })
        } else if (constants.EMAIL_REGULAR_EXPRESSION.test(this.email) === false) {
            this.setState({
                emailError: strings.invalid_email
            })
        } else if (this.password == '') {
            this.setState({
                passwordError: strings.enter_password
            })
        } else {
            // api to login
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    emailId: this.email,
                    password: this.password,
                    deviceId: "",
                    deviceType: Platform.OS,
                    uniqueId: getUniqueIdSync(),
                    userAppVersion: getVersion(),
                    appType: appTypes.ENTREPRENEUR_APP
                }

                hitApi(urls.LOGIN, urls.POST, params, this.showLoader, (jsonResponse) => {
                    let userRole = jsonResponse.response.data[0].userRole + ""
                    let bid = jsonResponse.response.data[0].businessId + ""
                    if (userRole === userTypes.ENTREPRENEUR) {
                        alertDialog("", strings.ent_login_not_allowed);
                    } else if (userRole === userTypes.EMPLOYEE) {
                        AsyncStorageHelper.saveStringAsync(constants.IS_USER_LOGGED_IN, 'true')
                        AsyncStorageHelper.saveStringAsync(constants.TYPE_OF_USER, userRole)
                        AsyncStorageHelper.saveStringAsync(constants.BUISSNESS_ID, bid)
                        AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(jsonResponse.response.data[0]))

                        startStackFrom(this.props.navigation, screenNames.EMPLOYEE_HOME_SCREEN)
                    } else {
                        // should never happen
                        alertDialog("", "Wrong type of user");
                    }
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
    forgotPassword: {
        alignSelf: 'flex-end',
        paddingBottom: 20
    },
    contentContainer: {
        flex: 1,
    }
})
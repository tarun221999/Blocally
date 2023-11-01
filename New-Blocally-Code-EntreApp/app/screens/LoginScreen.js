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
import messaging from '@react-native-firebase/messaging';

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
        this.fcmToken = ""
        this.state = {
            showLoader: false,
            emailError: "",
            passwordError: "",
        }

        this.fcmTokenCounter = 0
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
                            <View style={{ flexDirection: 'row', marginTop: 20 }}>
                                <TextComponent style={{ color: colors.primaryColor }}>
                                    {strings.new_entrepreneur}
                                </TextComponent>
                                <TouchableOpacity onPress={() => this.props.navigation.navigate(screenNames.SIGN_UP_SCREEN)}>
                                    <TextComponent
                                        style={{ color: colors.primaryColor, marginStart: 2, textDecorationLine: 'underline' }}>
                                        {strings.sign_up}
                                    </TextComponent>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        );
    }

    componentDidMount() {
        this.setupFcm();
    }

    // check push permission
    setupFcm = async () => {
        const checkPermission = await messaging().hasPermission()
        const permissionEnabled =
            checkPermission === messaging.AuthorizationStatus.AUTHORIZED ||
            checkPermission === messaging.AuthorizationStatus.PROVISIONAL;

        if (permissionEnabled) {
            this.getFcmToken();
        } else {
            this.requestFcmPermission();

        }
    }

    // ask for push permission
    requestFcmPermission = async () => {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            this.getFcmToken();
        }
    }

    // request fcm token
    getFcmToken = async () => {
        await messaging().getToken()
            .then(fcmToken => {
                if (fcmToken) {
                    this.setState({
                        showLoader: false
                    }, () => {
                        this.fcmToken = fcmToken;
                        AsyncStorageHelper.saveStringAsync(constants.FCM_TOKEN, fcmToken);
                    })
                } else {
                    this.tryToGetTokenAgain()
                }
            })
            .catch(error => {
                this.tryToGetTokenAgain()
            });
    }

    // request fcm token again if not generated
    tryToGetTokenAgain = () => {
        if (this.fcmTokenCounter < 3) {
            if (!this.state.showLoader) {
                this.setState({
                    showLoader: true
                })
            }

            this.fcmTokenCounter++
            this.getFcmToken()
        } else {
            this.setState({
                showLoader: false
            })
        }
    }

    // click listener for sign in button
    onSignInPress = () => {
        if (this.fcmToken == null || this.fcmToken == "") {
            this.setupFcm()
        }
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
                    deviceId: this.fcmToken,
                    deviceType: Platform.OS,
                    uniqueId: getUniqueIdSync(),
                    userAppVersion: getVersion(),
                    appType: appTypes.ENTREPRENEUR_APP
                }

                hitApi(urls.LOGIN, urls.POST, params, this.showLoader, (jsonResponse) => {
                    setTimeout(() => {
                        let userRole = jsonResponse.response.data[0].userRole + ""
                        let bid = jsonResponse.response.data[0].businessId + ""
                        if (userRole === userTypes.ENTREPRENEUR) {
                            AsyncStorageHelper.saveStringAsync(constants.IS_USER_LOGGED_IN, 'true')
                            AsyncStorageHelper.saveStringAsync(constants.TYPE_OF_USER, userRole)
                            AsyncStorageHelper.saveStringAsync(constants.BUISSNESS_ID, bid)
                            AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(jsonResponse.response.data[0]))

                            startStackFrom(this.props.navigation, screenNames.HOME_SCREEN)
                        } else if (userRole === userTypes.EMPLOYEE) {
                            alertDialog("", strings.emp_login_not_allowed);
                        } else {
                            // should never happen
                            alertDialog("", "Wrong type of user");
                        }
                    }, constants.HANDLING_TIMEOUT)
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
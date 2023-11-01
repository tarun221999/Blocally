import React, { Component } from 'react'
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native'
import commonStyles from '../styles/Styles'
import LoaderComponent from '../components/LoaderComponent'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import FloatingTextInputComponent from '../components/FloatingTextInputComponent'
import ButtonComponent from '../components/ButtonComponent'
import ImageComponent from '../components/ImageComponent'
import colors from '../config/colors'
import { constants, screenNames, urls, sizes, appTypes, fontNames } from '../config/constants'
import strings from '../config/strings'
import { getScreenDimensions, alertDialog, openUrlInBrowser, startStackFrom, getCommonParamsForAPI } from '../utilities/HelperFunctions'
import AsyncStorageHelper from '../utilities/AsyncStorageHelper'
import { hitApi } from '../api/APICall'
import { getUniqueId, getUniqueIdSync, getVersion } from 'react-native-device-info';
import { LoginManager,AccessToken, GraphRequest, GraphRequestManager } from 'react-native-fbsdk-next';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import messaging from '@react-native-firebase/messaging';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import notifee, { AndroidBadgeIconType, AndroidDefaults, AndroidGroupAlertBehavior, AndroidImportance, EventType } from '@notifee/react-native';

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

        this.appleAuthCredentialListener = null;
        this.appleUser = null;

        this.state = {
            showLoader: false,
            emailError: "",
            passwordError: "",
            appleCredentialStateForUser: -1,
        }

        this.fcmTokenCounter = 0
    }

    // Returns the UI
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
                                style={{ marginTop: 10, borderColor: this.state.emailError == '' ? colors.black : colors.red }}
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
                                style={{ borderColor: this.state.passwordError == '' ? colors.black : colors.red }}
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
                                style={{ marginTop: 20, }}
                                isFillRequired={true}
                                onPress={this.onSignInPress}>
                                {strings.sign_in}
                            </ButtonComponent>

                            <View style={[commonStyles.rowContainer, commonStyles.centerInContainer, { marginTop: 10 }]}>
                                <TextComponent style={{ color: colors.primaryColor }}>
                                    {strings.new_user}
                                </TextComponent>
                                <TouchableOpacity
                                    style={[commonStyles.rowContainer, { paddingHorizontal: 5, paddingVertical: 5, }]}
                                    onPress={() => {
                                        if(this.fcmToken == null || this.fcmToken == "") {
                                            this.setupFcm()
                                        }
                                        this.props.navigation.navigate(screenNames.SIGN_UP_SCREEN)
                                    }}>
                                    <TextComponent
                                        style={{ color: colors.primaryColor, marginStart: 2, textDecorationLine: 'underline' }}>
                                        {strings.sign_up}
                                    </TextComponent>
                                </TouchableOpacity>
                            </View>

                            <View style={[commonStyles.rowContainer, commonStyles.centerInContainer,]}>
                                <TextComponent style={{ color: colors.primaryColor }}>
                                    {strings.are_you_entrepreneur}
                                </TextComponent>
                                <TouchableOpacity
                                    style={[commonStyles.rowContainer, { paddingHorizontal: 5, paddingVertical: 5 }]}
                                    onPress={() => this.props.navigation.navigate(screenNames.ENTREPRENEUR_SIGN_UP_SCREEN)}>
                                    <TextComponent
                                        style={{ color: colors.primaryColor, textDecorationLine: 'underline' }}>
                                        {strings.contact_us}
                                    </TextComponent>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={() => { this.moveToHome() }}
                                style={{ marginTop: 20, paddingVertical: 5, marginBottom: 20/* marginVertical: 20 */ }}>
                                <TextComponent
                                    style={{ color: colors.primaryColor, textDecorationLine: 'underline', fontSize: sizes.xLargeTextSize }}>
                                    {strings.continue_as_guest}
                                </TextComponent>
                            </TouchableOpacity>

                            <View style={[commonStyles.centerInContainer, { marginTop: 40 }]}>
                                <TextComponent style={{ color: colors.white }}>
                                    {strings.or_login_using}
                                </TextComponent>

                                <View style={[commonStyles.centerInContainer, commonStyles.rowContainer, styles.socialMediaView]}>
                                    <TouchableOpacity
                                        onPress={() => this.handleFacebookLogin()}>
                                        <View style={[commonStyles.centerInContainer, commonStyles.rowContainer, { paddingVertical: 5, paddingHorizontal: 20 }]}>
                                            <ImageComponent
                                                source={require('../assets/facebook.png')} />
                                            <TextComponent
                                                style={{ marginStart: 5 }}>
                                                {strings.facebook}
                                            </TextComponent>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{ width: 1, backgroundColor: colors.primaryColor, height: '100%' }} />
                                    <TouchableOpacity
                                        onPress={this.googleSignIn}>
                                        <View style={[commonStyles.centerInContainer, commonStyles.rowContainer, { paddingVertical: 5, paddingHorizontal: 20 }]}>
                                            <ImageComponent
                                                source={require('../assets/google.png')} />
                                            <TextComponent
                                                style={{ marginStart: 5 }}>
                                                {strings.google}
                                            </TextComponent>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {appleAuth.isSupported &&
                                    <AppleButton
                                        style={styles.appleButton}
                                        cornerRadius={5}
                                        buttonStyle={AppleButton.Style.WHITE}
                                        buttonType={AppleButton.Type.CONTINUE}
                                        onPress={() => this.appleSignIn()}
                                    />
                                }

                                <TextComponent style={{
                                    fontSize: sizes.normalTextSize, textAlign: 'center',
                                    color: colors.white, marginTop: 10,
                                }}>
                                    {strings.by_choosing_this_option}
                                </TextComponent>
                                <TouchableOpacity
                                    style={{ padding: 5 }}
                                    onPress={() => openUrlInBrowser(urls.TERMS_AND_CONDITIONS)}>
                                    <TextComponent style={[commonStyles.terms, {
                                        fontSize: sizes.normalTextSize, color: colors.white,
                                    }]}>
                                        {" " + strings.terms_and_conditions + "."}
                                    </TextComponent>
                                </TouchableOpacity>

                                <TextComponent style={{
                                    fontSize: sizes.normalTextSize, textAlign: 'center',
                                    color: colors.white, marginTop: 20,
                                }}>
                                    {strings.your_data_belongs_to_you}
                                </TextComponent>

                                <TouchableOpacity
                                    style={{ padding: 5, marginBottom: 40 }}
                                    onPress={() => openUrlInBrowser(urls.DATA_PROTECTION_URL)}>
                                    <TextComponent style={[commonStyles.terms, {
                                        fontSize: sizes.normalTextSize, color: colors.white,
                                    }]}>
                                        {" " + strings.info_on_data_protection + "."}
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

        // Configure Google Login
        GoogleSignin.configure();

        // For Apple Login
        if (appleAuth.isSupported) {
            this.appleAuthCredentialListener = appleAuth.onCredentialRevoked(async () => {
                this.fetchAndUpdateCredentialState().catch(error =>
                    this.setState({ appleCredentialStateForUser: `Error: ${error.code}` }),
                );
            });

            this.fetchAndUpdateCredentialState()
                .then(res => this.setState({ appleCredentialStateForUser: res }))
                .catch(error => this.setState({ appleCredentialStateForUser: `Error: ${error.code}` }))
        }
    }

    // Check if App has permission
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

    // Request for FCM permission, if not allowed already
    requestFcmPermission = async () => {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            this.getFcmToken();
        }
    }

    // Request the FCM Token
    getFcmToken = async() => {
        await messaging().getToken()
            .then(fcmToken => {
                if (fcmToken) {
                    this.setState({
                        showLoader: false
                    }, () => {
                        this.fcmToken = fcmToken;
                        // console.log("getToken fcm " + fcmToken);
                        AsyncStorageHelper.saveStringAsync(constants.FCM_TOKEN, fcmToken);
                    })
                } else {
                    // no token yet
                    this.tryToGetTokenAgain()
                }
            })
            .catch(error => {
                // console.log("Error while fetching token " + error)
                this.tryToGetTokenAgain()
            });
    }

    // Repeat to get the token
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

    componentWillUnmount() {
        console.log("unmount");
        if (this.appleAuthCredentialListener) {
            this.appleAuthCredentialListener();
        }
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    // Social Login API
    hitSocialLogin = (socialData) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                ...socialData,
                deviceId: this.fcmToken,
                deviceType: Platform.OS,
                uniqueId: getUniqueIdSync(),
                userAppVersion: getVersion(),
            }

            hitApi(urls.USER_SOCIAL_LOGIN, urls.POST, params, /* this.showLoader */null, (jsonResponse) => {
                this.setState({
                    showLoader: false
                }, () => {
                    setTimeout(() => {
                        if (jsonResponse.response.data[0].allowLogin) {
                            AsyncStorageHelper.saveStringAsync(constants.IS_USER_LOGGED_IN, 'true')
                            AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(jsonResponse.response.data[0]))
                            this.moveToHome()
                        } else if (jsonResponse.response.data[0].allowRegistration) {
                            this.props.navigation.navigate(screenNames.SOCIAL_SIGN_UP_SCREEN, {
                                USER_DETAIL: params,
                            })
                        } else {
                            // should never happen
                            this.props.navigation.navigate(screenNames.SOCIAL_SIGN_UP_SCREEN, {
                                USER_DETAIL: [params , {"alreadyRegistered": true}],
                            })
                            alertDialog("", jsonResponse.message)
                        }
                    }, constants.HANDLING_TIMEOUT)
                })
            }, (jsonResponse) => {
                this.setState({
                    showLoader: false
                }, () => {
                    setTimeout(() => {
                        if (jsonResponse.resCode && jsonResponse.resCode > 100 && jsonResponse.resCode < 200) {
                            alertDialog("", jsonResponse.message)
                        } else {
                            alertDialog("", strings.could_not_connect_server)
                        }
                    }, constants.HANDLING_TIMEOUT)
                })
            })
        })
    }

    // Click Listener for Sign In button
    onSignInPress = () => {
        if(this.fcmToken == null || this.fcmToken == "") {
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
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    emailId: this.email,
                    password: this.password,
                    deviceId: this.fcmToken,
                    deviceType: Platform.OS,
                    uniqueId: getUniqueIdSync(),
                    userAppVersion: getVersion(),
                    appType: appTypes.USER_APP,
                }

                hitApi(urls.USER_LOGIN, urls.POST, params, this.showLoader, (jsonResponse) => {
                    AsyncStorageHelper.saveStringAsync(constants.IS_USER_LOGGED_IN, 'true')
                    AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(jsonResponse.response.data[0]))
                    this.moveToHome()
                })
            })
        }
    }

    moveToHome = () => {
        startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
    }

    appleSignIn = async () => {
        // start a login request
        try {
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [
                    appleAuth.Scope.EMAIL,
                    appleAuth.Scope.FULL_NAME,
                ],
            });

            const {
                user: newUser,
                email,
                fullName,
                nonce,
                identityToken,
                realUserStatus,
            } = appleAuthRequestResponse;

            this.appleUser = newUser;

            this.fetchAndUpdateCredentialState()
                .then(res => this.setState({ appleCredentialStateForUser: res }))
                .catch(error =>
                    this.setState({ appleCredentialStateForUser: `Error: ${error.code}` }),
                );

            if (identityToken) {
                // console.log(nonce, identityToken);
            } else {
                // no token - failed sign-in
            }

            if (realUserStatus === appleAuth.UserStatus.LIKELY_REAL) {
                // console.log("I'm a real person!");
            }

            // console.log(`Apple Authentication Completed, ${this.appleUser}, ${email}, ${fullName.givenName}, ${fullName.familyName}`);

            AsyncStorageHelper.getStringAsync(constants.APPLE_USER)
                .then((strSavedAppleUser) => {
                    if (strSavedAppleUser) {
                        // already exists
                        let savedAppleUser = JSON.parse(strSavedAppleUser)

                        if (savedAppleUser.appleUser == this.appleUser) {
                            // all data should already exist locally
                            // fetch from that
                            this.signInUsingApple(this.appleUser, savedAppleUser.email, savedAppleUser.fullName)
                        } else {
                            // user logged in using some different id
                            let appleData = {
                                appleUser: this.appleUser,
                                email,
                                fullName
                            }
                            AsyncStorageHelper.saveStringAsync(constants.APPLE_USER, JSON.stringify(appleData))
                            this.signInUsingApple(this.appleUser, email, fullName)
                        }
                    } else {
                        // does not exist
                        let appleData = {
                            appleUser: this.appleUser,
                            email,
                            fullName
                        }
                        AsyncStorageHelper.saveStringAsync(constants.APPLE_USER, JSON.stringify(appleData))
                        this.signInUsingApple(this.appleUser, email, fullName)
                    }
                })
        } catch (error) {
            // console.error(error);
        }
    }

    // Apple - Sign In
    signInUsingApple = async (appleUser, email, fullName) => {
        if(this.fcmToken == null || this.fcmToken == "") {
            this.setupFcm()
        }
        const appleData = {
            isFacebookUser: false,
            facebookUserId: null,
            isGoogleUser: false,
            googleUserId: null,
            isAppleUser: true,
            appleUserId: appleUser,
            emailId: email ? email : '',
            firstName: fullName.givenName,
            lastName: fullName.familyName
        }
        this.hitSocialLogin(appleData)
    }

    // Update credentials for Apple
    fetchAndUpdateCredentialState = async () => {
        if (this.appleUser === null) {
            this.setState({ appleCredentialStateForUser: 'N/A' });
        } else {
            const credentialState = await appleAuth.getCredentialStateForUser(this.appleUser);
            if (credentialState === appleAuth.State.AUTHORIZED) {
                this.setState({ appleCredentialStateForUser: 'AUTHORIZED' });
            } else {
                this.setState({ appleCredentialStateForUser: credentialState });
            }
        }
    }

    // FB - Sign In
    handleFacebookLogin = () => {
        LoginManager.logInWithPermissions(['public_profile', 'email',]).then(
            (result) => {
                if (result.isCancelled) {
                    // Login cancelled
                } else {
                    this.setState({
                        showLoader: true
                    }, () => {
                        const infoRequest = new GraphRequest(
                            '/me?fields=name,first_name,last_name,email',
                            null,
                            this._responseInfoCallback,
                        );
                        new GraphRequestManager().addRequest(infoRequest).start();
                    })
                }
            },
            (error) => {
                alertDialog("", error.toString())
            }
        )
    }

    _responseInfoCallback = (error, result) => {
        if (error) {
            this.setState({
                showLoader: false
            }, () => {
                alertDialog("", error.toString())
            })
        } else {
            if(this.fcmToken == null || this.fcmToken == "") {
                this.setupFcm()
            }
            const facebookData = {
                isFacebookUser: true,
                facebookUserId: result.id,
                isGoogleUser: false,
                googleUserId: null,
                isAppleUser: false,
                appleUserId: null,
                emailId: result.email ? result.email : '',
                firstName: result.first_name,
                lastName: result.last_name
            }
            this.hitSocialLogin(facebookData)
        }
        LoginManager.logOut()
    }

    // Google - Sign In
    googleSignIn = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            
            if(this.fcmToken == null || this.fcmToken == "") {
                this.setupFcm()
            }

            const googleData = {
                isFacebookUser: false,
                facebookUserId: null,
                isGoogleUser: true,
                googleUserId: userInfo.user.id,
                isAppleUser: false,
                appleUserId: null,
                emailId: userInfo.user.email ? userInfo.user.email : '',
                firstName: userInfo.user.givenName,
                lastName: userInfo.user.familyName
            }
            this.hitSocialLogin(googleData)
            await GoogleSignin.signOut();

        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (f.e. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
                alertDialog("", error.toString())
            } else {
                // some other error happened
                alertDialog("", error.toString())
            }
        }
    };
}

const styles = StyleSheet.create({
    imageContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    contentContainer: {
        flex: 1,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        padding: 5
    },
    socialMediaView: {
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.primaryColor,
        marginTop: 5,
        backgroundColor: colors.white
    },
    appleButton: {
        width: 210,
        height: 30,
        margin: 10,
    },
});
import React, { Component } from 'react'
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View, StyleSheet,
    ImageBackground, ScrollView, TouchableOpacity, StatusBar, Modal,
    FlatList
} from 'react-native'
import commonStyles from '../../styles/Styles'
import StatusBarComponent from '../../components/StatusBarComponent'
import TextComponent from '../../components/TextComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import ImageComponent from '../../components/ImageComponent'
import colors from '../../config/colors'
import { constants, gender, userTypes, screenNames, sizes, urls } from '../../config/constants'
import strings from '../../config/strings'
import {
    getScreenDimensions, startStackFrom, alertDialog,
    openUrlInBrowser, getCommonParamsForAPI
} from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import DeviceInfo, { getUniqueId, getUniqueIdSync, getVersion } from 'react-native-device-info';
import CountryCodes from '../../utilities/CountryCodes.json';
import * as RNLocalize from "react-native-localize";
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'

/**
 * Sign Up Screen
 */
export default class SignUpScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.imageContainerHeight = this.screenDimensions.height * constants.LOGO_VIEW_HEIGHT_PERCENTAGE

        this.firstName = ""
        this.lastName = ""
        this.email = ""
        this.password = ""
        this.confirmPassword = ""
        this.mobileNumber = ""
        this.countries = []
        this.state = {
            showLoader: false,
            firstNameError: '',
            lastNameError: '',
            emailError: '',
            passwordError: '',
            confirmPasswordError: '',
            mobileNumberError: '',
            gender: '',
            showCountryCodes: false,
            currentCountryCode: '+49',
            termsAccepted: true,
        }

        this.fcmToken = ""
        // Get FCM token from shared
        AsyncStorageHelper.getStringAsync(constants.FCM_TOKEN)
            .then((fcmToken) => {
                if (fcmToken) {
                    this.fcmToken = fcmToken
                }
            })
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent backgroundColor={colors.transparent} />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showLoader} />

                {/* Country Code Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={this.state.showCountryCodes}
                    onRequestClose={() => {
                        this.toggleCountryCodeVisibility(false);
                    }}>
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity style={{ flex: 1 }}
                            onPress={() => { this.toggleCountryCodeVisibility(false) }}>
                        </TouchableOpacity>
                        <View style={commonStyles.countryCodeView}>
                            <TouchableOpacity
                                style={{ position: 'absolute', padding: 10, end: 0, }}
                                onPress={() => { this.toggleCountryCodeVisibility(false) }}>
                                <TextComponent style={{ color: colors.white }}>{strings.cancel}</TextComponent>
                            </TouchableOpacity>
                            <FlatList
                                data={this.countries}
                                style={{ flex: 1, marginTop: 15 }}
                                keyExtractor={(item, index) => index + ""}
                                renderItem={(item) =>
                                    <TouchableOpacity
                                        style={{ margin: 5, }}
                                        onPress={() => {
                                            this.setState({
                                                currentCountryCode: item.item.dial_code
                                            })
                                            this.toggleCountryCodeVisibility(false);
                                        }}>
                                        <TextComponent style={{ alignSelf: 'center', color: colors.white }}>
                                            {item.item.name} ({item.item.dial_code})
                                        </TextComponent>
                                    </TouchableOpacity>
                                } />
                        </View>
                    </View>
                </Modal>

                <ImageBackground
                    style={[commonStyles.componentBackgroundImage, {
                        width: this.screenDimensions.width,
                        height: this.screenDimensions.height + (Platform.OS === constants.IOS ? 0 : StatusBar.currentHeight),
                    }]}
                    source={require('../../assets/signup.png')} />
                <View style={[commonStyles.container, { backgroundColor: colors.transparent }]}>
                    <View style={[styles.imageContainer, { height: this.imageContainerHeight }]}>
                        <ImageComponent
                            source={require('../../assets/logo.png')} />
                    </View>
                    <SafeAreaView style={[styles.contentContainer, { marginTop: 10 }]}>
                        <ScrollView
                            style={[commonStyles.formScrollView, { paddingVertical: 0 }]}
                            contentContainerStyle={commonStyles.centerInContainer}
                            keyboardShouldPersistTaps={'always'}>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                autoCapitalize={"sentences"}
                                style={[styles.textInput, { borderColor: this.state.firstNameError == '' ? colors.black : colors.red }]}
                                returnKeyType={"next"}
                                onSubmitEditing={() => { this.lastNameTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        firstNameError: ''
                                    })
                                    this.firstName = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}
                                placeholderTextColor={colors.placeHolderTextColor}>
                                {strings.first_name + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.firstNameError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                autoCapitalize={"sentences"}
                                style={[styles.textInput, { borderColor: this.state.lastNameError == '' ? colors.black : colors.red }]}
                                returnKeyType={"next"}
                                getRef={(input) => { this.lastNameTextInput = input }}
                                onSubmitEditing={() => { this.emailIdTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        lastNameError: ''
                                    })
                                    this.lastName = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}>
                                {strings.last_name + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.lastNameError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"email-address"}
                                style={[styles.textInput, { borderColor: this.state.emailError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                returnKeyType={"next"}
                                getRef={(input) => { this.emailIdTextInput = input }}
                                onSubmitEditing={() => { this.passwordTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        emailError: ''
                                    })
                                    this.email = text.trim()
                                }}
                                maxLength={constants.EMAIL_CHAR_MAX_LIMIT}>
                                {strings.emailId + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.emailError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                secureTextEntry={true}
                                style={[styles.textInput, { borderColor: this.state.passwordError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                returnKeyType={"next"}
                                getRef={(input) => { this.passwordTextInput = input }}
                                onSubmitEditing={() => { this.confirmPasswordTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        passwordError: ''
                                    })
                                    this.password = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}>
                                {strings.password + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.passwordError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                secureTextEntry={true}
                                style={[styles.textInput, { borderColor: this.state.confirmPasswordError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                returnKeyType={"next"}
                                getRef={(input) => { this.confirmPasswordTextInput = input }}
                                onSubmitEditing={() => { this.phoneNumberTextInput.focus(); }}
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

                            <View style={commonStyles.rowContainer}>
                                <FloatingTextInputComponent
                                    style={[styles.textInput, { paddingStart: 120, borderColor: this.state.mobileNumberError == '' ? colors.black : colors.red }]}
                                    labelStyle={{ position: 'absolute', left: 120 }}
                                    keyboardType={"numeric"}
                                    returnKeyType={"done"}
                                    maxLength={constants.PHONE_CHAR_MAX_LIMIT}
                                    getRef={(input) => { this.phoneNumberTextInput = input }}
                                    onSubmitEditing={() => { }}
                                    onChangeText={(text) => {
                                        this.setState({
                                            mobileNumberError: ''
                                        })
                                        this.mobileNumber = text.trim()
                                    }}>
                                    {strings.mobile_number/*  + strings.asterisk */}
                                </FloatingTextInputComponent>
                                <View style={{ position: 'absolute', bottom: 0, marginStart: 0, }}>
                                    <TextComponent style={{ color: colors.greyTextColor }}>
                                        {strings.code}
                                    </TextComponent>
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.toggleCountryCodeVisibility(true)
                                        }}
                                        style={[commonStyles.rowContainer, commonStyles.centerInContainer, {
                                            paddingVertical: 8, zIndex: 1,
                                        }]}>
                                        <TextComponent style={{ fontSize: sizes.xLargeTextSize, width: 80, textAlign: 'center' }}>
                                            {this.state.currentCountryCode}
                                        </TextComponent>
                                        <ImageComponent source={require('../../assets/downArrowPurple.png')} />
                                        <View style={commonStyles.verticalLine} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.mobileNumberError}
                            </TextComponent>

                            <View style={[commonStyles.rowContainer, { width: '100%', marginTop: 10, }]}>
                                <TouchableOpacity style={[commonStyles.rowContainer, { padding: 5 }]}
                                    onPress={() => this.setState({ gender: gender.MALE })}>
                                    <ImageComponent source={
                                        this.state.gender === gender.MALE ?
                                            require('../../assets/radioButton.png') :
                                            require('../../assets/radioButtonEmpty.png')
                                    }
                                        style={{ alignSelf: 'center' }} />
                                    <TextComponent style={{ marginStart: 5, color: colors.white }}>{strings.male}</TextComponent>
                                </TouchableOpacity>

                                <TouchableOpacity style={[commonStyles.rowContainer, { marginStart: 30, padding: 5 }]}
                                    onPress={() => this.setState({ gender: gender.FEMALE })}>
                                    <ImageComponent source={
                                        this.state.gender === gender.FEMALE ?
                                            require('../../assets/radioButton.png') :
                                            require('../../assets/radioButtonEmpty.png')
                                    }
                                        style={{ alignSelf: 'center' }} />
                                    <TextComponent style={{ marginStart: 5, color: colors.white }}>{strings.female}</TextComponent>
                                </TouchableOpacity>

                                <TouchableOpacity style={[commonStyles.rowContainer, { marginStart: 30, padding: 5 }]}
                                    onPress={() => this.setState({ gender: gender.OTHER })}>
                                    <ImageComponent source={
                                        this.state.gender === gender.OTHER ?
                                            require('../../assets/radioButton.png') :
                                            require('../../assets/radioButtonEmpty.png')
                                    }
                                        style={{ alignSelf: 'center' }} />
                                    <TextComponent style={{ marginStart: 5, color: colors.white }}>{strings.other}</TextComponent>
                                </TouchableOpacity>
                            </View>

                            <TextComponent style={{ color: colors.white, marginTop: 20, marginHorizontal: 20 }}>
                                {strings.conditions_our}
                            </TextComponent>
                            <View style={[commonStyles.rowContainer, { alignItems: 'center', marginHorizontal: 20, }]}>
                                <TouchableOpacity
                                    style={{ padding: 5 }}
                                    onPress={() => openUrlInBrowser(urls.TERMS_AND_CONDITIONS)}>
                                    <TextComponent style={[commonStyles.terms, { color: colors.white }]}>
                                        {strings.terms_and_conditions}
                                    </TextComponent>
                                </TouchableOpacity>
                                <TextComponent style={{ color: colors.white }}>
                                    {strings.conditions_apply}
                                </TextComponent>
                            </View>

                            <ButtonComponent
                                style={{ marginTop: 10, }}
                                isFillRequired={true}
                                onPress={this.signUpPress}>
                                {strings.i_agree_proceed}
                            </ButtonComponent>

                            <TextComponent style={{
                                fontSize: sizes.mediumTextSize, textAlign: 'center',
                                color: colors.white, marginHorizontal: 20, marginTop: 20,
                            }}>
                                {strings.your_data_belongs_to_you}
                            </TextComponent>

                            <TouchableOpacity
                                style={{ padding: 5, }}
                                onPress={() => openUrlInBrowser(urls.DATA_PROTECTION_URL)}>
                                <TextComponent style={[commonStyles.terms, {
                                    fontSize: sizes.mediumTextSize,
                                    color: colors.white,
                                }]}>
                                    {" " + strings.info_on_data_protection + "."}
                                </TextComponent>
                            </TouchableOpacity>

                            <View style={[commonStyles.rowContainer, {
                                width: '100%', marginTop: 20, marginBottom: 30, justifyContent: "space-around",
                            }]}>
                                <TouchableOpacity
                                    onPress={() => { this.props.navigation.goBack(null) }}>
                                    <View style={[commonStyles.rowContainer, { alignItems: 'center', }]}>
                                        <TextComponent
                                            style={{ color: colors.white, textDecorationLine: 'underline', marginStart: 5 }}>
                                            {strings.back_to_login}
                                        </TextComponent>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => { this.moveToHome() }}>
                                    <TextComponent
                                        style={{ color: colors.white, textDecorationLine: 'underline', }}>
                                        {strings.go_to_home}
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
        this.loadDataForCountryCodes()
    }

    // Click listener for Sign Up
    signUpPress = () => {
        if (this.firstName == '') {
            this.setState({
                firstNameError: strings.enter_first_name
            })
        } else if (this.lastName == '') {
            this.setState({
                lastNameError: strings.enter_last_name
            })
        } else if (this.email == '') {
            this.setState({
                emailError: strings.enter_email
            })
        } else if (!constants.EMAIL_REGULAR_EXPRESSION.test(this.email)) {
            this.setState({
                emailError: strings.invalid_email
            })
        } else if (this.password == '') {
            this.setState({
                passwordError: strings.enter_password
            })
        } else if (this.password.length < 6) {
            this.setState({
                passwordError: strings.password_should_be
            })
        } else if (this.confirmPassword == '') {
            this.setState({
                confirmPasswordError: strings.enter_confirm_password
            })
        } else if (this.password !== this.confirmPassword) {
            this.setState({
                confirmPasswordError: strings.password_do_not_match
            })
        } else if (this.mobileNumber !== '' && this.mobileNumber.length < constants.PHONE_CHAR_MIN_LIMIT) {
            this.setState({
                mobileNumberError: strings.mobile_should_be
            })
        } else if (this.mobileNumber !== '' && !constants.MOBILE_REGULAR_EXPRESSION.test(this.mobileNumber)) {
            this.setState({
                mobileNumberError: strings.enter_valid_mobile
            })
        } 
        // else if (this.state.gender == '') {
        //     alertDialog("", strings.choose_gender)
        // }
         else if (!this.state.termsAccepted) {
            alertDialog("", strings.accept_terms)
        } else {
            // move to verify OTP screen
            let countryCode = ""
            if (this.mobileNumber != '') {
                countryCode = this.state.currentCountryCode.substring(1)
            }

            const userObject = {
                firstName: this.firstName,
                lastName: this.lastName,
                emailId: this.email,
                password: this.password,
                gender: this.state.gender,
                countryCode: countryCode,
                contactNo: this.mobileNumber,
                userRole: userTypes.USER,
                deviceId: this.fcmToken,
                deviceType: Platform.OS,
                uniqueId: getUniqueIdSync(),
                userAppVersion: getVersion(),
                isFacebookUser: false,
                facebookUserId: "",
                isGoogleUser: false,
                googleUserId: ""
            }
            this.sendOtp(userObject)
            console.log("userObject",userObject)
        }
    }

    // API to send OTP
    sendOtp = (userObject) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                emailId: userObject.emailId
            }

            hitApi(urls.USER_SIGN_UP_OTP_EMAIL, urls.POST, params, this.showLoader, (jsonResponse) => {
                let receivedOtp = jsonResponse.response.data[0].otp

                this.props.navigation.navigate(screenNames.ENTER_OTP_SCREEN, {
                    COMING_FROM: screenNames.SIGN_UP_SCREEN,
                    RECEIVED_OTP: receivedOtp,
                    USER_DETAIL: userObject,
                })
            })
        })
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    toggleCountryCodeVisibility(visible) {
        this.setState({ showCountryCodes: visible });
    }

    moveToHome = () => {
        startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
    }

    // load data for country codes from json
    loadDataForCountryCodes = () => {
        let data = JSON.parse(JSON.stringify(CountryCodes));
        for (let index = 0; index < data.country_codes.length; index++) {
            var obj = data.country_codes[index]
            const element = {
                name: obj.name,
                dial_code: obj.dial_code,
                code: obj.code,
            }
            this.countries.push(element)
            if (RNLocalize.getCountry() == element.code) {
                this.setState({
                    currentCountryCode: element.dial_code
                })
            }
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
        marginTop: 10
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 5,
        marginEnd: 10,
        color: colors.primaryColor
    },
});
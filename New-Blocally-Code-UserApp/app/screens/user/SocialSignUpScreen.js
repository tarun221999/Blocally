import React, { Component } from 'react'
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View, StyleSheet,
    ScrollView, TouchableOpacity, Modal,
    FlatList
} from 'react-native'
import commonStyles from '../../styles/Styles'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import LoaderComponent from '../../components/LoaderComponent'
import ButtonComponent from '../../components/ButtonComponent'
import ImageComponent from '../../components/ImageComponent'
import colors from '../../config/colors'
import { constants, gender, userTypes, screenNames, sizes, urls } from '../../config/constants'
import strings from '../../config/strings'
import { startStackFrom, alertDialog, getCommonParamsForAPI } from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import CountryCodes from '../../utilities/CountryCodes.json';

/**
 * Screen for Social Sign Up
 */
export default class SocialSignUpScreen extends Component {
    constructor(props) {
        super(props);
        this.userObject = this.props.navigation.state.params.USER_DETAIL

        if (this.userObject.emailId && this.userObject.emailId != '' && !this.userObject.alreadyRegistered) {
            this.otpVerificationRequired = false
        } else {
            this.otpVerificationRequired = true
        }

        this.mobileNumber = ""
        this.countries = []
        this.state = {
            showLoader: false,
            emailError: '',
            mobileNumberError: '',
            gender: '',
            showCountryCodes: false,
            currentCountryCode: '+49',
        }
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
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

                <View style={commonStyles.container}>
                    <SafeAreaView style={commonStyles.container}>
                        <TitleBarComponent
                            title={strings.social_media_login}
                            navigation={this.props.navigation}
                        />
                        <ScrollView
                            style={commonStyles.formScrollView}
                            contentContainerStyle={commonStyles.centerInContainer}
                            keyboardShouldPersistTaps={'always'}>

                            <TextComponent style={styles.infoView}>
                                {strings.enter_additional_info}
                            </TextComponent>

                            {this.otpVerificationRequired &&
                                <FloatingTextInputComponent
                                    keyboardType={"email-address"}
                                    style={[styles.textInput,
                                    { marginTop: 20, borderColor: this.state.emailError == '' ? colors.black : colors.red }]}
                                    autoCapitalize={"none"}
                                    returnKeyType={"next"}
                                    onSubmitEditing={() => { this.phoneNumberTextInput.focus(); }}
                                    onChangeText={(text) => {
                                        this.setState({
                                            emailError: ''
                                        })
                                        this.userObject.emailId = text.trim()
                                    }}
                                    maxLength={constants.EMAIL_CHAR_MAX_LIMIT}>
                                    {strings.emailId + strings.asterisk}
                                </FloatingTextInputComponent>
                            }

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.emailError}
                            </TextComponent>

                            <View style={commonStyles.rowContainer}>
                                <FloatingTextInputComponent
                                    style={[styles.textInput, { paddingStart: 90, borderColor: this.state.mobileNumberError == '' ? colors.black : colors.red }]}
                                    labelStyle={{ position: 'absolute', left: 90 }}
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
                                    {strings.mobile_number /* + strings.asterisk */}
                                </FloatingTextInputComponent>

                                <TouchableOpacity
                                    onPress={() => {
                                        this.toggleCountryCodeVisibility(true)
                                    }}
                                    style={[commonStyles.rowContainer, commonStyles.centerInContainer, {
                                        position: 'absolute', bottom: 0,
                                        padding: 8, zIndex: 1
                                    }]}>
                                    <TextComponent style={{ fontSize: sizes.xLargeTextSize, marginEnd: 5 }}>
                                        {this.state.currentCountryCode}
                                    </TextComponent>
                                    <ImageComponent source={require('../../assets/downArrowPurple.png')} />
                                    <View style={commonStyles.verticalLine} />
                                </TouchableOpacity>
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
                                    <TextComponent style={{ marginStart: 5 }}>{strings.male}</TextComponent>
                                </TouchableOpacity>

                                <TouchableOpacity style={[commonStyles.rowContainer, { marginStart: 30, padding: 5 }]}
                                    onPress={() => this.setState({ gender: gender.FEMALE })}>
                                    <ImageComponent source={
                                        this.state.gender === gender.FEMALE ?
                                            require('../../assets/radioButton.png') :
                                            require('../../assets/radioButtonEmpty.png')
                                    }
                                        style={{ alignSelf: 'center' }} />
                                    <TextComponent style={{ marginStart: 5 }}>{strings.female}</TextComponent>
                                </TouchableOpacity>

                                <TouchableOpacity style={[commonStyles.rowContainer, { marginStart: 30, padding: 5 }]}
                                    onPress={() => this.setState({ gender: gender.OTHER })}>
                                    <ImageComponent source={
                                        this.state.gender === gender.OTHER ?
                                            require('../../assets/radioButton.png') :
                                            require('../../assets/radioButtonEmpty.png')
                                    }
                                        style={{ alignSelf: 'center' }} />
                                    <TextComponent style={{ marginStart: 5 }}>{strings.other}</TextComponent>
                                </TouchableOpacity>
                            </View>

                            <ButtonComponent
                                style={{ marginTop: 10, }}
                                isFillRequired={true}
                                onPress={this.onProceedPressed}>
                                {strings.proceed}
                            </ButtonComponent>

                            <TouchableOpacity
                                onPress={() => { this.props.navigation.goBack(null) }}>
                                <View style={[commonStyles.rowContainer, { marginTop: 30, alignItems: 'center', marginBottom: 20 }]}>
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

    componentDidMount() {
        this.loadDataForCountryCodes()
    }

    // Click listener for proceed button
    onProceedPressed = () => {
        if (this.otpVerificationRequired) {
            if (this.userObject.emailId == '') {
                this.setState({
                    emailError: strings.enter_email
                })
            } else if (constants.EMAIL_REGULAR_EXPRESSION.test(this.userObject.emailId) === false) {
                this.setState({
                    emailError: strings.invalid_email
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
            else {
                // move to verify OTP screen
                let countryCode = ""
                if (this.mobileNumber != '') {
                    countryCode = this.state.currentCountryCode.substring(1)
                }
                this.userObject.gender = this.state.gender
                this.userObject.countryCode = countryCode
                this.userObject.contactNo = this.mobileNumber
                this.userObject.userRole = userTypes.USER
                this.sendOtp()
            }
        } else {
            // do sign up directly
            if (this.mobileNumber !== '' && !constants.MOBILE_REGULAR_EXPRESSION.test(this.mobileNumber)) {
                this.setState({
                    mobileNumberError: strings.enter_valid_mobile
                })
            } 
            // else if (this.state.gender == '') {
            //     alertDialog("", strings.choose_gender)
            // } 
            else {
                let countryCode = ""
                if (this.mobileNumber != '') {
                    countryCode = this.state.currentCountryCode.substring(1)
                }

                this.userObject.gender = this.state.gender
                this.userObject.countryCode = countryCode
                this.userObject.contactNo = this.mobileNumber
                this.userObject.userRole = userTypes.USER
                this.hitSignUpApi()
            }
        }
    }

    // API to send otp
    sendOtp = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                emailId: this.userObject.emailId    
            }

            hitApi(urls.USER_SIGN_UP_OTP_EMAIL, urls.POST, params, this.showLoader, (jsonResponse) => {
                let receivedOtp = jsonResponse.response.data[0].otp
                this.props.navigation.navigate(screenNames.ENTER_OTP_SCREEN, {
                    COMING_FROM: screenNames.SIGN_UP_SCREEN,
                    RECEIVED_OTP: receivedOtp,
                    USER_DETAIL: this.userObject,
                })
            })
        })
    }

    // Api to Sign up
    hitSignUpApi = () => {
        hitApi(urls.USER_SIGN_UP, urls.POST, this.userObject, this.showLoader, (jsonResponse) => {
            AsyncStorageHelper.saveStringAsync(constants.IS_USER_LOGGED_IN, 'true')
            AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(jsonResponse.response.data[0]))
            this.moveToHome()
        })
    }

    moveToHome = () => {
        startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    toggleCountryCodeVisibility(visible) {
        this.setState({ showCountryCodes: visible });
    }

    // load data for country codes
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
        }
    }
}

const styles = StyleSheet.create({
    infoView: {
        fontSize: sizes.largeTextSize,
        textAlign: 'center',
        marginTop: 20
    },
    textInput: {
        marginTop: 0
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 5,
        marginEnd: 10,
        color: colors.primaryColor
    },
});
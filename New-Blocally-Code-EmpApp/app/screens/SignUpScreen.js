import React, { Component } from 'react'
import {
    KeyboardAvoidingView, Platform, View, StyleSheet,
    ImageBackground, ScrollView, TouchableOpacity, StatusBar, Modal,
    FlatList
} from 'react-native'
import commonStyles from '../styles/Styles'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import FloatingTextInputComponent from '../components/FloatingTextInputComponent'
import ButtonComponent from '../components/ButtonComponent'
import LoaderComponent from '../components/LoaderComponent'
import ImageComponent from '../components/ImageComponent'
import colors from '../config/Colors'
import { constants, screenNames, sizes, urls } from '../config/Constants'
import strings from '../config/Strings'
import {
    getScreenDimensions, alertDialog, startStackFrom
} from '../utilities/HelperFunctions'
import CountryCodes from '../utilities/CountryCodes.json';
import * as RNLocalize from "react-native-localize";
import { hitApi } from '../api/ApiCall';

/**
 * Contact Us form Screen
 */
export default class SignUpScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.imageContainerHeight = this.screenDimensions.height * constants.LOGO_VIEW_HEIGHT_PERCENTAGE
        this.firstName = ''
        this.lastName = ''
        this.businessName = ""
        this.businessAddress = ""
        this.emailId = ""
        this.mobileNumber = ""
        this.message = ""
        this.countries = []
        this.state = {
            firstNameError: '',
            lastNameError: '',
            businessNameError: '',
            addressError: '',
            emailError: '',
            mobileNumberError: '',
            showCountryCodes: false,
            currentCountryCode: '+49',
            showLoader: false
        }
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
                        <View style={styles.countryCodeView}>
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
                    source={require('../assets/signup.png')} />
                <View style={[commonStyles.container, { backgroundColor: colors.transparent }]}>
                    <View style={[styles.imageContainer, { height: this.imageContainerHeight }]}>
                        <ImageComponent
                            source={require('../assets/logo.png')} />
                    </View>
                    <View style={[styles.contentContainer, { marginTop: 10 }]}>
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
                                getRef={(input) => { this.lastNameTextInput = input }}
                                style={[styles.textInput, { borderColor: this.state.lastNameError == '' ? colors.black : colors.red }]}
                                returnKeyType={"next"}
                                onSubmitEditing={() => { this.businessNameTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        lastNameError: ''
                                    })
                                    this.lastName = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}
                                placeholderTextColor={colors.placeHolderTextColor}>
                                {strings.last_name + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.lastNameError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                autoCapitalize={"sentences"}
                                getRef={(input) => { this.businessNameTextInput = input }}
                                style={[styles.textInput, { borderColor: this.state.businessNameError == '' ? colors.black : colors.red }]}
                                returnKeyType={"next"}
                                onSubmitEditing={() => { this.addressTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        businessNameError: ''
                                    })
                                    this.businessName = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}
                                placeholderTextColor={colors.placeHolderTextColor}>
                                {strings.business_name + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.businessNameError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                autoCapitalize={"sentences"}
                                style={[styles.textInput, { borderColor: this.state.addressError == '' ? colors.black : colors.red }]}
                                returnKeyType={"next"}
                                getRef={(input) => { this.addressTextInput = input }}
                                onSubmitEditing={() => { this.emailIdTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        addressError: ''
                                    })
                                    this.businessAddress = text.trim()
                                }}
                                maxLength={constants.ADDRESS_CHAR_MAX_LIMIT}>
                                {strings.address + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.addressError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"email-address"}
                                style={[styles.textInput, { borderColor: this.state.emailError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                returnKeyType={"next"}
                                getRef={(input) => { this.emailIdTextInput = input }}
                                onSubmitEditing={() => { this.phoneNumberTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        emailError: ''
                                    })
                                    this.emailId = text.trim()
                                }}
                                maxLength={constants.EMAIL_CHAR_MAX_LIMIT}>
                                {strings.emailId + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.emailError}
                            </TextComponent>

                            <View style={commonStyles.rowContainer}>
                                <FloatingTextInputComponent
                                    style={[styles.textInput, { paddingStart: 80, borderColor: this.state.mobileNumberError == '' ? colors.black : colors.red }]}
                                    labelStyle={{ position: 'absolute', left: 90 }}
                                    keyboardType={"numeric"}
                                    returnKeyType={"next"}
                                    getRef={(input) => { this.phoneNumberTextInput = input }}
                                    onSubmitEditing={() => { this.messageTextInput.focus(); }}
                                    onChangeText={(text) => {
                                        this.setState({
                                            mobileNumberError: ''
                                        })
                                        this.mobileNumber = text.trim()
                                    }}
                                    maxLength={constants.PHONE_CHAR_MAX_LIMIT}>
                                    {strings.mobile_number + strings.asterisk}
                                </FloatingTextInputComponent>
                                <View style={{ position: 'absolute', bottom: 0, marginStart: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.toggleCountryCodeVisibility(true)
                                        }}
                                        style={[commonStyles.rowContainer, commonStyles.centerInContainer, {
                                            paddingVertical: 8, zIndex: 1
                                        }]}>
                                        <TextComponent style={{ fontSize: sizes.xLargeTextSize, marginEnd: 5 }}>
                                            {this.state.currentCountryCode}
                                        </TextComponent>
                                        <ImageComponent source={require('../assets/downArrowPurple.png')} />
                                        <View style={styles.verticalLine} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TextComponent style={commonStyles.errorText}>
                                {this.state.mobileNumberError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                autoCapitalize={"sentences"}
                                style={styles.textInput}
                                returnKeyType={"done"}
                                onSubmitEditing={() => { }}
                                getRef={(input) => { this.messageTextInput = input }}
                                onChangeText={(text) => {
                                    this.message = text.trim()
                                }}
                                maxLength={constants.ADDRESS_CHAR_MAX_LIMIT}
                                placeholderTextColor={colors.placeHolderTextColor}>
                                {strings.your_query}
                            </FloatingTextInputComponent>

                            <ButtonComponent
                                style={{ marginTop: 20, }}
                                isFillRequired={true}
                                onPress={this.signUpPress}>
                                {strings.sign_up}
                            </ButtonComponent>

                            <TouchableOpacity
                                onPress={() => { this.props.navigation.goBack(null) }}>
                                <View style={{ flexDirection: 'row', marginTop: 30, alignItems: 'center', marginBottom: 20 }}>
                                    <TextComponent
                                        style={{ color: colors.white, textDecorationLine: 'underline', marginStart: 5 }}>
                                        {strings.back_to_login}
                                    </TextComponent>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        );
    }

    componentDidMount() {
        this.loadDataForCountryCodes()
    }

    // click listener for sign up
    signUpPress = () => {
        if (this.firstName == '') {
            this.setState({
                firstNameError: strings.enter_first_name
            })
        } else if (this.lastName == '') {
            this.setState({
                lastNameError: strings.enter_last_name
            })
        } else if (this.businessName == '') {
            this.setState({
                businessNameError: strings.enter_businessName
            })
        } else if (this.businessAddress == '') {
            this.setState({
                addressError: strings.enter_address
            })
        } else if (this.emailId == '') {
            this.setState({
                emailError: strings.enter_email
            })
        } else if (!constants.EMAIL_REGULAR_EXPRESSION.test(this.emailId)) {
            this.setState({
                emailError: strings.invalid_email
            })
        } else if (this.mobileNumber == '') {
            this.setState({
                mobileNumberError: strings.enter_mobile
            })
        } else if (this.mobileNumber.length < constants.PHONE_CHAR_MIN_LIMIT) {
            this.setState({
                mobileNumberError: strings.mobile_should_be
            })
        } else if (!constants.MOBILE_REGULAR_EXPRESSION.test(this.mobileNumber)) {
            this.setState({
                mobileNumberError: strings.enter_valid_mobile
            })
        } else {
            let countryCode = ""
            if (this.mobileNumber != '') {
                countryCode = this.state.currentCountryCode.substring(1)
            }

            // api for send request
            const entrepreneurObject = {
                firstName: this.firstName,
                lastName: this.lastName,
                emailId: this.emailId,
                businessName: this.businessName,
                businessAddress: this.businessAddress,
                countryCode: countryCode,
                contactNo: this.mobileNumber,
                message: this.message
            }
            hitApi(urls.SEND_ENTREPRENEUR_REQUEST, urls.POST, entrepreneurObject, this.showLoader, (jsonResponse) => {
                alertDialog("", jsonResponse.message, strings.ok, "", () => {
                    this.props.navigation.goBack(null)
                })
            })
        }
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    toggleCountryCodeVisibility(visible) {
        this.setState({ showCountryCodes: visible });
    }

    // load country code data from json
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
    verticalLine: {
        width: 1,
        height: '100%',
        backgroundColor: colors.primaryColor,
        marginStart: 10
    },
    countryCodeView: {
        height: '50%',
        bottom: -30,
        backgroundColor: 'rgba(0, 0, 0, 0.80)',
        position: 'absolute',
        width: '100%',
        paddingVertical: 20
    },
    terms: {
        textDecorationLine: 'underline',
    }
});
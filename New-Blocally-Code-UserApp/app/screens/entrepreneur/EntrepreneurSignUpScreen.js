import React, { Component } from 'react'
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View, StyleSheet,
    ImageBackground, ScrollView, TouchableOpacity, StatusBar, Modal, FlatList
} from 'react-native'
import commonStyles from '../../styles/Styles'
import StatusBarComponent from '../../components/StatusBarComponent'
import TextComponent from '../../components/TextComponent'
import LoaderComponent from '../../components/LoaderComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import ButtonComponent from '../../components/ButtonComponent'
import ImageComponent from '../../components/ImageComponent'
import colors from '../../config/colors'
import { constants, sizes, urls } from '../../config/constants'
import strings from '../../config/strings'
import { getScreenDimensions, alertDialog, getCommonParamsForAPI, openUrlInBrowser } from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import CountryCodes from '../../utilities/CountryCodes.json';
import * as RNLocalize from "react-native-localize";

/**
 * Contact Us form screen for Ents
 */
export default class EntrepreneurSignUpScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.imageContainerHeight = this.screenDimensions.height * constants.LOGO_VIEW_HEIGHT_PERCENTAGE

        this.firstName = ""
        this.lastName = ""
        this.businessName = ""
        this.address = ""
        this.email = ""
        this.mobileNumber = ""
        this.query = ""
        this.countries = []
        this.state = {
            showLoader: false,
            firstNameError: '',
            lastNameError: '',
            businessNameError: '',
            emailError: '',
            mobileNumberError: '',
            showCountryCodes: false,
            currentCountryCode: '+49',
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
                        <ImageComponent source={require('../../assets/logo.png')} />
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
                                onSubmitEditing={() => this.lastNameTextInput.focus()}
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
                                getRef={(input) => this.lastNameTextInput = input}
                                onSubmitEditing={() => this.businessNameTextInput.focus()}
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
                                keyboardType={"default"}
                                style={[styles.textInput, { borderColor: this.state.businessNameError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"sentences"}
                                returnKeyType={"next"}
                                getRef={(input) => this.businessNameTextInput = input}
                                onSubmitEditing={() => this.addressTextInput.focus()}
                                onChangeText={(text) => {
                                    this.setState({
                                        businessNameError: false
                                    })
                                    this.businessName = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}
                                placeholderTextColor={colors.placeHolderTextColor}
                                keyboardType={"default"}>
                                {strings.business_name + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.businessNameError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                style={styles.textInput}
                                autoCapitalize={"sentences"}
                                returnKeyType={"next"}
                                getRef={(input) => this.addressTextInput = input}
                                onSubmitEditing={() => this.emailIdInputText.focus()}
                                onChangeText={(text) => {
                                    this.address = text.trim()
                                }}
                                maxLength={constants.ADDRESS_CHAR_MAX_LIMIT}>
                                {strings.address}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {/* Not showing error now

                                this.state.addressError */}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"email-address"}
                                style={[styles.textInput, { borderColor: this.state.emailError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                returnKeyType={"next"}
                                getRef={(input) => this.emailIdInputText = input}
                                onSubmitEditing={() => this.phoneNumber.focus()}
                                onChangeText={(text) => {
                                    this.setState({
                                        emailError: false
                                    })
                                    this.email = text.trim()
                                }}
                                maxLength={constants.EMAIL_CHAR_MAX_LIMIT}>
                                {strings.emailId + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.emailError}
                            </TextComponent>

                            <View style={commonStyles.rowContainer}>
                                <FloatingTextInputComponent
                                    style={[styles.textInput, { paddingStart: 120, borderColor: this.state.mobileNumberError == '' ? colors.black : colors.red }]}
                                    labelStyle={{ position: 'absolute', left: 120 }}
                                    keyboardType={"numeric"}
                                    maxLength={constants.PHONE_CHAR_MAX_LIMIT}
                                    returnKeyType={"next"}
                                    getRef={(input) => this.phoneNumber = input}
                                    onSubmitEditing={() => this.queryTextInput.focus()}
                                    onChangeText={(text) => {
                                        this.setState({
                                            mobileNumberError: ''
                                        })
                                        this.mobileNumber = text.trim()
                                    }}>
                                    {strings.phone_number + strings.asterisk}
                                </FloatingTextInputComponent>

                                <View style={{ position: 'absolute', bottom: 0, marginStart: 10 }}>
                                    <TextComponent style={{ color: colors.greyTextColor }}>{strings.code}</TextComponent>
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.toggleCountryCodeVisibility(true)
                                        }}
                                        style={[commonStyles.rowContainer, commonStyles.centerInContainer, {
                                            paddingVertical: 8, zIndex: 1
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

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                style={styles.textInput}
                                autoCapitalize={"sentences"}
                                returnKeyType={"done"}
                                getRef={(input) => this.queryTextInput = input}
                                onSubmitEditing={() => { }}
                                onChangeText={(text) => {
                                    this.query = text.trim()
                                }}
                                maxLength={constants.ADDRESS_CHAR_MAX_LIMIT}>
                                {strings.your_query}
                            </FloatingTextInputComponent>

                            <TextComponent style={{
                                fontSize: sizes.normalTextSize, textAlign: 'center',
                                color: colors.white, marginTop: 20,
                            }}>
                                {strings.ent_gdpr_text}
                            </TextComponent>

                            <TouchableOpacity
                                style={{ padding: 5, }}
                                onPress={() => openUrlInBrowser(urls.DATA_PROTECTION_URL)}>
                                <TextComponent style={[commonStyles.terms, {
                                    fontSize: sizes.normalTextSize, color: colors.white,
                                }]}>
                                    {" " + strings.ent_gdpr_link + "."}
                                </TextComponent>
                            </TouchableOpacity>

                            <ButtonComponent
                                style={{ marginTop: 20 }}
                                isFillRequired={true}
                                onPress={this.onContactUsPress}>
                                {strings.submit_request}
                            </ButtonComponent>

                            <TouchableOpacity
                                onPress={() => { this.props.navigation.goBack(null) }}>
                                <View style={[commonStyles.rowContainer, { marginTop: 30, alignItems: 'center', marginBottom: 20 }]}>
                                    <TextComponent
                                        style={{ color: colors.white, textDecorationLine: 'underline', marginStart: 5 }}>
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

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    // click listener for Contact Us Screen
    onContactUsPress = () => {
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
                businessNameError: strings.enter_business_name
            })
        } else if (this.email == '') {
            this.setState({
                emailError: strings.enter_email
            })
        } else if (!constants.EMAIL_REGULAR_EXPRESSION.test(this.email)) {
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

            const entrepreneurObject = {
                firstName: this.firstName,
                lastName: this.lastName,
                emailId: this.email,
                businessName: this.businessName,
                businessAddress: this.address,
                countryCode: countryCode,
                contactNo: this.mobileNumber,
                message: this.query
            }
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    ...entrepreneurObject,
                }
                this.submitForm(params)
            })
        }
    }

    // API to submit the form
    submitForm = (params) => {
        hitApi(urls.SEND_ENTREPRENEUR_REQUEST, urls.POST, params, this.showLoader, (jsonResponse) => {
            alertDialog("", jsonResponse.message, strings.ok, "", () => {
                this.props.navigation.goBack(null)
            });
        })
    }

    toggleCountryCodeVisibility(visible) {
        this.setState({ showCountryCodes: visible });
    }

    // load country codes from json
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
        marginTop: 0
    },
});
import React, { Component } from 'react'
import { View, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal } from 'react-native'
import { NavigationEvents } from 'react-navigation'
import StatusBarComponent from '../../components/StatusBarComponent'
import LoaderComponent from '../../components/LoaderComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import HeaderComponent from '../../components/HeaderComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import ButtonComponent from '../../components/ButtonComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import { getLoggedInUser, alertDialog } from '../../utilities/HelperFunctions'
import { constants, sizes, screenNames, gender, urls } from '../../config/constants'
import CountryCodes from '../../utilities/CountryCodes.json';
import { Dropdown } from 'react-native-material-dropdown';
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'

/**
 * User's Profile Screen
 */
export default class UserProfileScreen extends Component {
    constructor(props) {
        super(props);
        this.countries = []

        this.genderArray = [{
            value: strings.male,
        }, {
            value: strings.female,
        }, {
            value: strings.other
        }];

        this.firstNameTextInput = null

        this.state = {
            userObject: {},
            showModalLoader: false,
            firstNameError: '',
            lastNameError: '',
            emailError: '',
            mobileNumberError: '',
            showCountryCodes: false,
            currentCountryCode: '+49',
            isEditable: false,
            gender: strings.male,
        }

        getLoggedInUser().then((userObject) => {
            this.setState({
                userObject: userObject,
                currentCountryCode: '+' + (userObject.countryCode == '' ? '49' : userObject.countryCode),
            })
            if (userObject.gender === gender.MALE) {
                this.setState({
                    gender: strings.male
                })
            } else if (userObject.gender === gender.FEMALE) {
                this.setState({
                    gender: strings.female
                })
            } else {
                this.setState({
                    gender: strings.other
                })
            }
        })
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.profile}
                    navigation={this.props.navigation}
                    textAction={this.state.isEditable ? strings.save : strings.edit}
                    onTextActionPress={() => {
                        if (this.state.isEditable) {
                            this.savePress()
                        } else {
                            this.setState({
                                isEditable: !this.state.isEditable
                            }, () => {
                                this.firstNameTextInput.focus();
                            })
                        }
                    }}
                />
                <HeaderComponent
                    image={require('../../assets/profileHeader.png')} />

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

                <ScrollView style={[commonStyles.formScrollView, { paddingTop: 20 }]}>

                    <FloatingTextInputComponent
                        keyboardType={"default"}
                        autoCapitalize={"sentences"}
                        style={[styles.textInput, { borderColor: this.state.firstNameError == '' ? colors.black : colors.red }]}
                        returnKeyType={"next"}
                        getRef={(input) => { this.firstNameTextInput = input }}
                        onSubmitEditing={() => { this.lastNameTextInput.focus(); }}
                        placeholderTextColor={colors.placeHolderTextColor}
                        value={this.state.userObject.firstName}
                        editable={this.state.isEditable}
                        maxLength={constants.CHAR_MAX_LIMIT}
                        onChangeText={(text) => {
                            this.setState({
                                firstNameError: ''
                            })
                            let temp = this.state.userObject
                            temp.firstName = text.trim()
                            this.setState({
                                userObject: temp
                            })
                        }}>
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
                        onSubmitEditing={() => { this.phoneNumberTextInput.focus(); }}
                        value={this.state.userObject.lastName}
                        editable={this.state.isEditable}
                        maxLength={constants.CHAR_MAX_LIMIT}
                        onChangeText={(text) => {
                            this.setState({
                                lastNameError: ''
                            })
                            let temp = this.state.userObject
                            temp.lastName = text.trim()
                            this.setState({
                                userObject: temp
                            })
                        }}>
                        {strings.last_name + strings.asterisk}
                    </FloatingTextInputComponent>

                    <TextComponent style={commonStyles.errorText}>
                        {this.state.lastNameError}
                    </TextComponent>

                    <View style={{ marginTop: 20, }}
                        pointerEvents={this.state.isEditable ? "auto" : "none"}>
                        <Dropdown
                            label={strings.gender}
                            labelFontSize={sizes.normalTextSize}
                            baseColor={colors.greyTextColor}
                            data={this.genderArray}
                            value={this.state.gender}
                            onChangeText={(value, index, data) => {
                                if (value == strings.male) {
                                    let temp = this.state.userObject
                                    temp.gender = gender.MALE
                                    this.setState({
                                        userObject: temp
                                    })
                                } else if (value == strings.female) {
                                    let temp = this.state.userObject
                                    temp.gender = gender.FEMALE
                                    this.setState({
                                        userObject: temp
                                    })
                                } else {
                                    let temp = this.state.userObject
                                    temp.gender = gender.OTHER
                                    this.setState({
                                        userObject: temp
                                    })
                                }
                            }}
                            dropdownOffset={{ top: 0 }}
                            dropdownMargins={{ min: 40, max: 40 }}
                            rippleInsets={{ top: 0 }}
                            inputContainerStyle={{ borderBottomColor: 'transparent' }}
                        />
                    </View>
                    <View style={styles.horizontalLine} />

                    <FloatingTextInputComponent
                        keyboardType={"email-address"}
                        style={[styles.textInput, {
                            borderColor: this.state.emailError == '' ? colors.black : colors.red,
                            marginTop: 10
                        }]}
                        autoCapitalize={"none"}
                        returnKeyType={"next"}
                        getRef={(input) => { this.emailIdTextInput = input }}
                        onSubmitEditing={() => { }}
                        value={this.state.userObject.emailId}
                        editable={false}
                        maxLength={constants.EMAIL_CHAR_MAX_LIMIT}
                        onChangeText={(text) => {
                            this.setState({
                                emailError: ''
                            })
                            let temp = this.state.userObject
                            temp.emailId = text.trim()
                            this.setState({
                                userObject: temp
                            })
                        }}>
                        {strings.emailId + strings.asterisk}
                    </FloatingTextInputComponent>

                    <TextComponent style={commonStyles.errorText}>
                        {this.state.emailError}
                    </TextComponent>

                    <View style={[commonStyles.rowContainer, { marginBottom: 20 }]}>
                        <FloatingTextInputComponent
                            style={[styles.textInput, { paddingStart: 120, borderColor: this.state.mobileNumberError == '' ? colors.black : colors.red }]}
                            labelStyle={{ position: 'absolute', left: 120 }}
                            keyboardType={"numeric"}
                            returnKeyType={"done"}
                            maxLength={constants.PHONE_CHAR_MAX_LIMIT}
                            getRef={(input) => { this.phoneNumberTextInput = input }}
                            onSubmitEditing={() => { }}
                            value={this.state.userObject.contactNo}
                            editable={this.state.isEditable}
                            onChangeText={(text) => {
                                this.setState({
                                    mobileNumberError: ''
                                })
                                let temp = this.state.userObject
                                temp.contactNo = text.trim()
                                this.setState({
                                    userObject: temp
                                })
                            }}>
                            {strings.mobile_number}
                        </FloatingTextInputComponent>
                        <View style={{ position: 'absolute', bottom: 0 }}>
                            <TextComponent style={{ color: colors.greyTextColor }}>
                                {strings.code}
                            </TextComponent>
                            <TouchableOpacity
                                onPress={() => {
                                    if (this.state.isEditable) {
                                        this.toggleCountryCodeVisibility(true)
                                    }
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

                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    componentDidMount() {
        this.loadDataForCountryCodes()
    }

    // show/hide country code modal
    toggleCountryCodeVisibility(visible) {
        this.setState({ showCountryCodes: visible });
    }

    // load data from json for country codes
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

    // click listener for save button
    savePress = () => {
        if (this.state.userObject.firstName == '') {
            this.setState({
                firstNameError: strings.enter_first_name
            })
        } else if (this.state.userObject.lastName == '') {
            this.setState({
                lastNameError: strings.enter_last_name
            })
        } else if (this.state.userObject.emailId == '') {
            this.setState({
                emailError: strings.enter_email
            })
        } else if (!constants.EMAIL_REGULAR_EXPRESSION.test(this.state.userObject.emailId)) {
            this.setState({
                emailError: strings.invalid_email
            })
        } else if (this.state.userObject.contactNo !== '' && this.state.userObject.contactNo.length < constants.PHONE_CHAR_MIN_LIMIT) {
            this.setState({
                mobileNumberError: strings.mobile_should_be
            })
        } else if (this.state.userObject.contactNo !== '' && !constants.MOBILE_REGULAR_EXPRESSION.test(this.state.userObject.contactNo)) {
            this.setState({
                mobileNumberError: strings.enter_valid_mobile
            })
        } else {
            let countryCode = ""
            if (this.state.userObject.contactNo != '') {
                countryCode = this.state.currentCountryCode.substring(1)
            }
            let temp = this.state.userObject
            temp.countryCode = countryCode
            this.setState({
                userObject: temp
            }, () => {
                this.hitUpdateProfile()
            })
        }
    }

    // API to update profile
    hitUpdateProfile = () => {
        hitApi(urls.USER_UPDATE_PROFILE, urls.POST, this.state.userObject, this.showModalLoader, (jsonResponse) => {
            AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(this.state.userObject))
            this.setState({
                isEditable: !this.state.isEditable
            }, () => {
                alertDialog("", jsonResponse.message);
            })
        })
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    horizontalLine: {
        width: '100%',
        height: 1.5,
        backgroundColor: colors.black,
    },
    textInput: {

    }
});
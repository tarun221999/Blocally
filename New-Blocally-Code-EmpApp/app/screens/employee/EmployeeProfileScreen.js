import React, { Component } from 'react'
import {
    View, StyleSheet, ScrollView, Modal, TouchableOpacity,
    FlatList, KeyboardAvoidingView, Platform
} from 'react-native'
import { NavigationEvents } from 'react-navigation'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ButtonComponent from '../../components/ButtonComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import HeaderComponent from '../../components/HeaderComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/Strings'
import colors from '../../config/Colors'
import { fontNames, sizes, constants, languages, urls, screenNames, databaseConstants, } from '../../config/Constants'
import {
    getCommonParamsForAPI, getScreenDimensions, getSelectedLanguage, getLoggedInUser, startStackFrom, alertDialog
} from '../../utilities/HelperFunctions'
import FastImage from 'react-native-fast-image'
import { hitApi } from '../../api/ApiCall'
import { Dropdown } from 'react-native-material-dropdown';
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import RNRestart from 'react-native-restart';
import CountryCodes from '../../utilities/CountryCodes.json';

/**
 * Employee Profile Screen
 */
export default class EmployeeProfileScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
        this.headerImageHeight = this.screenDimensions.width * constants.HEADER_IMAGE_HEIGHT_PERCENTAGE

        this.countries = []

        // Commenting English, as only German is required
        this.languagesArray = [{
            value: strings.german,
        }/* , {
            value: strings.english,
        } */];

        this.state = {
            showModalLoader: false,
            isEditable: false,
            userObject: {},
            selectedLanguage: "",
            showCountryCodes: false,
            currentCountryCode: '+49',
            firstNameError: '',
            lastNameError: '',
            emailError: '',
            mobileNumberError: '',
        }

        getSelectedLanguage().then((selectedLanguage) => {
            if (selectedLanguage == languages.german) {
                this.setState({
                    selectedLanguage: strings.german
                })
            } else {
                this.setState({
                    selectedLanguage: strings.english
                })
            }
        })
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container}
                behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
                <NavigationEvents
                    onDidFocus={payload => {
                        this.fetchEmployeeProfile()
                    }}
                />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.profile}
                    navigation={this.props.navigation}
                    isHomeScreen={true}
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

                <ScrollView
                    showsVerticalScrollIndicator={false}>
                    <View style={[commonStyles.centerInContainer, commonStyles.headerBorder,
                    { width: '100%', height: this.headerImageHeight, }]}>
                        <ImageComponent
                            source={require('../../assets/placeholderLogo.png')} />
                        <FastImage
                            style={{
                                width: '100%', height: '100%', position: 'absolute'
                            }}
                            source={{
                                uri: this.state.userObject.bannerImage,
                            }}
                            resizeMode={FastImage.resizeMode.cover} />
                    </View>
                    <View style={{ marginTop: 20, marginHorizontal: 50 }}>
                        <View style={{}}>
                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                autoCapitalize={"sentences"}
                                style={{ borderColor: this.state.firstNameError == '' ? colors.black : colors.red }}
                                returnKeyType={"next"}
                                getRef={(input) => { this.firstNameTextInput = input }}
                                onSubmitEditing={() => { this.lastNameTextInput.focus(); }}
                                placeholderTextColor={colors.placeHolderTextColor}
                                value={this.state.userObject.firstName}
                                editable={this.state.isEditable}
                                onChangeText={(text) => {
                                    this.setState({
                                        firstNameError: ''
                                    })
                                    let temp = this.state.userObject
                                    temp.firstName = text.trim()
                                    this.setState({
                                        userObject: temp
                                    })
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}>
                                {strings.first_name + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.firstNameError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                autoCapitalize={"sentences"}
                                style={{ borderColor: this.state.lastNameError == '' ? colors.black : colors.red }}
                                returnKeyType={"done"}
                                getRef={(input) => { this.lastNameTextInput = input }}
                                value={this.state.userObject.lastName}
                                editable={this.state.isEditable}
                                onChangeText={(text) => {
                                    this.setState({
                                        lastNameError: ''
                                    })
                                    let temp = this.state.userObject
                                    temp.lastName = text.trim()
                                    this.setState({
                                        userObject: temp
                                    })
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}>
                                {strings.last_name + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.lastNameError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                keyboardType={"email-address"}
                                style={{
                                    borderColor: this.state.emailError == '' ? colors.black : colors.red,
                                }}
                                autoCapitalize={"none"}
                                returnKeyType={"next"}
                                getRef={(input) => { this.emailIdTextInput = input }}
                                onSubmitEditing={() => { }}
                                value={this.state.userObject.emailId}
                                editable={false}
                                onChangeText={(text) => {
                                    this.setState({
                                        emailError: ''
                                    })
                                    let temp = this.state.userObject
                                    temp.emailId = text.trim()
                                    this.setState({
                                        userObject: temp
                                    })
                                }}
                                maxLength={constants.EMAIL_CHAR_MAX_LIMIT}>
                                {strings.emailId + strings.asterisk}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.emailError}
                            </TextComponent>
                        </View>

                        <View style={{ paddingTop: 20, marginTop: 10 }}>
                            <Dropdown
                                label={strings.language}
                                data={this.languagesArray}
                                value={this.state.selectedLanguage}
                                onChangeText={(value, index, data) => {
                                    if (value == strings.german) {
                                        AsyncStorageHelper.saveStringAsync(constants.SELECTED_LANGUAGE, languages.german)
                                            .then(() => {
                                                strings.setLanguage(languages.german)
                                                this.setState({
                                                    selectedLanguage: value
                                                })
                                            })
                                    } else {
                                        AsyncStorageHelper.saveStringAsync(constants.SELECTED_LANGUAGE, languages.english)
                                            .then(() => {
                                                strings.setLanguage(languages.english)
                                                this.setState({
                                                    selectedLanguage: value
                                                })
                                            })
                                    }
                                    // Restart the JS module
                                    setTimeout(() => {
                                        RNRestart.Restart();
                                    }, 500)
                                }}
                                dropdownOffset={{ top: 0 }}
                                rippleInsets={{ top: 0 }}
                                inputContainerStyle={{ borderBottomColor: 'transparent' }}
                            />
                        </View>
                        <View style={[styles.line, { marginBottom: 20 }]} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    componentDidMount() {
        this.loadDataForCountryCodes()
    }

    // click listener for save
    savePress = () => {
        if (this.state.userObject.firstName == '') {
            this.setState({
                firstNameError: strings.enter_first_name
            })
        } else if (this.state.userObject.lastName == '') {
            this.setState({
                lastNameError: strings.enter_last_name
            })
        } else if (this.state.userObject.contactNo !== ''
            && this.state.userObject.contactNo.length < constants.PHONE_CHAR_MIN_LIMIT) {
            this.setState({
                mobileNumberError: strings.mobile_should_be
            })
        } else if (this.state.userObject.contactNo !== ''
            && !constants.MOBILE_REGULAR_EXPRESSION.test(this.state.userObject.contactNo)) {
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

    // api to get employee profile details
    fetchEmployeeProfile = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }
            hitApi(urls.GET_EMPLOYEE_PROFILE, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                getLoggedInUser().then((userObject) => {
                    userObject.firstName = jsonResponse.response.firstName
                    userObject.lastName = jsonResponse.response.lastName
                    userObject.emailId = jsonResponse.response.emailId
                    userObject.countryCode = jsonResponse.response.countryCode
                    userObject.contactNo = jsonResponse.response.contactNo

                    AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(userObject))

                    this.showUpdatedUser()
                })
            })
        })
    }

    showUpdatedUser = () => {
        getLoggedInUser().then((userObject) => {
            this.setState({
                userObject: userObject,
                currentCountryCode: '+' + (userObject.countryCode == '' ? '49' : userObject.countryCode),
            })
        })
    }

    // api to update profile
    hitUpdateProfile = () => {
        hitApi(urls.USER_UPDATE_PROFILE, urls.POST, this.state.userObject, this.showModalLoader, (jsonResponse) => {
            AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(this.state.userObject))
            this.setState({
                isEditable: !this.state.isEditable
            }, () => {
                alertDialog("", jsonResponse.message)
            })
        })
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }

    toggleCountryCodeVisibility(visible) {
        this.setState({ showCountryCodes: visible });
    }

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
    rowContainer: {
        paddingVertical: 20,
    },
    icon: {
        marginStart: 'auto',
    },
    line: {
        height: 1,
        backgroundColor: colors.lineColor,
        width: '100%',
    },
    popupButton: {
        marginTop: 20,
        width: '40%',
        alignSelf: 'center',
    }
});
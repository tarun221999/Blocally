import React, { Component } from 'react'
import {
    View, StyleSheet, TouchableOpacity, ScrollView, Modal, StatusBar, Platform
} from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import ImageComponent from '../components/ImageComponent'
import HeaderComponent from '../components/HeaderComponent'
import TextComponent from '../components/TextComponent'
import ButtonComponent from '../components/ButtonComponent'
import LoaderComponent from '../components/LoaderComponent'
import FloatingTextInputComponent from '../components/FloatingTextInputComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import { getLoggedInUser, getCommonParamsForAPI, startStackFrom, parseTextForCard } from '../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, constants, languages, urls } from '../config/Constants'
import CountryCodes from '../utilities/CountryCodes.json'
import AsyncStorageHelper from '../utilities/AsyncStorageHelper'
import { Dropdown } from 'react-native-material-dropdown';
import RNRestart from 'react-native-restart'
import { hitApi } from '../api/ApiCall';
import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging'

/**
 * Profile Screen
 */
export default class UserProfileScreen extends Component {
    constructor(props) {
        super(props);
        this.logoutButtonPosition = Platform.OS === constants.IOS ? 22 : StatusBar.currentHeight

        // Commenting English as only German is required
        this.languagesArray = [{
            value: strings.german,
        }/* , {
            value: strings.english,
        } */];

        AsyncStorageHelper.getStringAsync(constants.SELECTED_LANGUAGE)
            .then((selectedLanguage) => {
                if (selectedLanguage) {
                    if (selectedLanguage == languages.german) {
                        this.setState({
                            selectedLanguage: strings.german
                        })
                    } else {
                        this.setState({
                            selectedLanguage: strings.english
                        })
                    }
                }
            })
        this.state = {
            showLoader: false,
            userObject: {},
            showCountryCodes: false,
            currentCountryCode: '+49',
            selectedLanguage: "",
            showLogoutPopup: false,
        }

        getLoggedInUser().then((userObject) => {
            this.setState({
                userObject: userObject,
                currentCountryCode: '+' + (userObject.countryCode == '' ? '49' : userObject.countryCode)
            })
        })
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showLoader} />
                <View style={commonStyles.titleBar}>
                    <TouchableOpacity style={{ padding: 20, position: 'absolute', left: 0 }}
                        onPress={() => { this.props.navigation.goBack(null) }}>
                        <ImageComponent
                            source={require('../assets/backArrowBlack.png')}
                        />
                    </TouchableOpacity>

                    <TextComponent style={commonStyles.titleBarText}>
                        {strings.profile}
                    </TextComponent>
                    <TouchableOpacity onPress={() => this.setState({ showLogoutPopup: true })}
                        style={{ position: 'absolute', right: 10 }}>
                        <ImageComponent

                            source={require('../assets/logout.png')}
                        />
                    </TouchableOpacity>
                </View>
                {this.state.showLogoutPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TextComponent
                                style={{ alignSelf: 'center', color: colors.black, fontSize: sizes.largeTextSize, }}>
                                {strings.sure_logout_out}
                            </TextComponent>
                            <View style={[commonStyles.rowContainer, commonStyles.centerInContainer]}>
                                <ButtonComponent
                                    isFillRequired={true}
                                    color={colors.greyButtonColor2}
                                    style={[styles.popupButton, { marginEnd: 10 }]}
                                    fontStyle={{ color: colors.black }}
                                    onPress={() => this.setState({ showLogoutPopup: false })}>
                                    {strings.no}
                                </ButtonComponent>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={[styles.popupButton, { marginStart: 10 }]}
                                    onPress={() => {
                                        this.setState({
                                            showLogoutPopup: false,
                                        }, () => {
                                            this.doLogout()
                                        })
                                    }}>
                                    {strings.yes}
                                </ButtonComponent>
                            </View>
                        </View>
                    </View>
                </Modal>
                }
                <HeaderComponent
                    image={require('../assets/profileHeader.png')}>
                </HeaderComponent>
                <ScrollView style={[commonStyles.formScrollView, { paddingHorizontal: 20 }]}>
                    <FloatingTextInputComponent
                        keyboardType={"default"}
                        labelStyle={{ color: colors.primaryColor, }}
                        autoCapitalize={"sentences"}
                        style={[styles.textInput, { borderColor: colors.black, paddingStart: 0 }]}
                        returnKeyType={"next"}
                        numberOfLines={2}
                        onSubmitEditing={() => { }}
                        placeholderTextColor={colors.placeHolderTextColor}
                        value={this.state.userObject.businessName}
                        editable={false}
                        maxLength={constants.CHAR_MAX_LIMIT}>
                        {strings.name_of_location + strings.asterisk}
                    </FloatingTextInputComponent>

                    <FloatingTextInputComponent
                        labelStyle={{ color: colors.primaryColor }}
                        style={[styles.textInput, { borderColor: colors.black, }]}
                        inputStyle={{ height: 100, }}
                        value={parseTextForCard(this.state.userObject.businessAddress, 50)}
                        multiline={true}
                        numberOfLines={4}
                        editable={false}
                        maxLength={constants.ADDRESS_CHAR_MAX_LIMIT}>
                        {strings.address}
                    </FloatingTextInputComponent>

                    <FloatingTextInputComponent
                        labelStyle={{ color: colors.primaryColor }}
                        keyboardType={"email-address"}
                        style={[styles.textInput, { borderColor: colors.black, marginTop: 7 }]}
                        autoCapitalize={"none"}
                        numberOfLines={2}
                        returnKeyType={"next"}
                        getRef={(input) => { this.emailIdTextInput = input }}
                        onSubmitEditing={() => { this.passwordTextInput.focus(); }}
                        value={this.state.userObject.emailId}
                        editable={false}
                        maxLength={constants.EMAIL_CHAR_MAX_LIMIT}>
                        {strings.emailId + strings.asterisk}
                    </FloatingTextInputComponent>

                    <FloatingTextInputComponent
                        labelStyle={{ color: colors.primaryColor }}
                        keyboardType={"email-address"}
                        style={[styles.textInput, { borderColor: colors.black, marginTop: 7 }]}
                        autoCapitalize={"none"}
                        returnKeyType={"next"}
                        numberOfLines={2}
                        getRef={(input) => { this.emailIdTextInput = input }}
                        onSubmitEditing={() => { this.passwordTextInput.focus(); }}
                        value={"+" + this.state.userObject.businessPhoneNumber}
                        editable={false}
                        maxLength={constants.PHONE_CHAR_MAX_LIMIT}>
                        {strings.mobile_number}
                    </FloatingTextInputComponent>

                    <View style={{ marginTop: 15, marginBottom: 40 }}>
                        <TextComponent style={{ color: colors.primaryColor }}>{strings.language}</TextComponent>
                        <Dropdown
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
                        <View style={{ width: '100%', backgroundColor: colors.black, height: 2 }}></View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // api to logout
    doLogout = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }
            hitApi(urls.USER_LOGOUT, urls.POST, params, this.showLoader, (jsonResponse) => {
                setTimeout(() => {
                    AsyncStorageHelper.clearAsyncStorage().then(() => {
                        notifee.cancelAllNotifications();
                        // firebase.notifications().removeAllDeliveredNotifications();
                        notifee.setBadgeCount(0)
                        messaging().deleteToken()
                        startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                    })
                }, constants.HANDLING_TIMEOUT)
            }, (jsonResponse) => {
                setTimeout(() => {
                    // not handling any error for logout
                    AsyncStorageHelper.clearAsyncStorage().then(() => {
                        notifee.cancelAllNotifications();
                        // firebase.notifications().removeAllDeliveredNotifications();
                        messaging().deleteToken()
                        notifee.setBadgeCount(0)
                        startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                    })
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    line: {
        height: 1,
        backgroundColor: colors.lineColor,
        width: '100%',
    },
    popupButton: {
        marginTop: 20,
        width: '40%',
        alignSelf: 'center',
    },
    textInput: {

    }
});
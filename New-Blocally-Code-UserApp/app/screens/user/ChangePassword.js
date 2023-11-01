import React, { Component } from 'react'
import {
    SafeAreaView, KeyboardAvoidingView, Platform, View,
    StyleSheet, ScrollView,
} from 'react-native'
import commonStyles from '../../styles/Styles'
import LoaderComponent from '../../components/LoaderComponent'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import FloatingTextInputComponent from '../../components/FloatingTextInputComponent'
import ButtonComponent from '../../components/ButtonComponent'
import colors from '../../config/colors'
import { constants, urls } from '../../config/constants'
import strings from '../../config/strings'
import { alertDialog, getCommonParamsForAPI } from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'

/**
 * Change Password Screen
 */
export default class ChangePassword extends Component {
    constructor(props) {
        super(props);

        this.oldPassword = ""
        this.newPassword = ""
        this.confirmPassword = ""
        this.state = {
            showLoader: false,
            oldPasswordError: "",
            newPasswordError: "",
            confirmPasswordError: "",
        }
    }

    render() {
        return (
            <KeyboardAvoidingView style={commonStyles.container} behavior={Platform.OS === constants.IOS ? "padding" : ""}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showLoader} />
                <TitleBarComponent
                    title={strings.change_password}
                    navigation={this.props.navigation}
                />
                <View style={[commonStyles.container, { backgroundColor: colors.transparent }]}>
                    <SafeAreaView style={[styles.contentContainer, { marginTop: 10 }]}>
                        <ScrollView
                            style={commonStyles.formScrollView}
                            contentContainerStyle={commonStyles.centerInContainer}
                            keyboardShouldPersistTaps={'always'}>

                            <FloatingTextInputComponent
                                keyboardType={"default"}
                                style={[styles.textInput, { borderColor: this.state.oldPasswordError == '' ? colors.black : colors.red }]}
                                autoCapitalize={"none"}
                                secureTextEntry={true}
                                returnKeyType={"next"}
                                onSubmitEditing={() => { this.passwordTextInput.focus(); }}
                                maxLength={constants.CHAR_MAX_LIMIT}
                                onChangeText={(text) => {
                                    this.setState({
                                        oldPasswordError: ''
                                    })
                                    this.oldPassword = text.trim()
                                }}>
                                {strings.old_password}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.oldPasswordError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                style={[styles.textInput, { borderColor: this.state.newPasswordError == '' ? colors.black : colors.red }]}
                                getRef={(input) => { this.passwordTextInput = input }}
                                returnKeyType={"next"}
                                onSubmitEditing={() => { this.confirmPasswordTextInput.focus(); }}
                                onChangeText={(text) => {
                                    this.setState({
                                        newPasswordError: ''
                                    })
                                    this.newPassword = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}
                                secureTextEntry={true}>
                                {strings.new_password}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.newPasswordError}
                            </TextComponent>

                            <FloatingTextInputComponent
                                style={[styles.textInput, { borderColor: this.state.confirmPasswordError == '' ? colors.black : colors.red }]}
                                getRef={(input) => { this.confirmPasswordTextInput = input }}
                                onChangeText={(text) => {
                                    this.setState({
                                        confirmPasswordError: ''
                                    })
                                    this.confirmPassword = text.trim()
                                }}
                                maxLength={constants.CHAR_MAX_LIMIT}
                                secureTextEntry={true}>
                                {strings.confirm_password}
                            </FloatingTextInputComponent>

                            <TextComponent style={commonStyles.errorText}>
                                {this.state.confirmPasswordError}
                            </TextComponent>

                            <ButtonComponent
                                style={{ marginTop: 20, marginBottom: 40}}
                                isFillRequired={true}
                                onPress={this.onResetPassword}>
                                {strings.reset_password}
                            </ButtonComponent>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        );
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    // Click listener for reset button
    onResetPassword = () => {
        if (this.oldPassword == '') {
            this.setState({
                oldPasswordError: strings.enter_old_password
            })
        } else if (this.newPassword == '') {
            this.setState({
                newPasswordError: strings.enter_new_password
            })
        } else if (this.confirmPassword == '') {
            this.setState({
                confirmPasswordError: strings.enter_confirm_password
            })
        } else if (this.newPassword !== this.confirmPassword) {
            this.setState({
                confirmPasswordError: strings.new_password_do_not_match
            })
        } else {
            // api to change password
            getCommonParamsForAPI().then((commonParams) => {
                const params = {
                    ...commonParams,
                    oldPassword: this.oldPassword,
                    newPassword: this.newPassword
                }
    
                hitApi(urls.USER_CHANGE_PASSWORD, urls.POST, params, this.showLoader, (jsonResponse) => {
                    alertDialog("", jsonResponse.message, strings.ok, "", () => {
                        this.props.navigation.goBack(null)
                    })
                })
            })
        }
    }
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    textInput: {
        marginTop: 0
    },
});
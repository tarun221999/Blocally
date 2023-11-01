import React, { Component } from 'react'
import {
    View, StyleSheet, ScrollView, Modal, TouchableOpacity, TouchableHighlight,
    FlatList, KeyboardAvoidingView, Platform
} from 'react-native'
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
import DealsSchema from '../../database/DealsSchema'
import Realm from 'realm'

export default class EmployeeSettingsScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModalLoader: false,
            showLogoutPopup: false,
        }

        this.realm = null
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={strings.settings}
                    isHomeScreen={true}
                    navigation={this.props.navigation} />

                {
                    this.state.showLogoutPopup &&
                    <Modal
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
                                                this.checkIfAnyPendingData()
                                                // this.doLogout()
                                            })
                                        }}>
                                        {strings.yes}
                                    </ButtonComponent>
                                </View>
                            </View>
                        </View>
                    </Modal>
                }
                <View style={commonStyles.container}>
                    <TouchableHighlight
                        onPress={() => this.props.navigation.navigate(screenNames.CHANGE_PASSWORD_SCREEN)}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={[commonStyles.rowContainer, styles.rowContainer]}>
                            <TextComponent>
                                {strings.change_password}
                            </TextComponent>
                            <ImageComponent
                                style={styles.icon}
                                source={require('../../assets/lock.png')} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    <TouchableHighlight
                        onPress={() => {
                            this.setState({ showLogoutPopup: true })
                        }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={[commonStyles.rowContainer, styles.rowContainer]}>
                            <TextComponent>
                                {strings.sign_out}
                            </TextComponent>
                            <ImageComponent
                                style={styles.icon}
                                source={require('../../assets/logout.png')} />
                        </View>
                    </TouchableHighlight>
                    <View style={[styles.line, { marginBottom: 20 }]} />
                </View>
            </View>
        );
    }

    checkIfAnyPendingData = () => {
        Realm.open({
            schema: [DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                this.realm = realm
                let savedDeals = this.realm.objects(databaseConstants.DEALS_SCHEMA);
                if (savedDeals && savedDeals.length > 0) {
                    alertDialog("", strings.pending_data_exists)
                } else {
                    this.doLogout()
                }
            })
            .catch(error => {
                alertDialog("", error);
            });
    }

    doLogout = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }

            hitApi(urls.USER_LOGOUT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                AsyncStorageHelper.clearAsyncStorage().then(() => {
                    startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                })
            }, (jsonResponse) => {
                // not handling any error for logout
                AsyncStorageHelper.clearAsyncStorage().then(() => {
                    startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                })
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
    rowContainer: {
        paddingHorizontal: 50,
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
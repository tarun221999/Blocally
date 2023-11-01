import React, { Component } from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView, TouchableHighlight, Modal } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import LoaderComponent from '../../components/LoaderComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import {
    getLoggedInUser, getCommonParamsForAPI, startStackFrom, getSelectedLanguage, alertDialog,
    getLocalDateTimeFromLocalDateTime,
} from '../../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, urls, languages, constants, databaseConstants, dealStatuses } from '../../config/constants'
import { hitApi } from '../../api/APICall'
import AsyncStorageHelper from '../../utilities/AsyncStorageHelper'
import ToggleSwitch from 'toggle-switch-react-native'
import { Dropdown } from 'react-native-material-dropdown';
import RNRestart from 'react-native-restart';
import notifee from '@notifee/react-native';
import NetInfo from "@react-native-community/netinfo"
import ProductMenuSchema from '../../database/ProductMenuSchema'
import ProductSchedulerSchema from '../../database/ProductSchedulerSchema'
import DealsSchema from '../../database/DealsSchema'
import Realm from 'realm'

const margin = 20

/**
 * Settings Screen
 */
export default class UserSettingsScreen extends Component {
    constructor(props) {
        super(props)

        // Hiding English for now
        this.languagesArray = [{
            value: strings.german,
        }/* , {
            value: strings.english,
        } */];

        this.state = {
            showLoader: false,
            userObject: {},
            showLogoutPopup: false,
            showDeleteAccountPopup: false,
            selectedLanguage: "",
        }

        // Get current logged in User
        getLoggedInUser().then((userObject) => {
            this.setState({
                userObject: userObject,
            }, () => {
                // Get currently selected language
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
            })
        })

        this.checkedInDealsAvailable = false
        this.realm = null
        this.initRealm()
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showLoader} />
                <TitleBarComponent
                    title={strings.settings}
                    navigation={this.props.navigation} />
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
                                            let syncDeal = [];
                                            let dealsToDelete = [];
                                            this.doLogout(syncDeal, dealsToDelete)
                                        })
                                    }}>
                                    {strings.yes}
                                </ButtonComponent>
                            </View>
                        </View>
                    </View>
                </Modal>
                }
                {this.state.showDeleteAccountPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TextComponent
                                style={{ alignSelf: 'center', color: colors.black, fontSize: sizes.largeTextSize, }}>
                                {strings.sure_delete_account}
                            </TextComponent>
                            <TextComponent
                                style={{ alignSelf: 'center', color: colors.tabGreyTextColor, fontSize: sizes.smallTextSize, }}>
                                {strings.action_cant_be_reversed}
                            </TextComponent>
                            <View style={[commonStyles.rowContainer, commonStyles.centerInContainer]}>
                                <ButtonComponent
                                    isFillRequired={true}
                                    color={colors.greyButtonColor2}
                                    style={[styles.popupButton, { marginEnd: 10 }]}
                                    fontStyle={{ color: colors.black }}
                                    onPress={() => this.setState({ showDeleteAccountPopup: false })}>
                                    {strings.no}
                                </ButtonComponent>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={[styles.popupButton, { marginStart: 10 }]}
                                    onPress={() => {
                                        this.setState({
                                            showDeleteAccountPopup: false,
                                        }, () => {
                                            setTimeout(() => {
                                                this.deleteAccount()
                                            }, constants.HANDLING_TIMEOUT)
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
                    <ScrollView style={{ marginBottom: 60 }}>
                        <View style={[commonStyles.rowContainer, styles.rowContainer, { paddingBottom: 0 }]}>
                            <TextComponent style={styles.toggleText}>
                                {strings.receive_phone_notifications}
                            </TextComponent>
                            <View style={{ marginStart: 'auto' }}>
                                <ToggleSwitch
                                    isOn={this.state.userObject.notificationFromBlocally || this.state.userObject.notificationFromBlocallyAndFavEnt}
                                    onColor={colors.green}
                                    offColor={colors.greyButtonColor}
                                    size="small"
                                    onToggle={isOn => {
                                        if (isOn) {
                                            this.manageNotification(false, true)
                                        } else {
                                            this.manageNotification(false, false)
                                        }
                                    }}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.radioButtonText,]}
                            onPress={() => this.manageNotification(false, true)}>
                            <ImageComponent source={
                                this.state.userObject.notificationFromBlocallyAndFavEnt ?
                                    require('../../assets/radioButton.png') :
                                    require('../../assets/radioButtonEmpty.png')
                            }
                                style={{ alignSelf: 'center' }} />
                            <TextComponent style={{ marginStart: 5 }}>{strings.from_blocally_fav_entrepreneurs}</TextComponent>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.radioButtonText}
                            onPress={() => this.manageNotification(true, false)}>
                            <ImageComponent source={
                                this.state.userObject.notificationFromBlocally ?
                                    require('../../assets/radioButton.png') :
                                    require('../../assets/radioButtonEmpty.png')
                            }
                                style={{ alignSelf: 'center' }} />
                            <TextComponent style={{ marginStart: 5 }}>{strings.from_blocally_only}</TextComponent>
                        </TouchableOpacity>
                        <View style={[styles.line, { marginTop: margin }]} />

                        <TouchableHighlight
                            onPress={() => this.props.navigation.navigate(screenNames.USER_CHANGE_PASSWORD_SCREEN)}
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

                        <View style={{ marginStart: margin, marginEnd: 16, paddingTop: margin, }}>
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
                                    }, constants.HANDLING_TIMEOUT)
                                }}
                                dropdownOffset={{ top: 0 }}
                                rippleInsets={{ top: 0 }}
                                inputContainerStyle={{ borderBottomColor: 'transparent' }}
                            />
                        </View>
                        <View style={styles.line} />

                        <TouchableHighlight
                            onPress={() => {
                                this.checkIfOfflineDataPendingToSync()
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
                        <View style={styles.line} />
                    </ScrollView>

                    <View style={{ position: 'absolute', bottom: 0 }}>
                        <View style={styles.line} />
                        <TouchableHighlight
                            onPress={() => {
                                this.setState({ showDeleteAccountPopup: true })
                            }}
                            underlayColor={colors.highlightBackground}
                            activeOpacity={0.5}>
                            <View style={[commonStyles.rowContainer, styles.deleteView]}>
                                <TextComponent>
                                    {strings.delete_your_account}
                                </TextComponent>
                                <ImageComponent
                                    style={[styles.icon]}
                                    source={require('../../assets/delete.png')} />
                            </View>
                        </TouchableHighlight>
                    </View>
                </View>
            </View>
        )
    }

    // Initialize the Realm object
    initRealm = () => {
        Realm.open({
            schema: [ProductMenuSchema, ProductSchedulerSchema, DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                this.realm = realm
            })
            .catch(error => {
                alertDialog("", error);
            });
    }

    showLoader = (shouldShow) => {
        this.setState({
            showLoader: shouldShow
        })
    }

    // API to manage Notification Settings
    manageNotification = (fromOnlyBLocally, fromBLocallyAndFav) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                notificationFromBlocally: fromOnlyBLocally,
                notificationFromBlocallyAndFavEnt: fromBLocallyAndFav,
            }

            hitApi(urls.USER_NOTIFICATION_SETTINGS, urls.POST, params, this.showLoader, (jsonResponse) => {
                let temp = this.state.userObject
                temp.notificationFromBlocally = fromOnlyBLocally
                temp.notificationFromBlocallyAndFavEnt = fromBLocallyAndFav
                this.setState({
                    userObject: temp,
                }, () => {
                    AsyncStorageHelper.saveStringAsync(constants.LOGGED_IN_USER, JSON.stringify(this.state.userObject))
                })
            })
        })
    }

    // check if there is pending data that needs to be synced
    checkIfOfflineDataPendingToSync = () => {
        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                // check if there are any offline redeemed deals
                let allDeals = this.realm.objects(databaseConstants.DEALS_SCHEMA)
                let syncDeal = [];
                let dealsToDelete = [];

                allDeals.forEach(savedDeal => {
                    if (savedDeal.dealStatusId == dealStatuses.CHECKED_IN) {
                        // checked in deals available
                        this.checkedInDealsAvailable = true

                        let deal = {
                            redeemedCode: savedDeal.dealRedeemedCode,
                            dealStatusId: dealStatuses.EXPIRED,
                            redeemedOn: savedDeal.redeemedOn,
                            expiredOn: getLocalDateTimeFromLocalDateTime(new Date())
                        }
                        syncDeal.push(deal);
                        dealsToDelete.push(savedDeal)
                    } else {
                        let deal = {
                            redeemedCode: savedDeal.dealRedeemedCode,
                            dealStatusId: savedDeal.dealStatusId,
                            redeemedOn: savedDeal.redeemedOn,
                            expiredOn: savedDeal.expiredOn
                        }
                        syncDeal.push(deal);
                        dealsToDelete.push(savedDeal);
                    }
                });

                // check if checked in deal is there
                if (this.checkedInDealsAvailable) {
                    // show alert
                    this.showAlertForCheckedInDeals(syncDeal, dealsToDelete)
                } else {
                    // allow logout
                    this.setState({ showLogoutPopup: true })
                }
            } else {
                // no internet
                alertDialog("", strings.internet_not_connected)
            }
        });
    }

    // Show alert for Checked-In deals before logout
    showAlertForCheckedInDeals = (syncDeal, dealsToDelete) => {
        alertDialog("", strings.checked_in_deals_are_there, strings.yes, strings.no, () => {
            this.doLogout(syncDeal, dealsToDelete)
        })
    }

    // API to logout
    doLogout = (syncDeal, dealsToDelete) => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
                syncDeal
            }

            hitApi(urls.USER_LOGOUT, urls.POST, params, this.showLoader, (jsonResponse) => {
                if (dealsToDelete && dealsToDelete.length > 0) {
                    // delete all local deals
                    this.realm.write(() => {
                        this.realm.delete(dealsToDelete);
                    });
                }

                // firebase.notifications().cancelAllNotifications();
                // firebase.notifications().removeAllDeliveredNotifications();
                // firebase.notifications().setBadge(0)
                    notifee.cancelAllNotifications()
                    notifee.setBadgeCount(0)

                setTimeout(() => {
                    AsyncStorageHelper.clearAsyncStorage().then(() => {
                        startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                    })
                }, constants.HANDLING_TIMEOUT)

            }, (jsonResponse) => {
                // not handling any error for logout
                setTimeout(() => {
                    AsyncStorageHelper.clearAsyncStorage().then(() => {
                        // firebase.notifications().cancelAllNotifications();
                        // firebase.notifications().removeAllDeliveredNotifications();
                        notifee.cancelAllNotifications()
                        notifee.setBadgeCount(0)
                        startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                    })
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    // API to delete User account
    deleteAccount = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }

            hitApi(urls.USER_DELETE_ACCOUNT, urls.POST, params, this.showLoader, (jsonResponse) => {
                this.deleteAllDeals();
                setTimeout(() => {
                    AsyncStorageHelper.clearAsyncStorage().then(() => {
                        startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                    })
                }, constants.HANDLING_TIMEOUT)
            })
        })
    }

    // Delete all locally saved deals data
    deleteAllDeals = () => {
        Realm.open({
            schema: [ProductMenuSchema, ProductSchedulerSchema, DealsSchema],
            schemaVersion: databaseConstants.SCHEMA_VERSION
        })
            .then(realm => {
                try {
                    realm.write(() => {
                        realm.deleteAll();
                    });
                } catch (e) {
                    // Do nothing
                }
            })
            .catch(error => {
                // alertDialog("", error);
            });
    }
}

const styles = StyleSheet.create({
    rowContainer: {
        paddingHorizontal: margin,
        paddingVertical: margin,
    },
    toggleText: {
        color: colors.black,
        fontFamily: fontNames.regularFont,
        paddingEnd: 50,
    },
    radioButtonText: {
        marginHorizontal: margin,
        flexDirection: 'row',
        paddingTop: 10,
    },
    line: {
        height: 1,
        backgroundColor: colors.lineColor,
        width: '100%',
    },
    icon: {
        marginStart: 'auto',
    },
    deleteView: {
        width: '100%',
        paddingVertical: margin,
        paddingHorizontal: margin,
    },
    popupButton: {
        marginTop: 20,
        width: '40%',
        alignSelf: 'center',
    }
})
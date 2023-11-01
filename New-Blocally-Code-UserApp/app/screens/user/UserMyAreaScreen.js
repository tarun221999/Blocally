import React, { Component } from 'react'
import { View, StyleSheet, TouchableHighlight, ScrollView, Modal } from 'react-native'
import { NavigationActions, NavigationEvents } from 'react-navigation'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import HeaderComponent from '../../components/HeaderComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import ButtonComponent from '../../components/ButtonComponent'
import commonStyles from '../../styles/Styles'
import strings from '../../config/strings'
import colors from '../../config/colors'
import { isUserLoggedIn, startStackFrom, alertDialog, openUrlInBrowser, getCommonParamsForAPI } from '../../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, urls, } from '../../config/constants'
import { hitApi } from '../../api/APICall'
import LoaderComponent from '../../components/LoaderComponent'
import notifee from '@notifee/react-native';

const marginValue = 25

/**
 * My Area Screen
 */
export default class UserMyAreaScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showLoginPopup: false,
            showModalLoader: false,
            unreadMessages: 0,
            unreadAppointments: 0,
            unreadNotifications: 0,
        }
    }

    checkIfUserLoggedIn = () => {
        isUserLoggedIn().then((isUserLoggedIn) => {
            if (!isUserLoggedIn || isUserLoggedIn == 'false') {
                this.setState({
                    showLoginPopup: true
                })
            } else {
                this.getUnreadCount();
            }
        })
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <NavigationEvents
                    onWillFocus={payload => {
                        this.checkIfUserLoggedIn();
                    }}
                />
                {this.state.showLoginPopup && <Modal
                    transparent={true}>
                    <View style={[commonStyles.container, commonStyles.centerInContainer, commonStyles.modalBackground]}>
                        <View style={{ width: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 10 }}>
                            <TextComponent
                                style={{ alignSelf: 'center', color: colors.primaryColor, fontSize: sizes.largeTextSize, fontFamily: fontNames.boldFont }}>
                                {strings.login_to_continue}
                            </TextComponent>
                            <View style={[commonStyles.rowContainer, commonStyles.centerInContainer]}>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={styles.popupButton}
                                    color={colors.greyButtonColor2}
                                    fontStyle={{ color: colors.black }}
                                    onPress={() => {
                                        this.setState({ showLoginPopup: false })
                                        this.props.navigation.goBack(null)
                                    }}>
                                    {strings.no}
                                </ButtonComponent>
                                <ButtonComponent
                                    isFillRequired={true}
                                    style={styles.popupButton}
                                    onPress={() => startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)}>
                                    {strings.yes}
                                </ButtonComponent>
                            </View>
                        </View>
                    </View>
                </Modal>
                }
                <TitleBarComponent
                    title={strings.my_area}
                    navigation={this.props.navigation}
                    isHomeScreen={true} />

                <ScrollView style={[commonStyles.container, styles.container]}>
                    <HeaderComponent
                        image={require('../../assets/myAreaHeader.png')}>
                    </HeaderComponent>

                    {/* Messenger */}
                    <TouchableHighlight
                        onPress={() => this.props.navigation.navigate(screenNames.MESSENGER_SCREEN)}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../../assets/chatSmall.png')} style={{}} />
                            <View style={[styles.title, commonStyles.rowContainer]}>
                                <TextComponent>
                                    {strings.messenger}
                                </TextComponent>
                                {this.state.unreadMessages > 0 &&
                                    <TextComponent style={commonStyles.badgeCount}>
                                        {this.state.unreadMessages}
                                    </TextComponent>
                                }
                            </View>
                            <ImageComponent
                                source={require('../../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* My Hot Deals */}
                    <TouchableHighlight
                        onPress={() => this.props.navigation.navigate(screenNames.MY_HOT_DEALS_SCREEN)}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../../assets/hotpurple.png')} style={{ resizeMode: 'contain' }} />
                            <TextComponent style={styles.title}>
                                {strings.my_hot_deals}
                            </TextComponent>
                            <ImageComponent
                                source={require('../../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* My Appointments */}
                    <TouchableHighlight
                        onPress={() =>
                            this.props.navigation.navigate(screenNames.MY_APPOINTMENTS_SCREEN)}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../../assets/appointments.png')} style={{ resizeMode: 'contain' }} />
                            <View style={[styles.title, commonStyles.rowContainer]}>
                                <TextComponent>
                                    {strings.my_appointments}
                                </TextComponent>
                                {this.state.unreadAppointments > 0 &&
                                    <TextComponent style={commonStyles.badgeCount}>
                                        {this.state.unreadAppointments}
                                    </TextComponent>
                                }
                            </View>
                            <ImageComponent
                                source={require('../../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* Settings */}
                    <TouchableHighlight
                        onPress={() => { this.props.navigation.navigate(screenNames.USER_SETTINGS_SCREEN) }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../../assets/settings.png')} />
                            <TextComponent style={styles.title}>
                                {strings.settings}
                            </TextComponent>
                            <ImageComponent
                                source={require('../../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* Profile */}
                    <TouchableHighlight
                        onPress={() => { this.props.navigation.navigate(screenNames.USER_PROFILE_SCREEN) }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../../assets/profile.png')} />
                            <TextComponent style={styles.title}>
                                {strings.profile}
                            </TextComponent>
                            <ImageComponent
                                source={require('../../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* Terms & Conditions */}
                    <TouchableHighlight
                        onPress={() => {
                            openUrlInBrowser(urls.TERMS_AND_CONDITIONS)
                        }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../../assets/terms.png')} />
                            <TextComponent style={styles.title}>
                                {strings.terms_of_service}
                            </TextComponent>
                            <ImageComponent
                                source={require('../../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* Contact us */}
                    <TouchableHighlight
                        onPress={() => { this.props.navigation.navigate(screenNames.CONTACT_US_SCREEN) }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../../assets/contact.png')} />
                            <TextComponent style={styles.title}>
                                {strings.contact_us}
                            </TextComponent>
                            <ImageComponent
                                source={require('../../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* Notifications */}
                    <TouchableHighlight
                        onPress={() => { this.props.navigation.navigate(screenNames.NOTIFICATIONS_SCREEN) }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../../assets/notification.png')} />
                            <View style={[styles.title, commonStyles.rowContainer]}>
                                <TextComponent>
                                    {strings.notifications}
                                </TextComponent>
                                {this.state.unreadNotifications > 0 &&
                                    <TextComponent style={commonStyles.badgeCount}>
                                        {this.state.unreadNotifications}
                                    </TextComponent>
                                }
                            </View>
                            <ImageComponent
                                source={require('../../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                </ScrollView>
            </View>
        );
    }

    componentDidUpdate() {
        // Set params for Unread counts
        if (this.props.navigation.state && this.props.navigation.state.params) {
            let unreadMessages = this.props.navigation.state.params.unreadMessages
            let unreadAppointments = this.props.navigation.state.params.unreadAppointments
            let unreadNotifications = this.props.navigation.state.params.unreadNotifications

            if (typeof unreadMessages != 'undefined' && unreadMessages != this.state.unreadMessages) {
                this.setState({
                    unreadMessages,
                })
            }
            if (typeof unreadAppointments != 'undefined' && unreadAppointments != this.state.unreadAppointments) {
                this.setState({
                    unreadAppointments,
                })
            }
            if (typeof unreadNotifications != 'undefined' && unreadNotifications != this.state.unreadNotifications) {
                this.setState({
                    unreadNotifications,
                })
            }
        }
    }

    // API to get unread counts
    getUnreadCount = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }

            hitApi(urls.GET_UNREAD_COUNT, urls.POST, params, this.showModalLoader, (jsonResponse) => {
                let unreadMessages = jsonResponse.response.unreadMessagesCount;
                let unreadAppointments = jsonResponse.response.unreadAppointmentsCount;
                let unreadNotifications = jsonResponse.response.unreadAdminNotificationsCount;
                let count = unreadMessages + unreadAppointments + unreadNotifications;

                const setParamsForMyArea = NavigationActions.setParams({
                    params: {
                        badgeCount: count,
                        unreadMessages,
                        unreadAppointments,
                        unreadNotifications
                    },
                    key: screenNames.MY_AREA,
                });
                this.props.navigation.dispatch(setParamsForMyArea);
                 notifee.setBadgeCount(count)
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
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: marginValue,
        height: 70,
    },
    title: {
        position: 'absolute',
        marginStart: 75,
    },
    arrowImage: {
        marginStart: 'auto',
    },
    line: {
        height: 1,
        backgroundColor: colors.lineColor,
        width: '100%'
    },
    popupButton: {
        marginTop: 20,
        width: '40%',
        alignSelf: 'center',
        marginEnd: 5
    },
});
import React, { Component } from 'react'
import { View, StyleSheet, TouchableHighlight, ScrollView, Modal, StatusBar } from 'react-native'
import { NavigationEvents, NavigationActions } from 'react-navigation'
import StatusBarComponent from '../components/StatusBarComponent'
import TextComponent from '../components/TextComponent'
import HeaderComponent from '../components/HeaderComponent'
import ImageComponent from '../components/ImageComponent'
import commonStyles from '../styles/Styles'
import strings from '../config/Strings'
import colors from '../config/Colors'
import { isUserLoggedIn, startStackFrom, alertDialog, getCommonParamsForAPI } from '../utilities/HelperFunctions'
import { fontNames, sizes, screenNames, urls, constants, } from '../config/Constants'
import TitleBarComponent from '../components/TitleBarComponent'
import { hitApi } from '../api/ApiCall'
import LoaderComponent from '../components/LoaderComponent'
import notifee from '@notifee/react-native';

const marginValue = 25

/**
 * My Area Screen
 */
export default class MyAreaScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModalLoader: false,
            unreadNotifications: 0,
        }

        this.didFocusSubscription = null
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <TitleBarComponent
                    isHomeScreen={true}
                    title={strings.my_area}
                    navigation={this.props.navigation} />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />

                <ScrollView style={[commonStyles.container, styles.container]}>
                    <HeaderComponent
                        image={require('../assets/myAreaHeader.png')}>
                    </HeaderComponent>

                    <TouchableHighlight
                        onPress={() => { this.props.navigation.navigate(screenNames.HOLIDAYS_SCREEN) }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../assets/holidayIcon.png')} />
                            <TextComponent style={styles.title}>
                                {strings.holidays}
                            </TextComponent>
                            <ImageComponent
                                source={require('../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* Profile */}
                    <TouchableHighlight
                        onPress={() => { this.props.navigation.navigate(screenNames.PROFILE_SCREEEN) }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../assets/profile.png')} />
                            <TextComponent style={styles.title}>
                                {strings.profile}
                            </TextComponent>
                            <ImageComponent
                                source={require('../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />

                    {/* Notifications */}
                    <TouchableHighlight
                        onPress={() => {
                            this.props.navigation.navigate(screenNames.NOTIFICATIONS_SCREEN)
                        }}
                        underlayColor={colors.highlightBackground}
                        activeOpacity={0.5}>
                        <View style={styles.section}>
                            <ImageComponent
                                source={require('../assets/notification.png')} />
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
                                source={require('../assets/rightarrow.png')}
                                style={styles.arrowImage} />
                        </View>
                    </TouchableHighlight>
                    <View style={styles.line} />
                </ScrollView>
            </View>
        );
    }

    componentDidMount() {
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.getUnreadCount()
            }
        );
    }

    componentDidUpdate() {
        if (this.props.navigation.state && this.props.navigation.state.params) {
            let badgeCount = this.props.navigation.state.params.badgeCount

            if (typeof badgeCount != 'undefined' && badgeCount != this.state.unreadNotifications) {
                this.setState({
                    unreadNotifications: badgeCount,
                })
            }
        }
    }

    componentWillUnmount() {
        if (this.didFocusSubscription) {
            this.didFocusSubscription.remove();
        }
    }

    // api to get unread counts
    getUnreadCount = () => {
        getCommonParamsForAPI().then((commonParams) => {
            const params = {
                ...commonParams,
            }

            hitApi(urls.GET_UNREAD_COUNT, urls.POST, params, null, (jsonResponse) => {
                let unreadMessages = jsonResponse.response.unreadMessagesCount;
                let unreadAppointments = jsonResponse.response.unreadAppointmentsCount;
                let unreadAdminNotificationsCount = jsonResponse.response.unreadAdminNotificationsCount;

                const setParamsForAppointments = NavigationActions.setParams({
                    params: { badgeCount: unreadAppointments },
                    key: screenNames.APPOINTMENT,
                });
                this.props.navigation.dispatch(setParamsForAppointments);

                const setParamsForMessages = NavigationActions.setParams({
                    params: { badgeCount: unreadMessages },
                    key: screenNames.MESSENGER,
                });
                this.props.navigation.dispatch(setParamsForMessages);

                const setParamsForMyArea = NavigationActions.setParams({
                    params: { badgeCount: unreadAdminNotificationsCount },
                    key: screenNames.MY_AREA,
                });
                this.props.navigation.dispatch(setParamsForMyArea);

                let count = unreadMessages + unreadAppointments + unreadAdminNotificationsCount;
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
        padding: marginValue
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
    }
});
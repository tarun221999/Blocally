import React, { Component } from 'react'
import { View, ImageBackground, StatusBar } from 'react-native'
import { StackActions, NavigationActions } from 'react-navigation'
import ImageComponent from '../components/ImageComponent'
import { getScreenDimensions, startStackFrom, getSelectedLanguage, alertDialog, getCircularReplacer } from '../utilities/HelperFunctions'
import colors from '../config/Colors'
import StatusBarComponent from '../components/StatusBarComponent'
import commonStyles from '../styles/Styles'
import { constants, screenNames, userTypes, notificationTypes } from '../config/Constants'
import AsyncStorageHelper from '../utilities/AsyncStorageHelper'
import strings from '../config/Strings'

/**
 * Splash Screen
 */
export default class SplashScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        getSelectedLanguage().then((selectedLanguage) => {
            strings.setLanguage(selectedLanguage)
        })
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent backgroundColor={colors.transparent} />
                <ImageBackground
                    style={[commonStyles.componentBackgroundImage, commonStyles.centerInContainer, {
                        width: this.screenDimensions.width,
                        height: this.screenDimensions.height + (Platform.OS === constants.IOS ? 0 : StatusBar.currentHeight),
                    }]}
                    source={require('../assets/splash.png')}
                    resizeMode={'cover'}>
                    <ImageComponent
                        source={require('../assets/logoForSplash.png')} />
                </ImageBackground>
            </View>
        );
    }

    componentDidMount() {
        if (Platform.OS === constants.ANDROID) {
            setTimeout(() => {
                this.moveToNextScreen();
            }, constants.SPLASH_WAIT_TIME);
        } else {
            this.moveToNextScreen();
        }
    }

    moveToNextScreen = () => {
        AsyncStorageHelper.getStringAsync(constants.IS_USER_LOGGED_IN)
            .then((isUserLoggedIn) => {
                if (isUserLoggedIn && isUserLoggedIn === 'true') {
                    AsyncStorageHelper.getStringAsync(constants.TYPE_OF_USER)
                        .then((typeOfUser) => {
                            if (typeOfUser && typeOfUser === userTypes.ENTREPRENEUR) {
                                // shoud not happen
                                if (!this.isComingFromNotification) {
                                    startStackFrom(this.props.navigation, screenNames.HOME_SCREEN)
                                }
                            } else if (typeOfUser && typeOfUser === userTypes.EMPLOYEE) {
                                startStackFrom(this.props.navigation, screenNames.EMPLOYEE_HOME_SCREEN)
                            } else {
                                // should never happen
                                alertDialog("", "Wrong type of user");
                            }
                        })
                } else {
                    startStackFrom(this.props.navigation, screenNames.LOGIN_SCREEN)
                }
            })
    }
}
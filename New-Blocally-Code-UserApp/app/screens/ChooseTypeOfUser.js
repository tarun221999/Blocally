import React, { Component } from 'react'
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native'
import { NavigationActions, StackActions } from 'react-navigation'
import commonStyles from '../styles/Styles'
import TextComponent from '../components/TextComponent'
import ButtonComponent from '../components/ButtonComponent'
import StatusBarComponent from '../components/StatusBarComponent'
import ImageComponent from '../components/ImageComponent'
import strings from '../config/strings'
import colors from '../config/colors';
import { screenNames, constants, userTypes } from '../config/constants'
import { getScreenDimensions, startStackFrom } from '../utilities/HelperFunctions'

/**
 * Choose the Type of User Screen
 */
export default class ChooseTypeOfUser extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent backgroundColor={colors.transparent} />
                <ImageComponent
                    style={[commonStyles.componentBackgroundImage, {
                        width: this.screenDimensions.width,
                        height: this.screenDimensions.height + (Platform.OS === constants.IOS ? 0 : StatusBar.currentHeight),
                    }]}
                    source={require('../assets/login.png')} />
                <View style={styles.imageContainer}>
                    <ImageComponent
                        source={require('../assets/logo.png')} />
                </View>
                <View style={[styles.contentContainer, commonStyles.centerInContainer,]}>
                    <TextComponent style={{ marginTop: -50 }}>
                        {strings.sign_in_as}
                    </TextComponent>
                    <ButtonComponent
                        style={{ marginTop: 20 }}
                        isFillRequired={true}
                        color={colors.lightPurple}
                        onPress={() => {
                            this.props.navigation.navigate(screenNames.SIGN_UP_SCREEN, {
                                TYPE_OF_USER: userTypes.USER,
                            });
                        }}>
                        {strings.user}
                    </ButtonComponent>
                    <ButtonComponent
                        style={{ marginTop: 10 }}
                        isFillRequired={true}
                        onPress={() => {
                            this.props.navigation.navigate(screenNames.SIGN_UP_SCREEN, {
                                TYPE_OF_USER: userTypes.ENTREPRENEUR,
                            });
                        }}>
                        {strings.entrepreneur}
                    </ButtonComponent>

                    <TouchableOpacity
                        onPress={() => { this.moveToHome() }}>
                        <TextComponent
                            style={{ color: colors.primaryColor, textDecorationLine: 'underline', marginTop: 45 }}>
                            {strings.go_to_home}
                        </TextComponent>
                    </TouchableOpacity>
                </View>

            </View>
        );
    }

    moveToHome = () => {
        if(this.typeOfUser === userTypes.USER) {
            startStackFrom(this.props.navigation, screenNames.USER_HOME_SCREEN)
        } else {
            // Do nothing for entrepreneur
        }
    }
}

const styles = StyleSheet.create({
    imageContainer: {
        flex: 0.2,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    contentContainer: {
        flex: 0.8,
        paddingHorizontal: 50
    }
});
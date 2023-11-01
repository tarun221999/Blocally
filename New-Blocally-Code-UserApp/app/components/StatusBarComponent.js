import React, { Component } from 'react'
import { SafeAreaView, StatusBar, Platform } from 'react-native'
import commonStyles from '../styles/Styles'
import colors from '../config/colors'
import { constants } from '../config/constants'

export default class StatusBarComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <SafeAreaView style={[commonStyles.statusBar]}>
                <StatusBar
                    translucent
                    backgroundColor={colors.black}
                    barStyle={Platform.OS === constants.ANDROID ? "light-content" : "dark-content"}
                    {...this.props} />
            </SafeAreaView>
        );
    }
}
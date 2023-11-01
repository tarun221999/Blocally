import React, { Component } from 'react'
import {
    View, StyleSheet, FlatList, TouchableWithoutFeedback,
    TouchableOpacity, ScrollView, Linking, Modal
} from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import TextComponent from '../components/TextComponent'
import HeaderComponent from '../components/HeaderComponent'
import ImageComponent from '../components/ImageComponent'
import LoaderComponent from '../components/LoaderComponent'
import ButtonComponent from '../components/ButtonComponent'
import commonStyles from '../styles/StylesUser'
import strings from '../config/Strings'
import colors from '../config/Colors'
import {
    constants, categoryTypes, urls, fontNames, sizes, itemTypes, screenNames,
    productSortBy, favoriteType, favoriteRequests,
} from '../config/Constants'
import {
    getCommonParamsForAPI, alertDialog, getScreenDimensions, getImageDimensions,
    parseTextForCard, parseDiscountApplied,
} from '../utilities/HelperFunctions'
import { WebView } from 'react-native-webview';

/**
 * Full Screen WebView Screen
 */
export default class WebViewScreen extends Component {
    constructor(props) {
        super(props)
        this.title = this.props.navigation.state.params.TITLE
        this.htmlContent = this.props.navigation.state.params.HTML_CONTENT
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <TitleBarComponent
                    title={this.title}
                    navigation={this.props.navigation} />
                <WebView
                    source={{
                        html: "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
                            + this.htmlContent
                    }}
                    style={{ flex: 1, }} />
                <View style={[commonStyles.centerInContainer, { flex: 0.2, backgroundColor: colors.greyBackgroundColor }]}>
                    <ButtonComponent
                        isFillRequired={true}
                        style={{ width: '60%' }}
                        color={colors.purpleButtonLight}
                        onPress={() => {
                            this.props.navigation.goBack(null);
                        }}>
                        {strings.done}
                    </ButtonComponent>
                </View>
            </View>
        );
    }
}
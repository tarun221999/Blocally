import React, { Component } from 'react'
import { View, TouchableOpacity, Modal, Image, StyleSheet, Dimensions, } from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import LoaderComponent from '../components/LoaderComponent'
import commonStyles from '../styles/StylesUser'
import strings from '../config/Strings'
import colors from '../config/Colors'
import { getScreenDimensions, getCommonParamsForAPI, alertDialog, } from '../utilities/HelperFunctions'
import { WebView } from 'react-native-webview';

/**
 * WebView for PDF screen
 */
export default class WebViewForPDFScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.menuImage = this.props.navigation.state.params.MENU_IMAGE
        this.title = this.props.navigation.state.params.TITLE
        this.state = {
            showModalLoader: false,
        }
    }

    render() {
        const source = {
            uri: (this.menuImage && this.menuImage.menuImage) ? this.menuImage.menuImage : "",
            cache: true
        };
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent />
                <LoaderComponent
                    isModalRequired={true}
                    shouldShow={this.state.showModalLoader} />
                <TitleBarComponent
                    title={this.title}
                    navigation={this.props.navigation}
                    style={{ zIndex: 1 }}
                />
                <View style={commonStyles.container}>
                    <WebView
                        source={source}
                        style={{ flex: 1, backgroundColor: colors.white }} />
                </View>
            </View>
        );
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}

const styles = StyleSheet.create({
    
});
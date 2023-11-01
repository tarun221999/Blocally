import React, { Component } from 'react'
import { View, TouchableOpacity, Modal, Image, StyleSheet, Dimensions, } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import ImageComponent from '../../components/ImageComponent'
import LoaderComponent from '../../components/LoaderComponent'
import commonStyles from '../../styles/Styles'
import { urls, } from '../../config/constants'
import { getScreenDimensions, getCommonParamsForAPI, alertDialog, } from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import FastImage from 'react-native-fast-image'
// import { ViewPager } from 'react-native-best-viewpager'
import ImageZoom from 'react-native-image-pan-zoom';
import strings from '../../config/strings'
import ImageViewer from 'react-native-image-zoom-viewer';
import colors from '../../config/colors'
import ZoomableImageComponent from '../../components/ZoomableImageComponent'
import Pdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';

/**
 * Web View for PDF
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

    // https://blocallyimages.s3.eu-central-1.amazonaws.com/stag/business/menu/0034e0576c6b46acb8bac0f906f22b17.pdf
    // https://blocallyimages.s3.eu-central-1.amazonaws.com/stag/business/menu/35d875766e7d435793db8c152132f19c.pdf

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
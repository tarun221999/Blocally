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

/**
 * Screen to View PDF
 */
export default class PDFViewerScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.title = this.props.navigation.state.params.TITLE
        this.state = {
            width: this.screenDimensions.width,
            height: this.screenDimensions.height,
            showModalLoader: false,
        }
    }

    render() {
        const source = {
            uri: 'https://blocallyimages.s3.eu-central-1.amazonaws.com/stag/business/menu/0034e0576c6b46acb8bac0f906f22b17.pdf',
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
                    <Pdf
                        source={source}
                        maxScale={8.0}
                        onLoadComplete={(numberOfPages, filePath) => {
                            console.log(`number of pages: ${numberOfPages}`);
                        }}
                        onPageChanged={(page, numberOfPages) => {
                            console.log(`current page: ${page}`);
                        }}
                        onError={(error) => {
                            console.log(error);
                        }}
                        onPressLink={(uri) => {
                            console.log(`Link presse: ${uri}`)
                        }}
                        style={styles.pdf} />
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
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 25,
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    }
});
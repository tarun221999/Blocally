import React, { Component } from 'react'
import { View, TouchableOpacity, Modal, Image } from 'react-native'
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

/**
 * Full Screen Image with Zoom functionality
 */
export default class FullImageScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.menuImage = this.props.navigation.state.params.MENU_IMAGE
        this.title = this.props.navigation.state.params.TITLE
        this.state = {
            width: this.screenDimensions.width,
            height: this.screenDimensions.height,
            showModalLoader: false,
        }
    }

    render() {
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
                    <ZoomableImageComponent
                        imageWidth={this.state.width}
                        imageHeight={this.state.height}
                        source={{
                            uri: this.menuImage.menuImage ? this.menuImage.menuImage : "",
                        }}
                    />
                </View>
            </View>
        );
    }

    componentDidMount() {
        if (this.menuImage && this.menuImage.menuImage) {
            this.setState({
                showModalLoader: true,
            }, () => {
                Image.getSize(this.menuImage.menuImage, (width, height) => {
                    this.setState({
                        width: width,
                        height: height,
                        showModalLoader: false
                    });
                }, (error) => {
                    this.setState({
                        showModalLoader: false
                    });
                    console.log(error);
                });
            })
        }
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}
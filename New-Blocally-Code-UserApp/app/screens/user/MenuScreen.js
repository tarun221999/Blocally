import React, { Component } from 'react'
import { View, TouchableOpacity, Modal } from 'react-native'
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
 * Menu Screen
 */
export default class MenuScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.menuImages = this.props.navigation.state.params.MENU_IMAGES
        this.title = this.props.navigation.state.params.TITLE
        this.state = {
            showModalLoader: false,
            menuArray: [],
        }
        this.currentPage = 0
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
                    {/* <ViewPager
                        style={commonStyles.container}
                        onPageSelected={(index) => {
                            this.currentPage = index.position
                        }}
                        ref={(ref) => { this.viewPager = ref }}>
                        {this.state.menuArray}
                    </ViewPager> */}
                </View>
            </View>
        );
    }

    componentDidMount() {
        if (this.menuImages && this.menuImages.length > 0) {
            const menuImagesArray = this.menuImages.map((item, key) => {
                return (
                    <View style={commonStyles.container}>
                        <ZoomableImageComponent
                            imageWidth={1754}
                            imageHeight={1239}
                            source={{
                                uri: item.menuImage ? item.menuImage : "",
                            }}
                        />
                    </View>
                )
            })
            this.setState({
                menuArray: menuImagesArray
            })
        }
    }

    showModalLoader = (shouldShow) => {
        this.setState({
            showModalLoader: shouldShow
        })
    }
}
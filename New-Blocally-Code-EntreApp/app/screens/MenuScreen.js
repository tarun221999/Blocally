import React, { Component } from 'react'
import { View, TouchableOpacity, } from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import ImageComponent from '../components/ImageComponent'
import LoaderComponent from '../components/LoaderComponent'
import commonStyles from '../styles/StylesUser'
import { urls, } from '../config/Constants'
import { getScreenDimensions, getCommonParamsForAPI, alertDialog, } from '../utilities/HelperFunctions'
import FastImage from 'react-native-fast-image'
import { ViewPager } from 'react-native-best-viewpager'
import ImageZoom from 'react-native-image-pan-zoom';
import strings from '../config/Strings'

/**
 * Product Menu screen
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
                    <ViewPager
                        style={commonStyles.container}
                        // onPageSelected={(index) => {
                        //     this.currentPage = index.position
                        // }}
                        // ref={(ref) => { this.viewPager = ref }}
                        >
                        {this.state.menuArray}
                    </ViewPager>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: '50%' }}
                        // onPress={() => {
                        //     if (this.currentPage > 0) {
                        //         this.currentPage--
                        //         this.viewPager.setPage(this.currentPage)
                        //     }
                        // }}
                        >
                        <ImageComponent
                            source={require('../assets/backArrowWhiteShadow.png')} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        // style={{ position: 'absolute', top: '50%', end: 0 }}
                        // onPress={() => {
                        //     if (this.currentPage < this.state.menuArray.length - 1) {
                        //         this.currentPage++
                        //         this.viewPager.setPage(this.currentPage)
                        //     }
                        // }}
                        >
                        <ImageComponent
                            source={require('../assets/rightArrowWhiteShadow.png')}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    componentDidMount() {
        // prepare menu images data
        if (this.menuImages && this.menuImages.length > 0) {
            const menuImagesArray = this.menuImages.map((item, key) => {
                return (
                    <View style={commonStyles.centerInContainer}
                        key={key}>
                        <ImageZoom cropWidth={this.screenDimensions.width}
                            cropHeight={this.screenDimensions.height}
                            imageWidth={this.screenDimensions.width}
                            imageHeight={this.screenDimensions.height}>
                            <FastImage
                                source={{
                                    uri: item.menuImage ? item.menuImage : "",
                                }}
                                resizeMode={FastImage.resizeMode.contain}
                                style={commonStyles.container}
                            />
                        </ImageZoom>
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
import React, { Component } from 'react'
import { View, TouchableOpacity, Modal, Image, TouchableWithoutFeedback } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import ImageComponent from '../../components/ImageComponent'
import TextComponent from '../../components/TextComponent'
import LoaderComponent from '../../components/LoaderComponent'
import commonStyles from '../../styles/Styles'
import { urls, screenNames, } from '../../config/constants'
import { getScreenDimensions, getCommonParamsForAPI, alertDialog, } from '../../utilities/HelperFunctions'
import { hitApi } from '../../api/APICall'
import FastImage from 'react-native-fast-image'
// import { ViewPager } from 'react-native-best-viewpager'
import ImageZoom from 'react-native-image-pan-zoom';
import strings from '../../config/strings'
import ImageViewer from 'react-native-image-zoom-viewer';
import colors from '../../config/colors'
import ZoomableImageComponent from '../../components/ZoomableImageComponent'
import { FlatList } from 'react-native'

/**
 * Show all menu images in list
 */
export default class ViewAllMenuImagesScreen extends Component {
    constructor(props) {
        super(props)
        this.screenDimensions = getScreenDimensions()
        this.title = this.props.navigation.state.params.TITLE

        this.state = {
            showModalLoader: false,
            menuImages: this.props.navigation.state.params.MENU_IMAGES
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
                    <FlatList
                        data={this.state.menuImages}
                        renderItem={({ item }) =>
                            <View style={commonStyles.container}>
                                <TouchableWithoutFeedback
                                    onPress={() => {
                                        this.props.navigation.navigate(screenNames.WEB_VIEW_FOR_PDF_SCREEN, {
                                            MENU_IMAGE: item,
                                            TITLE: this.title
                                        })
                                    }}>
                                    <View style={[{ height: 200, width: '100%' }, commonStyles.centerInContainer]}>
                                        <ImageComponent
                                            source={require('../../assets/placeholderLogo.png')} />
                                        <FastImage
                                            source={{
                                                uri: item.menuImage ? item.menuImage : "",
                                            }}
                                            resizeMode={FastImage.resizeMode.contain}
                                            style={{ height: '100%', width: '100%', position: 'absolute' }}
                                        />
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        ListEmptyComponent={
                            <View style={[commonStyles.container, commonStyles.centerInContainer]}>
                                <TextComponent style={{ color: colors.greyTextColor, marginTop: 20, marginStart: 12 }}>
                                    {strings.menu_not_available}
                                </TextComponent>
                            </View>
                        }
                        fallback
                        defaultSource={require('../../assets/placeholderLogo.png')}
                    />
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
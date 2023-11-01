import React, { Component } from 'react'
import { View, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native'
import StatusBarComponent from '../components/StatusBarComponent'
import TitleBarComponent from '../components/TitleBarComponent'
import TextComponent from '../components/TextComponent'
import LoaderComponent from '../components/LoaderComponent'
import ImageComponent from '../components/ImageComponent'
import commonStyles from '../styles/StylesUser'
import strings from '../config/Strings'
import colors from '../config/Colors'
import { screenNames, } from '../config/Constants'
import { getScreenDimensions, getCommonParamsForAPI, alertDialog, } from '../utilities/HelperFunctions'
import FastImage from 'react-native-fast-image'

/**
 * View listing of menu images screen
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
                                            source={require('../assets/placeholderLogo.png')} />
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
                        defaultSource={require('../assets/placeholderLogo.png')}
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
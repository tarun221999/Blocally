import React, { Component } from 'react'
import { View, TouchableOpacity, Linking } from 'react-native'
import StatusBarComponent from '../../components/StatusBarComponent'
import TitleBarComponent from '../../components/TitleBarComponent'
import TextComponent from '../../components/TextComponent'
import ImageComponent from '../../components/ImageComponent'
import commonStyles from '../../styles/Styles'
import colors from '../../config/colors'
import strings from '../../config/strings'
import { getScreenDimensions } from '../../utilities/HelperFunctions'
import { constants, sizes } from '../../config/constants'

/**
 * Contact Us Screen
 */
export default class ContactUsScreen extends Component {
    constructor(props) {
        super(props);
        this.screenDimensions = getScreenDimensions()
    }

    render() {
        return (
            <View style={commonStyles.container}>
                <StatusBarComponent backgroundColor={colors.transparent} />
                <TitleBarComponent
                    title={strings.contact_us}
                    navigation={this.props.navigation} />
                <ImageComponent
                    style={[{
                        width: this.screenDimensions.width,
                        height: this.screenDimensions.height,
                        resizeMode: 'cover'
                    }]}
                    source={require('../../assets/contactus.png')} />
                <View style={{ position: 'absolute', top: 200, width: '100%', alignItems: 'center' }}>
                    <ImageComponent
                        source={require('../../assets/logoWhite.png')} />
                    <TextComponent
                        style={{
                            color: colors.white, fontSize: sizes.xLargeTextSize, marginHorizontal: 50,
                            textAlign: 'center', marginTop: 40
                        }}>
                        {strings.in_case_of_any_queries}
                    </TextComponent>
                    <TouchableOpacity
                        onPress={() => {
                            let url = 'mailto:'+constants.CONTACT_US_EMAIL_ID
                            Linking.canOpenURL(url).then(supported => {
                                if (supported) {
                                    Linking.openURL(url)
                                } else {
                                    console.log("Cannot open URL " + url);
                                }
                            });
                        }}>
                        <TextComponent
                            style={{
                                color: colors.white, fontSize: sizes.headerTextSize,
                                textAlign: 'center', marginTop: 20, textDecorationLine: 'underline'
                            }}>
                            {constants.CONTACT_US_EMAIL_ID}
                        </TextComponent>
                    </TouchableOpacity>
                </View>

            </View>
        );
    }
}
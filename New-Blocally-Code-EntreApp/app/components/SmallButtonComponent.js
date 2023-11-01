import React, { Component } from 'react'
import { View, TouchableOpacity, } from 'react-native'
import commonStyles from '../styles/StylesUser'
import ImageComponent from './ImageComponent'
import TextComponent from './TextComponent'
import strings from '../config/Strings'

/* 
    ---- props available ----
    onPress: onPress function
    style: to specify styles
    icon: name of icon to show like, icon={require('../assets/call_icon.png')}
    iconStyle: style for icon
*/

export default class SmallButtonComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <TouchableOpacity
                {...this.props}
                style={[{
                    paddingVertical: 8, paddingStart: 20, marginStart: 'auto',zIndex:10
                }, this.props.style]}
                onPress={() => {
                    if (this.props.onPress) {
                        this.props.onPress()
                    }
                }}>
                <View style={[commonStyles.buttonBgFilled, commonStyles.cardInfoButton]}>
                    {
                        this.props.icon && <ImageComponent source={this.props.icon} style={[{ marginEnd: 5 }, this.props.iconStyle]} />
                    }
                    <TextComponent style={commonStyles.cardInfoButtonText}>
                        {this.props.children}
                    </TextComponent>
                </View>
            </TouchableOpacity>
        );
    }
}
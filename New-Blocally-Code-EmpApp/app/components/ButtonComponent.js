import React, { Component } from 'react'
import { TouchableOpacity, Text, } from 'react-native'
import commonStyles from '../styles/Styles'
import colors from '../config/Colors'
import ImageComponent from './ImageComponent'

/* 
    ---- props available ----
    isFillRequired: true/false
    color: to specify color for background and border
    icon: name of icon to show like, icon={require('../assets/call_icon.png')}
    iconStyle: style for icon
    onPress: onPress function
    fontStyle: style for text
    rightIcon: icon to show on right side
    rightIconStyle: style of above icon
*/

export default class ButtonComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <TouchableOpacity
                {...this.props}
                style={[this.props.isFillRequired ? commonStyles.buttonBgFilled : commonStyles.buttonBgOutline,
                { borderColor: this.props.color ? this.props.color : colors.primaryColor },
                { backgroundColor: this.props.isFillRequired ? this.props.color ? this.props.color : colors.primaryColor : colors.white },
                this.props.style]}
                onPress={() => {
                    if (this.props.onPress) {
                        this.props.onPress()
                    }
                }}>
                {
                    this.props.icon && <ImageComponent source={this.props.icon} style={[{ marginEnd: 10 }, this.props.iconStyle]} />
                }
                <Text
                    style={[commonStyles.buttonText,
                    { color: this.props.isFillRequired ? colors.white : colors.primaryColor },
                    this.props.fontStyle]}>
                    {this.props.children}
                </Text>
                {
                    this.props.rightIcon &&
                    <ImageComponent
                        resizeMode={'contain'}
                        source={this.props.rightIcon} style={[{ marginStart: 10 }, this.props.rightIconStyle]} />
                }
            </TouchableOpacity>
        );
    }
}
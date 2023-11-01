import React, { Component } from 'react'
import { TextInput } from 'react-native'
import commonStyles from '../styles/Styles'
import Colors from '../config/colors'

/* 
    ---- props available ----
    isBorderRequired: true/false
    getRef: accepts a callback function to send back the reference of current InputText
*/

export default class TextInputComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <TextInput
                placeholderTextColor={Colors.greyTextColor}
                underlineColorAndroid={Colors.black}
                {...this.props}
                ref={(input) => {
                    if (this.props.getRef) {
                        this.props.getRef(input)
                    }
                }}
                style={[this.props.isBorderRequired ? commonStyles.textInputBorder : commonStyles.textInput, this.props.style]}
            />
        );
    }
}
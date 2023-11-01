import React, { Component } from 'react'
import { TextInput } from 'react-native'
import commonStyles from '../styles/Styles'
import Colors from '../config/Colors'
import FloatingLabel from '../utilities/FloatingLabel'

/* 
    ---- props available ----
    getRef: accepts a callback function to send back the reference of current InputText
    all props from FloatingLabel
*/

export default class FloatingTextInputComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <FloatingLabel
                getRef={(input) => {
                    if (this.props.getRef) {
                        this.props.getRef(input)
                    }
                }}
                {...this.props}
                labelStyle={[commonStyles.floatingLabelInput, this.props.labelStyle]}
                inputStyle={[commonStyles.floatingInput, this.props.inputStyle]}
                style={[commonStyles.floatingFieldInput, this.props.style]}>
                {this.props.children}
            </FloatingLabel>
        );
    }
}
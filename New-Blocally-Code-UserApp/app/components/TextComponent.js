import React, { Component } from 'react'
import { Text } from 'react-native'
import commonStyles from '../styles/Styles'

/*
    Children for text to be shown
*/

export default class TextComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Text
                {...this.props}
                style={[commonStyles.text, this.props.style]}>
                    {this.props.children}
            </Text>
        );
    }
}
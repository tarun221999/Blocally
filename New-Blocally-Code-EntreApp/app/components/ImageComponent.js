import React, { Component } from 'react'
import { Image } from 'react-native'
import commonStyles from '../styles/Styles'

/*
    all built in props for image
*/

export default class ImageComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Image
                {...this.props}
                style={[commonStyles.image, this.props.style]} />
        );
    }
}
import React, { Component } from 'react'
import { View, ImageBackground } from 'react-native'
import TextComponent from './TextComponent'
import ImageComponent from './ImageComponent'
import commonStyles from '../styles/Styles'


/*
    props available
    - image for the source of image to be shown

    And
    - children for text to be shown
*/

export default class HeaderComponent extends Component {
    constructor(props) {
        super(props);
        this.state={
            imageHeight: 0
        }
    }

    render() {
        return (
            <View style={[commonStyles.headerBorder, this.props.style]}>
                <ImageComponent
                    onLayout={(event) => {
                        var { x, y, width, height } = event.nativeEvent.layout;
                        this.setState({
                            imageHeight: height
                        })
                    }}
                    source={this.props.image}
                    style={commonStyles.headerImage} />

                {this.props.children &&
                    <TextComponent style={[commonStyles.headerText, {top: (this.state.imageHeight/2) - 12}]}>
                        {this.props.children}
                    </TextComponent>
                }
            </View>
        );
    }
}
import React, { Component } from 'react'
import { ActivityIndicator, View, Modal } from 'react-native'
import colors from '../config/Colors'
import commonStyles from '../styles/Styles'

/*
    ---- props available ----
    shouldShow: true/false
    isModalRequired: true/false  
*/

export default class LoaderComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (this.props.isModalRequired) {
            return (
                <Modal
                    transparent={true}
                    visible={this.props.shouldShow}
                    animationType="fade">
                    <View
                        style={[commonStyles.container, commonStyles.centerInContainer, { backgroundColor: colors.blurBackground }]}>
                        <ActivityIndicator
                            animating={true}
                            color={colors.white}
                            size={"large"}
                            {...this.props}
                        />
                    </View>
                </Modal>
            );
        } else {
            return (
                <View>
                    {this.props.shouldShow &&
                        <ActivityIndicator
                            animating={true}
                            color={colors.red}
                            size={"large"}
                            {...this.props}
                        />
                    }
                </View>
            );
        }
    }
}
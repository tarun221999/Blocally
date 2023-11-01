import React, { Component } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import TextComponent from './TextComponent'
import ImageComponent from './ImageComponent'
import commonStyles from '../styles/Styles'
import { parseTextForCard } from '../utilities/HelperFunctions'
import colors from '../config/Colors';

/* 
    ---- props available ----
    title: Title text
    isHomeScreen: true/false to show/hide back button
    navigation: to make default functionality for back button
    onBackPress: back button onPress function for custom back functionality
    icon: name of icon to show like, icon={require('../assets/call_icon.png')}
    onIconPress: above icon's onPress function
    textAction: to show text on right side
    onTextActionPress: onPress for above textAction
*/

export default class TitleBarComponent extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <View style={[commonStyles.titleBar, this.props.style]}>
                {!this.props.isHomeScreen &&
                    <TouchableOpacity style={styles.backIcon}
                        onPress={() => {
                            if (this.props.onBackPress) {
                                this.props.onBackPress()
                            } else {
                                this.props.navigation.goBack(null);
                            }
                        }}>
                        <ImageComponent
                            source={require('../assets/backArrowBlack.png')}
                        />
                    </TouchableOpacity>
                }

                <TextComponent style={commonStyles.titleBarText}>
                    {parseTextForCard(this.props.title, 20)}
                </TextComponent>

                {
                    this.props.icon && <TouchableOpacity style={styles.iconAction}
                        onPress={() => {
                            if (this.props.onIconPress) {
                                this.props.onIconPress()
                            }
                        }}>
                        <ImageComponent
                            source={this.props.icon}
                        />
                    </TouchableOpacity>
                }

                {this.props.textAction &&
                    <TouchableOpacity style={{ position: 'absolute', right: 0 }}
                        onPress={() => {
                            if (this.props.onTextActionPress) {
                                this.props.onTextActionPress()
                            }
                        }}>
                        <TextComponent style={styles.textAction}>
                            {this.props.textAction}
                        </TextComponent>
                    </TouchableOpacity>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    backIcon: {
        padding: 20,
        position: 'absolute',
        left: 0
    },
    iconAction: {
        padding: 20,
        position: 'absolute',
        right: 0
    },
    textAction: {
        padding: 20,
        fontSize: 18,
        color: colors.lightPurple
    }
})